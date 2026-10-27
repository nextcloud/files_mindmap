/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-FileCopyrightText: 2024 Jingtao Yan <i@actom.me>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { generateUrl } from '@nextcloud/router'

let loading

/**
 * Load the editor logic the iframe talks to through `OCA.FilesMindMap`.
 * Kept out of the init script, which runs on every page.
 */
function loadFilesMindMap() {
	loading ??= import('../mindmap.js').then(({ default: FilesMindMap }) => {
		FilesMindMap.init()
		window.OCA.FilesMindMap = FilesMindMap
		return FilesMindMap
	})
	return loading
}

/**
 * Viewer handler element rendering the mind map editor iframe.
 *
 * The viewer sets `file` as a property and the sizes as `max-height` and
 * `max-width` attributes, and waits for a `loaded` event.
 */
export default class MindMap extends HTMLElement {
	static observedAttributes = ['max-height', 'max-width']

	get file() {
		return this._file
	}

	set file(file) {
		this._file = file
	}

	/**
	 * Save the mind map on Ctrl+S while the focus is outside the editor iframe,
	 * instead of the browser saving the page.
	 *
	 * @param {KeyboardEvent} event the key event
	 */
	onKeyDown = (event) => {
		if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
			event.preventDefault()
			this.querySelector('iframe')?.contentWindow?.MindMap?.save()
		}
	}

	async connectedCallback() {
		document.addEventListener('keydown', this.onKeyDown)
		try {
			const FilesMindMap = await loadFilesMindMap()
			FilesMindMap.setFile(this.file)
		} catch (error) {
			this.dispatchEvent(new CustomEvent('errored', { detail: [error] }))
			return
		}

		const iframe = document.createElement('iframe')
		iframe.src = generateUrl('/apps/files_mindmap/?file={file}', { file: this.file.path })
		iframe.style.border = '0'
		// Inline, it would leave room for a text baseline and overflow the viewer
		iframe.style.display = 'block'
		this.replaceChildren(iframe)
		this.resize()
		// The viewer hides the element until `loaded`, and the editor lays out
		// its toolbar and nodes once on startup, so it must not boot hidden.
		this.dispatchEvent(new CustomEvent('loaded'))
	}

	disconnectedCallback() {
		document.removeEventListener('keydown', this.onKeyDown)
	}

	attributeChangedCallback() {
		this.resize()
	}

	resize() {
		const iframe = this.querySelector('iframe')
		if (iframe) {
			iframe.style.width = this.getAttribute('max-width') ? `${this.getAttribute('max-width')}px` : '100%'
			iframe.style.height = this.getAttribute('max-height') ? `${this.getAttribute('max-height')}px` : 'calc(100vh - var(--header-height))'
		}
	}
}
