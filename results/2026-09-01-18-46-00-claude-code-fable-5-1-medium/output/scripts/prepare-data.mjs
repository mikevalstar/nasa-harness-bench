// Build step: packs the read-only snapshot in ../data into compact runtime files
// under ../public/data (Vite copies them into dist/data).
//
// Output:
//   asteroids.bin   Float32Array, STRIDE floats per object (see layout below)
//   asteroids.json  columnar metadata for search / detail views
//   approaches.json columnar close-approach list sorted by Julian date
//   sentry.json     Sentry rows with the matching asteroid index
//   comets.json     comet rows with perifocal basis vectors precomputed
//   planets.json    copied as-is
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'data');
const out = join(root, 'public', 'data');
mkdirSync(out, { recursive: true });

const read = (f) => JSON.parse(readFileSync(join(src, f), 'utf8'));
const write = (f, v) => writeFileSync(join(out, f), typeof v === 'string' || Buffer.isBuffer(v) ? v : JSON.stringify(v));

const DEG = Math.PI / 180;
export const J2000 = 2451545.0;
/** Gaussian gravitational constant: mean motion (rad/day) of a body with a = 1 au. */
const K = 0.01720209895;

/** Perifocal basis (P along perihelion, Q 90° ahead in the orbital plane) in ecliptic xyz. */
function perifocal(i, om, w) {
  const ci = Math.cos(i), si = Math.sin(i);
  const co = Math.cos(om), so = Math.sin(om);
  const cw = Math.cos(w), sw = Math.sin(w);
  return {
    P: [co * cw - so * sw * ci, so * cw + co * sw * ci, sw * si],
    Q: [-co * sw - so * cw * ci, -so * sw + co * cw * ci, cw * si],
  };
}

const CLASSES = ['APO', 'ATE', 'AMO', 'IEO', 'HTC', 'ETc', 'JFc', 'JFC', 'CTc', 'COM', 'PAR', 'HYP'];
const classIdx = (c) => {
  const k = CLASSES.indexOf(c);
  if (k < 0) throw new Error(`unknown class ${c}`);
  return k;
};

// ---------------------------------------------------------------- asteroids
const asteroids = read('asteroids.json');
const sentry = read('sentry.json');
const approaches = read('close-approaches.json');
const byPdes = new Map(asteroids.map((a, i) => [a.pdes, i]));

const sentryIdx = new Set();
for (const s of sentry) if (byPdes.has(s.des)) sentryIdx.add(byPdes.get(s.des));
const approachIdx = new Set();
for (const c of approaches) if (byPdes.has(c.des)) approachIdx.add(byPdes.get(c.des));

// Layout per object (floats):
//  0 a (au)   1 e   2 ma (rad)   3 n (rad/day)   4 epoch - J2000 (days)
//  5 H (99 if unknown)   6 moid (-1 if unknown)   7 diameter km (-1 if unknown)
//  8..10 P   11..13 Q   14 flags (1=pha, 2=sentry, 4=has approach)   15 class index
const STRIDE = 16;
const bin = new Float32Array(asteroids.length * STRIDE);
const meta = {
  classes: CLASSES,
  pdes: [], full_name: [], name: [], spkid: [], class: [],
  i: [], om: [], w: [], q: [], ad: [], per: [], tp: [], epoch: [],
  albedo: [], rot_per: [], spec_B: [], spec_T: [], first_obs: [], G: [],
};
asteroids.forEach((o, k) => {
  const { P, Q } = perifocal(o.i * DEG, o.om * DEG, o.w * DEG);
  const n = (o.n ?? (K / Math.sqrt(o.a ** 3)) / DEG) * DEG;
  const b = k * STRIDE;
  bin[b + 0] = o.a;
  bin[b + 1] = o.e;
  bin[b + 2] = o.ma * DEG;
  bin[b + 3] = n;
  bin[b + 4] = o.epoch - J2000;
  bin[b + 5] = o.H ?? 99;
  bin[b + 6] = o.moid ?? -1;
  bin[b + 7] = o.diameter ?? -1;
  bin.set(P, b + 8);
  bin.set(Q, b + 11);
  bin[b + 14] = (o.pha ? 1 : 0) | (sentryIdx.has(k) ? 2 : 0) | (approachIdx.has(k) ? 4 : 0);
  bin[b + 15] = classIdx(o.class);
  for (const f of Object.keys(meta)) if (f !== 'classes') meta[f].push(o[f] ?? null);
});
write('asteroids.bin', Buffer.from(bin.buffer));
write('asteroids.json', meta);

// ---------------------------------------------------------------- approaches
const rows = approaches
  .filter((c) => byPdes.has(c.des))
  .sort((x, y) => x.jd - y.jd);
const r = (v, d) => Number(v.toFixed(d));
write('approaches.json', {
  idx: rows.map((c) => byPdes.get(c.des)),
  jd: rows.map((c) => r(c.jd, 4)),
  dist: rows.map((c) => r(c.dist, 6)),
  dmin: rows.map((c) => r(c.dist_min, 6)),
  dmax: rows.map((c) => r(c.dist_max, 6)),
  vrel: rows.map((c) => r(c.v_rel, 2)),
});

// ---------------------------------------------------------------- sentry
write(
  'sentry.json',
  sentry
    .filter((s) => byPdes.has(s.des))
    .map((s) => ({
      idx: byPdes.get(s.des),
      ip: s.ip, ps_cum: s.ps_cum, ps_max: s.ps_max, ts_max: s.ts_max,
      range: s.range, n_imp: s.n_imp, diameter: s.diameter ?? null,
      v_inf: s.v_inf ?? null, last_obs: s.last_obs ?? null,
    })),
);

// ---------------------------------------------------------------- comets
const comets = read('comets.json').map((c) => {
  const { P, Q } = perifocal(c.i * DEG, c.om * DEG, c.w * DEG);
  return {
    full_name: c.full_name, pdes: c.pdes, class: c.class,
    e: c.e, q: c.q, a: c.a ?? null, i: c.i, om: c.om, w: c.w,
    tp: c.tp, epoch: c.epoch, per: c.per ?? null,
    M1: c.M1 ?? null, diameter: c.diameter ?? null,
    P: P.map((v) => r(v, 6)), Q: Q.map((v) => r(v, 6)),
  };
});
write('comets.json', comets);

// ---------------------------------------------------------------- planets
write('planets.json', read('planets.json'));

console.log(
  `prepared ${asteroids.length} asteroids, ${rows.length} approaches, ${sentry.length} sentry rows, ${comets.length} comets -> public/data`,
);
