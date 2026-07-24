# NEO System

An interactive 3D visualization of the inner solar system and its ~42,000
near-Earth asteroids, built entirely from the orbital-element dataset in
`data/`. Positions are computed from the elements (Kepler propagation from each
body's own epoch) — nothing is hardcoded.

## Run

```sh
pnpm install
pnpm build     # -> dist/ (self-contained static site, data included)
pnpm dev       # local dev server
```

The built site uses only relative URLs, so it can be served from any sub-path
(e.g. inside an iframe). `pnpm build` first runs `scripts/build-data.mjs`,
which compacts the raw JSON into the formats the UI loads (a 2 MB binary for
the asteroid elements, trimmed JSON for the rest) into `public/data/`, which
vite copies into `dist/data/`.

## What's inside

- **GPU-propagated asteroid cloud** — all 42,075 asteroids are a single
  `THREE.Points` draw call; the vertex shader solves Kepler's equation per
  object per frame, so time scrubbing is free (60 fps in testing).
- **Interactive time** — play/pause (space), reverse, speed from 1 hour/s to
  1 year/s, jump to a date, return to now, arrow-key stepping (±1 day,
  shift ±30 days).
- **Planets, comets, starfield** — the eight planets with orbit lines and
  labels, an optional comet overlay (~4,000 comets; hyperbolic orbits are
  propagated from `tp` with the hyperbolic Kepler equation, parabolic ones
  with Barker's equation), and a procedural starfield.
- **Filter & search** — by orbit class (Apollo/Aten/Amor/Atira/other), PHA
  status, Sentry impact-risk listing, and minimum diameter; full-text search
  across asteroids, comets, and planets.
- **Color modes** — orbit class (PHA highlighted), risk (Sentry objects by
  Palermo scale, PHAs, everything else dimmed), and estimated size.
- **Detail view** — click any object (or search) for its orbit, physical
  properties, CNEOS Sentry impact-risk summary (probability, Palermo/Torino,
  impact window), and its Earth close-approach history; each approach date is
  a one-click time jump.
- **Upcoming close approaches** — a panel listing the next catalogued Earth
  approaches after the current simulation time; clicking one jumps to that
  moment and selects the object.
- **Focus & follow** — selecting a body flies the camera to it; "Follow
  camera" locks the camera onto it as time advances.
- **Shareable deep links** — the URL hash encodes time, speed, camera,
  selection, follow state, color mode, comet layer, and filters
  (e.g. `#t=2462240.4&sel=a:99942&fol=1`). Hash changes are applied live.

## Assumptions & notes

- **Propagation is two-body (Keplerian)** from each body's own epoch, as the
  data model prescribes. The snapshot's elements are rounded (e.g. `a` to 4
  decimals), and no planetary perturbations are applied, so positions drift
  from JPL Horizons ephemerides over time — on the order of 10⁻³–10⁻² au a
  few years from epoch (verified against Horizons for Apophis's 2029 flyby).
  The geometry of the system is correct; exact close-approach circumstances
  come from the `close-approaches.json` catalog shown in the UI.
- **Diameters** are mostly not measured; unknown ones are estimated from
  absolute magnitude H assuming an albedo of 0.14, and flagged "(est.)".
- **Body sizes are exaggerated** (Sun ~25×, planets ~300×) so the system is
  readable at system scale; the "Body size" slider adjusts this.
- **Comets** beyond ~25 au fade out (gone at 35 au) — most of the catalog is
  long-period/hyperbolic objects that are far away at any given time.
- Element epochs are stored as offsets from JD 2,460,000 so the whole dataset
  fits in Float32 precision for GPU attributes.
- `scripts/smoke.mjs` / `scripts/smoke2.mjs` are optional headless-Chrome
  smoke tests (require a local Chrome install; not part of the build).
