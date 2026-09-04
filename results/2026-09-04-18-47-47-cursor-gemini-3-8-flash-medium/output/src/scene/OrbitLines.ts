import * as THREE from 'three';
import {
  computeOrbitalBasis,
  generateOrbitPoints,
  perifocalToThree,
} from '../math/kepler';

export class OrbitLines {
  public group: THREE.Group;
  private lineMesh: THREE.Line | null = null;
  private perihelionMarker: THREE.Mesh;
  private aphelionMarker: THREE.Mesh;
  private targetReticle: THREE.LineLoop;
  private earthDistanceLine: THREE.Line;

  constructor() {
    this.group = new THREE.Group();

    // Perihelion marker (cyan dot)
    const periGeom = new THREE.SphereGeometry(0.015, 16, 16);
    const periMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
    this.perihelionMarker = new THREE.Mesh(periGeom, periMat);
    this.perihelionMarker.visible = false;
    this.group.add(this.perihelionMarker);

    // Aphelion marker (orange dot)
    const aphGeom = new THREE.SphereGeometry(0.015, 16, 16);
    const aphMat = new THREE.MeshBasicMaterial({ color: 0xf97316 });
    this.aphelionMarker = new THREE.Mesh(aphGeom, aphMat);
    this.aphelionMarker.visible = false;
    this.group.add(this.aphelionMarker);

    // Target reticle ring
    const reticleGeom = new THREE.BufferGeometry();
    const segs = 32;
    const rPos = new Float32Array((segs + 1) * 3);
    for (let i = 0; i <= segs; i++) {
      const th = (i / segs) * Math.PI * 2;
      rPos[i * 3 + 0] = Math.cos(th) * 0.035;
      rPos[i * 3 + 1] = 0;
      rPos[i * 3 + 2] = Math.sin(th) * 0.035;
    }
    reticleGeom.setAttribute('position', new THREE.BufferAttribute(rPos, 3));
    const reticleMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
    });
    this.targetReticle = new THREE.LineLoop(reticleGeom, reticleMat);
    this.targetReticle.visible = false;
    this.group.add(this.targetReticle);

    // Earth distance line
    const distGeom = new THREE.BufferGeometry();
    distGeom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
    const distMat = new THREE.LineDashedMaterial({
      color: 0x38bdf8,
      dashSize: 0.04,
      gapSize: 0.03,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
    });
    this.earthDistanceLine = new THREE.Line(distGeom, distMat);
    this.earthDistanceLine.visible = false;
    this.group.add(this.earthDistanceLine);
  }

  public setOrbit(
    a: number | null,
    e: number,
    q: number,
    iDeg: number,
    omDeg: number,
    wDeg: number,
    color: number = 0x38bdf8
  ) {
    if (this.lineMesh) {
      this.group.remove(this.lineMesh);
      this.lineMesh.geometry.dispose();
      (this.lineMesh.material as THREE.Material).dispose();
      this.lineMesh = null;
    }

    const basis = computeOrbitalBasis(iDeg, omDeg, wDeg);
    const pts = generateOrbitPoints(a, e, q, basis, 240);

    const positions = new Float32Array(pts.length * 3);
    for (let idx = 0; idx < pts.length; idx++) {
      positions[idx * 3 + 0] = pts[idx].x;
      positions[idx * 3 + 1] = pts[idx].y;
      positions[idx * 3 + 2] = pts[idx].z;
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
    });
    this.lineMesh = new THREE.Line(geom, mat);
    this.group.add(this.lineMesh);

    // Perihelion position (xp = q, yp = 0)
    const periPos = perifocalToThree(q, 0, basis);
    this.perihelionMarker.position.set(periPos.x, periPos.y, periPos.z);
    this.perihelionMarker.visible = true;

    // Aphelion position (for closed orbits e < 1)
    if (e < 0.9999 && a !== null && a > 0) {
      const ad = a * (1 + e);
      const aphPos = perifocalToThree(-ad, 0, basis);
      this.aphelionMarker.position.set(aphPos.x, aphPos.y, aphPos.z);
      this.aphelionMarker.visible = true;
    } else {
      this.aphelionMarker.visible = false;
    }
  }

  public updateReticle(pos: THREE.Vector3, camera: THREE.Camera) {
    this.targetReticle.position.copy(pos);
    this.targetReticle.quaternion.copy(camera.quaternion);
    const dist = camera.position.distanceTo(pos);
    const scale = Math.max(0.4, dist * 0.05);
    this.targetReticle.scale.set(scale, scale, scale);
    this.targetReticle.visible = true;
  }

  public updateEarthLine(fromPos: THREE.Vector3, earthPos: THREE.Vector3) {
    const arr = (this.earthDistanceLine.geometry.attributes.position as THREE.BufferAttribute).array as Float32Array;
    arr[0] = fromPos.x;
    arr[1] = fromPos.y;
    arr[2] = fromPos.z;
    arr[3] = earthPos.x;
    arr[4] = earthPos.y;
    arr[5] = earthPos.z;
    (this.earthDistanceLine.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    this.earthDistanceLine.computeLineDistances();
    this.earthDistanceLine.visible = true;
  }

  public clear() {
    if (this.lineMesh) {
      this.group.remove(this.lineMesh);
      this.lineMesh.geometry.dispose();
      (this.lineMesh.material as THREE.Material).dispose();
      this.lineMesh = null;
    }
    this.perihelionMarker.visible = false;
    this.aphelionMarker.visible = false;
    this.targetReticle.visible = false;
    this.earthDistanceLine.visible = false;
  }
}
