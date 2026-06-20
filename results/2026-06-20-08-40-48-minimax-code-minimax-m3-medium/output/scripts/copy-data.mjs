#!/usr/bin/env node
/**
 * Copy data/ into dist/data/ so the built site can fetch it via relative URLs.
 * This runs as `prebuild` so dist/ always has fresh data.
 *
 * The data/ directory is read-only — we only copy, never modify the source.
 */
import { existsSync, mkdirSync, cpSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const src = resolve(root, "data");
const dst = resolve(root, "dist", "data");

if (!existsSync(src)) {
  console.error(`[copy-data] no data/ directory at ${src}`);
  process.exit(1);
}

mkdirSync(dst, { recursive: true });
cpSync(src, dst, { recursive: true, force: true });
console.log(`[copy-data] copied data/ -> dist/data/`);
