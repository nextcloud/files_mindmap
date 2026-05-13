/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-FileCopyrightText: 2024 Jingtao Yan <i@actom.me>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/* global OCA */
import { h as _h } from 'vue'
import { generateUrl } from '@nextcloud/router'

console.debug('MindMap Vue Loading')

// Plain Options API component — intentionally NOT a Vue SFC.
// The viewer app (Vue 2.7) renders this component; using a compiled SFC would
// bundle Vue 3 render helpers (createElementBlock, openBlock) that are
// incompatible with the Vue 2.7 runtime. The render(h) signature receives
// Vue 2.7's h function directly from the runtime, keeping VNodes compatible.
// The viewer also injects its Mime mixin (providing doneLoading, source,
// davPath, fileList, fileid etc.) via component.mixins — that merge only
// works for plain Options API objects, not <script setup> components.
export default {
	name: 'MindMap',
	inheritAttrs: false,

	computed: {
		iframeSrc() {
			return generateUrl('/apps/files_mindmap/?file={file}', {
				file: this.source ?? this.davPath,
			})
		},

		file() {
			return this.fileList.find((f) => f.fileid === this.fileid)
		},
	},

	mounted() {
		console.debug('mounted file: ', this.file)
		if (OCA.FilesMindMap) {
			OCA.FilesMindMap.setFile(this.file)
		}
		this.doneLoading()
	},

	render(h) {
		// Vue 2.7 passes h as an argument; Vue 3 (test env) does not — fall back to the peer dep import.
		const createElement = typeof h === 'function' ? h : _h
		return createElement('iframe', {
			style: {
				width: '100%',
				height: 'calc(100vh - var(--header-height))',
				marginTop: 'var(--header-height)',
				position: 'absolute',
			},
			attrs: { src: this.iframeSrc },
			on: { load: () => { console.debug('File:', this.file) } },
		})
	},
}
