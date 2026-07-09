# Orbitarium

A static, dependency-free explorer for the supplied JPL orbital-element snapshot.
Bodies are propagated from their individual Julian-date epochs using Kepler's
equation. The rendering uses a perspective-projected 3D canvas; astronomical
body radii are intentionally enlarged so the system remains explorable.

Run `pnpm install && pnpm build`, then serve `dist/` with any static HTTP server.
The app fetches only the bundled, relative `data/*.json` files.
