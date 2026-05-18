import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['**/*.test.{ts,tsx}'],
    exclude: ['node_modules/**'],
  },
  resolve: {
    alias: {
      '@/ui-kit': path.resolve(__dirname, './src/ui-kit'),
      '@': path.resolve(__dirname, '.'),
    },
  },
});
