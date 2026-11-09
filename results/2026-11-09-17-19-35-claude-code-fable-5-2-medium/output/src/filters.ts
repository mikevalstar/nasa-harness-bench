/** Decides which asteroids pass the current filters. */
import { ORBIT_GROUPS, type Catalog } from "./data/catalog.ts";
import { LD_AU } from "./orbit.ts";
import type { Filters } from "./state.ts";
import { JD_MAX, JD_MIN, jdFromYear } from "./time.ts";

export const approachFilterActive = (f: Filters): boolean =>
  f.approachFromYear !== null || f.approachToYear !== null || f.approachMaxLd !== null;

export function isDefaultFilters(f: Filters): boolean {
  return (
    ORBIT_GROUPS.every((g) => f.groups[g]) &&
    !f.phaOnly &&
    !f.sentryOnly &&
    f.minDiameterM === 0 &&
    f.maxMoidAu === null &&
    !approachFilterActive(f)
  );
}

/** Writes 1/0 per asteroid into `visible` and returns how many passed. */
export function applyFilters(catalog: Catalog, f: Filters, visible: Uint8Array): number {
  const { asteroids, approaches, group, diameterKm, sentryRow, approachStart, approachList } = catalog;
  const groupOn = ORBIT_GROUPS.map((g) => f.groups[g]);
  const minKm = f.minDiameterM / 1000;
  const byApproach = approachFilterActive(f);
  const jdFrom = f.approachFromYear === null ? JD_MIN : jdFromYear(f.approachFromYear);
  const jdTo = f.approachToYear === null ? JD_MAX : jdFromYear(f.approachToYear + 1);
  const maxDist = f.approachMaxLd === null ? Infinity : f.approachMaxLd * LD_AU;

  let passed = 0;
  for (let i = 0; i < asteroids.count; i++) {
    let ok = groupOn[group[i]];
    if (ok && f.phaOnly) ok = asteroids.pha[i] === 1;
    if (ok && f.sentryOnly) ok = sentryRow[i] >= 0;
    if (ok && minKm > 0) ok = diameterKm[i] >= minKm;
    if (ok && f.maxMoidAu !== null) {
      const moid = asteroids.moid[i];
      ok = moid !== null && moid <= f.maxMoidAu;
    }
    if (ok && byApproach) {
      ok = false;
      for (let k = approachStart[i]; k < approachStart[i + 1]; k++) {
        const row = approachList[k];
        if (approaches.jd[row] >= jdFrom && approaches.jd[row] < jdTo && approaches.dist[row] <= maxDist) {
          ok = true;
          break;
        }
      }
    }
    visible[i] = ok ? 1 : 0;
    if (ok) passed++;
  }
  return passed;
}
