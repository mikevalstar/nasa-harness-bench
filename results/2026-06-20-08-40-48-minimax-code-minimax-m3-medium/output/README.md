# Inner Solar System · Near-Earth Explorer

An interactive 3D visualization of the inner solar system and its ~42,000
near-Earth objects, propagated from real NASA / JPL orbital elements. Built
to satisfy the brief in `PLAN.md`.

## What it does

- **The Sun** at the origin with a soft glow.
- **The eight planets** at their real orbits, sizes exaggerated for legibility.
- **All ~42,000 known near-Earth asteroids**, each propagated in real time from
  its own Keplerian elements (semi-major axis, eccentricity, inclination,
  longitude of ascending node, argument of perihelion, mean anomaly at epoch,
  and mean motion).
- **~4,000 comets** as an optional overlay, including hyperbolic / parabolic
  orbits solved with the hyperbolic Kepler equation (`M = e·sinh(H) − H`).
- **Time controls**: play / pause, ±10 / ±30-day jumps, scrub, jump to a
  date, "Now" button. Speed selectable from 0.5 days/s to 10 years/s.
- **Filters**: orbit-line toggle, planet labels, PHA-only, Sentry-risk
  subset, comet overlay, by-class (AMO / APO / ATE / IEO), by minimum
  diameter, by maximum MOID, free-text search by name / designation /
  SPK-ID.
- **Detail panel**: physical + orbital properties, the closest ~50 close
  approaches to Earth (date, distance, relative velocity, magnitude), and
  for monitored objects the CNEOS Sentry impact-risk summary (cumulative
  probability, Palermo / Torino scales, year range).
- **Focus & follow**: lock the camera onto a planet or asteroid and it
  tracks the body as time advances. `F` toggles follow, `Esc` deselects.
- **Hover tooltips** + click-to-select on the canvas.
- **Shareable deep links**: every change updates the URL hash so a
  particular moment (time + selection + camera + filters) can be copied
  and reloaded.

## How it works

```
+----------------------+       +-------------------------+
| data/                |  -->  | scripts/preprocess-     |
|   asteroids.json     |       |   data.mjs              |
|   close-approaches…  |       |                         |
|   comets.json        |       |  asteroids.bin (~5 MB)  |
|   sentry.json        |       |  asteroids.strings.bin  |
|   planets.json       |       |  comets.bin (~0.4 MB)   |
+----------------------+       |  close-approaches.idx…  |
                               +-------------------------+
                                            |
                                            v
                                 +-------------------------+
                                 | dist/data/   (served    |
                                 |   relative to index)    |
                                 +-------------------------+
                                            |
                                            v
   +-------------------+        +------------------------------+
   | src/main.ts       |  -->   | Three.js scene              |
   |   bootstrap +     |        |   • InstancedMesh  (42k)    |
   |   animation loop  |        |   • Custom ShaderMaterial   |
   +-------------------+        |     (GPU Kepler)            |
                                 |   • OrbitControls          |
                                 |   • DOM overlay (labels)   |
                                 +------------------------------+
```

### Orbit propagation

Each body's position at Julian date `t` is computed in two places:

1. **On the GPU** for the 42k asteroid field. A custom vertex shader
   receives the orbital basis (two unit vectors `ex`, `ey` in the
   heliocentric J2000 ecliptic) and elements `a, e, ma_epoch, n, epoch`
   as per-instance attributes, plus the uniform `uTime`. It solves
   Kepler's equation `M = E − e·sin(E)` by Newton iteration (six
   iterations), computes the position in the perifocal frame, and
   transforms to heliocentric coordinates. Updating a single uniform
   re-positions the entire field.
2. **On the CPU** for the eight planets, the selected asteroid, and
   camera-follow targets. Pure JS, using the same equations; ~10 µs per
   body.

For comets with `e ≥ 1` the shader (and CPU code) branch into the
**hyperbolic Kepler** path: `M = e·sinh(H) − H` solved by Newton iteration
on `H`, with the appropriate perifocal-frame position.

### Data preprocessing

At build time, `scripts/preprocess-data.mjs` reads the raw JSON files and
emits compact binaries:

- `asteroids.bin` — `Float32Array`, 30 floats per record (orbital basis +
  elements + class code + flags + diameter).
- `asteroids.strings.bin` — length-prefixed UTF-8 string tables (full
  name, primary designation, IAU name).
- `asteroids.idx.json` — counts, flag bits, class codes, string-table
  offsets, summary stats (PHA count, Sentry count, diameter range).
- Same trio for comets.
- `close-approaches.json` — sorted by `des`, with a separate
  `close-approaches.idx.json` mapping `des → [start, end)` for
  O(log n) lookups by designation.

This brings the asteroids dataset from a 16 MB JSON to ~6.3 MB
binary + ~1.3 MB strings + ~840 KB index — about a third — and lets the
renderer stream the entire field straight into GPU buffers.

## Run / build

```bash
pnpm install
pnpm build      # runs tsc, vite build, copy-data, preprocess-data
```

The build emits a self-contained static site into `dist/`:

```
dist/
├── index.html
├── assets/
│   ├── index-*.js   (Vite-bundled app)
│   └── index-*.css
└── data/            (the same files as data/, plus the .bin + idx files)
```

Open `dist/index.html` from any static file server. The site uses
**relative** paths so it works inside an `<iframe>` at any sub-path.

## Notable assumptions

- **Scale**: 1 unit = 1 astronomical unit. Sun and planet radii are
  exaggerated to be legible — a true-to-scale Earth would be invisible
  at a typical viewing distance. The scale bar at the bottom of the
  viewport always shows the current zoom level.
- **Asteroid sizes** are driven by absolute magnitude `H` (with a small
  boost for objects whose diameter has been measured). Bodies with very
  low `H` are capped at 0.02 au so they don't fill the screen.
- **Time** is in J2000-based Julian dates. Default start is "now" in
  UTC. The scrub range covers 2025-01-01 → 2050-01-01.
- **The Sun is held fixed** at the origin (the dataset's stated
  convention). Mutual perturbations between planets and asteroids are
  not modelled — this is a visualization, not an ephemeris.
- **Hyperbolic comets** are propagated with the hyperbolic Kepler
  equation. Parabolic (e ≈ 1) cases may drift slowly because the
  solver struggles at that limit; the visual effect at typical speeds
  is small.
- **Only NEOs are shown by default.** Non-NEO asteroids are filtered
  out (we have no data for the main belt, Jupiter trojans, etc., in
  `asteroids.json` — it's the NEO subset).
- **No external network calls.** Fonts are system fonts; everything
  served comes from `dist/` plus the bundled JS.

## Keyboard shortcuts

| key | action |
| --- | --- |
| `Space` | play / pause |
| `←` / `→` | step time by 10 days |
| `F` | toggle follow on selected body |
| `Esc` | deselect |
