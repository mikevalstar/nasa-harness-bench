# Inner Solar System — Near-Earth Objects

An interactive 3D visualization of the inner solar system and its ~42,000
near-Earth objects. Every body's position is **computed from its orbital
elements** (Kepler propagation) for any moment in time; nothing is hardcoded.

Built with **Three.js + TypeScript + Vite**.

## Run

```bash
pnpm install
pnpm build      # emits a self-contained static site into dist/
pnpm preview    # serve the built site locally
# or, for development:
pnpm dev
```

`pnpm build` first runs `scripts/preprocess.mjs` (which reads the read-only
`data/` snapshot and writes compact runtime assets into `public/data/`), then
type-checks and bundles. All asset and data URLs are **relative** (`base: "./"`),
so the site works from any sub-path or inside an `<iframe>`. No network calls are
made at runtime — everything is loaded from the bundled `./data/` directory.

## How it works

### Propagation
- **Asteroids (~42k)** are propagated entirely **on the GPU**. Each point carries
  its orbital elements as vertex attributes; the vertex shader solves Kepler's
  equation (Newton iteration) for the current time uniform and rotates the
  perifocal position into the ecliptic frame. This keeps all 42k bodies moving at
  ~60 fps with zero per-frame CPU cost.
- **Planets (8)** and **comets (~4k)** are propagated on the CPU. Comets need this
  because roughly half are hyperbolic/parabolic (`e >= 1`): the solver handles
  elliptic (Kepler), hyperbolic (`e·sinh H − H = M`) and parabolic (Barker's
  equation) orbits, propagating open orbits from `tp`.

### Frame & units
Heliocentric **J2000 ecliptic** elements, distances in **AU**, angles in degrees
(converted to radians at load), time as **Julian Date**. Each body is propagated
from its own epoch. The ecliptic `(X, Y, Z)` frame is mapped to Three.js as
`(x, z, −y)` so the ecliptic is the horizontal plane with ecliptic-north up.

### Picking
Clicking/hovering an asteroid uses **GPU picking**: a parallel material reuses the
exact same shader propagation but writes an id-encoded color, rendered through a
1×1 view-offset window under the cursor and read back. Planets use a mesh
raycaster; comets use a CPU screen-space nearest test.

## Features

- **Time controls** — play/pause, ±1 / ±30 day steps, a logarithmic speed slider
  (1 day/s up to 10 yr/s, both directions), a 1900–2075 scrubber, a date picker,
  and "Now".
- **Search & filter** — by name/designation, PHA flag, Sentry risk list, orbit
  class (Atira/Aten/Apollo/Amor), max MOID, and min diameter. Filtered-out bodies
  are dimmed (or hidden).
- **Color encoding** — by orbit class, hazard (PHA), impact risk (Sentry), or
  size, each with a matching legend.
- **Detail view** — click any body for orbital + physical properties, its CNEOS
  **Sentry** impact-risk summary (joined by designation), and its **Earth
  close-approach** history (shown in lunar distances, nearest highlighted).
- **Comet overlay** — toggleable; includes hyperbolic/parabolic comets.
- **Focus & follow** — frame a selected body and lock the camera to track it as
  time advances.
- **Shareable deep links** — "Copy link" encodes time, selection and camera in
  the URL hash so a moment can be reopened.

## Data pipeline (`scripts/preprocess.mjs`)

The read-only `data/` JSON is converted to runtime-friendly formats in
`public/data/` (copied verbatim into `dist/data/` by the build):

| output | from | notes |
|---|---|---|
| `asteroids.bin` | `asteroids.json` | Float32 interleaved elements (8/obj, ~1.3 MB) for GPU attributes; epoch stored relative to J2000 for f32 precision |
| `asteroids-meta.json` | `asteroids.json` | structure-of-arrays of display/filter fields |
| `comets.json` | `comets.json` | trimmed elements for CPU propagation |
| `sentry.json` | `sentry.json` | impact-risk map keyed by designation |
| `close-approaches.json` | `close-approaches.json` | grouped by designation; lazy-loaded on first selection |
| `planets.json` | `planets.json` | copied through |

## Notable assumptions / decisions

- **Visual sizes are exaggerated.** True planetary radii (and asteroid sizes) are
  sub-pixel at AU scale, so bodies use a monotonic, exaggerated visual radius;
  *orbits* remain geometrically accurate in AU. Asteroid point sizes are
  distance-attenuated and scale with diameter/H.
- **Time base.** Calendar dates are treated as UTC; the small UTC↔TDB/TT
  difference is ignored as it is visually irrelevant here.
- **Mean motion.** Uses the catalog `n` where present, otherwise derives it from
  `a` (asteroids) or from `q, e` (open-orbit comets).
- **Comet culling.** Open-orbit comets far from perihelion are parked off-screen
  to avoid float blow-ups; they appear as they approach the inner system.
- **Close approaches** are displayed in lunar distances (1 LD ≈ 0.00257 au) and
  the closest 8 events are listed per object.
