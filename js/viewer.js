/* global $, minder, Base64, jsPDF, angular */
/* eslint-disable @nextcloud/no-deprecations */
/**
 * Checks if the page is displayed in an iframe. If not redirect to /.
 */
function redirectIfNotDisplayedInFrame() {
	try {
		if (window.frameElement) {
			return
		}
	} catch (e) {}

	window.location.href = '/'
}
redirectIfNotDisplayedInFrame();

(function() {
	const t = function(msg) {
		return window.parent.t('files_mindmap', msg)
	}

	const lang = window.lang
				 || (document.getElementById('viewer') && document.getElementById('viewer').getAttribute('lang'))
				 || 'en'

	const MindMap = {
		_changed: false,
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
			// Use capture phase so this fires before KityMinder's handlers and before Chrome's Ctrl+S
			document.addEventListener('keydown', function(e) {
				if ((e.ctrlKey || e.metaKey) && e.key === 's') {
					e.preventDefault()
					e.stopPropagation()
					self.save()
				}
			}, true)
		},
		bindEvent() {
			const self = this
			$('#export-png').click(function() {
				self.exportPNG()
			})
			$('#export-svg').click(function() {
				self.exportSVG()
			})
			$('#export-pdf').click(function() {
				self.exportPDF()
			})
			$('#export-markdown').click(function() {
				self.exportMarkdown()
			})
			$('#export-text').click(function() {
				self.exportText()
			})
			$('#save-button').click(function() {
				self.save()
			})
		},
		close() {
			const self = this
			const doHide = function() {
				if (self._autoSaveTimer !== null) {
					clearInterval(self._autoSaveTimer)
				}
				window.parent.OCA.FilesMindMap.hide?.()

			}
			if (this._changed && window.parent.OCA.FilesMindMap._file.supportedWrite) {
				const result = window.confirm(t('The file has not been saved. Is it saved?'))
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
			$('#save-button').html(msg)
		},
		restoreSaveButtonInfo(time) {
			const self = this
			setTimeout(function() {
				self.updateSaveButtonInfo(t('Save'))
			}, time)
		},
		save(onComplete) {
			const self = this
			if (self._changed) {
				self.updateSaveButtonInfo(t('Saving...'))
				const data = JSON.stringify(minder.exportJson())
				window.parent.OCA.FilesMindMap.save(data, function(msg) {
					self.updateSaveButtonInfo(msg)
					self._changed = false
					self.restoreSaveButtonInfo(3000)
					if (undefined !== onComplete) {
						onComplete(true, msg)
					}
				}, function(msg) {
					self.updateSaveButtonInfo(msg)
					self.restoreSaveButtonInfo(3000)
					if (undefined !== onComplete) {
						onComplete(false, msg)
					}
				})
				self.restoreSaveButtonInfo(6000)
			}
		},
		startAutoSaveTimer() {
			const self = this
			if (self._autoSaveTimer != null) {
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
			const status = $('#autosave-checkbox').is(':checked')
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
			$('#autosave-checkbox').prop('checked', status)
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
									text: t('Main Topic'),
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
					} catch (e) {
						window.alert(t('This file is not a valid mind map file and may cause file '
							+ 'corruption if you continue editing.'))
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
					$('#autosave-div').hide()
				}
				/* When extension cannot write, auto-convert to .km on open */
				if (!window.parent.OCA.FilesMindMap._file.supportedWrite) {
					if (window.parent.OCA.FilesMindMap._file.writeable) {
						// Trigger save which converts to .km via WebDAV PUT
						self._changed = true
						self.save(function(status) {
							if (status) {
								// Successfully converted: show save controls
								$('#save-div').show()
							} else {
								$('#save-div').hide()
							}
						})
					} else {
						$('#save-div').hide()
					}
				}
			}, function(msg) {
				self._loadStatus = false
				window.alert(t('Load file fail!') + msg)
				window.parent.OCA.FilesMindMap.hide?.()

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

		download(url, filename) {
			const obj = document.createElement('a')
			obj.href = url
			obj.download = filename
			obj.dataset.downloadurl = url
			document.body.appendChild(obj)
			obj.click()
			document.body.removeChild(obj)
		},

		exportPNG() {
			const self = this
			minder.exportData('png').then(function(data) {
				self.download(data, 'export.png')
			}, function(data) {
				console.error('export png fail', data)
			})
		},

		exportSVG() {
			const self = this
			minder.exportData('svg').then(function(data) {
				const url = 'data:image/svg+xml;base64,' + Base64.encode(data)
				self.download(url, 'export.svg')
			}, function(data) {
				console.error('export svg fail', data)
			})
		},

		exportMarkdown() {
			const self = this
			minder.exportData('markdown').then(function(data) {
				const url = 'data:text/markdown;base64,' + Base64.encode(data)
				self.download(url, 'export.md')
			}, function(data) {
				console.error('export markdown fail', data)
			})
		},

		exportText() {
			const self = this
			minder.exportData('text').then(function(data) {
				const url = 'data:text/plain;base64,' + Base64.encode(data)
				self.download(url, 'export.txt')
			}, function(data) {
				console.error('export text fail', data)
			})
		},

		exportPDF() {
			const self = this
			minder.exportData('png').then(function(data) {
				// eslint-disable-next-line new-cap
				const pdf = new jsPDF('p', 'mm', 'a4', false)
				// pdf.addImage(data, 'png', 100, 200, 280, 210, undefined, 'none');
				pdf.addImage(data, 'PNG', 5, 10, 200, 0, undefined, 'SLOW')
				self.download(pdf.output('datauristring'), 'export.pdf')
			}, function(data) {
				console.error('export png fail', data)
			})
		},
	}

	window.MindMap = MindMap
})()

window.MindMap.init()
