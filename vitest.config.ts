import { defineConfig } from 'vitest/config';

// Deliberately separate from vite.config.ts: no React/Tailwind plugins and no dev
// API middleware (which would load .env.local into process.env during tests).
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    setupFiles: ['tests/setup.ts'],
    unstubEnvs: true,
    unstubGlobals: true,
  },
});
