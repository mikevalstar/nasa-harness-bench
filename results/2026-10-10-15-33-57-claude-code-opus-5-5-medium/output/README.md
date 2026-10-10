# NEO Orrery

An interactive 3D orrery of the inner solar system and its ~42,000 near-Earth asteroids,
built from the JPL snapshot in [`data/`](data/README.md). See [`PLAN.md`](PLAN.md) for the brief.

```sh
pnpm install && pnpm build   # static site in dist/
pnpm dev                     # local dev server
```

## Intent

A tool for exploring where near-Earth objects are, how they move, and which ones matter:

- **Every position is computed**, never stored: each body is propagated from its own epoch with
  two-body Kepler motion ([`src/orbit.ts`](src/orbit.ts)). Closed orbits use Kepler's equation,
  hyperbolic comets the hyperbolic form, and parabolic comets Barker's equation from perihelion time.
- **Time is the main control**: play/rewind at several speeds, scrub 1900–2200, jump to a date or
  to any recorded close approach.
- **Highlight what matters**: colour by hazard, orbit class, size, Earth MOID or Sentry Palermo
  scale ([`src/encoding.ts`](src/encoding.ts)); filter by hazard, class, size, MOID and close
  approaches near the current date; ranked lists of upcoming approaches, highest impact risk,
  closest recorded approaches and largest PHAs ([`src/panels.ts`](src/panels.ts)).
- **Investigate one object**: orbit, physical data with a size comparison, Sentry risk, live
  distance to Earth/Sun, and its close-approach history (clickable, also marked on the timeline).
- **Focus & follow** a body as time runs ([`src/scene.ts`](src/scene.ts)).
- **Shareable**: time, selection, follow, camera, colour mode and hazard filter live in the URL hash
  ([`src/url.ts`](src/url.ts)); "Copy link" copies it.

## Data pipeline

`pnpm build` runs [`scripts/prepare-data.ts`](scripts/prepare-data.ts), which reads `data/`
(never modified) and writes compact column-oriented JSON to `public/data/` → `dist/data/`.
It joins Sentry and close-approach rows to asteroids by designation and orders asteroids so
hazardous objects draw on top. The app fetches these files with relative URLs at runtime.

## Assumptions & limitations

- **Two-body only.** No planetary perturbations, so positions drift from reality the further
  you are from an object's epoch (decades → noticeable; Apophis in April 2029 lands a few LD
  off instead of 0.1 LD). The close-approach tables come from JPL's full integration and are the
  authoritative numbers; the "From Earth" live distance is the model's.
- Planets use mean J2000 elements without secular rates.
- Times are shown as UTC; the ~1 minute TDB–UTC difference is ignored.
- Diameters without a measurement are estimated from H assuming albedo 0.14 (marked "~").
- The Sun and planets are drawn as fixed-size glows so they stay visible; true-scale spheres
  appear when zoomed in close. Background stars are decorative, not a real catalogue.
- Comets are off by default; "periodic only" hides open (e ≥ 1) orbits, which are mostly far
  away at any given date.
