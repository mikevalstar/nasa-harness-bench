// Pre-processes the raw JSON in data/ into compact, load-optimized files in public/data/.
// The raw dataset is read-only; everything the UI needs is emitted here and copied
// into dist/ by vite's public-dir handling.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'data');
const out = join(root, 'public', 'data');
mkdirSync(out, { recursive: true });

const EPOCH_REF = 2460000.0; // reference epoch; element epochs stored as offsets from this
const CLASS_IDX = { APO: 0, ATE: 1, AMO: 2, IEO: 3 };
const AU_KM = 149597870.7;

const r = (p) => JSON.parse(readFileSync(join(src, p), 'utf8'));

// ---- asteroids ------------------------------------------------------------
const asteroids = r('asteroids.json');
const sentry = r('sentry.json');
const sentryDes = new Set(sentry.map((s) => s.des));

const N = asteroids.length;
const STRIDE = 12;
const bin = new Float32Array(N * STRIDE);
const names = new Array(N);
const pdes = new Array(N);
const details = new Array(N);

// diameter estimate from absolute magnitude, assumed albedo 0.14
const estDiam = (H) => (1329 / Math.sqrt(0.14)) * Math.pow(10, -H / 5);

for (let k = 0; k < N; k++) {
  const o = asteroids[k];
  const b = k * STRIDE;
  bin[b + 0] = o.a;
  bin[b + 1] = o.e;
  bin[b + 2] = o.i;
  bin[b + 3] = o.om;
  bin[b + 4] = o.w;
  bin[b + 5] = o.ma;
  bin[b + 6] = o.epoch - EPOCH_REF;
  bin[b + 7] = o.n != null ? o.n : 360 / o.per;
  bin[b + 8] = o.H != null ? o.H : 99;
  const estimated = o.diameter == null;
  const diam = estimated ? (o.H != null ? estDiam(o.H) : 0.1) : o.diameter;
  bin[b + 9] = diam;
  let flags = 0;
  if (o.pha) flags |= 1;
  if (sentryDes.has(o.pdes)) flags |= 2;
  if (estimated) flags |= 4;
  bin[b + 10] = flags;
  bin[b + 11] = CLASS_IDX[o.class] !== undefined ? CLASS_IDX[o.class] : 4;

  names[k] = o.full_name;
  pdes[k] = o.pdes;
  details[k] = {
    name: o.name,
    spkid: o.spkid,
    class: o.class,
    pha: !!o.pha,
    q: o.q,
    ad: o.ad,
    per: o.per,
    moid: o.moid,
    H: o.H,
    G: o.G,
    diameter: o.diameter,
    albedo: o.albedo,
    rot_per: o.rot_per,
    spec_B: o.spec_B,
    spec_T: o.spec_T,
    first_obs: o.first_obs,
  };
}

writeFileSync(join(out, 'asteroids.bin'), Buffer.from(bin.buffer));
writeFileSync(
  join(out, 'asteroids-meta.json'),
  JSON.stringify({ count: N, epochRef: EPOCH_REF, stride: STRIDE, names, pdes })
);
writeFileSync(join(out, 'asteroid-details.json'), JSON.stringify(details));
console.log(`asteroids: ${N} -> asteroids.bin (${(bin.byteLength / 1e6).toFixed(1)} MB) + meta + details`);

// ---- planets / comets / sentry (small enough to carry as JSON) --------------
writeFileSync(join(out, 'planets.json'), JSON.stringify(r('planets.json')));
writeFileSync(join(out, 'comets.json'), JSON.stringify(r('comets.json')));
writeFileSync(join(out, 'sentry.json'), JSON.stringify(sentry));
console.log('planets, comets, sentry copied');

// ---- close approaches -------------------------------------------------------
const ca = r('close-approaches.json');
ca.sort((x, y) => x.jd - y.jd);
const round = (v, p) => (v == null ? null : +v.toFixed(p));
const events = ca.map((e) => [
  round(e.jd, 4),
  e.des,
  round(e.dist, 5),
  round(e.dist_min, 5),
  round(e.dist_max, 5),
  round(e.v_rel, 2),
  e.cd,
]);
const byDes = {};
for (let k = 0; k < ca.length; k++) {
  const d = ca[k].des;
  (byDes[d] || (byDes[d] = [])).push(k);
}
writeFileSync(join(out, 'close-approaches.json'), JSON.stringify({ fields: ['jd', 'des', 'dist', 'dist_min', 'dist_max', 'v_rel', 'cd'], events, byDes }));
console.log(`close approaches: ${ca.length} events indexed`);
console.log(`done -> ${out}`);
