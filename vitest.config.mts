import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    environment: 'node',
    // The first test in a file pays for loading the whole module graph, which on a
    // slow disk is longer than vitest's default five seconds.
    testTimeout: 30_000,
    include: ['**/*.spec.ts', '**/*.spec.tsx'],
  },
});
