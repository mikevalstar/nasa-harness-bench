// Build-time data preprocessing: reads the read-only ../data/*.json snapshot
// and writes compact runtime assets into public/data/, which Vite copies
// verbatim into dist/data/. Never writes into ../data.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');
const OUT_DIR = path.join(ROOT, 'public', 'data');

if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

const DEG2RAD = Math.PI / 180;

function readJSON(name) {
  return JSON.parse(readFileSync(path.join(DATA_DIR, name), 'utf8'));
}

function writeJSON(name, data) {
  writeFileSync(path.join(OUT_DIR, name), JSON.stringify(data));
}

const CLASS_CODES = { APO: 0, ATE: 1, AMO: 2, IEO: 3 };
function classCode(cls) {
  return CLASS_CODES[cls] ?? 4;
}

// Standard absolute-magnitude -> diameter estimate (km), assuming a
// mid-range albedo of 0.14 when no measured diameter/albedo is available.
function estimateDiameter(H, albedo) {
  const p = albedo ?? 0.14;
  return (1329 / Math.sqrt(p)) * Math.pow(10, -H / 5);
}

// ---------------------------------------------------------------------------
// Planets — small, kept as plain JSON (degrees, as supplied).
// ---------------------------------------------------------------------------
const planets = readJSON('planets.json');
writeJSON('planets.json', planets);

// ---------------------------------------------------------------------------
// Asteroids (NEOs) — packed binary orbital elements for GPU propagation,
// plus a parallel metadata JSON (same index order) for search/filter/detail.
// ---------------------------------------------------------------------------
const asteroids = readJSON('asteroids.json');
const AST_STRIDE = 10; // a, e, i, om, w, ma, n, epoch, sizeKm, flags
const astBuf = new Float32Array(asteroids.length * AST_STRIDE);
const astMeta = new Array(asteroids.length);

asteroids.forEach((a, idx) => {
  const off = idx * AST_STRIDE;
  astBuf[off + 0] = a.a;
  astBuf[off + 1] = a.e;
  astBuf[off + 2] = a.i * DEG2RAD;
  astBuf[off + 3] = a.om * DEG2RAD;
  astBuf[off + 4] = a.w * DEG2RAD;
  astBuf[off + 5] = a.ma * DEG2RAD;
  astBuf[off + 6] = a.n * DEG2RAD;
  astBuf[off + 7] = a.epoch;
  const sizeKm = a.diameter != null ? a.diameter : a.H != null ? estimateDiameter(a.H, a.albedo) : 0.3;
  astBuf[off + 8] = sizeKm;
  astBuf[off + 9] = classCode(a.class) + (a.pha ? 8 : 0);

  astMeta[idx] = {
    full_name: a.full_name,
    pdes: a.pdes,
    name: a.name,
    class: a.class,
    pha: a.pha,
    spkid: a.spkid,
    moid: a.moid,
    H: a.H,
    diameter: a.diameter,
    albedo: a.albedo,
    rot_per: a.rot_per,
    spec_T: a.spec_T,
    first_obs: a.first_obs,
    q: a.q,
    ad: a.ad,
    per: a.per,
    tp: a.tp,
  };
});

writeFileSync(path.join(OUT_DIR, 'asteroids.bin'), Buffer.from(astBuf.buffer));
writeJSON('asteroids-meta.json', astMeta);
writeJSON('asteroids-index.json', {
  stride: AST_STRIDE,
  count: asteroids.length,
  fields: ['a', 'e', 'i', 'om', 'w', 'ma', 'n', 'epoch', 'sizeKm', 'flags'],
});

// ---------------------------------------------------------------------------
// Comets — propagated uniformly from (q, e, tp), which are always present
// (unlike a/ma/n, which are null for hyperbolic/parabolic orbits).
// ---------------------------------------------------------------------------
const comets = readJSON('comets.json');
const COMET_STRIDE = 7; // q, e, i, om, w, tp, sizeKm
const cometBuf = new Float32Array(comets.length * COMET_STRIDE);
const cometMeta = new Array(comets.length);

comets.forEach((c, idx) => {
  const off = idx * COMET_STRIDE;
  cometBuf[off + 0] = c.q;
  cometBuf[off + 1] = c.e;
  cometBuf[off + 2] = c.i * DEG2RAD;
  cometBuf[off + 3] = c.om * DEG2RAD;
  cometBuf[off + 4] = c.w * DEG2RAD;
  cometBuf[off + 5] = c.tp;
  cometBuf[off + 6] = c.diameter != null ? c.diameter : 5;

  cometMeta[idx] = {
    full_name: c.full_name,
    pdes: c.pdes,
    class: c.class,
    M1: c.M1,
    diameter: c.diameter,
    a: c.a,
    e: c.e,
    per: c.per,
    epoch: c.epoch,
  };
});

writeFileSync(path.join(OUT_DIR, 'comets.bin'), Buffer.from(cometBuf.buffer));
writeJSON('comets-meta.json', cometMeta);
writeJSON('comets-index.json', {
  stride: COMET_STRIDE,
  count: comets.length,
  fields: ['q', 'e', 'i', 'om', 'w', 'tp', 'sizeKm'],
});

// ---------------------------------------------------------------------------
// Close approaches — grouped by designation for O(1) join, trimmed fields.
// ---------------------------------------------------------------------------
const closeApproaches = readJSON('close-approaches.json');
const caByDes = Object.create(null);
for (const c of closeApproaches) {
  const list = caByDes[c.des] || (caByDes[c.des] = []);
  list.push([c.cd, c.jd, c.dist, c.v_rel]);
}
writeJSON('close-approaches.json', { fields: ['cd', 'jd', 'dist', 'v_rel'], byDes: caByDes });

// ---------------------------------------------------------------------------
// Sentry impact-risk — keyed by designation for O(1) join.
// ---------------------------------------------------------------------------
const sentry = readJSON('sentry.json');
const sentryByDes = Object.create(null);
for (const s of sentry) {
  sentryByDes[s.des] = {
    fullname: s.fullname,
    ip: s.ip,
    ps_cum: s.ps_cum,
    ps_max: s.ps_max,
    ts_max: s.ts_max,
    range: s.range,
    n_imp: s.n_imp,
    diameter: s.diameter,
    v_inf: s.v_inf,
    h: s.h,
    last_obs: s.last_obs,
  };
}
writeJSON('sentry.json', sentryByDes);

console.log(`Preprocessed ${asteroids.length} asteroids, ${comets.length} comets, ` +
  `${closeApproaches.length} close approaches, ${sentry.length} sentry entries -> ${OUT_DIR}`);
