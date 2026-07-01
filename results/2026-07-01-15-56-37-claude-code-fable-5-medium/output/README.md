# NEO Explorer

An interactive 3D visualization of the inner solar system and all ~42,000 known
near-Earth objects, built from the NASA/JPL orbital-element snapshot in `data/`.

## Run

```sh
pnpm install && pnpm build   # emits a self-contained static site into dist/
pnpm preview                 # serve dist/ locally (or use any static server)
```

`pnpm dev` runs the Vite dev server.

## How it works

- **Build step** (`scripts/prepare-data.mjs`, runs automatically before
  dev/build): converts the read-only JSON in `data/` into compact runtime files
  under `public/gen/` — a packed `Float32Array` of orbital elements plus
  precomputed orbital-plane basis vectors per asteroid (~2.4 MB instead of
  16 MB), flag/class bytes, sorted binary close-approach arrays, and columnar
  JSON for names, detail fields, comets and Sentry rows. `data/` is never
  modified; `dist/gen/` is the copy the site fetches at runtime.
- **Propagation is computed, not stored.** Every frame the app advances each
  body's mean anomaly from its own epoch and solves Kepler's equation
  (Newton iteration with per-object warm-started eccentric anomaly) for all
  42,075 asteroids, 8 planets, and 4,068 comets on the CPU, in the J2000
  ecliptic frame. Elliptic comets propagate like asteroids; hyperbolic comets
  solve the hyperbolic Kepler equation from perihelion time; parabolic ones use
  Barker's equation.
- **Rendering**: three.js. Asteroids/comets are a single point cloud with a
  custom shader (per-point size from absolute magnitude H, color by hazard
  class, alpha as the filter mask). Planets, orbit lines, ecliptic distance
  rings, labels, comet anti-sunward tails, and selection/approach markers sit
  on top.

## Features

- Play/pause, reversible log-scale speed (hours/s → years/s), scrub 1900–2100,
  date picker, "Now".
- Click or search (asteroids, comets, planets) to inspect: physical + orbital
  properties, live Sun/Earth distances, full Earth close-approach history —
  click a row to jump time to that flyby. **Focus & follow** locks the camera
  to the body as time runs.
- Filters: PHA / Sentry-listed / named only, orbit class, size (H), Earth MOID.
- **Approaches** panel: every Earth flyby within ±15 days of the sim date,
  ranked by distance, highlighted with gold rings in the scene.
- **Risk** panel: CNEOS Sentry list ranked by Palermo scale, joined to the
  asteroids; per-object impact-probability callout in the detail view.
- Comets overlay (toggleable) including open hyperbolic/parabolic trajectories.
- Shareable deep links: time, speed, selection, follow mode and camera are
  encoded in the URL hash and restored on load.

## Assumptions & notes

- Two-body Keplerian propagation from each body's osculating elements at its
  own epoch — no planetary perturbations or secular rates. Positions are
  therefore approximate away from the epoch (fine for visualization; the
  close-approach *events* come from the JPL dataset, not from my propagation).
- Time is displayed as UTC; the ~1 min TDB−UTC difference is ignored.
- Planet and Sun sphere sizes are exaggerated ~500× (clamped) to be visible at
  au scale; all positions, orbits, and the 1–5 au rings are to scale.
- Asteroids with unknown H (210 of them) are shown at minimum dot size and are
  excluded only when an explicit H filter is set.
- Diameter shown as "~x (est.)" is derived from H assuming albedo 0.14 when no
  measured diameter exists.
- Time range is limited to 1900–2100 (matching the useful validity of
  osculating elements and the close-approach catalog's core window).
