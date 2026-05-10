/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { describe, it, expect } from 'vitest'
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

	describe('readDocument', () => {
		it('rejects when content.xml is missing in the zip', async () => {
			await expect(xmind.readDocument('not a zip')).rejects.toBeDefined()
		})
	})
})
