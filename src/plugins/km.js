export default {
	name: 'km',
	mimes: ['application/km'],
	encode(data) {
		return new Promise(function(resolve, reject) {
			resolve(data)
		})
	},
	decode(data) {
		return new Promise(function(resolve, reject) {
			try {
				resolve(JSON.parse(data))
			} catch (e) {
				resolve(data)
			}
		})
	},
}
