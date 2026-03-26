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
		console.debug('mounted file: ', this.file)
		OCA.FilesMindMap.setFile(this.file)

		this.doneLoading()
		this.$nextTick(function() {
			this.$el?.focus()
		})
	},

	beforeDestroy() {
		document.removeEventListener('webviewerloaded', this.handleWebviewerloaded)
	},

	methods: {
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
	height: calc(100vh - var(--header-height));
	margin-top: var(--header-height);
	position: absolute;
}
</style>
