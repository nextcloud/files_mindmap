/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import MindMap from '../views/MindMap.js'

vi.mock('@nextcloud/router', () => ({
	generateUrl: (path, params = {}) => Object.entries(params).reduce(
		(acc, [k, v]) => acc.replace(`{${k}}`, v ?? ''),
		path,
	),
}))

window.customElements.define('test-mindmap-viewer', MindMap)

const file = { path: '/docs/test.km', basename: 'test.km' }

/**
 * Create the element the way the viewer does: properties and attributes
 * first, then insert it.
 *
 * @param {object} attributes attributes to set before inserting
 */
function mount(attributes = {}) {
	const element = document.createElement('test-mindmap-viewer')
	element.file = file
	Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value))
	document.body.appendChild(element)
	return element
}

describe('MindMap element', () => {
	beforeEach(() => {
		window.OCA = { FilesMindMap: { setFile: vi.fn() } }
	})

	afterEach(() => {
		document.body.replaceChildren()
		delete window.OCA
	})

	it('hands the file to FilesMindMap', () => {
		mount()
		expect(window.OCA.FilesMindMap.setFile).toHaveBeenCalledWith(file)
	})

	it('renders the editor iframe for the file', () => {
		const iframe = mount().querySelector('iframe')
		expect(iframe.getAttribute('src')).toBe('/apps/files_mindmap/?file=/docs/test.km')
	})

	it('sizes the iframe from the viewer attributes', () => {
		const element = mount({ 'max-width': '800', 'max-height': '600' })
		const iframe = element.querySelector('iframe')
		expect(iframe.style.width).toBe('800px')
		expect(iframe.style.height).toBe('600px')

		element.setAttribute('max-height', '400')
		expect(iframe.style.height).toBe('400px')
	})

	it('emits loaded once the iframe has loaded', () => {
		const element = mount()
		const loaded = vi.fn()
		element.addEventListener('loaded', loaded)

		element.querySelector('iframe').dispatchEvent(new Event('load'))
		expect(loaded).toHaveBeenCalledOnce()
	})
})
