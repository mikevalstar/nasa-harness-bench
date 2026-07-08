# Notes — 2026-07-08-17-37-08-cursor-cursor-grok-4-5-high

Free-form observations about this run.

> **Grading split:** the four **usability** criteria (camera, scale, legible,
> noUiIssues) were filled by Mike's visual pass. Everything else is graded from
> the code, the build, a headless-browser console capture, and the run log.
> Final score: **85 / 100** (runs 100 · correctness 96 · usability 75 ·
> self-verification 0 · features 88; integrity passed).

## Summary

Vite + **React-Three-Fiber** (React 19) "NEO Atlas". A `prebuild` step
(`scripts/preprocess.mjs`) packs the source JSON into compact binary + sidecar
files under `public/data/` (float32 orbital packs, uint8 flags, a Sentry join by
designation). The app builds clean, renders the full ~42,000-NEO inner solar
system, and drives a rich HUD (search/filter, per-object detail with Sentry
risk + close-approach history, deep links, focus-follow camera, time controls).

The orbital engine is **correct for the base** (planets + asteroids are all
elliptic and verified). The one real defect is in the **parabolic comet
propagator**: a factor error in the Barker solver that mistimes the 1,821
parabolic comets (45% of the comet catalog). Comets are an optional overlay
(off by default, distance-clipped), so the visible impact is small — but it is a
genuine math bug and the model never saw it because it never opened a browser.

## What it got right

- **Elliptic + hyperbolic orbital math is correct** (`src/astro/kepler.ts`):
  - Standard Newton solve of `M = E − e·sinE` (12 iters, good seed).
  - Hyperbolic: `M = e·sinhH − H`, perifocal `x = a(e − coshH)`,
    `y = a√(e²−1)·sinhH` — verified `r = a(e·coshH − 1)` and that perihelion sits
    on +x consistently with the elliptic branch.
  - Perifocal→ecliptic is the standard 3-1-3 (ω, i, Ω) rotation; scene mapping is
    a consistent ecliptic `(x,y,z)` → Three.js `(x, z, −y)`.
  - JD conversion correct (`ms/86400000 + 2440587.5`).
  - Mean motion `n` taken from the data when present, else `√(μ/a³)`; angles
    converted deg→rad once in preprocess.
  - **Numerically checked:** Earth at J2000 → r = 0.9833 au (≈ its perihelion
    q = a(1−e) = 0.9833, and J2000 is ~2 days before Earth perihelion — correct).
- **Positions are genuinely computed from elements**, propagated from each body's
  own epoch — not fabricated. 42,075 asteroids instanced on the GPU (up to 12k
  drawn, PHAs/Sentry objects prioritized when subsampling).
- **Renders correctly** (confirmed via headless Chrome + SwiftShader): Sun at
  centre, labelled Earth, inner-planet orbit rings, and the NEO cloud
  concentrated in the ecliptic plane around 1 au. Selecting **Apophis** draws its
  gold ellipse correctly crossing Earth's orbit; the detail panel shows the right
  numbers (a 0.9224, e 0.1911, i 3.34°, q 0.746, Q 1.10, MOID 0.0001 au) and the
  famous **2029 approach at 0.00025 au ≈ 0.1 LD**.
- **Clean console:** 0 errors, 0 warnings, 0 exceptions, 0 failed requests across
  load + search + select interactions.
- **Rich, well-wired features** (all present in code; DOM-verified where noted):
  search with live hits, asteroid/comet/PHA/Sentry toggles, orbit-class filters
  with live counts, min-diameter / max-MOID; per-object **investigate** panel;
  **Sentry** impact-risk block (ip, Palermo cum/max, Torino, window, n_imp, v∞) +
  Sentry-only filter + red colouring; **close-approach** history with click-to-
  jump-in-time; **deep links** (time/selection/filters/follow/camera in the query
  string) + a Copy-link button; **focus-follow** camera (lerped, distance-clamped)
  — "Following" confirmed active on selection; **scale rings** at 1 au / 5.2 au;
  distances shown in au **and** lunar distances.
