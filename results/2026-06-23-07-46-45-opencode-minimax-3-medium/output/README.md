# Inner Solar System — Near-Earth Asteroids in 3D

An interactive 3D visualization of the inner solar system and its ~42,000
near-Earth objects, driven entirely by the orbital-element dataset in
`data/`. Positions are computed from each body's elements, so the system
evolves with the sim time you choose.

Built with [Vite](https://vitejs.dev/), [TypeScript](https://www.typescriptlang.org/),
and [Three.js](https://threejs.org/).

## Run / build

```sh
pnpm install
pnpm build        # preprocesses data, builds a static site to dist/
pnpm dev          # preprocesses data and starts the dev server
```

The built site is fully static. The `dist/` directory contains:

```
dist/
├── index.html
├── assets/        # hashed JS + CSS bundles
└── data/          # preprocessed JSON used by the runtime
```

To preview the built site, serve `dist/` from any static server, e.g.
`python3 -m http.server` from inside `dist/`.

All asset and data paths in the built bundle are **relative** (no leading
`/`) so the site works when embedded in a sub-path / iframe.

## What it does

### Base
- Renders the Sun, the eight planets, and all 42,075 near-Earth asteroids in
  3D using Three.js. Planet positions are computed from J2000 mean elements
  via Kepler's equation. Asteroid positions are sampled from a precomputed
  orbit table (96 evenly-spaced samples per asteroid in mean anomaly) with
  linear interpolation.
- Interactive time: play / pause, reverse, eight time-speed presets
  (1 min/sec through 10 years/sec), a scrub slider, and a date picker that
  jumps to a specific moment. Time range is 1900-01-01 → 2200-01-01 (the
  full span of the close-approach dataset).
- Handles the full 42k object set with a single `THREE.Points` cloud and a
  custom point shader. The precomputation runs once at load (~80 ms in
  V8/Chrome) and per-frame work is just a few `Float32Array` reads + linear
  interpolation per body.
- Camera control: orbit / pan / zoom (mouse / touch via
  `OrbitControls`).

### Open-ended

- **Filter & search** — the left panel filters asteroids by orbit class
  (AMO / APO / ATE / IEO), NEO / PHA / Sentry membership, maximum
  diameter, maximum MOID, and minimum H. The search box matches pdes
  prefix, IAU name, or full designation.
- **Investigate a single object** — clicking a planet, an asteroid (raycast
  on the point cloud) or a search hit opens a right-side detail panel with
  the body's identity, orbital elements, physical properties, **Sentry
  impact-risk summary** (cumulative probability, Palermo/Torino scale,
  year range, V∞, last observation), and its close approaches to Earth.
- **Highlight what matters** — Potentially Hazardous Asteroids render in
  orange, Sentry-monitored objects get a yellow ring/halo, and PHA + Sentry
  objects combine both cues. The detail panel tags reinforce this.
- **Convey scale and risk** — point size scales with `diameter` when known
  (or `H` magnitude otherwise); a Sentry "Torino ≥ 1" object is highlighted
  with a red ring tag; Sentry/PHA objects are bumped to a minimum visible
  size so they don't get lost in the field.
- **Comets** — toggle the **Show comets** layer to overlay ~4,000 comets.
  Bound comets (e < 1) use the same elliptic propagator as asteroids;
  hyperbolic / parabolic comets (e ≥ 1) are propagated from their time of
  perihelion passage (`tp`) with mean motion `n_h = √(GM / |a|³)`.
- **Impact risk** — joining `sentry.json` (CNEOS) onto asteroids by `pdes`
  shows cumulative P<sub>impact</sub>, Palermo / Torino scale, year range,
  and number of potential impacts for each monitored object.
- **Focus & follow** — selecting an object shows a "Follow (F)" button
  (also on the keyboard). When following, the camera target tracks the
  body; press `F` or `Esc` to release.
- **Shareable deep links** — the current time, selected object, follow
  target, and camera state are written to the URL. A few example
  bookmarks:
  - `?t=2451545&sel=433` — J2000 epoch with Eros selected
  - `?t=2462240.4&sel=99942&cam=0.5,45,15` — the famous 2029 Apophis
    close approach
  - `?t=2458849.5&follow=1P` — perihelion of Halley's comet
  - `?sel=29075` — Bennu selected at "now"

## Controls

| Input | Action |
|---|---|
| Mouse drag | Orbit the camera |
| Mouse wheel | Zoom |
| Right-drag | Pan |
| Click on a planet | Select it |
| Click on an asteroid (or search) | Select it |
| `Space` | Play / pause time |
| `F` | Follow / unfollow the selected object |
| `Esc` | Deselect |
| Time bar | Play / pause, reverse, speed preset, scrub, jump-to-date |

## Architecture

```
src/
├── main.ts                # boot, animation loop, UI wiring, URL state
├── data.ts                # fetch + pack data into runtime structures
├── scene.ts               # Three.js renderer / camera / controls / lights
├── planets.ts             # Sun + 8 planets, their orbits and labels
├── asteroid_cloud.ts      # 42k asteroids as a single Points cloud
├── asteroid_lookup_prop.ts# per-frame propagation via the precomputed table
├── asteroid_prop.ts       # (legacy) inline Kepler propagation
├── orbit_lookup.ts        # one-time precompute: 96 sample positions/body
├── orbit_path.ts          # orbit line for a single selected asteroid
├── comets.ts              # ~4,000 comets with hyperbolic support
├── orbit.ts               # Kepler / hyperbolic Kepler solvers, GM constants
├── orbit_const.ts         # TAU / DEG / RAD
├── types.ts               # shared type definitions
├── util.ts                # date / number / unit formatting helpers
└── styles.css             # all UI styling

scripts/
├── preprocess-data.mjs    # data/*.json → public/data/*.min.json
├── copy-data.mjs          # public/data/ → dist/data/ (post-build)
└── (test-propagator.mjs   # scratch — not used in build)
```

### Data flow

`data/*.json` is read once by `scripts/preprocess-data.mjs`. The script
drops nulls, trims fields to what the runtime actually uses, and writes
slimmer JSON files into `public/data/`. Vite then serves them, and
`scripts/copy-data.mjs` mirrors them into `dist/data/` after the build.

`src/data.ts` fetches those JSON files, packs the asteroid orbital
elements into a `Float32Array` (14 floats per body — `a, e, n, ma₀, epoch,
P, Q, i, Ω, ω`), and pre-indexes by pdes, Sentry designation, and close
approach.

`src/orbit_lookup.ts` precomputes 96 sampled positions per asteroid
(one-time cost) so the per-frame propagation in
`src/asteroid_lookup_prop.ts` is just a few `Float32Array` reads and a
linear interpolation — no trig, no allocations.

### Coordinate & time conventions

- Heliocentric, J2000 ecliptic (mean ecliptic + equinox of J2000).
- Time in Julian Date (JD). All angles in degrees in the data; converted
  to radians in the propagator.
- Distances in astronomical units (AU). The Sun is rendered at ~3.5× its
  real radius (0.016 au) for visibility; planet radii are log-scaled to
  the 0.006-0.07 au range so they're legible at the default zoom.

## Notes / assumptions

- Asteroid orbits are *Keplerian* — we ignore perturbations (Jupiter,
  Earth, etc.). The data is the JPL SBDB snapshot, so it is correct at
  each body's own epoch, and small errors build up over decades. For a
  visualization across a 300-year window this is more than good enough;
  for navigation it would not be.
- Comets with `e ≥ 1` have no period/mean motion, so they are propagated
  from `tp` (perihelion time) with a synthesized `n_h = √(GM/|a|³)`. About
  half of the catalog is hyperbolic / parabolic; we hide them when they
  are more than 50 au from the Sun.
- Orbit precomputation uses 96 samples per body, giving a maximum
  position error of about `2π/96 ≈ 3.75°` in mean anomaly (or ~1% of an
  orbit for typical eccentricities). This is well below the visual
  resolution of a 1-3 pixel point.
- The 96 samples × 42,075 bodies × 3 floats = ~12 M floats = ~48 MB of
  precomputed data, shipped in `dist/data/asteroids.min.json` (which
  itself is 11.5 MB JSON after trimming nulls).
- Time-step clamping: `state.time` is bounded to [1900-01-01,
  2200-01-01] so a long play doesn't run off the end of the
  close-approach dataset.
