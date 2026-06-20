import { defineConfig } from "vite";

// We serve the built site from a sub-path inside an <iframe>, so we must use
// relative asset paths everywhere — never absolute `/…` paths.
export default defineConfig({
  base: "./",
  build: {
    outDir: "dist",
    // We manage dist/ contents ourselves (the build script copies & preprocesses
    // data after vite is done); vite should only emit its own bundle.
    emptyOutDir: true,
    target: "es2022",
    sourcemap: false,
    rollupOptions: {
      output: {
        // Keep file naming predictable.
        entryFileNames: "assets/[name]-[hash].js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
      },
    },
  },
  server: {
    port: 5173,
    open: false,
  },
  // Quiet down the (correct) warning about base being relative — we want it.
  logLevel: "warn",
});
