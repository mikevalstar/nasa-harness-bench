# Notes — 2026-11-09-17-19-35-claude-code-fable-5-2-medium

"Near-Earth objects in 3D": Vite + three.js + TypeScript, with three.js as the
only runtime dependency. A clean 1-shot: the only user input was "implement the
PLAN.md". The model stayed on `claude-fable-5-2` throughout. Objective fields
are filled in `metadata.json`, and the run is fully graded (see Grading).

## Summary

`build/prepare-data.ts` runs inside the Vite build and repacks the snapshot
into columnar JSON (8.3 MB dist). Asteroids are one draw call, with Kepler's
equation solved per vertex on the GPU in float32 and the same solver on the CPU
in float64 for picking, labels and readouts. Comets are propagated on the CPU
each frame by a universal-variable solver from `q`, `e` and `tp`, one code path
for elliptic, parabolic and hyperbolic orbits. All eight open-ended directions
were attempted. It never used the Write or Edit tools: every file came from a
Bash heredoc or a Python patch script. 24.8 min wall clock, $9.89 at list.

## Math verification (independent)

I imported the harness's own `src/bodies.ts` and `src/orbit.ts` unchanged, fed
them the built `dist/data` tables (element-for-element identical to
`bench/data`), and replayed the whole catalogue at 1900, today − 50 yr, J2000,
2026-11-09, today + 50 yr and 2200. The reference is a separately written
safeguarded Kepler solve, Barker for e = 1, and bisection on the hyperbolic
equation, anchored to **JPL Horizons** vectors (heliocentric, J2000 ecliptic,
2026-11-09).

| path | objects | max error, any date |
|---|---|---|
| asteroids, CPU float64 | 42,075 | 1.4e-12 au |
| asteroids, GPU float32 (emulated) | 42,075 | 5.2e-5 au (p99 under 5e-6) |
| planets | 8 | 1e-14 au |
| comets, elliptic | 1,554 | 3.5e-11 au |
| comets, parabolic | 1,821 | 1.4e-10 au |
| comets, hyperbolic | 485 | 1.9e-9 au |

No non-finite values anywhere. The float32 emulation covers the shader's six
fixed Newton iterations, its cubic starter for e ≥ 0.6, and the 2000-day
mean-anomaly re-anchor at both ends of its range. Worst case is 2017 UR52
(e = 0.9964); worst relative error is 1e-4.

**Anchors vs Horizons:** Earth 9.1e-4 au, the other planets 7e-4 to 3e-2 au
(J2000 mean elements, no rates), Apophis 9.7e-4, Eros 2.6e-4, Icarus 1.7e-4,
Phaethon 3.9e-4, Bennu 3.9e-2 (its elements date from 2011).

**Comets: the near-parabolic trap is absent.** The opus-5.5, fable-5.1,
muse-1.3 and astra runs placed recent near-parabolic comets 0.2–10 au off by
taking shape or phase from the recorded `a` / `ma`. This run uses neither:

| comet | r today (au) | app vs Horizons (au) | opus-5.5 run (au) |
|---|---|---|---|
| C/2026 C1 (Tsuchinshan) | 7.92 | 0.0016 | 10.05 |
| C/2025 Y1 (ATLAS) | 4.30 | 0.0003 | 7.32 |
| C/2025 E1 (PANSTARRS) | 4.02 | 0.0004 | 2.63 |
| C/2024 E1 (Wierzchos) | 4.35 | 0.0028 | 1.16 |
| C/2024 J3 (ATLAS) | 3.87 | 0.0008 | 0.34 |
| C/2025 R3 (PANSTARRS) | 3.38 | 0.0007 | 0.22 |

(The opus-5.5 column was measured a month earlier, so r differs slightly.)
Interstellar C/2025 N1 is 0.009 au off at 13 au, 2I/Borisov 0.015 au at 49 au.

**Largest residuals are a two-body limit, not a defect.** 9P/Tempel 1 is
0.65 au from Horizons and 67P 0.33 au, both from 2015–2016 elements. An
`ma`/`n`/`epoch` model lands within 0.013 au of the app for each, so no choice
of elements fixes them. 1P/Halley is 0.19 au off at 35 au.

**Its own claims hold.** The README describes both solvers as the code runs
them, and states the two-body Apophis 2029 miss (about 2.5 LD against a
recorded 0.1) up front.

Proposed and set: `computedPositions` = pass, `orbitsCorrect` = pass. There is
no comet defect to carry into `features.comets`.

## What it got right

