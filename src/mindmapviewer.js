/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-FileCopyrightText: 2024-2025 Jingtao Yan <i@actom.me>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/* global OCA */
import MindMap from './views/MindMap.js'
import FilesMindMap from './mindmap.js'

OCA.FilesMindMap = FilesMindMap

FilesMindMap.init()
FilesMindMap.registerFileActions()

const supportedMimes = OCA.FilesMindMap.getSupportedMimetypes()

if (OCA.Viewer) {
	OCA.Viewer.registerHandler({
		id: 'mindmap',
		group: null,
		mimes: supportedMimes,
		component: MindMap,
		theme: 'default',
		canCompare: true,
	})
}
