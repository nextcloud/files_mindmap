/**
 * SPDX-FileCopyrightText: 2023 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { join } from 'path'
import { viteStaticCopy } from 'vite-plugin-static-copy'
import { createAppConfig } from '@nextcloud/vite-config'

// replaced by vite
declare const __dirname: string

export default createAppConfig({
	mindmap: join(__dirname, 'src', 'mindmap.js'),
	mindmapviewer: join(__dirname, 'src', 'mindmapviewer.js'),
}, {
	inlineCSS: { relativeCSSInjection: true },
	config: {
		plugins: [
			viteStaticCopy({
				targets: [
					{
						src: 'src/viewer.js',
						dest: 'js',
						rename: { stripBase: true },
					}
				]
			})
		],
		resolve: {
			dedupe: ['vue'],
		}
	},
})
