import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

/**
 * The PDF regression gate.
 *
 * Its own config because of `globalSetup`: the suite needs exactly one server,
 * started without the auth environment, and the unit tests need no server at
 * all. One shared config would start a browser-driving dev server every time
 * somebody ran `npm test`.
 */
export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    environment: 'node',
    dir: 'tests/regression',
    include: ['**/*.spec.ts'],
    globalSetup: ['./tests/regression/helpers/globalSetup.ts'],
    testTimeout: 120_000,
    /*
     * One file at a time. Four concurrent files each driving headless Chrome
     * through the same single dev server is how a 40-second run becomes a
     * five-minute one, and how a slow machine starts timing out.
     */
    fileParallelism: false,
  },
});
