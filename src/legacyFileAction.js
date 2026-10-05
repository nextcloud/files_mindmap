/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import SvgPencil from '@mdi/svg/svg/pencil.svg?raw'
import { DefaultType, FileAction, Permission, registerFileAction } from '@nextcloud/files-legacy'
import { translate as t } from '@nextcloud/l10n'
import { getViewer } from '@nextcloud/viewer'
import { HANDLER_ID, MIMES } from './constants.js'
import logger from './logger.js'

registerFileAction(new FileAction({
	id: 'file_mindmap',
	displayName: () => t('files_mindmap', 'Edit'),
	iconSvgInline: () => SvgPencil,
	enabled: (nodes) => nodes.length === 1 && MIMES.includes(nodes[0].mime) && (nodes[0].permissions & Permission.READ) !== 0,
	async exec(node) {
		try {
			await getViewer().open([node], node, {}, HANDLER_ID)
			return true
		} catch (error) {
			logger.error('Could not open the mind map', { error })
			const { showError } = await import('@nextcloud/dialogs')
			showError(error.message)
			return false
		}
	},
	default: DefaultType.HIDDEN,
}))
