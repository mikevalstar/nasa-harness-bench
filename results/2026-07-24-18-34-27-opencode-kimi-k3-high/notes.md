# Notes — 2026-07-24-18-34-27-opencode-kimi-k3-high

"NEO System" — Vite + three.js, plain JS (no typecheck step). Ran on
`openrouter/moonshotai/kimi-k3`, variant **high** — the bench note originally said
effort `medium`; corrected to `high`, and the slug renamed from `…-medium` to
match. (`benchPath` still points at the original `…-medium` working directory —
that is where the harness actually ran, so it is left as the factual record.)

## Summary

A `scripts/build-data.mjs` prebuild repacks the snapshot into a 2.0 MB Float32
binary plus JSON metadata; the 42,075 asteroids are propagated **in the vertex
shader** (elements as attributes, time as a uniform), with a CPU mirror of the
same maths for picking and camera-follow. Planets and comets go through
`src/orbit.js`, which dispatches per conic: elliptic from `ma`/`n`, hyperbolic
from `tp` on the true hyperbola, parabolic via Barker. All eight open-ended
directions attempted. It also verified itself unusually thoroughly — see
`selfVerificationNotes`; this is the first run in the set whose console check was
wired correctly.

## Math verification (independent)

Reference solver re-implemented at full precision; the run's own code paths
replayed against it over the whole catalogue — `src/orbit.js`, the CPU mirror in
`src/asteroids.js`, and a float32 emulation of the GLSL vertex shader — then
cross-checked against **JPL Horizons** for 2026-06-25.

**Asteroids are correct and precise.** Frame and rotation are exact (it works in
three.js coordinates with ecliptic z mapped to +y, consistently applied). Over
all 42,075 objects at four dates spanning ±55 yr:

- CPU path: median 2e-16 au, max **1.4e-7 au**
- GPU float32 path: median 5e-7 au, p99.9 1.7e-5 au, max **3.3e-4 au**
- Nothing above 1e-3 au on either path.

**Planets match Horizons** to 0.0006–0.031 au (≤1e-3 relative for seven of eight,
5.8e-3 for Jupiter) — the expected two-body residual from J2000 mean elements, not
a code defect.

**Two defects, both in comets. The first is serious.**

1. **Barker's equation is off by a factor of two — every parabolic comet is
   propagated at double rate.** `solveBarker` computes
   `Mpar = sqrt(mu/(2q³))·dt` correctly, then sets `target = 2·Mpar` and solves
   `B + B³/3 = target`. The correct relation is `B + B³/3 = Mpar`
   (from `t − T = sqrt(2q³/mu)·(B + B³/3)`), so the comment on line 42
   — "B + B^3/3 = 2*M_par" — is where the error entered.
   Confirmed three ways:
   - The run's output for every parabolic comet equals the reference position at
     **exactly twice the elapsed time since perihelion**, to 4+ decimal places.
   - **Horizons check**, C/2011 J2-C (LINEAR) at 2026-06-25: Horizons
     `(16.1531, −15.2191, −15.8084)`, r = 27.25 au. My reference: r = 27.25 au,
     **0.024 au from Horizons**. The run: r = **44.87 au**, **18.6 au from
     Horizons**.
   - The independent Opus 5 run implements the same relation as my reference.

   Blast radius: **1,821 comets** (all `e = 1` in the snapshot) — 45% of the comet
   catalogue. They are all far from perihelion right now, so most are outside the
   app's comet fade-out (gone beyond 35 au) either way; at today's date **10
   parabolic comets should be visible and only 4 are drawn**, in the wrong places.
   The error scales with time from perihelion, so scrubbing the clock toward any
   of their perihelion passages makes it plainly visible.

