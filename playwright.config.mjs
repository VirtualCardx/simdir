import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './test-e2e',
  use: {
    baseURL: (process.env.E2E_BASE_URL || 'http://127.0.0.1:8787')
  }
})

