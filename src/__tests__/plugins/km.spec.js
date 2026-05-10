/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { describe, it, expect } from 'vitest'
import km from '../../plugins/km.js'

describe('km plugin', () => {
	it('has the correct name', () => {
		expect(km.name).toBe('km')
	})

	it('supports application/km mime type', () => {
		expect(km.mimes).toContain('application/km')
	})

	describe('encode', () => {
		it('resolves with the same data unchanged', async () => {
			const data = '{"root":{"data":{"text":"Test"}}}'
			await expect(km.encode(data)).resolves.toBe(data)
		})

		it('resolves with empty string', async () => {
			await expect(km.encode('')).resolves.toBe('')
		})
	})

	describe('decode', () => {
		it('parses a valid JSON string and resolves with the object', async () => {
			const obj = { root: { data: { text: 'Test' } } }
			const result = await km.decode(JSON.stringify(obj))
			expect(result).toEqual(obj)
		})

		it('resolves with the raw string when JSON is invalid', async () => {
			const data = 'not-valid-json'
			await expect(km.decode(data)).resolves.toBe(data)
		})

		it('resolves with empty string', async () => {
			await expect(km.decode('')).resolves.toBe('')
		})
	})
})
