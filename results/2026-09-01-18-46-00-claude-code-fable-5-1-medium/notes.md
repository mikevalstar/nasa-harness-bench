# Notes — 2026-09-01-18-46-00-claude-code-fable-5-1-medium

"NEO Explorer" — Vite + three.js + TypeScript, no other runtime deps. Model
stayed on `claude-fable-5-1` for all 78 real assistant turns. Objective fields
are filled in `metadata.json`; correctness / usability / feature marks are left
null for hand-grading — findings below.

**Not a clean 1-shot.** At 22:55 UTC the API dropped mid-response
("Connection lost mid-response") while it was writing `scene.ts`; the operator
typed `continue` and it picked up. That is the only extra user input. The run
is otherwise the PLAN alone.

## Summary

Same architecture as the opus-5 run: a build step (`scripts/prepare-data.mjs`)
repacks the snapshot into a `Float32Array` of elements plus perifocal basis
vectors and columnar JSON under `public/data/` (14 MB dist), and the asteroid
cloud solves Kepler **in the vertex shader** every frame. Planets, comets,
picking, orbit lines and follow use a CPU solver (`src/orbits.ts`). All 4,068
comets are propagated on the CPU each frame with no visibility cutoff (orbit
lines clipped at 60 au). All eight open-ended directions attempted. Works in the
ecliptic frame and remaps to scene y-up consistently. Never used the Write/Edit
tools — every file was written through Bash heredocs, and later fixes through
`sed`/Python patch scripts.

## Math verification (independent)

Replayed both code paths — the CPU module and a float32 emulation of the GLSL —
over the whole catalogue at J2000, 2026-09-01 and ±50 yr, against a reference
solved by bisection to machine precision, and cross-checked against **JPL
Horizons** vectors (heliocentric, J2000 ecliptic, 2026-09-01).

**Asteroids — correct.** CPU error ≤ 5.7e-13 au everywhere. GPU float32 path:
median 3e-7 au, p99.9 1.3e-5 au, worst **7.6e-4 au** (2017 UR52, e = 0.996, at
37 au from the Sun). Zero objects above 1e-3 au at any date; no NaN. The 8
fixed shader iterations from E = π are enough for the NEO catalogue's maximum
e = 0.9964. Float32 storage of `epoch − J2000` and `days since J2000` (not raw
Julian dates) keeps the time error negligible.

**Planets and named bodies vs Horizons:** all eight planets within 3e-4 to
6e-3 relative — the expected two-body residual from J2000 mean elements.
Apophis 5e-4 au, Eros 2.7e-4 au, Phaethon 7e-4 au (epochs 2 months old);
Bennu 0.04 au and Halley 0.16 au at 35 au (epochs 16 and 59 yr old) — drift,
not code error. Encke 6.6e-3 au.

**Comets — one real, visible defect, and two minor ones:**

1. **Every hyperbolic comet is mirrored.** `hyperbolicXY` returns
   `a·(e − cosh H)` for x with `a` negative, which puts perihelion at −q on the
   P axis instead of +q. The y term has the sign right, so the body is
   reflected through the orbit's Q axis. The orbit-line sampler (`sampleConic`)
   is correct, so a selected hyperbolic comet sits visibly **off its own drawn
   orbit**. Affects all 452 comets with e − 1 ≥ 1e-4. Confirmed against
   Horizons: C/2024 J3 (ATLAS), C/2025 R3 (PANSTARRS) and C/2026 H2 (Leonard)
   are **7.6, 3.0 and 8.7 au** from where the app draws them, while the
   corrected formula matches Horizons to < 1e-3 au. Blast radius today: **25
   hyperbolic comets inside 6 au, all wrong by 0.1–10 au**; 200 inside 30 au.
   Since these are recent, bright, named comets near perihelion, they are the
   ones a user is most likely to click on.
2. **Hyperbolic Newton doesn't always converge.** Fixed 40 iterations from
   H₀ = asinh(M/e); for e − 1 < 1e-3 far from perihelion the derivative
   e·cosh H − 1 is tiny near H = 0 and it crawls (C/1847 T1 needs 57). Five
   comets end up > 1 au off (worst 2.4e7 au). All are beyond 100 au — none
   visible.
3. **Barker band.** Anything with |e − 1| < 1e-4 takes the parabolic branch:
   1,821 comets are exactly e = 1 (exact), 79 are approximated. Much tighter
   than the opus-5 run's ±0.001. Today only 2 of the 17 inside 30 au are off
   by > 0.01 au (worst 0.09 au at r = 8.3 au).

Elliptic comets (1,716, e up to 0.9999) are fine under the 30-iteration cap:
max 1.3e-4 au.

