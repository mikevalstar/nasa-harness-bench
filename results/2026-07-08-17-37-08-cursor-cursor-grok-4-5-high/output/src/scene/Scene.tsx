import { Canvas } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import { Suspense } from "react";
import { Sun } from "./Sun";
import { Planets } from "./Planets";
import { AsteroidField } from "./AsteroidField";
import { CometField } from "./CometField";
import { OrbitTrail } from "./OrbitTrail";
import { CameraRig } from "./CameraRig";
import { ScaleRings } from "./ScaleRings";

export function Scene() {
  return (
    <Canvas
      className="scene-canvas"
      camera={{ position: [3.2, 2.4, 4.5], fov: 50, near: 0.01, far: 200 }}
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      onPointerMissed={() => {
        /* keep selection; clear via UI */
      }}
    >
      <color attach="background" args={["#070b14"]} />
      <ambientLight intensity={0.18} />
      <Suspense fallback={null}>
        <Stars radius={80} depth={40} count={4000} factor={2.2} saturation={0} fade speed={0.4} />
        <Sun />
        <ScaleRings />
        <Planets />
        <AsteroidField />
        <CometField />
        <OrbitTrail />
        <CameraRig />
      </Suspense>
    </Canvas>
  );
}
