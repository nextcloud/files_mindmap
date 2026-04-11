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

		// Hide the NC Viewer modal header (filename + close button strip above the iframe)
		// so the mind-map canvas can use the full viewport. We add our own close button
		// inside the iframe toolbar instead. Store the reference so we can restore it.
		this._modalHeader = document.querySelector('.modal-header')
		if (this._modalHeader) {
			this._modalHeader.style.display = 'none'
		}

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
		if (this._modalHeader) {
			this._modalHeader.style.display = ''
			this._modalHeader = null
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
