import fs from 'fs';
import path from 'path';

const DATA_DIR = 'data';
const OUT_DIR = 'public/data';

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

function processPlanets() {
  console.log('Processing planets...');
  const data = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'planets.json'), 'utf8'));
  fs.writeFileSync(path.join(OUT_DIR, 'planets.json'), JSON.stringify(data));
  console.log(`Planets done: ${data.length} planets`);
}

function processAsteroids() {
  console.log('Processing asteroids...');
  const data = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'asteroids.json'), 'utf8'));
  
  // Convert objects to compact arrays
  // Index guide:
  // 0: pdes, 1: name, 2: full_name, 3: epoch, 4: a, 5: e, 6: i, 7: om, 8: w, 9: ma, 10: per, 11: n, 12: tp, 13: pha, 14: class, 15: diameter, 16: moid, 17: H
  const optimized = data.map(ast => {
    return [
      ast.pdes,
      ast.name || null,
      ast.full_name,
      ast.epoch,
      ast.a,
      ast.e,
      ast.i,
      ast.om,
      ast.w,
      ast.ma,
      ast.per || null,
      ast.n || null,
      ast.tp || null,
      ast.pha ? 1 : 0,
      ast.class || '',
      ast.diameter !== undefined ? ast.diameter : null,
      ast.moid !== undefined ? ast.moid : null,
      ast.H !== undefined ? ast.H : null
    ];
  });

  fs.writeFileSync(path.join(OUT_DIR, 'asteroids_optimized.json'), JSON.stringify(optimized));
  console.log(`Asteroids done: ${optimized.length} objects`);
}

function processComets() {
  console.log('Processing comets...');
  const data = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'comets.json'), 'utf8'));
  
  // Index guide:
  // 0: pdes, 1: full_name, 2: epoch, 3: a, 4: e, 5: i, 6: om, 7: w, 8: ma, 9: per, 10: n, 11: tp, 12: class, 13: diameter, 14: M1
  const optimized = data.map(com => {
    return [
      com.pdes,
      com.full_name,
      com.epoch || null,
      com.a || null,
      com.e,
      com.i,
      com.om,
      com.w,
      com.ma || null,
      com.per || null,
      com.n || null,
      com.tp || null,
      com.class || '',
      com.diameter !== undefined ? com.diameter : null,
      com.M1 !== undefined ? com.M1 : null
    ];
  });

  fs.writeFileSync(path.join(OUT_DIR, 'comets_optimized.json'), JSON.stringify(optimized));
  console.log(`Comets done: ${optimized.length} objects`);
}

function processSentry() {
  console.log('Processing sentry...');
  const data = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'sentry.json'), 'utf8'));
  
  // Group by designation (des)
  const grouped = {};
  data.forEach(item => {
    grouped[item.des] = {
      ts_max: item.ts_max,
      ip: item.ip,
      ps_max: item.ps_max,
      ps_cum: item.ps_cum,
      range: item.range,
      n_imp: item.n_imp,
      diameter: item.diameter,
      h: item.h,
      v_inf: item.v_inf,
      last_obs: item.last_obs
    };
  });

  fs.writeFileSync(path.join(OUT_DIR, 'sentry_grouped.json'), JSON.stringify(grouped));
  console.log(`Sentry done: ${Object.keys(grouped).length} objects`);
}

function processCloseApproaches() {
  console.log('Processing close approaches...');
  const data = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'close-approaches.json'), 'utf8'));
  
  // Group close approaches by designation (des) to enable instant details-panel lookups.
  // To keep it compact, each approach is: [jd, cd, dist, v_rel, h]
  const grouped = {};
  data.forEach(item => {
    if (!grouped[item.des]) {
      grouped[item.des] = [];
    }
    grouped[item.des].push([
      item.jd,
      item.cd,
      item.dist,
      item.v_rel,
      item.h
    ]);
  });

  // Sort close approaches for each object chronologically
  for (const des in grouped) {
    grouped[des].sort((a, b) => a[0] - b[0]);
  }

  fs.writeFileSync(path.join(OUT_DIR, 'close_approaches_grouped.json'), JSON.stringify(grouped));
  console.log(`Close approaches done: ${Object.keys(grouped).length} objects with events`);
}

try {
  processPlanets();
  processAsteroids();
  processComets();
  processSentry();
  processCloseApproaches();
  console.log('All data pre-processing complete successfully!');
} catch (e) {
  console.error('Pre-processing failed!', e);
  process.exit(1);
}
