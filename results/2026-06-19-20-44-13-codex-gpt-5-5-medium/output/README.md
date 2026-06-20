# Near-Earth Object Explorer

Interactive Three.js visualization of the inner solar system and near-Earth objects from the provided `data/` snapshot.

## Notes

- `pnpm build` emits a self-contained static site in `dist/` and copies the input dataset to `dist/data/`.
- All orbital positions are computed in the browser from each body's elements and epoch.
- Asteroids are rendered with an instanced mesh so the full 42,075-object catalog can be displayed.
- Comet overlay includes closed elliptical comet orbits (`e < 1`); open and near-parabolic comet propagation is intentionally excluded.
- Filters cover hazard status, Sentry membership, close approaches near the selected date, known large bodies, low MOID, and text search.
- Selected objects show orbital properties, size/hazard metadata, Sentry risk when available, close approaches, a highlighted orbit, follow mode, and URL state.
