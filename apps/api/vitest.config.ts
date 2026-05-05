import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    // Shared Postgres: integration files must run sequentially
    fileParallelism: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/services/**/*.ts'],
      thresholds: {
        lines: 70,
        functions: 60,
        statements: 70,
        branches: 65
      }
    },
    setupFiles: ['./tests/setup.ts'],
  },
})
