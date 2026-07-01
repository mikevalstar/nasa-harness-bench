# Inner Solar System Explorer

An interactive 3D visualization of the Sun, the eight planets, ~42,000
near-Earth asteroids, and ~4,000 comets, propagated from their orbital
elements in real time.

## Running

```
pnpm install
pnpm build   # preprocesses data/ into public/data/, then builds dist/
pnpm dev     # local dev server
```

`pnpm build` runs `scripts/preprocess.mjs` (reads `data/`, read-only) then
`vite build`, producing a self-contained static site in `dist/`, including a
processed copy of the dataset under `dist/data/`. All asset/data URLs are
relative so the site works from any sub-path (e.g. inside an iframe).

## Architecture notes

- **Orbit propagation.** Kepler's equation is solved per-body every frame:
  asteroids/planets from mean-anomaly-at-epoch elements, comets from
  perihelion-based elements (`q`, `e`, `tp`) since ~half of them are
  hyperbolic/parabolic and have no `a`/`ma`/`n`. Asteroids and comets are
  propagated **on the GPU** (GLSL vertex shader, `src/shaders/keplerGLSL.ts`)
  so all ~46,000 bodies move every frame without a CPU bottleneck; planets
  and orbit-line sampling use the equivalent CPU implementation
  (`src/orbit.ts`) — the two are kept in careful agreement (same rotation
  convention into render space).
- **Data.** `scripts/preprocess.mjs` repacks `data/asteroids.json` and
  `data/comets.json` into flat `Float32Array` buffers (bound directly as
  interleaved GPU vertex attributes) plus lean metadata JSON for
  search/filter/detail; `close-approaches.json` and `sentry.json` are
  reshaped into maps keyed by designation for O(1) joins.
- **Picking.** Since positions are computed on the GPU, click-to-select
  recomputes candidate positions on the CPU at the moment of the click and
  picks the nearest screen-space point — a one-off ~46k-point pass per click
  is cheap; doing it every frame would not be.
- **Scale.** Orbit shapes are geometrically accurate at 1 scene unit = 1 au.
  Body *sizes* are rendered on an exaggerated, non-physical scale (planets
  ~800x, Sun ~40x) since true 1:1 scale would make every body an invisible
  point — this is flagged in-scene via the "shown on exaggerated scale"
  framing rather than pretending it's to-scale.

## Assumptions

- Asteroid diameter, where not measured, is estimated from absolute
  magnitude `H` assuming a default albedo of 0.14 (standard NEO
  approximation) — labeled "estimated from H" in the detail panel.
- Close-approach history in the detail panel shows the 8 events nearest in
  time to the current simulated date (not necessarily the earliest),
  re-sorted chronologically for display.
- The asteroid search/filter panel applies to asteroids only; comets are a
  separate overlay (per the dataset's own framing) toggled independently.
- Deep links encode simulated date, selection, follow-camera state, and
  exact camera position/target — enough to reopen the identical view.
