import { resolve } from 'node:path'

import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Tests de unidad (sin build): excluye el smoke test que requiere `dist/`
    exclude: ['**/node_modules/**', 'src/tests/**'],
    environment: 'node',
  },
  resolve: {
    alias: {
      '~': resolve(import.meta.dirname, 'src'),
    },
  },
})
