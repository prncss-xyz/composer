import { resolve } from 'path'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [dts({ include: ['lib'] })],
	build: {
		copyPublicDir: false,
		sourcemap: true,
		emptyOutDir: true,
		lib: {
			entry: {
				machine: 'lib/machine/index.ts',
				optics: 'lib/optics/index.ts',
				utils: 'lib/utils/index.ts',
				stores: 'lib/stores/index.ts',
			},
			name: 'composer',
			formats: ['es'],
		},
	},
	resolve: {
		alias: {
			'@': resolve(__dirname, './lib'),
		},
	},
})
