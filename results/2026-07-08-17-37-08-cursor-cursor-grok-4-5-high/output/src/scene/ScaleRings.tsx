import { Line } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";

function circle(radius: number, segments = 96): THREE.Vector3[] {
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = (i / segments) * Math.PI * 2;
    pts.push(new THREE.Vector3(Math.cos(t) * radius, 0, Math.sin(t) * radius));
  }
  return pts;
}

export function ScaleRings() {
  const oneAu = useMemo(() => circle(1), []);
  const fiveAu = useMemo(() => circle(5.2), []);

  return (
    <group>
      <Line points={oneAu} color="#5ec8ff" transparent opacity={0.12} lineWidth={1} />
      <Line points={fiveAu} color="#d4a574" transparent opacity={0.08} lineWidth={1} />
    </group>
  );
}
