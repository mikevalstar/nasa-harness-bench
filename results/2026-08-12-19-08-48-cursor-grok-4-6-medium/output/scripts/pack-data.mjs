import { mkdir, readFile, writeFile, copyFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const srcDir = join(root, "data");
const outDir = join(root, "public", "data");

await mkdir(outDir, { recursive: true });

function num(v, fallback = 0) {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

function nanNum(v) {
  return typeof v === "number" && Number.isFinite(v) ? v : NaN;
}

const CLASS_CODES = ["AMO", "APO", "ATE", "IEO", "ETc", "HTC", "JFC", "JFc", "COM", "CTc", "HYP", "PAR"];
const classIndex = Object.fromEntries(CLASS_CODES.map((c, i) => [c, i]));

console.log("packing asteroids…");
const asteroids = JSON.parse(await readFile(join(srcDir, "asteroids.json"), "utf8"));
const astCount = asteroids.length;
const astOrbits = new Float32Array(astCount * 8);
const astMeta = {
  count: astCount,
  classes: CLASS_CODES,
  pdes: new Array(astCount),
  name: new Array(astCount),
  full_name: new Array(astCount),
  class: new Uint8Array(astCount),
  pha: new Uint8Array(astCount),
  H: new Float32Array(astCount),
  diameter: new Float32Array(astCount),
  moid: new Float32Array(astCount),
  spkid: new Uint32Array(astCount),
};

for (let i = 0; i < astCount; i++) {
  const o = asteroids[i];
  const b = i * 8;
  astOrbits[b] = num(o.a);
  astOrbits[b + 1] = num(o.e);
  astOrbits[b + 2] = num(o.i);
  astOrbits[b + 3] = num(o.om);
  astOrbits[b + 4] = num(o.w);
  astOrbits[b + 5] = num(o.ma);
  astOrbits[b + 6] = num(o.epoch);
  astOrbits[b + 7] = num(o.n);
  astMeta.pdes[i] = o.pdes ?? "";
  astMeta.name[i] = o.name ?? null;
  astMeta.full_name[i] = (o.full_name ?? o.pdes ?? "").trim();
  astMeta.class[i] = classIndex[o.class] ?? 255;
  astMeta.pha[i] = o.pha ? 1 : 0;
  astMeta.H[i] = nanNum(o.H);
  astMeta.diameter[i] = nanNum(o.diameter);
  astMeta.moid[i] = nanNum(o.moid);
  astMeta.spkid[i] = o.spkid >>> 0;
}

await writeFile(join(outDir, "asteroid-orbits.bin"), Buffer.from(astOrbits.buffer));
await writeFile(
  join(outDir, "asteroids.json"),
  JSON.stringify({
    count: astCount,
    classes: CLASS_CODES,
    pdes: astMeta.pdes,
    name: astMeta.name,
    full_name: astMeta.full_name,
    class: Array.from(astMeta.class),
    pha: Array.from(astMeta.pha),
    H: Array.from(astMeta.H),
    diameter: Array.from(astMeta.diameter),
    moid: Array.from(astMeta.moid),
    spkid: Array.from(astMeta.spkid),
  })
);

console.log("packing comets…");
const comets = JSON.parse(await readFile(join(srcDir, "comets.json"), "utf8"));
const comCount = comets.length;
const comOrbits = new Float32Array(comCount * 10);
const comMeta = {
  count: comCount,
  pdes: new Array(comCount),
  full_name: new Array(comCount),
  class: new Array(comCount),
  M1: new Array(comCount),
  diameter: new Array(comCount),
};

for (let i = 0; i < comCount; i++) {
  const o = comets[i];
  const b = i * 10;
  comOrbits[b] = num(o.a);
  comOrbits[b + 1] = num(o.e, 1);
  comOrbits[b + 2] = num(o.i);
  comOrbits[b + 3] = num(o.om);
  comOrbits[b + 4] = num(o.w);
  comOrbits[b + 5] = num(o.ma);
  comOrbits[b + 6] = num(o.epoch, num(o.tp));
  comOrbits[b + 7] = num(o.n);
  comOrbits[b + 8] = num(o.q);
  comOrbits[b + 9] = num(o.tp);
  comMeta.pdes[i] = o.pdes ?? "";
  comMeta.full_name[i] = (o.full_name ?? o.pdes ?? "").trim();
  comMeta.class[i] = o.class ?? null;
  comMeta.M1[i] = o.M1 ?? null;
  comMeta.diameter[i] = o.diameter ?? null;
}

await writeFile(join(outDir, "comet-orbits.bin"), Buffer.from(comOrbits.buffer));
await writeFile(join(outDir, "comets.json"), JSON.stringify(comMeta));

console.log("packing sentry…");
const sentry = JSON.parse(await readFile(join(srcDir, "sentry.json"), "utf8"));
const sentryByDes = {};
for (const s of sentry) {
  sentryByDes[s.des] = {
    ip: s.ip,
    ps_cum: s.ps_cum,
    ps_max: s.ps_max,
    ts_max: s.ts_max,
    range: s.range,
    n_imp: s.n_imp,
    diameter: s.diameter,
    v_inf: s.v_inf,
    last_obs: s.last_obs,
    fullname: s.fullname,
  };
}
await writeFile(join(outDir, "sentry.json"), JSON.stringify(sentryByDes));

console.log("packing close approaches…");
const cad = JSON.parse(await readFile(join(srcDir, "close-approaches.json"), "utf8"));
const cadByDes = {};
for (const e of cad) {
  const des = e.des;
  let list = cadByDes[des];
  if (!list) {
    list = [];
    cadByDes[des] = list;
  }
  list.push([e.jd, e.dist, e.v_rel, e.cd]);
}
await writeFile(join(outDir, "cad.json"), JSON.stringify(cadByDes));

await copyFile(join(srcDir, "planets.json"), join(outDir, "planets.json"));

const manifest = {
  asteroids: astCount,
  comets: comCount,
  sentry: sentry.length,
  cad: cad.length,
};
await writeFile(join(outDir, "manifest.json"), JSON.stringify(manifest));
console.log("packed", manifest);
