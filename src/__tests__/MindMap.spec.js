import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import MindMap from '../views/MindMap.vue'

vi.mock('@nextcloud/l10n', () => ({ getLanguage: () => 'en' }))
vi.mock('@nextcloud/router', () => ({
	generateUrl: (path, params = {}) =>
		Object.entries(params).reduce(
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
		handleWebviewerloaded() {},
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

describe('MindMap.vue', () => {
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

		it('removes the webviewerloaded event listener on destroy', () => {
			const spy = vi.spyOn(document, 'removeEventListener')
			const wrapper = mountMindMap()
			wrapper.unmount()
			expect(spy).toHaveBeenCalledWith('webviewerloaded', expect.anything())
			spy.mockRestore()
		})
	})
})
