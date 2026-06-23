import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['apps/api/src/services/**'],
      thresholds: {
        lines: 50,
        functions: 40,
        statements: 50,
        branches: 75
      }
    },
    reporters: [
      'default',
      ['allure-vitest/reporter', { resultsDir: 'allure-results' }]
    ],
    setupFiles: ['./apps/api/tests/setup.ts', 'allure-vitest/setup'],
  },
})
