import { useMemo, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Html, Line } from "@react-three/drei";
import type { Planet } from "../data/types";
import { positionAt, sampleEllipticOrbit } from "../astro/kepler";
import {
  AU_KM,
  MAX_PLANET_RADIUS,
  MIN_PLANET_RADIUS,
  PLANET_COLORS,
  PLANET_VISUAL_SCALE,
} from "../astro/constants";
import { useStore } from "../state/store";

function planetRadius(p: Planet): number {
  const r = (p.radius_km / AU_KM) * 80 + PLANET_VISUAL_SCALE * p.radius_km * 0.002;
  return Math.min(MAX_PLANET_RADIUS, Math.max(MIN_PLANET_RADIUS, r));
}

function PlanetBody({ planet, index }: { planet: Planet; index: number }) {
  const mesh = useRef<THREE.Mesh>(null);
  const { jd, selection, setSelection } = useStore();
  const selected = selection?.kind === "planet" && selection.index === index;
  const color = PLANET_COLORS[planet.name] ?? "#cccccc";
  const radius = planetRadius(planet);

  const orbitPts = useMemo(() => {
    const pts = sampleEllipticOrbit(
      {
        a: planet.a,
        e: planet.e,
        i: planet.i,
        om: planet.om,
        w: planet.w,
        ma: planet.ma,
        epoch: planet.epoch,
        n: planet.n,
      },
      180,
    );
    const arr: THREE.Vector3[] = [];
    for (let i = 0; i < pts.length; i += 3) {
      arr.push(new THREE.Vector3(pts[i], pts[i + 2], -pts[i + 1])); // Y-up: ecliptic y → -z
    }
    return arr;
  }, [planet]);

  useFrame(() => {
    if (!mesh.current) return;
    const p = positionAt(
      {
        a: planet.a,
        e: planet.e,
        i: planet.i,
        om: planet.om,
        w: planet.w,
        ma: planet.ma,
        epoch: planet.epoch,
        n: planet.n,
      },
      jd,
    );
    if (!p) return;
    // Map ecliptic (x,y,z) → Three.js Y-up (x, z, -y)
    mesh.current.position.set(p.x, p.z, -p.y);
  });

  return (
    <group>
      <Line
        points={orbitPts}
        color={selected ? "#ffffff" : color}
        transparent
        opacity={selected ? 0.55 : 0.22}
        lineWidth={selected ? 1.5 : 1}
      />
      <mesh
        ref={mesh}
        onClick={(e) => {
          e.stopPropagation();
          setSelection({ kind: "planet", index });
        }}
      >
        <sphereGeometry args={[radius, 24, 24]} />
        <meshStandardMaterial
          color={color}
          emissive={selected ? color : "#000000"}
          emissiveIntensity={selected ? 0.35 : 0}
          roughness={0.55}
          metalness={0.1}
        />
        {(planet.name === "Earth" || selected) && (
          <Html distanceFactor={8} style={{ pointerEvents: "none" }}>
            <div className="body-label">{planet.name}</div>
          </Html>
        )}
      </mesh>
      {planet.name === "Saturn" && (
        <SaturnRing meshRef={mesh} radius={radius} />
      )}
    </group>
  );
}

function SaturnRing({
  meshRef,
  radius,
}: {
  meshRef: RefObject<THREE.Mesh | null>;
  radius: number;
}) {
  const ring = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (ring.current && meshRef.current) {
      ring.current.position.copy(meshRef.current.position);
    }
  });
  return (
    <mesh ref={ring} rotation={[Math.PI / 2.4, 0.2, 0]}>
      <ringGeometry args={[radius * 1.4, radius * 2.2, 48]} />
      <meshBasicMaterial color="#d4c4a0" transparent opacity={0.45} side={THREE.DoubleSide} />
    </mesh>
  );
}

export function Planets() {
  const { data } = useStore();
  return (
    <group>
      {data.planets.map((p, i) => (
        <PlanetBody key={p.name} planet={p} index={i} />
      ))}
    </group>
  );
}
