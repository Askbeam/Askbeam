import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: { '@headless-geo/core': new URL('./packages/geo-core/src/index.ts', import.meta.url).pathname },
  },
  test: { include: ['packages/*/src/**/*.test.ts'] },
})
