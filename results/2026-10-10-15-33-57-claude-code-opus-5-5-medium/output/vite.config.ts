import { defineConfig } from "vite";

// Relative base: the site is served from a sub-path inside an iframe.
export default defineConfig({
  base: "./",
  build: { outDir: "dist", emptyOutDir: true, chunkSizeWarningLimit: 1000 },
});
