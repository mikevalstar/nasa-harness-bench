import fs from 'fs';
import path from 'path';

const DATA_DIR = './data';
const OUT_DIR = './public/data';

console.log('Starting data pre-processing...');

// 1. Planets
const planetsRaw = fs.readFileSync(path.join(DATA_DIR, 'planets.json'), 'utf8');
fs.writeFileSync(path.join(OUT_DIR, 'planets.json'), JSON.stringify(JSON.parse(planetsRaw)));
console.log('✔ Copied planets.json');

// 2. Asteroids
console.log('Loading asteroids.json...');
const asteroidsRaw = fs.readFileSync(path.join(DATA_DIR, 'asteroids.json'), 'utf8');
const asteroids = JSON.parse(asteroidsRaw);

const asteroidFields = [
  "pdes", "name", "full_name", "class", "a", "e", "i", "om", "w", "ma", 
  "epoch", "per", "neo", "pha", "moid", "H", "diameter"
];

const processedAsteroids = asteroids.map(ast => {
  return [
    ast.pdes || '',
    ast.name || null,
    ast.full_name || '',
    ast.class || '',
    ast.a !== undefined && ast.a !== null ? Number(ast.a) : null,
    ast.e !== undefined && ast.e !== null ? Number(ast.e) : null,
    ast.i !== undefined && ast.i !== null ? Number(ast.i) : null,
    ast.om !== undefined && ast.om !== null ? Number(ast.om) : null,
    ast.w !== undefined && ast.w !== null ? Number(ast.w) : null,
    ast.ma !== undefined && ast.ma !== null ? Number(ast.ma) : null,
    ast.epoch !== undefined && ast.epoch !== null ? Number(ast.epoch) : null,
    ast.per !== undefined && ast.per !== null ? Number(ast.per) : null,
    ast.neo ? 1 : 0,
    ast.pha ? 1 : 0,
    ast.moid !== undefined && ast.moid !== null ? Number(ast.moid) : null,
    ast.H !== undefined && ast.H !== null ? Number(ast.H) : null,
    ast.diameter !== undefined && ast.diameter !== null ? Number(ast.diameter) : null
  ];
});

fs.writeFileSync(
  path.join(OUT_DIR, 'asteroids_opt.json'), 
  JSON.stringify({ fields: asteroidFields, data: processedAsteroids })
);
console.log(`✔ Processed ${processedAsteroids.length} asteroids to asteroids_opt.json`);

// 3. Comets
console.log('Loading comets.json...');
const cometsRaw = fs.readFileSync(path.join(DATA_DIR, 'comets.json'), 'utf8');
const comets = JSON.parse(cometsRaw);

const cometFields = [
  "pdes", "name", "full_name", "class", "e", "a", "q", "i", "om", "w",
  "ma", "tp", "per", "n", "epoch", "M1", "diameter"
];

const processedComets = comets.map(cmt => {
  return [
    cmt.pdes || '',
    cmt.name || null,
    cmt.full_name || '',
    cmt.class || '',
    cmt.e !== undefined && cmt.e !== null ? Number(cmt.e) : null,
    cmt.a !== undefined && cmt.a !== null ? Number(cmt.a) : null,
    cmt.q !== undefined && cmt.q !== null ? Number(cmt.q) : null,
    cmt.i !== undefined && cmt.i !== null ? Number(cmt.i) : null,
    cmt.om !== undefined && cmt.om !== null ? Number(cmt.om) : null,
    cmt.w !== undefined && cmt.w !== null ? Number(cmt.w) : null,
    cmt.ma !== undefined && cmt.ma !== null ? Number(cmt.ma) : null,
    cmt.tp !== undefined && cmt.tp !== null ? Number(cmt.tp) : null,
    cmt.per !== undefined && cmt.per !== null ? Number(cmt.per) : null,
    cmt.n !== undefined && cmt.n !== null ? Number(cmt.n) : null,
    cmt.epoch !== undefined && cmt.epoch !== null ? Number(cmt.epoch) : null,
    cmt.M1 !== undefined && cmt.M1 !== null ? Number(cmt.M1) : null,
    cmt.diameter !== undefined && cmt.diameter !== null ? Number(cmt.diameter) : null
  ];
});

fs.writeFileSync(
  path.join(OUT_DIR, 'comets_opt.json'),
  JSON.stringify({ fields: cometFields, data: processedComets })
);
console.log(`✔ Processed ${processedComets.length} comets to comets_opt.json`);

// 4. Sentry (Impact risk summary)
console.log('Loading sentry.json...');
const sentryRaw = fs.readFileSync(path.join(DATA_DIR, 'sentry.json'), 'utf8');
const sentryList = JSON.parse(sentryRaw);

const sentryMap = {};
sentryList.forEach(s => {
  if (s.des) {
    sentryMap[s.des] = {
      ip: s.ip !== undefined && s.ip !== null ? Number(s.ip) : null,
      ps_cum: s.ps_cum !== undefined && s.ps_cum !== null ? Number(s.ps_cum) : null,
      ts_max: s.ts_max !== undefined && s.ts_max !== null ? Number(s.ts_max) : null,
      range: s.range || '',
      n_imp: s.n_imp !== undefined && s.n_imp !== null ? Number(s.n_imp) : null,
      diameter: s.diameter !== undefined && s.diameter !== null ? Number(s.diameter) : null,
      h: s.h !== undefined && s.h !== null ? Number(s.h) : null,
      v_inf: s.v_inf !== undefined && s.v_inf !== null ? Number(s.v_inf) : null
    };
  }
});

fs.writeFileSync(path.join(OUT_DIR, 'sentry_opt.json'), JSON.stringify(sentryMap));
console.log(`✔ Processed ${sentryList.length} sentry entries to sentry_opt.json`);

// 5. Close Approaches
console.log('Loading close-approaches.json...');
const caRaw = fs.readFileSync(path.join(DATA_DIR, 'close-approaches.json'), 'utf8');
const caList = JSON.parse(caRaw);

const caMap = {};
caList.forEach(ca => {
  if (ca.des) {
    if (!caMap[ca.des]) {
      caMap[ca.des] = [];
    }
    caMap[ca.des].push([
      ca.jd !== undefined && ca.jd !== null ? Number(ca.jd) : null,
      ca.cd || '',
      ca.dist !== undefined && ca.dist !== null ? Number(ca.dist) : null,
      ca.v_rel !== undefined && ca.v_rel !== null ? Number(ca.v_rel) : null,
      ca.h !== undefined && ca.h !== null ? Number(ca.h) : null
    ]);
  }
});

// Sort close approaches for each object by jd ascending
for (const des in caMap) {
  caMap[des].sort((a, b) => a[0] - b[0]);
}

fs.writeFileSync(path.join(OUT_DIR, 'close_approaches_opt.json'), JSON.stringify(caMap));
console.log(`✔ Processed ${caList.length} close approaches for ${Object.keys(caMap).length} objects to close_approaches_opt.json`);

console.log('Data pre-processing completed successfully!');
