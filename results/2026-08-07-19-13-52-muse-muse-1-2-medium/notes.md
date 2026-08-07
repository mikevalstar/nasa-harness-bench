# Notes — 2026-08-07-19-13-52-muse-muse-1-2-medium

First run of a new harness: **Muse Code 0.1.0** (build `427a430436`), model id
reported by the session log as `muse-spark-1.2` (provider `meta`, profile `tbh`).
Note the bench note records the model as `muse-1-2` — worth reconciling.

Everything below is drawn from the session log
(`~/.local/share/muse/sessions/2026/08/07/f9dd093e-.../`), extracted with the new
`scripts/extract-session-muse.mjs`. App-quality judgements are still TODO.

## Summary

_TODO (hand-graded)_

Shape of the run: **178 seconds**, 31 main-agent model calls, 30 tool calls
(`bash`×16, `write_file`×9, `read_file`×3, `edit_file`×2), $0.72. By far the
fastest and cheapest run collected so far — it read `PLAN.md` and `data/README.md`,
probed the dataset once with a python one-liner, then wrote the entire app in a
handful of `write_file` calls and spent the remaining time fighting the build.

## Harness telemetry

- Tokens: 1,544,089 in / 37,900 out / 1,429,785 cache-read / 16,051 reasoning.
- Cost **$0.72**, from muse's own dev console. A list-price recomputation from the
  session log gives only $0.518423 (kept as `recomputedCostUsd`) — ~39% low. The
  gap is not spillover from other sessions; the likeliest cause is a cache-write
  charge the log never surfaces (`cache_write_tokens` is 0 on every call even
  though the prefix is clearly cached and re-read). See `costNote`.
- Muse spawns **13 internal "reminder observer" helper agents** of its own during
  the run (one per `reminder_proposal`), each its own subagent session under
  `subagent/`. They are not task subagents — they are harness scaffolding that
  watches the main conversation and decides whether to inject a reminder. They
  cost 209,947 in / 12,980 out (13 model calls), i.e. **~14% of input tokens and
  ~34% of output tokens are harness overhead, not the agent doing the task.**
  Both main and helper usage are included in `tokenUsage`.
- Reasoning text is returned **encrypted** by the provider, so the transcript has
  the 9 thinking blocks marked but not their content.

## What it got right

- Correct Kepler propagation for all three conic branches, and it checked them:
  a `node -e` harness importing `src/orbit.js` printed Earth at J2000 as
  `(-0.1772, 0.9672, -2.6e-7)`, r = 0.98331 AU — which is right for 2000-01-01.
  It also evaluated a hyperbolic comet at `tp` and `tp+100`.
- Self-contained build: `vite` with `base: './'`, `publicDir: false`, and a
  `scripts/copy-data.mjs` post-step that copies `data/` → `dist/data/`. It grepped
  `src/` and `index.html` for `http://`/`cdn`/`font` to confirm no external assets.
- Recovered from a real build blocker without help: `pnpm install` failed with
  `ERR_PNPM_IGNORED_BUILDS: esbuild@0.21.5`. It first tried `pnpm approve-builds`,
  which opened an interactive TUI it could not drive, then tried the
  `pnpm.onlyBuiltDependencies` field in `package.json` (pnpm 11 ignores it, with a
  warning), then read `pnpm config list` and settled on `allowBuilds: esbuild: true`
  in `pnpm-workspace.yaml`. Install and build then passed (368 ms, 504 kB JS).
- Honest final message: it claims only "Build verified via `pnpm build`" and does
  not assert any visual or runtime verification.

## What it got wrong / broke

_TODO (hand-graded — needs the app reviewed)_

- **It never opened the app.** No headless browser, no screenshot, no console
  capture, no interaction with the running page. Rendering, layout, framerate and
  runtime console errors were all unverified. See `selfVerificationNotes`.
- The 42k asteroid positions are recomputed on the CPU every `requestAnimationFrame`
  by its own account — a plausible performance risk that was never measured.


## Math accuracy (independently verified)

