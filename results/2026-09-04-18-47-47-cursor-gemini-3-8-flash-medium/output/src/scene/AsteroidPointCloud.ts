import * as THREE from 'three';
import { AsteroidData } from '../types/solar';
import { PrecomputedAsteroidArrays } from '../data/dataLoader';

export type AsteroidColorMode = 'class' | 'hazard' | 'sentry' | 'size' | 'uniform';

export interface AsteroidFilterOptions {
  phaOnly: boolean;
  sentryOnly: boolean;
  classes: Set<string>;
  minDiameter: number;
  maxH: number;
  searchQuery: string;
}

const CLASS_COLORS: Record<string, THREE.Color> = {
  APO: new THREE.Color(0xf59e0b), // Amber/gold
  ATE: new THREE.Color(0x10b981), // Emerald/teal
  AMO: new THREE.Color(0x3b82f6), // Sky blue
  IEO: new THREE.Color(0xec4899), // Pink
  OTHER: new THREE.Color(0x94a3b8), // Slate
};

const PHA_COLOR = new THREE.Color(0xef4444); // Crimson
const NON_PHA_COLOR = new THREE.Color(0x334155); // Slate
const SENTRY_COLOR = new THREE.Color(0xff4500); // Orange-red
const SENTRY_NORMAL_COLOR = new THREE.Color(0x1e293b); // Dark slate
const UNIFORM_COLOR = new THREE.Color(0x93c5fd); // Light blue

const TWO_PI = Math.PI * 2;

export class AsteroidPointCloud {
  public group: THREE.Group;
  public points: THREE.Points;
  public geometry: THREE.BufferGeometry;
  public material: THREE.ShaderMaterial;
  public asteroids: AsteroidData[];
  public arrays: PrecomputedAsteroidArrays;

  public positionBuffer: Float32Array;
  public colorBuffer: Float32Array;
  public sizeBuffer: Float32Array;
  public visibilityBuffer: Float32Array;

  private lastUpdatedJd: number = -1;
  private colorMode: AsteroidColorMode = 'class';
  private filterOptions: AsteroidFilterOptions = {
    phaOnly: false,
    sentryOnly: false,
    classes: new Set(['APO', 'ATE', 'AMO', 'IEO']),
    minDiameter: 0,
    maxH: 99,
    searchQuery: '',
  };

  private selectedIndex: number = -1;
  private hoveredIndex: number = -1;

  constructor(asteroids: AsteroidData[], arrays: PrecomputedAsteroidArrays) {
    this.group = new THREE.Group();
    this.asteroids = asteroids;
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
            gl_Position = vec4(2.0, 2.0, 2.0, 1.0); // Clip offscreen
            gl_PointSize = 0.0;
            return;
          }
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          
          // Attenuate point size gently with distance
          float dist = length(mvPosition.xyz);
          float size = pointSize * (35.0 / max(0.5, dist));
          gl_PointSize = clamp(size, 1.5, 30.0);
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
          
