import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  base: './',
  plugins: [
    viteStaticCopy({
      targets: [{ src: 'data/*', dest: 'data' }],
    }),
  ],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
});
