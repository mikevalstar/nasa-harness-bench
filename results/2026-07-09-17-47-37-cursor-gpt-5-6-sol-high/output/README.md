# Near Space Orbital Atlas

An interactive, entirely local visualization of the supplied NASA/JPL snapshot.

```sh
pnpm install
pnpm dev
pnpm build
```

The production build is written to `dist/`. Vite copies the read-only `data/`
directory into that build, and the app loads each JSON file at runtime using
relative `fetch` URLs.

## Model and display assumptions

- Elliptic trajectories solve Kepler's equation using each body's own epoch and
  mean motion. Missing small-body mean motion is derived with the Gaussian
  gravitational constant.
- Hyperbolic comet trajectories solve the hyperbolic Kepler equation from
  perihelion time. Near-parabolic trajectories use Barker's equation.
- Coordinates use the documented heliocentric J2000 ecliptic frame.
- Orbital distances are linear in astronomical units. Body radii and point sizes
  are intentionally exaggerated because physical-scale planets would be
  sub-pixel at this view.
- This is a two-body propagation model. It does not include perturbations and
  must not be used for navigation or impact prediction.
