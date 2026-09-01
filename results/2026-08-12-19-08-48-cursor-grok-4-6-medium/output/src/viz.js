import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { CSS2DRenderer, CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";
import {
  propagateAsteroid,
  propagateComet,
  propagateElements,
  sampleOrbit,
  asteroidElements,
  cometElements,
} from "./orbit.js";

const PLANET_COLORS = {
  Mercury: 0xb1b1b1,
  Venus: 0xe3c07a,
  Earth: 0x4ea3ff,
  Mars: 0xe07a5f,
  Jupiter: 0xd4a373,
  Saturn: 0xe9c46a,
  Uranus: 0x7ec8e3,
  Neptune: 0x4d7cff,
};

const AU_KM = 149597870.7;
const SUN_RADIUS_KM = 696000;
const LD = 0.00256955529; // au

function visualPlanetRadius(radiusKm) {
  return 0.018 * Math.pow(radiusKm / 6371, 0.42);
}

function diameterKm(H, diameter) {
  if (Number.isFinite(diameter) && diameter > 0) return diameter;
  if (!Number.isFinite(H)) return 0.05;
  return 1329 * 10 ** (-0.2 * H) / Math.sqrt(0.14);
}

export function createViz(canvas, labelHost) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, logarithmicDepthBuffer: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setClearColor(0x05070c, 1);
  renderer.setSize(1, 1, false);

  const labelRenderer = new CSS2DRenderer();
  labelRenderer.domElement.style.position = "absolute";
  labelRenderer.domElement.style.inset = "0";
  labelRenderer.domElement.style.pointerEvents = "none";
  labelHost.appendChild(labelRenderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, 1, 0.0004, 4000);
  camera.position.set(2.4, 1.3, 2.8);

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.minDistance = 0.05;
  controls.maxDistance = 80;
  controls.target.set(0, 0, 0);

  scene.add(new THREE.AmbientLight(0x334455, 0.55));
  const sunLight = new THREE.PointLight(0xfff2d0, 2.4, 80, 1);
  scene.add(sunLight);

  const stars = makeStars();
  scene.add(stars);

  const sun = makeSun();
  scene.add(sun);

  const planetsGroup = new THREE.Group();
  scene.add(planetsGroup);
  const orbitsGroup = new THREE.Group();
  scene.add(orbitsGroup);
  const selectedOrbit = new THREE.Line(
    new THREE.BufferGeometry(),
    new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 })
  );
  scene.add(selectedOrbit);

  const tmp = [0, 0, 0];
  const planetMeshes = [];
  const planetLabels = [];
  let planets = [];
  let earthIndex = 2;

  let astOrbits, astMeta, astCount = 0;
  let comOrbits, comMeta, comCount = 0;
  let sentryByDes = {};
  let astPoints, astPos, astCol, astSize, astVis;
  let comPoints, comPos, comCol, comSize, comVis;
  let visibleAst = null;
  let showComets = false;
  let showAsteroids = true;

  const pickSphere = new THREE.Mesh(
    new THREE.SphereGeometry(1, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.55 })
  );
  pickSphere.visible = false;
  scene.add(pickSphere);

  function resize() {
    const w = canvas.clientWidth || canvas.parentElement.clientWidth;
    const h = canvas.clientHeight || canvas.parentElement.clientHeight;
    renderer.setSize(w, h, false);
    labelRenderer.setSize(w, h);
    camera.aspect = w / Math.max(h, 1);
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener("resize", resize);

  function setPlanets(list) {
    planets = list;
    planetsGroup.clear();
    orbitsGroup.clear();
    planetMeshes.length = 0;
    planetLabels.length = 0;
    const geo = new THREE.SphereGeometry(1, 32, 24);
    for (let i = 0; i < list.length; i++) {
      const p = list[i];
      if (p.name === "Earth") earthIndex = i;
      const mat = new THREE.MeshStandardMaterial({
        color: PLANET_COLORS[p.name] ?? 0xcccccc,
        roughness: 0.55,
        metalness: 0.05,
        emissive: PLANET_COLORS[p.name] ?? 0xcccccc,
        emissiveIntensity: 0.12,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.scale.setScalar(visualPlanetRadius(p.radius_km));
      mesh.userData.kind = "planet";
      mesh.userData.index = i;
      planetsGroup.add(mesh);
      planetMeshes.push(mesh);

      const div = document.createElement("div");
      div.className = "label3d";
      div.textContent = p.name;
      const lab = new CSS2DObject(div);
      lab.position.set(0, visualPlanetRadius(p.radius_km) * 1.4, 0);
      mesh.add(lab);
      planetLabels.push(lab);

      const pts = sampleOrbit(p, 220);
      const og = new THREE.BufferGeometry();
      og.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
      const line = new THREE.LineLoop(
        og,
        new THREE.LineBasicMaterial({
          color: PLANET_COLORS[p.name] ?? 0x888888,
          transparent: true,
          opacity: 0.28,
        })
      );
      orbitsGroup.add(line);
    }
  }

  function setAsteroids(orbits, meta) {
    astOrbits = orbits;
    astMeta = meta;
    astCount = meta.count;
    visibleAst = new Uint8Array(astCount);
    visibleAst.fill(1);
    const geo = new THREE.BufferGeometry();
    astPos = new Float32Array(astCount * 3);
    astCol = new Float32Array(astCount * 3);
    astSize = new Float32Array(astCount);
    astVis = new Float32Array(astCount);
    for (let i = 0; i < astCount; i++) {
      const pha = meta.pha[i];
      const sentry = sentryByDes[meta.pdes[i]];
      if (sentry) {
        astCol[i * 3] = 1;
        astCol[i * 3 + 1] = 0.24;
        astCol[i * 3 + 2] = 0.48;
      } else if (pha) {
        astCol[i * 3] = 1;
        astCol[i * 3 + 1] = 0.48;
        astCol[i * 3 + 2] = 0.24;
      } else {
        astCol[i * 3] = 0.62;
        astCol[i * 3 + 1] = 0.72;
        astCol[i * 3 + 2] = 0.83;
      }
      const d = diameterKm(meta.H[i], meta.diameter[i]);
      astSize[i] = THREE.MathUtils.clamp(2.2 + Math.log10(d + 0.01) * 2.4, 1.4, 14);
      astVis[i] = 1;
    }
    geo.setAttribute("position", new THREE.BufferAttribute(astPos, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(astCol, 3));
    geo.setAttribute("aSize", new THREE.BufferAttribute(astSize, 1));
    geo.setAttribute("aVis", new THREE.BufferAttribute(astVis, 1));
    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: { uScale: { value: 1 } },
      vertexShader: `
        attribute float aSize;
        attribute float aVis;
        attribute vec3 color;
        varying vec3 vColor;
        varying float vVis;
        void main() {
          vColor = color;
          vVis = aVis;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = aVis * aSize * (280.0 / max(0.4, -mv.z));
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vVis;
        void main() {
          if (vVis < 0.5) discard;
          vec2 p = gl_PointCoord * 2.0 - 1.0;
          float d = dot(p, p);
          if (d > 1.0) discard;
          float a = smoothstep(1.0, 0.15, d);
          gl_FragColor = vec4(vColor, a);
        }
      `,
      vertexColors: true,
    });
    astPoints = new THREE.Points(geo, mat);
    astPoints.frustumCulled = false;
    scene.add(astPoints);
  }

  function setComets(orbits, meta) {
    comOrbits = orbits;
    comMeta = meta;
    comCount = meta.count;
    const geo = new THREE.BufferGeometry();
    comPos = new Float32Array(comCount * 3);
    comCol = new Float32Array(comCount * 3);
    comSize = new Float32Array(comCount);
    comVis = new Float32Array(comCount);
    for (let i = 0; i < comCount; i++) {
      comCol[i * 3] = 0.43;
      comCol[i * 3 + 1] = 0.94;
      comCol[i * 3 + 2] = 0.83;
      comSize[i] = 3.2;
      comVis[i] = 0;
    }
    geo.setAttribute("position", new THREE.BufferAttribute(comPos, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(comCol, 3));
    geo.setAttribute("aSize", new THREE.BufferAttribute(comSize, 1));
    geo.setAttribute("aVis", new THREE.BufferAttribute(comVis, 1));
    const mat = astPoints.material.clone();
    comPoints = new THREE.Points(geo, mat);
    comPoints.frustumCulled = false;
    comPoints.visible = false;
    scene.add(comPoints);
  }

  function setSentry(map) {
    sentryByDes = map;
  }

  function applyFilter(pred) {
    if (!astVis) return 0;
    let n = 0;
    for (let i = 0; i < astCount; i++) {
      const on = pred(i) ? 1 : 0;
      astVis[i] = on;
      visibleAst[i] = on;
      if (on) n++;
    }
    astPoints.geometry.attributes.aVis.needsUpdate = true;
    return n;
  }

  function setShow({ asteroids, comets, orbits, labels }) {
    if (asteroids != null) {
      showAsteroids = asteroids;
      if (astPoints) astPoints.visible = asteroids;
    }
    if (comets != null) {
      showComets = comets;
      if (comPoints) comPoints.visible = comets;
    }
    if (orbits != null) orbitsGroup.visible = orbits;
    if (labels != null) {
      for (const l of planetLabels) l.visible = labels;
      sun.label.visible = labels;
    }
  }

  function updatePositions(jd) {
    for (let i = 0; i < planetMeshes.length; i++) {
      propagateElements(planets[i], jd, tmp, 0);
      planetMeshes[i].position.set(tmp[0], tmp[1], tmp[2]);
    }
    if (astOrbits && showAsteroids) {
      for (let i = 0; i < astCount; i++) {
        propagateAsteroid(astOrbits, i, jd, astPos, i * 3);
      }
      astPoints.geometry.attributes.position.needsUpdate = true;
    }
    if (comOrbits && showComets) {
      for (let i = 0; i < comCount; i++) {
        propagateComet(comOrbits, i, jd, comPos, i * 3);
        const r = Math.hypot(comPos[i * 3], comPos[i * 3 + 1], comPos[i * 3 + 2]);
        comVis[i] = r < 60 && Number.isFinite(r) ? 1 : 0;
      }
      comPoints.geometry.attributes.position.needsUpdate = true;
      comPoints.geometry.attributes.aVis.needsUpdate = true;
    }
  }

  function bodyPosition(sel, jd, out = tmp) {
    if (!sel) {
      out[0] = out[1] = out[2] = 0;
      return out;
    }
    if (sel.kind === "planet") {
      propagateElements(planets[sel.index], jd, out, 0);
    } else if (sel.kind === "asteroid") {
      propagateAsteroid(astOrbits, sel.index, jd, out, 0);
    } else if (sel.kind === "comet") {
      propagateComet(comOrbits, sel.index, jd, out, 0);
    } else {
      out[0] = out[1] = out[2] = 0;
    }
    return out;
  }

  function earthPosition(jd, out = [0, 0, 0]) {
    propagateElements(planets[earthIndex], jd, out, 0);
    return out;
  }

  function setSelected(sel, jd) {
    if (!sel) {
      pickSphere.visible = false;
      selectedOrbit.visible = false;
      return;
    }
    let el;
    let color = 0xffffff;
    if (sel.kind === "planet") {
      el = planets[sel.index];
      color = PLANET_COLORS[el.name] ?? 0xffffff;
    } else if (sel.kind === "asteroid") {
      el = asteroidElements(astOrbits, sel.index);
      color = astMeta.pha[sel.index] ? 0xff7a3d : 0xffffff;
    } else if (sel.kind === "comet") {
      el = cometElements(comOrbits, sel.index);
      color = 0x6ef0d4;
    }
    const pts = sampleOrbit(el, 256);
    selectedOrbit.geometry.dispose();
    selectedOrbit.geometry = new THREE.BufferGeometry();
    selectedOrbit.geometry.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    selectedOrbit.material.color.setHex(color);
    selectedOrbit.visible = pts.length > 6;
    bodyPosition(sel, jd, tmp);
    pickSphere.position.set(tmp[0], tmp[1], tmp[2]);
    const r = Math.hypot(tmp[0], tmp[1], tmp[2]) || 1;
    pickSphere.scale.setScalar(Math.max(0.02, r * 0.012));
    pickSphere.visible = true;
  }

  function updateMarker(sel, jd) {
    if (!sel) return;
    bodyPosition(sel, jd, tmp);
    pickSphere.position.set(tmp[0], tmp[1], tmp[2]);
  }

  function follow(sel, jd, enabled) {
    if (!enabled || !sel) {
      controls.target.set(0, 0, 0);
      return;
    }
    bodyPosition(sel, jd, tmp);
    const t = controls.target;
    const dx = tmp[0] - t.x;
    const dy = tmp[1] - t.y;
    const dz = tmp[2] - t.z;
    t.set(tmp[0], tmp[1], tmp[2]);
    camera.position.x += dx;
    camera.position.y += dy;
    camera.position.z += dz;
    pickSphere.position.set(tmp[0], tmp[1], tmp[2]);
  }

  function lookAt(sel, jd) {
    bodyPosition(sel, jd, tmp);
    controls.target.set(tmp[0], tmp[1], tmp[2]);
    const r = Math.max(0.15, Math.hypot(tmp[0], tmp[1], tmp[2]) * 0.35);
    camera.position.set(tmp[0] + r, tmp[1] + r * 0.45, tmp[2] + r);
    controls.update();
  }

  const raycaster = new THREE.Raycaster();
  raycaster.params.Points = { threshold: 0.04 };
  const ndc = new THREE.Vector2();

  function pick(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    ndc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    ndc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(ndc, camera);
    const planetHits = raycaster.intersectObjects(planetMeshes, false);
    if (planetHits.length) {
      return { kind: "planet", index: planetHits[0].object.userData.index };
    }
    if (showComets && comPoints && comPoints.visible) {
      const hits = raycaster.intersectObject(comPoints);
      if (hits.length && comVis[hits[0].index] > 0.5) {
        return { kind: "comet", index: hits[0].index };
      }
    }
    if (showAsteroids && astPoints && astPoints.visible) {
      raycaster.params.Points.threshold = 0.035;
      const hits = raycaster.intersectObject(astPoints);
      for (const h of hits) {
        if (visibleAst[h.index]) return { kind: "asteroid", index: h.index };
      }
    }
    return null;
  }

  function getCameraState() {
    return {
      cx: +camera.position.x.toFixed(4),
      cy: +camera.position.y.toFixed(4),
      cz: +camera.position.z.toFixed(4),
      tx: +controls.target.x.toFixed(4),
      ty: +controls.target.y.toFixed(4),
      tz: +controls.target.z.toFixed(4),
    };
  }

  function setCameraState(s) {
    if (!s) return;
    camera.position.set(s.cx, s.cy, s.cz);
    controls.target.set(s.tx, s.ty, s.tz);
  }

  function render() {
    controls.update();
    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
  }

  return {
    resize,
    setPlanets,
    setAsteroids,
    setComets,
    setSentry,
    applyFilter,
    setShow,
    updatePositions,
    setSelected,
    updateMarker,
    follow,
    lookAt,
    pick,
    bodyPosition,
    earthPosition,
    getCameraState,
    setCameraState,
    render,
    astMeta: () => astMeta,
    comMeta: () => comMeta,
    planets: () => planets,
    sentryByDes: () => sentryByDes,
    LD,
    AU_KM,
    SUN_RADIUS_KM,
  };
}

function makeStars() {
  const n = 3500;
  const pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const r = 180 + Math.random() * 40;
    const th = Math.acos(2 * Math.random() - 1);
    const ph = Math.random() * Math.PI * 2;
    pos[i * 3] = r * Math.sin(th) * Math.cos(ph);
    pos[i * 3 + 1] = r * Math.cos(th);
    pos[i * 3 + 2] = r * Math.sin(th) * Math.sin(ph);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  return new THREE.Points(
    g,
    new THREE.PointsMaterial({ color: 0xbfd0ea, size: 0.35, sizeAttenuation: true })
  );
}

function makeSun() {
  const g = new THREE.Group();
  const r = 0.07;
  const core = new THREE.Mesh(
    new THREE.SphereGeometry(r, 32, 24),
    new THREE.MeshBasicMaterial({ color: 0xffd27a })
  );
  g.add(core);
  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(r * 1.55, 24, 16),
    new THREE.MeshBasicMaterial({ color: 0xff9a3a, transparent: true, opacity: 0.22 })
  );
  g.add(glow);
  const div = document.createElement("div");
  div.className = "label3d sun";
  div.textContent = "Sun";
  const lab = new CSS2DObject(div);
  lab.position.set(0, r * 1.8, 0);
  g.add(lab);
  g.label = lab;
  return g;
}
