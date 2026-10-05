/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-FileCopyrightText: 2018-2025 Jingtao Yan and files_mindmap contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { getCurrentUser } from '@nextcloud/auth'
import axios from '@nextcloud/axios'
import { showMessage as showToast } from '@nextcloud/dialogs'
import { translate as t } from '@nextcloud/l10n'
import { dirname } from '@nextcloud/paths'
import { generateUrl } from '@nextcloud/router'
import { getSharingToken, isPublicShare } from '@nextcloud/sharing/public'
import { getViewer } from '@nextcloud/viewer'
import logger from './logger.js'
import freemind from './plugins/freemind.js'
import km from './plugins/km.js'
import xmind from './plugins/xmind.js'
import util from './util.js'

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

	save(data, success, fail) {
		const self = this
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

			let url
			if (isPublicShare()) {
				putObject.token = getSharingToken()
				url = generateUrl('/apps/files_mindmap/share/save')
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
				} catch { // response did not contain a modification time
				}
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
		let url
		if (isPublicShare()) {
			url = generateUrl('/apps/files_mindmap/public/{token}?dir={dir}&filename={filename}', { token: getSharingToken(), filename, dir })
		} else {
			url = generateUrl('/apps/files_mindmap/ajax/loadfile?filename={filename}&dir={dir}', { filename, dir })
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

	close() {
		getViewer().close()
	},

	setFile(node) {
		this._file.name = node.basename
		this._file.root = '/files/' + getCurrentUser()?.uid
		this._file.dir = dirname(node.path)
		this._file.fullName = node.path
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
		logger.debug('Mindmap Mimetypes: ' + result.join(', '))
		return result
	},
}

export default FilesMindMap
