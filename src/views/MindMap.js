/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-FileCopyrightText: 2024 Jingtao Yan <i@actom.me>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { generateUrl } from '@nextcloud/router'

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

	connectedCallback() {
		OCA.FilesMindMap.setFile(this.file)

		const iframe = document.createElement('iframe')
		iframe.src = generateUrl('/apps/files_mindmap/?file={file}', { file: this.file.path })
		iframe.style.border = '0'
		iframe.addEventListener('load', () => this.dispatchEvent(new CustomEvent('loaded')))
		this.replaceChildren(iframe)
		this.resize()
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
