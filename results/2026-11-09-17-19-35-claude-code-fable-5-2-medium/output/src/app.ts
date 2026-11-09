/** What every UI module gets handed: the data, the stage, the state, and the current filter result. */
import type { BodyRef, Ephemeris } from "./bodies.ts";
import type { Catalog } from "./data/catalog.ts";
import type { Encoding } from "./encoding.ts";
import type { Stage } from "./scene/stage.ts";
import type { Store } from "./state.ts";

export interface App {
  store: Store;
  catalog: Catalog;
  eph: Ephemeris;
  stage: Stage;
  /** Per asteroid, 1 when it passes the current filters. Mutated in place on `filters`. */
  visible: Uint8Array;
  visibleCount: number;
  encoding: Encoding;
  /** Select a body from a list. Unlike a click in the scene, this pulls a close-up camera back out for context. */
  inspect(ref: BodyRef): void;
  /** Select the asteroid of a close-approach row, set the clock to the encounter and frame it. */
  goToApproach(row: number): void;
}

/** First index in sorted `values` that is >= `target`. */
export function lowerBound(values: ArrayLike<number>, target: number): number {
  let lo = 0;
  let hi = values.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (values[mid] < target) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}
