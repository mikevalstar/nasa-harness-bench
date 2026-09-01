# NEO Atlas

Interactive 3D inner solar system and near-Earth object catalog, driven by the snapshot in `data/`.

## Run

```bash
pnpm install
pnpm dev      # pack data + Vite
pnpm build    # static site in dist/
```

## Assumptions

- Positions are computed in the J2000 ecliptic from each body's own epoch using Keplerian two-body propagation (no n-body perturbations).
- Planet sizes are exaggerated so they remain visible; distances are in true au (1 scene unit = 1 au).
- Asteroids with unknown diameter are sized from absolute magnitude `H` assuming albedo 0.14.
- Comets with `e ≥ 1` are propagated from perihelion time `tp` (hyperbolic / Barker's equation), not from mean anomaly.
- Close-approach and Sentry records join to asteroids on `des` ↔ `pdes`.
- Shareable state lives in the URL hash (`jd`, selection, camera, filters).
