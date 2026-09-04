# Notes — 2026-09-04-18-47-47-cursor-gemini-3-8-flash-medium

Cursor 3.19.7 (agent window) · gemini-3.8-flash · 539 s · 25 files, +4,252 lines ·
$1.03 at list price.

## Summary

React + three.js + TypeScript build with a real Kepler engine. Planet and asteroid
positions are correct — anchored against JPL Horizons they land within 2–5 × 10⁻⁴ au,
which is the expected two-body-from-elements residual, so the frame, the rotation
and the sign conventions are all right. The asteroid defect is a tail: a hard
3-iteration Newton solve that stops converging above e ≈ 0.9, costing ~21 of
42,075 objects. The comet overlay is a different story — it is comprehensively
wrong. Its Barker constant is off by a factor of two, so all 1,821 exactly-parabolic
comets travel their orbits at twice the correct rate (median 27 au out of place
today), and on top of that the near-parabolic hyperbolic branch diverges and
flings ~62 comets past 10⁴ au (worst 4.5 × 10²⁸ au). Comets are an optional
overlay, off by default, which is the only thing keeping the blast radius small.
No browser was ever opened; the build ships 27 MB of raw JSON because the
"preprocess" step is a file copy.

> **Revised 2026-09-04** after the codex + gpt-6-astra run. My first pass checked
> the parabolic branch against a reference that had copied this run's own Barker
> constant, so it compared the bug against itself and reported ~1e-7 au of error.
> The §2d section below is the correction; the marks proposed at the bottom moved
> with it.

## Math verification

Method per AUTO_EVAL §7: an independent damped-Newton reference iterated to
machine precision, plus a transcription of the harness's own code path — same
iteration counts, same break thresholds, same branch conditions, and `Math.fround`
on every element the app stores in a `Float32Array` — replayed over all 42,075
asteroids and 4,068 comets at J2000, today (JD 2461287.5) and ±50 yr. External
anchor: JPL Horizons heliocentric ecliptic vectors (`CENTER=500@10`,
`REF_PLANE=ECLIPTIC`), target-body line checked on each query.

### Anchored to Horizons — the core is right

At JD 2461287.5, replaying `AsteroidPointCloud.updatePositions` exactly:

| object | harness (au) | Horizons (au) | \|Δ\| | relative |
|---|---|---|---|---|
| 433 Eros | −0.389114, −1.566419, −0.230252 | −0.389280, −1.566631, −0.230263 | 2.70e−4 au | 1.7e−4 |
| 99942 Apophis | −0.714529, −0.624249, +0.016422 | −0.714907, −0.623892, +0.016397 | 5.20e−4 au | 5.5e−4 |

That residual is physics (two-body propagation of osculating elements), not a
defect. A frame, sign or rotation error would be O(r) and unmistakable at this
scale. Planets are exact to double precision against the reference (≤ 1e−14 au)
because `PlanetView` uses the full 5-iteration `propagatePerifocal` in doubles.

Float32 storage of the elements (`a`, `e`, `n`, `ma`, and the P/Q basis vectors)
costs nothing measurable: median asteroid error today is 1.4e−7 au. `epoch` and
`tp` are correctly kept in `Float64Array`, which is where a float32 Julian date
would have destroyed everything.

### Defect 1 — asteroid solver: 3 iterations, break at 1e−5

`AsteroidPointCloud.updatePositions` runs a fixed 3-iteration Newton from
`E₀ = M + e·sin M` and breaks at `|dE| < 1e−5`. That is fine to ~e = 0.9 and
diverges from the converged solution past it. Replayed over all 42,075 objects:

| date | err > 1e−3 au | err > 1e−2 au | of those, r < 6 au | worst |
|---|---|---|---|---|
| J2000 | 54 | 25 | 13 | 56.5 au |
| today | 46 | 21 | 7 | 106.8 au |
| −50 yr | 36 | 16 | 12 | 149.3 au |
| +50 yr | 46 | 17 | 11 | 54.8 au |

Worst object at every date is (2017 UR52), e = 0.9964, a = 353.8 au — misplaced
by 107 au today at a true r of 22.8 au. Only 58 of 42,075 objects have e > 0.95,
so this is a 0.1 % tail. Inside the default inner-system view (r < 6 au) seven
objects are displaced by more than 0.01 au today, the largest being C/2015 D1
(SOHO) at 0.44 au — visible as a misplaced dot if you were looking for it, but not
something that changes the picture. A single extra iteration, or a break at 1e−12,
would have removed the whole tail.

### Defect 2 — comets: the near-parabolic band is broken

`propagatePerifocal` routes on `e < 0.9999 && a > 0` → elliptic, else
`|e − 1| ≤ 1e−4` → Barker/parabolic, else hyperbolic. Three separate things go
wrong, all in the same band.

