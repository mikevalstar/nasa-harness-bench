# Notes — 2026-09-04-19-04-18-codex-gpt-6-astra-medium

Codex CLI 0.153.3 · gpt-6-astra (medium) · 510 s · 10 files written, 3 edited ·
122 source lines, zero dependencies · $1.48 at list price.

## Summary

Every *solver* in `src/orbits.js` is correct, and unusually so: an independent
universal-variable (Stumpff) propagation agrees to **1e-15 au median, worse than
1e-9 au nowhere**, across all 42,075 asteroids, all 4,068 comets in all three
conic branches and all 8 planets, at four dates spanning a century. All three
are safeguarded (bisection-bracketed Newton for the ellipse, step-clamped Newton
for the hyperbola, closed-form Barker for the parabola), the Barker constant is
the right one — the previous run in this bench got it wrong by a factor of two —
and no object anywhere produces a non-finite position.

The defect is not in the solving; it is in **which elements the elliptic branch
chooses to solve**, and it lands exactly on the hard orbits. `position()` builds
the ellipse from `(a, e)` and takes its phase from `ma` whenever `ma` is present.
For a near-parabolic comet both of those are the wrong element to trust: `a` is
`q/(1−e)` amplifying a 4-decimal `e`, and `ma` is rounded to 0 or 360 where `tp`
is exact. Against JPL Horizons, **C/2020 M5 (ATLAS) lands 6.86 au from its true
position — 49 % of its heliocentric distance — and C/2014 UN271
(Bernardinelli-Bernstein) 22.6 au out**, while the same code fed `(q, e, tp)`
reproduces Horizons to ~0.01 au. 288 comets are misplaced by more than 0.05 au
inside the app's own outer-system framing. The e ≥ 1 branches, which do use `q`
and `tp`, are exact — including both interstellar objects, to 3–6e−4 relative.

The whole thing is 122 lines of dependency-free JavaScript driving raw WebGL,
with 5 Node tests that actually execute the shipped app. It never got a browser
(the environment had none), and it said so rather than claiming otherwise.

## Math verification

Method per AUTO_EVAL §7. The reference is a **universal-variable two-body
propagation from the perihelion state** using Stumpff C(z)/S(z) — one algorithm
covering every conic, structurally unlike the elliptic/hyperbolic/parabolic
split under test, so agreement is not self-confirmation. The harness's
`position()` was transcribed verbatim (same iteration counts, same tolerances,
same branch conditions) and replayed over the whole catalogue.

One methodological note that matters: the dataset's `a`, `e`, `q` and `n` are
each independently rounded, so `q ≠ a(1−e)` and `n ≠ k·a^-1.5` at the 1e-4
level. Comparing an implementation that uses `(a, e, n)` against a reference
that uses `(q, e, k)` produces ~1e-3 au of pure data-rounding noise that hides
everything real. The reference therefore uses exactly the elements the harness
feeds its own solver, with μ set so the reference's geometric mean motion equals
the record's `n`.

### Agreement with the independent reference

| set | n | median | p99 | max |
|---|---|---|---|---|
| asteroids (today) | 42,075 | 1.1e−15 au | 1.4e−12 au | 4.1e−10 au |
| comets, elliptic | 1,762 | 4.7e−14 au | 3.8e−8 au | 2.9e−6 au |
| comets, parabolic (e = 1 exactly) | 1,821 | 3.6e−13 au | 2.7e−12 au | 1.0e−11 au |
| comets, hyperbolic | 485 | 9.3e−13 au | 2.1e−11 au | 3.3e−11 au |
| planets | 8 | — | — | 5.8e−13 au |

Same picture at J2000, −50 yr and +50 yr. The largest number anywhere in the
table (2.9e−6 au on one e = 0.9999 comet at r ≈ 31 au) is conditioning near the
parabolic limit, not a defect. **Non-finite positions: 0 at every date** — worth
checking explicitly, because the app skips any point that isn't finite, so a NaN
would silently delete an object.

### Anchored to JPL Horizons

