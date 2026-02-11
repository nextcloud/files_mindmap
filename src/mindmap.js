import { basename, extname } from 'path'
import SvgPencil from '@mdi/svg/svg/pencil.svg?raw'

import {
	DefaultType,
	FileAction,
	addNewFileMenuEntry,
	registerFileAction,
	File,
	Permission,
	getUniqueName
} from '@nextcloud/files'
import { emit } from '@nextcloud/event-bus'
import axios from '@nextcloud/axios'
import { getCurrentUser } from '@nextcloud/auth'
import { dirname } from '@nextcloud/paths'
import { isPublicShare } from '@nextcloud/sharing/public'


import util from './util'
import km from './plugins/km'
import freemind from './plugins/freemind'
import xmind from './plugins/xmind'

var FilesMindMap = {
	_currentContext: null,
	_file: {},
	_lastTitle: '',
	_extensions: [],
	init: function() {
		this.registerExtension([km, freemind, xmind]);
	},

	registerExtension: function(objs) {
		var self = this;
		if (!Array.isArray(objs)) {
			objs = [objs];
		}
		objs.forEach(function(obj){
			self._extensions.push(obj);
		});
	},

	getExtensionByMime: function(mime) {
		for (var i = 0; i < this._extensions.length; i++) {
			var obj = this._extensions[i];
			if (obj.mimes.indexOf(mime) >= 0) {
				return obj;
			}
		}
		return null;
	},

	isSupportedMime: function(mime) {
		return this.getExtensionByMime(mime) !== null ? true : false;
	},

	showMessage: function(msg, delay, t) {
		var self = this;
		delay = delay || 3000;
		var id = OC.Notification.show(msg, t);
		setTimeout(function(){
			self.hideMessage(id);
		}, delay);
		return id;
	},

	hideMessage: function(id, t) {
		OC.Notification.hide(id, t);
	},

	/**
	 * Determine if this page is public mindmap share page
	 * @returns {boolean}
	 */
    isMindmapPublic: function() {
		if (!isPublicShare()) {
			return false;
		}

		return this.isSupportedMime($('#mimetype').val());
    },

	save: function(data, success, fail) {
		var url = '';
		var path = this._file.dir + '/' + this._file.name;
		if (this._file.dir === '/') {
			path = '/' + this._file.name;
		}

		/* 当encode方法没实现的时候无法保存 */
		var plugin = this.getExtensionByMime(this._file.mime);
		if (plugin.encode === null) {
			fail(t('files_mindmap', 'Does not support saving {extension} files.', {extension: plugin.name}));
			return;
		}

		plugin.encode(data).then(function(data2) {
			var putObject = {
				filecontents: data2,
				path: path,
				mtime: OCA.FilesMindMap._file.mtime // send modification time of currently loaded file
			};

			if ($('#isPublic').val()){
				putObject.token = $('#sharingToken').val();
				url = OC.generateUrl('/apps/files_mindmap/share/save');
				if (OCA.FilesMindMap.isSupportedMime($('#mimetype').val())) {
					putObject.path = '';
				}
			} else {
				url = OC.generateUrl('/apps/files_mindmap/ajax/savefile');
			}


			$.ajax({
				type: 'PUT',
				url: url,
				data: putObject
			}).done(function(data){
				// update modification time
				try {
					OCA.FilesMindMap._file.mtime = data.mtime;
				} catch(e) {}
				success(t('files_mindmap', 'File Saved'));
			}).fail(function(jqXHR){
				var message = t('files_mindmap', 'Save failed');
				try{
					message = JSON.parse(jqXHR.responseText).message;
				}catch(e){}
				fail(message);
			});
		});
	},

	load: function(success, failure) {
		var self = this;
		var filename = this._file.name;
		var dir = this._file.dir;
		var url = '';
		var sharingToken = '';
		var mimetype = $('#mimetype').val();
		if ($('#isPublic').val() && this.isSupportedMime(mimetype)) {
			sharingToken = $('#sharingToken').val();
			url = OC.generateUrl('/apps/files_mindmap/public/{token}', {token: sharingToken});
		} else if ($('#isPublic').val()) {
			sharingToken = $('#sharingToken').val();
			url = OC.generateUrl('/apps/files_mindmap/public/{token}?dir={dir}&filename={filename}',
                { token: sharingToken, filename: filename, dir: dir});
		} else {
			url = OC.generateUrl('/apps/files_mindmap/ajax/loadfile?filename={filename}&dir={dir}',
                {filename: filename, dir: dir});
		}
		$.get(url).done(function(data) {
			data.filecontents = util.base64Decode(data.filecontents);
			var plugin = self.getExtensionByMime(data.mime);
			if (!plugin || plugin.decode === null) {
				fail(t('files_mindmap', 'Unsupported file type: {mimetype}', {mimetype: data.mime}));
			}

			plugin.decode(data.filecontents).then(function(kmdata){
				data.filecontents = typeof kmdata === 'object' ? JSON.stringify(kmdata) : kmdata;
				data.supportedWrite = true;
				if (plugin.encode === null) {
					data.writeable = false;
					data.supportedWrite = false;
				}

				OCA.FilesMindMap._file.writeable = data.writeable;
				OCA.FilesMindMap._file.supportedWrite = data.supportedWrite;
				OCA.FilesMindMap._file.mime = data.mime;
				OCA.FilesMindMap._file.mtime = data.mtime;

				success(data.filecontents);
			}, function(e){
				failure(e);
			})
		}).fail(function(jqXHR) {
			failure(JSON.parse(jqXHR.responseText).message);
		});
	},

	/**
	 * @private
	 */
	registerFileActions: function () {
		var mimes = this.getSupportedMimetypes(),
			_self = this;

		registerFileAction(new FileAction({
			id: 'file_mindmap',
			displayName() {
				return t('files_mindmap', 'Edit')
			},
			iconSvgInline: () => SvgPencil,

			enabled(nodes) {
				return nodes.length === 1 && mimes.includes(nodes[0].mime) && (nodes[0].permissions & OC.PERMISSION_READ) !== 0
			},

			async exec(node, view) {
				try {
					OCA.Viewer.openWith('mindmap', { path: node.path });
					return true
				} catch (error) {
					_self.showMessage(error)
					return false
				}
			},

			default: DefaultType.HIDDEN,
		}))
	},

	registerNewFileMenuPlugin: function() {
		addNewFileMenuEntry({
			id: 'mindmapfile',
			displayName: t('files_mindmap', 'New mind map file'),
			iconClass: 'icon-mindmap',
			enabled(context) {
				// only attach to main file list, public view is not supported yet
				console.log('addNewFileMenuEntry', context);
				return (context.permissions & Permission.CREATE) !== 0;
			},
			async handler(context, content) {
				const contentNames = content.map((node) => node.basename)
				const fileName = getUniqueName(t('files_mindmap', "New mind map.km"), contentNames)
				const source = context.encodedSource + '/' + encodeURIComponent(fileName)

				const response = await axios({
					method: 'PUT',
					url: source,
					headers: {
						Overwrite: 'F',
					},
					data: ' ',
				})

				const fileid = parseInt(response.headers['oc-fileid'])
				const file = new File({
					source: context.source + '/' + fileName,
					id: fileid,
					mtime: new Date(),
					mime: 'application/km',
					owner: getCurrentUser()?.uid || null,
					permissions: Permission.ALL,
					root: context?.root || '/files/' + getCurrentUser()?.uid,
				})

				// FilesMindMap.showMessage(t('files_mindmap', 'Created "{name}"', { name: fileName }))

				emit('files:node:created', file)

				OCA.Viewer.openWith('mindmap', { path: file.path });
			},
		});
	},

	setFile: function(file) {
		let filename = file.filename + '';
		let basename = file.basename + '';

		this._file.name = basename;
		this._file.root = '/files/' + getCurrentUser()?.uid;
		this._file.dir = dirname(filename);
		this._file.fullName = filename;
		this._currentContext = {
			dir: this._file.dir,
			root: this._file.root
		}
	},

	getSupportedMimetypes: function() {
		var result = [];
		this._extensions.forEach(function(obj){
			result = result.concat(obj.mimes);
		});
		console.debug('Mindmap Mimetypes:', result);
		return result;
	},
};

export default FilesMindMap;