          // Smooth circular edge
          float alpha = smoothstep(0.25, 0.04, distSq);
          gl_FragColor = vec4(vColor, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
    });

    this.points = new THREE.Points(this.geometry, this.material);
    this.group.add(this.points);

    // Initial colors and sizes
    this.updateColorsAndVisibility();
  }

  public setColorMode(mode: AsteroidColorMode) {
    this.colorMode = mode;
    this.updateColorsAndVisibility();
  }

  public setFilters(filters: Partial<AsteroidFilterOptions>) {
    this.filterOptions = { ...this.filterOptions, ...filters };
    this.updateColorsAndVisibility();
  }

  public setSelectedIndex(idx: number) {
    this.selectedIndex = idx;
    this.updateColorsAndVisibility();
  }

  public setHoveredIndex(idx: number) {
    this.hoveredIndex = idx;
    this.updateColorsAndVisibility();
  }

  public updateColorsAndVisibility() {
    const { count, H, diameter, flags, classId } = this.arrays;
    const { phaOnly, sentryOnly, classes, minDiameter, maxH, searchQuery } = this.filterOptions;
    const hasQuery = searchQuery.trim().length > 0;
    const query = searchQuery.trim().toLowerCase();

    for (let i = 0; i < count; i++) {
      const ast = this.asteroids[i];
      const isNeo = (flags[i] & 1) !== 0;
      const isPha = (flags[i] & 2) !== 0;
      const hasSentry = (flags[i] & 4) !== 0;
      const cid = classId[i];
      const clsName = cid === 0 ? 'APO' : cid === 1 ? 'ATE' : cid === 2 ? 'AMO' : cid === 3 ? 'IEO' : 'OTHER';

      let isVisible = true;
      if (phaOnly && !isPha) isVisible = false;
      if (sentryOnly && !hasSentry) isVisible = false;
      if (!classes.has(clsName)) isVisible = false;
      if (minDiameter > 0 && (diameter[i] < minDiameter || diameter[i] < 0)) isVisible = false;
      if (maxH < 99 && H[i] > maxH) isVisible = false;
      if (hasQuery) {
        const matchesName = (ast.name && ast.name.toLowerCase().includes(query)) ||
          ast.pdes.toLowerCase().includes(query) ||
          ast.full_name.toLowerCase().includes(query);
        if (!matchesName) isVisible = false;
      }

      this.visibilityBuffer[i] = isVisible ? 1.0 : 0.0;

      // Color selection
      let r = 0.5, g = 0.5, b = 0.5;
      let baseSize = 2.2;

      if (this.colorMode === 'class') {
        const col = CLASS_COLORS[clsName] || CLASS_COLORS.OTHER;
        r = col.r;
        g = col.g;
        b = col.b;
      } else if (this.colorMode === 'hazard') {
        const col = isPha ? PHA_COLOR : NON_PHA_COLOR;
        r = col.r;
        g = col.g;
        b = col.b;
        if (isPha) baseSize = 3.5;
      } else if (this.colorMode === 'sentry') {
        const col = hasSentry ? SENTRY_COLOR : SENTRY_NORMAL_COLOR;
        r = col.r;
        g = col.g;
        b = col.b;
        if (hasSentry) baseSize = 4.0;
      } else if (this.colorMode === 'size') {
        // Brightness and size based on absolute magnitude H (lower H = larger object)
        const hVal = H[i];
        if (hVal < 16) {
          r = 1.0; g = 0.9; b = 0.8;
          baseSize = 4.5;
        } else if (hVal < 19) {
          r = 0.9; g = 0.7; b = 0.4;
          baseSize = 3.2;
        } else if (hVal < 22) {
          r = 0.5; g = 0.7; b = 0.9;
          baseSize = 2.2;
        } else {
          r = 0.3; g = 0.4; b = 0.6;
          baseSize = 1.6;
        }
      } else {
        r = UNIFORM_COLOR.r;
        g = UNIFORM_COLOR.g;
        b = UNIFORM_COLOR.b;
      }

      // Highlight selected or hovered asteroid
      if (i === this.selectedIndex) {
        r = 1.0;
        g = 1.0;
        b = 1.0;
        baseSize = 7.0;
        this.visibilityBuffer[i] = 1.0;
      } else if (i === this.hoveredIndex) {
        r = 1.0;
        g = 1.0;
        b = 0.4;
        baseSize = 5.5;
        this.visibilityBuffer[i] = 1.0;
      }

      this.colorBuffer[i * 3 + 0] = r;
      this.colorBuffer[i * 3 + 1] = g;
      this.colorBuffer[i * 3 + 2] = b;
      this.sizeBuffer[i] = baseSize;
    }

    const geom = this.geometry;
    (geom.attributes.customColor as THREE.BufferAttribute).needsUpdate = true;
    (geom.attributes.pointSize as THREE.BufferAttribute).needsUpdate = true;
    (geom.attributes.visibleFlag as THREE.BufferAttribute).needsUpdate = true;
  }

  public updatePositions(jd: number, force: boolean = false) {
    if (!force && Math.abs(jd - this.lastUpdatedJd) < 1e-6) {
      return;
    }
    this.lastUpdatedJd = jd;

    const { count, a, e, epoch, n, ma, Px, Py, Pz, Qx, Qy, Qz } = this.arrays;
    const pos = this.positionBuffer;

    for (let i = 0; i < count; i++) {
      const dt = jd - epoch[i];
      let M = (ma[i] + n[i] * dt) % TWO_PI;
      if (M < 0) M += TWO_PI;

      const ecc = e[i];
      // Fast 3-iteration Newton-Raphson
      let E = M + ecc * Math.sin(M);
      for (let iter = 0; iter < 3; iter++) {
        const dE = (E - ecc * Math.sin(E) - M) / (1 - ecc * Math.cos(E));
        E -= dE;
        if (Math.abs(dE) < 1e-5) break;
      }

      const semi = a[i];
      const xp = semi * (Math.cos(E) - ecc);
      const yp = semi * Math.sqrt(Math.max(0, 1 - ecc * ecc)) * Math.sin(E);

      // Ecliptic coordinates -> Three.js (x = rx, y = rz, z = -ry)
      const rx = xp * Px[i] + yp * Qx[i];
      const ry = xp * Py[i] + yp * Qy[i];
      const rz = xp * Pz[i] + yp * Qz[i];

      pos[i * 3 + 0] = rx;
      pos[i * 3 + 1] = rz;
      pos[i * 3 + 2] = -ry;
    }

    (this.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
  }

  public getAsteroidPosition(idx: number): THREE.Vector3 | null {
    if (idx < 0 || idx >= this.arrays.count) return null;
    return new THREE.Vector3(
      this.positionBuffer[idx * 3 + 0],
      this.positionBuffer[idx * 3 + 1],
      this.positionBuffer[idx * 3 + 2]
    );
  }

  public getVisibleCount(): number {
    let visible = 0;
    for (let i = 0; i < this.arrays.count; i++) {
      if (this.visibilityBuffer[i] > 0.5) visible++;
    }
    return visible;
  }

  public findNearestAsteroid(
    mouseNormalizedX: number,
    mouseNormalizedY: number,
    camera: THREE.Camera,
    screenWidth: number,
    screenHeight: number,
    pixelTolerance: number = 18
  ): number {
    const v = new THREE.Vector3();
    let bestIndex = -1;
    let minScreenDistSq = pixelTolerance * pixelTolerance;

    const count = this.arrays.count;
    const pos = this.positionBuffer;
    const vis = this.visibilityBuffer;

    const mousePxX = ((mouseNormalizedX + 1) / 2) * screenWidth;
    const mousePxY = ((-mouseNormalizedY + 1) / 2) * screenHeight;

    for (let i = 0; i < count; i++) {
      if (vis[i] < 0.5) continue;

      v.set(pos[i * 3 + 0], pos[i * 3 + 1], pos[i * 3 + 2]);
      // Project to NDC
      v.project(camera);

      // Must be in front of camera
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
