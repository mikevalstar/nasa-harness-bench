// Build-time preprocessing: converts data/*.json (read-only) into compact
// runtime files under public/data/ (which Vite copies to dist/data/).
// Binary element packs are Float32LE: [uint32 N][N x F floats].
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const IN = join(root, 'data');
const OUT = join(root, 'public', 'data');
mkdirSync(OUT, { recursive: true });

const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : NaN);
const r6 = (v) => Math.round(v * 1e6) / 1e6;

function writeBin(name, rows, stride) {
  const buf = Buffer.alloc(4 + rows.length * stride * 4);
  buf.writeUInt32LE(rows.length, 0);
  let o = 4;
  for (const row of rows) {
    for (let k = 0; k < stride; k++) {
      const v = row[k];
      buf.writeFloatLE(Number.isFinite(v) ? v : NaN, o);
      o += 4;
    }
  }
  writeFileSync(join(OUT, name), buf);
  console.log(name, rows.length, 'rows,', (buf.length / 1024).toFixed(0) + ' KiB');
}

// --- asteroids ---
const asteroids = JSON.parse(readFileSync(join(IN, 'asteroids.json'), 'utf8'));
writeBin(
  'asteroids.bin',
  asteroids.map((o) => [o.a, o.e, o.i, o.om, o.w, o.ma, o.epoch, o.n, num(o.H), num(o.diameter), num(o.moid), num(o.albedo), num(o.rot_per)]),
  13,
);
writeFileSync(
  join(OUT, 'asteroids-meta.json'),
  JSON.stringify({
    pdes: asteroids.map((o) => o.pdes),
    name: asteroids.map((o) => o.name ?? null),
    cls: asteroids.map((o) => o.class ?? '?'),
    pha: asteroids.map((o) => (o.pha ? 1 : 0)),
    spec: asteroids.map((o) => [o.spec_B ?? null, o.spec_T ?? null]),
    firstObs: asteroids.map((o) => o.first_obs ?? null),
  }),
);
console.log('asteroids-meta.json written');

// --- comets ---
const comets = JSON.parse(readFileSync(join(IN, 'comets.json'), 'utf8'));
writeBin(
  'comets.bin',
  comets.map((o) => [
    num(o.a), o.e, o.i, o.om, o.w, num(o.ma), num(o.epoch), num(o.n),
    num(o.q), num(o.tp), num(o.M1), num(o.diameter), num(o.per),
  ]),
  13,
);
writeFileSync(
  join(OUT, 'comets-meta.json'),
  JSON.stringify({
    pdes: comets.map((o) => o.pdes),
    name: comets.map((o) => o.full_name ?? o.pdes),
    cls: comets.map((o) => o.class ?? '?'),
  }),
);
console.log('comets-meta.json written');

// --- close approaches: per-object map + global time-sorted timeline ---
const cas = JSON.parse(readFileSync(join(IN, 'close-approaches.json'), 'utf8'));
const byDes = {};
const timeline = [];
for (const c of cas) {
  const e = [Math.round(c.jd * 1e4) / 1e4, r6(c.dist), Math.round(c.v_rel * 1e3) / 1e3];
  (byDes[c.des] ??= []).push(e);
  timeline.push([e[0], c.des, e[1]]);
}
for (const k of Object.keys(byDes)) byDes[k].sort((a, b) => a[0] - b[0]);
timeline.sort((a, b) => a[0] - b[0]);
writeFileSync(join(OUT, 'ca-by-des.json'), JSON.stringify(byDes));
writeFileSync(join(OUT, 'ca-timeline.json'), JSON.stringify(timeline));
console.log('ca files written:', Object.keys(byDes).length, 'objects,', timeline.length, 'events');

// --- small files copied verbatim ---
for (const f of ['planets.json', 'sentry.json']) copyFileSync(join(IN, f), join(OUT, f));

// --- manifest ---
const sentry = JSON.parse(readFileSync(join(IN, 'sentry.json'), 'utf8'));
writeFileSync(
  join(OUT, 'manifest.json'),
  JSON.stringify({
    asteroids: asteroids.length,
    comets: comets.length,
    closeApproachEvents: cas.length,
    closeApproachObjects: Object.keys(byDes).length,
    sentry: sentry.length,
    jdMin: timeline[0][0],
    jdMax: timeline[timeline.length - 1][0],
    pha: asteroids.filter((o) => o.pha).length,
  }),
);
console.log('manifest written — done');
