/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-FileCopyrightText: 2024 Jingtao Yan <i@actom.me>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import JSZip from 'jszip'
import util from '../util.js'

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
	processTopic(topic, obj) {

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
					if (type) obj.data[type[0]] = type[1]
				}
			} else {
				type = this.markerMap[markers.marker_id]
				if (type) obj.data[type[0]] = type[1]
			}
		}

		// 处理超链接
		if (topic['xlink:href']) {
			obj.data.hyperlink = topic['xlink:href']
		}
		// 处理子节点
		const topics = topic.children && topic.children.topics
		const subTopics = topics && (topics.topic || (topics[0] && topics[0].topic))
		if (subTopics) {
			const tmp = subTopics
			if (tmp.length && tmp.length > 0) { // 多个子节点
				obj.children = []

				for (const ii in tmp) {
					obj.children.push({})
					this.processTopic(tmp[ii], obj.children[ii])
				}

			} else { // 一个子节点
				obj.children = [{}]
				this.processTopic(tmp, obj.children[0])
			}
		}
	},
	toKm(xml) {
		const json = util.xml2json(xml)
		const result = {}
		const sheet = json.sheet
		const topic = Array.isArray(sheet) ? sheet[0].topic : sheet.topic
		this.processTopic(topic, result)
		return result
	},
	readDocument(file) {
		const self = this
		return new Promise(function(resolve, reject) {
			JSZip.loadAsync(file).then(function(zip) {
				const contentFile = zip.file('content.xml')
				if (contentFile != null) {
					contentFile.async('text').then(function(text) {
						try {
							const json = self.toKm(text)
							resolve(json)
						} catch (e) {
							reject(e)
						}
					})
				} else {
					reject(new Error('Content document missing'))
				}
			}, function(e) {
				reject(e)
			})
		})
	},
}
