/* global OCA */
// eslint-disable-next-line import/no-unresolved
import SvgPencil from '@mdi/svg/svg/pencil.svg?raw'
// eslint-disable-next-line import/no-unresolved
import MindMapSvg from '../img/mindmap.svg?raw'

import {
	DefaultType,
	registerFileAction,
	addNewFileMenuEntry,
	File,
	Permission,
	getUniqueName,
} from '@nextcloud/files'
import {
	FileAction,
	registerFileAction as legacyRegisterFileAction,
	addNewFileMenuEntry as legacyAddNewFileMenuEntry,
} from '@nextcloud/files-legacy'
import { emit } from '@nextcloud/event-bus'
import axios from '@nextcloud/axios'
import { getCurrentUser } from '@nextcloud/auth'
import { dirname } from '@nextcloud/paths'
import { isPublicShare } from '@nextcloud/sharing/public'
import { translate as t } from '@nextcloud/l10n'
import { generateUrl } from '@nextcloud/router'
import { showMessage as showToast } from '@nextcloud/dialogs'

import util from './util.js'
import km from './plugins/km.js'
import freemind from './plugins/freemind.js'
import xmind from './plugins/xmind.js'

const version = Number.parseInt((window.OC?.config?.version ?? '0').split('.')[0])

const FilesMindMap = {
	_currentContext: null,
	_file: {},
	_lastTitle: '',
	_extensions: [],
	init() {
		this.registerExtension([km, freemind, xmind])
	},

	registerExtension(objs) {
		const self = this
		if (!Array.isArray(objs)) {
			objs = [objs]
		}
		objs.forEach(function(obj) {
			self._extensions.push(obj)
		})
	},

	getExtensionByMime(mime) {
		for (let i = 0; i < this._extensions.length; i++) {
			const obj = this._extensions[i]
			if (obj.mimes.indexOf(mime) >= 0) {
				return obj
			}
		}
		return null
	},

	isSupportedMime(mime) {
		return this.getExtensionByMime(mime) !== null
	},

	showMessage(msg, delay) {
		delay = delay || 3000
		return showToast(msg, { timeout: delay })
	},

	hideMessage(toast) {
		if (toast && typeof toast.hideToast === 'function') {
			toast.hideToast()
		}
	},

	/**
	 * Determine if this page is public mindmap share page
	 * @return {boolean}
	 */
	isMindmapPublic() {
		if (!isPublicShare()) {
			return false
		}

		return this.isSupportedMime(document.getElementById('mimetype')?.value)
	},

	save(data, success, fail) {
		const self = this
		let url = ''
		let path = this._file.dir + '/' + this._file.name
		if (this._file.dir === '/') {
			path = '/' + this._file.name
		}

		/* 当encode方法没实现的时候无法保存 */
		const plugin = this.getExtensionByMime(this._file.mime)
		if (plugin.encode === null) {
			fail(t('files_mindmap', 'Does not support saving {extension} files.', { extension: plugin.name }))
			return
		}

		plugin.encode(data).then(function(data2) {
			const putObject = {
				filecontents: data2,
				path,
				mtime: self._file.mtime, // send modification time of currently loaded file
			}

			if (document.getElementById('isPublic')?.value) {
				putObject.token = document.getElementById('sharingToken')?.value
				url = generateUrl('/apps/files_mindmap/share/save')
				if (self.isSupportedMime(document.getElementById('mimetype')?.value)) {
					putObject.path = ''
				}
			} else {
				url = generateUrl('/apps/files_mindmap/ajax/savefile')
			}

			axios({
				method: 'PUT',
				url,
				data: putObject,
			}).then(function(response) {
				// update modification time
				try {
					self._file.mtime = response.data.mtime
				} catch (e) {}
				success(t('files_mindmap', 'File Saved'))
			}).catch(function(error) {
				const message = error.response?.data?.message || t('files_mindmap', 'Save failed')
				fail(message)
			})
		})
	},

	load(success, failure) {
		const self = this
		const filename = this._file.name
		const dir = this._file.dir
		let url = ''
		let sharingToken = ''
		const mimetype = document.getElementById('mimetype')?.value
		if (document.getElementById('isPublic')?.value && this.isSupportedMime(mimetype)) {
			sharingToken = document.getElementById('sharingToken')?.value
			url = generateUrl('/apps/files_mindmap/public/{token}', { token: sharingToken })
		} else if (document.getElementById('isPublic')?.value) {
			sharingToken = document.getElementById('sharingToken')?.value
			url = generateUrl('/apps/files_mindmap/public/{token}?dir={dir}&filename={filename}',
				{ token: sharingToken, filename, dir })
		} else {
			url = generateUrl('/apps/files_mindmap/ajax/loadfile?filename={filename}&dir={dir}',
				{ filename, dir })
		}
		axios.get(url).then(function(response) {
			const data = response.data
			data.filecontents = util.base64Decode(data.filecontents)
			const plugin = self.getExtensionByMime(data.mime)
			if (!plugin || plugin.decode === null) {
				failure(t('files_mindmap', 'Unsupported file type: {mimetype}', { mimetype: data.mime }))
				return
			}

			plugin.decode(data.filecontents).then(function(kmdata) {
				data.filecontents = typeof kmdata === 'object' ? JSON.stringify(kmdata) : kmdata
				data.supportedWrite = true
				if (plugin.encode === null) {
					data.writeable = false
					data.supportedWrite = false
				}

				self._file.writeable = data.writeable
				self._file.supportedWrite = data.supportedWrite
				self._file.mime = data.mime
				self._file.mtime = data.mtime

				success(data.filecontents)
			}, function(e) {
				failure(e)
			})
		}).catch(function(error) {
			failure(error.response?.data?.message || error.message)
		})
	},

	/**
	 * @private
	 */
	registerFileActions() {
		const mimes = this.getSupportedMimetypes()
		const _self = this

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
					OCA.Viewer.openWith('mindmap', { path: node.path })
					return true
				} catch (error) {
					_self.showMessage(error)
					return false
				}
			},

			default: DefaultType.DEFAULT,
		}

		if (version >= 33) {
			registerFileAction(actionConfig)
		} else {
			legacyRegisterFileAction(new FileAction(actionConfig))
		}
	},

	registerNewFileMenuPlugin() {
		const menuEntry = {
			id: 'mindmapfile',
			displayName: t('files_mindmap', 'New mind map file'),
			...(version >= 33 ? { iconSvgInline: MindMapSvg } : { iconClass: 'icon-mindmap' }),
			enabled(context) {
				// only attach to main file list, public view is not supported yet
				return (context.permissions & Permission.CREATE) !== 0
			},
			async handler(context, content) {
				const contentNames = content.map((node) => node.basename)
				const fileName = getUniqueName(t('files_mindmap', 'New mind map.km'), contentNames)
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

				emit('files:node:created', file)

				OCA.Viewer.openWith('mindmap', { path: file.path })
			},
		}

		if (version >= 33) {
			addNewFileMenuEntry(menuEntry)
		} else {
			legacyAddNewFileMenuEntry(menuEntry)
		}
	},

	setFile(file) {
		// NC 28+ Viewer passes Node objects (file.path) instead of old FileInfo (file.filename)
		const filename = (file.path ?? file.filename) + ''
		const basename = file.basename + ''

		this._file.name = basename
		this._file.root = '/files/' + getCurrentUser()?.uid
		this._file.dir = dirname(filename)
		this._file.fullName = filename
		this._currentContext = {
			dir: this._file.dir,
			root: this._file.root,
		}
	},

	getSupportedMimetypes() {
		let result = []
		this._extensions.forEach(function(obj) {
			result = result.concat(obj.mimes)
		})
		console.debug('Mindmap Mimetypes:', result)
		return result
	},
}

export default FilesMindMap
