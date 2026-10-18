/**
 * SPDX-FileCopyrightText: 2023 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { readFileSync } from 'fs'
import { join } from 'path'
import { createAppConfig } from '@nextcloud/vite-config'

// replaced by vite
declare const __dirname: string

const iframeScript = join(__dirname, 'src', 'viewer.js')

export default createAppConfig({
	mindmapviewer: join(__dirname, 'src', 'mindmapviewer.js'),
}, {
	inlineCSS: { relativeCSSInjection: true },
	config: {
		plugins: [
			{
				// The editor iframe loads this script as is, outside the bundle
				name: 'copy-iframe-script',
				buildStart() {
					this.addWatchFile(iframeScript)
				},
				generateBundle() {
					this.emitFile({ type: 'asset', fileName: 'js/viewer.js', source: readFileSync(iframeScript, 'utf8') })
				},
			},
		],
		resolve: {
			dedupe: ['vue'],
		}
	},
})