**Its own claims check out, except by omission.** I reproduced its Earth
longitude (100.4° at J2000), the CAD-table agreement (median 3e-4 au within
400 d of epoch) and Halley's aphelion. But its comet self-check only exercised
Halley and Encke (elliptic) and a NaN sweep — no hyperbolic comet was ever
compared with a known position, which is exactly where the bug is. The wrap-up
says comets use "elliptic, parabolic and hyperbolic propagation from perihelion
time", which is true, and one of the three is mirrored.

Suggested marks: `computedPositions` = pass (nothing fabricated; asteroids and
planets essentially exact), `orbitsCorrect` = partial (asteroids, planets,
elliptic and parabolic comets right; every hyperbolic comet on the wrong side
of its orbit, dozens of them in the default view).

## What it got right

- **Build is reproducible.** Clean `pnpm install && pnpm build` (including
  `tsc --noEmit` under strict + `noUncheckedIndexedAccess`) succeeds and the
  `dist/` is byte-identical to the committed one. `base: './'`.
- **Best self-verification channel of any run so far.** With no Playwright
  installed it wrote a minimal CDP driver that enables `Runtime` before
  navigation and listens for `consoleAPICalled` / `exceptionThrown` — the
  correct way to see page-level errors, not the stderr grep the opus-5 run used.
  Five loads, no console output. Six screenshots, five read back, and it
  changed code after looking (H-filter fix for the one unknown-H asteroid, hover
  vs selected visuals, Reset View placement). Real pointer events for hover /
  click / follow. See `selfVerificationNotes`.
- Tight parabolic band, correct handling of `n` from data vs Gauss' constant,
  each body propagated from its own epoch, `tp`-based propagation for comets.
- Diameter-from-H fallback via `1329/√0.14 · 10^(−H/5)` — correct.
- Verified that the empty "PHA approaches near this date" list was actually
  correct for the data rather than assuming a bug.
- Candid README: two-body only, Sun/planets not to scale, UTC.

## What it got wrong / broke

- The hyperbolic mirror (above). One sign. Seen in the running app too: I
  served the committed `dist/`, deep-linked to `sel=c:2024 J3` on 2026-09-01
  and screenshotted it — the selection marker sits well inside Mars' orbit
  while its own drawn orbit arc passes out near Jupiter. Same for C/2026 H2.
- **One asteroid hidden by default.** The H slider is clamped to 9–34 but the
  data's brightest-faint object, 2025 UC11, has H = 34.06, so a fresh load
  says "showing 42,074 of 42,075". It saw that count in its own DOM assertions
  twice, fixed the unknown-H case, and didn't chase the remaining one.
- Hyperbolic solver convergence cap (invisible today).
- Sun and planets drawn "larger than life" with a compressed radius law —
  documented, but a human should judge `usability.scale`.
- Starfield/visual polish not assessed here — needs the running app.

## Cheating / out-of-bounds behaviour

- **Did it touch `data/`? No.** `git status bench/` is clean; the prepare step
  reads `data/` and writes only `public/data/`.
- **Runtime network? No.** Fetches are relative `./data/…` only. The single
  absolute URL in the bundle is three.js's XHTML namespace string (it checked
  this itself, correctly).
- **Out of bounds? No.** All writes inside the bench dir or the session
  scratchpad (server, CDP driver, check scripts, screenshots). Read-only looks
  at `~/.npm/_npx`, `~/Library/Caches/ms-playwright`, `/opt/homebrew` and
  `/Applications` to find a browser. `pnpm install` is tooling.

## Objective run stats

| | |
|---|---|
| wall clock | 1,186 s (19.8 min) |
| assistant turns / tool calls | 78 / 36 (31 Bash, 5 Read) |
| thinking blocks | 31 |
| files via Write/Edit tools | 0 (all heredocs) |
| screenshots taken / read | 6 / 5 |
| context window at end | 155,109 tokens |
| source | 15 files, 2,435 lines; 1 runtime dep (three) |
| bundle | 551 KB (143 KB gzip); dist 14 MB with data |
| cost | $18.59 at list (see `costNote`) |

## Filled vs left for hand-grading

Filled from the log / objective checks: `cheated`, `buildSucceeded`,
`tokenUsage`, `estimatedCostUsd`, `costNote`, `timeTakenSeconds`, `note`,
`runStats`, `selfVerificationNotes`, `mathNotes`, `integrityNotes`,
`grade.runs.builds`, `grade.integrity.*`.
Left null: `broken`, `summary`, `tags`, and all remaining grade marks —
including `grade.selfVerification.*` (proposed pass / pass; the channel is
sound this time) and `grade.correctness.computedPositions` / `orbitsCorrect`
(proposed pass / partial, see above).
