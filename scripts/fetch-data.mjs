#!/usr/bin/env node
// fetch-data.mjs — build the canonical benchmark snapshot in bench/data/.
//
// Pulls everything in a SMALL number of BULK calls to NASA/JPL public APIs
// (no key required, no per-object fan-out, so no rate-limit risk):
//   1. SBDB Query API  -> all NEOs, full orbital + physical fields
//   2. CAD API         -> NEO close-approach events over a date window
// Planets are not in the small-body DB, so their elements are written from a
// static table by scripts/build-planets.mjs (run separately / already committed).
//
// Run:  node scripts/fetch-data.mjs
// This OVERWRITES bench/data/asteroids.json and bench/data/close-approaches.json.

import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DATA = join(ROOT, "bench", "data");
mkdirSync(DATA, { recursive: true });

// --- config -------------------------------------------------------------------
const SBDB_FIELDS = [
  "full_name", "pdes", "name", "spkid", "neo", "pha", "class",
  "a", "e", "i", "om", "w", "ma", "epoch", "q", "ad", "per", "n", "tp", "moid",
  "H", "G", "diameter", "albedo", "rot_per", "spec_B", "spec_T", "first_obs",
];
// Which SBDB fields are numeric (parsed to Number | null).
const NUMERIC = new Set([
  "spkid", "a", "e", "i", "om", "w", "ma", "epoch", "q", "ad", "per", "n",
  "tp", "moid", "H", "G", "diameter", "albedo", "rot_per",
]);

// Close approaches: NEOs within this distance (au) over this date window.
const CAD = { distMax: "0.05", dateMin: "1900-01-01", dateMax: "2200-01-01" };

// Comets share the asteroid element schema. NOTE: ~half are hyperbolic/parabolic
// (e >= 1) with no period/mean-anomaly — those must be propagated from `tp`
// (time of perihelion), not from `ma`/`n`.
const COMET_FIELDS = [
  "full_name", "pdes", "e", "a", "q", "i", "om", "w", "ma", "tp", "per", "n",
  "epoch", "class", "M1", "diameter",
];
const COMET_NUMERIC = new Set([
  "e", "a", "q", "i", "om", "w", "ma", "tp", "per", "n", "epoch", "M1", "diameter",
]);

async function getJSON(url) {
  const r = await fetch(url, { headers: { accept: "application/json" } });
  if (!r.ok) throw new Error(`HTTP ${r.status} for ${url}`);
  return r.json();
}

const num = (v) => (v === null || v === "" || v === undefined ? null : Number(v));

// --- 1. asteroids -------------------------------------------------------------
console.log("Fetching all NEOs from SBDB Query API…");
const sbdbURL =
  "https://ssd-api.jpl.nasa.gov/sbdb_query.api?sb-group=neo&fields=" +
  encodeURIComponent(SBDB_FIELDS.join(","));
const sbdb = await getJSON(sbdbURL);
const idx = Object.fromEntries(sbdb.fields.map((f, i) => [f, i]));

const asteroids = sbdb.data.map((row) => {
  const o = {};
  for (const f of SBDB_FIELDS) {
    let v = row[idx[f]];
    if (typeof v === "string") v = v.trim();
    if (f === "neo" || f === "pha") v = v === "Y";
    else if (NUMERIC.has(f)) v = num(v);
    o[f] = v;
  }
  return o;
});
writeFileSync(join(DATA, "asteroids.json"), JSON.stringify(asteroids));
console.log(`  -> bench/data/asteroids.json  (${asteroids.length} objects)`);

// --- 2. close approaches ------------------------------------------------------
console.log("Fetching NEO close approaches from CAD API…");
const cadURL =
  "https://ssd-api.jpl.nasa.gov/cad.api?neo=true&sort=date" +
  `&dist-max=${CAD.distMax}&date-min=${CAD.dateMin}&date-max=${CAD.dateMax}`;
const cad = await getJSON(cadURL);
const ci = Object.fromEntries(cad.fields.map((f, i) => [f, i]));
const approaches = cad.data.map((row) => ({
  des: row[ci.des],
  cd: row[ci.cd],
  jd: num(row[ci.jd]),
  dist: num(row[ci.dist]),
  dist_min: num(row[ci.dist_min]),
  dist_max: num(row[ci.dist_max]),
  v_rel: num(row[ci.v_rel]),
  v_inf: num(row[ci.v_inf]),
  h: num(row[ci.h]),
}));
writeFileSync(join(DATA, "close-approaches.json"), JSON.stringify(approaches));
console.log(`  -> bench/data/close-approaches.json  (${approaches.length} events)`);

// --- 3. comets (optional overlay) ---------------------------------------------
console.log("Fetching comets from SBDB Query API…");
const cometURL =
  "https://ssd-api.jpl.nasa.gov/sbdb_query.api?sb-kind=c&fields=" +
  encodeURIComponent(COMET_FIELDS.join(","));
const cometRes = await getJSON(cometURL);
const cidx = Object.fromEntries(cometRes.fields.map((f, i) => [f, i]));
const comets = cometRes.data.map((row) => {
  const o = {};
  for (const f of COMET_FIELDS) {
    let v = row[cidx[f]];
    if (typeof v === "string") v = v.trim();
    if (COMET_NUMERIC.has(f)) v = num(v);
    o[f] = v;
  }
  return o;
});
writeFileSync(join(DATA, "comets.json"), JSON.stringify(comets));
console.log(`  -> bench/data/comets.json  (${comets.length} objects)`);

// --- 4. sentry impact-risk (optional overlay) ---------------------------------
console.log("Fetching Sentry impact-risk summary…");
const sentryURL = "https://ssd-api.jpl.nasa.gov/sentry.api";
const sentryRes = await getJSON(sentryURL);
const SENTRY_NUMERIC = new Set([
  "ip", "ps_max", "ps_cum", "ts_max", "last_obs_jd", "h", "v_inf", "n_imp", "diameter",
]);
const sentry = sentryRes.data.map((r) => {
  const o = {};
  for (const k of Object.keys(r)) o[k] = SENTRY_NUMERIC.has(k) ? num(r[k]) : r[k];
  return o;
});
writeFileSync(join(DATA, "sentry.json"), JSON.stringify(sentry));
console.log(`  -> bench/data/sentry.json  (${sentry.length} objects)`);

// --- provenance ---------------------------------------------------------------
const provenance = {
  retrievedAt: new Date().toISOString(),
  epochNote: "Orbital elements share a common epoch (Julian date) per the SBDB snapshot.",
  sources: [
    { file: "asteroids.json", api: "NASA/JPL SBDB Query API", url: sbdbURL, count: asteroids.length },
    { file: "close-approaches.json", api: "NASA/JPL CAD API", url: cadURL, count: approaches.length },
    { file: "comets.json", api: "NASA/JPL SBDB Query API", url: cometURL, count: comets.length },
    { file: "sentry.json", api: "NASA/JPL CNEOS Sentry API", url: sentryURL, count: sentry.length },
    { file: "planets.json", source: "Static J2000 mean orbital elements (see build-planets.mjs)" },
  ],
};
writeFileSync(join(DATA, "provenance.json"), JSON.stringify(provenance, null, 2) + "\n");
console.log("  -> bench/data/provenance.json");
console.log("Done.");
