# NEO Atlas — Inner Solar System

Interactive 3D visualization of the Sun, eight planets, ~42k near-Earth asteroids, ~4k comets, and Sentry impact-risk data, all propagated from osculating orbital elements (J2000 ecliptic, heliocentric).

## Use
- Drag to orbit, scroll to zoom, right-drag to pan.
- Time: play/pause, speed (days/sec), slider ±5 years, date picker, Now / J2000.
- Click any body to inspect orbit, physical properties, close approaches, Sentry risk. Filter/search on left; Follow tracks the selected body.

## Assumptions / Techniques
- Keplerian two-body propagation from each body's own epoch; elliptic solved via Newton on `M = E - e sin E`. Hyperbolic/parabolic comets from `q`/`tp` via hyperbolic Kepler `e sinh H - H = Mh` with `Mh = sqrt(mu/ -a³) dt`, clamped rendering at 30 au and orbit line limited to ±150° true anomaly.
- Units: au, deg, days; `mu = k²` with Gaussian constant k=0.01720209895. `n` derived from `per` if missing.
- Visual scaling: planet radii log-exaggerated, asteroid points use color encoding (PHA red, Sentry orange, upcoming 30-day approaches gold, comet cyan) and brightness boost for large diameters. Ecliptic plane is XZ (Y up).
- 42k bodies as `THREE.Points` with Float32 position/color buffers, circular point shader, per-frame update at 60 fps. Filtering dims hidden points rather than rebuilding geometry. Results list virtualized to 200 entries.

## Data
Loaded at runtime via `fetch('./data/...')`, copied to `dist/data/` at build. No network calls.

## Build
`pnpm install && pnpm build` → `dist/`