**2a. Float32 rounding pushes 79 comets out of the parabolic branch.** The band
test is applied to the *float32* copy of `e`. The data contains 1,900 comets with
`|e − 1| ≤ 1e−4`: 1,821 at exactly e = 1, 46 at 0.9999, 33 at 1.0001. `fround(1.0001)`
= 1.000100016…, whose distance from 1 is 1.0001e−4 > 1e−4, so all 33 fall through
to the hyperbolic branch; `fround(0.9999)` rounds the other way, so those 46 fall
into the elliptic branch. 79 comets are routed by a rounding artifact rather than
by their elements.

**2b. The hyperbolic solver diverges for near-parabolic e.** 8 Newton iterations
from `H₀ = asinh(M/e)`. At e ≈ 1.0001 the derivative `e·cosh H − 1` is ~1e−4 near
the start, so the first step overshoots to H ≈ 45; from there Newton walks back at
roughly 1 per iteration and 8 iterations are nowhere near enough. Residual check
over the hyperbolic branch (485 comets):

| date | non-converged | worst bogus r |
|---|---|---|
| J2000 | 230 (47.4 %) | 7.3e25 au |
| today | 236 (48.7 %) | 4.5e28 au |
| +50 yr | 415 (85.6 %) | 4.2e30 au |

C/1895 W1 (Perrine) — e = 1.0001, q = 0.192 au, true r ≈ 146 au today — is placed
at 4.5e28 au. The correct Barker branch, which its data-sheet eccentricity should
have selected, gives r = 229.6 au.

**2c. The elliptic solver's 5 iterations lose the long-period comets.** 457 of the
1,762 elliptic-branch comets are off by more than 0.01 au today, worst 7.1e3 au
(C/1969 T1 Tago-Sato-Kosaka, e = 0.9999). Same root cause as defect 1, at higher e.

**2d. The Barker constant is wrong by a factor of two.** `solveBarker` solves
`B³ + 3B = 6W` with `W = k·Δt/(√2·q^1.5)`. Barker's equation is
`k·Δt/√(2q³) = D + D³/3`, i.e. `D³ + 3D = 3W` — half the time term. The
independent test is the specific angular momentum, which for a parabola must be
exactly `k√(2q)` at every epoch; finite-differencing the resulting trajectory
gives:

```
this run   D³+3D=6W : h = 0.059590   (q = 1.5 au)
correct    D³+3D=3W : h = 0.029795   (expected 0.029795)
```

Every parabolic comet therefore sweeps its orbit at exactly twice the correct
rate. This hits all 1,821 comets with e = 1 exactly — the largest single group in
the file:

| date | comets on the branch | median error | p90 | max |
|---|---|---|---|---|
| J2000 | 1,821 | 9.6 au | 92.8 au | 549 au |
| today | 1,821 | 27.3 au | 104 au | 554 au |
| +50 yr | 1,821 | 58.1 au | 122 au | 562 au |

Not one of the 1,821 is within 0.01 au of where it belongs. At J2000, 198 of them
have a true position inside 6 au while being drawn somewhere else entirely.

### Blast radius

Comets are an optional overlay and `CometPointCloud` ships with
`setVisible(false)` in the constructor, so none of §2 is visible until the user
turns comets on. With the overlay on, though, the overlay is mostly fiction:
1,821 parabolic comets at twice the correct orbital rate (§2d, 1,584 of them
inside the 150 au `maxDistance` framing), 62 flung past 10⁴ au by the diverging
hyperbolic solver, and 457 long-period elliptic comets off by more than 0.01 au.
Of the 4,068 comets, roughly 1,300 well-behaved elliptic ones are the part you
can trust. Inside the default inner-system view the count of measurably
misplaced comets is small only because few comets are inside 6 au at any given
moment.

Nothing overflows to `Infinity` or `NaN`: the worst coordinate over the
scrubber's 1980–2060 range is ~1e30, comfortably inside float32's 3.4e38, so the
`Points` bounding sphere stays finite and the cloud still renders. A slightly
worse case would have produced a NaN bounding sphere and dropped the entire comet
layer — this is luck, not design.

Asteroid defects are invisible in practice: 7 objects out of 42,075 misplaced by
a measurable amount inside the default view.

### Its own claims

The four numeric self-checks it ran in Node (§ self-verification) all passed and
were all honest, but none of them exercised the code it shipped — the scratch
scripts iterate Newton 10–15 times with a 1e−12 break, while the shipped asteroid
path uses 3 iterations and 1e−5. It verified a solver it then did not ship.

## Build

Clean rebuild from a copy of `output/` with a real `bench/data` in place of the
symlink, `node_modules` and `dist` deleted: `pnpm install && pnpm build`
succeeds, exit 0, no typecheck step in the build script (`vite build` only —
`tsc` is never invoked, so TypeScript errors would not fail this build).
`diff -rq` against the committed `dist/` is clean, so the committed output is
reproducible from the committed source.

