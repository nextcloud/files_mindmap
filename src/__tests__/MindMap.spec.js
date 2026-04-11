import { describe, it, expect, vi, beforeEach } from 'vitest'

import FilesMindMap from '../mindmap.js'
import { showMessage as showToast } from '@nextcloud/dialogs'
import axios from '@nextcloud/axios'

const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0))

vi.mock('@nextcloud/l10n', () => ({
	translate: (_app, text) => text,
}))

vi.mock('@nextcloud/router', () => ({
	generateUrl: (path) => `/nc${path}`,
}))

vi.mock('@nextcloud/dialogs', () => ({
	showMessage: vi.fn(() => ({ hideToast: vi.fn() })),
}))

vi.mock('@nextcloud/auth', () => ({
	getCurrentUser: vi.fn(() => ({ uid: 'testuser' })),
}))

vi.mock('@nextcloud/sharing/public', () => ({
	isPublicShare: vi.fn(() => false),
}))

vi.mock('@nextcloud/event-bus', () => ({
	emit: vi.fn(),
}))

vi.mock('@mdi/svg/svg/pencil.svg?raw', () => ({ default: '<svg/>' }))

vi.mock('@nextcloud/files-legacy', () => ({
	FileAction: vi.fn().mockImplementation(opts => opts),
	registerFileAction: vi.fn(),
	addNewFileMenuEntry: vi.fn(),
}))

vi.mock('@nextcloud/files', () => ({
	DefaultType: { HIDDEN: 'hidden' },
	FileAction: vi.fn().mockImplementation(opts => opts),
	addNewFileMenuEntry: vi.fn(),
	registerFileAction: vi.fn(),
	File: vi.fn(),
	Permission: { READ: 1, CREATE: 4, UPDATE: 2, DELETE: 8, SHARE: 16, ALL: 31 },
	getUniqueName: vi.fn(name => name),
}))

vi.mock('@nextcloud/axios', () => {
	const fn = vi.fn()
	fn.get = vi.fn()
	return { default: fn }
})

vi.mock('../plugins/km', () => ({
	default: { name: 'km', mimes: ['application/km'], encode: vi.fn(d => Promise.resolve(d)), decode: vi.fn() },
}))
vi.mock('../plugins/freemind', () => ({
	default: { name: 'freemind', mimes: ['application/x-freemind'], encode: null, decode: vi.fn() },
}))
vi.mock('../plugins/xmind', () => ({
	default: { name: 'xmind', mimes: ['application/vnd.xmind.workbook'], encode: null, decode: vi.fn() },
}))

