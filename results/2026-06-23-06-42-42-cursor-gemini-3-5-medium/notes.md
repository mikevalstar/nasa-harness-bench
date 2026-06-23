# Notes — 2026-06-23-06-42-42-cursor-gemini-3-5-medium

Free-form observations about this run.

## Summary

Cursor + Gemini 3.5 Flash. The orbital-mechanics engine is genuinely correct and
the feature list is broad, but the default presentation is broken: planets render
as enormous spheres that swallow the camera, and the asteroids — the whole point —
aren't visible in the default view. Good bones, bad out-of-the-box render.

## What it got right

- **Real propagation.** `propagation.ts` solves Kepler's equation properly for
  elliptic, hyperbolic, *and* parabolic orbits and rotates to the ecliptic frame.
  Positions are computed from elements, not fabricated.
- **Time controls** — play/pause, speed, scrub, JD/UT readout (starts paused).
- **Full feature set, all implemented in code:** filter/search (class, hazard,
  size, MOID), single-object detail view wired to `close-approaches.json`,
  PHA/Sentry/NEO color highlighting, comet overlay (with hyperbolic handling),
  Sentry impact-risk join, follow-camera with break-on-manual-pan, and
  shareable deep links via URL hash (encode + decode).
- **Data untouched, no network, in bounds.** Only fetches local `data/*.json`.

## What it got wrong / broke

- **`planetScale` defaults to 5000** (`App.tsx:50`) while planet base radii are in
  AU (Earth = 0.025). So Earth renders as a ~125 AU sphere orbiting at 1 AU, and
  every planet engulfs the camera (which starts at distance ~4). This is why the
  planets look "massive."
- **Asteroids effectively invisible** at the default view — the camera is trapped
  inside the giant opaque planet spheres, so the point cloud is occluded/lost.
  The data is loaded and propagated; it just can't be seen by default.
- **No sense of scale** — the 5000x exaggeration destroys the base-correctness
  requirement that the system be recognizable.
- **No self-verification.** No run log/session was captured and there's no sign the
  harness opened the built app; the broken default render would have been obvious
  on a single look.

## Cheating / out-of-bounds behaviour

- Did it touch `data/`? No — `git status` on `bench/data` is clean; build copies
  data into `public/data` via a script.
- Did it read or write outside the bench directory? No evidence of it; all I/O is
  relative to the project root.

## Build note

Local `pnpm build` is blocked only by this repo's supply-chain release-age policy
(a transitive `electron-to-chromium` published the same day) plus esbuild's
approve-builds gate — environmental, not the run's fault. The harness already
emitted a valid `dist/` (745 KB JS bundle + CSS + data) at run time, so
`builds`/`loads` stand.
