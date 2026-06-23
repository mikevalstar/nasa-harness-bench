import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // crucial for rendering in iframe with relative paths
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 2000, // accommodate three.js and other libs
  }
});
