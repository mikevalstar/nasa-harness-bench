# Notes — 2026-08-12-19-08-48-cursor-grok-4-6-medium

Cursor CLI (`cursor-agent` 2026.08.11) · grok-4.6 · medium · approval mode
`unrestricted`. First **CLI**-interface Cursor run in the bench; earlier Cursor
runs were `agent-window`.

## Summary

A very fast run — **338 s wall, 44 tool calls, one user turn, zero corrections
after the first build failure**. It read `PLAN.md` and the data schema, probed the
catalogue with four throwaway `python3` one-liners, then wrote the whole app in
three bursts of `Write` calls (vanilla three.js + Vite, no framework, 1,408 lines
across 5 JS files). One build failure (top-level await against the `es2020`
target), fixed by wrapping `boot()`; the second build passed. It then read
`dist/index.html`, globbed `dist/`, `ls`-ed `dist/data`, and stopped.

`pnpm install && pnpm build` reproduces the committed `dist/` **byte-for-byte**
from a clean tree. Integrity is clean on all three checks. The asteroid and
planet math — the headline of this bench — is correct to the limit of its own
float32 packing and anchors to JPL Horizons. **The comet propagation is where it
breaks down**: two of the three comet branches place objects on the wrong conic,
confirmed against Horizons.

It never opened a browser. No server, no screenshot, no console capture.

## Math verification

Method: replay the harness's own `src/orbit.js` against the **actual packed
`.bin` files it ships**, over the whole catalogue (42,075 asteroids + 4,068
comets) at four dates (J2000, today, ±50 yr), against an independent
bisection-solved Kepler reference, with JPL Horizons (heliocentric, J2000
ecliptic, `VEC_TABLE=1`) as external truth.

Propagation is CPU-side in float64 — the shaders only size points — so no
float32 shader emulation was needed. The float32 exposure is in the *packed
elements* (`scripts/pack-data.mjs` stores everything, including JD epochs, as
`Float32Array`; a JD near 2.46e6 quantises to 0.25 d).

### What is correct

| | result |
|---|---|
| Planets | machine precision vs reference (worst 8e-16 relative) |
| Asteroids, all 42,075 | worst **3e-4** relative, worst **1.2e-4 au** absolute; **0 objects >1% off at any of the four dates** |
| Frame / rotation | correct — perifocal→ecliptic→Y-up swizzle verified; a sign or axis error would be O(r) and is absent |
| Barker's equation (true `e == 1`, 1,821 comets) | correctly derived and solved |
| Horizons anchor — 433 Eros @ today | app **2.7e-4 au (0.017%)** from Horizons — the expected two-body-vs-perturbed residual |

The entire asteroid error budget is float32 element packing, not the algorithm.
That is the right call for 42k objects and it costs nothing visible.

### What is wrong — comets

The dataset rounds `e` to 4 dp but gives `a`, `q`, `n`, `tp` at full working
precision (`n` matches `k/|a|^1.5` to a median 1.3e-4, while `q/(e−1)` disagrees
with `a` by a median 2.6%). **`a` is the trustworthy field; `e` is the rounded
one.** Three defects follow from reading it the other way round:

**1. Hyperbolic branch discards the given `a`** — `src/orbit.js:72`

```js
const a = aIn > 0 ? aIn : q / Math.max(e - 1, 1e-8);
```

JPL writes `a` **negative** for hyperbolic orbits, so `aIn > 0` is never true and
the semi-major axis is always rebuilt from the 4-dp `e`. For the many
`e = 1.0001` comets that is ~2× wrong. It then takes mean motion from the data's
`n` (which corresponds to the *true* `|a|`), so the orbit is internally
inconsistent as well.

- 323 of 485 hyperbolic comets >1% off; **220 of them rendered**.
- Horizons, C/2024 E1 (Wierzchos) @ today: true r = 3.330 au, app draws it at
  **1.820 au** — 1.72 au off. A reference using the given `a` lands 0.002 au from
  Horizons.
- Worst rendered: C/1989 Q1 drawn at 33.96 au vs 61.56 au true (**27.8 au off**).

**2. The parabolic branch is applied to a band, not to `e == 1`** — `src/orbit.js:125`

```js
} else if (e < 1.000001) {   // reached whenever e >= 0.995
```

Genuinely elliptical comets with `0.995 ≤ e < 1` are propagated on a parabola.
Harmless where `r ≪ a`, badly wrong where it isn't: C/1843 D1 (a = 64.27 au,
aphelion 128.5 au) is drawn at **181.5 au — beyond its own aphelion**, on a
trajectory that never returns. 119 comets >1% off at today, 32 of them rendered.

**3. The elliptic branch drives from the rounded `ma`, not `tp`** — `src/orbit.js:60`

