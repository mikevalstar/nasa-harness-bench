# NEO Atlas

Interactive 3D visualization of the inner solar system and near-Earth objects,
driven by the orbital-element snapshot in `data/`.

## Run

```bash
pnpm install
pnpm dev
```

## Build

```bash
pnpm install
pnpm build
```

Emits a self-contained static site in `dist/` (including preprocessed data under
`dist/data/`). Asset URLs are relative so the site works when served from a
sub-path / iframe.

## Assumptions

- Positions are computed from Keplerian elements in the J2000 ecliptic frame
  (angles stored in radians after preprocess). Scene mapping: ecliptic
  `(x, y, z)` → Three.js `(x, z, -y)` so the ecliptic lies in the XZ plane.
- Asteroids use elliptic propagation from each object’s own epoch via mean
  motion `n`. Comets with `e ≥ 1` use parabolic (Barker) or hyperbolic
  propagation from perihelion time `tp`.
- Body radii are exaggerated for visibility; distances are true AU.
- For performance, up to ~12k filtered asteroids are drawn as GPU instances
  (PHAs and Sentry objects are always preferred when subsampling).
- Close-approach history is joined on designation (`pdes` ↔ `des`). Sentry
  impact-risk rows join the same way.
- Deep links encode time, selection, filters, follow mode, and camera via the
  query string (e.g. `?t=2026-06-19T00:00&sel=a0&follow=1`).

Source `data/` is never modified; `scripts/preprocess.mjs` writes compact packs
into `public/data/` during `pnpm dev` / `pnpm build`.
