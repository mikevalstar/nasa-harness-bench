import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import process from 'process';

const inputPath = resolve(process.cwd(), 'data/asteroids.json');
const outputPath = resolve(process.cwd(), 'src/public/asteroids_processed.json');

console.log(`Reading asteroid data from: ${inputPath}`);
const asteroidsRaw = readFileSync(inputPath, 'utf-8');
const asteroids = JSON.parse(asteroidsRaw);

const processedAsteroids = asteroids.map((asteroid) => ({
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

console.log(`Writing processed asteroid data to: ${outputPath}`);
writeFileSync(outputPath, JSON.stringify(processedAsteroids, null, 2), 'utf-8');

console.log(`Processed ${asteroids.length} asteroids.`);