`ma` is given to 2 dp; for long-period comets with `n ~ 1e-5 °/day` that rounding
is worth hundreds of days of motion, while `tp` is given to 0.01 d. Horizons @
today:

| | Horizons | app (`ma`-driven) | reference (`tp`-driven) |
|---|---|---|---|
| C/2026 L1 | r = 5.225 au | 1.046 au off | **0.001 au off** |
| C/2025 Q1 | r = 10.891 au | 1.464 au off | **0.001 au off** |

21 rendered comets affected. This one is a defensible reading of JPL's elements
rather than a clear bug — but `tp` is present on every comet record and is
strictly better.

### Blast radius

Filtering by what the app actually draws (`viz.js:308` hides comets beyond 60 au),
at today's date:

- 3,398 of 4,068 comets rendered; **273 of them (8.0% of what you see) >1% off**
- error: median 0.71 au · p90 4.11 au · max 27.79 au · 97 objects >1 au · 23 >5 au
- by branch: 220 hyperbolic · 32 parabolic-band · 21 elliptic
- **asteroids and planets: zero affected**

Mitigating: the comet overlay is a checkbox that ships **unchecked**
(`index.html:55`, `viz.js:247,256`), so none of this is visible until the user
turns comets on. The 42k asteroids that the bench is actually about are correct.

### Documentation drift

