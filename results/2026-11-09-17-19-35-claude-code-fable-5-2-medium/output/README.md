# Near-Earth objects in 3D

An interactive 3D view of the inner solar system: the Sun, eight planets, 42,075 near-Earth
asteroids and 3,860 comets, each placed by propagating its orbital elements to the date on the clock.
Built from [PLAN.md](PLAN.md) and the snapshot in [data/](data/README.md).

## Running it

```
pnpm install
pnpm build      # type-checks, prepares the data, writes dist/
pnpm preview    # serve dist/ locally
pnpm dev        # dev server
pnpm test       # orbit maths, checked against the dataset
```

`dist/` is a static site with relative URLs only. It makes no network requests beyond its own files.

## What it does

- **Time.** Play, pause, reverse, six speeds from 1 hour/s to 10 years/s, a scrubber across
  1900 to 2200, a date field and a Today button. Space toggles play.
- **Filter and search.** Filter by hazard status, Sentry listing, orbit class, minimum diameter,
  MOID, and whether the object passes Earth in a year range and within a distance. Filters change
  the scene and the list together. Search covers every asteroid, comet and planet regardless of filters.
- **Detail view.** Click a dot or a list row. The panel shows live distance and speed, size on a
  log scale against known impactors, physical and orbital data, Sentry impact risk, and a chart
  and table of recorded Earth close approaches. Picking an approach jumps the clock to it.
- **Highlights.** Asteroids inside a recorded close approach (within 1.5 days of the clock) get a
  pulsing marker with their miss distance. The Flybys tab lists the approaches that come next.
- **Encoding.** Dot size is diameter on a log scale. Colour is switchable: hazard status, orbit
  class, diameter, MOID, or Palermo-scale impact risk. Hazardous and high-risk dots draw on top.
- **Comets.** Drawn in teal with anti-sunward tails that grow near the Sun.
- **Impact risk.** A sortable table of the 2,156 Sentry objects, a colour mode, a filter and a
  section in the detail view.
- **Focus and follow.** Follow locks the camera to the selected body as time runs. Zoom in frames it.
- **Deep links.** The URL hash carries the date, selection, follow state, camera and colour mode.
  Copy link puts it on the clipboard.

## How it works

- [build/prepare-data.ts](build/prepare-data.ts) runs inside the Vite build. It reads `data/` and
  writes columnar JSON to `dist/data/` (16 MB of asteroids becomes 4.6 MB). It rounds close-approach
  numbers to six significant digits and otherwise passes values through. It computes no positions.
- [src/orbit.ts](src/orbit.ts) holds the propagation maths. [src/bodies.ts](src/bodies.ts) applies
  it to each kind of body.
- Asteroids are one draw call. The vertex shader in [src/scene/asteroids.ts](src/scene/asteroids.ts)
  solves Kepler's equation per point, so stepping time costs one uniform update. The same solver
  runs on the CPU for picking, labels and the detail readouts.
- Comets use a universal-variable solver from time of perihelion, which handles elliptic,
  parabolic and hyperbolic orbits with one code path. They run on the CPU each frame.
- The UI is plain TypeScript and DOM in [src/ui/](src/ui/). three.js is the only runtime dependency.

## Assumptions and limits

- **Two-body motion.** Every body follows a fixed Kepler orbit from its own epoch. Planetary
  perturbations are ignored, so positions drift from reality as the clock moves away from the
  element epoch (mid-2026 for most asteroids). Recorded close-approach distances come from JPL's
  full integrations and stay accurate. The scene's own Earth distance at those moments is close
  near the epoch and can be far off decades away. Elements are also rounded to about four digits
  in the snapshot. Apophis in April 2029 lands 2.5 lunar distances from Earth here, against a
  recorded 0.1.
- **Planets** use the J2000 mean elements in `planets.json` with no secular rates.
- **Diameters.** Only 3% of asteroids have a measured diameter. For the rest the dot size uses
  an estimate from absolute magnitude H with an assumed albedo of 0.14. The detail view shows the
  range for albedos of 0.25 to 0.05 and says which kind of number it is.
- **Planet and Sun sizes** are true to scale once you zoom in. From far away they are held at a
  minimum of a few pixels so they stay visible.
- **Comets also in the NEO list.** 208 comets appear in both `comets.json` and `asteroids.json`.
  They are shown once, as near-Earth objects in the "Comet-like" class.
- **Distant comets fade.** Comets far behind the region in view are faded out. Otherwise the
  Kreutz sungrazers, all leaving along one line some 25 au out, read as a clump beside the Sun.
- **Time range** is 1900 to 2200, the span of the close-approach table. Times are shown as UTC and
  the data's TDB timestamps are treated as UTC (about a minute apart).
- **The 1.5 day flyby window** and the list of impactor sizes on the size scale (Chelyabinsk 20 m,
  PHA threshold 140 m, Chicxulub 10 km) are my choices, not dataset values.
