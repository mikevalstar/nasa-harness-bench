#!/usr/bin/env node
// sync-results.mjs — copy results/ into public/results/ for the build,
// DEREFERENCING symlinks (so the canonical bench/data linked from each
// output/data/ gets baked in). GitHub Pages does not follow symlinks, so this
// is what makes the deployed site's runtime fetches work.
//
// Runs automatically before dev/build (see package.json). Also runs compile
// first so all.json is fresh.

import { rmSync, mkdirSync, cpSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, dirname, sep } from "node:path";
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

// The data is identical across runs and is symlinked in the repo, but Pages
// can't follow symlinks so each bench's output/data must be a real copy in the
// build. Skip that copy for any run with no compiled output/dist — there's
// nothing to render, so its (large) data would just be dead weight.
const isDir = (p) => { try { return statSync(p).isDirectory(); } catch { return false; } };
const slugsWithDist = new Set(
  readdirSync(RESULTS).filter(
    (n) => isDir(join(RESULTS, n)) && existsSync(join(RESULTS, n, "output", "dist")),
  ),
);
const DATA_SEG = `${sep}output${sep}data`;

rmSync(DEST, { recursive: true, force: true });
mkdirSync(dirname(DEST), { recursive: true });
cpSync(RESULTS, DEST, {
  recursive: true,
  dereference: true, // follow symlinks (output/data -> bench/data)
  filter: (src) => {
    const i = src.indexOf(DATA_SEG);
    if (i === -1) return true; // not a data path
    const slug = src.slice(RESULTS.length + 1).split(sep)[0];
    return slugsWithDist.has(slug); // only bake data for renderable runs
  },
});
console.log(
  `Synced results/ -> public/results/ (data baked for ${slugsWithDist.size} renderable run(s)).`,
);
