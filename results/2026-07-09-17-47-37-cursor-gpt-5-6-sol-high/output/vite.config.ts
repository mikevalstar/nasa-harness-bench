import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  publicDir: "data",
  build: {
    target: "es2022",
    sourcemap: false,
    chunkSizeWarningLimit: 800,
  },
});
