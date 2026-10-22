/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-FileCopyrightText: 2024 Jingtao Yan <i@actom.me>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import JSZip from 'jszip'
import util from '../util.js'

// The editor's default for maxImageWidth and maxImageHeight
const MAX_IMAGE_SIZE = 200

const IMAGE_TYPES = {
	bmp: 'image/bmp',
	gif: 'image/gif',
	jpeg: 'image/jpeg',
	jpg: 'image/jpeg',
	png: 'image/png',
	webp: 'image/webp',
}

export default {
	name: 'xmind',
	mimes: ['application/vnd.xmind.workbook'],
	encode: null,
	decode(data) {
		return this.readDocument(data)
	},
	markerMap: {
		'priority-1': ['priority', 1],
		'priority-2': ['priority', 2],
		'priority-3': ['priority', 3],
		'priority-4': ['priority', 4],
		'priority-5': ['priority', 5],
		'priority-6': ['priority', 6],
		'priority-7': ['priority', 7],
		'priority-8': ['priority', 8],

		'task-start': ['progress', 1],
		'task-oct': ['progress', 2],
		'task-quarter': ['progress', 3],
		'task-3oct': ['progress', 4],
		'task-half': ['progress', 5],
		'task-5oct': ['progress', 6],
		'task-3quar': ['progress', 7],
		'task-7oct': ['progress', 8],
		'task-done': ['progress', 9],
	},
	processTopic(topic, obj, context = {}, depth = 0) {
		// 处理文本
		obj.data = {
			text: topic.title,
		}

		// 处理标签
		if (topic.marker_refs && topic.marker_refs.marker_ref) {
			const markers = topic.marker_refs.marker_ref
			let type
			if (markers.length && markers.length > 0) {
				for (const i in markers) {
					type = this.markerMap[markers[i].marker_id]
					if (type) {
						obj.data[type[0]] = type[1]
					}
				}
			} else {
				type = this.markerMap[markers.marker_id]
				if (type) {
					obj.data[type[0]] = type[1]
				}
			}
		}

		this.applyFormatting(obj.data, {
			style: { ...context.theme?.[this.styleFamily(depth)], ...context.styles?.[topic.style_id] },
			note: topic.notes?.plain,
			labels: topic.labels?.label,
			href: topic['xlink:href'],
			image: topic.img?.['xhtml:src'],
			branch: topic.branch,
		}, context)

		// 处理子节点
		const topics = topic.children && topic.children.topics
		const subTopics = topics && (topics.topic || (topics[0] && topics[0].topic))
		if (subTopics) {
			const tmp = subTopics
			if (tmp.length && tmp.length > 0) { // 多个子节点
				obj.children = []

				for (const ii in tmp) {
					obj.children.push({})
					this.processTopic(tmp[ii], obj.children[ii], context, depth + 1)
				}
			} else { // 一个子节点
				obj.children = [{}]
				this.processTopic(tmp, obj.children[0], context, depth + 1)
			}
		}
	},
	toKm(xml, context = {}) {
		const json = util.xml2json(xml)
		const result = {}
		const sheet = Array.isArray(json.sheet) ? json.sheet[0] : json.sheet
		this.processTopic(sheet.topic, result, { ...context, theme: context.themes?.[sheet.theme] })
		return result
	},
	processJsonTopic(topic, obj, context = {}, depth = 0) {
		obj.data = {
			text: topic.title,
		}
		for (const marker of topic.markers || []) {
			const type = this.markerMap[marker.markerId]
			if (type) {
				obj.data[type[0]] = type[1]
			}
		}
		this.applyFormatting(obj.data, {
			style: {
				...this.ownProperties(context.theme?.[this.styleFamily(depth)]?.properties),
				...this.ownProperties(topic.style?.properties),
			},
			note: topic.notes?.plain?.content,
			labels: topic.labels,
			href: topic.href,
			image: topic.image?.src,
			branch: topic.branch,
		}, context)
		const children = topic.children?.attached
		if (children?.length) {
			obj.children = children.map((child) => {
				const childObj = {}
				this.processJsonTopic(child, childObj, context, depth + 1)
				return childObj
			})
		}
	},
	jsonToKm(text, context = {}) {
		const sheet = JSON.parse(text)[0]
		const result = {}
		this.processJsonTopic(sheet.rootTopic, result, { ...context, theme: sheet.theme })
		return result
	},
	ownProperties(properties = {}) {
		return Object.fromEntries(Object.entries(properties).filter(([, value]) => value !== 'inherited'))
	},
	styleFamily(depth) {
		return ['centralTopic', 'mainTopic'][depth] ?? 'subTopic'
	},
	/**
	 * Reads the styles of an XMind 8 styles.xml with their XMind property
	 * names, as XMind 2020 and later write them to content.json
	 *
	 * @param {string} xml content of styles.xml
	 * @return {{styles: object, themes: object}} properties by style id, and the
	 *   properties of each style family by theme id
	 */
	parseStyles(xml) {
		const elements = [...new DOMParser().parseFromString(xml, 'application/xml').getElementsByTagName('style')]
		const styles = {}
		for (const element of elements) {
			const properties = {}
			for (const attribute of element.firstElementChild?.attributes ?? []) {
				properties[attribute.name] = attribute.value
			}
			styles[element.getAttribute('id')] = properties
		}
		const themes = {}
		for (const element of elements) {
			const defaults = [...element.getElementsByTagName('default-style')]
			if (defaults.length) {
				themes[element.getAttribute('id')] = Object.fromEntries(defaults.map((d) => [d.getAttribute('style-family'), styles[d.getAttribute('style-id')]]))
			}
		}
		return { styles, themes }
	},
	applyFormatting(data, { style, note, labels, href, image, branch }, context) {
		if (style['svg:fill'] && style['svg:fill'] !== 'none') {
			data.background = style['svg:fill']
		}
		if (style['fo:color']) {
			data.color = style['fo:color']
		} else if (data.background) {
			// XMind contrasts the text with the fill, the editor's own colour may not
			data.color = this.contrastColor(data.background)
		}
		const size = parseFloat(style['fo:font-size'])
		if (size > 0) {
			data['font-size'] = size
		}
		if (style['fo:font-weight'] === 'bold' || Number(style['fo:font-weight']) >= 600) {
			data['font-weight'] = 'bold'
		}
		if (style['fo:font-style'] === 'italic') {
			data['font-style'] = 'italic'
		}
		if (note) {
			data.note = note
		}
		if (labels) {
			data.resource = util.toArray(labels)
		}
		if (branch === 'folded') {
			data.expandState = 'collapse'
		}
		// Links to files attached to the map cannot be opened, so show attached images instead
		if (href?.startsWith('xap:')) {
			image ??= this.imageType(href) && href
		} else if (href) {
			data.hyperlink = href
		}
		if (image?.startsWith('xap:') && this.imageType(image)) {
			context.images?.push({ data, path: image.slice(4) })
		}
	},
	contrastColor(background) {
		const rgb = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(background)
		if (!rgb) {
			return '#000000'
		}
		const [r, g, b] = rgb.slice(1).map((hex) => parseInt(hex, 16))
		return r * 0.299 + g * 0.587 + b * 0.114 > 150 ? '#000000' : '#FFFFFF'
	},
	imageType(path) {
		return IMAGE_TYPES[path.split('.').pop().toLowerCase()]
	},
	fitImageSize(width, height) {
		const scale = Math.min(1, MAX_IMAGE_SIZE / width, MAX_IMAGE_SIZE / height)
		return { width: Math.round(width * scale), height: Math.round(height * scale) }
	},
	async loadImages(zip, images) {
		await Promise.all(images.map(async ({ data, path }) => {
			const file = zip.file(path)
			if (!file) {
				return
			}
			try {
				const { width, height } = await createImageBitmap(await file.async('blob'))
				data.image = `data:${this.imageType(path)};base64,${await file.async('base64')}`
				data.imageSize = this.fitImageSize(width, height)
			} catch {
				// not an image the browser can show
			}
		}))
	},
	async readDocument(file) {
		const zip = await JSZip.loadAsync(file)
		// XMind 2020 and later keep the map in content.json and only
		// write a warning map to content.xml
		const jsonFile = zip.file('content.json')
		const contentFile = jsonFile || zip.file('content.xml')
		if (contentFile === null) {
			throw new Error('Content document missing')
		}
		const text = await contentFile.async('text')
		const context = { images: [] }
		const stylesFile = zip.file('styles.xml')
		if (!jsonFile && stylesFile) {
			Object.assign(context, this.parseStyles(await stylesFile.async('text')))
		}
		const result = jsonFile ? this.jsonToKm(text, context) : this.toKm(text, context)
		await this.loadImages(zip, context.images)
		return result
	},
}
