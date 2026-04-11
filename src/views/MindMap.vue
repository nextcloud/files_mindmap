<template>
	<iframe ref="iframe"
		:src="iframeSrc"
		@load="onIFrameLoaded" />
</template>

<script>
/* global OCA */
// import { showError } from '@nextcloud/dialogs'
import { generateUrl } from '@nextcloud/router'

console.debug('MindMap Vue Loading')

export default {
	name: 'MindMap',

	computed: {
		iframeSrc() {
			console.debug('iframeSrc', this.file, this.source, this.davPath)
			return generateUrl('/apps/files_mindmap/?file={file}', {
				file: this.source ?? this.davPath,
			})
		},

		file() {
			// fileList and fileid are provided by the Mime mixin of the Viewer.
			const file = this.fileList.find((file) => file.fileid === this.fileid)
			return file
		},

		isEditable() {
			return this.file?.permissions?.indexOf('W') >= 0
		},
	},

	async mounted() {
		document.addEventListener('webviewerloaded', this.handleWebviewerloaded)
		document.addEventListener('keydown', this.handleKeydown)

		// Hide the NC Viewer's own header bar (.modal-header, position:absolute z-index:10001)
		// and its separate close button (.modal-container__close) so they don't float over
		// our iframe toolbar or intercept clicks.
		//
		// Strategy: three independent layers so NC's scoped CSS cannot override us:
		//   1. CSS <style> tag — fast first-pass; covers elements that exist now.
		//   2. el.style.setProperty('display','none','important') — inline !important
		//      beats ANY stylesheet rule, including Vue-scoped selectors like
		//      .modal-header[data-v-xxxxx] that have higher specificity than our class rule.
		//   3. MutationObserver — re-applies layer 2 if NC Vue re-renders and resets style.
		const NC_SELECTORS = '.modal-header, .modal-container__close'

		// Layer 1: stylesheet fallback (also sets pointer-events:none so clicks always
		// reach our iframe toolbar even if display is somehow restored)
		const style = document.createElement('style')
		style.id = 'files-mindmap-hide-modal-chrome'
		style.textContent = NC_SELECTORS.split(',').map(s => s.trim()).join(',')
			+ '{display:none!important;pointer-events:none!important;opacity:0!important}'
		document.head.appendChild(style)
		this._injectedStyle = style

		// Layer 2: inline !important — the only way to beat Vue-scoped !important CSS
		const hideNC = () => {
			document.querySelectorAll(NC_SELECTORS).forEach(el => {
				el.style.setProperty('display', 'none', 'important')
				el.style.setProperty('pointer-events', 'none', 'important')
			})
		}
		hideNC()

		// Layer 3: watch for NC Vue re-renders that might undo layer 2
		const obs = new MutationObserver((mutations) => {
			const affected = mutations.some(m =>
				m.target instanceof Element && (
					m.target.classList.contains('modal-header')
					|| m.target.classList.contains('modal-container__close')
				)
			)
			if (affected) hideNC()
		})
		obs.observe(document.body, { subtree: true, attributes: true, attributeFilter: ['style', 'class'] })
		this._ncObserver = obs

		console.debug('mounted file: ', this.file)
		OCA.FilesMindMap.setFile(this.file)

		this.doneLoading()
		this.$nextTick(function() {
			this.$el?.focus()
		})
	},

	beforeDestroy() {
		document.removeEventListener('webviewerloaded', this.handleWebviewerloaded)
		document.removeEventListener('keydown', this.handleKeydown)
		if (this._ncObserver) {
			this._ncObserver.disconnect()
			this._ncObserver = null
		}
		if (this._injectedStyle) {
			document.head.removeChild(this._injectedStyle)
			this._injectedStyle = null
			// Restore NC elements so other viewers still work after we close
			document.querySelectorAll('.modal-header, .modal-container__close').forEach(el => {
				el.style.removeProperty('display')
				el.style.removeProperty('pointer-events')
			})
		}
	},

	methods: {
		handleKeydown(e) {
			if ((e.ctrlKey || e.metaKey) && e.key === 's') {
				e.preventDefault()
				try {
					this.$refs.iframe?.contentWindow?.MindMap?.save()
				} catch (err) {
					console.debug('MindMap save via Ctrl+S failed:', err)
				}
			}
		},

		onIFrameLoaded() {
			console.debug('File:', this.file)

			// if (this.isEditable) {
			// this.$nextTick(() => {
			//  this.getDownloadElement().removeAttribute('hidden')
			//  this.getEditorModeButtonsElement().removeAttribute('hidden')
			// })
			// }
		},

		getIframeDocument() {
			// $refs are not reactive, so a method is used instead of a computed
			// property for clarity.
			return this.$refs.iframe.contentDocument
		},
	},
}
</script>

<style lang="scss" scoped>
iframe {
	width: 100%;
	/* The NC Viewer modal header is hidden by mounted(); fill the full modal overlay. */
	height: 100vh;
	margin-top: 0;
	position: absolute;
}
</style>
