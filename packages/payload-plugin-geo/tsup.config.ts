import { defineConfig } from 'tsup'

export default defineConfig([
  {
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
  },
  {
    // Admin components are referenced by path (`@askbeam/payload-plugin/client#...`) and must be client components.
    entry: ['src/client.tsx'],
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    external: ['react', 'react/jsx-runtime', '@askbeam/dashboard', '@payloadcms/ui', 'payload', 'payload/shared'],
    banner: { js: "'use client'" },
  },
])
