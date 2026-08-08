import { defineConfig } from 'vite';
import { copyFileSync, mkdirSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

function copyData() {
  return {
    name: 'copy-data',
    closeBundle() {
      const src = 'data';
      const dest = 'dist/data';
      try { mkdirSync(dest, { recursive: true }); } catch {}
      for (const f of readdirSync(src)) {
        const s = join(src, f);
        if (statSync(s).isFile()) copyFileSync(s, join(dest, f));
      }
    }
  };
}

export default defineConfig({
  base: './',
  plugins: [copyData()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    assetsDir: 'assets'
  }
});
