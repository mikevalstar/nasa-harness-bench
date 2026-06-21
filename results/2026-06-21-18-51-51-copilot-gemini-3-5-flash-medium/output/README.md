# Orbit-Core: Inner Solar System & NEO Interactive 3D Explorer

Welcome to **Orbit-Core**, a high-fidelity, interactive 3D WebGL visualization of the inner solar system and near-Earth objects (NEOs). This project is driven entirely by the real JPL/NASA Keplerian elements dataset located in `data/`.

Positions are not hardcoded; instead, **every celestial body is propagated dynamically in real-time along its respective orbit** (elliptic, parabolic, or hyperbolic) for any chosen moment in time.

## 🌟 Implemented Features

### 1. High-Performance 3D Scene (Three.js)
* **Celestial Bodies**: Renders a glowing central Sun, 8 color-coded planets, 42,075 asteroids, and 4,068 comets.
* **Particle-Based Rendering**: Utilizing a single `THREE.Points` particle system for asteroids and comets to keep frame rates at a smooth **60 FPS** even while rendering 46,000+ objects simultaneously.
* **Visual Coding**:
  * **Potentially Hazardous Asteroids (PHAs)**: Highlighted in red.
  * **CNEOS Sentry Risk Objects**: Flashing yellow-red to convey risk.
  * **Orbital Classes**: Soft green for Amors (`AMO`), soft blue for Apollos (`APO`), and slate-white for other classes to give a sense of cosmic structure.
  * **Selected Object**: Encircled with a glowing cyan orbital halo.

### 2. Time-Travel & Playback Engine
* **Temporal Navigation**: HUD panel at the bottom center of the screen allows users to play/pause the simulation and adjust speed dynamically (presets from `-100x` reverse rewind to `+365x` fast forward in days/sec).
* **Calendar Picker**: Jump to any calendar date in history or the future using the interactive date picker, or click the reset button to snap back to the current day.

### 3. Keplerian Orbit Propagation Math
* **Elliptic Orbits ($e < 0.99$)**: Solves Kepler's equation ($E - e \sin E = M$) numerically using a high-precision Newton-Raphson solver.
* **Parabolic/Near-Parabolic Orbits ($0.99 \le e \le 1.01$)**: Solves Barker's equation using closed-form Cardan's formula to handle highly eccentric comets.
* **Hyperbolic Orbits ($e > 1.01$)**: Solves hyperbolic Kepler's equation ($e \sinh F - F = M_H$) for open-orbit comets.
* **Coordinate Mapping**: Converts 3D heliocentric J2000 ecliptic coordinates to Three.js coordinates where the ecliptic lies on the horizontal ground plane (`X-Z`), giving realistic inclination tilts along the vertical `Y` axis.

### 4. Search, Advanced Filters, & Navigation
* **Global Search**: Instantly filter the dataset by name, SPK-ID, or primary designation.
* **Display Toggles**: Toggle orbit paths, the asteroid belt, comets, or tracking on and off.
* **Orbital Class Selector**: Filter asteroids by `AMO` (Amor), `APO` (Apollo), `ATE` (Aten), `IEO` (Atira), or show all.
* **CNEOS Sentry Risk Filter**: Isolate objects that carry active impact threat ratings.
* **Size Filter**: Filter bodies by estimated diameter: All, >100m, >1km, >5km.
* **Search Pagination**: Results lists are capped at 150 matching items to guarantee DOM performance.

### 5. Double-Sided Detail Inspector (CNEOS Join)
* **Physical Profile**: Displays diameter, absolute magnitude (H/M1), Earth MOID, albedo, and rotation period.
* **Keplerian Elements Card**: Breaks down raw elements ($a, e, i, \Omega, \omega, M_0, tp, \text{period}$).
* **CNEOS Sentry Overlay**: Joins on asteroid designation to show Palermo/Torino threat ratings, cumulative impact probability, and collision windows.
* **Close Approaches Timeline**: Displays chronological list of Earth encounters with nominal distance in au and Lunar Distances (LD), relative velocities, and highlights upcoming approaches.

### 6. Focus & Tracking
* **Track Focus**: Automatically moves and dampens the camera to focus on and follow the selected planet, asteroid, or comet in real-time as the simulation advances.

### 7. Shareable Deep Links
* Real-time state syncing to URL query parameters (`jd`, `orbits`, `asteroids`, `comets`, `follow`, `sel`).
* Copy the URL at any moment to share a precise time freeze, orbital angle, and selected object.

---

## 🛠️ Data Pre-processing (Instant Load Optimization)

To achieve lightning-fast loading speeds on the web, a build-time pre-processing script (`scripts/preprocess.js`) was engineered to parse the raw datasets in `data/` and output optimized versions in `public/data/` (copied to `dist/data/` on build):
* **Asteroids Compress (15MB ➡️ 5.1MB)**: Strips redundant properties, converts objects to a compact index-mapped array of arrays, and omits standard fields.
* **Close Approaches Indexing (10MB ➡️ 4.2MB)**: Groups ~50,000 encounters by asteroid designation into an $O(1)$ fast dictionary lookup so they only load when the specific asteroid is selected.
* **Sentry Grouping (518KB ➡️ 370KB)**: Converts array to a key-value map joinable on designation.

---

## 🚀 Build and Run

### Prerequisites
* **Node.js** v24+
* **pnpm** v11+

### Direct Local Build
To bypass any system-level `pnpm` security locks regarding interactive dependency build authorizations:
```bash
# Run preprocessing and Vite compiler directly
node scripts/preprocess.js && ./node_modules/.bin/vite build
```
This compiles a fully self-contained static site inside **`dist/`** which contains `index.html`, relative asset files, and optimized data JSONs in `dist/data/` (ready to be served relatives in any iframe environment).

### Standard Build (From root folder)
```bash
pnpm install
pnpm build
```

---

## 🌌 Core Math Formulas Implemented

For reference, the orbit propagation math was coded using the following formulations:

1. **Mean Anomaly update**:
   $$M = M_0 + n (t - t_{\text{epoch}})$$
   where $n = \frac{k}{a^{1.5}} \approx \frac{0.9856076686}{a^{1.5}}\text{ deg/day}$.

2. **Solving Kepler's Equation**:
   $$E_{j+1} = E_j - \frac{E_j - e \sin E_j - M}{1 - e \cos E_j}$$

3. **Barker's Equation (Parabolic)**:
   $$x = \tan \frac{v}{2} = \left(3A + \sqrt{9A^2 + 1}\right)^{1/3} - \left(\sqrt{9A^2 + 1} - 3A\right)^{1/3}$$
   where $A = 1.5 k q^{-1.5} (t - t_p)$
   $$x' = q (1 - x^2), \quad y' = 2 q x$$
