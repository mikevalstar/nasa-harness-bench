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
const RUBRIC = JSON.parse(readFileSync(join(ROOT, "rubric.json"), "utf8"));

function isDir(p) {
  try { return statSync(p).isDirectory(); } catch { return false; }
}

const MARK = RUBRIC.scale; // pass:1 good:0.75 partial:0.5 poor:0.25 fail:0

// Score a result's `grade` object against the rubric. Deterministic — the score
// is never hand-typed. Returns { score, categoryScores, integrityPassed,
// voided, status } where status is "graded" | "ungraded".
function scoreGrade(grade, cheated) {
  const g = grade || {};
  const categoryScores = {};
  let ungraded = false;

  for (const cat of RUBRIC.categories) {
    const marks = g[cat.key] || {};
    const vals = [];
    for (const c of cat.criteria) {
      const v = marks[c.key];
      if (v === "na") continue; // excluded from the average
      if (!(v in MARK)) { ungraded = true; continue; } // null/missing → ungraded
      vals.push(MARK[v]);
    }
    categoryScores[cat.key] =
      vals.length === 0 ? null : Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 100);
  }

  // Integrity gate.
  const integ = g.integrity || {};
  let integrityPassed = cheated !== true;
  for (const c of RUBRIC.integrity) {
    if (integ[c.key] !== true) integrityPassed = false;
  }

  if (ungraded) {
    return { status: "ungraded", score: null, categoryScores, integrityPassed, voided: !integrityPassed };
  }
  // Weighted average over graded categories. Each category carries an optional
  // `weight` in the rubric (defaults to 1 = equal weight); we normalize by the
  // weights actually present so a null/excluded category never skews the result.
  let weightSum = 0;
  let weighted = 0;
  for (const cat of RUBRIC.categories) {
    const s = categoryScores[cat.key];
    if (s === null) continue;
    const w = typeof cat.weight === "number" ? cat.weight : 1;
    weighted += s * w;
    weightSum += w;
  }
  const score = weightSum ? Math.round(weighted / weightSum) : null;
  return { status: "graded", score, categoryScores, integrityPassed, voided: !integrityPassed };
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
    // Deterministic score computed from meta.grade against the rubric.
    scoring: scoreGrade(meta.grade, meta.cheated),
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
  rubric: RUBRIC, // embedded so the site can render labels without a second fetch
  benches,
};
writeFileSync(join(RESULTS, "all.json"), JSON.stringify(out, null, 2) + "\n");
console.log(`Wrote results/all.json with ${benches.length} bench(es).`);