2. **The elliptic solver doesn't converge at high eccentricity, and here it shows
   on screen.** `solveKeplerElliptic` starts at `E = π·sign(M)` for `e ≥ 0.8` and
   runs at most 8 Newton iterations (GPU: 9, CPU mirror: 10). That is fine to
   about `e = 0.99`, then degrades sharply. Among the 1,762 elliptic comets:
   **130 are off by >1 au, 176 by >0.1 au**; restricted to those inside the 35 au
   view, **89 are off by >1 au and 118 by >0.1 au**. Worst:
   **C/2007 D1 (LINEAR), e = 0.9999, 610 au out of place at r = 31 au**. An
   iteration sweep on that object: 8 → 610 au, 12 → 8.8 au, 16 → 3e-11 au. It
   needs ~16 iterations, not 8. No asteroid is affected (max asteroid e = 0.9964,
   and the sweep shows errors only start at e ≥ 0.99 with the 782 e ≥ 0.8 objects
   otherwise exact).

**Worth crediting:** the conic dispatch itself is better than the alternative
seen elsewhere — objects with `e > 1` and `a < 0` (485 of them) are solved on the
true hyperbola rather than lumped into a near-parabolic approximation, and the
hyperbolic path is accurate to 1.1e-4 au. The bugs are in the two branches around
it, not in the structure.

Suggested marks: `computedPositions` = pass (everything is genuinely computed
from elements; asteroids are essentially exact). `orbitsCorrect` = partial —
asteroids and planets are right, but 1,821 comets move at double rate and ~90
more visible ones are badly misplaced by a non-converged solver; that is a
geometric-correctness failure across nearly half the comet overlay, not a
rounding issue.

## What it got right

- **Build is reproducible.** Clean `pnpm install && pnpm build` succeeds and
  produces a `dist/` byte-identical to the committed one. (No typecheck in the
  build — it's plain JS.)
- **Self-verification is the best in the set** — real puppeteer, console /
  pageerror / requestfailed listeners wired *before* navigation, UI driven
  end-to-end, screenshots read back and iterated on, deep-link restore asserted
  in a fresh page, 60 FPS measured. It found and fixed a real console error
  (favicon 404) that way.
- **It cross-checked itself against JPL Horizons** (Apophis at the 2029
  encounter) and correctly diagnosed the 0.0058 au residual as dataset element
  rounding plus two-body propagation — a genuinely sharp piece of reasoning, and
  it documented the limitation in the README rather than hiding it.
- Asteroid propagation on the GPU with the elements packed to a 2.0 MB binary.

## What it got wrong / broke

- The Barker factor-of-two (defect 1) and the non-converged elliptic solver
  (defect 2). Both are in code the harness never numerically checked — its own
  Horizons cross-check covered only an *asteroid*, which is exactly the part that
  turned out to be correct.
- `puppeteer-core` is left in `devDependencies` and `scripts/smoke.mjs` ships in
  the output; harmless, but it means a clean install pulls a test-only dep.

## Cheating / out-of-bounds behaviour

- **Did it touch `data/`? No.** `git status` on `bench/` is clean; the prebuild
  only reads `data/` and writes to `public/data/`.
- **Runtime network? No.** The app fetches only relative `data/…` paths. The only
  absolute URLs in the bundle are an XHTML namespace and the inline SVG favicon's
  `www.w3.org/2000/svg`.
- **Out of bounds? No.** All writes are inside the bench directory. It read
  `/Applications` to locate Chrome, ran `pnpm add -D puppeteer-core`, and made one
  `webfetch` to `ssd.jpl.nasa.gov` (JPL Horizons) — build/verification-time
  network, which the PLAN explicitly permits, not runtime.

## Provenance of the marks

Derived from the log / objective checks: `effort` (corrected to high), `cheated`,
`buildSucceeded`, `tokenUsage`, `estimatedCostUsd`, `costNote`,
`timeTakenSeconds`, `selfVerificationNotes`, `grade.runs.builds`,
`grade.selfVerification.*` (both pass — the console check here is unambiguous),
`grade.integrity.*`. The remaining marks were set by hand after review;
`orbitsCorrect` = partial and `comets` = partial line up with the two comet
defects above.
