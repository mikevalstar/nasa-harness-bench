/** Finds the body under a screen point by projecting current positions on the CPU. */
import { SUN, type BodyRef, type Ephemeris } from "./bodies.ts";
import type { Vec3 } from "./orbit.ts";
import { FADE_END } from "./scene/comets.ts";
import type { ScreenPoint, Stage } from "./scene/stage.ts";

const SMALL_BODY_RADIUS_PX = 9;
const scratch: Vec3 = [0, 0, 0];
const screen: ScreenPoint = { x: 0, y: 0, visible: false };

export function pick(
  stage: Stage,
  eph: Ephemeris,
  jd: number,
  x: number,
  y: number,
  visible: Uint8Array,
  cometsShown: boolean,
): BodyRef | null {
  // Sun and planets win over the dots drawn across them.
  const large: BodyRef[] = [SUN, ...stage.planetPositions.map((_, index): BodyRef => ({ kind: "planet", index }))];
  let best: BodyRef | null = null;
  let bestDistance = Infinity;
  for (const ref of large) {
    const p = ref.kind === "sun" ? eph.position(ref, jd, scratch) : stage.planetPositions[ref.index];
    stage.toScreen(p, screen);
    if (!screen.visible) continue;
    const distance = Math.hypot(screen.x - x, screen.y - y);
    if (distance < Math.max(stage.discRadiusPx(ref) + 3, 9) && distance < bestDistance) {
      best = ref;
      bestDistance = distance;
    }
  }
  if (best) return best;

  const m = stage.viewProjection.elements;
  const halfW = stage.width / 2;
  const halfH = stage.height / 2;
  let bestSq = SMALL_BODY_RADIUS_PX * SMALL_BODY_RADIUS_PX;
  const test = (px: number, py: number, pz: number, ref: () => BodyRef, maxDepth = Infinity): void => {
    const w = m[3] * px + m[7] * py + m[11] * pz + m[15];
    if (w <= 0 || w > maxDepth) return;
    const dx = ((m[0] * px + m[4] * py + m[8] * pz + m[12]) / w + 1) * halfW - x;
    const dy = (1 - (m[1] * px + m[5] * py + m[9] * pz + m[13]) / w) * halfH - y;
    const sq = dx * dx + dy * dy;
    if (sq < bestSq) {
      bestSq = sq;
      best = ref();
    }
  };

  for (let i = 0; i < visible.length; i++) {
    if (!visible[i]) continue;
    const p = eph.asteroidPosition(i, jd, scratch);
    test(p[0], p[1], p[2], () => ({ kind: "asteroid", index: i }));
  }
  if (cometsShown) {
    const positions = stage.comets.positions;
    // Comets faded out by distance are not drawn, so they are not pickable either.
    const maxDepth = stage.viewDistance * FADE_END * 0.8;
    for (let i = 0; i < positions.length / 3; i++) {
      test(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2], () => ({ kind: "comet", index: i }), maxDepth);
    }
  }
  return best;
}
