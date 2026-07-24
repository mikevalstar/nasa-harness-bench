# Near-Earth Space

An interactive 3D view of the inner solar system and the ~42,000 catalogued
near-Earth objects, built entirely from the orbital-element snapshot in `data/`.
No positions are stored anywhere: every body's location is solved from its own
elements, propagated from its own epoch, for whatever moment the clock is showing.

```bash
pnpm install
pnpm build      # -> dist/  (self-contained static site, relative URLs)
pnpm dev        # local dev server
```

## What it does

**The base**

- Sun, the eight planets and all 42,075 NEOs, positioned by solving Kepler's
  equation from the elements in `data/`. Planet orbits are drawn as true
  ellipses sampled from the same elements, so the geometry is recognisably the
  real solar system (inclinations, eccentric Mercury, the ecliptic tilt of
  everything else).
- A clock you can play, pause, reverse, scrub across 1900–2199, or jump to a
  date. Rate runs from minutes/second to years/second.
- All ~42k asteroids are live, all the time. Kepler is solved **in the vertex
  shader**, one solution per point per frame, so advancing time is a single
  uniform write rather than 42,000 CPU solves — the whole catalogue re-propagates
  at 60 fps and filtering is just a per-vertex attribute flip.
- Camera orbit/zoom/pan, exaggerated-but-adjustable body sizes with a true-scale
  end stop, labels, an optional ecliptic grid, and a hover/click pick that works
  on every point in the cloud.

**On top of that**

- **Filter & search** — free-text over names and designations, plus PHA-only,
  Sentry-only, named-only, has-close-approach, orbit class, minimum diameter,
  maximum Earth MOID and maximum semi-major axis. Filters drive both the results
  list and what is drawn.
- **Detail view** — click anything (asteroid, comet, planet, the Sun) for its
  orbit, physical properties, current heliocentric and geocentric distance, and
  its close-approach table. Rows in that table are clickable: the clock jumps to
  the encounter.
- **Impact risk** — the CNEOS Sentry data is joined to the asteroids by
  designation and shown as its own section (impact probability as a 1-in-N,
  Palermo cumulative/max, Torino, potential-impact count and window, encounter
  velocity), plus a "Impact risk" leaderboard ranked by Palermo scale.
- **Highlights** — a live "next close approaches" list that follows the clock
  (binary search into a time-sorted approach index), the Sentry leaderboard, and
  the largest objects in the catalogue.
- **Visual encoding** — colour by hazard (Sentry / PHA / other), orbit class,
  size, or Earth MOID, with a legend; point size scales with estimated diameter.
- **Comets** — optional overlay of all 4,068 comets. Elliptical comets propagate
  from `ma`/`n`; hyperbolic ones are solved with the hyperbolic Kepler equation
  from `tp`; parabolic ones (`e` = 1, no `a`, no `ma`) use Barker's equation from
  `q` and `tp`. Comets beyond ~42 au are culled so the view stays legible.
- **Focus & follow** — lock the camera onto any body; it tracks as time runs.
- **Deep links** — time, rate, selection, follow state, colour mode, comet
  overlay, every filter and the exact camera are encoded in the URL hash.
  "Share view" copies it.

## How the data is handled

`data/` is read-only and untouched. `scripts/prepare-data.mjs` runs as the first
step of `pnpm build` and writes a repacked copy into `public/data/`, which Vite
copies verbatim into `dist/data/`. The site fetches only from there, with
relative URLs, and makes no network calls of any kind.

The repack (27 MB of JSON → ~7 MB, most of it binary):

- orbital elements → columnar `Float32Array` blobs that upload straight to the
  GPU as vertex attributes;
- epochs stored as **days from J2000** rather than raw Julian dates — a JD near
  2.46e6 would consume the whole float32 mantissa and destroy the shader's
  precision;
- physical fields → a second float blob; flags (PHA / class / measured-diameter /
  has-Sentry-entry) → one byte-per-field blob;
- close approaches → grouped by object with an offset/count index per asteroid,
  so a detail panel is an array slice rather than a scan;
- Sentry rows pre-joined to asteroid row indices;
- names and designations stay in one JSON file (the only thing that has to be
  parsed as text).

## Assumptions and caveats

- **Two-body propagation, and the elements are rounded.** Each object is advanced
  along its own osculating two-body orbit from its own epoch. That is what a
  table of elements supports; it is not an n-body integration. On top of that,
  the snapshot stores elements to ~4 significant figures, and mean motion is the
  sensitive one: for Apophis, `n = 1.113 °/day` is uncertain at the 5e-4 level,
  which after the 2.8 years from its epoch to the 2029 encounter is already half
  a degree of mean anomaly — about a million km along-track. So propagated
  positions are geometrically right (correct orbit, correct plane, correct
  phase to within a fraction of a percent of a period) but should not be read as
  ephemeris-grade. The close-approach distances shown in the detail panel are
  CNEOS's published values, not distances measured off this propagation.
- **Diameters are usually estimated.** Only 1,264 of 42,075 NEOs have a measured
  diameter. The rest use the standard `D = 1329 / sqrt(albedo) * 10^(-H/5)` with
  an assumed albedo of 0.14 when none is given; the detail panel marks estimates
  as such.
- **Sizes are not to scale.** Distances are exact in au; body radii are
  exaggerated by an adjustable factor (the Sun much less than the planets, or it
  would swallow Mercury's orbit). Slide it to the bottom for true scale. Asteroid
  points are screen-space sprites — their size encodes estimated diameter, not
  angular size.
- **Times.** The clock is UTC; close-approach times in the dataset are TDB. The
  ~70 s offset is far below anything visible here, so no conversion is applied.
- **Binary blobs are little-endian**, which every browser platform in practice is.
- Comets whose elements give no closed orbit are only drawn near their
  perihelion passage — an open orbit genuinely has them somewhere in interstellar
  space for most of the clock's range.
- Objects are drawn at their osculating positions with no light-time correction
  and no rendering of the Moon or other satellites.

## Layout

```
scripts/prepare-data.mjs   build-time repack of data/ -> public/data/
src/astro.ts               Kepler solvers (elliptic/hyperbolic/parabolic), time helpers
src/shaders.ts             GLSL — the same maths, per-vertex, on the GPU
src/clouds.ts              the asteroid and comet point clouds
src/world.ts               scene, camera, Sun, planets, orbit rings, starfield
src/pick.ts                screen-space picking over 42k GPU-resident points
src/filters.ts             filter state -> per-vertex visibility
src/detail.ts              the detail panel
src/main.ts                app wiring: time, selection, UI, deep links
```
