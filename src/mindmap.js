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
import { generateUrl, generateRemoteUrl } from '@nextcloud/router'
import { showMessage as showToast } from '@nextcloud/dialogs'

import util from './util.js'
import km from './plugins/km.js'
import freemind from './plugins/freemind.js'
import xmind from './plugins/xmind.js'

const version = Number.parseInt((window.OC?.config?.version ?? '0').split('.')[0])

/**
 * Custom three-button confirmation dialog for the .mm → .km overwrite question.
 * window.confirm() only offers OK/Cancel whose labels cannot be translated.
 */
function confirmConvertDialog(question) {
	return new Promise(function(resolve) {
		const dlg = document.createElement('dialog')
		Object.assign(dlg.style, {
			padding: '1.5rem',
			borderRadius: '8px',
			border: '1px solid #ccc',
			maxWidth: '420px',
			boxShadow: '0 4px 24px rgba(0,0,0,.25)',
			fontFamily: 'inherit',
			lineHeight: '1.5',
		})

		const p = document.createElement('p')
		p.textContent = question
		p.style.margin = '0 0 1.2rem 0'

		function makeBtn(label, primary) {
			const b = document.createElement('button')
			b.textContent = label
			b.type = 'button'
			Object.assign(b.style, {
				padding: '6px 14px',
				borderRadius: '4px',
				border: '1px solid ' + (primary ? '#0082c9' : '#ccc'),
				cursor: 'pointer',
				fontFamily: 'inherit',
				background: primary ? '#0082c9' : '#fff',
				color: primary ? '#fff' : '#333',
				fontWeight: primary ? 'bold' : 'normal',
			})
			return b
		}

		const btnOverwrite = makeBtn(t('files_mindmap', 'Overwrite'), true)
		const btnAlt = makeBtn(t('files_mindmap', 'Choose different name'), false)
		const btnCancel = makeBtn(t('files_mindmap', 'Cancel'), false)

		const row = document.createElement('div')
		Object.assign(row.style, { display: 'flex', justifyContent: 'flex-end', gap: '8px', flexWrap: 'wrap' })
		row.append(btnCancel, btnAlt, btnOverwrite)
		dlg.append(p, row)
		document.body.appendChild(dlg)
		dlg.showModal()

		function done(result) { dlg.close(); document.body.removeChild(dlg); resolve(result) }
		btnOverwrite.addEventListener('click', function() { done('overwrite') })
		btnAlt.addEventListener('click', function() { done('alternative') })
		btnCancel.addEventListener('click', function() { done('cancel') })
		dlg.addEventListener('cancel', function() { done('cancel') }) // Escape key
	})
}

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
		if (!plugin) {
			fail(t('files_mindmap', 'Unsupported file type: {mimetype}', { mimetype: this._file.mime }))
			return
		}
		if (plugin.encode === null) {
			// Fall back: save as .km via direct WebDAV PUT
			const kmPlugin = self.getExtensionByMime('application/km')
			if (!kmPlugin || !kmPlugin.encode) {
				fail(t('files_mindmap', 'Does not support saving {extension} files.', { extension: plugin.name }))
				return
			}
			const mmName = self._file.name
			const baseName = mmName.replace(/\.[^/.]+$/, '')
			const newName = baseName + '.km'
			const uid = getCurrentUser()?.uid || ''
			const davBase = generateRemoteUrl('dav') + '/files/' + uid
			const encodedDir = (self._file.dir || '/').replace(/\/$/, '').split('/').map(encodeURIComponent).join('/')
			const newSource = davBase + encodedDir + '/' + encodeURIComponent(newName)

			kmPlugin.encode(data).then(function(kmData) {
				function doPut(url) {
					return axios({ method: 'PUT', url, data: kmData })
				}

				// Update internal state and notify user after a successful write.
				function onSaved(savedName) {
					self._file.name = savedName
					self._file.mime = 'application/km'
					self._file.mtime = null
					self._file.supportedWrite = true
					self._file.fullName = self._file.dir === '/'
						? '/' + savedName
						: self._file.dir + '/' + savedName
					showToast(
						t('files_mindmap', '"{name}" was created — your changes are saved there. The original .mm file is unchanged.', { name: savedName }),
						{ timeout: 8000 }
					)
					success(t('files_mindmap', 'Saved as {name}', { name: savedName }))
				}

				// HEAD-probe baseName (1).km, (2).km, … until a free slot is found.
				function findFreeName() {
					function probe(n) {
						const candidate = baseName + ' (' + n + ').km'
						const url = davBase + encodedDir + '/' + encodeURIComponent(candidate)
						return axios.head(url)
							.then(() => probe(n + 1))   // 200 → exists, try next
							.catch(() => candidate)     // 404 / error → free slot
					}
					return probe(1)
				}

				// "No" branch: let the user pick a different name (prompt pre-filled
				// with the first free auto-numbered candidate).
				function saveAsAlternative() {
					findFreeName().then(function(suggested) {
						const promptedBase = window.prompt(
							t('files_mindmap', 'Enter a new filename (without extension):'),
							suggested.replace(/\.km$/i, '')
						)
						if (promptedBase === null || promptedBase.trim() === '') {
							fail(t('files_mindmap', 'Conversion cancelled'))
							return
						}
						const altName = promptedBase.trim().replace(/\.km$/i, '') + '.km'
						const altSource = davBase + encodedDir + '/' + encodeURIComponent(altName)
						// HEAD-check: refuse to silently overwrite the alternative name too.
						axios.head(altSource)
							.then(function() {
								fail(t('files_mindmap',
									'"{name}" already exists. Please choose a different name.',
									{ name: altName }))
							})
							.catch(function() {
								doPut(altSource)
									.then(function() { onSaved(altName) })
									.catch(function(e) {
										fail(e.response?.data?.message || t('files_mindmap', 'Save failed'))
									})
							})
					})
				}

				// HEAD-check before PUT: never silently overwrite an existing .km file.
				axios.head(newSource)
					.then(function() {
						// File already exists — ask: overwrite, pick another name, or cancel?
						const question = t('files_mindmap',
							'"{name}" already exists. Overwrite it with the content from "{source}"?',
							{ name: newName, source: mmName })
						confirmConvertDialog(question).then(function(result) {
							if (result === 'overwrite') {
								doPut(newSource)
									.then(function() { onSaved(newName) })
									.catch(function(e) {
										fail(e.response?.data?.message || t('files_mindmap', 'Save failed'))
									})
							} else if (result === 'alternative') {
								saveAsAlternative()
							} else {
								fail(t('files_mindmap', 'Conversion cancelled'))
							}
						})
					})
					.catch(function() {
						// File does not exist — PUT directly.
						doPut(newSource)
							.then(function() { onSaved(newName) })
							.catch(function(e) {
								fail(e.response?.data?.message || t('files_mindmap', 'Save failed'))
							})
					})
			})
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
			// Fall back to extension-based mime detection for generic types (e.g. new empty files)
			if (!self.isSupportedMime(data.mime)) {
				const ext = self._file.name.split('.').pop().toLowerCase()
				const byExt = self._extensions.find(p =>
					p.mimes.some(m => m.endsWith('/' + ext) || m.endsWith('.' + ext))
					|| (p.extensions || []).includes(ext)
				)
				if (byExt) data.mime = byExt.mimes[0]
			}
			const plugin = self.getExtensionByMime(data.mime)
			if (!plugin || plugin.decode === null) {
				failure(t('files_mindmap', 'Unsupported file type: {mimetype}', { mimetype: data.mime }))
				return
			}

			plugin.decode(data.filecontents).then(function(kmdata) {
				data.filecontents = typeof kmdata === 'object' ? JSON.stringify(kmdata) : kmdata
				data.supportedWrite = true
				if (plugin.encode === null) {
					// Don't override writeable — it reflects actual file permissions.
					// Only mark format as non-writable; auto-convert to .km will handle saving.
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
					let path = node.path
					try { path = decodeURIComponent(path) } catch (e) {}
					OCA.Viewer.openWith('mindmap', { path })
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
				const fileName = getUniqueName(t('files_mindmap', 'New mind map') + '.km', contentNames)

				// Build WebDAV URL from first principles to avoid issues with context.encodedSource
				const uid = getCurrentUser()?.uid || ''
				const davBase = generateRemoteUrl('dav') + '/files/' + uid
				const encodedFolderPath = (context.path || '/').replace(/\/$/, '').split('/').map(encodeURIComponent).join('/')
				const source = davBase + encodedFolderPath + '/' + encodeURIComponent(fileName)

				console.debug('[files_mindmap] Creating new file:', source)

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
					source,
					id: fileid,
					mtime: new Date(),
					mime: 'application/km',
					owner: uid || null,
					permissions: Permission.ALL,
					root: '/files/' + uid,
					displayname: fileName, // decoded human-readable name for the file list
				})

				emit('files:node:created', file)

				// Delay openWith so the Viewer's fileList prop can update reactively
				// before the component mounts and calls setFile(). Without this delay,
				// the Viewer finds no matching file in its list and fails to open.
				let openPath = file.path
				try { openPath = decodeURIComponent(openPath) } catch (e) {}
				setTimeout(function() {
					OCA.Viewer.openWith('mindmap', { path: openPath })
				}, 500)
			},
		}

		if (version >= 33) {
			addNewFileMenuEntry(menuEntry)
		} else {
			legacyAddNewFileMenuEntry(menuEntry)
		}
	},

	setFile(file) {
		// Guard: if file is undefined (e.g. Viewer could not match the file in its list by fileid),
		// keep the existing _file state so load() can still use the data from the previous setFile call.
		if (!file) {
			console.warn('[files_mindmap] setFile called with undefined/null — retaining previous _file state')
			return
		}
		// NC 33+ Viewer provides backwards-compat file.filename (human-readable, NOT URL-encoded).
		// NC 28+ Node objects expose file.path which IS URL-encoded by @nextcloud/files.
		// Prefer file.filename when available (as in the original working implementation).
		// Fall back to file.path and decode it to avoid %20 double-encoding via generateUrl().
		// Wrap decodeURIComponent in try-catch so a malformed URI never crashes setFile().
		let filename
		const rawPath = (file.filename != null && file.filename !== '' && file.filename !== 'undefined')
			? file.filename + ''
			: (file.path ?? '') + ''
		try { filename = decodeURIComponent(rawPath) } catch (e) { filename = rawPath }

		let basename
		try { basename = decodeURIComponent(file.basename + '') } catch (e) { basename = file.basename + '' }

		this._file.name = basename
		this._file.root = '/files/' + getCurrentUser()?.uid
		this._file.dir = dirname(filename)
		this._file.fullName = filename
		this._file.mime = file.mime ?? file.mimetype ?? ''
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