- **Comet overlay avoids the classic scatter trap:** off by default and clipped
  beyond 60 au, so it doesn't collapse the scene the way an unfiltered
  propagate-everything overlay does.

## What it got wrong / broke

- **Parabolic (Barker) solver has a factor bug** (`kepler.ts` `solveParabolic`).
  It computes `w = cbrt(s + √(s²+1)); D = w − 1/w`, which solves
  `D + D³/3 = ⅔·s` instead of the correct `D + D³/3 = s`. The correct closed form
  needs `w = cbrt(1.5s + √((1.5s)²+1))`. Effect: parabolic comets are propagated
  at the wrong rate — exact only at perihelion (dt=0), increasingly wrong away
  from it (verified: at dt=365 d the residual `D + D³/3 − s` is ≈ −1.5).
  - Hits **1,821 of 4,068 comets** (`kind === 1`, |e−1| < 1e-6). The orbit *line*
    for a selected parabolic comet still traces a correct parabola (geometry is
    self-consistent for any D), but its instantaneous *position vs date* is off.
  - Mitigated in practice: comets are off by default, most parabolic comets have
    perihelion far from 2026 and land beyond the 60-au clip, and elliptic (1,762)
    + hyperbolic (485) comets are propagated correctly. So the on-screen effect is
    minor — but it's a real engine bug. This is the main reason `correctness.
    orbitsCorrect` is **good** (not pass) and `features.comets` is **good**.
- **No browser self-check** — see `selfVerificationNotes`. It verified the math
  numerically and smoke-tested the served build with curl, but never rendered the
  app, so it couldn't have caught the parabolic issue or any visual defect. Ironic
  given it wrote the exact Node script that *would* have caught the parabolic bug
  if it had checked a comet instead of only planets.

### Minor / cosmetic

- `AsteroidField` registers its own `click` listener on the GL canvas and
  raycasts the instanced mesh (works), separate from R3F's pointer events — fine,
  just two paths.
- Build warns the main chunk is 1.12 MB (314 kB gzip) — no code-splitting. Not a
  correctness issue.
- `MAX_DRAW = 12000` asteroid cap: silently subsamples above 12k visible (PHAs +
  Sentry always kept). Reasonable perf trade-off; not surfaced in the UI.

## Cheating / out-of-bounds behaviour

- **Did it touch `data/`?** No. It read `data/` read-only (`wc`/`head`/`python3
  json.load`); `preprocess.mjs` only ever *reads* `data/` and writes to
  `public/data/`. It explicitly ran `git status --short data/` and
  `test ! -w data/asteroids.json` to confirm. `dataUntouched: true`.
- **Network at runtime?** None. The app `fetch`es only relative `data/…` paths;
  no external calls. (Build-time `pnpm install` is normal.) `noNetwork: true`.
- **Read/write outside the bench dir?** No — all file ops and the local
  `vite preview` (127.0.0.1) stayed within the bench directory. It did have to fix
  its own typo (a directory literally named `src/ astro` with a leading space →
  `mv` into `src/astro`), which is in-bounds. `inBounds: true`.

## Reproduction notes (grader)

- Standalone build needs `pnpm install --ignore-workspace` (the repo-root
  pnpm workspace otherwise swallows it) and, on 2026-07-08, a
  `--config.minimumReleaseAge=0` override because a transitive dep
  (`electron-to-chromium`) was published within the local supply-chain cutoff.
  Neither is a defect in the harness output. `pnpm build` then succeeds
  (`tsc --noEmit` clean + `vite build`).
- Rendered/console verification done with headless Chrome; the GPU path showed a
  blank 300×150 canvas, but SwiftShader software WebGL
  (`--use-angle=swiftshader --enable-unsafe-swiftshader`) renders the full scene —
  the blank frame was a headless-GPU artifact, not an app bug.
