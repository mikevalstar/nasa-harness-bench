import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useStore } from "../state/store";
import { positionAt } from "../astro/kepler";

const _color = new THREE.Color();
const _dummy = new THREE.Object3D();

/** Max instances drawn per frame for performance */
const MAX_DRAW = 12000;

export function AsteroidField() {
  const { data, jd, visibleAsteroidIndices, filters, selection, setSelection, setHoverLabel } =
    useStore();
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const indexMap = useRef<Int32Array>(new Int32Array(0));
  const { raycaster, camera, pointer, gl } = useThree();

  const geometry = useMemo(() => new THREE.SphereGeometry(1, 5, 5), []);
  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 0.9,
        depthWrite: false,
      }),
    [],
  );

  const drawList = useMemo(() => {
    const vis = visibleAsteroidIndices;
    if (vis.length <= MAX_DRAW) return vis;
    const priority: number[] = [];
    const rest: number[] = [];
    const flags = data.asteroids.flags;
    for (const i of vis) {
      if (flags[i * 3] === 1 || flags[i * 3 + 2] === 1) priority.push(i);
      else rest.push(i);
    }
    const remaining = Math.max(0, MAX_DRAW - priority.length);
    if (rest.length <= remaining) return priority.concat(rest);
    const step = rest.length / remaining;
    const sampled: number[] = [];
    for (let k = 0; k < remaining; k++) {
      sampled.push(rest[Math.floor(k * step)]);
    }
    return priority.concat(sampled);
  }, [visibleAsteroidIndices, data.asteroids.flags]);

  useEffect(() => {
    indexMap.current = Int32Array.from(drawList);
    if (meshRef.current) meshRef.current.count = drawList.length;
  }, [drawList]);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    if (!mesh.instanceColor) {
      mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(MAX_DRAW * 3), 3);
    }
  }, []);

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh || !filters.showAsteroids) {
      if (mesh) mesh.visible = false;
      return;
    }
    mesh.visible = true;
    const pack = data.asteroids;
    const f = pack.floats;
    const stride = pack.floatStride;
    const flags = pack.flags;
    const selAst = selection?.kind === "asteroid" ? selection.index : -1;
    const n = drawList.length;
    const el = {
      a: 0,
      e: 0,
      i: 0,
      om: 0,
      w: 0,
      ma: 0,
      epoch: 0,
      n: 0,
      kind: 0 as const,
    };

    for (let k = 0; k < n; k++) {
      const idx = drawList[k];
      const o = idx * stride;
      el.a = f[o];
      el.e = f[o + 1];
      el.i = f[o + 2];
      el.om = f[o + 3];
      el.w = f[o + 4];
      el.ma = f[o + 5];
      el.epoch = f[o + 6];
      el.n = f[o + 7];
      const H = f[o + 9];
      const diameter = f[o + 10];
      const p = positionAt(el, jd);
      if (!p) {
        _dummy.scale.setScalar(0);
        _dummy.updateMatrix();
        mesh.setMatrixAt(k, _dummy.matrix);
        continue;
      }
      const pha = flags[idx * 3] === 1;
      const sentry = flags[idx * 3 + 2] === 1;
      let size = 0.006;
      if (Number.isFinite(diameter) && diameter > 0) {
        size = Math.min(0.04, 0.004 + Math.sqrt(diameter) * 0.008);
      } else if (Number.isFinite(H)) {
        size = Math.min(0.03, 0.004 + Math.max(0, 22 - H) * 0.0015);
      }
      if (pha) size *= 1.35;
      if (idx === selAst) size *= 2.2;

      _dummy.position.set(p.x, p.z, -p.y);
      _dummy.scale.setScalar(size);
      _dummy.updateMatrix();
      mesh.setMatrixAt(k, _dummy.matrix);

      if (idx === selAst) _color.set("#ffffff");
      else if (sentry) _color.set("#ff4d4d");
      else if (pha) _color.set("#ffb020");
      else _color.set("#7ec8ff");
      mesh.setColorAt(k, _color);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  useEffect(() => {
    const el = gl.domElement;
    const onClick = (ev: MouseEvent) => {
      if (!meshRef.current || !filters.showAsteroids) return;
      const rect = el.getBoundingClientRect();
      pointer.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObject(meshRef.current);
      if (hits.length > 0 && hits[0].instanceId != null) {
        const idx = indexMap.current[hits[0].instanceId];
        if (idx >= 0) {
          setSelection({ kind: "asteroid", index: idx });
          setHoverLabel(data.asteroids.catalog[idx]?.full_name ?? null);
        }
      }
    };
    el.addEventListener("click", onClick);
    return () => el.removeEventListener("click", onClick);
  }, [
    gl,
    camera,
    pointer,
    raycaster,
    filters.showAsteroids,
    setSelection,
    setHoverLabel,
    data.asteroids.catalog,
  ]);

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, MAX_DRAW]}
      frustumCulled={false}
      onUpdate={(m) => {
        m.count = drawList.length;
      }}
    />
  );
}
