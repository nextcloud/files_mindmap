module.exports = {
	extends: [
		'@nextcloud/eslint-config',
	],
	globals: {
		OCA: 'readonly',
		OC: 'readonly',
	},
	overrides: [
		{
			files: ['src/__tests__/**/*'],
			rules: {
				'n/no-unpublished-import': 'off',
				'jsdoc/require-jsdoc': 'off',
			},
		},
	],
}
