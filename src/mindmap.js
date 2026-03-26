import { basename, extname } from 'path'
import SvgPencil from '@mdi/svg/svg/pencil.svg?raw'
import MindMapSvg from '../img/mindmap.svg?raw'

import {
	DefaultType,
	addNewFileMenuEntry,
	registerFileAction,
	File,
	Permission,
	getUniqueName
} from '@nextcloud/files'
import {
	FileAction,
	registerFileAction as legacyRegisterFileAction,
	addNewFileMenuEntry as legacyAddNewFileMenuEntry
} from '@nextcloud/files-legacy'
import { emit } from '@nextcloud/event-bus'
import axios from '@nextcloud/axios'
import { getCurrentUser } from '@nextcloud/auth'
import { dirname } from '@nextcloud/paths'
import { isPublicShare } from '@nextcloud/sharing/public'
import { translate as t } from '@nextcloud/l10n'
import { generateUrl } from '@nextcloud/router'
import { showMessage as showToast } from '@nextcloud/dialogs'


import util from './util'
import km from './plugins/km'
import freemind from './plugins/freemind'
import xmind from './plugins/xmind'

const version = Number.parseInt((window.OC?.config?.version ?? '0').split('.')[0])

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

	showMessage: function(msg, delay) {
		delay = delay || 3000;
		return showToast(msg, { timeout: delay });
	},

	hideMessage: function(toast) {
		if (toast && typeof toast.hideToast === 'function') {
			toast.hideToast();
		}
	},

	/**
	 * Determine if this page is public mindmap share page
	 * @returns {boolean}
	 */
    isMindmapPublic: function() {
		if (!isPublicShare()) {
			return false;
		}

		return this.isSupportedMime(document.getElementById('mimetype')?.value);
    },

	save: function(data, success, fail) {
		var self = this;
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
				mtime: self._file.mtime // send modification time of currently loaded file
			};

			if (document.getElementById('isPublic')?.value) {
				putObject.token = document.getElementById('sharingToken')?.value;
				url = generateUrl('/apps/files_mindmap/share/save');
				if (self.isSupportedMime(document.getElementById('mimetype')?.value)) {
					putObject.path = '';
				}
			} else {
				url = generateUrl('/apps/files_mindmap/ajax/savefile');
			}

			axios({
				method: 'PUT',
				url,
				data: putObject,
			}).then(function(response) {
				// update modification time
				try {
					self._file.mtime = response.data.mtime;
				} catch(e) {}
				success(t('files_mindmap', 'File Saved'));
			}).catch(function(error) {
				var message = t('files_mindmap', 'Save failed');
				try {
					message = error.response.data.message;
				} catch(e) {}
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
		var mimetype = document.getElementById('mimetype')?.value;
		if (document.getElementById('isPublic')?.value && this.isSupportedMime(mimetype)) {
			sharingToken = document.getElementById('sharingToken')?.value;
			url = generateUrl('/apps/files_mindmap/public/{token}', {token: sharingToken});
		} else if (document.getElementById('isPublic')?.value) {
			sharingToken = document.getElementById('sharingToken')?.value;
			url = generateUrl('/apps/files_mindmap/public/{token}?dir={dir}&filename={filename}',
				{ token: sharingToken, filename: filename, dir: dir});
		} else {
			url = generateUrl('/apps/files_mindmap/ajax/loadfile?filename={filename}&dir={dir}',
				{filename: filename, dir: dir});
		}
		axios.get(url).then(function(response) {
			var data = response.data;
			data.filecontents = util.base64Decode(data.filecontents);
			var plugin = self.getExtensionByMime(data.mime);
			if (!plugin || plugin.decode === null) {
				failure(t('files_mindmap', 'Unsupported file type: {mimetype}', {mimetype: data.mime}));
				return;
			}

			plugin.decode(data.filecontents).then(function(kmdata){
				data.filecontents = typeof kmdata === 'object' ? JSON.stringify(kmdata) : kmdata;
				data.supportedWrite = true;
				if (plugin.encode === null) {
					data.writeable = false;
					data.supportedWrite = false;
				}

				self._file.writeable = data.writeable;
				self._file.supportedWrite = data.supportedWrite;
				self._file.mime = data.mime;
				self._file.mtime = data.mtime;

				success(data.filecontents);
			}, function(e){
				failure(e);
			})
		}).catch(function(error) {
			failure(error.response?.data?.message || error.message);
		});
	},

	/**
	 * @private
	 */
	registerFileActions: function () {
		var mimes = this.getSupportedMimetypes(),
			_self = this;

		const actionConfig = {
			id: 'file_mindmap',
			displayName() {
				return t('files_mindmap', 'Edit')
			},
			iconSvgInline: () => SvgPencil,

			enabled(nodes) {
				return nodes.length === 1 && mimes.includes(nodes[0].mime) && (nodes[0].permissions & Permission.READ) !== 0
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
		}

		if (version >= 33) {
			registerFileAction(actionConfig)
		} else {
			legacyRegisterFileAction(new FileAction(actionConfig))
		}
	},

	registerNewFileMenuPlugin: function() {
		legacyAddNewFileMenuEntry({
			id: 'mindmapfile',
			displayName: t('files_mindmap', 'New mind map file'),
			...(version >= 33 ? { iconSvgInline: MindMapSvg } : { iconClass: 'icon-mindmap' }),
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
