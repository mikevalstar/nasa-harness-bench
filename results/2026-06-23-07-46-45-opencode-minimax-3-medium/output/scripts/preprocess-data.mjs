#!/usr/bin/env node
// Preprocess the raw JSON data into compact, runtime-friendly forms.
// Writes to public/data/ which Vite then serves and is copied to dist/data/.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DATA_IN = join(ROOT, 'data');
const DATA_OUT = join(ROOT, 'public', 'data');

mkdirSync(DATA_OUT, { recursive: true });

function readJson(name) {
  const p = join(DATA_IN, name);
  const t = process.hrtime.bigint();
  const v = JSON.parse(readFileSync(p, 'utf8'));
  const ms = Number(process.hrtime.bigint() - t) / 1e6;
  console.log(`  read ${name} (${(readFileSync(p).length / 1e6).toFixed(2)} MB) in ${ms.toFixed(0)} ms`);
  return v;
}

function writeJson(name, v) {
  const p = join(DATA_OUT, name);
  writeFileSync(p, JSON.stringify(v));
  console.log(`  wrote ${name} (${(readFileSync(p).length / 1e6).toFixed(2)} MB)`);
}

// Compact each asteroid down to the fields the runtime actually needs.
// Storing as a flat array of objects keeps the file easy to load + parse,
// while removing the unused/large fields slashes the wire size.
console.log('Preprocessing data...');

const rawAsteroids = readJson('asteroids.json');

// Helper to only include non-null fields.
function trimNulls(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== null && v !== undefined) out[k] = v;
  }
  return out;
}

// Phases:
//  1. minimal — used for the main asteroid cloud + propagation
//  2. index by pdes — used to join close-approaches & sentry at runtime
const minimal = new Array(rawAsteroids.length);
for (let i = 0; i < rawAsteroids.length; i++) {
  const r = rawAsteroids[i];
  minimal[i] = trimNulls({
    pdes: r.pdes,
    full_name: r.full_name ?? r.pdes,
    name: r.name,
    spkid: r.spkid,
    neo: !!r.neo,
    pha: !!r.pha,
    class: r.class,
    a: r.a,
    e: r.e,
    i: r.i,
    om: r.om,
    w: r.w,
    ma: r.ma,
    epoch: r.epoch,
    n: r.n,
    q: r.q,
    ad: r.ad,
    per: r.per,
    moid: r.moid,
    H: r.H,
    diameter: r.diameter,
    albedo: r.albedo,
    rot_per: r.rot_per,
    spec_B: r.spec_B,
    spec_T: r.spec_T,
    first_obs: r.first_obs,
  });
}
writeJson('asteroids.min.json', minimal);

// Group close-approaches by pdes for fast lookup. Sorted by JD asc.
// We drop the `cd` (calendar date string) since we can reformat from `jd`.
const rawCA = readJson('close-approaches.json');
const caByPdes = new Map();
for (let i = 0; i < rawCA.length; i++) {
  const r = rawCA[i];
  if (!r.des) continue;
  if (!caByPdes.has(r.des)) caByPdes.set(r.des, []);
  const arr = caByPdes.get(r.des);
  // Keep only fields we display; drop everything else.
  arr.push({
    j: r.jd,
    d: r.dist,
    dn: r.dist_min,
    dx: r.dist_max,
    v: r.v_rel,
    h: r.h,
  });
}
// Sort each by jd
for (const arr of caByPdes.values()) {
  arr.sort((a, b) => a.j - b.j);
}
writeJson('close-approaches.min.json', Object.fromEntries(caByPdes));

// Index sentry by des (which is the asteroid pdes). Drop nulls.
const rawSentry = readJson('sentry.json');
const sentryByPdes = {};
for (const r of rawSentry) {
  if (!r.des) continue;
  sentryByPdes[r.des] = trimNulls({
    id: r.id,
    fullname: r.fullname,
    ip: r.ip,
    ps_cum: r.ps_cum,
    ps_max: r.ps_max,
    ts_max: r.ts_max,
    range: r.range,
    n_imp: r.n_imp,
    diameter: r.diameter,
    h: r.h,
    v_inf: r.v_inf,
    last_obs: r.last_obs,
    last_obs_jd: r.last_obs_jd,
  });
}
writeJson('sentry.min.json', sentryByPdes);

// Comets — same field structure, but use tp for hyperbolic/parabolic bodies.
const rawComets = readJson('comets.json');
const comets = rawComets.map((r) => trimNulls({
  pdes: r.pdes,
  full_name: r.full_name ?? r.pdes,
  name: r.name,
  class: r.class,
  e: r.e,
  a: r.a,
  q: r.q,
  i: r.i,
  om: r.om,
  w: r.w,
  ma: r.ma,
  tp: r.tp,
  per: r.per,
  n: r.n,
  epoch: r.epoch,
  M1: r.M1,
  diameter: r.diameter,
}));
writeJson('comets.min.json', comets);

// Planets — already small but strip unused keys.
const rawPlanets = readJson('planets.json');
writeJson('planets.min.json', rawPlanets);

console.log('Preprocessing complete.');
