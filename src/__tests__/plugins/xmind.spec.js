/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import JSZip from 'jszip'
import { afterEach, describe, expect, it, vi } from 'vitest'
import xmind from '../../plugins/xmind.js'

describe('xmind plugin', () => {
	it('has the correct name', () => {
		expect(xmind.name).toBe('xmind')
	})

	it('supports application/vnd.xmind.workbook mime type', () => {
		expect(xmind.mimes).toContain('application/vnd.xmind.workbook')
	})

	it('encode is null (read-only format)', () => {
		expect(xmind.encode).toBeNull()
	})

	describe('markerMap', () => {
		it('maps priority-1 to priority 1', () => {
			expect(xmind.markerMap['priority-1']).toEqual(['priority', 1])
		})

		it('maps priority-8 to priority 8', () => {
			expect(xmind.markerMap['priority-8']).toEqual(['priority', 8])
		})

		it('maps task-done to progress 9', () => {
			expect(xmind.markerMap['task-done']).toEqual(['progress', 9])
		})

		it('maps task-half to progress 5', () => {
			expect(xmind.markerMap['task-half']).toEqual(['progress', 5])
		})
	})

	describe('processTopic', () => {
		it('extracts title as data.text', () => {
			const obj = {}
			xmind.processTopic({ title: 'My Topic' }, obj)
			expect(obj.data.text).toBe('My Topic')
		})

		it('extracts hyperlink from xlink:href', () => {
			const obj = {}
			xmind.processTopic({ title: 'Link', 'xlink:href': 'https://example.com' }, obj)
			expect(obj.data.hyperlink).toBe('https://example.com')
		})

		it('extracts a single marker', () => {
			const obj = {}
			xmind.processTopic({
				title: 'Prio',
				marker_refs: { marker_ref: { marker_id: 'priority-2' } },
			}, obj)
			expect(obj.data.priority).toBe(2)
		})

		it('extracts multiple markers from an array', () => {
			const obj = {}
			xmind.processTopic({
				title: 'Multi',
				marker_refs: {
					marker_ref: [
						{ marker_id: 'priority-3' },
						{ marker_id: 'task-done' },
					],
				},
			}, obj)
			expect(obj.data.priority).toBe(3)
			expect(obj.data.progress).toBe(9)
		})

		it('ignores unknown markers', () => {
			const obj = {}
			xmind.processTopic({
				title: 'Unknown',
				marker_refs: { marker_ref: { marker_id: 'unknown-marker' } },
			}, obj)
			expect(obj.data.priority).toBeUndefined()
		})

		it('processes multiple child topics', () => {
			const obj = {}
			xmind.processTopic({
				title: 'Root',
				children: {
					topics: {
						topic: [{ title: 'Child1' }, { title: 'Child2' }],
					},
				},
			}, obj)
			expect(obj.children).toHaveLength(2)
			expect(obj.children[0].data.text).toBe('Child1')
			expect(obj.children[1].data.text).toBe('Child2')
		})

		it('produces no children property for leaf topics', () => {
			const obj = {}
			xmind.processTopic({ title: 'Leaf' }, obj)
			expect(obj.children).toBeUndefined()
		})
	})

	describe('processJsonTopic', () => {
		it('extracts title, markers, hyperlink and attached children', () => {
			const obj = {}
			xmind.processJsonTopic({
				title: 'Root',
				href: 'https://example.com',
				markers: [{ markerId: 'priority-3' }, { markerId: 'task-done' }, { markerId: 'unknown' }],
				children: {
					attached: [{ title: 'Child1' }, { title: 'Child2' }],
					detached: [{ title: 'Floating' }],
				},
			}, obj)
			expect(obj.data).toEqual({ text: 'Root', hyperlink: 'https://example.com', priority: 3, progress: 9 })
			expect(obj.children.map((child) => child.data.text)).toEqual(['Child1', 'Child2'])
		})

		it('produces no children property for leaf topics', () => {
			const obj = {}
			xmind.processJsonTopic({ title: 'Leaf' }, obj)
			expect(obj.children).toBeUndefined()
		})

		it('takes over theme and topic styles, notes, labels and images', () => {
			const obj = {}
			const context = {
				images: [],
				theme: {
					centralTopic: { properties: { 'svg:fill': '#1F3864', 'fo:font-size': '28pt', 'fo:font-weight': '600' } },
					mainTopic: { properties: { 'fo:color': '#333333', 'fo:font-size': '18pt' } },
				},
			}
			xmind.processJsonTopic({
				title: 'Root',
				style: { properties: { 'fo:color': 'inherited' } },
				children: {
					attached: [{
						title: 'Child',
						style: { properties: { 'fo:font-style': 'italic', 'fo:font-size': 'inherited' } },
						notes: { plain: { content: 'A note' } },
						labels: ['one', 'two'],
						image: { src: 'xap:resources/picture.png' },
					}],
				},
			}, obj, context)
			expect(obj.data).toEqual({ text: 'Root', background: '#1F3864', color: '#FFFFFF', 'font-size': 28, 'font-weight': 'bold' })
			expect(obj.children[0].data).toEqual({ text: 'Child', color: '#333333', 'font-size': 18, 'font-style': 'italic', note: 'A note', resource: ['one', 'two'] })
			expect(context.images).toEqual([{ data: obj.children[0].data, path: 'resources/picture.png' }])
		})
	})

	describe('parseStyles', () => {
		it('reads styles by id and the style of each family by theme', () => {
			const { styles, themes } = xmind.parseStyles(`<xmap-styles xmlns="urn:xmind:xmap:xmlns:style:2.0" xmlns:fo="http://www.w3.org/1999/XSL/Format" xmlns:svg="http://www.w3.org/2000/svg">
				<automatic-styles><style id="central" type="topic"><topic-properties svg:fill="#DCE6F2" fo:color="#376092"/></style></automatic-styles>
				<master-styles><style id="theme" type="theme"><theme-properties><default-style style-family="centralTopic" style-id="central"/></theme-properties></style></master-styles>
				<styles><style id="orange" type="topic"><topic-properties svg:fill="#E46C0A"/></style></styles>
			</xmap-styles>`)
			expect(styles.orange).toEqual({ 'svg:fill': '#E46C0A' })
			expect(themes.theme.centralTopic).toEqual({ 'svg:fill': '#DCE6F2', 'fo:color': '#376092' })
		})
	})

	describe('applyFormatting', () => {
		it('replaces links to attached images with the image', () => {
			const data = {}
			const context = { images: [] }
			xmind.applyFormatting(data, { style: {}, href: 'xap:attachments/photo.JPG' }, context)
			expect(data.hyperlink).toBeUndefined()
			expect(context.images).toEqual([{ data, path: 'attachments/photo.JPG' }])
		})

		it('drops links to other attached files', () => {
			const data = {}
			const context = { images: [] }
			xmind.applyFormatting(data, { style: {}, href: 'xap:attachments/report.pdf' }, context)
			expect(data.hyperlink).toBeUndefined()
			expect(context.images).toEqual([])
		})
	})

	describe('folded branches', () => {
		it('collapses folded branches of XMind 8 maps', () => {
			const obj = {}
			xmind.processTopic({ title: 'Folded', branch: 'folded', children: { topics: { topic: { title: 'Child' } } } }, obj)
			expect(obj.data.expandState).toBe('collapse')
			expect(obj.children[0].data.expandState).toBeUndefined()
		})

		it('collapses folded branches of XMind 2020 maps', () => {
			const obj = {}
			xmind.processJsonTopic({ title: 'Folded', branch: 'folded', children: { attached: [{ title: 'Child' }] } }, obj)
			expect(obj.data.expandState).toBe('collapse')
			expect(obj.children[0].data.expandState).toBeUndefined()
		})
	})

	describe('contrastColor', () => {
		it('picks black on light and white on dark fills', () => {
			expect(xmind.contrastColor('#FBF09C')).toBe('#000000')
			expect(xmind.contrastColor('#4D86DB')).toBe('#FFFFFF')
			expect(xmind.contrastColor('red')).toBe('#000000')
		})
	})

	describe('fitImageSize', () => {
		it('scales images down to 200 px keeping the aspect ratio', () => {
			expect(xmind.fitImageSize(1024, 768)).toEqual({ width: 200, height: 150 })
			expect(xmind.fitImageSize(300, 600)).toEqual({ width: 100, height: 200 })
			expect(xmind.fitImageSize(80, 60)).toEqual({ width: 80, height: 60 })
		})
	})

	describe('readDocument', () => {
		afterEach(() => {
			vi.unstubAllGlobals()
		})

		it('takes over the styles and attached images of XMind 8 maps', async () => {
			vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue({ width: 400, height: 100 }))
			const zip = new JSZip()
			zip.file('content.xml', `<xmap-content xmlns="urn:xmind:xmap:xmlns:content:2.0" xmlns:xlink="http://www.w3.org/1999/xlink"><sheet theme="theme"><topic><title>Root</title><children><topics type="attached">
				<topic style-id="orange" xlink:href="xap:attachments/photo.png"><title>photo.png</title><labels><label>Tag</label></labels><notes><plain>A note</plain></notes></topic>
			</topics></children></topic></sheet></xmap-content>`)
			zip.file('styles.xml', `<xmap-styles xmlns="urn:xmind:xmap:xmlns:style:2.0" xmlns:fo="http://www.w3.org/1999/XSL/Format" xmlns:svg="http://www.w3.org/2000/svg">
				<automatic-styles><style id="central" type="topic"><topic-properties svg:fill="#DCE6F2" fo:color="#376092"/></style></automatic-styles>
				<master-styles><style id="theme" type="theme"><theme-properties><default-style style-family="centralTopic" style-id="central"/></theme-properties></style></master-styles>
				<styles><style id="orange" type="topic"><topic-properties svg:fill="#E46C0A"/></style></styles>
			</xmap-styles>`)
			zip.file('attachments/photo.png', new Uint8Array([137, 80, 78, 71]))
			const data = await zip.generateAsync({ type: 'uint8array' })

			const result = await xmind.readDocument(data)
			expect(result.data).toEqual({ text: 'Root', background: '#DCE6F2', color: '#376092' })
			expect(result.children[0].data).toEqual({
				text: 'photo.png',
				background: '#E46C0A',
				color: '#FFFFFF',
				note: 'A note',
				resource: ['Tag'],
				image: 'data:image/png;base64,iVBORw==',
				imageSize: { width: 200, height: 50 },
			})
		})

		it('leaves out images the browser cannot read', async () => {
			vi.stubGlobal('createImageBitmap', vi.fn().mockRejectedValue(new Error('broken')))
			const zip = new JSZip()
			zip.file('content.json', JSON.stringify([{ rootTopic: { title: 'Root', image: { src: 'xap:resources/broken.png' } } }]))
			zip.file('resources/broken.png', 'not an image')
			const data = await zip.generateAsync({ type: 'uint8array' })

			const result = await xmind.readDocument(data)
			expect(result.data).toEqual({ text: 'Root' })
		})

		it('rejects when content.xml is missing in the zip', async () => {
			await expect(xmind.readDocument('not a zip')).rejects.toBeDefined()
		})

		it('reads content.json instead of the warning map in content.xml', async () => {
			const zip = new JSZip()
			zip.file('content.json', JSON.stringify([{ rootTopic: { title: 'Zen root' } }]))
			zip.file('content.xml', '<xmap-content><sheet><topic><title>Warning</title></topic></sheet></xmap-content>')
			const data = await zip.generateAsync({ type: 'uint8array' })

			const result = await xmind.readDocument(data)
			expect(result.data.text).toBe('Zen root')
		})
	})
})
