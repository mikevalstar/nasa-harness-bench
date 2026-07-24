import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // relative asset URLs — the site is served from a sub-path in an iframe
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 1200,
  },
});
