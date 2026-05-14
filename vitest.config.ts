import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    exclude: ['node_modules/**', 'dist/**', 'test-e2e/**'],
    testTimeout: 30000
  }
})

