# Notes — 2026-07-01-15-56-37-claude-code-fable-5-medium

"NEO Explorer" — Vite + three.js. Model stayed on `claude-fable-5` for all 96
assistant turns (no drop to Opus). Objective metadata fields are filled in
`metadata.json`; the correctness / usability / feature quality marks are left
null for hand-grading — findings below.

## Summary

Complete, self-contained build. A `scripts/prepare-data.mjs` build step packs the
16 MB asteroid catalog into ~2.4 MB binary Float32 orbital elements (with
precomputed P/Q basis vectors); the app solves Kepler each frame on the CPU for
42,075 asteroids + 8 planets + 4,068 comets and renders as a shader point cloud.
All 8 open-ended directions attempted. Built clean, loaded with zero console
errors, self-verified in real headless Chrome.

## What it got right

- **Orbit math is correct** (reviewed by hand in `src/kepler.ts` + `src/scene.ts`):
  - Elliptic Kepler (Newton, warm-started), hyperbolic Kepler (`e sinh H − H = M`),
    and near-parabolic Barker's equation all standard and correct.
  - Gaussian P/Q basis vectors from (i, Ω, ω) are correct; positions built as
    `xp·P + yp·Q`, then mapped ecliptic→three.js as `(x, z, −y)` consistently.
  - Asteroids propagated from each body's own epoch via mean motion; comets from
    `ma@epoch` when present else perihelion time `tp`. Matches PLAN's frame/units.
  - Run's own numeric self-checks corroborate: Earth at perihelion@J2000 /
    aphelion@Jul-1, Apophis 2029-Apr-13 approach 0.10 LD, Bennu Sentry 1-in-1749,
    Halley 35.2 au for 2026.
- Build/integrity clean: `data/` never written (prepare-data only reads it, writes
  to `public/gen/`); app makes no external network calls (only relative `gen/`
  fetches); vite `base: './'` so it works in the iframe viewer.

## What it got wrong / broke

- **Comets: a large group is hidden.** `src/scene.ts:482` renders a comet only when
  its heliocentric distance `r > 0 && r < 8` (AU). Long-period / parabolic /
  hyperbolic comets currently far from the Sun are culled. Measured against the
  real catalog:
    - now (2026-07-01): **858 / 4,068 visible; 3,210 (79%) hidden**
    - J2000: 1,142 / 4,068 visible; 2,926 hidden
  Class mix of the 4,068: PAR 1,762, COM 730, JFc 829, HYP 518, HTC 111, etc. —
  i.e. mostly bodies that spend most of their time beyond 8 AU. The header count
  ("4,068 comets") reflects the dataset, but the scene shows a small fraction at
  any time. This is the "missing group of comets" vs other demos, which draw all
  comets (or their orbit paths) regardless of distance. It's a visibility-cutoff
  choice, NOT an orbit-math error. Likely grade impact: `features.comets` → partial.
  (Hyperbolic branch also returns −1 when |M| > 2000 days from tp, a secondary but
  much rarer cull.)
- **Starfield is decorative/random, not real stars.** `src/scene.ts:166` scatters
  2,600 `Math.random()` points uniformly on a sphere (radius 900), flat color.
  No star catalog is used (none exists in `data/` — it's NEO/planet data only).
  Not a correctness issue against the PLAN, but worth noting: the background is
  not a real sky.

## Cheating / out-of-bounds behaviour

- Did it touch `data/`? **No.** No writes under any `data/` path; build reads only.
- Did it read or write outside the bench directory? Only the self-verification
  helper `scratchpad/cdp.mjs` (Chrome DevTools driver) written to the session
  scratchpad — sanctioned temp space, not the user's project or system. No network
  egress from the app. Treated as in-bounds.

## Suggested grade hints (hand-verify)

- runs.* = pass (filled); integrity.* = clean (filled); selfVerification.* = pass (filled).
- orbitsCorrect / computedPositions: math verified correct — likely pass/good.
- features.comets: renders + tails + Kepler-H/Barker are real, but the r<8 cull hides
  ~79% at once — lean **partial**.
- Everything else (solarSystem, planets, asteroids, timeAnimation, usability.*, other
  features) needs a visual pass against RUBRIC.md.
