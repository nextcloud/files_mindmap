/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-FileCopyrightText: 2024 Jingtao Yan <i@actom.me>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

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
