# ORBITAL

A self-contained, dependency-free WebGL solar-system observatory. Run `pnpm install && pnpm build` to produce `dist/`. `pnpm dev` serves the project at localhost:5173; `node scripts/serve.mjs --dist` serves the build. `pnpm test` validates propagation, including every supplied orbit at three dates.

Drag the map to rotate, scroll to zoom, and select bodies on the map or in the catalogue. The full-system preset reveals all eight planets. Filters apply to both the catalogue and asteroid rendering; unknown diameters are excluded by size thresholds. Enable comets to search and render them. The inspector provides focus/follow, Sentry data where matched, and date jumps for the complete supplied encounter history. Share saves date, selection, camera, and follow state in the URL.

## Scientific assumptions

Positions use fixed heliocentric J2000 elements and two-body Kepler propagation from each object's epoch. Elliptical orbits use supplied mean motion when available, or the solar Gaussian gravitational constant. Hyperbolic orbits use perihelion time and the hyperbolic Kepler equation; exactly parabolic orbits use Barker's equation. This educational model does not include planetary perturbations, uncertainty propagation, or UTC/TDB corrections. JPL encounter records, rather than this approximation, provide encounter distances and dates (TDB). UTC labels refer to the simulation date input.

Distances and orbital geometry retain a linear astronomical-unit scale; point markers are enlarged for visibility and illustrative inspector graphics are not actual object images. The Sun is fixed at the origin (mean physical radius 696,000 km). Earth MOID is a geometric orbital separation, not a current distance or impact probability. Sentry entries are matched by designation; unmatched records have no trajectory to render and are excluded. Risk figures describe the supplied snapshot, not live predictions.

All 42,075 asteroid orbits are loaded at runtime. Batched WebGL point rendering and throttled position updates keep the full catalogue interactive. The simulation defaults to 2026-09-04 and pauses initially. The scrubber spans 2020–2030; date entry and encounter jumps support other dates. No runtime external requests or dependencies are used. Data is copied unchanged into the build and all URLs are relative for iframe/sub-path hosting.
