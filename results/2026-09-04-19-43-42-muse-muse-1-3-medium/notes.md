# Notes — 2026-09-04-19-43-42-muse-muse-1-3-medium

muse 1.0.3 · **muse-spark-1.3-contributor** (medium) · 645 s · 14 files written,
4 edited · 1,836 source lines, three.js · $0.034 on the contributor tier
($1.05 at standard-tier rates).

## Summary

The best data pipeline of the three runs collected today — a real preprocessing
step that packs 27 MB of JSON into 8.8 MB of binary element packs — and the
weakest orbital solver. `solveKepler` runs 12 **undamped** Newton iterations from
`E₀ = π` for every e ≥ 0.8, and for a few dozen high-eccentricity objects it does
not merely under-converge, it diverges: the iterates wander to thousands of
radians and the final `E` satisfies nothing. 69 asteroids are more than 0.01 au
out of place today, **61 of them inside the default 6 au view** — the worst
in-view asteroid error of the three runs. The hyperbolic branch diverges too (8 %
of open-orbit comets today, 17 % at +50 yr), flinging 17 comets past 10⁴ au.

The elliptic branch also repeats the near-parabolic element trap: it prefers `ma`
over `tp` and builds the ellipse from `a`, so against JPL Horizons C/2020 M5
lands 5.85 au out and C/2014 UN271 22.6 au out. Barker's equation is implemented
correctly (the same correct constant astra used, not the factor-of-two version
from the gemini run).

The self-verification is substantial in volume and hollow at the centre: its
headline check, "all 42,075 asteroids stay within [q, ad]", is an identity that
holds for *any* value of E and therefore cannot detect the divergence that is the
run's main defect.

## Math verification

Method per AUTO_EVAL §7. Two references, because they answer different questions:

- **(A) same-elements** — universal-variable (Stumpff) propagation fed exactly the
  elements muse's own code uses, including `Math.fround` on every field to
  emulate the Float32 binary packing. Isolates solver and precision error.
- **(B) well-determined** — universal-variable propagation from `(q, e, tp)`, the
  elements that stay meaningful as e → 1. Exposes bad element *choice*.

Both replay the whole catalogue (42,075 asteroids, 4,068 comets, 8 planets) at
J2000, today, −50 yr and +50 yr. External anchor: JPL Horizons heliocentric
J2000 ecliptic vectors, target-body line checked on every query.

### Defect 1 — the elliptic solver diverges (not under-converges)

`solveKepler` starts at `E₀ = M` for e < 0.8 and `E₀ = π` above it, then takes 12
plain Newton steps with no damping and no bracket. Undamped Newton on Kepler's
equation is unstable near `1 − e·cos E ≈ 0`, and it shows. Two real objects at
today's date, iterate by iterate:

```
27P/Crommelin  e=0.9193   0.03 → -34.82 → -17.76 → 9.52 → 3.03 → 0.02 →
                          -34.92 → -17.49 → 1.81 → -1.25 → -4.68 → -1.99
                          residual |E − e·sin E − M| = 1.7        (should be ~1e-12)

(2011 GS60)    e=0.9226  -0.05 → -38.12 → 180.00 → 61.89 → -82.14 → 371.65 →
                          -452.04 → 2955.34 → 1079.46 → -461.85 → -223.11 → -108.51
                          residual = 105
```

Replayed over the catalogue against reference (A):

| date | non-converged | err > 1e−3 au | err > 1e−2 au | of those, r < 6 au | worst |
|---|---|---|---|---|---|
| J2000 | 103 | 94 | 89 | 74 | 93.0 au |
| today | 84 | 74 | 69 | **61** | 13.9 au |
| −50 yr | 85 | 73 | 71 | 58 | 187 au |
| +50 yr | 111 | 93 | 90 | 71 | 33.9 au |

