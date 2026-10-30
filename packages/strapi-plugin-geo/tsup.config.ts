import { defineConfig } from 'tsup'

// Strapi loads plugins with require(), so the server entry is CommonJS.
export default defineConfig({
  entry: { 'server/index': 'src/server/index.ts' },
  format: ['cjs'],
  outExtension: () => ({ js: '.js' }),
  dts: true,
  clean: true,
  sourcemap: true,
})