- **Reproducible build.** Clean `pnpm install --frozen-lockfile && pnpm build`
  (`tsc --noEmit` under strict, then vite) succeeds and `dist/` is
  byte-identical to the committed one. Its 6 vitest tests pass. `base: './'`.
- **Sound browser review.** Playwright with real Chrome, `console` and
  `pageerror` listeners attached before navigation, plus failed-request,
  ≥400-response and external-request listeners. It served `dist/` inside an
  iframe on a sub-path, the way the site is graded. Ten distinct screenshots
  read back, including an 820×620 layout.
- **Iterated on what it saw.** Fixed size-scale label collisions, a
  follow/fly ease that never landed on the body, and distant comets reading as
  a clump beside the Sun. It ran its own float32 emulation of the shader solver
  to pick the iteration count.
- **Chased the console 404 to its source.** The 404 survived its favicon fix,
  so it printed the message URL and found it was `/favicon.ico` of its own test
  host page. My load with a favicon on the wrapper shows an empty console.
- Comets that are also in the NEO list (208) are drawn once. Diameters
  estimated from H are labelled as estimates with an albedo range.

## What it got wrong / broke

- Nothing found in the math, build or integrity checks.
- At 820 px wide the two side panels cover most of the scene until one is
  collapsed with the ☰ button. Worth a look when marking `noUiIssues`.
- Planet labels can sit under the left panel ("Jupiter" clipped in the default
  view).

## Headless pass over the built app (evidence for the hand marks)

Served `dist/` under `/sub/path/`, top-level and in an iframe, Chrome via
Playwright with the same listeners. Console output: none. External requests:
none. 60.5 fps with all 42,075 asteroids.

- Search "apophis" → one match; selecting it opens a detail panel with live
  distance, size scale, orbit, and 8 close approaches with "Jump to this pass".
- Follow + deep link: reopening the copied URL in a new tab restores date,
  selection (99942 Apophis) and follow.
- Filters: PHA + ≥ 1 km → 159 of 42,075; approach filter 2029, closer than the
  Moon → 101; Reset restores 42,075.
- Impact risk tab lists Sentry rows (29075, Bennu, 2008 JL3 …) with odds,
  Palermo and window; Flybys tab lists the next approaches from the clock date.
- Comet C/2020 F3 (NEOWISE) on 2020-07-10 via deep link: 0.355 au from the Sun,
  tail drawn, orbit line open.
- Clicking a dot on the canvas selects it. Play advances 3 days in 3 s at the
  default speed; reverse at 10 years/s runs back to 2000.

A scripted pass can't judge legibility, sense of scale or polish.

## Cheating / out-of-bounds behaviour

- **Did it touch `data/`? No.** `git status bench/` is clean.
  `prepare-data.ts` reads `data/` and writes only `public/data/`.
- **Runtime network? No.** The only fetch is the relative `data/<file>`. The
  only absolute URLs in the bundle are the XHTML and SVG namespace strings.
- **Out of bounds? No.** All writes stayed inside the bench dir or the session
  scratchpad. Outside reads: `ls /Applications` and the Playwright cache dir to
  find a browser, and the harness's own spilled tool-result file. The harness
  also loaded two skills by itself: the bundled `dataviz`, and `unslop` from the
  operator's `~/.claude/skills`. That is operator config reaching the run, not
  the model leaving the sandbox.

## Objective run stats

| | |
|---|---|
| wall clock | 1,490 s (24.8 min) |
| assistant messages / tool calls | 46 / 54 (36 Bash, 13 Read, 2 Skill, 2 TaskStop, 1 ToolSearch) |
| thinking blocks | 35 |
| screenshots read back | 10 distinct |
| context window at end | ~222K tokens |
| source | 26 files, 4,252 lines; 1 runtime dep (three) |
| bundle | 635 KB (163 KB gzip); dist 8.3 MB with data |
| cost | $9.89 at list (see `costNote`) |

**Token counts here are deduplicated by API message id.** The session log
repeats a message's usage on every content-block line (100 lines for 46
messages), and `scripts/extract-session.mjs` sums every line. Its totals for
this run are 2.3× too high (314K output, $22.92). The six earlier Claude Code
runs were recorded with that double count, so their costs are not comparable
with this one until they are recomputed.

## Grading

Fully graded, **100**. Every mark is pass. The opus-5.5 and fable-5.1 runs sit
at 99 on `features.comets` = good for the near-parabolic comet defect; this run
does not have it (see the Horizons table above), so `features.comets` = pass.
The operator set the hand marks to pass on that basis. `broken` = false.
`summary` and `tags` are left empty, as on those runs.