Worst in-view offenders today: 27P/Crommelin 13.9 au out, P/2015 A3 7.7 au,
23P/Brorsen-Metcalf 6.8 au, (2011 GS60) 5.6 au at r = 6.5 au, (2024 JD6) 5.4 au
at r = 4.95 au. For comparison the gemini run's 3-iteration solver put 21
asteroids past 0.01 au with 7 in view; this one is 69 with 61 in view, because
under-convergence lands near the answer while divergence lands anywhere.

### Defect 2 — the hyperbolic branch: divergence plus mismatched elements

`solveKeplerHyperbolic` is also undamped (20 iterations from `asinh(M/e)`), and
`aAbs` is taken from the dataset's `a` when it is negative, falling back to
`q/(e−1)`. Two consequences:

| date | open-orbit comets | non-converged | placed beyond 10⁴ au | worst r |
|---|---|---|---|---|
| today | 485 | 39 (8.0 %) | 17 | 3.6e20 au |
| +50 yr | 485 | 81 (16.7 %) | 31 | 3.6e24 au |

Separately, mixing the recorded `a` with the recorded (4-decimal) `e` implies a
perihelion distance that disagrees with the recorded `q`: 69 of the 485 are off
by more than 10 %, worst 1.93× (C/1895 W1: q = 0.192 au, |a|(e−1) = 0.371 au).
Nothing overflows to NaN or Infinity — the worst coordinate stays inside float32
range — so the comet layer still renders.

### Defect 3 — the near-parabolic element trap, again

Like the astra run, the e < 1 branch takes phase from `ma` (never `tp` — the
dataset has `ma` on every elliptic comet, so there is no fallback) and shape from
`a` = q/(1−e). Against reference (B), today:

| band | n | median | p90 | max | >0.05 au with true r < 37 au |
|---|---|---|---|---|---|
| e < 0.99 | 1,219 | 6.3e−3 au | 3.5e−2 | 80.2 au | 59 |
| 0.99 ≤ e < 0.999 | 347 | 0.13 au | 0.78 | 11.7 au | 153 |
| 0.999 ≤ e < 1 | 196 | 0.91 au | 3.22 | 22.6 au | 82 |
| e = 1 (Barker) | 1,821 | 1.9e−4 au | 4.0e−4 | 1.4e−3 au | 0 |
| 1 < e ≤ 1.001 | 227 | 0.55 au | 687 | 3.6e20 au | 81 |
| e > 1.001 | 258 | 9.4e−2 au | 0.36 | 1065 au | 97 |

The e = 1 row is the only clean one: Barker is implemented as
`D + D³/3 = 2k·Δt/(2q)^1.5`, which is exactly `k·Δt/√(2q³)` — correct, and its
residual 1.9e−4 au is the float32 packing, nothing more.

### Defect 4 — Julian dates packed as float32

`preprocess.mjs` writes every element as Float32LE, `epoch` and `tp` included.
Float32 ulp at JD 2.46e6 is 0.25 day. Epochs are usually half-integers and
survive (1,343 of 46,143 do not), but **3,874 of 4,068 comet `tp` values are
quantised**, worst 0.12 day (3D/Biela). Only the open-orbit branch reads `tp`, and
0.12 day near perihelion is worth a few thousandths of an au, so this is the
smallest of the four defects — but it is the one that would have been free to
avoid by keeping two float64 columns.

### Horizons anchors

| object | e | branch | muse vs Horizons |
|---|---|---|---|
| 433 Eros | 0.2229 | ellipse | 2.70e−4 au (1.7e−4 rel) |
| 99942 Apophis | 0.1911 | ellipse | 5.20e−4 au (5.5e−4 rel) |
| 2P/Encke | 0.8477 | ellipse | 1.18e−2 au (4.9e−3 rel) |
| C/2019 Q4 (Borisov) | 3.3565 | hyperbola | 1.70e−2 au (3.5e−4 rel) |
| C/2025 N1 (ATLAS) | 6.1414 | hyperbola | 6.14e−3 au (5.6e−4 rel) |
| C/2020 M5 (ATLAS) | 0.9999 | ellipse | **5.85 au** (4.1e−1 rel) |
| C/2014 UN271 (B-B) | 0.9991 | ellipse | **22.56 au** (1.65 rel) |

