import util from '../util.js'

export default {
	name: 'freemind',
	mimes: ['application/x-freemind'],
	extensions: ['mm'],
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
	},
	processTopic(topic, obj) {
		// 处理文本
		obj.data = {
			text: topic.TEXT,
		}
		let i

		// 处理标签
		if (topic.icon) {
			const icons = topic.icon
			let type
			if (icons.length && icons.length > 0) {
				for (i in icons) {
					type = this.markerMap[icons[i].BUILTIN]
					if (type) obj.data[type[0]] = type[1]
				}
			} else {
				type = this.markerMap[icons.BUILTIN]
				if (type) obj.data[type[0]] = type[1]
			}
		}

		// 处理超链接
		if (topic.LINK) {
			obj.data.hyperlink = topic.LINK
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
	toKm(xml) {
		const json = util.xml2json(xml)
		const result = {}
		this.processTopic(json.node, result)
		return result
	},

}
