import path from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
	test: {
		include: ['lib/**'],
		coverage: {
			reporter: ['text', 'json', 'clover', 'lcov'],
		},
		globals: true,
	},
	resolve: {
		alias: {
			'@': path.resolve(__dirname, './lib'),
		},
	},
})
