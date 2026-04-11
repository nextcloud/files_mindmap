import { describe, it, expect } from 'vitest'
import freemind from '../../plugins/freemind.js'

describe('freemind plugin', () => {
	it('has the correct name', () => {
		expect(freemind.name).toBe('freemind')
	})

	it('supports application/x-freemind mime type', () => {
		expect(freemind.mimes).toContain('application/x-freemind')
	})

	it('encode is null (read-only format)', () => {
		expect(freemind.encode).toBeNull()
	})

	describe('markerMap', () => {
		it('maps full-1 to priority 1', () => {
			expect(freemind.markerMap['full-1']).toEqual(['priority', 1])
		})

		it('maps full-8 to priority 8', () => {
			expect(freemind.markerMap['full-8']).toEqual(['priority', 8])
		})
	})

	describe('processTopic', () => {
		it('extracts TEXT as data.text', () => {
			const obj = {}
			freemind.processTopic({ TEXT: 'Hello' }, obj)
			expect(obj.data.text).toBe('Hello')
		})

		it('extracts hyperlink from LINK attribute', () => {
			const obj = {}
			freemind.processTopic({ TEXT: 'Link', LINK: 'https://example.com' }, obj)
			expect(obj.data.hyperlink).toBe('https://example.com')
		})

		it('extracts a single priority marker', () => {
			const obj = {}
			freemind.processTopic({ TEXT: 'Prio', icon: { BUILTIN: 'full-3' } }, obj)
			expect(obj.data.priority).toBe(3)
		})

		it('extracts multiple markers from an array', () => {
			const obj = {}
			freemind.processTopic({
				TEXT: 'Multi',
				icon: [{ BUILTIN: 'full-1' }, { BUILTIN: 'full-2' }],
			}, obj)
			expect(obj.data.priority).toBe(2) // last one wins
		})

		it('ignores unknown marker values', () => {
			const obj = {}
			freemind.processTopic({ TEXT: 'Unknown', icon: { BUILTIN: 'unknown-marker' } }, obj)
			expect(obj.data.priority).toBeUndefined()
		})

		it('processes a single child node', () => {
			const obj = {}
			freemind.processTopic({ TEXT: 'Parent', node: { TEXT: 'Child' } }, obj)
			expect(obj.children).toHaveLength(1)
			expect(obj.children[0].data.text).toBe('Child')
		})

		it('processes multiple child nodes', () => {
			const obj = {}
			freemind.processTopic({
				TEXT: 'Parent',
				node: [{ TEXT: 'Child1' }, { TEXT: 'Child2' }],
			}, obj)
			expect(obj.children).toHaveLength(2)
			expect(obj.children[0].data.text).toBe('Child1')
			expect(obj.children[1].data.text).toBe('Child2')
		})

		it('produces no children property when topic has no children', () => {
			const obj = {}
			freemind.processTopic({ TEXT: 'Leaf' }, obj)
			expect(obj.children).toBeUndefined()
		})
	})

	describe('decode', () => {
		it('decodes a FreeMind XML string into a km-compatible tree', async () => {
			const xml = '<map version="1.0.1"><node TEXT="Root"><node TEXT="Child"/></node></map>'
			const result = await freemind.decode(xml)
			expect(result.data.text).toBe('Root')
			expect(result.children).toHaveLength(1)
			expect(result.children[0].data.text).toBe('Child')
		})

		it('rejects on malformed input', async () => {
			await expect(freemind.decode(null)).rejects.toBeDefined()
		})
	})
})
