/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import SvgPencil from '@mdi/svg/svg/pencil.svg?raw'
import { translate as t } from '@nextcloud/l10n'
import { getViewer } from '@nextcloud/viewer'
import { HANDLER_ID, MIMES } from './constants.js'
import logger from './logger.js'

const ACTION_ID = 'file_mindmap'
const PERMISSION_READ = 1

/**
 * Register the hidden default action that opens mind maps from the Files app of Nextcloud 32.
 *
 * Files 32 looks up the default action once when it opens a file from the URL, as on a public
 * file share, so this has to run synchronously in the init script. The action is a plain object
 * in the `window._nc_fileactions` registry of `@nextcloud/files` 3, whose `FileAction` only
 * wraps these properties, so that library does not load on every page.
 */
export function registerLegacyFileAction() {
	window._nc_fileactions ??= []
	if (window._nc_fileactions.some((action) => action.id === ACTION_ID)) {
		return
	}

	window._nc_fileactions.push({
		id: ACTION_ID,
		displayName: () => t('files_mindmap', 'Edit'),
		iconSvgInline: () => SvgPencil,
		enabled: (nodes) => nodes.length === 1 && MIMES.includes(nodes[0].mime) && (nodes[0].permissions & PERMISSION_READ) !== 0,
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
		default: 'hidden',
	})
}
