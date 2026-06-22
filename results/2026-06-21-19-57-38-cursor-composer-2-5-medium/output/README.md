# Inner Solar System Explorer

Interactive 3D visualization of the inner solar system and ~42,000 near-Earth asteroids, built from NASA/JPL orbital-element data.

## Run locally

```bash
pnpm install
pnpm dev
```

## Build

```bash
pnpm install
pnpm build
```

Output is written to `dist/` including a copy of `data/` for runtime fetch.

## Features

- **3D solar system** — Sun, eight planets, and all NEOs positioned via Keplerian propagation from each body's epoch
- **Interactive time** — play/pause, speed control, date scrubber, step by day
- **Filters & search** — by name/designation, PHA, Sentry risk, orbit class, MOID
- **Object detail** — orbital/physical properties, CNEOS Sentry impact risk, close-approach history
- **Visual encoding** — PHA (orange), Sentry-monitored (red), size from diameter/H magnitude
- **Comets overlay** — elliptic/near-parabolic comets propagated from perihelion time
- **Camera follow** — lock onto a selected body as time advances
- **Shareable URLs** — time, selection, and camera encoded in query params

## Assumptions

- Positions use standard two-body Keplerian propagation in the J2000 ecliptic frame; no perturbations.
- Hyperbolic comets (`e ≥ 1`) are propagated from time of perihelion using hyperbolic/parabolic approximations.
- Display scale exaggerates planet sizes for visibility; orbital geometry uses true AU proportions.
- Three.js ecliptic mapping: X = ecliptic X, Y = ecliptic Z, Z = −ecliptic Y.

## Data

All data is loaded from `./data/` at runtime. See `data/README.md` for schema details. The `data/` directory is read-only.
