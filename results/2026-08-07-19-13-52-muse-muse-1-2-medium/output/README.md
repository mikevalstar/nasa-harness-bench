# Inner Solar System — NEOs Explorer

Interactive 3D visualization of the Sun, 8 planets, ~42k near-Earth asteroids and ~4k comets, all positioned by Kepler propagation from their own orbital elements (J2000 ecliptic, AU, deg).

## Assumptions & propagation
- Elliptical (e<1): `M = ma + n·(jd−epoch)`, solve `M = E − e·sinE` (Newton), then `r = a(1−e·cosE)`, true anomaly from `E`.
- Parabolic (e≈1): Barker's equation `D³/3 + D = sqrt(μ/(2q³))·(jd−tp)` where `D = tan(ν/2)`.
- Hyperbolic (e>1): `Mh = n_h·(jd−tp) = e·sinhH − H`, `r = |a|(e·coshH −1)`.
- `μ = k²` with `k=0.01720209895 AU³/²/day`. Distances in AU, angles in degrees, time in days. Sun at origin. Scales exaggerated for visibility (sun/planet radii).
- All data loaded at runtime via `fetch('data/...')` (relative URLs, no CDNs).

## Usage
- Time: play/pause, reverse, speed (0.25–1000 d/s), scrub, date picker, Now.
- Search/filter: designation/name, class (APO/AMO/ATE/IEO), PHA, Sentry risk, D>1km, close <0.05 AU, upcoming ≤30d, sort.
- Highlights: PHA (red), Sentry risk (amber), comets (cyan), class colors. Toggle comets/highlights.
- Investigate: click point or list item → right panel shows orbit elements, physical props, Sun/Earth distance now, Sentry Palermo/Torino, close-approach history.
- Orbit: white line samples the full Kepler orbit (elliptic) or ± window around tp (hyperbolic/parabolic).
- Focus & follow locks camera to selected body.
- Shareable deep links encode jd, selection, filters, comets toggle, camera in URL query params.

## Build
`pnpm install && pnpm build` → `dist/` (self-contained, with `dist/data/` copied). `vite` base is `./` for iframe sub-path.
