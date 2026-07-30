import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

// Mirrors the path aliases in tsconfig.json so tests import the same way the
// site does.
const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@i18n': r('./src/i18n'),
      '@data': r('./src/data'),
      '@components': r('./src/components'),
      '@layouts': r('./src/layouts'),
      '@': r('./src'),
    },
  },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});
