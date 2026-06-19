# Near-Earth Orbits — Interactive Inner Solar System

An interactive 3D visualization of the inner solar system and its ~42,000
near-Earth objects, driven entirely by the orbital-element dataset in `data/`.
Positions are **computed** from each body's elements (Kepler propagation) for
any moment in time; nothing is hardcoded.

## Run

```bash
pnpm install
pnpm build      # emits a self-contained static site into dist/
pnpm preview    # serve the build locally
# or: pnpm dev  # dev server with HMR
```

`pnpm build` runs the data preprocessor, type-checks, and builds. The output in
`dist/` is fully static, uses only relative URLs (so it works from a sub-path
inside an `<iframe>`), and includes its own copy of the data under `dist/data/`.

## How it works

### Data pipeline (`scripts/preprocess.mjs`, build-time)

The raw JSON in `data/` is read-only and never modified. The preprocessor packs
each body's orbital elements into compact `Float32` binary blobs and writes
trimmed JSON for display/search/filter into `public/data/` (copied verbatim to
`dist/data/` by Vite):

- `asteroids.{A,B,E}.bin` / `comets.{A,B,E}.bin` — orbital elements as typed
  arrays (~1.9 MB total vs. 16 MB of source JSON).
- `*.meta.json` — names, classes, and physical properties for the UI.
- `planets.json`, `sentry.json`, `close-approaches.json` — trimmed overlays.

### Propagation

Every body is advanced from its **time of perihelion passage** `tp`, which was
verified to reproduce the dataset's own mean anomaly at epoch:
`M = n · (t − tp)`, with mean motion `n = k · a^(−3/2)`. The same math runs in
two places:

- **GPU** (`src/bodies.ts`) — a vertex shader solves Kepler's equation
  (elliptic / hyperbolic / parabolic) for all ~46k points every frame from a
  single time uniform. This is what makes the full population animate smoothly.
- **CPU** (`src/kepler.ts`) — the eight planets and click-picking.

Comets are handled correctly across orbit types: closed orbits propagate from
`ma`/`n`-equivalents, while the ~2,300 hyperbolic/parabolic comets propagate
from `tp` (hyperbolic Kepler / Barker's equation), matching the data README's
caution.

Coordinates are J2000 ecliptic; the ecliptic plane is mapped to the XZ ground
plane with +Y as ecliptic north.

## Features

**Base**

- Sun, eight planets (with orbit rings, ranked-correct exaggerated sizes), and
  the full ~42k NEO population + ~4k comets, all positioned from their elements.
- Interactive time: play/pause, forward/reverse speeds (hours/s → years/s), a
  1950–2125 scrub bar, jump-to-date, and "Today".
- Orbit-camera controls, a sense of scale, starfield, and a legible HUD.

**Open-ended**

- **Filter & search** — by name/designation, hazard (PHA), Sentry impact risk,
  orbit class, minimum diameter, and maximum Earth MOID. Filtered-out bodies
  fade to ghosts so context is kept.
- **Investigate a single object** — click anything (or search) for a detail
  panel with physical properties, full orbital elements, and its Earth
  close-approach history (joined from `close-approaches.json`), shown in lunar
  distances around the current time.
- **Impact risk** — CNEOS Sentry data (`sentry.json`) is joined by designation;
  at-risk objects are tagged/coloured and their impact probability, Palermo /
  Torino scales, and impact window appear in the detail panel.
- **Visual encoding** — colour by hazard status, inclination, or eccentricity;
  point size scales with absolute magnitude and an adjustable boost.
- **Comets** overlay (toggleable), including open orbits.
- **Focus & follow** — frame a selected body and lock the camera to track it as
  time advances.
- **Shareable deep links** — the current time, speed, selection, follow state,
  colour mode, and camera are encoded in the URL hash; "Copy share link"
  reproduces the exact view.

## Notable assumptions

- Planet and Sun radii are exaggerated for visibility but kept rank-correct;
  1 au = 10 scene units. Asteroid/comet point sizes are screen-space, derived
  from absolute magnitude (true sizes would be invisible at solar-system scale).
- Bodies missing usable elements (no `e`/`q`/`tp` or degenerate `a`) are
  skipped by the preprocessor; counts in the HUD reflect what is rendered.
- Hyperbolic/parabolic comet orbits are drawn as open arcs around perihelion.
- Times are treated as UTC for display; the dataset's Julian dates are used
  directly for propagation.
