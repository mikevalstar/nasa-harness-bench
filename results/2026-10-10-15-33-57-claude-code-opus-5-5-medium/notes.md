# Notes — 2026-10-10-15-33-57-claude-code-opus-5-5-medium

"NEO Orrery": Vite + three.js + TypeScript, with three.js as the only runtime
dependency. A clean 1-shot: the only user input was "Implement the PLAN.md",
with no drops or interventions. The model stayed on `claude-opus-5-5`
throughout. Objective fields are filled in `metadata.json`. Correctness,
usability and feature marks are left null for hand-grading, with the findings
below.

## Summary

The build step (`scripts/prepare-data.ts`) repacks the snapshot into columnar
JSON under `public/data/` (11 MB dist). Unlike the opus-5 and fable-5.1 runs,
nothing is solved on the GPU. Every visible asteroid and comet is propagated on
the CPU in float64 each frame (`propagateVisible` in `src/scene.ts`), and the
shader only projects points. It holds 60 fps with all 42k objects by its own
rAF probe. All eight open-ended directions were attempted. It used the Write
tool for the initial files and Python patch scripts for later fixes. 13.8 min
wall clock, $7.87 at list.

## Math verification (independent)

I imported the harness's own `src/orbit.ts` unchanged and replayed it over the
whole catalogue at J2000, 2026-10-10 and ±50 yr. The reference was solved by
bisection to machine precision and cross-checked against **JPL Horizons**
vectors (heliocentric, J2000 ecliptic, 2026-10-10).

**Solvers: all correct.** Asteroids max 1.4e-12 au at any date, no NaN.
Elliptic comets max 2.6e-8 au. The parabolic branch (Barker, applied only at
exactly e = 1, to 1,821 comets) is exact. The hyperbolic branch has perihelion
on the correct side (+q, the fable-5.1 run's mirror bug is absent) and
converges everywhere except C/1911 S3 (e = 1.0001), which sits 2,400 au out
today, far outside the view.

**Anchors vs Horizons:** Earth 9.4e-4 au (expected J2000 mean-element drift),
Apophis 7.9e-4 au. Its own Earth check (179.6° at the March equinox)
reproduces.

**Comets: one real defect, the near-parabolic element trap.** Elliptic comets
propagate from `ma`/`n` at `epoch` with shape from the recorded `a`.
Hyperbolic comets take `a` from the data with `tp`. Neither uses `q`. With `e`
given to 4 decimals, `a(1−e)` drifts from `q`: 133 of 2,247 non-parabolic
comets imply a perihelion off by more than 10%. For example, C/2024 E1 implies
q = 0.97 au against the real 0.566. A reference built from q/e/tp matches
Horizons to ≤ 0.002 au where the app is far off:

| comet | r today (au) | app vs Horizons (au) | q/tp reference vs Horizons (au) |
|---|---|---|---|
| C/2026 C1 (Tsuchinshan) | 8.16 | **10.05** | 0.002 |
| C/2025 Y1 (ATLAS) | 4.52 | **7.32** | 0.000 |
| C/2025 E1 (PANSTARRS) | 4.00 | **2.63** | 0.000 |
| C/2024 E1 (Wierzchos) | 4.02 | **1.16** | 0.002 |
| C/2024 J3 (ATLAS) | 3.89 | 0.34 | 0.001 |
| C/2025 R3 (PANSTARRS) | 3.00 | 0.22 | 0.001 |

Short-period comets are fine. 2P, 67P and 1P differ from the q/tp reference by
only 0.006–0.04 au (element rounding) and drift from Horizons by the same
amount as the reference does.

**Blast radius, checked against Horizons.** My replay flagged 48 comets
within 6 au where the app and the q/tp reference differ by more than 0.1 au
today. I queried Horizons for all 48, and 47 resolved:

- **25 are this app's defect.** The reference lands within 0.05 au of Horizons
  (most within 0.002 au), while the app is 0.1–10 au off. 10 of them are more
  than 1 au off, and 22 are inside 6 au. All 25 are recent near-parabolic
  comets (C/2023 through C/2026).
- **22 are a two-body limit, not a bug.** The reference is as far from Horizons
  as the app is. These are lost or heavily perturbed comets with old elements:
  D/1770 Lexell, 3D/Biela, 5D/Brorsen, the 73P fragments and the SOHO
  sungrazers.

That is essentially the fable-5.1 run's blast radius (25 mirrored hyperbolic
comets inside 6 au, 0.1–10 au off). Comets are **off by default**. When they
are switched on, the default "periodic only" scope includes these comets. It
is the same trap as the muse-1.3 and astra runs, but milder, because the
solver itself is sound.

