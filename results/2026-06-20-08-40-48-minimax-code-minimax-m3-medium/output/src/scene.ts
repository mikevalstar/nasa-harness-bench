/**
 * Three.js scene: Sun, planets, asteroid instanced mesh (GPU Kepler),
 * comet instanced mesh, orbit lines.
 *
 * The asteroid field is rendered with a custom ShaderMaterial that runs
 * Kepler's equation on the GPU per instance per frame. Position update is
 * driven entirely by a single uniform `uTime` (the Julian date).
 */
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { LoadedData, FilterState, CameraState } from "./types";
import { computePosition, sampleOrbit } from "./orbit";

const DEG = Math.PI / 180;

export interface SceneRefs {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  sunMesh: THREE.Mesh;
  sunGlow: THREE.Mesh;
  planetMeshes: THREE.Mesh[];
  planetOrbits: THREE.Line[];
  asteroidMesh: THREE.InstancedMesh;
  cometMeshElliptic: THREE.InstancedMesh;
  cometMeshHyperbolic: THREE.InstancedMesh;
  selectedOrbit: THREE.Line;
  highlightOrbit: THREE.Line;
  closeApproachMarkers: THREE.Group;
  sentryMarkers: THREE.Group;
  // Bookkeeping
  asteroidStride: number;
  cometStride: number;
  asteroidDataArr: Float32Array;
  cometDataArr: Float32Array;
}

