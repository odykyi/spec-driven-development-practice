import { defineConfig } from 'vitest/config';
import * as path from 'path';

export default defineConfig({
  resolve: {
    // Test against core sources so `pnpm test` does not need a prior build.
    alias: {
      '@sdd-training/core': path.resolve(__dirname, '../core/src/index.ts'),
    },
  },
});