`README.md` claims *"Comets with `e ≥ 1` are propagated from perihelion time `tp`
(hyperbolic / Barker's equation), not from mean anomaly."* The code applies that
path from `e ≥ 0.995`, not `e ≥ 1` — the README describes the intended behaviour,
not the shipped branch condition, and the gap is exactly defect #2.

## Build

Clean-room rebuild (fresh copy of `output/`, real `data/` copy, no `node_modules`,
no `dist/`): `pnpm install && pnpm build` → **exit 0**, and `diff -rq` against the
committed `dist/` is **empty**. Same asset hashes. `buildSucceeded = true`.

Grading-environment caveat, not a defect in the run: this machine's default pnpm
is 11.21.0, which hard-fails on `ERR_PNPM_IGNORED_BUILDS` (esbuild); the bench ran
under pnpm 10.33.0, where that is a warning. Rebuilt with
`PNPM_CONFIG_STRICT_DEP_BUILDS=false` to match the bench's pnpm semantics.

## Integrity — all three pass

- **dataUntouched** — `git status --porcelain bench/` clean. Every `data/` access
  in the log is a read: four `python3 -c` one-liners that `json.load` and print.
  `scripts/pack-data.mjs` reads `data/` and writes only to `public/data/`.
- **noNetwork** — the only `fetch(` calls (`src/main.js:7,14`) take relative
  `./data/...` URLs. The built bundle contains exactly one absolute URL,
  `http://www.w3.org/1999/xhtml` (three.js `CSS2DRenderer` namespace string). No
  XHR, no WebSocket, no dynamic import of a remote URL.
- **inBounds** — all 7 shell commands ran in the bench dir; all 12 file writes are
  inside it. Nothing touched the home directory, this repo, or other projects.

`cheated = false`.

## Self-verification — no attempt

The full 44-call log contains **no browser of any kind**: no Playwright, no
Puppeteer, no headless Chrome, no `vite preview`, no server, no `curl`, no
screenshot, no DOM dump, no console capture, and no numeric self-check of its own
output. Post-build verification was: `Read dist/index.html`, `Glob dist/**/*`,
`ls -lh dist/data`. That establishes the files exist and nothing more — it never
executed the app it wrote.

Both marks are `fail`, and unusually this is not a channel technicality (the
common failure of grepping browser stderr without page-level logging) — there was
simply no attempt. Note the run also finished in 338 s, so this is not a case of
running out of budget before verifying.

## Cost — $0.59

Cursor CLI persists no usage locally. That was checked exhaustively, not assumed:
all 206 blobs in the store, the `agent-transcripts` JSONL, the
`~/.cursor/ai-tracking/ai-code-tracking.db` tables, and `cli-config.json`. The
store keeps only the *final context window* — **58,938 / 256,000 tokens**
(conversation 45,183 · tools 9,172 · rules 1,642 · skills 1,510 · system 902 ·
subagents 529) — which is a snapshot, not a total. `cli-config.json` does
independently corroborate the bench metadata: `grok-4.6`, effort `medium`,
`maxMode: false`, `fast: false`.

Token counts are therefore **UI-sourced**, read off the Cursor usage dashboard:

| bucket | tokens | rate | cost |
|---|---:|---|---:|
| input | 84,873 | $2.00 / MTok | $0.170 |
| cache read | 456,704 | $0.50 / MTok | $0.228 |
| cache write | 0 | — | $0.000 |
| output | 32,327 | $6.00 / MTok | $0.194 |
| **total** | **573,904** | | **$0.59** |

Cache read is 80% of the tokens but only 39% of the cost. Grok 4.6 has a
long-context band at ≥200K tokens that doubles rates to $4/$12 — it does **not**
apply here, since peak context was 58,938.

Rate table validated the cheap way: recomputing the 2026-07-08 cursor grok-4.5
run from its recorded buckets gives **$1.2708** against its recorded **$1.27**.

Schema caveat: that older grok-4.5 row stores `tokenUsage.input` *inclusive* of
cached tokens (`total = input + output`), whereas this row uses four disjoint
buckets summing to `total`, per AUTO_EVAL §2. The two rows are not comparable
field-by-field; `total` and `estimatedCostUsd` are.

## Tooling added

`scripts/extract-session-cursor-cli.mjs` — new extractor for the CLI interface.
The CLI does not use the globalStorage `state.vscdb` that
`extract-session-cursor.mjs` reads; it keeps a per-agent content-addressed blob
store whose root is a small protobuf indexing JSON messages in AI-SDK shape. The
script locates the chat by `cwd`, walks the blob graph, and writes
`session/{cursor-cli-session.json,transcript.md,session-metadata.json}` plus
`runlog.txt`. Reasoning needed a second pass: the JSON message stream stores it
as an encrypted signature with `text: ""`, but root field 8 indexes a parallel
ordered event stream that carries the summaries in **plain text**. The extractor
now recovers all 14 (15,311 chars) and interleaves them, pairing positionally and
only when the two streams agree in count.

## Filled vs. left for hand-grading

**Filled from evidence:** `timeTakenSeconds` (338), `buildSucceeded`, `cheated`,
`contextWindowFinal`,
`grade.runs.builds`, all three `grade.integrity.*`, `selfVerificationNotes`,
`grade.selfVerification.*` (fail/fail — no attempt, not arguable), `costNote`.

**Proposed, please confirm:**
- `grade.correctness.computedPositions` → **pass**. Positions are genuinely solved
  from the elements; nothing fabricated; anchored to Horizons.
- `grade.correctness.orbitsCorrect` → **good**. Planets and all 42k asteroids are
  correct to packing precision, but two of three comet branches put objects on the
  wrong conic. If you weigh comets more heavily, `partial` is defensible; the
  overlay being off by default is the argument for `good`.
- `grade.features.comets` will want to account for §2 above once you have looked
  at the overlay.

**Left `null` — needs the running app:** `broken`, `summary`, `tags`,
`grade.runs.loads`, `grade.runs.noConsoleErrors`, all `grade.usability.*`, all
`grade.features.*`, and `grade.correctness.{solarSystem,planets,asteroids,timeAnimation}`.

**Filled from the Cursor dashboard (UI-sourced, labelled as such in `costNote`):**
`tokenUsage`, `estimatedCostUsd` ($0.59).

## Running app — graded by Claude (2026-09-01)

Served the committed `dist/` and drove it in headless Chrome over CDP with
`Runtime.enable` before navigation, 12 screenshots across scenarios.

**Console: one error on every load**, and it is the important one:

```
THREE.WebGLProgram: Shader Error 0 - VALIDATE_STATUS false … ERROR: 0:73: 'color' : redefinition
```

`src/viz.js:203` declares `attribute vec3 color;` in the asteroid
`ShaderMaterial` while `:226` also sets `vertexColors: true`, so three.js
prepends its own `attribute vec3 color;` and the vertex shader fails to compile.
The comet `Points` clones that material (`:253`). Result: the 42k-object cloud
that the bench is about is not drawn as designed — the operator sees black dots
on the black background in a real browser; headless Chrome draws nothing for
that layer. The counts, filters and picking all still operate on the invisible
points (a drag selected 2016 TY10), which is how the harness's own
`Glob dist/**/*` check could look fine. One line — `attribute vec3 color;` —
would fix it, and a single browser load would have shown it.

**Everything else works**, and works well: loader clears; Sun, 8 planets, orbit
lines, labels; play advances the clock; drag and wheel move the camera (verified
through the camera hash); search → detail panel with elements, MOID, H/diameter
and the full close-approach list; Sentry table for risk objects; Follow/Frame
with banner and F key; PHA (2,541) and Sentry (2,156) filters match the data;
MOID slider; cold-load deep link restores date, selection, filters, follow and
camera.

**Marks** (see `metadata.json`): runs 100/100/0 · correctness asteroids `poor`,
rest pass with `orbitsCorrect` good · usability camera pass, scale good, legible
partial (the primary data layer is illegible), noUiIssues good · features
comets `fail` (overlay never renders), highlight `poor` (colour coding invisible),
scaleRisk `partial` (size-by-diameter invisible; LD/MOID/Sentry numbers fine),
filterSearch and impactRisk `good`, the rest pass.
