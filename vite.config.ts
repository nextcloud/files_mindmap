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
	public: join(__dirname, 'src', 'public.js'),
	mindmapviewer: join(__dirname, 'src', 'mindmapviewer.js'),
}, {
	inlineCSS: { relativeCSSInjection: true },
	config: {
		experimental: {
			renderBuiltUrl(filename) {
				return {
					// already contains the "js/" prefix as it is our output file configuration
					runtime: `OC.filePath('files_mindmap', '', '${filename}')`,
				}
			},
		},
		plugins: [
			viteStaticCopy({
				targets: [
					{
						src: 'src/viewer.js',
						dest: 'js'
					}
				]
			})
		],
		resolve: {
			dedupe: ['vue'],
		}
	},
})
