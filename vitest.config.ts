import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue2'

export default defineConfig({
	plugins: [vue()],
	test: {
		environment: 'jsdom',
		globals: true,
		server: {
			deps: {
				// cancelable-promise is CJS; inline it so Vite handles interop
				inline: ['cancelable-promise'],
			},
		},
	},
})
