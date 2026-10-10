/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-FileCopyrightText: 2024-2025 Jingtao Yan <i@actom.me>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { translate as t } from '@nextcloud/l10n'
import { registerHandler } from '@nextcloud/viewer'
import { HANDLER_ID, MIMES, TAG_NAME } from './constants.js'
import MindMap from './views/MindMap.js'

const version = Number.parseInt((window.OC?.config?.version ?? '0').split('.')[0])

if (!window.customElements.get(TAG_NAME)) {
	window.customElements.define(TAG_NAME, MindMap)
}

registerHandler({
	id: HANDLER_ID,
	displayName: t('files_mindmap', 'Mind map'),
	tagName: TAG_NAME,
	enabled: (nodes) => nodes.every((node) => MIMES.includes(node.mime)),
	theme: 'default',
})

// From 33 on the viewer registers the actions for its handlers itself
if (version < 33) {
	import('./legacyFileAction.js')
}
