import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  test: {
    globals: true,
    setupFiles: ['./tests/setup.js'],
    projects: [
      {
        test: {
          name: 'backend',
          environment: 'node',
          globals: true,
          setupFiles: ['./tests/setup.js'],
          include: ['tests/unit/**/*.test.js', 'tests/integration/**/*.test.js'],
        },
      },
      {
        plugins: [react()],
        test: {
          name: 'frontend',
          environment: 'jsdom',
          globals: true,
          setupFiles: ['./tests/setup.js'],
          include: ['tests/frontend/**/*.test.jsx'],
        },
      },
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['services/**', 'middleware/**', 'routes/**'],
      exclude: ['node_modules/**', 'tests/**'],
    },
  },
});