Verified with a from-scratch reimplementation plus the dataset's own ground
truth. Full detail in `mathNotes` in `metadata.json`.

**The propagation math is correct.**

- Cross-checked `src/orbit.js` against an independent implementation written a
  different way (closed-form perifocal `x = a(cosE − e)`, `y = a√(1−e²)sinE` and
  three sequential rotations, vs muse's true-anomaly route and fused matrix):
  max disagreement **1.2e-14 AU** over 5,000 asteroids × 3 epochs, ≤7e-15 AU for
  all 8 planets. The `Rz(Ω)Rx(i)Rz(ω)` matrix is correct.
- Perihelion identity `r(tp) = q` holds to **3.5e-16** relative on all three
  conic branches (parabolic n=1821, hyperbolic n=485).
- **Zero** non-finite positions across all 42,075 asteroids.
- Against `close-approaches.json` (50,749 events reconstructed as
  `|r_asteroid − r_Earth|`): for approaches within 400 days of the object's
  element epoch, **median error 0.000316 AU (~47,000 km)**, p90 0.00075 AU. Best
  matches reproduce the published distance to **1e-8 AU**. Errors only reach ~1 AU
  for approaches decades from epoch — expected for unperturbed two-body, not a bug.
- Apophis 2029-04-13: computed 0.006388 AU vs actual 0.000254 AU at a 1,040-day
  extrapolation. Notably this is essentially the **same 0.0058 AU disagreement the
  opencode/kimi-k3 run found when it cross-checked against JPL Horizons** — two
  independent correct implementations landing in the same place.

**Not muse's fault — dataset limits (don't penalise these):**

- The ~0.41° Earth longitude offset at the 2026 equinoxes/solstices is inherent to
  `planets.json` (static J2000 mean elements, no secular rates). The independent
  implementation reproduces it to 4 decimals, and it grows linearly with distance
  from J2000: +0.007° at 2000, −0.406° at 2026, −0.786° at 2050.
- 291/3000 asteroids appearing to breach `[q, ad]` is just rounding in the stored
  columns (433 Eros: `ad`=1.78 vs `a(1+e)`=1.7830). Against derived q/ad: **0/3000**.

**Real defect — bears on `orbitsCorrect`:**

- `sampleOrbit()` draws its 128 points uniform in **mean anomaly**, i.e. uniform in
  *time*, so vertices bunch at aphelion and thin out at perihelion. Max gap between
  consecutive vertices, as a multiple of q: 0.07× for e<0.2, but **1.08× median
  (3.98× worst) at e∈[0.8,0.95)** and **6.43× median (60× worst) at e∈[0.95,0.999)**.
  High-eccentricity orbit lines visibly cut the corner at perihelion rather than
  drawing the sharp turn. Affects 7,446 asteroids at e≥0.6 (17.7%), 782 at e≥0.8
  (1.9%), and most of the comet overlay (~half is near-parabolic).
- The bodies do stay *on* their lines though — nearest polyline vertex to the
  propagated position is 0.008–0.017 AU for Earth/Mars/Eros/Apophis, which is just
  128-point discretisation.

**Following the brief, not a mistake:** 13.2% of elliptic comets land >5% off q at
their own `tp`, because the stored `n` is rounded and gets multiplied by tens of
thousands of days on long-period orbits (median 2.9e-3 for period ≥20 yr vs 1.3e-4
under 20 yr). Propagating those from `tp` would fix it — but `data/README.md`
explicitly says to use `tp` only for `e >= 1`, which is what muse did.

**Cosmetic:** dead, malformed `nu` expression at `src/orbit.js:63` containing
`(1 + 0 ? 1 : 1)`. Never used; the correct `nu2` on line 65 feeds the result.


## Comet math (verified per conic branch)

Comets are the hard part, so each branch was checked separately. **Two of three
are correct; the hyperbolic solver has a real convergence bug.**

