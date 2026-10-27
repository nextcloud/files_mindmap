/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { shallowMount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import MindMap from '../views/MindMap.js'

vi.mock('@nextcloud/l10n', () => ({ getLanguage: () => 'en' }))
vi.mock('@nextcloud/router', () => ({
	generateUrl: (path, params = {}) => Object.entries(params).reduce(
		(acc, [k, v]) => acc.replace(`{${k}}`, v ?? ''),
		path,
	),
}))
vi.mock('@nextcloud/sharing/public', () => ({
	isPublicShare: vi.fn(() => false),
	getSharingToken: () => '',
}))

// Viewer mixin that supplies the props/methods the component expects
const viewerMixin = {
	data() {
		return {
			fileList: [],
			fileid: null,
			source: null,
			davPath: null,
		}
	},
	methods: {
		doneLoading() {},
	},
}

function mountMindMap(dataOverrides = {}) {
	return shallowMount(MindMap, {
		global: {
			mixins: [
				{
					...viewerMixin,
					data() {
						return { ...viewerMixin.data(), ...dataOverrides }
					},
				},
			],
		},
	})
}

/**
 * Mount into the document, so the iframe has a window to talk to.
 */
function mountAttached() {
	return shallowMount(MindMap, { attachTo: document.body, global: { mixins: [viewerMixin] } })
}

describe('MindMap', () => {
	beforeEach(() => {
		window.OCA = { FilesMindMap: { setFile: vi.fn() } }
	})

	afterEach(() => {
		delete window.OCA
	})

	it('renders an iframe element', () => {
		const wrapper = mountMindMap()
		expect(wrapper.find('iframe').exists()).toBe(true)
	})

	describe('iframeSrc computed property', () => {
		it('uses source when available', () => {
			const wrapper = mountMindMap({
				source: '/remote.php/dav/files/user/test.km',
			})
			expect(wrapper.vm.iframeSrc).toContain('/remote.php/dav/files/user/test.km')
		})

		it('falls back to davPath when source is null', () => {
			const wrapper = mountMindMap({
				source: null,
				davPath: '/dav/path/test.km',
			})
			expect(wrapper.vm.iframeSrc).toContain('/dav/path/test.km')
		})
	})

	describe('file computed property', () => {
		it('returns the file whose fileid matches the current fileid', () => {
			const file = { fileid: 7, name: 'test.km' }
			const wrapper = mountMindMap({ fileList: [file], fileid: 7 })
			expect(wrapper.vm.file).toStrictEqual(file)
		})

		it('returns undefined when no file matches', () => {
			const wrapper = mountMindMap({
				fileList: [{ fileid: 1, name: 'other.km' }],
				fileid: 99,
			})
			expect(wrapper.vm.file).toBeUndefined()
		})
	})

	describe('lifecycle hooks', () => {
		it('calls OCA.FilesMindMap.setFile on mount', () => {
			mountMindMap({
				fileList: [{ fileid: 3, name: 'test.km' }],
				fileid: 3,
			})
			expect(window.OCA.FilesMindMap.setFile).toHaveBeenCalled()
		})
	})

	describe('Ctrl+S', () => {
		it('saves the mind map instead of the browser saving the page', () => {
			const wrapper = mountAttached()
			const save = vi.fn()
			wrapper.element.contentWindow.MindMap = { save }

			const event = new KeyboardEvent('keydown', { key: 's', ctrlKey: true, cancelable: true })
			document.dispatchEvent(event)

			expect(save).toHaveBeenCalledOnce()
			expect(event.defaultPrevented).toBe(true)
			wrapper.unmount()
		})

		it('leaves other keys alone', () => {
			const wrapper = mountAttached()
			const save = vi.fn()
			wrapper.element.contentWindow.MindMap = { save }

			const event = new KeyboardEvent('keydown', { key: 's', cancelable: true })
			document.dispatchEvent(event)

			expect(save).not.toHaveBeenCalled()
			expect(event.defaultPrevented).toBe(false)
			wrapper.unmount()
		})

		it('stops handling Ctrl+S once the viewer closes', () => {
			const add = vi.spyOn(document, 'addEventListener')
			const remove = vi.spyOn(document, 'removeEventListener')
			const wrapper = mountAttached()
			const [, handler] = add.mock.calls.find(([type]) => type === 'keydown')
			wrapper.unmount()

			expect(remove).toHaveBeenCalledWith('keydown', handler)
			add.mockRestore()
			remove.mockRestore()
		})
	})
})
