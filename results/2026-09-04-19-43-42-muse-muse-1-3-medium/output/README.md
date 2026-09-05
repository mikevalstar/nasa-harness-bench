# NEO Explorer — inner solar system in 3D

Interactive 3D visualization of the Sun, the eight planets, ~42,000 near-Earth
asteroids, and ~4,000 comets, propagated live from JPL orbital elements.
Built per `PLAN.md`; `data/` is read-only input.

## Run

```sh
pnpm install && pnpm build   # emits the self-contained static site into dist/
```

Open `dist/index.html` over any static file server (relative URLs throughout,
so it works from a sub-path / iframe). No network calls at runtime — Three.js
is bundled, fonts are system fonts.

## How it works

- `scripts/preprocess.mjs` (runs as `prebuild`) compacts `data/*.json` into
  `public/data/` (Float32 element packs + small JSON sidecars, ~8 MB total),
  which Vite copies to `dist/data/`.
- [`src/orbit.ts`](src/orbit.ts) solves Kepler's equation per body per frame
  (elliptical from mean anomaly; hyperbolic/parabolic comets from perihelion
  passage `tp`). ~46k solves/frame runs in a few ms on typed arrays.
- [`src/scene.ts`](src/scene.ts) renders asteroids/comets as two instanced
  `THREE.Points` clouds with a custom size-attenuated shader; planets are
  shaded spheres with orbit lines and HTML labels.
- [`src/main.ts`](src/main.ts) wires time, filters, search, detail, highlights,
  follow-cam, and URL deep links (`#jd, sel, follow, speed, dir, hl, lyr, cam`).

## Assumptions / simplifications

- Pure two-body Keplerian propagation from each body's own epoch (no
  perturbations, no relativity). Positions drift from JPL Horizons over
  decades — fine for visualization, not for ephemeris use.
- J2000 ecliptic frame mapped to three.js as (x, z, −y); north-up view is
  counter-clockwise.
- Body sizes exaggerated ~900× by default (Sun/planets would otherwise be
  sub-pixel); “True body sizes” layer restores real scale.
- Close-approach highlight window is fixed at −1/+45 days around the scene date.
- Point buffers hold 66k asteroids / 7k comets; larger snapshots log a warning.