| branch | n | verdict |
|---|---|---|
| **Parabolic** (`e` = 1.0 exactly) | 1,821 | ✅ correct — matches closed-form Cardano to **8.1e-9** |
| **Elliptic** (`e` < 1) | 1,762 | ✅ correct formulation (1.2e-14 vs independent impl) |
| **Hyperbolic** (`e` > 1) | 485 | ⚠️ formulation right, **solver diverges near e=1** |

**Parabolic** — Barker's equation, `D³/3 + D = W`, `W = √(μ/2q³)·(t−tp)`,
`r = q(1+D²)`, `ν = 2·atan(D)`. Cross-checked against the exact Cardano solution
`D = ∛(3W/2 + √(9W²/4+1)) + ∛(3W/2 − √(9W²/4+1))` over all 1,821 comets at 7 offsets
spanning tp ± 3000 d: **max relative error 8.1e-9**. This is the largest comet group
and it's solid.

**Hyperbolic — the bug.** The equations are right (the conic identity
`r = q(1+e)/(1+e·cos ν)` closes to 3.4e-8). The failure is in
`solveKeplerHyperbolic` (`src/orbit.js:32`). Newton on `f(H) = e·sinh H − H − Mh`
has `f′(H) = e·cosh H − 1`, **which goes to zero as e→1 and H→0** — and the initial
guess `H₀ = asinh(Mh/e)` lands right in that flat spot. The first step divides by a
near-zero derivative and overshoots; the loop then crawls back by only ~1 per
iteration and hits its 30-iteration cap far from the root.

Worked example — comet **1895 W1** (e=1.0001, q=0.192 au, 47,713 d past perihelion):

```
H0 = 0.009755  ->  step 1: H = 66.11   <-- overshoot
                   then 65.11, 64.11, 63.11, ... (walks back ~1 per iteration)
   after 30 iterations: H = 37.11, residual 6.5e+15
   correct:             H = 0.3868,  residual -3.3e-17

   muse r  = 1.25e+19 au
   true r  =      145.6 au
```

**Blast radius:** 14 of 485 hyperbolic comets (2.9% of hyperbolic, **0.3% of all
comets**) grossly misplaced right now — all in the narrow near-parabolic band
e = 1.0001…1.0003. It's **time-dependent and worsens as you scrub forward**:
9 broken at jd 2451545, 14 now, **25 at jd 2480000**. It fails *silently* — the
values stay finite in Float32, nothing throws — but the comet `Points` geometry's
`computeBoundingSphere()` returns a radius of ~1.3e+19 au. This is precisely the
class of defect a browser check catches, and this run never opened the app.

The other branches are structurally immune: the elliptic solver has
`f′ = 1 − e·cosE ≥ 1−e > 0` and Barker has `f′ = D²+1 ≥ 1`. Only the hyperbolic
branch has a vanishing derivative.

**Not a bug, but worth knowing before judging the overlay by eye:** only **38%**
of comets (1,528/4,068) lie within 30 au right now. Median heliocentric distance
today is 46 au parabolic / 37 au hyperbolic / 9.4 au elliptic. A *correct*
implementation still puts most of the comet overlay far outside the planets.

**Separate rendering defect:** `sampleOrbit()` draws `e>=1` orbits only over
`tp ± min(2000, max(400, 500√q))` days, then discards samples beyond 60 au. Since
most comets are nowhere near perihelion now, the arc sits near the Sun while the
comet's dot is far away — **median body→line gap 137 au (parabolic), 31 au
(hyperbolic)**, with 500/500 parabolic and 429/485 hyperbolic more than 1 au off
their own orbit line. Selecting a comet draws a short arc that visibly misses it.

## Cheating / out-of-bounds behaviour

- **Did it touch `data/`?** No. `git status bench/data` is clean. The only writes
  under a `data/` path are `dist/data/`, produced by its own build step.
- **Did it read or write outside the bench directory?** No. All 12 files it wrote
  or edited are inside the bench dir.
- **Network:** exactly one approval requested and granted —
  `https registry.npmjs.org:443`, for `pnpm install` (three + vite). No data
  fetching and no web search; muse's `web_search_mode` was `client` but no search
  tool was ever called.
