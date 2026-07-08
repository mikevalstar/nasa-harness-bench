import { useMemo } from "react";
import { Line } from "@react-three/drei";
import * as THREE from "three";
import { useStore } from "../state/store";
import { asteroidElements, cometElements } from "../data/load";
import { sampleEllipticOrbit, sampleOpenOrbit } from "../astro/kepler";

function toThree(pts: Float32Array): THREE.Vector3[] {
  const arr: THREE.Vector3[] = [];
  for (let i = 0; i < pts.length; i += 3) {
    arr.push(new THREE.Vector3(pts[i], pts[i + 2], -pts[i + 1]));
  }
  return arr;
}

export function OrbitTrail() {
  const { data, selection } = useStore();

  const points = useMemo(() => {
    if (!selection) return null;
    if (selection.kind === "planet") {
      const p = data.planets[selection.index];
      if (!p) return null;
      return toThree(
        sampleEllipticOrbit({
          a: p.a,
          e: p.e,
          i: p.i,
          om: p.om,
          w: p.w,
          ma: p.ma,
          epoch: p.epoch,
          n: p.n,
        }),
      );
    }
    if (selection.kind === "asteroid") {
      const el = asteroidElements(data.asteroids, selection.index);
      return toThree(sampleEllipticOrbit(el, 200));
    }
    const el = cometElements(data.comets, selection.index);
    if (el.kind === 0) return toThree(sampleEllipticOrbit(el, 200));
    return toThree(sampleOpenOrbit(el, 160));
  }, [selection, data]);

  if (!points || points.length < 2) return null;

  const color =
    selection?.kind === "comet"
      ? "#67e8f9"
      : selection?.kind === "asteroid"
        ? "#ffb020"
        : "#ffffff";

  return (
    <Line
      points={points}
      color={color}
      transparent
      opacity={0.75}
      lineWidth={1.8}
    />
  );
}
