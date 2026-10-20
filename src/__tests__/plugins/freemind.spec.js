/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { describe, expect, it } from 'vitest'
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
			expect(obj.data.text).toBe('Unknown')
		})

		it('shows other icons as emoji before the text, or as the text of an icon-only node', () => {
			const withText = {}
			freemind.processTopic({ TEXT: 'Done', icon: [{ BUILTIN: 'button_ok' }, { BUILTIN: 'full-9' }, { BUILTIN: 'hourglass' }] }, withText)
			expect(withText.data.text).toBe('✅⌛ Done')
			expect(withText.data.priority).toBe(9)

			const iconOnly = {}
			freemind.processTopic({ TEXT: '', icon: { BUILTIN: 'ksmiletris' } }, iconOnly)
			expect(iconOnly.data.text).toBe('😊')
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

		it('takes the text of a node without TEXT from its rich content', async () => {
			const xml = '<map version="1.1.0"><node><richcontent TYPE="NODE"><html><body>'
				+ '<p>FreeMind</p><p>  Template  </p></body></html></richcontent>'
				+ '<richcontent TYPE="NOTE"><html><body><p>A note</p></body></html></richcontent>'
				+ '<node TEXT="Child"/></node></map>'
			const result = await freemind.decode(xml)
			expect(result.data.text).toBe('FreeMind\nTemplate')
			expect(result.children[0].data.text).toBe('Child')
		})

		it('keeps line breaks in rich content but not the wrapping of its HTML', async () => {
			const xml = '<map version="1.0.1"><node><richcontent TYPE="NODE"><html><body>'
				+ '<p align="center">\n  FreeMind<br/><small>- free mind\n  mapping software -</small>\n</p>'
				+ '</body></html></richcontent></node></map>'
			const result = await freemind.decode(xml)
			expect(result.data.text).toBe('FreeMind\n- free mind mapping software -')
		})

		it('takes the text of FreeMind 0.8 HTML in TEXT, with the chosen value of form fields', async () => {
			const xml = '<map version="0.8.0"><node TEXT="&lt;html&gt;&lt;img src=&quot;a.gif&quot;&gt;&lt;br&gt;Complete Man">'
				+ '<node TEXT="&lt;html&gt;Rating &lt;select&gt;&lt;option&gt;--&lt;/option&gt;&lt;option selected&gt;++&lt;/option&gt;&lt;/select&gt;"/>'
				+ '<node TEXT="&lt;html&gt;&lt;select&gt;&lt;option&gt;--&lt;/option&gt;&lt;/select&gt;"/>'
				+ '</node></map>'
			const result = await freemind.decode(xml)
			expect(result.data.text).toBe('Complete Man')
			expect(result.children[0].data.text).toBe('Rating ++')
			expect(result.children[1].data.text).toBe('')
		})

		it('imports notes and folded branches', async () => {
			const xml = '<map version="1.0.1"><node TEXT="Root"><node TEXT="Folded" FOLDED="true">'
				+ '<richcontent TYPE="NOTE"><html><body><p>First</p><p>Second</p></body></html></richcontent>'
				+ '<node TEXT="Hidden"/></node></node></map>'
			const result = await freemind.decode(xml)
			expect(result.data.expandState).toBeUndefined()
			expect(result.children[0].data.expandState).toBe('collapse')
			expect(result.children[0].data.note).toBe('First\nSecond')
			expect(result.children[0].children[0].data.text).toBe('Hidden')
		})

		it('rejects a file that is not a FreeMind map with a clear message', async () => {
			await expect(freemind.decode('<!DOCTYPE html><html><head><title>VIP.mm</title></head><body></body></html>'))
				.rejects.toThrow('This file is not a valid FreeMind mind map.')
			await expect(freemind.decode('<map version="1.0.1"></map>')).rejects.toThrow('not a valid FreeMind')
		})

		it('rejects on malformed input', async () => {
			await expect(freemind.decode(null)).rejects.toBeDefined()
		})
	})
})
