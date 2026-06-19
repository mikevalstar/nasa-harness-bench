#!/usr/bin/env node
// sync-results.mjs — copy results/ into public/results/ for the build,
// DEREFERENCING symlinks (so the canonical bench/data linked from each
// output/data/ gets baked in). GitHub Pages does not follow symlinks, so this
// is what makes the deployed site's runtime fetches work.
//
// Runs automatically before dev/build (see package.json). Also runs compile
// first so all.json is fresh.

import { rmSync, mkdirSync, cpSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const RESULTS = join(ROOT, "results");
const DEST = join(ROOT, "public", "results");

// Refresh the index first.
execFileSync(process.execPath, [join(ROOT, "scripts", "compile.mjs")], { stdio: "inherit" });

if (!existsSync(RESULTS)) {
  console.log("No results/ directory; nothing to sync.");
  process.exit(0);
}

rmSync(DEST, { recursive: true, force: true });
mkdirSync(dirname(DEST), { recursive: true });
// dereference: true follows symlinks (e.g. output/data -> bench/data).
cpSync(RESULTS, DEST, { recursive: true, dereference: true });
console.log("Synced results/ -> public/results/ (symlinks dereferenced).");
