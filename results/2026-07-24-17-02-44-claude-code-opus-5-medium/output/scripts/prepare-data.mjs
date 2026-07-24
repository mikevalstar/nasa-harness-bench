/**
 * Build-time data preparation.
 *
 * Reads the read-only snapshot in ../data and emits a compact, runtime-friendly
 * copy into ../public/data (which Vite copies verbatim into dist/data).
 *
 * Nothing here modifies the source data. Binary output is little-endian
 * (every platform the browser runs on in practice).
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SRC = join(ROOT, 'data');
const OUT = join(ROOT, 'public', 'data');

const J2000 = 2451545.0;

const read = (f) => JSON.parse(readFileSync(join(SRC, f), 'utf8'));
const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : NaN);

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

const report = [];
const writeBin = (name, arr) => {
  writeFileSync(join(OUT, name), Buffer.from(arr.buffer, arr.byteOffset, arr.byteLength));
  report.push(`${name.padEnd(28)} ${(arr.byteLength / 1024).toFixed(0).padStart(7)} KB`);
};
const writeJson = (name, obj) => {
  const s = JSON.stringify(obj);
  writeFileSync(join(OUT, name), s);
  report.push(`${name.padEnd(28)} ${(Buffer.byteLength(s) / 1024).toFixed(0).padStart(7)} KB`);
};

/* ------------------------------------------------------------------ planets */

const planetsRaw = read('planets.json');
const planets = planetsRaw.map((p) => ({
  name: p.name,
  a: p.a,
  e: p.e,
  i: p.i,
  om: p.om,
  w: p.w,
  ma: p.ma,
  n: p.n,
  per: p.per,
  epoch0: p.epoch - J2000,
  radius_km: p.radius_km,
}));
writeJson('planets.json', planets);

/* ---------------------------------------------------------------- asteroids */

const asteroids = read('asteroids.json');
const N = asteroids.length;

// Orbit columns consumed directly by the GPU (Kepler is solved in the shader).
const ORB_COLS = 8; // a, e, i, om, w, ma, n, epoch0
const orb = new Float32Array(N * ORB_COLS);
// Physical / derived columns used by filters + the detail panel.
const PHYS_COLS = 8; // H, diameter(km, estimated when unknown), moid, q, ad, per, albedo, tp0
const phys = new Float32Array(N * PHYS_COLS);
// pha, classIdx, flags(bit0 = diameter measured, bit1 = has sentry entry)
const flags = new Uint8Array(N * 3);
// close-approach slice into the approaches table
const caOffset = new Uint32Array(N);
const caCount = new Uint16Array(N);

const classList = [];
const classIndex = new Map();
const classIdxOf = (c) => {
  const k = c || 'UNK';
  let idx = classIndex.get(k);
  if (idx === undefined) {
    idx = classList.length;
    classList.push(k);
    classIndex.set(k, idx);
  }
  return idx;
};

const names = new Array(N);
const pdesArr = new Array(N);
const specArr = new Array(N);
const firstObs = new Array(N);
const pdesToRow = new Map();

/** Standard NEO size estimate from absolute magnitude + albedo (km). */
function estimateDiameter(H, albedo) {
  if (!Number.isFinite(H)) return NaN;
  const p = Number.isFinite(albedo) && albedo > 0 ? albedo : 0.14;
  return (1329 / Math.sqrt(p)) * Math.pow(10, -0.2 * H);
}

let dropped = 0;
for (let k = 0; k < N; k++) {
  const o = asteroids[k];
  const a = num(o.a);
  const e = num(o.e);
  if (!(a > 0) || !(e >= 0 && e < 1)) dropped++; // all closed in this snapshot; guarded anyway

  // mean motion: prefer the published value, else derive from a (Gauss' constant)
  let n = num(o.n);
  if (!Number.isFinite(n) && a > 0) n = 0.9856076686 / (a * Math.sqrt(a));

  const b = k * ORB_COLS;
  orb[b + 0] = a;
  orb[b + 1] = e;
  orb[b + 2] = num(o.i);
  orb[b + 3] = num(o.om);
  orb[b + 4] = num(o.w);
  orb[b + 5] = num(o.ma);
  orb[b + 6] = n;
  orb[b + 7] = num(o.epoch) - J2000;

  const H = num(o.H);
  const albedo = num(o.albedo);
  const measured = Number.isFinite(num(o.diameter));
  const p = k * PHYS_COLS;
  phys[p + 0] = H;
  phys[p + 1] = measured ? o.diameter : estimateDiameter(H, albedo);
  phys[p + 2] = num(o.moid);
  phys[p + 3] = num(o.q);
  phys[p + 4] = num(o.ad);
  phys[p + 5] = num(o.per);
  phys[p + 6] = albedo;
  phys[p + 7] = num(o.tp) - J2000;

  flags[k * 3 + 0] = o.pha ? 1 : 0;
  flags[k * 3 + 1] = classIdxOf(o.class);
  flags[k * 3 + 2] = measured ? 1 : 0;

  names[k] = o.name || o.full_name || o.pdes || '';
  pdesArr[k] = o.pdes || '';
  specArr[k] = o.spec_B || o.spec_T || '';
  firstObs[k] = o.first_obs || '';
  if (o.pdes && !pdesToRow.has(o.pdes)) pdesToRow.set(o.pdes, k);
}

