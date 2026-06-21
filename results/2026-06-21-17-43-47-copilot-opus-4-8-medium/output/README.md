# Near-Earth Object Explorer

An interactive 3D visualization of the inner solar system and its ~42,000
near-Earth objects, computed from orbital elements and propagated through time.
Built with **Three.js + TypeScript + Vite**. No CDNs or runtime network calls —
everything is loaded from `data/` (preprocessed at build time) and bundled.

## Quick start

```bash
pnpm install
pnpm build      # emits a self-contained static site into dist/
pnpm preview    # serve the built site locally
# or, for development:
pnpm dev
```

`pnpm build` runs `scripts/prepare-data.mjs` first (which reads the read-only
`data/` directory and writes compact, UI-ready assets into `public/`), then
builds the Vite app. All asset and data URLs are **relative**, so the site works
from a sub-path inside an `<iframe>`.

## How it works

### Orbital propagation
Positions are never stored — every body's location is computed from its Keplerian
elements (`a, e, i, Ω, ω, M, n, epoch`) in the **J2000 ecliptic frame**, solving
Kepler's equation and advancing the mean anomaly from each body's own epoch.

- **Asteroids (~42k):** propagated entirely on the **GPU**. A single
  `THREE.Points` object carries the orbital elements as vertex attributes, and a
  custom vertex shader solves Kepler's equation for every point each frame. This
  keeps the full 42,000-object set fluid at 60fps.
- **Planets & selected orbits:** propagated on the CPU (`src/kepler.ts`), drawn as
  shaded spheres with geometrically correct orbit ellipses.
- **Comets (~4k):** propagated on the CPU because roughly half are hyperbolic or
  near-parabolic (`e ≥ 1`) and must be propagated from time-of-perihelion `tp`
  rather than from a mean motion. Elliptical, hyperbolic, and parabolic cases are
  all handled (`src/kepler.ts`).

Planet distances were verified against known J2000 values (e.g. Earth ≈ 0.983 AU
near perihelion).

### Data pipeline (`scripts/prepare-data.mjs`)
- `ast-orbits.f32` — packed Float32 buffer (8 values/asteroid). Epochs are stored
  as offsets from J2000 so they stay within float32 precision.
- `ast-meta.json` — index-aligned metadata (names, class, PHA flag, H, diameter,
  MOID, …).
- `comets.json`, `sentry.json`, `planets.json` — trimmed copies.
- `ca-grouped.json` — close approaches grouped by designation (lazy-loaded only
  when a detail view needs it).
- `ca-notable.json` — the 500 closest approaches, for the highlights panel.

The original `data/` directory is treated as **read-only** and is never modified.

## Features

**Base**
- 3D solar system: Sun, eight planets, and the full NEO cloud, all positioned from
  orbital elements.
- Interactive time: play/pause, variable speed (hours/s up to ~10 yr/s, forward or
  reverse), date picker, "Now", and a 1900–2200 scrub bar.
- Camera orbit/pan/zoom, planet labels, adjustable body scale and point size, and
  a starfield for orientation.

**Open-ended directions implemented**
- **Filter & search** — by hazard (PHA), Sentry impact-risk, orbit class, size
  (absolute magnitude H), and Earth MOID; plus free-text name/designation search.
- **Investigate an object** — detail panel with orbit, physical properties,
  CNEOS Sentry impact risk, and the close-approach history table.
- **Highlight what matters** — one-click views for hazardous asteroids, the
  largest objects, closest-MOID objects, and upcoming close approaches.
- **Visual encoding of scale & risk** — color modes by orbit class, hazard, size,
  or Earth MOID, with a live legend.
- **Comets overlay** — toggleable, with correct hyperbolic/parabolic propagation.
- **Impact-risk overlay** — Sentry data joined by designation, shown in the detail
  panel and as a filter.
- **Focus & follow** — lock the camera onto any body and track it through time.
- **Shareable deep links** — time, selection, camera, follow state, color mode,
  comet toggle and filters are encoded in the URL hash and restored on load.

## Controls

- **Drag** to orbit, **scroll** to zoom, **right-drag** to pan.
- **Click** a planet or asteroid to select it; **hover** for a tooltip.
- **Space** play/pause · **← / →** step ±30 days · **F** follow selected ·
  **Esc** clear selection.

## Assumptions & notes

- When an asteroid's diameter is unknown, a visual size is estimated from `H`
  using a standard albedo assumption (0.14) purely for point sizing.
- Body radii are drawn with cube-root-compressed exaggeration so relative sizes
  stay recognizable while remaining visible at solar-system scale (a true-to-scale
  Sun would be ~0.005 AU). Use the **Body scale** slider to adjust.
- Comets far from perihelion on open orbits are parked at the origin to keep the
  scene bounded.
- Close approaches in the dataset are Earth encounters within 0.05 AU; objects
  like 433 Eros (Amor, MOID 0.149 AU) legitimately have none.
- `pnpm-workspace.yaml` sets `dangerouslyAllowAllBuilds: true` so esbuild's
  install step runs and `pnpm install` exits cleanly with no manual approval.

## Project structure

```
PLAN.md                 # task spec (left in place)
data/                   # provided input — READ ONLY
scripts/prepare-data.mjs# build-time data preprocessing
src/
  main.ts               # app wiring, UI, selection, follow, deep links
  scene.ts              # renderer, camera, OrbitControls, starfield, loop
  asteroids.ts          # GPU Kepler point cloud (42k objects)
  planets.ts            # planet spheres, orbits, Sun + glow
  comets.ts             # CPU-propagated comet layer (handles e >= 1)
  kepler.ts             # orbital mechanics (elliptical/hyperbolic/parabolic)
  picking.ts            # click/hover selection over the point cloud
  filters.ts            # visibility filtering & search
  time.ts               # simulation clock
  url.ts                # deep-link state encode/decode
  data.ts               # runtime data loading
  style.css
index.html
dist/                   # build output (self-contained static site)
```