describe('FilesMindMap', () => {
	beforeEach(() => {
		FilesMindMap._extensions = []
		FilesMindMap._file = {}
		FilesMindMap._currentContext = null
		vi.clearAllMocks()
	})

	// ─── Extension management ───────────────────────────────────────────────────

	describe('registerExtension', () => {
		it('registers a single extension object', () => {
			const ext = { name: 'test', mimes: ['application/test'] }
			FilesMindMap.registerExtension(ext)
			expect(FilesMindMap._extensions).toHaveLength(1)
			expect(FilesMindMap._extensions[0]).toBe(ext)
		})

		it('registers an array of extensions', () => {
			const ext1 = { name: 'a', mimes: ['application/a'] }
			const ext2 = { name: 'b', mimes: ['application/b'] }
			FilesMindMap.registerExtension([ext1, ext2])
			expect(FilesMindMap._extensions).toHaveLength(2)
		})
	})

	describe('getExtensionByMime', () => {
		it('returns the matching extension for a registered mime type', () => {
			const ext = { name: 'km', mimes: ['application/km'] }
			FilesMindMap.registerExtension(ext)
			expect(FilesMindMap.getExtensionByMime('application/km')).toBe(ext)
		})

		it('returns null for an unknown mime type', () => {
			expect(FilesMindMap.getExtensionByMime('application/unknown')).toBeNull()
		})

		it('returns null when no extensions are registered', () => {
			expect(FilesMindMap.getExtensionByMime('application/km')).toBeNull()
		})
	})

	describe('isSupportedMime', () => {
		it('returns true for a registered mime type', () => {
			FilesMindMap.registerExtension({ name: 'km', mimes: ['application/km'] })
			expect(FilesMindMap.isSupportedMime('application/km')).toBe(true)
		})

		it('returns false for an unregistered mime type', () => {
			expect(FilesMindMap.isSupportedMime('application/pdf')).toBe(false)
		})
	})

	describe('getSupportedMimetypes', () => {
		it('returns a flat list of all mimes from all registered extensions', () => {
			FilesMindMap.registerExtension([
				{ name: 'a', mimes: ['application/a', 'application/a2'] },
				{ name: 'b', mimes: ['application/b'] },
			])
			expect(FilesMindMap.getSupportedMimetypes()).toEqual([
				'application/a',
				'application/a2',
				'application/b',
			])
		})

		it('returns an empty array when no extensions are registered', () => {
			expect(FilesMindMap.getSupportedMimetypes()).toEqual([])
		})
	})

	// ─── Notifications ─────────────────────────────────────────────────────────

	describe('showMessage', () => {
		it('calls showToast with the message and the default 3 s timeout', () => {
			FilesMindMap.showMessage('Hello')
			expect(showToast).toHaveBeenCalledWith('Hello', { timeout: 3000 })
		})

		it('calls showToast with a custom timeout', () => {
			FilesMindMap.showMessage('Hello', 5000)
			expect(showToast).toHaveBeenCalledWith('Hello', { timeout: 5000 })
		})

		it('returns the toast object from showToast', () => {
			const mockToast = { hideToast: vi.fn() }
			showToast.mockReturnValue(mockToast)
			expect(FilesMindMap.showMessage('Hello')).toBe(mockToast)
		})
	})

	describe('hideMessage', () => {
		it('calls hideToast on the toast object', () => {
			const mockToast = { hideToast: vi.fn() }
			FilesMindMap.hideMessage(mockToast)
			expect(mockToast.hideToast).toHaveBeenCalledOnce()
		})

		it('does not throw when called with null', () => {
			expect(() => FilesMindMap.hideMessage(null)).not.toThrow()
		})

		it('does not throw when called with undefined', () => {
			expect(() => FilesMindMap.hideMessage(undefined)).not.toThrow()
		})

		it('does not throw when the toast has no hideToast method', () => {
			expect(() => FilesMindMap.hideMessage({})).not.toThrow()
		})
	})

	// ─── File state ────────────────────────────────────────────────────────────

	describe('setFile', () => {
		it('sets name, dir, and fullName from file object', () => {
			FilesMindMap.setFile({ filename: '/documents/test.km', basename: 'test.km' })
			expect(FilesMindMap._file.name).toBe('test.km')
			expect(FilesMindMap._file.dir).toBe('/documents')
			expect(FilesMindMap._file.fullName).toBe('/documents/test.km')
		})

		it('sets dir to "/" for top-level files', () => {
			FilesMindMap.setFile({ filename: '/test.km', basename: 'test.km' })
			expect(FilesMindMap._file.dir).toBe('/')
		})

		it('sets _currentContext from the resolved dir', () => {
			FilesMindMap.setFile({ filename: '/docs/sub/test.km', basename: 'test.km' })
			expect(FilesMindMap._currentContext).toEqual(expect.objectContaining({ dir: '/docs/sub' }))
		})
	})

	// ─── Public share detection ────────────────────────────────────────────────

	describe('isMindmapPublic', () => {
		it('returns false when not on a public share page', async () => {
			const { isPublicShare } = await import('@nextcloud/sharing/public')
			isPublicShare.mockReturnValue(false)
			expect(FilesMindMap.isMindmapPublic()).toBe(false)
		})

		it('returns true when on a public share page with a supported mime type', async () => {
			const { isPublicShare } = await import('@nextcloud/sharing/public')
			isPublicShare.mockReturnValue(true)
			FilesMindMap.registerExtension({ name: 'km', mimes: ['application/km'] })

			const input = document.createElement('input')
			input.id = 'mimetype'
			input.value = 'application/km'
			document.body.appendChild(input)
			try {
				expect(FilesMindMap.isMindmapPublic()).toBe(true)
			} finally {
				document.body.removeChild(input)
			}
		})

		it('returns false when on a public share page but mime type is unsupported', async () => {
			const { isPublicShare } = await import('@nextcloud/sharing/public')
			isPublicShare.mockReturnValue(true)

			const input = document.createElement('input')
			input.id = 'mimetype'
			input.value = 'application/pdf'
			document.body.appendChild(input)
			try {
				expect(FilesMindMap.isMindmapPublic()).toBe(false)
			} finally {
				document.body.removeChild(input)
			}
		})
	})

	// ─── save() ────────────────────────────────────────────────────────────────

	describe('save', () => {
		it('calls fail immediately when the extension does not support encoding', () => {
			FilesMindMap.registerExtension({
				name: 'freemind',
				mimes: ['application/x-freemind'],
				encode: null,
				decode: null,
			})
			FilesMindMap._file = { dir: '/docs', name: 'test.mm', mime: 'application/x-freemind' }

			const fail = vi.fn()
			FilesMindMap.save('data', vi.fn(), fail)
			expect(fail).toHaveBeenCalledWith(expect.stringContaining('Does not support saving'))
		})

		it('sends a PUT request to the savefile URL on the happy path', async () => {
			const ext = {
				name: 'km',
				mimes: ['application/km'],
				encode: vi.fn().mockResolvedValue('encoded-content'),
				decode: null,
			}
			FilesMindMap._extensions = [ext]
			FilesMindMap._file = { dir: '/docs', name: 'test.km', mime: 'application/km', mtime: 100 }
			axios.mockResolvedValue({ data: { mtime: 200 } })

			const success = vi.fn()
			FilesMindMap.save('input-data', success, vi.fn())
			await flushPromises()

			expect(axios).toHaveBeenCalledWith(expect.objectContaining({
				method: 'PUT',
				url: '/nc/apps/files_mindmap/ajax/savefile',
			}))
			expect(success).toHaveBeenCalledWith('File Saved')
		})

		it('updates _file.mtime from the server response', async () => {
			const ext = {
				name: 'km',
				mimes: ['application/km'],
				encode: vi.fn().mockResolvedValue('data'),
				decode: null,
			}
			FilesMindMap._extensions = [ext]
			FilesMindMap._file = { dir: '/docs', name: 'test.km', mime: 'application/km', mtime: 100 }
			axios.mockResolvedValue({ data: { mtime: 999 } })

			FilesMindMap.save('data', vi.fn(), vi.fn())
			await flushPromises()

			expect(FilesMindMap._file.mtime).toBe(999)
		})

		it('calls fail with the server error message on failure', async () => {
			const ext = {
				name: 'km',
				mimes: ['application/km'],
				encode: vi.fn().mockResolvedValue('data'),
				decode: null,
			}
			FilesMindMap._extensions = [ext]
			FilesMindMap._file = { dir: '/docs', name: 'test.km', mime: 'application/km', mtime: 100 }
			axios.mockRejectedValue({ response: { data: { message: 'Quota exceeded' } } })

			const fail = vi.fn()
			FilesMindMap.save('data', vi.fn(), fail)
			await flushPromises()

			expect(fail).toHaveBeenCalledWith('Quota exceeded')
		})

		it('calls fail with generic message when error response has no message', async () => {
			const ext = {
				name: 'km',
				mimes: ['application/km'],
				encode: vi.fn().mockResolvedValue('data'),
				decode: null,
			}
			FilesMindMap._extensions = [ext]
			FilesMindMap._file = { dir: '/docs', name: 'test.km', mime: 'application/km', mtime: 100 }
			axios.mockRejectedValue(new Error('Network error'))

			const fail = vi.fn()
			FilesMindMap.save('data', vi.fn(), fail)
			await flushPromises()

			expect(fail).toHaveBeenCalledWith('Save failed')
		})
	})

	// ─── load() ────────────────────────────────────────────────────────────────

	describe('load', () => {
		it('calls success with decoded file contents', async () => {
			const decoded = { root: { data: { text: 'Test' } } }
			const ext = {
				name: 'km',
				mimes: ['application/km'],
				encode: vi.fn(),
				decode: vi.fn().mockResolvedValue(decoded),
			}
			FilesMindMap._extensions = [ext]
			FilesMindMap._file = { dir: '/docs', name: 'test.km' }

			axios.get.mockResolvedValue({
				data: {
					filecontents: btoa('raw-content'),
					mime: 'application/km',
					writeable: true,
					mtime: 9999,
				},
			})

			const success = vi.fn()
			FilesMindMap.load(success, vi.fn())
			await flushPromises()

			expect(success).toHaveBeenCalledWith(JSON.stringify(decoded))
		})

		it('sets _file.mime and _file.mtime from the server response', async () => {
			const ext = {
				name: 'km',
				mimes: ['application/km'],
				encode: vi.fn(),
				decode: vi.fn().mockResolvedValue({}),
			}
			FilesMindMap._extensions = [ext]
			FilesMindMap._file = { dir: '/docs', name: 'test.km' }

			axios.get.mockResolvedValue({
				data: {
					filecontents: btoa('content'),
					mime: 'application/km',
					writeable: true,
					mtime: 42,
				},
			})

			FilesMindMap.load(vi.fn(), vi.fn())
			await flushPromises()

			expect(FilesMindMap._file.mime).toBe('application/km')
			expect(FilesMindMap._file.mtime).toBe(42)
		})

		it('calls failure when the HTTP request fails', async () => {
			FilesMindMap._file = { dir: '/docs', name: 'test.km' }
			axios.get.mockRejectedValue({
				response: { data: { message: 'File not found' } },
				message: 'Request failed',
			})

			const failure = vi.fn()
			FilesMindMap.load(vi.fn(), failure)
			await flushPromises()

			expect(failure).toHaveBeenCalledWith('File not found')
		})

		it('calls failure for an unsupported mime type', async () => {
			FilesMindMap._extensions = []
			FilesMindMap._file = { dir: '/docs', name: 'test.pdf' }

			axios.get.mockResolvedValue({
				data: {
					filecontents: btoa('content'),
					mime: 'application/pdf',
					writeable: true,
					mtime: 100,
				},
			})

			const failure = vi.fn()
			FilesMindMap.load(vi.fn(), failure)
			await flushPromises()

			expect(failure).toHaveBeenCalledWith(expect.stringContaining('Unsupported file type'))
		})

		it('marks supportedWrite as false for read-only extensions', async () => {
			const ext = {
				name: 'freemind',
				mimes: ['application/x-freemind'],
				encode: null,
				decode: vi.fn().mockResolvedValue('decoded'),
			}
			FilesMindMap._extensions = [ext]
			FilesMindMap._file = { dir: '/docs', name: 'test.mm' }

			axios.get.mockResolvedValue({
				data: {
					filecontents: btoa('content'),
					mime: 'application/x-freemind',
					writeable: true,
					mtime: 1,
				},
			})

			FilesMindMap.load(vi.fn(), vi.fn())
			await flushPromises()

			expect(FilesMindMap._file.supportedWrite).toBe(false)
		})
	})
})
