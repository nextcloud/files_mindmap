/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { afterEach, describe, expect, it, vi } from 'vitest'
import { registerLegacyFileAction } from '../legacyFileAction.js'

vi.mock('@nextcloud/viewer', () => ({ getViewer: vi.fn() }))

describe('registerLegacyFileAction', () => {
	afterEach(() => {
		delete window._nc_fileactions
	})

	it('registers one hidden default action in the files 3 registry', () => {
		registerLegacyFileAction()
		registerLegacyFileAction()

		expect(window._nc_fileactions).toHaveLength(1)
		expect(window._nc_fileactions[0]).toMatchObject({ id: 'file_mindmap', default: 'hidden' })
	})

	it('keeps actions registered before it', () => {
		window._nc_fileactions = [{ id: 'other' }]
		registerLegacyFileAction()

		expect(window._nc_fileactions.map((action) => action.id)).toEqual(['other', 'file_mindmap'])
	})

	it('is enabled for a single readable mind map only', () => {
		registerLegacyFileAction()
		const { enabled } = window._nc_fileactions[0]
		const km = { mime: 'application/km', permissions: 1 }

		expect(enabled([km])).toBe(true)
		expect(enabled([{ ...km, permissions: 0 }])).toBe(false)
		expect(enabled([{ ...km, mime: 'text/plain' }])).toBe(false)
		expect(enabled([km, km])).toBe(false)
	})
})
