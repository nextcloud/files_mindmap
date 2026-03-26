<template>
	<iframe ref="iframe"
	:src="iframeSrc"
	@load="onIFrameLoaded" ></iframe>
</template>

<script>
//import { showError } from '@nextcloud/dialogs'
import { getLanguage } from '@nextcloud/l10n'
import { generateUrl } from '@nextcloud/router'
import { getSharingToken, isPublicShare } from '@nextcloud/sharing/public'

const IS_PUBLIC = isPublicShare();

console.debug('MindMap Vue Loading');

export default {
	name: 'MindMap',

    computed: {
		iframeSrc() {
			console.log('iframeSrc', this.file, this.source, this.davPath);
			return generateUrl('/apps/files_mindmap/?file={file}', {
				file: this.source ?? this.davPath,
			})
		},

		file() {
			// fileList and fileid are provided by the Mime mixin of the Viewer.
			let file = this.fileList.find((file) => file.fileid === this.fileid);
			return file;
		},

		isEditable() {
			return this.file?.permissions?.indexOf('W') >= 0
		},
	},

    async mounted() {
		document.addEventListener('webviewerloaded', this.handleWebviewerloaded)
		console.log('mounted file: ', this.file);
		OCA.FilesMindMap.setFile(this.file);

		this.doneLoading();
		this.$nextTick(function() {
			this.$el?.focus()
		})
	},

    beforeDestroy() {
		document.removeEventListener('webviewerloaded', this.handleWebviewerloaded)
	},

    beforeUnmount() {
		document.removeEventListener('webviewerloaded', this.handleWebviewerloaded)
	},

	methods: {
		onIFrameLoaded() {
            console.log('File:', this.file);
			let athis = this;

			// if (this.isEditable) {
				// this.$nextTick(() => {
				// 	athis.getDownloadElement().removeAttribute('hidden')
				// 	athis.getEditorModeButtonsElement().removeAttribute('hidden')
				// })
			// }
		},

		getIframeDocument() {
			// $refs are not reactive, so a method is used instead of a computed
			// property for clarity.
			return this.$refs.iframe.contentDocument
		}
	}
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