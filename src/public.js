/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-FileCopyrightText: 2025 Jingtao Yan <i@actom.me>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { isPublicShare } from '@nextcloud/sharing/public'
import logger from './logger.js'
import FilesMindMap, { TAG_NAME } from './mindmap.js'

if (isPublicShare() && FilesMindMap.isMindmapPublic()) {
	window.addEventListener('DOMContentLoaded', function() {
		const contentElmt = document.getElementById('files-public-content')
		const footerElmt = document.querySelector('body > footer') || document.querySelector('#app-content > footer')
		if (contentElmt) {
			const name = document.getElementById('filename')?.value ?? ''
			const element = document.createElement(TAG_NAME)
			element.file = { basename: name, path: '/' + name }
			contentElmt.replaceChildren(element)

			if (footerElmt) {
				footerElmt.style.display = 'none'
			}
		}
	})

	logger.debug('files_mindmap public.js loaded')
}
