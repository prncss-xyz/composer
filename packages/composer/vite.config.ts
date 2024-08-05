import { resolve } from 'path'
import dts from 'vite-plugin-dts'
import { defineConfig } from 'vitest/config'

export default defineConfig({
	plugins: [dts({ include: ['src'], rollupTypes: true })],
	build: {
		copyPublicDir: false,
		sourcemap: true,
		emptyOutDir: true,
		lib: {
			entry: {
				machine: 'src/machine/index.ts',
				optics: 'src/optics/index.ts',
				utils: 'src/utils/index.ts',
				stores: 'src/stores/index.ts',
			},
			name: 'composer',
			formats: ['es'],
		},
	},
	test: {
		include: ['src/**/*.test.{js,ts,jsx,tsx}'],
		coverage: {
			reporter: ['text', 'json', 'clover', 'lcov'],
		},
		globals: true,
	},
	resolve: {
		alias: {
			'@': resolve(__dirname, './src'),
		},
	},
})
