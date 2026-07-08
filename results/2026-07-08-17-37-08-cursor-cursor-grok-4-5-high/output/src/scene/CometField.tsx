import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useStore } from "../state/store";
import { cometElements } from "../data/load";
import { positionAt } from "../astro/kepler";

const _color = new THREE.Color();
const _dummy = new THREE.Object3D();
const MAX_DRAW = 4000;

export function CometField() {
  const { data, jd, filters, selection, setSelection, setHoverLabel } = useStore();
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const indexMap = useRef<Int32Array>(new Int32Array(0));
  const { raycaster, camera, pointer, gl } = useThree();

  const geometry = useMemo(() => new THREE.SphereGeometry(1, 6, 6), []);
  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 0.85,
        depthWrite: false,
      }),
    [],
  );

  const drawList = useMemo(() => {
    if (!filters.showComets) return [] as number[];
    const q = filters.query.trim().toLowerCase();
    const out: number[] = [];
    for (let i = 0; i < data.comets.count; i++) {
      if (q) {
        const meta = data.comets.catalog[i];
        const hay = `${meta.full_name} ${meta.pdes}`.toLowerCase();
        if (!hay.includes(q)) continue;
      }
      out.push(i);
      if (out.length >= MAX_DRAW) break;
    }
    return out;
  }, [data.comets, filters.showComets, filters.query]);

  useEffect(() => {
    indexMap.current = Int32Array.from(drawList);
    if (meshRef.current) meshRef.current.count = drawList.length;
  }, [drawList]);

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    if (!filters.showComets) {
      mesh.visible = false;
      return;
    }
    mesh.visible = true;
    const pack = data.comets;
    const sel = selection?.kind === "comet" ? selection.index : -1;

    for (let k = 0; k < drawList.length; k++) {
      const i = drawList[k];
      const el = cometElements(pack, i);
      const p = positionAt(el, jd);
      if (!p) {
        _dummy.scale.setScalar(0);
        _dummy.updateMatrix();
        mesh.setMatrixAt(k, _dummy.matrix);
        continue;
      }
      // Hide very distant comets for clarity
      const r2 = p.x * p.x + p.y * p.y + p.z * p.z;
      if (r2 > 60 * 60) {
        _dummy.scale.setScalar(0);
        _dummy.updateMatrix();
        mesh.setMatrixAt(k, _dummy.matrix);
        continue;
      }
      let size = 0.01;
      if (Number.isFinite(el.diameter) && el.diameter > 0) {
        size = Math.min(0.05, 0.008 + Math.sqrt(el.diameter) * 0.01);
      }
      if (i === sel) size *= 2;
      _dummy.position.set(p.x, p.z, -p.y);
      _dummy.scale.setScalar(size);
      _dummy.updateMatrix();
      mesh.setMatrixAt(k, _dummy.matrix);

      if (i === sel) _color.set("#ffffff");
      else if (el.kind === 2) _color.set("#c084fc"); // hyperbolic
      else if (el.kind === 1) _color.set("#a78bfa"); // parabolic
      else _color.set("#67e8f9");
      mesh.setColorAt(k, _color);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    if (!mesh.instanceColor) {
      mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(MAX_DRAW * 3), 3);
    }
  }, []);

  useEffect(() => {
    const el = gl.domElement;
    const onClick = (ev: MouseEvent) => {
      if (!meshRef.current || !filters.showComets) return;
      const rect = el.getBoundingClientRect();
      pointer.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObject(meshRef.current);
      if (hits.length > 0 && hits[0].instanceId != null) {
        const idx = indexMap.current[hits[0].instanceId];
        if (idx >= 0) {
          setSelection({ kind: "comet", index: idx });
          setHoverLabel(data.comets.catalog[idx]?.full_name ?? null);
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
    filters.showComets,
    setSelection,
    setHoverLabel,
    data.comets.catalog,
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
