import { defineConfig } from "vite";

// base: "./" so all asset and data URLs are relative — required because the
// built site is served from a sub-path inside an <iframe>.
export default defineConfig({
  base: "./",
  build: {
    target: "es2020",
    chunkSizeWarningLimit: 2000,
  },
});
