// Build-time data preparation.
// Reads the READ-ONLY data/ directory and emits compact, UI-ready assets into public/
// (which Vite copies verbatim into dist/). Nothing in data/ is modified.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DATA = join(ROOT, 'data');
const OUT = join(ROOT, 'public');

const J2000 = 2451545; // base Julian date; epoch offsets stay small for float32 precision
const DEG2RAD = Math.PI / 180;

if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

const read = (f) => JSON.parse(readFileSync(join(DATA, f), 'utf8'));

console.log('[prepare-data] reading source files...');
const asteroids = read('asteroids.json');
const comets = read('comets.json');
const sentry = read('sentry.json');
const closeApproaches = read('close-approaches.json');
const planets = read('planets.json');

// Planets are tiny; copy verbatim for runtime fetch.
writeFileSync(join(OUT, 'planets.json'), JSON.stringify(planets));

// ---------------------------------------------------------------------------
// Asteroids -> packed Float32 orbit buffer + index-aligned metadata arrays
// ---------------------------------------------------------------------------
console.log(`[prepare-data] packing ${asteroids.length} asteroids...`);
const N = asteroids.length;
const STRIDE = 8; // a, e, i, om, w, ma, n(rad/day), epochOffset
const orbits = new Float32Array(N * STRIDE);

const meta = {
  count: N,
  spkid: new Array(N),
  pdes: new Array(N),
  name: new Array(N),
  full_name: new Array(N),
  class: new Array(N),
  pha: new Uint8Array(N),
  neo: new Uint8Array(N),
  H: new Array(N),
  diameter: new Array(N),
  albedo: new Array(N),
  moid: new Array(N),
  q: new Array(N),
  ad: new Array(N),
  per: new Array(N),
  a: new Array(N),
  e: new Array(N),
  i: new Array(N),
  first_obs: new Array(N),
  rot_per: new Array(N),
  spec: new Array(N),
};

// Gaussian gravitational constant in deg/day for n = k / a^1.5 (heliocentric)
const GAUSS_DEG = 0.9856076686;

for (let k = 0; k < N; k++) {
  const o = asteroids[k];
  const a = o.a;
  const e = o.e;
  let n = o.n; // deg/day
  if (n == null) n = GAUSS_DEG / Math.pow(a, 1.5);
  const base = k * STRIDE;
  orbits[base + 0] = a;
  orbits[base + 1] = e;
  orbits[base + 2] = o.i * DEG2RAD;
  orbits[base + 3] = o.om * DEG2RAD;
  orbits[base + 4] = o.w * DEG2RAD;
  orbits[base + 5] = o.ma * DEG2RAD;
  orbits[base + 6] = n * DEG2RAD; // rad/day
  orbits[base + 7] = o.epoch - J2000;

  meta.spkid[k] = o.spkid;
  meta.pdes[k] = o.pdes;
  meta.name[k] = o.name;
  meta.full_name[k] = o.full_name;
  meta.class[k] = o.class;
  meta.pha[k] = o.pha ? 1 : 0;
  meta.neo[k] = o.neo ? 1 : 0;
  meta.H[k] = o.H;
  meta.diameter[k] = o.diameter;
  meta.albedo[k] = o.albedo;
  meta.moid[k] = o.moid;
  meta.q[k] = o.q;
  meta.ad[k] = o.ad;
  meta.per[k] = o.per;
  meta.a[k] = a;
  meta.e[k] = e;
  meta.i[k] = o.i;
  meta.first_obs[k] = o.first_obs;
  meta.rot_per[k] = o.rot_per;
  meta.spec[k] = o.spec_B || o.spec_T || null;
}

writeFileSync(join(OUT, 'ast-orbits.f32'), Buffer.from(orbits.buffer));

// pha/neo are typed arrays -> convert to plain arrays for JSON
const metaOut = { ...meta, pha: Array.from(meta.pha), neo: Array.from(meta.neo) };
writeFileSync(join(OUT, 'ast-meta.json'), JSON.stringify(metaOut));

// ---------------------------------------------------------------------------
// Comets -> trimmed element list (CPU-propagated at runtime, handles e>=1)
// ---------------------------------------------------------------------------
console.log(`[prepare-data] packing ${comets.length} comets...`);
const cometsOut = comets.map((c) => ({
  full_name: c.full_name,
  pdes: c.pdes,
  class: c.class,
  e: c.e,
  a: c.a,
  q: c.q,
  i: c.i,
  om: c.om,
  w: c.w,
  ma: c.ma,
  tp: c.tp,
  per: c.per,
  n: c.n,
  epoch: c.epoch,
  M1: c.M1,
  diameter: c.diameter,
}));
writeFileSync(join(OUT, 'comets.json'), JSON.stringify(cometsOut));

// ---------------------------------------------------------------------------
// Sentry impact-risk -> trimmed, keyed lookup happens at runtime by `des`
// ---------------------------------------------------------------------------
console.log(`[prepare-data] packing ${sentry.length} sentry rows...`);
const sentryOut = sentry.map((s) => ({
  des: s.des,
  fullname: s.fullname,
  ip: s.ip,
  ps_cum: s.ps_cum,
  ps_max: s.ps_max,
  ts_max: s.ts_max,
  range: s.range,
  n_imp: s.n_imp,
  diameter: s.diameter,
  h: s.h,
  v_inf: s.v_inf,
  last_obs: s.last_obs,
}));
writeFileSync(join(OUT, 'sentry.json'), JSON.stringify(sentryOut));

// ---------------------------------------------------------------------------
// Close approaches -> grouped by designation (lazy-loaded on demand in UI)
// ---------------------------------------------------------------------------
console.log(`[prepare-data] grouping ${closeApproaches.length} close approaches...`);
const caByDes = {};
for (const e of closeApproaches) {
  (caByDes[e.des] ||= []).push({
    cd: e.cd,
    jd: e.jd,
    dist: e.dist,
    dist_min: e.dist_min,
    dist_max: e.dist_max,
    v_rel: e.v_rel,
    v_inf: e.v_inf,
    h: e.h,
  });
}
for (const des of Object.keys(caByDes)) {
  caByDes[des].sort((x, y) => x.jd - y.jd);
}
writeFileSync(join(OUT, 'ca-grouped.json'), JSON.stringify(caByDes));

// A small precomputed "closest approaches" list for the highlights panel.
const notable = closeApproaches
  .map((e) => ({ des: e.des, jd: e.jd, cd: e.cd, dist: e.dist, v_rel: e.v_rel, h: e.h }))
  .sort((a, b) => a.dist - b.dist)
  .slice(0, 500);
writeFileSync(join(OUT, 'ca-notable.json'), JSON.stringify(notable));

// ---------------------------------------------------------------------------
// Manifest
// ---------------------------------------------------------------------------
writeFileSync(
  join(OUT, 'meta.json'),
  JSON.stringify({
    baseJD: J2000,
    asteroidCount: N,
    cometCount: comets.length,
    sentryCount: sentry.length,
    closeApproachCount: closeApproaches.length,
    generatedAt: new Date().toISOString(),
  })
);

console.log('[prepare-data] done. wrote assets into public/');
