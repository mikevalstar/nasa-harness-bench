# Notes — 2026-06-20-08-40-48-minimax-code-minimax-m3-medium

## Summary

Builds and runs clean, planets are correct, 42k asteroids render performantly with
interactive time. But two math/architecture bugs undercut it: (1) asteroid & comet
orbits use the **transpose** of the orientation matrix (wrong 3D orientation), and
(2) **you cannot select an asteroid by clicking it**, which cascades into most of
the per-object features being unreachable through normal use.

## The selection bug (why most features feel broken)

Asteroid positions are computed entirely in the **GPU vertex shader**
(`helio + position*aSize`); the InstancedMesh's `instanceMatrix` is never set.
Picking (`wirePick` in `main.ts`) does `ray.intersectObject(refs.asteroidMesh)` —
but `THREE.Raycaster` places each instance using its `instanceMatrix`, which is
identity for all 42,075 asteroids. So the raycaster believes every asteroid sits at
the origin: **clicking an asteroid (and hover tooltips on asteroids) essentially
never hits.**

Search makes it worse: `wireSearch` only feeds matches into `applyFilters` as a
visibility filter and shows a count toast. There is **no results list, no
click-to-select, and no auto-select even when a query narrows to a single match.**

Net: the only ways to select an asteroid are a hand-crafted **deep link** or a
**close-approach row** inside an already-open detail panel. Through the normal UI
you cannot reach an asteroid's detail / investigate / follow at all.

Contrast: **planets** are real meshes with CPU-set positions, so planet picking,
detail, and follow all work. And the **filters** (`phaOnly`, `sentryOnly`, class,
diameter, MOID) work without any selection.

## What it got right

- `pnpm install && pnpm build` succeeds; self-contained `dist/` with copied data;
  relative URLs (iframe-safe); no external/network/CDN refs. Loads, no console errors.
- **Planets**: positions + orbit orientation verified correct (textbook
  Rz(Ω)Rx(i)Rz(ω), expanded by hand and matched numerically).
- 42,075 asteroids rendered via instanced GPU Kepler; smooth interactive time
  (play/pause, speed, scrub, jump-to-date). All asteroids have non-null `n` → they
  animate at correct rates.
- Kepler solvers correct (elliptic Newton + hyperbolic sinh form).
- Rich detail panel **when reachable**: orbit, physical props, close-approach
  history, Sentry risk rows. Deep links restore time / selection / camera.

## What it got wrong / broke

- **Orbit orientation (asteroids + comets): transpose bug.** `orbitalBasis()` in
  `scripts/preprocess-data.mjs` takes the **rows** of `R = Rz(Ω)Rx(i)Rz(ω)` instead
  of its **columns** — i.e. it uses Rᵀ (the inverse rotation). Verified ~2.08 au off
  vs. the correct/planet position (true |r| ≈ 1.26 au). Affects all 42k asteroids +
  all comets. |r| is preserved (rotation is orthonormal), so the in-bounds check
  cannot catch it and the cloud still looks roughly ecliptic-flat. Fix: use columns —
  `ex=[R[0],R[3],R[6]]`, `ey=[R[1],R[4],R[7]]`.
- **Asteroid selection broken** (see above) — the headline UX failure.
- **Comets, hyperbolic/parabolic: ~1,762 of 4,068 collapse to the Sun.** Spec
  explicitly says `e ≥ 1` comets have null `ma`/`n` and must be propagated from `tp`.
  The code propagates from `ma`/`n` like everything else; for the 1,762 with
  `a=ma=n=null` this gives M=0 and `abs(a)=0`, placing them at the origin. The
  `tp`-based propagation is not implemented. Elliptic comets move but inherit the
  transpose-orientation bug.

## Feature reachability (drives the "partial" marks)

Several features are implemented but **gated behind the broken asteroid selection**,
so they're `partial` rather than `fail`:

- **investigate** — detail panel fully built and works via deep link, but
  unreachable by clicking/searching an asteroid.
- **focusFollow** — works for planets (clickable) and deep-linked bodies; asteroid
  follow needs the broken selection.
- **impactRisk** — Sentry data loaded, joined (des↔pdes), filterable via `sentryOnly`
  (works, no selection needed), and shown in the detail panel — but the rich
  per-object risk readout is gated behind selection.
- **highlight** — PHA isolation via the `phaOnly` filter works and the selected-object
  orbit highlight works for reachable bodies; but there's no dedicated hazard
  color/visual highlight of "what matters."
- **scaleRisk** — asteroid size encodes absolute magnitude H, and there's a scale
  bar; risk is not visually encoded (shallow), hence partial.

`filterSearch` left `poor`: the filter stack is robust and reachable, but the search
box only filters and offers no way to select a result.

## Cheating / out-of-bounds behaviour

- `data/` is a read-only symlink; preprocessing only **reads** it and writes copies
  to `dist/data/`. No source mutation observed.
- No reads/writes outside the bench dir except scratch verification scripts written
  to `/tmp`, not the project tree.
- No external network calls. Not cheating.
