/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-FileCopyrightText: 2024 Jingtao Yan <i@actom.me>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { translate as t } from '@nextcloud/l10n'
import util from '../util.js'

// A private use character, so it is neither whitespace nor part of node text
const LINE_BREAK = '\uE000'

// FreeMind's built-in icons the editor has no marker for, shown as emoji before the node text
const ICON_EMOJIS = {
	attach: '📎',
	back: '⬅️',
	bell: '🔔',
	bookmark: '🔖',
	'broken-line': '〰️',
	button_cancel: '❌',
	button_ok: '✅',
	calendar: '📅',
	clanbomber: '💣',
	clock: '🕐',
	closed: '⛔',
	decrypted: '🔓',
	desktop_new: '🖥️',
	down: '⬇️',
	edit: '✏️',
	encrypted: '🔒',
	executable: '⚙️',
	family: '👪',
	fema: '🚻',
	female1: '👩',
	female2: '👩',
	flag: '🚩',
	'flag-black': '🏴',
	'flag-blue': '🚩',
	'flag-green': '🚩',
	'flag-orange': '🚩',
	'flag-pink': '🚩',
	'flag-yellow': '🚩',
	folder: '📁',
	forward: '➡️',
	freemind_butterfly: '🦋',
	go: '🟢',
	gohome: '🏠',
	group: '👥',
	help: '❓',
	hourglass: '⌛',
	idea: '💡',
	info: 'ℹ️',
	kaddressbook: '📇',
	kmail: '📧',
	knotify: '🔊',
	korn: '📯',
	ksmiletris: '😊',
	launch: '🚀',
	licq: '🌼',
	list: '📋',
	Mail: '✉️',
	male1: '👨',
	male2: '👨',
	messagebox_warning: '⚠️',
	music: '🎵',
	password: '🔑',
	pencil: '✏️',
	penguin: '🐧',
	prepare: '🟡',
	smiley_angry: '😠',
	'smiley-angry': '😠',
	'smiley-neutral': '😐',
	'smiley-oh': '😮',
	smily_bad: '😞',
	stop: '🔴',
	'stop-sign': '🛑',
	up: '⬆️',
	video: '🎬',
	wizard: '🧙',
	xmag: '🔍',
	yes: '❗',
}

export default {
	name: 'freemind',
	mimes: ['application/x-freemind'],
	encode: null,
	decode(data) {
		const self = this
		return new Promise(function(resolve, reject) {
			try {
				const result = self.toKm(data)
				resolve(result)
			} catch (e) {
				reject(e)
			}
		})
	},
	markerMap: {
		'full-1': ['priority', 1],
		'full-2': ['priority', 2],
		'full-3': ['priority', 3],
		'full-4': ['priority', 4],
		'full-5': ['priority', 5],
		'full-6': ['priority', 6],
		'full-7': ['priority', 7],
		'full-8': ['priority', 8],
		'full-9': ['priority', 9],
	},
	processTopic(topic, obj) {
		// 处理文本
		obj.data = {
			text: topic.TEXT,
		}
		let i

		// 处理标签
		if (topic.icon) {
			const emojis = []
			for (const icon of util.toArray(topic.icon)) {
				const type = this.markerMap[icon.BUILTIN]
				if (type) {
					obj.data[type[0]] = type[1]
				} else if (ICON_EMOJIS[icon.BUILTIN]) {
					emojis.push(ICON_EMOJIS[icon.BUILTIN])
				}
			}
			if (emojis.length) {
				obj.data.text = [emojis.join(''), obj.data.text].filter(Boolean).join(' ')
			}
		}

		// 处理超链接
		if (topic.LINK) {
			obj.data.hyperlink = topic.LINK
		}

		if (topic.NOTE) {
			obj.data.note = topic.NOTE
		}
		if (topic.FOLDED === 'true') {
			obj.data.expandState = 'collapse'
		}

		// 处理子节点
		if (topic.node) {
			const tmp = topic.node
			if (tmp.length && tmp.length > 0) { // 多个子节点
				obj.children = []

				for (i in tmp) {
					obj.children.push({})
					this.processTopic(tmp[i], obj.children[i])
				}
			} else { // 一个子节点
				obj.children = [{}]
				this.processTopic(tmp, obj.children[0])
			}
		}
	},
	/**
	 * The plain text of formatted FreeMind text, one line per paragraph or line break
	 *
	 * @param {Element} html element holding the HTML
	 */
	htmlToText(html) {
		for (const hidden of html.querySelectorAll('script, style')) {
			hidden.remove()
		}
		// A form field shows its chosen value, not all its options
		for (const select of html.querySelectorAll('select')) {
			select.replaceWith(select.querySelector('option[selected]')?.textContent ?? '')
		}
		// Mark line breaks before collapsing the whitespace the HTML is wrapped with
		for (const br of html.querySelectorAll('br')) {
			br.replaceWith(LINE_BREAK)
		}
		const paragraphs = [...html.querySelectorAll('p')]
		return (paragraphs.length ? paragraphs : [html])
			.flatMap((element) => element.textContent.split(LINE_BREAK))
			.map((line) => line.replace(/\s+/g, ' ').trim())
			.filter(Boolean)
			.join('\n')
	},
	/**
	 * Set the TEXT of a node from its formatted text. An image stands in for
	 * missing text with its alternative text or file name, and its link becomes
	 * the node's link.
	 *
	 * @param {Element} node FreeMind node
	 * @param {Element} html element holding the HTML of the node text
	 */
	importHtml(node, html) {
		const image = html.querySelector('img')
		let text = this.htmlToText(html)
		if (image) {
			const src = image.getAttribute('src') ?? ''
			text ||= image.getAttribute('alt')?.trim() || this.fileName(src)
			if (/^https?:\/\//i.test(src) && !node.hasAttribute('LINK')) {
				node.setAttribute('LINK', src)
			}
		}
		node.setAttribute('TEXT', text)
	},
	/**
	 * The file name of a path or URL, without its extension
	 *
	 * @param {string} src path or URL
	 */
	fileName(src) {
		const name = src.split(/[?#]/)[0].split(/[\\/]/).pop().replace(/\.[^.]*$/, '')
		try {
			return decodeURIComponent(name)
		} catch {
			return name
		}
	},
	toKm(xml) {
		const dom = new DOMParser().parseFromString(xml, 'application/xml')
		if (dom.documentElement.nodeName !== 'map' || !dom.querySelector('map > node')) {
			throw new Error(t('files_mindmap', 'This file is not a valid FreeMind mind map.'))
		}
		for (const node of dom.querySelectorAll('node')) {
			const text = node.getAttribute('TEXT')
			// FreeMind 0.9+ keeps formatted text as HTML in richcontent instead of TEXT,
			// FreeMind 0.8 kept it as HTML in TEXT
			const html = text === null
				? node.querySelector(':scope > richcontent[TYPE="NODE"]')
				: (/^\s*<html/i.test(text) ? new DOMParser().parseFromString(text, 'text/html').body : null)
			if (html) {
				this.importHtml(node, html)
			}
			const note = node.querySelector(':scope > richcontent[TYPE="NOTE"]')
			if (note) {
				node.setAttribute('NOTE', this.htmlToText(note))
			}
		}
		const json = util.parseXML(dom)
		const result = {}
		this.processTopic(json.node, result)
		return result
	},

}
