import { defineConfig } from "vite";

// Served from a sub-path inside an <iframe>, so all asset/data URLs must be
// relative. base: "./" makes Vite emit relative URLs.
export default defineConfig({
  base: "./",
  build: {
    target: "es2020",
    chunkSizeWarningLimit: 2000,
  },
});
