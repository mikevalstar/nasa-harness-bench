// Build-time preprocessing: converts the read-only JSON in data/ into compact
// binary + columnar files under public/gen/ that the app fetches at runtime.
// data/ itself is never modified.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DATA = path.join(ROOT, 'data');
const OUT = path.join(ROOT, 'public', 'gen');
fs.mkdirSync(OUT, { recursive: true });

const read = (f) => JSON.parse(fs.readFileSync(path.join(DATA, f), 'utf8'));
const write = (f, buf) => fs.writeFileSync(path.join(OUT, f), buf);
const writeJson = (f, obj) => write(f, JSON.stringify(obj));

const DEG = Math.PI / 180;
const J2000 = 2451545.0;

console.log('Reading data/ ...');
const asteroids = read('asteroids.json');
const planets = read('planets.json');
const comets = read('comets.json');
const sentry = read('sentry.json');
const approaches = read('close-approaches.json');

// ---------- asteroids ----------
// Per-asteroid float layout (14 floats):
// [a, e, ma(rad), n(rad/day), epoch-J2000, Px,Py,Pz, Qx,Qy,Qz, H, diameter, moid]
const N = asteroids.length;
const FLOATS = 14;
const f32 = new Float32Array(N * FLOATS);
const flags = new Uint8Array(N); // bit0 pha, bit1 sentry, bit2 named
const clsIdx = new Uint8Array(N);

const sentryByDes = new Map(sentry.map((s) => [s.des, s]));
const classes = [...new Set(asteroids.map((x) => x.class))].sort();
const clsMap = new Map(classes.map((c, i) => [c, i]));

const pdes = new Array(N);
const label = new Array(N);

for (let i = 0; i < N; i++) {
  const A = asteroids[i];
  const o = i * FLOATS;
  const w = A.w * DEG, om = A.om * DEG, inc = A.i * DEG;
  const cw = Math.cos(w), sw = Math.sin(w);
  const co = Math.cos(om), so = Math.sin(om);
  const ci = Math.cos(inc), si = Math.sin(inc);
  f32[o] = A.a;
  f32[o + 1] = A.e;
  f32[o + 2] = A.ma * DEG;
  f32[o + 3] = A.n * DEG;
  f32[o + 4] = A.epoch - J2000;
  // P = orbital-plane x axis, Q = y axis, in ecliptic frame
  f32[o + 5] = cw * co - sw * so * ci;
  f32[o + 6] = cw * so + sw * co * ci;
  f32[o + 7] = sw * si;
  f32[o + 8] = -sw * co - cw * so * ci;
  f32[o + 9] = -sw * so + cw * co * ci;
  f32[o + 10] = cw * si;
  f32[o + 11] = A.H == null ? 99 : A.H;
  f32[o + 12] = A.diameter == null ? -1 : A.diameter;
  f32[o + 13] = A.moid == null ? -1 : A.moid;
  flags[i] =
    (A.pha ? 1 : 0) | (sentryByDes.has(A.pdes) ? 2 : 0) | (A.name ? 4 : 0);
  clsIdx[i] = clsMap.get(A.class);
  pdes[i] = A.pdes;
  label[i] = A.full_name.trim();
}
write('asteroids.f32', Buffer.from(f32.buffer));
write('asteroids.flags.u8', Buffer.from(flags.buffer));
write('asteroids.class.u8', Buffer.from(clsIdx.buffer));
writeJson('meta.json', { count: N, classes, pdes, label });

// Lazily-loaded detail columns (rounded to keep size down)
const r = (x, d) => (x == null ? null : Math.round(x * 10 ** d) / 10 ** d);
writeJson('details.json', {
  i: asteroids.map((A) => r(A.i, 3)),
  om: asteroids.map((A) => r(A.om, 3)),
  w: asteroids.map((A) => r(A.w, 3)),
  q: asteroids.map((A) => r(A.q, 4)),
  ad: asteroids.map((A) => r(A.ad, 4)),
  per: asteroids.map((A) => r(A.per, 1)),
  epoch: asteroids.map((A) => A.epoch),
  albedo: asteroids.map((A) => A.albedo),
  rot: asteroids.map((A) => A.rot_per),
  spec: asteroids.map((A) => A.spec_B ?? A.spec_T),
  firstObs: asteroids.map((A) => A.first_obs),
});

// ---------- close approaches ----------
// Sorted by jd. Parallel arrays: f32 triplets [jd-J2000, dist(au), v_rel] + u32 asteroid index.
const desToIdx = new Map(pdes.map((d, i) => [d, i]));
const ca = approaches
  .filter((e) => desToIdx.has(e.des))
  .sort((x, y) => x.jd - y.jd);
const caF = new Float32Array(ca.length * 3);
const caI = new Uint32Array(ca.length);
for (let i = 0; i < ca.length; i++) {
  caF[i * 3] = ca[i].jd - J2000;
  caF[i * 3 + 1] = ca[i].dist;
  caF[i * 3 + 2] = ca[i].v_rel;
  caI[i] = desToIdx.get(ca[i].des);
}
write('approaches.f32', Buffer.from(caF.buffer));
write('approaches.u32', Buffer.from(caI.buffer));

// ---------- sentry ----------
const sentryOut = {};
for (const s of sentry) {
  sentryOut[s.des] = {
    ip: s.ip,
    ps_cum: s.ps_cum,
    ps_max: s.ps_max,
    ts_max: s.ts_max,
    range: s.range,
    n_imp: s.n_imp,
    v_inf: r(s.v_inf, 2),
    diameter: s.diameter,
    last_obs: s.last_obs,
  };
}
writeJson('sentry.json', sentryOut);

// ---------- comets ----------
writeJson(
  'comets.json',
  comets.map((c) => ({
    label: c.full_name.trim(),
    pdes: c.pdes,
    cls: c.class,
    e: c.e, a: c.a, q: c.q, i: c.i, om: c.om, w: c.w,
    ma: c.ma, tp: c.tp, per: c.per, n: c.n, epoch: c.epoch,
    M1: c.M1, diameter: c.diameter,
  }))
);

// ---------- planets ----------
writeJson('planets.json', planets);

console.log(
  `Wrote ${N} asteroids, ${ca.length} approaches, ${comets.length} comets, ` +
    `${sentry.length} sentry rows to public/gen/`
);
