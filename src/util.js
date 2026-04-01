export default {
	base64Encode(string) {
		return btoa(encodeURIComponent(string).replace(/%([0-9A-F]{2})/g, function(match, p1) {
			return String.fromCharCode(parseInt(p1, 16))
		}))
	},
	base64Decode(base64) {
		try {
			return decodeURIComponent(Array.prototype.map.call(atob(base64), function(c) {
				return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
			}).join(''))
		} catch (e) {
			const binary = atob(base64)
			const array = new Uint8Array(binary.length)
			for (let i = 0; i < binary.length; i++) {
				array[i] = binary.charCodeAt(i)
			}
			return new Blob([array])
		}
	},
	jsVar(s) {
		return String(s || '').replace(/-/g, '_')
	},
	toArray(obj) {
		if (!Array.isArray(obj)) {
			return [obj]
		}
		return obj
	},
	parseNode(node) {
		if (!node) return null
		const self = this
		let txt = ''; let obj = null; let att = null

		if (node.childNodes) {
			if (node.childNodes.length > 0) {
				node.childNodes.forEach(function(cn) {
					const cnt = cn.nodeType; const cnn = self.jsVar(cn.localName || cn.nodeName)
					const cnv = cn.text || cn.nodeValue || ''

					if (cnt === 8) {
						// comment node — ignore
					} else if (cnt === 3 || cnt === 4 || !cnn) {
						// white-space
						if (cnv.match(/^\s+$/)) {
							return
						}
						txt += cnv.replace(/^\s+/, '').replace(/\s+$/, '')
					} else {
						obj = obj || {}
						if (obj[cnn]) {
							if (!obj[cnn].length) {
								obj[cnn] = self.toArray(obj[cnn])
							}
							obj[cnn] = self.toArray(obj[cnn])

							obj[cnn].push(self.parseNode(cn, true))
						} else {
							obj[cnn] = self.parseNode(cn)
						}
					}
				})
			}
		}
		if (node.attributes && node.tagName !== 'title') {
			if (node.attributes.length > 0) {
				att = {}; obj = obj || {}
				node.attributes.forEach = [].forEach.bind(node.attributes)
				node.attributes.forEach(function(at) {
					const atn = self.jsVar(at.name); const atv = at.value
					att[atn] = atv
					if (obj[atn]) {
						obj[atn] = self.toArray(obj[atn])
						obj[atn][obj[atn].length] = atv
					} else {
						obj[atn] = atv
					}
				})
			}
		}
		if (obj) {
			obj = Object.assign({}, (txt !== '' ? String(txt) : {}), obj || {})
			txt = (obj.text) ? ([obj.text || '']).concat([txt]) : txt
			if (txt) obj.text = txt
			txt = ''
		}
		const out = obj || txt
		return out
	},
	parseXML(xml) {
		const root = (xml.nodeType === 9) ? xml.documentElement : xml
		return this.parseNode(root, true)
	},
	xml2json(str) {
		const domParser = new DOMParser()
		const dom = domParser.parseFromString(str, 'application/xml')

		const json = this.parseXML(dom)
		return json
	},
}
