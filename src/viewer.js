/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-FileCopyrightText: 2018-2024 Jingtao Yan and files_mindmap contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/* global minder, Base64, jsPDF, angular */
/*
 * $ here is this app's own vendored jQuery (vendor/jquery), loaded by this
 * app's own iframe template — not Nextcloud core's deprecated $/jQuery
 * global. Referenced via window.$ so eslint's @nextcloud/no-deprecated-globals
 * (which only knows about core's global) doesn't flag it.
 */
/* eslint-disable no-console */
/**
 * Checks if the page is displayed in an iframe. If not redirect to /.
 */
function redirectIfNotDisplayedInFrame() {
	try {
		if (window.frameElement) {
			return
		}
	} catch { // cross-origin frame access denied — redirect below
	}

	window.location.href = '/'
}
redirectIfNotDisplayedInFrame()

/**
 * The editor pans on the non-standard mousewheel event, ignoring it while Shift
 * is held, and zooms on it with Ctrl or Cmd once it reports more than 100.
 * Re-dispatch wheel events as mousewheel where needed, with the deltas Chrome
 * reports for a mouse notch of three lines (120):
 * - in Firefox, which has no mousewheel at all,
 * - with Shift, so that it scrolls horizontally,
 * - with Ctrl or Cmd, at least 120, so that touchpad pinches and small wheel
 *   steps zoom too; the editor zooms once per gesture, after 100 ms of quiet.
 */
function normalizeMouseWheel() {
	const nativeMouseWheel = 'onmousewheel' in window
	if (!nativeMouseWheel) {
		// kity only listens for an event an element has an on<type> property for
		Object.defineProperty(Element.prototype, 'onmousewheel', { value: null, writable: true, configurable: true })
	}
	const redispatched = new WeakSet()
	window.addEventListener(nativeMouseWheel ? 'mousewheel' : 'wheel', (event) => {
		if (redispatched.has(event)) {
			return
		}
		const zoom = event.ctrlKey || event.metaKey
		const horizontal = event.shiftKey && !zoom
		let deltaX = event.wheelDeltaX
		let deltaY = event.wheelDeltaY
		if (!nativeMouseWheel) {
			// Read deltaMode first: reading a delta first makes Firefox report pixels
			const pixelsPerUnit = [1.2, 40, 800][event.deltaMode]
			deltaX = -event.deltaX * pixelsPerUnit
			deltaY = -event.deltaY * pixelsPerUnit
		} else if (!horizontal && !(zoom && Math.abs(deltaY || deltaX) < 120)) {
			return
		}
		if (horizontal) {
			deltaX = deltaX || deltaY
			deltaY = 0
		}
		let delta = deltaY || deltaX
		if (zoom) {
			delta = Math.sign(delta) * Math.max(120, Math.abs(delta))
		}
		const mouseWheel = new WheelEvent('mousewheel', {
			bubbles: true,
			cancelable: true,
			view: window,
			screenX: event.screenX,
			screenY: event.screenY,
			clientX: event.clientX,
			clientY: event.clientY,
			ctrlKey: event.ctrlKey,
			metaKey: event.metaKey,
			altKey: event.altKey,
			shiftKey: event.shiftKey && !horizontal,
		})
		Object.defineProperties(mouseWheel, {
			wheelDelta: { value: delta },
			wheelDeltaX: { value: deltaX },
			wheelDeltaY: { value: deltaY },
		})
		redispatched.add(mouseWheel)
		event.stopImmediatePropagation()
		if (!event.target.dispatchEvent(mouseWheel)) {
			event.preventDefault()
		}
	}, { capture: true, passive: false })
}
normalizeMouseWheel();

