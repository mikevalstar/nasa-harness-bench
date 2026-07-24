import { defineConfig } from 'vite';

export default defineConfig({
  // Served from a sub-path inside an iframe -> everything must be relative.
  base: './',
  build: {
    target: 'es2020',
    assetsInlineLimit: 0,
    chunkSizeWarningLimit: 2000,
  },
});
