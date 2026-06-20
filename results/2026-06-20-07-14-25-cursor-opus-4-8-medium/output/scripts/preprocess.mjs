// Build-time preprocessing: read the read-only data/ snapshot and emit compact,
// runtime-friendly assets into public/data/ (which Vite copies into dist/).
//
// - asteroids.bin: Float32 interleaved orbital elements (8 floats/object) for
//   GPU Kepler propagation. Compact (~1.3 MB) vs the 16 MB source JSON.
// - asteroids-meta.json: structure-of-arrays of display/filter fields.
// - comets.json: trimmed orbital elements for CPU propagation.
// - sentry.json: impact-risk map keyed by designation.
// - close-approaches.json: grouped-by-designation map (lazy-loaded by the UI).
// - planets.json: copied through unchanged.
//
// We never modify data/. Everything is written under public/data/.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const DATA = join(ROOT, "data");
const OUT = join(ROOT, "public", "data");

const J2000 = 2451545.0; // reference epoch; store JD relative to this for f32 precision
const DEG2RAD = Math.PI / 180;
const ELEMENTS_PER_AST = 8;

mkdirSync(OUT, { recursive: true });

function readJSON(name) {
  return JSON.parse(readFileSync(join(DATA, name), "utf8"));
}

function num(x) {
  return typeof x === "number" && isFinite(x) ? x : null;
}

// ---------------------------------------------------------------------------
// Asteroids
// ---------------------------------------------------------------------------
console.log("Processing asteroids…");
const asteroids = readJSON("asteroids.json");
const n = asteroids.length;

const bin = new Float32Array(n * ELEMENTS_PER_AST);
const meta = {
  count: n,
  full_name: new Array(n),
  pdes: new Array(n),
  name: new Array(n),
  cls: new Array(n),
  pha: new Uint8Array(n),
  neo: new Uint8Array(n),
  a: new Array(n),
  e: new Array(n),
  i: new Array(n),
  q: new Array(n),
  ad: new Array(n),
  per: new Array(n),
  moid: new Array(n),
  H: new Array(n),
  diameter: new Array(n),
  albedo: new Array(n),
};

for (let k = 0; k < n; k++) {
  const o = asteroids[k];
  const base = k * ELEMENTS_PER_AST;
  // mean motion: prefer provided n (deg/day), else derive from a.
  const meanMotionDeg =
    num(o.n) ?? (0.9856076686 / (o.a * Math.sqrt(o.a))); // Gaussian k in deg/day
  bin[base + 0] = o.a;
  bin[base + 1] = o.e;
  bin[base + 2] = o.i * DEG2RAD;
  bin[base + 3] = o.om * DEG2RAD;
  bin[base + 4] = o.w * DEG2RAD;
  bin[base + 5] = o.ma * DEG2RAD;
  bin[base + 6] = meanMotionDeg * DEG2RAD; // rad/day
  bin[base + 7] = o.epoch - J2000;

  meta.full_name[k] = o.full_name ?? o.pdes ?? String(o.spkid);
  meta.pdes[k] = o.pdes ?? null;
  meta.name[k] = o.name ?? null;
  meta.cls[k] = o.class ?? "?";
  meta.pha[k] = o.pha ? 1 : 0;
  meta.neo[k] = o.neo ? 1 : 0;
  meta.a[k] = num(o.a);
  meta.e[k] = num(o.e);
  meta.i[k] = num(o.i);
  meta.q[k] = num(o.q);
  meta.ad[k] = num(o.ad);
  meta.per[k] = num(o.per);
  meta.moid[k] = num(o.moid);
  meta.H[k] = num(o.H);
  meta.diameter[k] = num(o.diameter);
  meta.albedo[k] = num(o.albedo);
}

writeFileSync(join(OUT, "asteroids.bin"), Buffer.from(bin.buffer));
// Uint8Array -> plain array for JSON
const metaOut = {
  ...meta,
  pha: Array.from(meta.pha),
  neo: Array.from(meta.neo),
};
writeFileSync(join(OUT, "asteroids-meta.json"), JSON.stringify(metaOut));
console.log(`  ${n} asteroids -> asteroids.bin (${(bin.byteLength / 1e6).toFixed(2)} MB)`);

// ---------------------------------------------------------------------------
// Comets (trimmed; CPU-propagated at runtime, supports elliptic/hyperbolic/parabolic)
// ---------------------------------------------------------------------------
console.log("Processing comets…");
const comets = readJSON("comets.json")
  .map((c) => {
    const e = num(c.e);
    const q = num(c.q);
    if (e === null || q === null) return null;
    if (num(c.tp) === null) return null;
    return {
      full_name: c.full_name ?? c.pdes ?? "comet",
      pdes: c.pdes ?? null,
      cls: c.class ?? "?",
      e,
      q,
      i: num(c.i) ?? 0,
      om: num(c.om) ?? 0,
      w: num(c.w) ?? 0,
      tp: c.tp, // absolute JD (f64 precision is fine here)
      a: num(c.a), // may be null for parabolic/hyperbolic; runtime derives from q,e
      M1: num(c.M1),
      diameter: num(c.diameter),
    };
  })
  .filter(Boolean);
writeFileSync(join(OUT, "comets.json"), JSON.stringify(comets));
console.log(`  ${comets.length} comets`);

// ---------------------------------------------------------------------------
// Sentry impact-risk map (keyed by designation)
// ---------------------------------------------------------------------------
console.log("Processing sentry…");
const sentry = readJSON("sentry.json");
const sentryMap = {};
for (const s of sentry) {
  if (!s.des) continue;
  sentryMap[s.des] = {
    fullname: s.fullname ?? null,
    ip: num(s.ip),
    ps_cum: num(s.ps_cum),
    ps_max: num(s.ps_max),
    ts_max: num(s.ts_max),
    range: s.range ?? null,
    n_imp: num(s.n_imp),
    diameter: num(s.diameter),
    h: num(s.h),
    v_inf: num(s.v_inf),
  };
}
writeFileSync(join(OUT, "sentry.json"), JSON.stringify(sentryMap));
console.log(`  ${Object.keys(sentryMap).length} sentry objects`);

// ---------------------------------------------------------------------------
// Close approaches grouped by designation (lazy-loaded by detail view)
// ---------------------------------------------------------------------------
console.log("Processing close-approaches…");
const ca = readJSON("close-approaches.json");
const caMap = {};
for (const r of ca) {
  if (!r.des) continue;
  (caMap[r.des] ??= []).push({
    cd: r.cd,
    jd: num(r.jd),
    dist: num(r.dist),
    dist_min: num(r.dist_min),
    v_rel: num(r.v_rel),
  });
}
for (const k of Object.keys(caMap)) {
  caMap[k].sort((a, b) => (a.jd ?? 0) - (b.jd ?? 0));
}
writeFileSync(join(OUT, "close-approaches.json"), JSON.stringify(caMap));
console.log(`  ${ca.length} approaches across ${Object.keys(caMap).length} objects`);

// ---------------------------------------------------------------------------
// Planets (copied through; tiny)
// ---------------------------------------------------------------------------
const planets = readJSON("planets.json");
writeFileSync(join(OUT, "planets.json"), JSON.stringify(planets));
console.log(`  ${planets.length} planets`);

console.log("Preprocessing complete.");
