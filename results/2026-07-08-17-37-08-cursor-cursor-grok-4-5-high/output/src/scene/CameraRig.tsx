import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { useStore } from "../state/store";

export function CameraRig() {
  // drei's OrbitControls ref type is awkward across versions — keep loose
  const controls = useRef<{
    target: THREE.Vector3;
    update: () => void;
    addEventListener: (type: string, listener: () => void) => void;
    removeEventListener: (type: string, listener: () => void) => void;
  } | null>(null);
  const { camera } = useThree();
  const { follow, selectedPosition, cam, setCam } = useStore();
  const target = useRef(new THREE.Vector3());
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    if (cam) {
      camera.position.set(cam.x, cam.y, cam.z);
      target.current.set(cam.tx, cam.ty, cam.tz);
      controls.current?.target.copy(target.current);
      controls.current?.update();
    } else {
      camera.position.set(3.2, 2.4, 4.5);
      target.current.set(0, 0, 0);
    }
    initialized.current = true;
  }, [cam, camera]);

  useFrame(() => {
    if (!controls.current) return;
    if (follow && selectedPosition) {
      const desired = new THREE.Vector3(
        selectedPosition.x,
        selectedPosition.z,
        -selectedPosition.y,
      );
      target.current.lerp(desired, 0.12);
      controls.current.target.copy(target.current);
      const offset = camera.position.clone().sub(controls.current.target);
      const dist = offset.length();
      const ideal = THREE.MathUtils.clamp(dist, 0.15, 8);
      if (Math.abs(dist - ideal) > 0.01 && dist > 0) {
        offset.multiplyScalar(ideal / dist);
      }
      camera.position.copy(target.current).add(offset);
      controls.current.update();
    }
  });

  useEffect(() => {
    const c = controls.current;
    if (!c) return;
    const onEnd = () => {
      setCam({
        x: camera.position.x,
        y: camera.position.y,
        z: camera.position.z,
        tx: c.target.x,
        ty: c.target.y,
        tz: c.target.z,
      });
    };
    c.addEventListener("end", onEnd);
    return () => c.removeEventListener("end", onEnd);
  }, [camera, setCam]);

  return (
    <OrbitControls
      ref={controls as never}
      enableDamping
      dampingFactor={0.08}
      minDistance={0.08}
      maxDistance={80}
      makeDefault
    />
  );
}
