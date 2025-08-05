import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import compression from 'vite-plugin-compression';

export default defineConfig({
  plugins: [react(), compression()],
  define: {
    global: 'globalThis',
  },
  resolve: {
    alias: {
      buffer: 'buffer',
      process: 'process/browser',
    },
  },
  build: {
    target: 'esnext',
    chunkSizeWarningLimit: 500,
    assetsInlineLimit: 0, // disables inlining base64 assets
    minify: 'esbuild',
  },
});
