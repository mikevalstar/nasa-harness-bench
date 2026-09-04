import * as THREE from 'three';
import { CometData } from '../types/solar';
import { PrecomputedCometArrays } from '../data/dataLoader';
import { propagatePerifocal } from '../math/kepler';

const COMET_COLOR = new THREE.Color(0x38bdf8); // Sky / icy blue
const COMET_HYP_COLOR = new THREE.Color(0xa855f7); // Purple for hyperbolic

export class CometPointCloud {
  public group: THREE.Group;
  public points: THREE.Points;
  public geometry: THREE.BufferGeometry;
  public material: THREE.ShaderMaterial;
  public comets: CometData[];
  public arrays: PrecomputedCometArrays;

  public positionBuffer: Float32Array;
  public colorBuffer: Float32Array;
  public sizeBuffer: Float32Array;
  public visibilityBuffer: Float32Array;

  private lastUpdatedJd: number = -1;
  private isVisible: boolean = false;
  private selectedIndex: number = -1;
  private hoveredIndex: number = -1;

  constructor(comets: CometData[], arrays: PrecomputedCometArrays) {
    this.group = new THREE.Group();
    this.comets = comets;
    this.arrays = arrays;

    const count = arrays.count;
    this.positionBuffer = new Float32Array(count * 3);
    this.colorBuffer = new Float32Array(count * 3);
    this.sizeBuffer = new Float32Array(count);
    this.visibilityBuffer = new Float32Array(count);

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positionBuffer, 3));
    this.geometry.setAttribute('customColor', new THREE.BufferAttribute(this.colorBuffer, 3));
    this.geometry.setAttribute('pointSize', new THREE.BufferAttribute(this.sizeBuffer, 1));
    this.geometry.setAttribute('visibleFlag', new THREE.BufferAttribute(this.visibilityBuffer, 1));

    this.material = new THREE.ShaderMaterial({
      vertexShader: `
        attribute vec3 customColor;
        attribute float pointSize;
        attribute float visibleFlag;
        varying vec3 vColor;
        varying float vVisible;

        void main() {
          vColor = customColor;
          vVisible = visibleFlag;
          if (visibleFlag < 0.5) {
            gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
            gl_PointSize = 0.0;
            return;
          }
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          
          float dist = length(mvPosition.xyz);
          float size = pointSize * (40.0 / max(0.5, dist));
          gl_PointSize = clamp(size, 2.0, 32.0);
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vVisible;

        void main() {
          if (vVisible < 0.5) discard;
          vec2 coord = gl_PointCoord - vec2(0.5);
          float distSq = dot(coord, coord);
          if (distSq > 0.25) discard;
          
          // Soft glowing comet coma
          float alpha = smoothstep(0.25, 0.01, distSq);
          gl_FragColor = vec4(vColor, alpha * 0.9);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.points = new THREE.Points(this.geometry, this.material);
    this.group.add(this.points);

    this.initColors();
    this.setVisible(false); // Off by default as optional overlay
  }

  private initColors() {
    const { count, e } = this.arrays;
    for (let i = 0; i < count; i++) {
      const isHyp = e[i] >= 1.0;
      const col = isHyp ? COMET_HYP_COLOR : COMET_COLOR;
      this.colorBuffer[i * 3 + 0] = col.r;
      this.colorBuffer[i * 3 + 1] = col.g;
      this.colorBuffer[i * 3 + 2] = col.b;
      this.sizeBuffer[i] = isHyp ? 3.5 : 3.0;
      this.visibilityBuffer[i] = this.isVisible ? 1.0 : 0.0;
    }
  }

  public setVisible(visible: boolean) {
    this.isVisible = visible;
    this.group.visible = visible;
    for (let i = 0; i < this.arrays.count; i++) {
      this.visibilityBuffer[i] = visible ? 1.0 : 0.0;
    }
    (this.geometry.attributes.visibleFlag as THREE.BufferAttribute).needsUpdate = true;
  }

  public getIsVisible(): boolean {
    return this.isVisible;
  }

  public setSelectedIndex(idx: number) {
    this.selectedIndex = idx;
    this.updateHighlighting();
  }

  public setHoveredIndex(idx: number) {
    this.hoveredIndex = idx;
    this.updateHighlighting();
  }

  private updateHighlighting() {
    const { count, e } = this.arrays;
    for (let i = 0; i < count; i++) {
      if (i === this.selectedIndex) {
        this.colorBuffer[i * 3 + 0] = 1.0;
        this.colorBuffer[i * 3 + 1] = 1.0;
        this.colorBuffer[i * 3 + 2] = 1.0;
        this.sizeBuffer[i] = 7.0;
      } else if (i === this.hoveredIndex) {
        this.colorBuffer[i * 3 + 0] = 0.8;
        this.colorBuffer[i * 3 + 1] = 1.0;
        this.colorBuffer[i * 3 + 2] = 0.8;
        this.sizeBuffer[i] = 5.5;
      } else {
        const isHyp = e[i] >= 1.0;
        const col = isHyp ? COMET_HYP_COLOR : COMET_COLOR;
        this.colorBuffer[i * 3 + 0] = col.r;
        this.colorBuffer[i * 3 + 1] = col.g;
        this.colorBuffer[i * 3 + 2] = col.b;
        this.sizeBuffer[i] = isHyp ? 3.5 : 3.0;
      }
    }
    (this.geometry.attributes.customColor as THREE.BufferAttribute).needsUpdate = true;
    (this.geometry.attributes.pointSize as THREE.BufferAttribute).needsUpdate = true;
  }

  public updatePositions(jd: number, force: boolean = false) {
    if (!this.isVisible && !force) return;
    if (!force && Math.abs(jd - this.lastUpdatedJd) < 1e-6) return;
    this.lastUpdatedJd = jd;

    const { count, a, e, q, epoch, tp, n, ma, Px, Py, Pz, Qx, Qy, Qz } = this.arrays;
    const pos = this.positionBuffer;

    for (let i = 0; i < count; i++) {
      const aVal = a[i] > 0 ? a[i] : null;
      const { xp, yp } = propagatePerifocal(
        aVal,
        e[i],
        q[i],
        jd,
        epoch[i],
        ma[i] * (180 / Math.PI),
        n[i] * (180 / Math.PI),
        tp[i]
      );

      const rx = xp * Px[i] + yp * Qx[i];
      const ry = xp * Py[i] + yp * Qy[i];
      const rz = xp * Pz[i] + yp * Qz[i];

      pos[i * 3 + 0] = rx;
      pos[i * 3 + 1] = rz;
      pos[i * 3 + 2] = -ry;
    }

    (this.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
  }

  public getCometPosition(idx: number): THREE.Vector3 | null {
    if (idx < 0 || idx >= this.arrays.count) return null;
    return new THREE.Vector3(
      this.positionBuffer[idx * 3 + 0],
      this.positionBuffer[idx * 3 + 1],
      this.positionBuffer[idx * 3 + 2]
    );
  }

  public findNearestComet(
    mouseNormalizedX: number,
    mouseNormalizedY: number,
    camera: THREE.Camera,
    screenWidth: number,
    screenHeight: number,
    pixelTolerance: number = 18
  ): number {
    if (!this.isVisible) return -1;

    const v = new THREE.Vector3();
    let bestIndex = -1;
    let minScreenDistSq = pixelTolerance * pixelTolerance;

    const count = this.arrays.count;
    const pos = this.positionBuffer;

    const mousePxX = ((mouseNormalizedX + 1) / 2) * screenWidth;
    const mousePxY = ((-mouseNormalizedY + 1) / 2) * screenHeight;

    for (let i = 0; i < count; i++) {
      v.set(pos[i * 3 + 0], pos[i * 3 + 1], pos[i * 3 + 2]);
      v.project(camera);

      if (v.z > 1.0) continue;

      const pxX = ((v.x + 1) / 2) * screenWidth;
      const pxY = ((-v.y + 1) / 2) * screenHeight;

      const dx = pxX - mousePxX;
      const dy = pxY - mousePxY;
      const dSq = dx * dx + dy * dy;

      if (dSq < minScreenDistSq) {
        minScreenDistSq = dSq;
        bestIndex = i;
      }
    }

    return bestIndex;
  }
}