Heliocentric J2000 ecliptic vectors, `CENTER=500@10`, target-body line verified
on each query (`COMMAND='1P'` returns *Kerberos*, so the designation was resolved
through the DASTCOM index to record 90000091 for Encke's 2022 apparition).

| object | astra (au) | Horizons (au) | \|Δ\| | relative |
|---|---|---|---|---|
| 433 Eros | −0.389114, −1.566419, −0.230252 | −0.389280, −1.566631, −0.230263 | 2.70e−4 | 1.7e−4 |
| 99942 Apophis | −0.714530, −0.624249, +0.016422 | −0.714907, −0.623892, +0.016397 | 5.20e−4 | 5.5e−4 |
| 2P/Encke | 2.367208, 0.406394, 0.281839 | 2.356182, 0.410523, 0.281206 | 1.18e−2 | 4.9e−3 |

All three are the expected two-body-from-osculating-elements residual (Encke
larger because it is a comet with non-gravitational forces, propagated four
years from a 2022 epoch on four-significant-figure elements). Frame, rotation
and sign conventions are right.

### The parabolic branch, checked independently

`orbits.js` solves Barker as `D = 2·sinh(asinh(1.5B)/3)` with
`B = k·(t−tp)/√(2q³)`, which is the root of `D³ + 3D = 3B`. To confirm that
constant rather than take it on faith, I finite-differenced the resulting
trajectory and computed the specific angular momentum, which for a parabola must
be exactly `k√(2q)`:

```
astra   D³+3D=3B : h = 0.029795 at every epoch   (expected 0.029795)
the 6B variant   : h = 0.059590 at every epoch   (exactly 2× too fast)
```

Astra is right. **The previous run in this bench (cursor + gemini-3.8-flash)
uses the 6B form and therefore traverses its parabolic orbits at twice the
correct rate** — I missed that in its write-up and have since corrected its
notes.

## Comets — the hard orbits

The universal-variable check above shares the harness's *choice* of elements, so
by construction it can only catch a bad solve, not a bad element. Re-running the
comparison against a reference built from `(q, e, tp)` — the elements that stay
well-determined as e → 1 — separates the two, and the split is stark.

| branch | n | median | p90 | max | misplaced >0.05 au with true r < 37 au |
|---|---|---|---|---|---|
| e < 0.99, ordinary ellipse | 1,219 | 6.2e−3 au | 3.4e−2 | 0.79 au | 53 |
| 0.99 ≤ e < 0.999 | 347 | 0.13 au | 0.78 | 11.7 au | 153 |
| 0.999 ≤ e < 1, near-parabolic | 196 | 0.91 au | 3.44 | 22.6 au | 82 |
| e = 1 exactly, Barker | 1,821 | 3.5e−13 au | 8.8e−13 | 1.0e−11 au | 0 |
| 1 < e ≤ 1.001, near-parabolic hyperbola | 227 | 2.3e−12 au | 1.0e−11 | 3.3e−11 au | 0 |
| e > 1.001, clearly hyperbolic | 258 | 5.1e−13 au | 1.7e−12 | 4.5e−12 au | 0 |

Everything that goes through `tp` and `q` is exact. Everything that goes through
`ma` and `a` degrades as e → 1. Two independent causes, both visible in the
decomposition (median / max error at today, elliptic comets only):

| band | n | astra vs both fixed | timing only (use `tp`) | shape only (use `q`) |
|---|---|---|---|---|
| e < 0.99 | 1,219 | 6.2e−3 / 0.79 au | 3.9e−4 / 0.23 | 5.7e−3 / 0.79 |
| 0.99 ≤ e < 0.999 | 347 | 0.13 / 11.7 au | 8.0e−2 / 11.7 | 5.7e−2 / 1.0 |
| 0.999 ≤ e < 1 | 196 | 0.91 / 22.6 au | 0.19 / 22.6 | 0.63 / 18.0 |

In the worst band, shape dominates for 131 of the 196 objects and timing for the
other 65 — neither cause can be dismissed as the minor one.

**Cause 1 — `ma` is preferred over `tp`, and for long-period comets `ma` carries
no information.** The dataset rounds `ma` to two decimals of a degree. For a
comet with a 500-million-day period that quantum is worth thousands of days of
phase, and in practice the file just stores `0` or `360`. Recovering the implied
perihelion time from `(ma, epoch, n)` and comparing it with the recorded `tp`:
631 of the 1,762 elliptic comets disagree by more than a day, 258 by more than a
month, 12 by more than a year, worst **3,347 days** (C/2014 UN271). `position()`
only falls back to `tp` when `ma` is null — which is true for zero comets in this
dataset, so that fallback is dead code.

**Cause 2 — the ellipse is built from `a`, which is `q/(1−e)` with `e` rounded to
four decimals.** For e = 0.9999 the last digit of `e` moves `a` by a factor of
two. Comparing the recorded `q` against the `a(1−e)` the code implicitly uses:
64 of the 185 comets with e > 0.999 disagree by more than 10 %, worst **1.96×**
(C/2020 M5: `q` = 3.004 au, `a(1−e)` = 5.900 au). Asteroids are untouched by
this — their median `|a(1−e)/q − 1|` is 2.8e−4 — which is why the defect is
invisible until you look at comets specifically.

### Horizons anchors on the hard cases

| object | e | branch | astra vs Horizons | `(q, e, tp)` vs Horizons |
|---|---|---|---|---|
| C/2019 Q4 (Borisov) | 3.3565 | hyperbola | **1.4e−2 au** (3.0e−4 rel) | 1.4e−2 au |
| C/2025 N1 (ATLAS) | 6.1414 | hyperbola | **6.5e−3 au** (6.0e−4 rel) | 6.5e−3 au |
| C/2020 M5 (ATLAS) | 0.9999 | ellipse | **6.86 au** (4.9e−1 rel) | 1.4e−2 au |
| C/2014 UN271 (B-B) | 0.9991 | ellipse | **22.56 au** | 0.15 au |
| 2P/Encke | 0.8477 | ellipse | 1.2e−2 au (4.9e−3 rel) | — |

Both interstellar objects are placed essentially perfectly. C/2020 M5 is put on
the wrong side of the Sun: Horizons has it at r = 14.14 au, the app draws it at
r ≈ 7.6 au in a different direction.

### What its own tests could and could not catch

`orbits.test.mjs`'s catalogue-wide case asserts that every supplied orbit
produces a **finite** position at several dates — a NaN sweep, which it passes,
and which is genuinely worth having. It asserts nothing about accuracy, and its
other three cases are a circular orbit, a perihelion/aphelion pair and an
open-orbit symmetry check, none of which exercise a near-parabolic ellipse.
Nothing in the suite would have flagged a comet 6.9 au out of place.

### Documentation drift

None found — the README describes what the code does, including the element
choices that turn out to be the defect. Its "Scientific assumptions" section
states two-body propagation from each object's own epoch, supplied `n` when
present else the Gaussian constant, hyperbolic orbits from `tp`, *exactly*
parabolic orbits via Barker, no perturbations, no UTC/TDB correction, scrubber
spanning 2020–2030, encounter distances read from the JPL records rather than
recomputed. Each claim matches `src/`. What is missing is any awareness that
"supplied mean motion when available" is the wrong policy for a long-period
comet — the README documents the choice without noticing its consequence.

## Build

Clean rebuild from a copy of `output/` with a real `bench/data` in place of the
symlink, `node_modules` and `dist` deleted: `pnpm install && pnpm build && pnpm
test` all succeed, exit 0, 5/5 tests pass. `diff -rq` against the committed
`dist/` is clean. There are no dependencies at all — `package.json` has neither
`dependencies` nor `devDependencies`; the build is a 6-line `node scripts/build.mjs`
that copies `index.html`, `src/` and `data/` into `dist/`. Nothing is bundled or
minified, so `dist/src` is byte-identical to `src`.

`dist/` carries the full 27 MB of raw JSON, and the app fetches all five files
including the 16 MB `asteroids.json` and 10 MB `close-approaches.json` on load.
No packing step, though the PLAN allowed one.

## Integrity — all three pass

- **dataUntouched** — `git status --porcelain bench/` clean. `build.mjs` only
  reads `data/` and writes `dist/`. It verified this itself, byte-for-byte:
  a final command compares every `data/*` against `dist/data/*` with
  `Buffer.equals` and throws on mismatch ("All built data copies match original
  bytes").
- **noNetwork** — the only runtime fetch is
  `fetch(new URL('../data/'+name+'.json', import.meta.url))`, i.e. relative to
  the module. No CDN, no import maps, no dependencies to pull. The one absolute
  URL in the source is the `http://localhost:5173` banner printed by the dev
  server. It also removed a stray `@import url('')` from `style.css` when it
  noticed it.
- **inBounds** — all 9 shell commands ran in the bench directory; all 13 file
  writes/edits are relative paths inside it. It did request escalated sandbox
  permissions once, to bind port 5173 for its own dev server after the sandboxed
  attempt failed with `EPERM` — a localhost bind inside the bench dir, with a
  stated justification, not a filesystem escape.

## Self-verification — tried, blocked, compensated

Full account in `selfVerificationNotes`. The short version: it went looking for a
browser, escalated permissions to get its server running so it could use one,
called `cua.getBrowser(...)` and was told "No browser is available" — then said
so plainly in its final message instead of implying it had looked.

What it did instead is the strongest non-browser self-check I have seen in this
bench: `src/app.test.mjs` imports the **shipped** `src/app.js` under a stubbed
DOM and WebGL context with a `fetch` shim over the real data files, then asserts
on live rendered values (catalogue count `42,075`, inspector showing Eros,
search filtering to Apophis, a selected comet badged `COMET`). The last
assertion failed — Halley came back badged `NEAR-EARTH ASTEROID`, because comets
also appear in `asteroids.json` — and it diagnosed the duplicate-designation
bug, de-duplicated `filter()` by `pdes`, and re-ran to green. That is a real
found-and-fixed user-visible defect, caught by a test rather than by a screenshot.

Marks proposed **partial / partial**, left `null` for you: the attempt was
genuine and blocked by the environment, which is what `partial` is for, but a
strict reading of "reviewed the console" is `fail`, since no console was ever
read.

## Cost — $1.48

GPT-6 Astra list price: $10.00/M input, $1.00/M cached input, $50.00/M output.

| bucket | tokens | rate | cost |
|---|---|---|---|
| input (fresh) | 37,190 | $10.00/M | $0.372 |
| cache read | 400,640 | $1.00/M | $0.401 |
| output (incl. 688 reasoning) | 14,228 | $50.00/M | $0.711 |
| **total** | **452,058** | | **$1.484** |

Output is 3% of the tokens and 48% of the cost — the inverse of the cache-heavy
Cursor runs. OpenAI lists a $12.50/M cache-write rate; Codex reports no
cache-write bucket, so if every fresh input token were in fact billed as a write
the run would be $1.58. Largest single request was 47,158 input tokens, so the
>272k long-context multiplier never applies.

Notably cheap for what it produced: 452k total tokens and 14k output, against
5.1M tokens for the previous run.

## Objective run stats

| | |
|---|---|
| wall clock | 510 s task (549 s span), 3.1 s to first token |
| tool calls | 12 (11 `exec`, 1 `js`) wrapping 9 shell commands + 4 patch batches |
| assistant turns | 4 |
| files | 10 written, 3 edited |
| source | 122 lines total (`orbits.js` 30, `app.js` 43, tests 39, `index.html` 9, `style.css` 1) |
| dependencies | none (raw WebGL, no build tooling) |
| dist | 28 MB, 27 MB of it raw JSON; nothing bundled |
| tests | 5, all passing from clean |

## Tooling added

`scripts/extract-session-codex.mjs` did not recognise Codex 0.153's new shape:
shell work now arrives as a single `exec` custom tool whose input is a JS
snippet calling `tools.exec_command({cmd})` / `tools.apply_patch(body)`, rather
than as `function_call`s. The extractor logged the calls fine but recorded
0 shell commands and 0 files written, which is exactly the evidence §5 needs.
Added a small JS-string scanner (`parseExecSnippet`) that recovers the commands
and the patched file list from those snippets; re-running now reports 9 shell
commands, 10 files written, 3 edited. Older rollouts are unaffected — the new
branch only fires on `p.name === "exec"`.

## Filled vs. left for hand-grading

**Filled from evidence:** `timeTakenSeconds` (510), `buildSucceeded`, `cheated`,
`tokenUsage`, `estimatedCostUsd` ($1.48), `costNote`, `grade.runs.builds`, all
three `grade.integrity.*`, `selfVerificationNotes`.

**Proposed, please confirm:**
- `grade.selfVerification.consoleReview` / `displayReview` → **partial / partial**.
  Left `null` because the strict reading is `fail` — see above.
- `grade.correctness.computedPositions` → **pass**. Genuinely solved from the
  elements at runtime, Horizons-anchored, nothing fabricated.
- `grade.correctness.orbitsCorrect` → **good** (revised down from *pass* after
  the comet pass below). Planets, all 42,075 asteroids and all 2,306 e ≥ 1
  comets agree with an independent propagator to machine precision, and the
  parabolic constant is independently confirmed via angular momentum. Against
  that, the elliptic branch's element choice misplaces 288 comets by more than
  0.05 au inside the app's own framing, two of them by 6.9 and 22.6 au against
  Horizons. **partial** is defensible if the comet overlay weighs heavily for
  you; the argument for `good` is that 43,000 of the ~46,000 bodies are exact
  and the failures are confined to near-parabolic comets.

**Revised 2026-09-04**, second pass on the comet math specifically: `orbitsCorrect`
moved from *pass* to *good*. The first pass used a reference that shared the
harness's element choices, so it validated the solvers but not the choice of
elements — see "Comets — the hard orbits".

**Left `null` — needs the running app:** `broken`, `summary`, `tags`,
`grade.runs.loads`, `grade.runs.noConsoleErrors`, all `grade.usability.*`, all
`grade.features.*`, and
`grade.correctness.{solarSystem,planets,asteroids,timeAnimation}`.

Worth watching for when you open it: it recomputes all 42,075 Kepler solves on
the main thread (throttled to ~45 ms while playing) with no worker and no GPU
propagation, so frame rate under play is the open question; the 27 MB cold load;
whether raw WebGL points at 1.7 px read as a legible cloud; and the sidebar list
paginating 70 at a time over 42k results.