**Its own claims:** the README says open orbits are propagated "from
perihelion time", which is true for hyperbolic and parabolic comets but not for
near-parabolic elliptic ones. Its comet self-check tested r(tp) ≈ q for six
comets, including Hale-Bopp at e = 0.995. That test cannot catch this defect,
and no recent comet was ever compared with a known position.

Strict marks would be `computedPositions` = pass and `orbitsCorrect` =
partial. It is **graded like fable-5.1** instead: correctness all pass, with
the comet defect taken in `features.comets` = good. The two runs have
comparable comet defects and get the same score, 99.

## What it got right

- **Reproducible build.** Clean `pnpm install --frozen-lockfile && pnpm build`
  (prepare-data, `tsc --noEmit` under strict + `noUncheckedIndexedAccess` +
  `erasableSyntaxOnly`, vite build) succeeds, and `dist/` is byte-identical to
  the committed one. `base: './'`.
- **Sound browser review.** It ran Playwright with real Chrome, with `console`
  and `pageerror` listeners attached before navigation, a request listener for
  external fetches, and an fps probe. It took six screenshots and read all six
  back. It used real clicks, hover, wheel zoom and search, and read values from
  the DOM.
- **Iterated on what it saw.** It fixed the favicon 404 it caught on the
  console. It saw a suspicious comet cluster in a screenshot and chased it
  down numerically. The cluster is the 78 fragments of 73P, which is real data,
  and it says so in the wrap-up instead of "fixing" it.
- **Solvers.** Danby-style starter for e ≥ 0.8, a convergence test, Barker only
  at exactly e = 1, and an asymptotic starter for large hyperbolic M.
- Hazard-first draw order. Diameter-from-H with albedo 0.14, marked "~".
  Honest limitations section in the README: the two-body Apophis 2029 miss
  (2.5 LD vs 0.1 LD) is stated up front.

## What it got wrong / broke

- The near-parabolic comet trap described above.
- C/1911 S3: the hyperbolic Newton solve fails to converge. Not visible.
- Starfield, scale and visual polish were not assessed here; they need the
  running app.

## Cheating / out-of-bounds behaviour

- **Did it touch `data/`? No.** `git status bench/` is clean.
  `prepare-data.ts` reads `data/` and writes only `public/data/`.
- **Runtime network? No.** The only fetch is the relative `./data/<file>`. The
  only absolute URLs in the bundle are three.js's XHTML namespace and a
  jcgt.org citation in a shader comment. Its Playwright request log showed no
  external requests.
- **Out of bounds? No.** All writes stayed inside the bench dir or the session
  scratchpad. It ran `ls /Applications` and `which playwright` to find a
  browser. `npm view` and `pnpm install` are tooling. `pkill` only targeted its
  own preview server.

## Objective run stats

| | |
|---|---|
| wall clock | 829 s (13.8 min) |
| assistant messages / tool calls | 45 / 46 (28 Bash, 12 Write, 6 Read) |
| thinking blocks | 34 |
| screenshots taken / read | 6 / 6 |
| context window at end | ~146K tokens |
| source | 13 files, 2,845 lines; 1 runtime dep (three) |
| bundle | 594 KB (151 KB gzip); dist 11 MB with data |
| cost | $7.87 at list (see `costNote`); $11.94 at Opus 5 rates |

## Grading

Fully graded, **99**, matching fable-5.1 mark for mark. Every mark is pass
except `features.comets` = good. The operator reviewed the running app and
found no issues. `broken` = false. `summary` and `tags` are left empty, as on
the fable-5.1 run.
