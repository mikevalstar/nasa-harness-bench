import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // Use relative paths for assets so it can run inside an iframe
  build: {
    outDir: 'dist',
    minify: 'esbuild',
    sourcemap: false,
    assetsInlineLimit: 4096, // Inline small assets if any
  },
  server: {
    port: 3000,
    open: false,
  }
});
