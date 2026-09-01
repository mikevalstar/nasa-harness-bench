import { defineConfig } from 'vite';

// base './' so every asset and data URL is relative: the site is served from a
// sub-path inside an iframe.
export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'es2022',
    chunkSizeWarningLimit: 1500,
  },
});