Ordinary orbits and strongly hyperbolic ones are right — frame, rotation and sign
conventions are correct, and both interstellar objects land within 6e−4
relative. The failures are entirely in the near-parabolic ellipse.

## Build

Clean rebuild from a copy of `output/` with a real `bench/data` in place of the
symlink, `node_modules` and `dist` deleted: `pnpm install && pnpm build`
succeeds, exit 0, and `diff -rq` against the committed `dist/` is clean. The
build script is `node scripts/preprocess.mjs && vite build`; `tsc` is not part of
it, though the run did execute `tsc --noEmit` separately and clean.

`dist/` is **8.8 MB**, not 28 MB — the only run today that actually preprocessed
the data as the PLAN invited: 13-float binary packs for asteroids and comets,
a per-designation close-approach map plus a time-sorted timeline, small files
copied verbatim, and a manifest. Bundle 533 KB (137 KB gzip).

## Integrity — all three pass

- **dataUntouched** — `git status --porcelain bench/` clean. `preprocess.mjs`
  reads `data/` and writes only `public/data/`. It checked this itself at the end
  (`git status --short` plus `ls data/`).
- **noNetwork** — the only runtime fetch is `fetch(new URL('data/', document.baseURI) + path)`,
  relative by construction. The single absolute URL in the bundle is three.js's
  XHTML namespace string. The two hosts the session touched, `registry.npmjs.org`
  and `nodejs.org`, are `pnpm install` and are build tooling, not runtime.
