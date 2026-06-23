# Inner Solar System & NEO Observer

An interactive 3D visualization and simulation of the Inner Solar System, near-Earth asteroids, and comets, driven entirely by real NASA/JPL datasets.

Built from scratch with **Three.js**, **TypeScript**, and **Vite**, with no external runtime dependencies or CDNs, designed to be fully responsive and optimized to run inside frames.

## Key Features

1. **High-Performance 3D Render Engine**:
   - Employs WebGL particle systems (`THREE.Points`) to smoothly render the full dataset of ~42,000 asteroids and comets at 60 FPS.
   - Allows zooming, panning, and orbiting with damping camera controls.
   - Exaggerated, aesthetic relative sizes of the Sun, planets, and planet rings (Saturn) to balance scientific scale with visual clarity.

2. **Full Orbital propagation (Elliptical, Hyperbolic, Parabolic)**:
   - Propagates orbits dynamically in real-time from Keplerian elements.
   - Resolves **Kepler's Equation** numerically using Newton-Raphson iterations for elliptical and hyperbolic orbits.
   - Resolves **Barker's Equation** analytically for parabolic and near-parabolic comets and asteroids, ensuring extreme physical correctness for open orbits.
   - Computes geometrically correct orbit tracks and highlights them upon selection.

3. **Advanced Scientific Filter & Search**:
   - Filter by **Orbit Class**: Amor (AMO), Apollo (APO), Aten (ATE), Interior-Earth Objects (IEO), or Comets.
   - Filter by **Hazard Status**: Potentially Hazardous Asteroids (PHAs), Non-hazardous, or Sentry Impact Risk.
   - Slider filters for **Minimum Orbit Intersection Distance (MOID)** to Earth and **Absolute Magnitude (H)** (object size).
   - Re-index and sort results instantly by name, MOID, size, eccentricity, or inclination.

4. **Detailed Object Investigation & Close Approaches**:
   - Click directly on any orbit point or planet in 3D (with optimized Raycasting thresholds) to open the details sidebar.
   - Displays full orbital parameters, estimated diameter, absolute magnitude, albedo, rotation period, first observation date, and spectral type.
   - **CNEOS Sentry Risk Assessment**: Connects sentry data to display potential impact windows, Palermo/Torino scale risk, and cumulative impact probability.
   - **Earth Close-Approach Tracker**: Integrates close-approach events to calculate and list the closest historical and future approaches in both Astronomical Units (AU) and Lunar Distances (LD).

5. **Interact with Time**:
   - Smooth play/pause controls, stepping forward/backward by single days, jumping to "Today".
   - Drag-to-scrub timeline ranging from J2000 (Year 2000) to Year 2050.
   - Adjustable speed slider (including negative speed to rewind time!).

6. **Interactive Navigation**:
   - **Lock & Follow Camera**: Lock onto any planet, comet, or asteroid. As the body travels along its orbit over time, the camera seamlessly tracks and glides with it.
   - **Shareable Deep Links**: Simulation states (time, camera position, selected body, camera lock) are dynamically encoded into the URL hash, making it easy to copy and share specific scenarios.

## Optimized Data Architecture

To comply with the "no CDNs or external calls" mandate while loading ~26MB of raw JSON quickly in an iframe:
- We implemented a pre-processing build script (`scripts/preprocess.js`) that translates verbose JSON objects into compact arrays of arrays and indexed maps.
- **`asteroids.json`** was compressed by **70%** (15MB ➜ 4.5MB).
- **`close-approaches.json`** was indexed by designation and compressed by **60%** (10MB ➜ 4.2MB).
- The total payload is extremely lightweight, meaning the application is ready to load instantly.

## Developer Instructions

To run the application locally:
```bash
pnpm install
pnpm run dev
```

To compile and emit the self-contained static site inside `dist/`:
```bash
pnpm run build
```
The build process automatically runs the data pre-processor and outputs all relative assets.