`dist/` is 28 MB, of which 27 MB is data: `scripts/preprocess.mjs` is a plain
`copyFileSync` loop from `data/` into `public/data/`. Despite the PLAN explicitly
allowing build-time preprocessing for performance, the app fetches and
`JSON.parse`s the raw 16 MB `asteroids.json` plus the 10 MB
`close-approaches.json` on every page load. Bundle is 788 KB (215 KB gzip).

## Integrity — all three pass

- **dataUntouched** — `git status --porcelain bench/` clean. `preprocess.mjs`
  only reads `data/` and writes `public/data/`.
- **noNetwork** — every runtime fetch is a relative `./data/*.json`. The only
  absolute URLs in the bundle are library strings: W3C namespaces (SVG, MathML,
  XHTML, xlink, XML), a `jcgt.org` paper citation inside a three.js shader
  comment, and React's `react.dev/errors/` link. `pnpm add` during the build is
  tooling.
- **inBounds** — all 27 shell commands ran in the bench directory; all 25 file
  writes are inside it. The one read outside is
  `~/.claude/skills/unslop/SKILL.md`, which Cursor pulled in as a global rule at
  the start of the run — read-only, harness-initiated, same class as a harness
  reading its own config. Nothing touched this repo or other projects.

## Self-verification — no attempt

See `selfVerificationNotes`. Short version: no browser, no screenshot, no console
capture. It did serve `dist/` over a throwaway `http.createServer` and `fetch`
every asset and data file under a `/subpath/` prefix to prove relative paths
resolve — a real and slightly unusual check — but that never executes the bundle.
consoleReview = **fail**, displayReview = **fail**.

## Cost — $1.03

Gemini 3.8 Flash list price, promotional rates through 2026-12-31: $0.75/M input,
$3.75/M output, $0.075/M cached input, no cache-write charge (implicit caching).

| bucket | tokens | rate | cost |
|---|---|---|---|
| input (fresh) | 515,210 | $0.75/M | $0.386 |
| cache read | 4,481,447 | $0.075/M | $0.336 |
| output | 80,872 | $3.75/M | $0.303 |
| **total** | **5,077,529** | | **$1.026** |

Cache reads are 88 % of the tokens and 33 % of the cost. Numbers are UI-sourced
(Cursor dashboard) — Cursor keeps no token counts in its local state DB — and are
labelled as such in `costNote`. On 2027-01-01 list price doubles, which would put
the identical run at ~$2.05.

## Objective run stats

| | |
|---|---|
| wall clock | 539 s (9.0 min) |
| tool calls | 76 (27 shell, 26 edits, 10 reads, 9 todo, 2 glob, 2 ripgrep) |
| thinking blocks | 43 |
| context window at end | 119,514 / 200,000 |
| source | 19 TS/TSX files, 3,977 lines |
| bundle | 788 KB (215 KB gzip); dist 28 MB, 27 MB of it raw JSON |
| deps | three, react, react-dom, lucide-react |

## Filled vs. left for hand-grading

**Filled from evidence:** `timeTakenSeconds` (539), `buildSucceeded`, `cheated`,
`contextWindowFinal`, `grade.runs.builds`, all three `grade.integrity.*`,
`selfVerificationNotes`, `grade.selfVerification.*` (fail/fail — no attempt, not
arguable), `costNote`.

**Filled from the Cursor dashboard (UI-sourced, labelled in `costNote`):**
`tokenUsage`, `estimatedCostUsd` ($1.03).

**Proposed, please confirm:**
- `grade.correctness.computedPositions` → **pass**. Positions are genuinely
  solved from the elements at runtime, nothing fabricated, Horizons-anchored to
  1.7–5.5e−4 relative.
- `grade.correctness.orbitsCorrect` → **partial** (revised down from *good*
  after §2d). Planets exact and 42,054 of 42,075 asteroids correct to storage
  precision, which is the case for a higher mark; against that, three of the
  four comet branches are wrong, including a factor-of-two error affecting every
  one of the 1,821 parabolic comets. **good** is still defensible on the grounds
  that the overlay is off by default and the asteroid cloud is the main event.
- `grade.features.comets` will want to account for §2 once you have looked at the
  overlay.

**Left `null` — needs the running app:** `broken`, `summary`, `tags`,
`grade.runs.loads`, `grade.runs.noConsoleErrors`, all `grade.usability.*`, all
`grade.features.*`, and
`grade.correctness.{solarSystem,planets,asteroids,timeAnimation}`.

Worth watching for when you open it: the 27 MB cold load (no loading of a packed
binary, just raw JSON), the comet overlay toggle, and whether the 3-iteration
solver produces visible jitter when scrubbing fast.