export function createScene(canvas: HTMLCanvasElement): {
  refs: SceneRefs;
  dispose: () => void;
} {
  // Renderer.
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.setClearColor(0x000000, 0);

  // Scene.
  const scene = new THREE.Scene();

  // Star background.
  scene.add(buildStarfield());

  // Camera.
  const camera = new THREE.PerspectiveCamera(
    50,
    window.innerWidth / window.innerHeight,
    0.001,
    5000,
  );
  // Default position: ~12 au out, slightly above ecliptic, looking back at the
  // Sun. Wide enough to see the inner planets + most asteroid orbits.
  camera.position.set(10, 6, 10);
  camera.lookAt(0, 0, 0);

  // Controls.
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.zoomSpeed = 0.7;
  controls.rotateSpeed = 0.6;
  controls.panSpeed = 0.6;
  controls.minDistance = 0.05;
  controls.maxDistance = 1500;

  // ---- Sun ----
  const sunGeo = new THREE.SphereGeometry(0.06, 48, 32);
  const sunMat = new THREE.ShaderMaterial({
    uniforms: {},
    vertexShader: /* glsl */ `
      varying vec3 vNormal;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      varying vec3 vNormal;
      void main() {
        // Bright orange-yellow disc with a slight darker rim for definition.
        float rim = clamp(1.0 - vNormal.z * 0.4, 0.6, 1.0);
        vec3 col = mix(vec3(1.0, 0.85, 0.5), vec3(1.0, 0.95, 0.7), rim);
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
  const sunMesh = new THREE.Mesh(sunGeo, sunMat);
  scene.add(sunMesh);

  // Sun glow (billboarded sprite).
  const sunGlow = new THREE.Mesh(
    new THREE.SphereGeometry(0.3, 32, 24),
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {},
      vertexShader: /* glsl */ `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.7 - dot(vNormal, vec3(0,0,1)), 2.5);
          gl_FragColor = vec4(1.0, 0.75, 0.35, intensity * 0.7);
        }
      `,
    }),
  );
  scene.add(sunGlow);

  // ---- Planets (placeholders, populated after data load) ----
  const planetMeshes: THREE.Mesh[] = [];
  const planetOrbits: THREE.Line[] = [];

  // ---- Asteroid InstancedMesh (GPU Kepler) ----
  const asteroidStride = 30;
  const cometStride = 24;

  const asteroidMesh = createAsteroidMesh(0, asteroidStride);
  scene.add(asteroidMesh);

  const cometMeshElliptic = createCometMesh(0, cometStride, false);
  const cometMeshHyperbolic = createCometMesh(0, cometStride, true);
  scene.add(cometMeshElliptic);
  scene.add(cometMeshHyperbolic);

  // ---- Selected asteroid orbit (initially hidden) ----
  const selectedOrbitGeo = new THREE.BufferGeometry();
  selectedOrbitGeo.setAttribute(
    "position",
    new THREE.BufferAttribute(new Float32Array(256 * 3), 3),
  );
  const selectedOrbitMat = new THREE.LineBasicMaterial({
    color: 0x6cc4ff,
    transparent: true,
    opacity: 0.85,
  });
  const selectedOrbit = new THREE.Line(selectedOrbitGeo, selectedOrbitMat);
  selectedOrbit.visible = false;
  scene.add(selectedOrbit);

  const highlightOrbit = new THREE.Line(
    new THREE.BufferGeometry().setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(256 * 3), 3),
    ),
    new THREE.LineBasicMaterial({ color: 0xffba6c, transparent: true, opacity: 0.7 }),
  );
  highlightOrbit.visible = false;
  scene.add(highlightOrbit);

  // Markers for upcoming close approaches.
  const closeApproachMarkers = new THREE.Group();
  scene.add(closeApproachMarkers);

  const sentryMarkers = new THREE.Group();
  scene.add(sentryMarkers);

  // Lighting (matters for planet materials which use MeshStandardMaterial).
  scene.add(new THREE.AmbientLight(0xffffff, 0.35));
  const sunLight = new THREE.DirectionalLight(0xffffff, 1.1);
  sunLight.position.set(0, 0, 0);
  scene.add(sunLight);

  // Resize handling.
  const onResize = () => {
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  };
  window.addEventListener("resize", onResize);

  const refs: SceneRefs = {
    renderer,
    scene,
    camera,
    controls,
    sunMesh,
    sunGlow,
    planetMeshes,
    planetOrbits,
    asteroidMesh,
    cometMeshElliptic,
    cometMeshHyperbolic,
    selectedOrbit,
    highlightOrbit,
    closeApproachMarkers,
    sentryMarkers,
    asteroidStride,
    cometStride,
    asteroidDataArr: new Float32Array(0),
    cometDataArr: new Float32Array(0),
  };

  return {
    refs,
    dispose: () => {
      window.removeEventListener("resize", onResize);
      renderer.dispose();
    },
  };
}

// ---- Build starfield ----
function buildStarfield(): THREE.Points {
  const N = 8000;
  const positions = new Float32Array(N * 3);
  const colors = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    // Place stars on a large sphere far from origin.
    const r = 2500 + Math.random() * 200;
    const u = Math.random();
    const v = Math.random();
    const theta = 2 * Math.PI * u;
    const phi = Math.acos(2 * v - 1);
    positions[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);
    // Slight color variation.
    const t = Math.random();
    if (t < 0.7) {
      colors[i * 3 + 0] = 1.0;
      colors[i * 3 + 1] = 1.0;
      colors[i * 3 + 2] = 1.0;
    } else if (t < 0.85) {
      colors[i * 3 + 0] = 0.7;
      colors[i * 3 + 1] = 0.8;
      colors[i * 3 + 2] = 1.0;
    } else {
      colors[i * 3 + 0] = 1.0;
      colors[i * 3 + 1] = 0.85;
      colors[i * 3 + 2] = 0.7;
    }
  }
  const geom = new THREE.BufferGeometry();
  geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geom.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  const mat = new THREE.PointsMaterial({
    size: 0.8,
    sizeAttenuation: true,
    vertexColors: true,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
  });
  return new THREE.Points(geom, mat);
}

// ---- Planet meshes + orbits ----
const PLANET_COLORS: Record<string, number> = {
  Mercury: 0xb0a090,
  Venus: 0xe6c187,
  Earth: 0x6cb4ff,
  Mars: 0xd56b4a,
  Jupiter: 0xd9b284,
  Saturn: 0xe6cf9b,
  Uranus: 0x9bd9e6,
  Neptune: 0x6c8eff,
};

const PLANET_DISPLAY_RADIUS: Record<string, number> = {
  Mercury: 0.025,
  Venus: 0.045,
  Earth: 0.05,
  Mars: 0.04,
  Jupiter: 0.16,
  Saturn: 0.14,
  Uranus: 0.1,
  Neptune: 0.1,
};

export function populatePlanets(
  refs: SceneRefs,
  planets: LoadedData["planets"],
): void {
  for (const p of planets) {
    const radius = PLANET_DISPLAY_RADIUS[p.name] ?? 0.05;
    const color = PLANET_COLORS[p.name] ?? 0xcccccc;

    const geo = new THREE.SphereGeometry(radius, 32, 24);
    const mat = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.85,
      metalness: 0.0,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.userData = { kind: "planet", name: p.name };
    refs.planetMeshes.push(mesh);
    refs.scene.add(mesh);

    // Orbit polyline.
    const positions = sampleOrbit(
      [1, 0, 0],
      [0, 1, 0],
      p.a,
      p.e,
      128,
      false,
    );
    // Rotate from default (x-axis perihelion) to the planet's actual orientation.
    const orbitGeo = new THREE.BufferGeometry();
    const out = new Float32Array(positions.length);
    const om = (p.om ?? 0) * DEG;
    const w = (p.w ?? 0) * DEG;
    const i = (p.i ?? 0) * DEG;
    const cosO = Math.cos(om),
      sinO = Math.sin(om);
    const cosW = Math.cos(w),
      sinW = Math.sin(w);
    const cosI = Math.cos(i),
      sinI = Math.sin(i);
    // R = Rz(om) * Rx(i) * Rz(w)
    // Apply to (x, y, 0):
    // x' = cos(om)*(cos(w)*x - sin(w)*y) - sin(om)*(cos(i)*(sin(w)*x + cos(w)*y))
    // y' = sin(om)*(cos(w)*x - sin(w)*y) + cos(om)*(cos(i)*(sin(w)*x + cos(w)*y))
    // z' = sin(i)*(sin(w)*x + cos(w)*y)
    for (let k = 0; k < positions.length; k += 3) {
      const x = positions[k];
      const y = positions[k + 1];
      const u = cosW * x - sinW * y;
      const v = sinW * x + cosW * y;
      out[k] = cosO * u - sinO * cosI * v;
      out[k + 1] = sinO * u + cosO * cosI * v;
      out[k + 2] = sinI * v;
    }
    orbitGeo.setAttribute(
      "position",
      new THREE.BufferAttribute(out, 3),
    );
    const lineMat = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity: 0.18,
    });
    const line = new THREE.Line(orbitGeo, lineMat);
    refs.planetOrbits.push(line);
    refs.scene.add(line);
  }
}

/** Update planet positions for the current Julian date. */
export function updatePlanetPositions(
  refs: SceneRefs,
  planets: LoadedData["planets"],
  jd: number,
): void {
  for (let i = 0; i < planets.length; i++) {
    const p = planets[i];
    const mesh = refs.planetMeshes[i];
    const pos = computePosition(
      1,
      0,
      0,
      0,
      1,
      0,
      p.a,
      p.e,
      p.ma,
      p.n,
      p.epoch,
      jd,
      false,
    );
    // Rotate to planet's actual orientation.
    const om = (p.om ?? 0) * DEG;
    const w = (p.w ?? 0) * DEG;
    const inc = (p.i ?? 0) * DEG;
    // r * (cos(nu), sin(nu)) in perifocal frame, rotated.
    const xPF = pos.r * pos.cosNu;
    const yPF = pos.r * pos.sinNu;
    const cosO = Math.cos(om),
      sinO = Math.sin(om);
    const cosW = Math.cos(w),
      sinW = Math.sin(w);
    const cosI = Math.cos(inc),
      sinI = Math.sin(inc);
    const u = cosW * xPF - sinW * yPF;
    const v = sinW * xPF + cosW * yPF;
    mesh.position.set(
      cosO * u - sinO * cosI * v,
      sinO * u + cosO * cosI * v,
      sinI * v,
    );
  }
}

// ---- Asteroid instanced mesh (GPU Kepler) ----
function createAsteroidMesh(
  count: number,
  stride: number,
): THREE.InstancedMesh {
  // Tiny low-poly sphere; we strip normals/uvs to keep attribute slots free.
  const geom = new THREE.SphereGeometry(1, 6, 4);
  geom.deleteAttribute("normal");
  geom.deleteAttribute("uv");

  // Custom shader with instanced attributes.
  // Attribute budget is 16 vec4 slots in WebGL2. We use:
  //   position (vec3) - sphere vertex
  //   aEx (vec3) - per-instance, ex
  //   aEy (vec3) - per-instance, ey
  //   aD1 (vec4) - per-instance (aA, aE, aMaDeg, aNDeg)
  //   aD2 (vec4) - per-instance (aEpoch, aSize, aColor.r, aColor.g)
  //   aD3 (vec4) - per-instance (aColor.b, aVisible, _, _)
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 2460000.5 },
    },
    vertexShader: /* glsl */ `
      attribute vec3 aEx;
      attribute vec3 aEy;
      attribute vec4 aD1;  // (a, e, maDeg, nDeg)
      attribute vec4 aD2;  // (epoch, size, color.r, color.g)
      attribute vec4 aD3;  // (color.b, visible, _, _)
      uniform float uTime;

      varying vec3 vColor;
      varying float vVisible;

      const float PI = 3.14159265358979;
      const float TWO_PI = 6.28318530717959;

      float wrapPi(float a) {
        return mod(a + PI, TWO_PI) - PI;
      }

      void main() {
        vColor = vec3(aD2.z, aD2.w, aD3.x);
        vVisible = aD3.y;
        if (aD3.y < 0.5) {
          gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
          return;
        }

        float aA = aD1.x;
        float aE = aD1.y;
        float aMaDeg = aD1.z;
        float aNDeg = aD1.w;
        float aEpoch = aD2.x;
        float aSize = aD2.y;

        float M = radians(aMaDeg + aNDeg * (uTime - aEpoch));
        M = wrapPi(M);

        // Solve Kepler: M = E - e*sin(E)
        float E = M + aE * sin(M);
        for (int i = 0; i < 6; i++) {
          float f = E - aE * sin(E) - M;
          float fp = 1.0 - aE * cos(E);
          E = E - f / fp;
        }

        float cosE = cos(E);
        float sinE = sin(E);
        float sqrtE2 = sqrt(max(0.0, 1.0 - aE*aE));
        float xPF = aA * (cosE - aE);
        float yPF = aA * sqrtE2 * sinE;
        vec3 helio = aEx * xPF + aEy * yPF;

        vec3 worldPos = helio + position * aSize;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(worldPos, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      varying vec3 vColor;
      varying float vVisible;
      void main() {
        if (vVisible < 0.5) discard;
        gl_FragColor = vec4(vColor, 1.0);
      }
    `,
  });

  const mesh = new THREE.InstancedMesh(geom, material, count);
  mesh.frustumCulled = false;
  mesh.count = count;
  return mesh;
}

function createCometMesh(
  count: number,
  stride: number,
  hyperbolic: boolean,
): THREE.InstancedMesh {
  const geom = new THREE.SphereGeometry(1, 6, 4);
  geom.deleteAttribute("normal");
  geom.deleteAttribute("uv");

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 2460000.5 },
    },
    vertexShader: /* glsl */ `
      attribute vec3 aEx;
      attribute vec3 aEy;
      attribute vec4 aD1;  // (a, e, maDeg, nDeg)
      attribute vec4 aD2;  // (epoch, size, color.r, color.g)
      attribute vec4 aD3;  // (color.b, visible, _, _)
      uniform float uTime;

      varying vec3 vColor;
      varying float vVisible;

      const float PI = 3.14159265358979;
      const float TWO_PI = 6.28318530717959;

      void main() {
        vColor = vec3(aD2.z, aD2.w, aD3.x);
        vVisible = aD3.y;
        if (aD3.y < 0.5) {
          gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
          return;
        }

        float aA = aD1.x;
        float aE = aD1.y;
        float aMaDeg = aD1.z;
        float aNDeg = aD1.w;
        float aEpoch = aD2.x;
        float aSize = aD2.y;

        float Mdeg = aMaDeg + aNDeg * (uTime - aEpoch);
        float M = radians(Mdeg);

        vec3 helio;
        if (aE >= 1.0) {
          // Hyperbolic Kepler: M = e*sinh(H) - H
          float H = M / max(1.0001, aE - 1.0);
          if (abs(H) < 1e-6) H = M;
          for (int i = 0; i < 24; i++) {
            float sinhH = sinh(H);
            float coshH = cosh(H);
            float f = aE * sinhH - H - M;
            float fp = aE * coshH - 1.0;
            if (abs(fp) < 1e-9) break;
            H = H - f / fp;
          }
          float aSigned = -abs(aA);
          float sqrtE2_1 = sqrt(max(0.0, aE*aE - 1.0));
          float coshH = cosh(H);
          float sinhH = sinh(H);
          float xPF = aSigned * (aE - coshH);
          float yPF = aSigned * sqrtE2_1 * sinhH;
          helio = aEx * xPF + aEy * yPF;
        } else {
          float Mw = mod(M + PI, TWO_PI) - PI;
          float E = Mw + aE * sin(Mw);
          for (int i = 0; i < 6; i++) {
            float f = E - aE * sin(E) - Mw;
            float fp = 1.0 - aE * cos(E);
            E = E - f / fp;
          }
          float cosE = cos(E);
          float sinE = sin(E);
          float sqrtE2 = sqrt(max(0.0, 1.0 - aE*aE));
          float xPF = aA * (cosE - aE);
          float yPF = aA * sqrtE2 * sinE;
          helio = aEx * xPF + aEy * yPF;
        }

        vec3 worldPos = helio + position * aSize;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(worldPos, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      varying vec3 vColor;
      varying float vVisible;
      void main() {
        if (vVisible < 0.5) discard;
        gl_FragColor = vec4(vColor, 1.0);
      }
    `,
  });

  const mesh = new THREE.InstancedMesh(geom, material, count);
  mesh.frustumCulled = false;
  mesh.count = count;
  return mesh;
}

// ---- Populate asteroid / comet instanced meshes after data load ----
export function populateAsteroids(refs: SceneRefs, data: LoadedData): void {
  const N = data.asteroidCount;
  const stride = data.asteroidStride;
  const src = data.asteroidData;
  const geom = refs.asteroidMesh.geometry;

  // Per-instance packed attributes (vec4-aligned):
  //   aEx (vec3)   ex.x, ex.y, ex.z
  //   aEy (vec3)   ey.x, ey.y, ey.z
  //   aD1 (vec4)   a, e, maDeg, nDeg
  //   aD2 (vec4)   epoch, size, color.r, color.g
  //   aD3 (vec4)   color.b, visible, _, _
  const ex = new Float32Array(N * 3);
  const ey = new Float32Array(N * 3);
  const d1 = new Float32Array(N * 4);
  const d2 = new Float32Array(N * 4);
  const d3 = new Float32Array(N * 4);
  // visible lives at d3[i*4+1] but we keep a parallel Float32Array reference
  // for the filter code to mutate and mark the GPU buffer dirty.
  const visible = new Float32Array(N);
  const sizeArr = new Float32Array(N);
  const cR = new Float32Array(N);
  const cG = new Float32Array(N);
  const cB = new Float32Array(N);

  for (let i = 0; i < N; i++) {
    const base = i * stride;
    ex[i * 3 + 0] = src[base + 0];
    ex[i * 3 + 1] = src[base + 1];
    ex[i * 3 + 2] = src[base + 2];
    ey[i * 3 + 0] = src[base + 3];
    ey[i * 3 + 1] = src[base + 4];
    ey[i * 3 + 2] = src[base + 5];
    d1[i * 4 + 0] = src[base + 9]; // a
    d1[i * 4 + 1] = src[base + 10]; // e
    d1[i * 4 + 2] = src[base + 11]; // maDeg
    d1[i * 4 + 3] = src[base + 12]; // nDeg
    d2[i * 4 + 0] = src[base + 13]; // epoch
    const H = src[base + 18];
    // Cap-aware H→au size. Most NEOs are H 15–28; lower H = bigger.
    // Capped at 0.02 au so very large objects don't dominate.
    const baseSize = Math.min(0.02, 0.0018 + 0.025 * Math.exp(-(H - 9) * 0.32));
    const hasDiam = (src[base + 25] & 8) !== 0;
    const sz = baseSize * (hasDiam ? 1.35 : 1.0);
    d2[i * 4 + 1] = sz; // size
    d2[i * 4 + 2] = src[base + 22]; // color.r
    d2[i * 4 + 3] = src[base + 23]; // color.g
    d3[i * 4 + 0] = src[base + 24]; // color.b
    d3[i * 4 + 1] = 1; // visible
    visible[i] = 1;
    sizeArr[i] = sz;
    cR[i] = src[base + 22];
    cG[i] = src[base + 23];
    cB[i] = src[base + 24];
  }

  geom.setAttribute("aEx", new THREE.InstancedBufferAttribute(ex, 3));
  geom.setAttribute("aEy", new THREE.InstancedBufferAttribute(ey, 3));
  geom.setAttribute("aD1", new THREE.InstancedBufferAttribute(d1, 4));
  geom.setAttribute("aD2", new THREE.InstancedBufferAttribute(d2, 4));
  geom.setAttribute("aD3", new THREE.InstancedBufferAttribute(d3, 4));

  refs.asteroidMesh.count = N;
  refs.asteroidMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

  // Bookkeeping for filter / highlight.
  (refs.asteroidMesh.userData as any).visibleArr = visible;
  (refs.asteroidMesh.userData as any).sizeArr = sizeArr;
  (refs.asteroidMesh.userData as any).d3Arr = d3;
  (refs.asteroidMesh.userData as any).d2Arr = d2;
  (refs.asteroidMesh.userData as any).cR = cR;
  (refs.asteroidMesh.userData as any).cG = cG;
  (refs.asteroidMesh.userData as any).cB = cB;
}

export function populateComets(refs: SceneRefs, data: LoadedData): void {
  const cN = data.cometCount;
  const cStride = data.cometStride;
  const src = data.cometData;

  function buildOne(target: THREE.InstancedMesh, indices: number[], hyperbolic: boolean) {
    const M = indices.length;
    const ex = new Float32Array(M * 3);
    const ey = new Float32Array(M * 3);
    const d1 = new Float32Array(M * 4);
    const d2 = new Float32Array(M * 4);
    const d3 = new Float32Array(M * 4);
    const visible = new Float32Array(M);

    for (let k = 0; k < M; k++) {
      const i = indices[k];
      const base = i * cStride;
      ex[k * 3 + 0] = src[base + 0];
      ex[k * 3 + 1] = src[base + 1];
      ex[k * 3 + 2] = src[base + 2];
      ey[k * 3 + 0] = src[base + 3];
      ey[k * 3 + 1] = src[base + 4];
      ey[k * 3 + 2] = src[base + 5];
      d1[k * 4 + 0] = src[base + 9];
      d1[k * 4 + 1] = src[base + 10];
      d1[k * 4 + 2] = src[base + 11];
      d1[k * 4 + 3] = src[base + 12];
      d2[k * 4 + 0] = src[base + 13];
      const H = src[base + 17];
      const sz = 0.005 + 0.04 * Math.exp(-(H - 4) * 0.18);
      d2[k * 4 + 1] = sz;
      d2[k * 4 + 2] = 0.7;
      d2[k * 4 + 3] = 0.85;
      d3[k * 4 + 0] = hyperbolic ? 1.0 : 0.95;
      d3[k * 4 + 1] = 1;
      visible[k] = 1;
    }

    const geom = target.geometry;
    geom.setAttribute("aEx", new THREE.InstancedBufferAttribute(ex, 3));
    geom.setAttribute("aEy", new THREE.InstancedBufferAttribute(ey, 3));
    geom.setAttribute("aD1", new THREE.InstancedBufferAttribute(d1, 4));
    geom.setAttribute("aD2", new THREE.InstancedBufferAttribute(d2, 4));
    geom.setAttribute("aD3", new THREE.InstancedBufferAttribute(d3, 4));

    target.count = M;
    target.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    (target.userData as any).visibleArr = visible;
    (target.userData as any).d3Arr = d3;
  }

  const ellipticIdx: number[] = [];
  const hyperbolicIdx: number[] = [];
  for (let i = 0; i < cN; i++) {
    if (src[i * cStride + 10] >= 1) hyperbolicIdx.push(i);
    else ellipticIdx.push(i);
  }
  buildOne(refs.cometMeshElliptic, ellipticIdx, false);
  buildOne(refs.cometMeshHyperbolic, hyperbolicIdx, true);
}

// ---- Visibility update from filters ----
export function applyFilters(
  refs: SceneRefs,
  data: LoadedData,
  filters: FilterState,
  searchHits: Set<number> | null,
): { visibleAsteroids: number; visibleComets: number } {
  // Asteroid visibility.
  const visibleArr = (refs.asteroidMesh.userData as any).visibleArr as Float32Array;
  const d3 = (refs.asteroidMesh.userData as any).d3Arr as Float32Array;
  let visibleAsteroids = 0;
  for (let i = 0; i < data.asteroidCount; i++) {
    const base = i * data.asteroidStride;
    const flags = data.asteroidData[base + 25] | 0;
    const classCode = data.asteroidData[base + 26] | 0;
    const diameter = data.asteroidData[base + 19];
    const moid = data.asteroidData[base + 17];
    const isNeo = (flags & 1) !== 0;
    const isPha = (flags & 2) !== 0;
    const isSentry = (flags & 4) !== 0;
    const hasDiam = (flags & 8) !== 0;

    let visible = 1;
    if (!isNeo) visible = 0;
    if (filters.phaOnly && !isPha) visible = 0;
    if (filters.sentryOnly && !isSentry) visible = 0;
    if (filters.classCode && filters.classCode !== classCode) visible = 0;
    if (filters.minDiameter > 0) {
      if (!hasDiam || diameter < filters.minDiameter) visible = 0;
    }
    if (filters.maxMoid > 0 && moid > filters.maxMoid) visible = 0;
    if (searchHits && searchHits.size > 0 && !searchHits.has(i)) visible = 0;
    visibleArr[i] = visible;
    d3[i * 4 + 1] = visible;
    if (visible) visibleAsteroids++;
  }
  // Mark instanced attribute as needing upload.
  const attr = refs.asteroidMesh.geometry.getAttribute(
    "aD3",
  ) as THREE.InstancedBufferAttribute;
  attr.needsUpdate = true;

  // Comet visibility.
  const cometEllD3 = (refs.cometMeshElliptic.userData as any).d3Arr as
    | Float32Array
    | undefined;
  const cometHypD3 = (refs.cometMeshHyperbolic.userData as any).d3Arr as
    | Float32Array
    | undefined;
  let visibleComets = 0;
  if (cometEllD3) {
    const v = filters.comets ? 1 : 0;
    for (let i = 0; i < cometEllD3.length / 4; i++) {
      cometEllD3[i * 4 + 1] = v;
      if (v) visibleComets++;
    }
    (
      refs.cometMeshElliptic.geometry.getAttribute(
        "aD3",
      ) as THREE.InstancedBufferAttribute
    ).needsUpdate = true;
  }
  if (cometHypD3) {
    const v = filters.comets ? 1 : 0;
    for (let i = 0; i < cometHypD3.length / 4; i++) {
      cometHypD3[i * 4 + 1] = v;
      if (v) visibleComets++;
    }
    (
      refs.cometMeshHyperbolic.geometry.getAttribute(
        "aD3",
      ) as THREE.InstancedBufferAttribute
    ).needsUpdate = true;
  }

  // Planet orbits visibility.
  for (const line of refs.planetOrbits) {
    line.visible = filters.orbits;
  }

  return { visibleAsteroids, visibleComets };
}

// ---- Update asteroid instance color (boost selected) ----
export function highlightAsteroid(
  refs: SceneRefs,
  data: LoadedData,
  pdes: string | null,
  color: [number, number, number] = [1, 0.85, 0.4],
): void {
  const d2 = (refs.asteroidMesh.userData as any).d2Arr as Float32Array;
  const d3 = (refs.asteroidMesh.userData as any).d3Arr as Float32Array;
  const sizeArr = (refs.asteroidMesh.userData as any).sizeArr as Float32Array;
  const stride = data.asteroidStride;

    if (pdes === null) {
      // Restore original colors from data.
      for (let i = 0; i < data.asteroidCount; i++) {
        const base = i * stride;
        d2[i * 4 + 2] = data.asteroidData[base + 22];
        d2[i * 4 + 3] = data.asteroidData[base + 23];
        d3[i * 4 + 0] = data.asteroidData[base + 24];
        const H = data.asteroidData[base + 18];
        const hasDiam = (data.asteroidData[base + 25] & 8) !== 0;
        const sz = Math.min(0.02, 0.0018 + 0.025 * Math.exp(-(H - 9) * 0.32)) * (hasDiam ? 1.35 : 1.0);
        d2[i * 4 + 1] = sz;
        sizeArr[i] = sz;
      }
    } else {
      const idx = data.asteroidMeta.findIndex((m) => m.pdes === pdes);
      if (idx >= 0) {
        d2[idx * 4 + 2] = color[0];
        d2[idx * 4 + 3] = color[1];
        d3[idx * 4 + 0] = color[2];
        const newSize = Math.min(0.04, sizeArr[idx] * 2.0);
        d2[idx * 4 + 1] = newSize;
        sizeArr[idx] = newSize;
      }
    }
  (
    refs.asteroidMesh.geometry.getAttribute("aD2") as THREE.InstancedBufferAttribute
  ).needsUpdate = true;
  (
    refs.asteroidMesh.geometry.getAttribute("aD3") as THREE.InstancedBufferAttribute
  ).needsUpdate = true;
}

// ---- Show orbit of selected body ----
export function showOrbitFor(
  refs: SceneRefs,
  data: LoadedData,
  pdes: string | null,
): void {
  if (!pdes) {
    refs.selectedOrbit.visible = false;
    refs.highlightOrbit.visible = false;
    return;
  }
  const idx = data.asteroidMeta.findIndex((m) => m.pdes === pdes);
  if (idx < 0) {
    refs.selectedOrbit.visible = false;
    refs.highlightOrbit.visible = false;
    return;
  }
  const stride = data.asteroidStride;
  const base = idx * stride;
  const ex: [number, number, number] = [
    data.asteroidData[base + 0],
    data.asteroidData[base + 1],
    data.asteroidData[base + 2],
  ];
  const ey: [number, number, number] = [
    data.asteroidData[base + 3],
    data.asteroidData[base + 4],
    data.asteroidData[base + 5],
  ];
  const a = data.asteroidData[base + 9];
  const e = data.asteroidData[base + 10];
  const isHyp = e >= 1;
  const segments = isHyp ? 200 : 256;
  const positions = sampleOrbit(ex, ey, Math.abs(a), e, segments, isHyp);
  const posAttr = refs.selectedOrbit.geometry.getAttribute(
    "position",
  ) as THREE.BufferAttribute;
  if (posAttr.array.length !== positions.length) {
    refs.selectedOrbit.geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3),
    );
  } else {
    (posAttr.array as Float32Array).set(positions);
    posAttr.needsUpdate = true;
  }
  refs.selectedOrbit.geometry.computeBoundingSphere();
  refs.selectedOrbit.visible = true;
  refs.highlightOrbit.visible = false;
}

// ---- Apply camera state from URL share ----
export function applyCameraState(
  refs: SceneRefs,
  state: CameraState | null,
): void {
  if (!state) return;
  refs.camera.position.set(state.x, state.y, state.z);
  refs.camera.lookAt(state.tx, state.ty, state.tz);
  refs.controls.target.set(state.tx, state.ty, state.tz);
  refs.controls.update();
}

export function readCameraState(refs: SceneRefs): CameraState {
  const p = refs.camera.position;
  const t = refs.controls.target;
  return { x: p.x, y: p.y, z: p.z, tx: t.x, ty: t.y, tz: t.z };
}
