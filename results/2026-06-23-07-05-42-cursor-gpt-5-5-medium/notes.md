# Notes — 2026-06-23-07-05-42-cursor-gpt-5-5-medium

Free-form observations about this run.

## Summary

Vite + Three.js static site with a **correct** orbital engine (elliptic /
hyperbolic / parabolic) and a sane scale model (1 AU = 5 scene units, fixed
visual planet radii) — a clear improvement over the gemini cursor run's broken
5000x scale. Builds cleanly, copies `data/` into `dist/`. The main defect is the
**comet overlay**: the math is right, but propagating the whole catalogue to
"now" flings most comets hundreds of AU out, so the layer is a distant,
meaningless scatter. The model never opened the running app, so it never saw this.

## What it got right

- **Orbital math is correct across all three conic types.** Ported `orbit.ts` to
  Python and cross-checked against an independent conic reference: `|pos|`
  matches the conic radius to ~1e-14, and `|pos| = q` exactly at perihelion for
  parabolic/hyperbolic.
  - Constants right: `k = 0.01720209895`, `μ = k²` (AU³/day²), `n = √(μ/a³)`
    fallback when `n` is absent.
  - Perifocal→ecliptic is the standard 3-1-3 (ω, i, Ω) rotation, remapped to
    y-up for Three.js.
  - JD conversion correct (`ms/86400000 + 2440587.5`).
  - **Handles the comet gotcha correctly**: `e≥1` comets are propagated from `tp`
    (parabolic via Barker's equation, hyperbolic via the hyperbolic Kepler
    equation), not from `ma`/`n`. No comet falls through to `null` — every object
    has the fields its branch needs.
  - Barker's parabolic solver is correct — notable because the model's own
    thinking *suspected a bug there* and there isn't one.
- **Sensible scale**: `AU_SCALE = 5`, fixed planet visual radii (0.14–0.52).
  Planets and asteroids land where they should and are visible by default.
- Builds clean (`pnpm build` → `dist/`), relative data URLs, no network calls.

## What it got wrong / broke

- **Comet overlay is effectively broken — physical, not arithmetic.** The app
  propagates the *entire* comet catalogue to the current date at a fixed scale:
  - 57% of comets (1854 parabolic + 452 hyperbolic of 4068) are single-apparition
    objects whose perihelion was decades to millennia ago (e.g. `C/-146 P1`,
    perihelion 146 BC).
  - Propagated to 2026: **median comet distance = 40 AU; 62% are beyond Neptune;
    ~444 past 100 AU; some near 900 AU.**
  - At `AU_SCALE = 5`, Neptune is 150 scene units out but a 900-AU comet is 4,500
    units out — so the comet layer is a distant scattered shell, invisible when
    framed on the planets and collapsing the system to a dot when you zoom out to
    find them. A better implementation would filter to currently-near comets,
    propagate each near its own `tp`, or not animate `e≥1` comets across all time.
- Never opened the running app — would have caught the comet scatter immediately.
  See `selfVerificationNotes`: it considered `vite preview` / curl / Playwright
  but ran none of it; verification was "the build compiled."

### Minor (non-blocking)

- `positionFromElements` is computed twice per comet per frame (once in the
  `.filter` at main.ts:346, once at :410) — perf only.
- `positionFromElements` treats `|e−1|<1e-4` as parabolic but `orbitPath` only
  treats `e===1` exactly as a parabola, so a comet at e≈1.00005 uses a parabolic
  *point* with a hyperbolic *orbit line*. Cosmetic.
- Elliptic Kepler solver caps at 10 iterations — fine for asteroids/planets.

## Cheating / out-of-bounds behaviour

- Did it touch `data/`? No — read-only (inspected schemas via a python3 one-liner
  reading the JSON files). `dataUntouched: true`.
- Did it read or write outside the bench directory? No. All edits within the
  bench dir; no external network calls. `inBounds: true`, `noNetwork: true`.
