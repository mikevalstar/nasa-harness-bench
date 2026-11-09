import { defineConfig, type Plugin } from "vite";
import { prepareData } from "./build/prepare-data.ts";

function dataPlugin(): Plugin {
  return {
    name: "prepare-data",
    buildStart() {
      prepareData(import.meta.dirname);
    },
  };
}

export default defineConfig({
  base: "./",
  plugins: [dataPlugin()],
  build: { target: "es2022", chunkSizeWarningLimit: 1500 },
});
