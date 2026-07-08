import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { SUN_VISUAL_RADIUS } from "../astro/constants";

export function Sun() {
  const mat = useRef<THREE.MeshBasicMaterial>(null);
  useFrame(({ clock }) => {
    if (mat.current) {
      const p = 0.85 + 0.15 * Math.sin(clock.elapsedTime * 0.7);
      mat.current.color.setRGB(1 * p, 0.85 * p, 0.35 * p);
    }
  });

  return (
    <group>
      <mesh>
        <sphereGeometry args={[SUN_VISUAL_RADIUS, 48, 48]} />
        <meshBasicMaterial ref={mat} color="#ffcc55" />
      </mesh>
      <mesh>
        <sphereGeometry args={[SUN_VISUAL_RADIUS * 1.35, 32, 32]} />
        <meshBasicMaterial color="#ffaa22" transparent opacity={0.12} depthWrite={false} />
      </mesh>
      <pointLight color="#ffd080" intensity={2.2} distance={80} decay={0.6} />
    </group>
  );
}
