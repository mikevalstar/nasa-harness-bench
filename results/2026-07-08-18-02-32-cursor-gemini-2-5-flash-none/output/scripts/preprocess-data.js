const fs = require('fs');
const path = require('path');

// Asteroid Preprocessing
const inputPathAsteroids = path.resolve(process.cwd(), 'data/asteroids.json');
const outputPathAsteroids = path.resolve(process.cwd(), 'src/public/asteroids_processed.json');

console.log(`Reading asteroid data from: ${inputPathAsteroids}`);
const asteroidsRaw = fs.readFileSync(inputPathAsteroids, 'utf-8');
const asteroids = JSON.parse(asteroidsRaw);

const processedAsteroids = asteroids.map(asteroid => ({
  a: asteroid.a,
  e: asteroid.e,
  i: asteroid.i,
  om: asteroid.om,
  w: asteroid.w,
  ma: asteroid.ma,
  epoch: asteroid.epoch,
  n: asteroid.n,
  per: asteroid.per,
  pdes: asteroid.pdes,
  neo: asteroid.neo,
  pha: asteroid.pha,
  class: asteroid.class,
  diameter: asteroid.diameter || null,
}));

console.log(`Writing processed asteroid data to: ${outputPathAsteroids}`);
fs.writeFileSync(outputPathAsteroids, JSON.stringify(processedAsteroids, null, 2), 'utf-8');

console.log(`Processed ${asteroids.length} asteroids.`);

// Comet Preprocessing
const inputPathComets = path.resolve(process.cwd(), 'data/comets.json');
const outputPathComets = path.resolve(process.cwd(), 'src/public/comets_processed.json');

console.log(`Reading comet data from: ${inputPathComets}`);
const cometsRaw = fs.readFileSync(inputPathComets, 'utf-8');
const comets = JSON.parse(cometsRaw);

const processedComets = comets.map(comet => ({
  a: comet.a,
  e: comet.e,
  i: comet.i,
  om: comet.om,
  w: comet.w,
  ma: comet.ma,
  epoch: comet.epoch,
  n: comet.n,
  per: comet.per,
  q: comet.q,
  tp: comet.tp,
  pdes: comet.pdes,
  class: comet.class,
  diameter: comet.diameter || null,
}));

console.log(`Writing processed comet data to: ${outputPathComets}`);
fs.writeFileSync(outputPathComets, JSON.stringify(processedComets, null, 2), 'utf-8');

console.log(`Processed ${comets.length} comets.`);

// Sentry Preprocessing
const inputPathSentry = path.resolve(process.cwd(), 'data/sentry.json');
const outputPathSentry = path.resolve(process.cwd(), 'src/public/sentry_processed.json');

console.log(`Reading Sentry data from: ${inputPathSentry}`);
const sentryRaw = fs.readFileSync(inputPathSentry, 'utf-8');
const sentry = JSON.parse(sentryRaw);

const processedSentry = sentry.map(item => ({
  des: item.des,
  fullname: item.fullname,
  ip: item.ip,
  ps_cum: item.ps_cum,
  ps_max: item.ps_max,
  ts_max: item.ts_max,
  range: item.range,
  n_imp: item.n_imp,
  diameter: item.diameter,
  h: item.h,
  v_inf: item.v_inf,
}));

console.log(`Writing processed Sentry data to: ${outputPathSentry}`);
fs.writeFileSync(outputPathSentry, JSON.stringify(processedSentry, null, 2), 'utf-8');

console.log(`Processed ${sentry.length} Sentry items.`);
