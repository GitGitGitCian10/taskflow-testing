import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    reporters: [
      'default',
      ['allure-vitest/reporter', { resultsDir: 'allure-results' }],
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/services/**'],
      thresholds: {
        lines: 80,
        functions: 80,
        statements: 80,
        branches: 75
      }
    },
    setupFiles: ['./tests/setup.ts', 'allure-vitest/setup'],
  },
})
