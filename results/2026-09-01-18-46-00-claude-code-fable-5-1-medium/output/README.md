# NEO Explorer

Interactive 3D view of the inner solar system and its near-Earth asteroids,
driven entirely by the JPL snapshot in [`data/`](./data/README.md).

```
pnpm install && pnpm build   # -> dist/ (self-contained static site, relative URLs)
pnpm dev                     # local dev server
```

## Goal

Let someone explore where ~42,000 near-Earth objects are at any moment, move
through time, and dig into a single object's orbit, physical properties,
close-approach history and impact risk. The base requirement is geometric
correctness; everything else builds on it.

## How it works

- [`scripts/prepare-data.mjs`](./scripts/prepare-data.mjs) runs before every
  build. It packs `data/` into runtime files under `public/data/` (copied to
  `dist/data/`): orbital elements plus perifocal basis vectors as one
  `Float32Array`, columnar metadata for search and detail views, the
  close-approach table sorted by date, Sentry rows joined to asteroid indices,
  and comets with their basis vectors. `data/` itself is never touched.
- Asteroid positions are computed on the GPU. Each vertex carries its own
  elements and epoch and solves Kepler's equation for the current time
  ([`src/shaders.ts`](./src/shaders.ts)), so 42k moving bodies cost nothing per
  frame on the CPU. The same solver runs in TypeScript
  ([`src/orbits.ts`](./src/orbits.ts), [`src/scene.ts`](./src/scene.ts)) for
  planets, comets, the selected object, orbit lines, picking and distances.
- Comets are propagated from time of perihelion with elliptic, parabolic
  (Barker) or hyperbolic solvers depending on eccentricity, and their orbit
  lines are clipped at 60 au.
- The filter set ([`src/filter.ts`](./src/filter.ts)) produces a visibility mask
  uploaded as a vertex attribute; the URL hash ([`src/url.ts`](./src/url.ts))
  encodes time, selection, camera, speed, playback and follow state.

## Features

- Play/pause, reversible speed from 1 min/s to 5 yr/s, step buttons, date/time
  jump, scrub across 1900–2200, keyboard (Space, arrows, F, R, Esc).
- Search by name or designation; filter by hazard status, Sentry monitoring,
  orbit class, absolute magnitude (with approximate size), Earth MOID, whether
  a close approach happens within ±N days of the current time, and measured
  diameters. Colour by hazard, orbit class or size.
- Click or hover any body. Detail panel shows orbit and physical data, Sentry
  impact-risk data, and the full close-approach list (click a row to jump to
  that moment). Live Sun/Earth distances update as time runs.
- "Close approaches near this date" list, Earth-to-asteroid lines during
  approaches, optional orbit overlay for the filtered set, comet tails, comets
  with open orbits, focus and follow camera, shareable deep links.

## Assumptions and limits

- Pure two-body propagation from each object's own epoch. No perturbations, so
  positions drift from reality the further you get from the epoch; close
  approaches decades away will not visually line up with the tabulated CAD
  distances (those come from full n-body solutions). Near-epoch approaches match
  the table to roughly 0.0003 au.
- Planet positions use J2000 mean elements with a constant mean motion (no
  secular rates), accurate to a fraction of a degree over a few centuries.
- The Sun and planets are drawn far larger than life so they remain visible;
  orbits, distances and the grid are to scale. Asteroid point size tracks
  absolute magnitude, not true size.
- Time is displayed in UTC; JPL close-approach times are TDB (difference ~69 s).
- Objects with unknown H (210) are kept unless the H filter's upper bound is
  lowered. Unknown diameters are estimated from H assuming albedo 0.14.
- Only the eight asteroid orbit classes present in the data are offered as
  filters; the ~200 NEOs classed as comet-like (HTC/ETc/JFc/JFC) are asteroids
  in `asteroids.json` and are treated as such.