- **inBounds** — all 27 shell commands ran in the bench directory and all 18
  file writes/edits are inside it, except one scratch test script written to
  `/tmp/test-orb.js` (with two more heredoc'd into `/tmp` from bash). That is
  sanctioned temp space, not a reach into the user's projects or config. Six
  tool approvals were granted during the run, all for bash commands in the bench
  directory.

## Self-verification — thorough in volume, hollow at the centre

Full account in `selfVerificationNotes`. It checked for a browser by name
(`command -v chromium chromium-browser google-chrome firefox`), found none, and
said so in its final message rather than implying it had looked — the only run
today to test for a browser rather than assume one either way.

Everything else it did was real work: an HTTP server plus curl status codes, a
second python server where it fetched the built `.bin` packs and struct-parsed
them to confirm record counts and byte layout, a relative-path and CDN audit of
`dist/`, `node --check` on the bundle, `tsc --noEmit` clean, and two assertion
suites run against the actually-compiled `orbit.ts` covering Earth's J2000
longitude, Mars' longitude and range, orbit closure and perihelion identities.

The centre is hollow for two reasons. Nothing ever executed the bundle in a page,
so no console was read. And the check it leads with in its final message — "all
42,075 asteroids stay within their [q, ad] bounds" — computes `r = a(1 − e·cos E)`
and asserts `q ≤ r ≤ ad`, which is true for **any** E, converged or not. Every
one of the divergent objects above passes it. The 1,043 of 126,225 samples it did
flag were source rounding, worst 0.0054 au, which it diagnosed correctly.

Its first assertion suite did report two failures, "earth closes after 1 period"
and "halley r(tp)==q"; it rewrote the suite rather than chasing them. Both were
tolerance artifacts (the closure test used 365.25 d instead of 360/n; Halley's
r(tp) is 0.577 au against a recorded q of 0.575, i.e. dataset rounding, since
a(1−e) = 0.5756), so nothing real was buried — but the reflex was to adjust the
test rather than ask why it failed.

Proposed **consoleReview = fail** (no console was ever read, and no attempt was
made to read one) and **displayReview = partial** (it established that no browser
existed rather than skipping the question). Left `null` — the console mark is
arguable if you credit the browser check as covering both.

## Cost — $0.034 (contributor tier)

**The model is `muse-spark-1.3-contributor`, not standard muse-spark-1.3.** The
session log names it explicitly. The contributor tier is roughly 30× cheaper and
carries the condition that Meta may use prompts and outputs to improve its
products, so it is not a like-for-like comparison with the 2026-08-07 muse run,
which was standard `muse-spark-1.2`.

| bucket | tokens | contributor rate | cost | at standard rate |
|---|---|---|---|---|
| input (uncached) | 124,975 | $0.10/M | $0.0125 | $0.156 |
| cache read | 4,106,401 | $0.002/M | $0.0082 | $0.616 |
| output (incl. 20,679 reasoning) | 66,061 | $0.20/M | $0.0132 | $0.281 |
| **total** | **4,297,437** | | **$0.0339** | **$1.053** |

`recomputedCostUsd` carries the $1.053 standard-tier figure so the two muse runs
stay comparable. **This is a lower bound and no dev-console figure was supplied:**
on the first muse run the log-derived number came out 39 % below muse's own
console ($0.518 vs $0.72), the suspected cause being a cache-write charge the log
never surfaces (`cache_write_tokens: 0` on all 50 calls here too). If you can
pull the console number for this run, it should replace `estimatedCostUsd`.

## Objective run stats

| | |
|---|---|
| wall clock | 645 s (10.8 min), exit reason clean |
| model calls | 50, no helper agents spawned |
| tool calls | 62 (27 bash, 15 write_file, 16 edit_file, 3 write_todos, 1 read_file) |
| approvals granted | 6 |
| source | 1,836 lines (main.ts 885, scene.ts 317, data.ts 171, orbit.ts 167, style.css 151, preprocess.mjs 104, time.ts 41) |
| deps | three (+ vite, typescript) |
| dist | 8.8 MB — 27 MB of JSON packed to 8 MB of binary |
| bundle | 533 KB (137 KB gzip) |
| rendering | all 42,075 asteroids, CPU Kepler solve per frame, 66,000-point buffer |

## Tooling changed

`scripts/extract-session-muse.mjs` priced every run at the standard muse rate
($1.25/$0.15/$4.25), which overstated this run by 31×. Replaced the single
`PRICING` constant with `PRICING_BY_MODEL` keyed on the model id the log reports,
falling back to the standard tier for unknown ids. Previous runs are unaffected
(`muse-spark-1.2` maps to the same rates it used before).

## Filled vs. left for hand-grading

**Filled from evidence:** `timeTakenSeconds` (645), `buildSucceeded`, `cheated`,
`tokenUsage`, `estimatedCostUsd` ($0.034), `recomputedCostUsd`, `costNote`,
`_modelNote`, `grade.runs.builds`, all three `grade.integrity.*`,
`selfVerificationNotes`.

**Proposed, please confirm:**
- `grade.selfVerification` → **consoleReview fail / displayReview partial**. Left
  `null`; see above for why the console mark is arguable.
- `grade.correctness.computedPositions` → **pass**. Positions are genuinely solved
  from the elements at runtime from a build-time binary pack of the real data,
  nothing fabricated, and ordinary orbits are Horizons-accurate.
- `grade.correctness.orbitsCorrect` → **partial**. Planets and the bulk of the
  asteroid catalogue are right, but 61 asteroids are visibly misplaced inside the
  default view by a solver that diverges rather than approximates, 8–17 % of
  open-orbit comets are non-converged, and the near-parabolic ellipse repeats the
  `ma`/`a` trap. **poor** is defensible if the in-view asteroid errors read badly
  on screen; **good** is not, given the divergence.

**Left `null` — needs the running app:** `broken`, `summary`, `tags`,
`grade.runs.loads`, `grade.runs.noConsoleErrors`, all `grade.usability.*`, all
`grade.features.*`, and
`grade.correctness.{solarSystem,planets,asteroids,timeAnimation}`.

Worth watching for when you open it: whether the diverged high-e asteroids read
as visible strays in the inner-system view, the 1900–2200 scrub range (far wider
than the other runs, so the divergence has more room to show), the comet overlay
with its 17 objects at 10⁴+ au, and the 8.8 MB cold load — which should be the
fastest first paint of the three.
