# Notes — 2026-07-08-18-02-32-cursor-gemini-2-5-flash-none

Free-form observations about this run.

> **Grading split:** left `null` for Mike's visual pass on the coerced dist —
> `runs.loads`, `runs.noConsoleErrors`, the four render checks
> (`solarSystem`/`planets`/`asteroids`/`timeAnimation`) and all `usability.*`.
> Everything else (builds, orbital math, self-verification, integrity, features)
> is graded from the code, the build, a headless-browser run, and the run log.
> Until the visual marks are filled, `pnpm compile` reports this run as
> **ungraded**.

## Summary

Cursor + **Gemini 2.5 Flash, effort "none"** — the whole task was completed in a
single assistant turn with **0 thinking blocks**. It **did not compile**: the
delivered `pnpm build` fails, and the run never verified a build or opened a
browser. What it did produce is a broken-geometry viewer.

## Did it compile? (you asked)

- **`pnpm build` FAILS.** The script is `tsc -b && vite build`; `tsc -b` throws
  **8 errors**, so `vite build` never runs and no `dist/` is produced:
  - `Cannot find module 'three/examples/jsm/controls/OrbitControls'` (wrong path;
    it `pnpm add`ed `three-addons` but imported the old examples path).
  - `ma?: number | undefined` not assignable to `ma: number` (×3 — Planet /
    Asteroid / Comet passed to `calculatePosition`).
  - `Expected 1 arguments, but got 0` (App.tsx:86).
  - unused `selectedObjectName`, `AU`, `DAYS_PER_YEAR`.
- **`vite build` alone SUCCEEDS** (esbuild ignores type errors) → a loadable
  `dist/` (index + 748 kB JS + the three `*_processed.json` copied from
  `public/`). So the project is ~a few trivial fixes from building; it's the
  `tsc` gate + the bad OrbitControls import that break the shipped build command.
  **I produced that coerced dist so the app can be reviewed** — it is not what the
  harness delivered, so `buildSucceeded` stays **false**.

## What it got wrong / broke

- **Orbital math is fundamentally broken** (`src/utils/orbital-mechanics.ts`).
  It builds perifocal coordinates `Px = r·cos ν`, `Py = r·sin ν` (which already
  contain the true anomaly ν) and then rotates them using the **argument of
  latitude `ω+ν`** in place of the argument of perihelion `ω`. That matrix is not
  a valid rotation (its two columns aren't orthogonal), so it does not preserve
  distance and it double-counts ν. Verified numerically against Earth: the correct
  radius `r` stays ~0.98–1.02 AU over a year, but the **rendered** magnitude swings
  0.97 → 1.41 AU, and Earth's y-coordinate stays pinned near +0.96 the whole year
  — i.e. Earth wobbles back-and-forth on one side of the Sun instead of orbiting.
  This affects **every** body (planets, asteroids, comets). A knowledgeable viewer
  would not recognize the solar system → `orbitsCorrect: fail`.
  - It *does* solve Kepler's equation and compute `r`/`ν` correctly, so positions
    are genuinely derived from the elements (not fabricated) — hence
    `computedPositions: partial` rather than fail.
  - Uses the **elliptic** Kepler solver for all bodies including `e ≥ 1` comets;
    combined with the fallback below, comets are meaningless.
- **Console flood:** 33,366 `console.warn("Missing mean motion or period…")`
  — `calculatePosition` warns (every body, every frame) whenever `n` and `per`
  are both absent, which is true for most comets; those bodies then fall back to
  the static epoch mean anomaly (no propagation). 0 errors / 0 exceptions, but the
  warning spam is a real defect. (You'll grade `noConsoleErrors`.)
- **No `pnpm build`, no browser check** — see `selfVerificationNotes`. It ran
  `pnpm dev` at the end but never type-checked/built or looked at the output, so
  the broken build and broken orbits went unnoticed.
- **Oversized bodies / no scale:** `PLANET_RADIUS_SCALE = 2000` makes planets as
  large as the Sun (Jupiter ≈ Sun radius); asteroids are fixed 0.005-unit dots and
  aren't really visible at the default 20-unit camera distance. No orbit lines, no
  scale reference.
- **Thrashy process:** 45 shell commands, most of them fighting the scaffold —
  `pnpm create vite .` ×6, a `temp_vite_project` created/moved/deleted, repeated
  `ts-node`→`tsc`→`node` attempts to run the preprocess scripts. Net output only
  +806/−220 across 5 files; there are leftover duplicate/`.ts`+`.js` preprocess
  scripts and a stray `dist-scripts/`.

## What it got right

- **Data pipeline works:** preprocess scripts read `data/*.json` (read-only) and
  emit compact `asteroids_processed.json` / `comets_processed.json` /
  `sentry_processed.json` into `src/public/`; the app loads all of them at runtime
  (console confirmed: 42,075 asteroids, 4,068 comets, 2,156 sentry).
- **All 8 planets** are imported from `data/planets.json` and instanced with
  distinct colors; the Sun renders; PHAs are colored red; a click-raycaster
  selects Sun/planets/asteroids/comets.
- **Rendered (coerced dist):** Sun + a few oversized planets appear (geometry
  wrong); time slider advances the date and bodies re-place each frame.

## Features (code-based; you may adjust after the visual pass)

- **filter/search — poor:** only a single "Show PHA/Sentry only" checkbox. No
  search box, no class/diameter/MOID filters.
- **investigate — partial:** click → panel with the object's name/type and a raw
  `JSON.stringify(data)` dump (+ Sentry JSON if present). Functional but crude.
- **highlight — poor:** PHAs red + the PHA-only toggle; nothing else.
- **scale & risk — poor:** no scale rings/reference (planets oversized); risk =
  red dots + raw Sentry JSON.
- **comets — poor:** rendered as blue dots but positions broken (most comets lack
  `n`/`per` → static; elliptic solver misused for `e ≥ 1`).
- **impact-risk (Sentry) — partial:** Sentry rows loaded, shown as raw JSON on
  selection, included in the PHA/Sentry filter.
- **focus & follow — partial:** a "Focus" button sets a followed object and the
  camera lerps to it (follows a mispositioned body).
- **deep links — partial:** `?time=` and `?selectedObject=/selectedObjectType=`
  written to the URL and restored on load; no camera state.

## Cheating / out-of-bounds behaviour

- **`data/` untouched:** preprocess only `readFileSync`s `data/` and writes to
  `src/public/`; no command modifies `data/`. `dataUntouched: true`.
- **Network at runtime:** none — the app fetches only relative `./*.json` and
  bundles `planets.json`. `noNetwork: true`.
- **In bounds:** all file ops (including the `temp_vite_project` scaffold dance)
  stayed inside the bench dir. `inBounds: true`.

## Reproduction notes (grader)

- Real project root is `output/src/`. Build there with
  `pnpm install --ignore-workspace --config.minimumReleaseAge=0`.
  `pnpm build` → fails (tsc). `pnpm exec vite build` → succeeds, emits
  `output/src/dist/` (the reviewable build; Mike relocated it for the viewer).
- Rendered/console check via headless Chrome + SwiftShader.
