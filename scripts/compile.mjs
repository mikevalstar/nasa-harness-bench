#!/usr/bin/env node
// compile.mjs — scan results/*/metadata.json and rebuild results/all.json,
// the single index the site fetches to build its nav and headers.
//
// Run via: pnpm compile

import { readdirSync, readFileSync, writeFileSync, existsSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const RESULTS = join(ROOT, "results");

function isDir(p) {
  try { return statSync(p).isDirectory(); } catch { return false; }
}

const benches = [];
for (const name of readdirSync(RESULTS).sort()) {
  const dir = join(RESULTS, name);
  if (!isDir(dir)) continue; // skip all.json and stray files
  const metaPath = join(dir, "metadata.json");
  if (!existsSync(metaPath)) {
    console.warn(`! skipping ${name}: no metadata.json`);
    continue;
  }
  let meta;
  try {
    meta = JSON.parse(readFileSync(metaPath, "utf8"));
  } catch (e) {
    console.warn(`! skipping ${name}: invalid metadata.json (${e.message})`);
    continue;
  }
  benches.push({
    ...meta,
    // Derived flags the site uses without having to probe the filesystem.
    hasDist: existsSync(join(dir, "output", "dist", "index.html")),
    hasNotes: existsSync(join(dir, "notes.md")),
    hasRunlog: existsSync(join(dir, "runlog.txt")),
  });
}

// Newest first (slugs are timestamp-prefixed and lexically sortable).
benches.sort((a, b) => (a.slug < b.slug ? 1 : a.slug > b.slug ? -1 : 0));

const out = {
  generatedAt: new Date().toISOString(),
  count: benches.length,
  benches,
};
writeFileSync(join(RESULTS, "all.json"), JSON.stringify(out, null, 2) + "\n");
console.log(`Wrote results/all.json with ${benches.length} bench(es).`);
