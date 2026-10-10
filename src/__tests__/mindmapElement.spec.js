/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MIMES } from '../constants.js'
import FilesMindMap from '../mindmap.js'
import MindMap from '../views/MindMap.js'

vi.mock('@nextcloud/router', () => ({
	generateUrl: (path, params = {}) => Object.entries(params).reduce(
		(acc, [k, v]) => acc.replace(`{${k}}`, v ?? ''),
		path,
	),
}))

vi.mock('../mindmap.js', () => ({
	default: { init: vi.fn(), setFile: vi.fn() },
}))

window.customElements.define('test-mindmap-viewer', MindMap)

const file = { path: '/docs/test.km', basename: 'test.km' }

/**
 * Create the element the way the viewer does, properties and attributes
 * first, then insert it, and wait for the iframe.
 *
 * @param {object} attributes attributes to set before inserting
 */
async function mount(attributes = {}) {
	const element = document.createElement('test-mindmap-viewer')
	element.file = file
	Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value))
	document.body.appendChild(element)
	await vi.waitFor(() => expect(element.querySelector('iframe')).not.toBeNull())
	return element
}

describe('MindMap element', () => {
	beforeEach(() => {
		window.OCA = {}
	})

	afterEach(() => {
		document.body.replaceChildren()
		delete window.OCA
	})

	it('loads FilesMindMap once and hands it the file', async () => {
		await mount()
		await mount()
		expect(FilesMindMap.init).toHaveBeenCalledOnce()
		expect(FilesMindMap.setFile).toHaveBeenCalledWith(file)
		expect(window.OCA.FilesMindMap).toBe(FilesMindMap)
	})

	it('renders the editor iframe for the file', async () => {
		const iframe = (await mount()).querySelector('iframe')
		expect(iframe.getAttribute('src')).toBe('/apps/files_mindmap/?file=/docs/test.km')
	})

	it('sizes the iframe from the viewer attributes', async () => {
		const element = await mount({ 'max-width': '800', 'max-height': '600' })
		const iframe = element.querySelector('iframe')
		expect(iframe.style.width).toBe('800px')
		expect(iframe.style.height).toBe('600px')

		element.setAttribute('max-height', '400')
		expect(iframe.style.height).toBe('400px')
	})

	it('emits loaded once the iframe has loaded', async () => {
		const element = await mount()
		const loaded = vi.fn()
		element.addEventListener('loaded', loaded)

		element.querySelector('iframe').dispatchEvent(new Event('load'))
		expect(loaded).toHaveBeenCalledOnce()
	})
})

describe('MIMES', () => {
	it('matches the mimetypes of the plugins', async () => {
		const plugins = await Promise.all(['km', 'freemind', 'xmind'].map((name) => import(`../plugins/${name}.js`)))
		expect(MIMES).toEqual(plugins.flatMap(({ default: plugin }) => plugin.mimes))
	})
})
