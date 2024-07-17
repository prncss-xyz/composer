import { resolve } from 'path'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [dts({ include: ['src'] })],
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
	resolve: {
		alias: {
			'@': resolve(__dirname, './src'),
		},
	},
})