// A short, human display name: "433 Eros" / "(2019 AB3)"
const display = new Array(N);
for (let k = 0; k < N; k++) {
  const o = asteroids[k];
  display[k] = o.name ? `${o.pdes} ${o.name}` : o.full_name ? o.full_name.replace(/[()]/g, '') : o.pdes;
}

/* ------------------------------------------------------- close approaches */

const ca = read('close-approaches.json');
const caRows = [];
let caUnmatched = 0;
for (const r of ca) {
  const row = pdesToRow.get(r.des);
  if (row === undefined) {
    caUnmatched++;
    continue;
  }
  caRows.push([row, num(r.jd) - J2000, num(r.dist), num(r.dist_min), num(r.v_rel)]);
}
// group by asteroid, chronological within a group
caRows.sort((x, y) => x[0] - y[0] || x[1] - y[1]);

const M = caRows.length;
const caJd = new Float64Array(M);
const caData = new Float32Array(M * 3); // dist, dist_min, v_rel
const caRow = new Uint32Array(M);
for (let j = 0; j < M; j++) {
  const [row, jd0, dist, dmin, v] = caRows[j];
  caRow[j] = row;
  caJd[j] = jd0;
  caData[j * 3 + 0] = dist;
  caData[j * 3 + 1] = dmin;
  caData[j * 3 + 2] = v;
  if (caCount[row] === 0) caOffset[row] = j;
  if (caCount[row] < 65535) caCount[row]++;
}

/* ------------------------------------------------------------------ sentry */

const sentryRaw = read('sentry.json');
const sentry = [];
for (const s of sentryRaw) {
  const row = pdesToRow.has(s.des) ? pdesToRow.get(s.des) : -1;
  if (row >= 0) flags[row * 3 + 2] |= 2;
  sentry.push({
    row,
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
  });
}
sentry.sort((a, b) => (b.ps_cum ?? -99) - (a.ps_cum ?? -99));

/* ------------------------------------------------------------------ comets */

const comets = read('comets.json');
const C = comets.length;
const CORB = 10; // e, a, q, i, om, w, ma, n, epoch0, tp0
const corb = new Float32Array(C * CORB);
const cflags = new Uint8Array(C); // classIdx
const cclassList = [];
const cclassIndex = new Map();
const cnames = new Array(C);
const cpdes = new Array(C);
const cmag = new Float32Array(C * 2); // M1, diameter

for (let k = 0; k < C; k++) {
  const o = comets[k];
  const b = k * CORB;
  corb[b + 0] = num(o.e);
  corb[b + 1] = num(o.a);
  corb[b + 2] = num(o.q);
  corb[b + 3] = num(o.i);
  corb[b + 4] = num(o.om);
  corb[b + 5] = num(o.w);
  corb[b + 6] = num(o.ma);
  corb[b + 7] = num(o.n);
  corb[b + 8] = num(o.epoch) - J2000;
  corb[b + 9] = num(o.tp) - J2000;
  const key = o.class || 'UNK';
  if (!cclassIndex.has(key)) {
    cclassIndex.set(key, cclassList.length);
    cclassList.push(key);
  }
  cflags[k] = cclassIndex.get(key);
  cnames[k] = o.full_name || o.pdes || '';
  cpdes[k] = o.pdes || '';
  cmag[k * 2 + 0] = num(o.M1);
  cmag[k * 2 + 1] = num(o.diameter);
}

/* ------------------------------------------------------------------- emit */

writeBin('asteroids.orb.f32', orb);
writeBin('asteroids.phys.f32', phys);
writeBin('asteroids.flags.u8', flags);
writeBin('asteroids.caoff.u32', caOffset);
writeBin('asteroids.cacount.u16', caCount);
writeJson('asteroids.meta.json', {
  count: N,
  classes: classList,
  display,
  name: names,
  pdes: pdesArr,
  spec: specArr,
  first_obs: firstObs,
});

writeBin('approaches.jd.f64', caJd);
writeBin('approaches.data.f32', caData);
writeBin('approaches.row.u32', caRow);
writeJson('approaches.meta.json', { count: M });

writeJson('sentry.json', sentry);

writeBin('comets.orb.f32', corb);
writeBin('comets.flags.u8', cflags);
writeBin('comets.mag.f32', cmag);
writeJson('comets.meta.json', { count: C, classes: cclassList, name: cnames, pdes: cpdes });

writeJson('provenance.json', read('provenance.json'));

console.log(`prepare-data: ${N} asteroids, ${C} comets, ${M} approaches matched (${caUnmatched} unmatched dropped), ${sentry.length} sentry rows`);
if (dropped) console.log(`prepare-data: ${dropped} asteroid(s) with non-elliptical/invalid elements flagged`);
console.log(report.join('\n'));
