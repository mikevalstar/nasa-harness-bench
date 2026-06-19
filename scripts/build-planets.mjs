#!/usr/bin/env node
// build-planets.mjs — write bench/data/planets.json from the standard J2000
// mean Keplerian elements of the eight planets (Standish, "Keplerian Elements
// for Approximate Positions of the Major Planets", JPL SSD).
//
// Output uses the SAME element convention as asteroids.json (a, e, i, om, w, ma
// in au/degrees at a Julian-date epoch) so a single propagation routine renders
// both. Source values are given as a, e, i, L (mean longitude), varpi
// (longitude of perihelion), om (longitude of ascending node); we derive:
//     w  = varpi - om            (argument of perihelion)
//     ma = L - varpi             (mean anomaly)        all normalized to [0,360)
//
// Run:  node scripts/build-planets.mjs

import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const DATA = join(dirname(fileURLToPath(import.meta.url)), "..", "bench", "data");
mkdirSync(DATA, { recursive: true });

const J2000 = 2451545.0; // epoch (Julian date)
const K = 0.9856076686;  // Gaussian-ish deg/day constant: n = K / a^1.5

// name, a(au), e, i(deg), L(deg), varpi(deg), om(deg), meanRadiusKm
const SRC = [
  ["Mercury", 0.38709927, 0.20563593, 7.00497902, 252.25032350, 77.45779628, 48.33076593, 2439.7],
  ["Venus",   0.72333566, 0.00677672, 3.39467605, 181.97909950, 131.60246718, 76.67984255, 6051.8],
  ["Earth",   1.00000261, 0.01671123, -0.00001531, 100.46457166, 102.93768193, 0.0, 6371.0],
  ["Mars",    1.52371034, 0.09339410, 1.84969142, -4.55343205, -23.94362959, 49.55953891, 3389.5],
  ["Jupiter", 5.20288700, 0.04838624, 1.30439695, 34.39644051, 14.72847983, 100.47390909, 69911],
  ["Saturn",  9.53667594, 0.05386179, 2.48599187, 49.95424423, 92.59887831, 113.66242448, 58232],
  ["Uranus",  19.18916464, 0.04725744, 0.77263783, 313.23810451, 170.95427630, 74.01692503, 25362],
  ["Neptune", 30.06992276, 0.00859048, 1.77004347, -55.12002969, 44.96476227, 131.78422574, 24622],
];

const norm360 = (x) => ((x % 360) + 360) % 360;
const r6 = (x) => Math.round(x * 1e6) / 1e6;

const planets = SRC.map(([name, a, e, i, L, varpi, om, radius_km]) => {
  const n = K / Math.pow(a, 1.5); // deg/day
  return {
    name,
    a, e, i,
    om: r6(norm360(om)),
    w: r6(norm360(varpi - om)),
    ma: r6(norm360(L - varpi)),
    epoch: J2000,
    n: r6(n),
    per: r6(360 / n), // orbital period in days
    radius_km,
  };
});

writeFileSync(join(DATA, "planets.json"), JSON.stringify(planets, null, 2) + "\n");
console.log(`Wrote bench/data/planets.json (${planets.length} planets).`);
