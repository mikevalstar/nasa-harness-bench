# Inner Solar System NEO Visualizer

Interactive 3D visualization of the planets, near-Earth asteroids, comets, close approaches, and CNEOS Sentry risk rows from the local `data/` snapshot.

## Run

```sh
pnpm install
pnpm build
pnpm preview
```

The production build emits a static site into `dist/` and copies `data/` to `dist/data/`. Runtime fetches use relative URLs so the site can be served from a subpath or inside an iframe.

## Notes

- Planet, asteroid, and comet positions are propagated from the orbital elements in `data/`; positions are not hardcoded.
- Elliptical orbits use mean anomaly and mean motion from each object's own epoch.
- Comet rendering includes elliptical, parabolic, and hyperbolic propagation from perihelion data when available.
- Planet radii and asteroid/comet point sizes are visually exaggerated so the system remains legible at astronomical scale.