(function() {
	const t = function(app, text, vars) {
		return window.parent.t(app, text, vars)
	}

	// The languages the editor ships translations for; it shows English for any other
	const editorLanguages = ['en', 'de', 'es', 'fr', 'it', 'zh_CN', 'zh_TW']
	const userLanguage = window.lang
		|| (document.getElementById('viewer') && document.getElementById('viewer').getAttribute('lang'))
		|| 'en'
	// Fall back from a regional or formal variant, like de_DE or es_MX, to its base language
	const lang = [userLanguage, userLanguage.split('_')[0]].find((code) => editorLanguages.includes(code)) || 'en'

	const MindMap = {
		_changed: false,
		_saving: false,
		_saveQueue: [],
		_autoSaveTimer: null,
		_clearStatusMessageTimer: null,
		_loadStatus: false,
		init() {
			const self = this
			angular.module('mindmap', ['kityminderEditor'])
				.config(function(configProvider) {
					configProvider.set('lang', lang)
				})
				.controller('MainController', function($scope) {
					$scope.initEditor = function(editor, minder) {
						window.editor = editor
						window.minder = minder

						// The editor caches each node's text size, and measures 0 for the
						// nodes of a collapsed branch, which are hidden. Measure such a node
						// again once it is shown, or its text overflows the node.
						minder.on('beforerender', function(e) {
							const node = e.node
							if (node._currentTextGroupBox && node._currentTextGroupBox.width <= 1 && node.getText()) {
								delete node._currentTextHash
							}
						})

						self.initHotkey()
						self.bindEvent()
						self.loadData()
						self.loadAutoSaveStatus()
						self.startAutoSaveTimer()
						minder.on('contentchange', function() {
							self._changed = true
						})
					}
				})

			angular.module('ui.colorpicker')
				.config(function(localizeProvider) {
					localizeProvider.setDefaultLang('en-us')
				})
		},
		initHotkey() {
			const self = this
			// Capture phase, so the editor's own key handlers cannot swallow it
			document.addEventListener('keydown', function(e) {
				if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
					e.preventDefault()
					e.stopPropagation()
					self.save()
				}
			}, true)
		},
		bindEvent() {
			const self = this
			window.$('#export-png').click(function() {
				self.exportPNG()
			})
			window.$('#export-svg').click(function() {
				self.exportSVG()
			})
			window.$('#export-pdf').click(function() {
				self.exportPDF()
			})
			window.$('#export-markdown').click(function() {
				self.exportMarkdown()
			})
			window.$('#export-text').click(function() {
				self.exportText()
			})
			window.$('#save-button').click(function() {
				self.save()
			})
		},
		close() {
			const self = this
			const doHide = function() {
				if (self._autoSaveTimer !== null) {
					clearInterval(self._autoSaveTimer)
				}
				window.parent.OCA.FilesMindMap.close()
			}
			if (this._changed && window.parent.OCA.FilesMindMap._file.supportedWrite) {
				const result = window.confirm(t('files_mindmap', 'The file has unsaved changes. Save them before closing?'))
				if (result) {
					self.save(function(status) {
						if (status) {
							doHide()
						}
					})
				} else {
					doHide()
				}
			} else {
				doHide()
			}
		},
		showMessage(msg, delay) {
			return window.parent.OCA.FilesMindMap.showMessage(msg, delay)
		},
		hideMessage(id) {
			return window.parent.OCA.FilesMindMap.hideMessage(id)
		},
		setStatusMessage(msg) {
			this.showMessage(msg)
		},
		updateSaveButtonInfo(msg) {
			window.$('#save-button').html(msg)
		},
		restoreSaveButtonInfo(time) {
			const self = this
			setTimeout(function() {
				self.updateSaveButtonInfo(t('files_mindmap', 'Save'))
			}, time)
		},
		save(onComplete) {
			const self = this
			// A second request before the first one returns would fail the server's mtime check
			if (self._saving) {
				self._saveQueue.push(onComplete)
				return
			}
			if (!self._changed) {
				if (undefined !== onComplete) {
					onComplete(true)
				}
				return
			}
			const finish = function(status, msg) {
				self._saving = false
				if (undefined !== onComplete) {
					onComplete(status, msg)
				}
				const queued = self._saveQueue.splice(0)
				const notify = function(queuedStatus, queuedMsg) {
					queued.forEach(function(callback) {
						if (undefined !== callback) {
							callback(queuedStatus, queuedMsg)
						}
					})
				}
				if (queued.length === 0) {
					return
				}
				if (status) {
					self.save(notify)
				} else {
					notify(false, msg)
				}
			}
			self._saving = true
			// Edits made while the request is out mark the map as changed again
			self._changed = false
			self.updateSaveButtonInfo(t('files_mindmap', 'Saving…'))
			const data = JSON.stringify(minder.exportJson())
			window.parent.OCA.FilesMindMap.save(data, function(msg) {
				self.updateSaveButtonInfo(msg)
				self.restoreSaveButtonInfo(3000)
				finish(true, msg)
			}, function(msg) {
				self._changed = true
				self.updateSaveButtonInfo(msg)
				self.restoreSaveButtonInfo(3000)
				finish(false, msg)
			})
			self.restoreSaveButtonInfo(6000)
		},
		startAutoSaveTimer() {
			const self = this
			if (self._autoSaveTimer !== null) {
				clearInterval(self._autoSaveTimer)
				self._autoSaveTimer = null
			}
			self._autoSaveTimer = setInterval(function() {
				if (self.getAutoSaveStatus()) {
					/* When file is readonly, autosave will stop working */
					if (window.parent.OCA.FilesMindMap._file.writeable) {
						self.save()
					}
				}
			}, 10000)
		},
		getAutoSaveStatus() {
			const status = window.$('#autosave-checkbox').is(':checked')
			if (window.localStorage) {
				localStorage.setItem('apps.files_mindmap.autosave', status)
			}
			return status
		},
		loadAutoSaveStatus() {
			let status = true
			if (window.localStorage) {
				if (localStorage.getItem('apps.files_mindmap.autosave') === 'false') {
					status = false
				}
			}
			window.$('#autosave-checkbox').prop('checked', status)
		},
		loadData() {
			const self = this
			window.parent.OCA.FilesMindMap.load(function(data) {
				let obj = {
					root:
						{
							data:
								{
									id: 'bopmq' + String(Math.floor(Math.random() * 9e15)).substr(0, 7),
									created: (new Date()).getTime(),
									text: t('files_mindmap', 'Main Topic'),
								},
							children: [],
						},
					template: 'default',
					theme: 'fresh-blue',
					version: '1.4.43',
				}
				/* 新生成的空文件 */
				if (data !== ' ') {
					try {
						obj = JSON.parse(data)
					} catch {
						window.alert(t('files_mindmap', 'This file is not a valid mind map file and may cause file corruption if you continue editing.'))
					}
				}
				minder.importJson(obj)
				if (data === ' ') {
					self._changed = true
					self.save()
				}
				self._loadStatus = true
				self._changed = false

				/* When file is readonly, hide autosave checkbox */
				if (!window.parent.OCA.FilesMindMap._file.writeable) {
					window.$('#autosave-div').hide()
				}
				/* When extension cannot write, hide save checkbox */
				if (!window.parent.OCA.FilesMindMap._file.supportedWrite) {
					window.$('#save-div').hide()
				}
			}, function(msg) {
				self._loadStatus = false
				window.alert(t('files_mindmap', 'Could not load the file: {error}', { error: msg }))
				window.parent.OCA.FilesMindMap.close()
			})
		},
		isDataSchema(url) {
			let i = 0
			const ii = url.length
			while (i < ii && url[i].trim() === '') {
				i++
			}
			return url.substr(i, 5).toLowerCase() === 'data:'
		},

		download(url, extension) {
			// Name the export after the mind map, e.g. notes.km becomes notes.png
			const base = (window.parent.OCA.FilesMindMap._file.displayName || '').replace(/\.[^.]+$/, '') || 'export'
			const obj = document.createElement('a')
			obj.href = url
			obj.download = base + '.' + extension
			obj.dataset.downloadurl = url
			document.body.appendChild(obj)
			obj.click()
			document.body.removeChild(obj)
		},

		exportPNG() {
			const self = this
			minder.exportData('png').then(function(data) {
				self.download(data, 'png')
			}, function(data) {
				console.error('export png fail', data)
			})
		},

		exportSVG() {
			const self = this
			minder.exportData('svg').then(function(data) {
				const url = 'data:image/svg+xml;base64,' + Base64.encode(data)
				self.download(url, 'svg')
			}, function(data) {
				console.error('export svg fail', data)
			})
		},

		exportMarkdown() {
			const self = this
			minder.exportData('markdown').then(function(data) {
				const url = 'data:text/markdown;base64,' + Base64.encode(data)
				self.download(url, 'md')
			}, function(data) {
				console.error('export markdown fail', data)
			})
		},

		exportText() {
			const self = this
			minder.exportData('text').then(function(data) {
				const url = 'data:text/plain;base64,' + Base64.encode(data)
				self.download(url, 'txt')
			}, function(data) {
				console.error('export text fail', data)
			})
		},

		exportPDF() {
			const self = this
			minder.exportData('png').then(function(data) {
				const pdf = new jsPDF('p', 'mm', 'a4', false)
				// pdf.addImage(data, 'png', 100, 200, 280, 210, undefined, 'none');
				pdf.addImage(data, 'PNG', 5, 10, 200, 0, undefined, 'SLOW')
				self.download(pdf.output('datauristring'), 'pdf')
			}, function(data) {
				console.error('export png fail', data)
			})
		},
	}

	window.MindMap = MindMap
})()

window.MindMap.init()
