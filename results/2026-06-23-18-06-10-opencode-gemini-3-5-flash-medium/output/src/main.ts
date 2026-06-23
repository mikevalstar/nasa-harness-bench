import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { 
  propagateOrbit, 
  getOrbitPathPoints, 
  dateToJulianDate, 
  julianDateToDate,
  formatJulianDate,
  OrbitalElements
} from './orbit.ts';

// --- Data Types ---
interface PreprocessedAsteroids {
  fields: string[];
  data: any[][];
}

interface PreprocessedComets {
  fields: string[];
  data: any[][];
}

interface SentryRisk {
  ip: number | null;
  ps_cum: number | null;
  ts_max: number | null;
  range: string;
  n_imp: number | null;
  diameter: number | null;
  h: number | null;
  v_inf: number | null;
}

interface SentryMap {
  [des: string]: SentryRisk;
}

interface CloseApproach {
  jd: number;
  cd: string;
  dist: number;
  v_rel: number;
  h: number;
}

interface CloseApproachesMap {
  [des: string]: any[][]; // [jd, cd, dist, v_rel, h][]
}

// --- Global App State ---
let rawAsteroids: OrbitalElements[] = [];
let rawComets: OrbitalElements[] = [];
let sentryMap: SentryMap = {};
let closeApproachesMap: CloseApproachesMap = {};
let planets: OrbitalElements[] = [];

// Filtered sets active in simulation
let activeAsteroids: OrbitalElements[] = [];
let activeComets: OrbitalElements[] = [];

let selectedBody: OrbitalElements | null = null;
let selectedMesh: THREE.Object3D | null = null;
let selectedOrbitLine: THREE.Line | null = null;

let currentJD = dateToJulianDate(new Date()); // Default to today
const startJD = 2451545.0; // J2000 (Year 2000)
const endJD = 2469807.0;   // Year 2050
let isPlaying = true;
let simSpeed = 10.0; // Days per real-second
let lastFrameTime = 0;
let isLockedOnTarget = false;
let lastSelectedPosition = new THREE.Vector3();

// --- Three.js Globals ---
let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let controls: OrbitControls;
let raycaster: THREE.Raycaster;
const mouse = new THREE.Vector2();

// Orbit particle systems
let standardAsteroidsPoints: THREE.Points | null = null;
let phaAsteroidsPoints: THREE.Points | null = null;
let cometsPoints: THREE.Points | null = null;
let sentryAsteroidsPoints: THREE.Points | null = null;

// Planets and labels representation
const planetMeshes: { [name: string]: THREE.Mesh } = {};
const planetLabels: { [name: string]: THREE.Sprite } = {};
let planetOrbitsGroup: THREE.Group;

// Raycastable list
let raycastablePoints: THREE.Points[] = [];

// --- DOM Elements ---
const loaderStatus = document.getElementById('loader-status') as HTMLDivElement;
const loaderBar = document.getElementById('loader-bar') as HTMLDivElement;
const loaderScreen = document.getElementById('loader') as HTMLDivElement;

const displayDate = document.getElementById('display-date') as HTMLDivElement;
const displayJd = document.getElementById('display-jd') as HTMLDivElement;
const displaySpeed = document.getElementById('display-speed') as HTMLDivElement;

const btnPlayPause = document.getElementById('btn-play-pause') as HTMLButtonElement;
const btnPrevDay = document.getElementById('btn-prev-day') as HTMLButtonElement;
const btnNextDay = document.getElementById('btn-next-day') as HTMLButtonElement;
const btnToday = document.getElementById('btn-today') as HTMLButtonElement;
const speedSlider = document.getElementById('sim-speed') as HTMLInputElement;
const timeScrubber = document.getElementById('time-scrubber') as HTMLInputElement;

// Sidebar & Tab controls
const tabSearch = document.getElementById('tab-search') as HTMLDivElement;
const tabObjects = document.getElementById('tab-objects') as HTMLDivElement;
const searchInput = document.getElementById('search') as HTMLInputElement;
const filterHazard = document.getElementById('filter-hazard') as HTMLSelectElement;
const filterClass = document.getElementById('filter-class') as HTMLSelectElement;
const filterMoid = document.getElementById('filter-moid') as HTMLInputElement;
const filterMagnitude = document.getElementById('filter-magnitude') as HTMLInputElement;
const sortBy = document.getElementById('sort-by') as HTMLSelectElement;
const showOrbitsCheck = document.getElementById('show-orbits') as HTMLInputElement;
const showLabelsCheck = document.getElementById('show-labels') as HTMLInputElement;
const limitAsteroidsCheck = document.getElementById('limit-asteroids') as HTMLInputElement;
const resetFiltersBtn = document.getElementById('reset-filters') as HTMLButtonElement;
const objectListContainer = document.getElementById('object-list-container') as HTMLDivElement;
const filteredCountSpan = document.getElementById('filtered-count') as HTMLSpanElement;

// Detail Panel
const detailsPanel = document.getElementById('details') as HTMLDivElement;
const detCloseBtn = document.getElementById('det-close') as HTMLButtonElement;
const detName = document.getElementById('det-name') as HTMLHeadingElement;
const detClass = document.getElementById('det-class') as HTMLDivElement;
const detDiameter = document.getElementById('det-diameter') as HTMLSpanElement;
const detMagnitude = document.getElementById('det-magnitude') as HTMLSpanElement;
const detAlbedo = document.getElementById('det-albedo') as HTMLSpanElement;
const detRotation = document.getElementById('det-rotation') as HTMLSpanElement;
const detSpectral = document.getElementById('det-spectral') as HTMLSpanElement;
const detObserved = document.getElementById('det-observed') as HTMLSpanElement;
const detA = document.getElementById('det-a') as HTMLSpanElement;
const detE = document.getElementById('det-e') as HTMLSpanElement;
const detI = document.getElementById('det-i') as HTMLSpanElement;
const detQ = document.getElementById('det-q') as HTMLSpanElement;
const detAd = document.getElementById('det-ad') as HTMLSpanElement;
const detPeriod = document.getElementById('det-period') as HTMLSpanElement;
const detMoid = document.getElementById('det-moid') as HTMLSpanElement;
const detCaList = document.getElementById('det-ca-list') as HTMLDivElement;

const sentryRiskSection = document.getElementById('sentry-risk-section') as HTMLDivElement;
const detRiskProb = document.getElementById('det-risk-prob') as HTMLSpanElement;
const detRiskTorino = document.getElementById('det-risk-torino') as HTMLSpanElement;
const detRiskPalermo = document.getElementById('det-risk-palermo') as HTMLSpanElement;
const detRiskWindow = document.getElementById('det-risk-window') as HTMLSpanElement;
const detRiskImpacts = document.getElementById('det-risk-impacts') as HTMLSpanElement;
const detRiskVrel = document.getElementById('det-risk-vrel') as HTMLSpanElement;

const btnLock = document.getElementById('btn-lock') as HTMLButtonElement;
const btnShare = document.getElementById('btn-share') as HTMLButtonElement;

const statAsteroids = document.getElementById('stat-asteroids') as HTMLSpanElement;
const statComets = document.getElementById('stat-comets') as HTMLSpanElement;
const statSentry = document.getElementById('stat-sentry') as HTMLSpanElement;

// --- Helper: Text Sprite Label Generator ---
function createTextSprite(text: string, color: string): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0)';
    ctx.fillRect(0, 0, 128, 32);
    ctx.font = 'Bold 15px "Inter", "JetBrains Mono", monospace';
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 64, 16);
  }
  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(1.4, 0.35, 1);
  return sprite;
}

// --- Initialize 3D Environment ---
function init3D() {
  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x05070c, 0.015);

  const container = document.getElementById('canvas-container')!;
  const width = container.clientWidth;
  const height = container.clientHeight;

  camera = new THREE.PerspectiveCamera(50, width / height, 0.01, 200);
  camera.position.set(0, -5, 5); // Angle looking down at solar system

  renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x05070c, 1);
  container.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.maxDistance = 60;
  controls.minDistance = 0.1;

  raycaster = new THREE.Raycaster();
  raycaster.params.Points.threshold = 0.06; // Crucial for clicking small particle points!

  // Lights
  const ambientLight = new THREE.AmbientLight(0x1e293b, 1.2);
  scene.add(ambientLight);

  const sunLight = new THREE.PointLight(0xfff7ed, 4.0, 50, 0.5); // Warm point light representing Sun
  scene.add(sunLight);

  // Add the Sun at center
  const sunGeometry = new THREE.SphereGeometry(0.12, 32, 32);
  const sunMaterial = new THREE.MeshBasicMaterial({
    color: 0xf59e0b, // glowing yellow-orange
    toneMapped: false
  });
  const sunMesh = new THREE.Mesh(sunGeometry, sunMaterial);
  scene.add(sunMesh);

  // Decorative Solar Halo/Glow
  const glowMaterial = new THREE.SpriteMaterial({
    map: createGlowTexture(0xf59e0b),
    transparent: true,
    blending: THREE.AdditiveBlending,
    opacity: 0.8
  });
  const sunGlow = new THREE.Sprite(glowMaterial);
  sunGlow.scale.set(0.6, 0.6, 1);
  scene.add(sunGlow);

  planetOrbitsGroup = new THREE.Group();
  scene.add(planetOrbitsGroup);

  window.addEventListener('resize', onWindowResize);
}

// Simple procedural glow texture for Sun and selected object markers
function createGlowTexture(colorHex: number): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  const colorStr = '#' + colorHex.toString(16).padStart(6, '0');
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.2, colorStr);
  gradient.addColorStop(0.5, 'rgba(' + parseInt(colorStr.slice(1,3), 16) + ',' + parseInt(colorStr.slice(3,5), 16) + ',' + parseInt(colorStr.slice(5,7), 16) + ', 0.3)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(canvas);
}

function onWindowResize() {
  const container = document.getElementById('canvas-container')!;
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
}

// --- Data Fetching & Progress Loader ---
async function loadData() {
  try {
    updateProgress(10, 'Fetching Solar System Elements...');
    const planetsRes = await fetch('./data/planets.json');
    planets = await planetsRes.json();
    
    updateProgress(25, 'Loading Asteroids Dataset (~4.5MB)...');
    const astRes = await fetch('./data/asteroids_opt.json');
    const astOpt: PreprocessedAsteroids = await astRes.json();
    rawAsteroids = inflateAsteroids(astOpt);

    updateProgress(55, 'Loading Comets Dataset...');
    const cmtRes = await fetch('./data/comets_opt.json');
    const cmtOpt: PreprocessedComets = await cmtRes.json();
    rawComets = inflateComets(cmtOpt);

    updateProgress(75, 'Loading Impact Sentry Information...');
    const sentryRes = await fetch('./data/sentry_opt.json');
    sentryMap = await sentryRes.json();

    updateProgress(90, 'Loading Earth Close Approaches Map...');
    const caRes = await fetch('./data/close_approaches_opt.json');
    closeApproachesMap = await caRes.json();

    updateProgress(100, 'All Systems Loaded!');
    setTimeout(() => {
      loaderScreen.classList.add('fade-out');
      // Set initial state from Deep Link if present
      parseDeepLink();
      initializeApp();
    }, 400);

  } catch (err) {
    console.error('Error loading data:', err);
    loaderStatus.innerText = 'Failed to load system data. Ensure server is active.';
    loaderStatus.style.color = '#ef4444';
  }
}

function updateProgress(percent: number, text: string) {
  loaderBar.style.width = `${percent}%`;
  loaderStatus.innerText = text;
}

// Convert optimized array of arrays back into easily-readable objects
function inflateAsteroids(astOpt: PreprocessedAsteroids): OrbitalElements[] {
  const fields = astOpt.fields;
  return astOpt.data.map(arr => {
    const obj: any = {};
    fields.forEach((field, i) => {
      obj[field] = arr[i];
    });
    // Cast neo and pha back to booleans
    obj.neo = obj.neo === 1;
    obj.pha = obj.pha === 1;
    return obj as OrbitalElements;
  });
}

function inflateComets(cmtOpt: PreprocessedComets): OrbitalElements[] {
  const fields = cmtOpt.fields;
  return cmtOpt.data.map(arr => {
    const obj: any = {};
    fields.forEach((field, i) => {
      obj[field] = arr[i];
    });
    return obj as OrbitalElements;
  });
}

// --- Application Setups ---
function initializeApp() {
  // Update dashboard counters
  statAsteroids.innerText = rawAsteroids.length.toLocaleString();
  statComets.innerText = rawComets.length.toLocaleString();
  statSentry.innerText = Object.keys(sentryMap).length.toLocaleString();

  // Draw permanent planet orbits and spawn planet meshes
  setupPlanets();

  // Run filters once to build initial asteroid/comet particle system representations
  applyFilters();

  // Setup Event Listeners
  setupUIEventListeners();

  // Start Animation Loop
  requestAnimationFrame(animate);
}

// Setup Planet objects in the scene
function setupPlanets() {
  planets.forEach(p => {
    // Determine planet color
    let colorHex = 0xffffff;
    switch (p.name) {
      case 'Mercury': colorHex = 0x94a3b8; break;
      case 'Venus': colorHex = 0xf59e0b; break;
      case 'Earth': colorHex = 0x38bdf8; break;
      case 'Mars': colorHex = 0xef4444; break;
      case 'Jupiter': colorHex = 0xf97316; break;
      case 'Saturn': colorHex = 0xeab308; break;
      case 'Uranus': colorHex = 0xa5f3fc; break;
      case 'Neptune': colorHex = 0x1d4ed8; break;
    }

    // Draw Planet Orbit Line
    const pathPoints = getOrbitPathPoints(p, 180);
    const orbitGeometry = new THREE.BufferGeometry().setFromPoints(pathPoints);
    const orbitMaterial = new THREE.LineBasicMaterial({
      color: colorHex,
      transparent: true,
      opacity: 0.18
    });
    const orbitLine = new THREE.LineLoop(orbitGeometry, orbitMaterial);
    planetOrbitsGroup.add(orbitLine);

    // Create Planet Sphere
    // Set absolute sizes exaggerated but retaining correct ordering: Mercury < Mars < Earth ≈ Venus < Neptune ≈ Uranus < Saturn < Jupiter
    let size = 0.015;
    switch (p.name) {
      case 'Mercury': size = 0.018; break;
      case 'Mars': size = 0.022; break;
      case 'Venus': size = 0.028; break;
      case 'Earth': size = 0.030; break;
      case 'Uranus': size = 0.045; break;
      case 'Neptune': size = 0.044; break;
      case 'Saturn': size = 0.055; break;
      case 'Jupiter': size = 0.070; break;
    }

    const planetGeo = new THREE.SphereGeometry(size, 16, 16);
    const planetMat = new THREE.MeshPhongMaterial({
      color: colorHex,
      emissive: colorHex,
      emissiveIntensity: 0.15,
      specular: 0x111111,
      shininess: 30
    });
    const planetMesh = new THREE.Mesh(planetGeo, planetMat);
    scene.add(planetMesh);
    planetMeshes[p.name!] = planetMesh;

    // Attach custom data to planet mesh for raycasting click
    planetMesh.userData = { body: p, type: 'planet' };

    // Saturn's Rings (gorgeous extra touch!)
    if (p.name === 'Saturn') {
      const ringGeo = new THREE.RingGeometry(size * 1.5, size * 2.8, 30);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x94a3b8,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.4
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = Math.PI / 2.4; // Tilt rings
      planetMesh.add(ringMesh);
    }

    // Planet Label (Text Sprite Billboard)
    const labelSprite = createTextSprite(p.name!, '#' + colorHex.toString(16).padStart(6,'0'));
    scene.add(labelSprite);
    planetLabels[p.name!] = labelSprite;
  });
}

// Rebuilds the Points particle systems based on active filtered asteroids/comets
function buildParticleSystems() {
  // 1. Clear old particle systems
  if (standardAsteroidsPoints) { scene.remove(standardAsteroidsPoints); raycastablePoints = raycastablePoints.filter(p => p !== standardAsteroidsPoints); }
  if (phaAsteroidsPoints) { scene.remove(phaAsteroidsPoints); raycastablePoints = raycastablePoints.filter(p => p !== phaAsteroidsPoints); }
  if (cometsPoints) { scene.remove(cometsPoints); raycastablePoints = raycastablePoints.filter(p => p !== cometsPoints); }
  if (sentryAsteroidsPoints) { scene.remove(sentryAsteroidsPoints); raycastablePoints = raycastablePoints.filter(p => p !== sentryAsteroidsPoints); }

  // Separate active filtered bodies into category arrays
  const standardList: OrbitalElements[] = [];
  const phaList: OrbitalElements[] = [];
  const sentryList: OrbitalElements[] = [];

  activeAsteroids.forEach(ast => {
    if (sentryMap[ast.pdes]) {
      sentryList.push(ast);
    } else if (ast.pha) {
      phaList.push(ast);
    } else {
      standardList.push(ast);
    }
  });

  // Re-map the active arrays back so raycasting maps correctly to indices
  // standardList corresponds exactly to standardAsteroidsPoints points
  // phaList to phaAsteroidsPoints
  // activeComets to cometsPoints
  // sentryList to sentryAsteroidsPoints

  // Build Standard Asteroids Points (fca5a5)
  standardAsteroidsPoints = createPointsSystem(standardList, 0xfca5a5, 0.015);
  standardAsteroidsPoints.userData = { list: standardList, type: 'standard' };
  scene.add(standardAsteroidsPoints);
  raycastablePoints.push(standardAsteroidsPoints);

  // Build PHA Asteroids Points (f43f5e)
  phaAsteroidsPoints = createPointsSystem(phaList, 0xf43f5e, 0.018);
  phaAsteroidsPoints.userData = { list: phaList, type: 'pha' };
  scene.add(phaAsteroidsPoints);
  raycastablePoints.push(phaAsteroidsPoints);

  // Build Sentry Asteroids Points (eab308)
  sentryAsteroidsPoints = createPointsSystem(sentryList, 0xeab308, 0.018);
  sentryAsteroidsPoints.userData = { list: sentryList, type: 'sentry' };
  scene.add(sentryAsteroidsPoints);
  raycastablePoints.push(sentryAsteroidsPoints);

  // Build Comets Points (22c55e)
  cometsPoints = createPointsSystem(activeComets, 0x22c55e, 0.024);
  cometsPoints.userData = { list: activeComets, type: 'comet' };
  scene.add(cometsPoints);
  raycastablePoints.push(cometsPoints);

  // Fast initial propagation so particles spawn at correct positions instantly!
  propagateParticles();
}

function createPointsSystem(list: OrbitalElements[], colorHex: number, sizeValue: number): THREE.Points {
  const count = list.length;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  // Custom circular point texture for cleaner circles instead of squares!
  const pointMat = new THREE.PointsMaterial({
    color: colorHex,
    size: sizeValue,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.85,
    map: createGlowTexture(colorHex),
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  return new THREE.Points(geometry, pointMat);
}

// Fast update of points position attributes
function propagateParticles() {
  // Update standard asteroids
  if (standardAsteroidsPoints) {
    const list = standardAsteroidsPoints.userData.list as OrbitalElements[];
    const positions = standardAsteroidsPoints.geometry.attributes.position.array as Float32Array;
    for (let idx = 0; idx < list.length; idx++) {
      const pos = propagateOrbit(list[idx], currentJD);
      positions[3 * idx] = pos.x;
      positions[3 * idx + 1] = pos.y;
      positions[3 * idx + 2] = pos.z;
    }
    standardAsteroidsPoints.geometry.attributes.position.needsUpdate = true;
  }

  // Update PHAs
  if (phaAsteroidsPoints) {
    const list = phaAsteroidsPoints.userData.list as OrbitalElements[];
    const positions = phaAsteroidsPoints.geometry.attributes.position.array as Float32Array;
    for (let idx = 0; idx < list.length; idx++) {
      const pos = propagateOrbit(list[idx], currentJD);
      positions[3 * idx] = pos.x;
      positions[3 * idx + 1] = pos.y;
      positions[3 * idx + 2] = pos.z;
    }
    phaAsteroidsPoints.geometry.attributes.position.needsUpdate = true;
  }

  // Update Sentry Risks
  if (sentryAsteroidsPoints) {
    const list = sentryAsteroidsPoints.userData.list as OrbitalElements[];
    const positions = sentryAsteroidsPoints.geometry.attributes.position.array as Float32Array;
    for (let idx = 0; idx < list.length; idx++) {
      const pos = propagateOrbit(list[idx], currentJD);
      positions[3 * idx] = pos.x;
      positions[3 * idx + 1] = pos.y;
      positions[3 * idx + 2] = pos.z;
    }
    sentryAsteroidsPoints.geometry.attributes.position.needsUpdate = true;
  }

  // Update Comets
  if (cometsPoints) {
    const list = cometsPoints.userData.list as OrbitalElements[];
    const positions = cometsPoints.geometry.attributes.position.array as Float32Array;
    for (let idx = 0; idx < list.length; idx++) {
      const pos = propagateOrbit(list[idx], currentJD);
      positions[3 * idx] = pos.x;
      positions[3 * idx + 1] = pos.y;
      positions[3 * idx + 2] = pos.z;
    }
    cometsPoints.geometry.attributes.position.needsUpdate = true;
  }
}

// --- Orbital Math Filters and Search Handler ---
function applyFilters() {
  const query = searchInput.value.toLowerCase().trim();
  const hazardVal = filterHazard.value;
  const classVal = filterClass.value;
  const moidMax = parseFloat(filterMoid.value);
  const magMax = parseFloat(filterMagnitude.value);

  // 1. Filter Asteroids
  let filteredAsteroids = rawAsteroids.filter(ast => {
    // Search query match
    if (query) {
      const pdesMatch = ast.pdes && ast.pdes.toLowerCase().includes(query);
      const nameMatch = ast.name && ast.name.toLowerCase().includes(query);
      const fullMatch = ast.full_name && ast.full_name.toLowerCase().includes(query);
      if (!pdesMatch && !nameMatch && !fullMatch) return false;
    }

    // Sentry / Hazard filter
    if (hazardVal === 'pha' && !ast.pha) return false;
    if (hazardVal === 'non-pha' && ast.pha) return false;
    if (hazardVal === 'sentry' && !sentryMap[ast.pdes]) return false;

    // Class filter (AMO, APO, ATE, IEO)
    if (classVal !== 'all' && classVal !== 'comets' && ast.class !== classVal) return false;
    if (classVal === 'comets') return false; // If comets only, asteroids is empty

    // Max MOID filter
    if (ast.moid !== null && ast.moid > moidMax) return false;

    // Max Abs. Magnitude H
    if (ast.H !== null && ast.H > magMax) return false;

    return true;
  });

  // 2. Filter Comets
  let filteredComets = rawComets.filter(cmt => {
    // Comets only matches if "comets" or "all" class is selected
    if (classVal !== 'all' && classVal !== 'comets') return false;
    if (hazardVal === 'pha' || hazardVal === 'sentry') return false; // Sentry and PHA don't apply to comets in our data

    if (query) {
      const pdesMatch = cmt.pdes && cmt.pdes.toLowerCase().includes(query);
      const nameMatch = cmt.name && cmt.name.toLowerCase().includes(query);
      const fullMatch = cmt.full_name && cmt.full_name.toLowerCase().includes(query);
      if (!pdesMatch && !nameMatch && !fullMatch) return false;
    }

    if (cmt.diameter !== null && hazardVal === 'non-pha') return true; // generic match

    return true;
  });

  // 3. Sort Results
  const sortVal = sortBy.value;
  const sortFunc = (a: OrbitalElements, b: OrbitalElements) => {
    if (sortVal === 'moid') {
      const moidA = a.moid !== null ? a.moid : 999;
      const moidB = b.moid !== null ? b.moid : 999;
      return moidA - moidB;
    }
    if (sortVal === 'size') {
      const sizeA = a.diameter !== null ? a.diameter : (a.H ? 100 / a.H : 0);
      const sizeB = b.diameter !== null ? b.diameter : (b.H ? 100 / b.H : 0);
      return sizeB - sizeA; // Descending size
    }
    if (sortVal === 'e') {
      return b.e - a.e; // Descending eccentricity
    }
    if (sortVal === 'i') {
      return b.i - a.i; // Descending inclination
    }
    // Default alphabetically by designation
    return a.pdes.localeCompare(b.pdes);
  };

  filteredAsteroids.sort(sortFunc);
  filteredComets.sort(sortFunc);

  const totalFilteredCount = filteredAsteroids.length + filteredComets.length;
  filteredCountSpan.innerText = totalFilteredCount.toLocaleString();

  // 4. Smooth performance constraint: Limit the points rendered if checked
  if (limitAsteroidsCheck.checked) {
    activeAsteroids = filteredAsteroids.slice(0, 1800);
    activeComets = filteredComets.slice(0, 200);
  } else {
    activeAsteroids = filteredAsteroids;
    activeComets = filteredComets;
  }

  // 5. Re-render the objects list DOM panel (Only first 300 to keep UI ultra responsive!)
  renderObjectListDOM(filteredAsteroids.slice(0, 200).concat(filteredComets.slice(0, 100)));

  // 6. Rebuild 3D Particle systems with new buffer sizes
  buildParticleSystems();
}

// Populates the HTML sidebar list
function renderObjectListDOM(list: OrbitalElements[]) {
  objectListContainer.innerHTML = '';
  
  if (list.length === 0) {
    objectListContainer.innerHTML = '<div style="padding: 20px; color: var(--text-secondary); text-align: center; font-size: 0.8rem;">No objects match the filters.</div>';
    return;
  }

  list.forEach(item => {
    const isComet = item.class.includes('Tc') || item.class.includes('Fc') || item.class.includes('HTC') || item.class.includes('JFC') || item.class.includes('JFc');
    const isSentry = !!sentryMap[item.pdes];
    const isPha = item.pha;

    const div = document.createElement('div');
    div.className = 'object-item';
    if (selectedBody && selectedBody.pdes === item.pdes) {
      div.classList.add('selected');
    }

    let badgetHtml = '';
    if (isSentry) {
      badgetHtml = '<span class="badge badge-sentry">Sentry</span>';
    } else if (isPha) {
      badgetHtml = '<span class="badge badge-pha">PHA</span>';
    } else if (isComet) {
      badgetHtml = '<span class="badge badge-comet">Comet</span>';
    }

    const displayName = item.name ? `${item.pdes} ${item.name}` : item.full_name;

    div.innerHTML = `
      <div class="object-item-name" title="${item.full_name}">${displayName}</div>
      <div class="object-item-meta">
        ${badgetHtml}
        <span>e:${item.e.toFixed(2)}</span>
        <span>i:${item.i.toFixed(0)}°</span>
      </div>
    `;

    div.addEventListener('click', () => {
      selectObject(item);
    });

    objectListContainer.appendChild(div);
  });
}

// Selects an object, draws its highlighted orbit path, and opens Detail panel
async function selectObject(body: OrbitalElements) {
  selectedBody = body;
  isLockedOnTarget = false;
  btnLock.classList.remove('active');
  btnLock.innerHTML = '<span class="icon">👁</span> Lock & Follow Camera';

  // Highlight selection in the sidebar list DOM
  const items = objectListContainer.querySelectorAll('.object-item');
  items.forEach((item, i) => {
    const listIndex = i;
    item.classList.remove('selected');
    // If name matches, highlight it
    const nameEl = item.querySelector('.object-item-name');
    if (nameEl && (nameEl.textContent?.includes(body.pdes) || nameEl.textContent?.includes(body.name || '___NONEXISTENT___'))) {
      item.classList.add('selected');
    }
  });

  // 1. Draw highlighted Orbit path in scene
  if (selectedOrbitLine) scene.remove(selectedOrbitLine);

  if (showOrbitsCheck.checked) {
    const orbitPoints = getOrbitPathPoints(body, 240);
    const orbitGeometry = new THREE.BufferGeometry().setFromPoints(orbitPoints);
    
    let orbitColor = 0x38bdf8; // Sky blue highlight for selection
    if (body.pha) orbitColor = 0xf43f5e;
    else if (sentryMap[body.pdes]) orbitColor = 0xeab308;
    else if (body.class.includes('c') || body.class.includes('C')) orbitColor = 0x22c55e;

    const orbitMaterial = new THREE.LineBasicMaterial({
      color: orbitColor,
      linewidth: 2,
      transparent: true,
      opacity: 0.8
    });
    
    selectedOrbitLine = new THREE.Line(orbitGeometry, orbitMaterial);
    scene.add(selectedOrbitLine);
  }

  // 2. Open and fill Detail Panel
  detName.innerText = body.name ? `${body.pdes} ${body.name}` : body.full_name;
  detClass.innerText = `${body.class} Class Object`;

  detDiameter.innerText = body.diameter !== null ? `${body.diameter.toFixed(2)} km` : 'Unknown';
  detMagnitude.innerText = body.H !== null ? body.H.toFixed(2) : 'Unknown';
  
  // Custom parsing for other optional parameters which can be null in the dataset
  const rawAny = body as any;
  detAlbedo.innerText = rawAny.albedo !== undefined && rawAny.albedo !== null ? rawAny.albedo.toFixed(3) : 'Unknown';
  detRotation.innerText = rawAny.rot_per !== undefined && rawAny.rot_per !== null ? `${rawAny.rot_per.toFixed(2)} hours` : 'Unknown';
  
  let spec = 'Unknown';
  if (rawAny.spec_B) spec = `${rawAny.spec_B} (SMASSII)`;
  else if (rawAny.spec_T) spec = `${rawAny.spec_T} (Tholen)`;
  detSpectral.innerText = spec;

  detObserved.innerText = rawAny.first_obs || 'Unknown';

  detA.innerText = body.a !== null ? `${body.a.toFixed(3)} AU` : 'Parabolic';
  detE.innerText = body.e.toFixed(4);
  detI.innerText = `${body.i.toFixed(2)}°`;
  
  const qVal = body.q || (body.a ? body.a * (1 - body.e) : null);
  detQ.innerText = qVal ? `${qVal.toFixed(3)} AU` : 'Unknown';
  
  const adVal = body.per ? (body.a ? body.a * (1 + body.e) : null) : null;
  detAd.innerText = adVal ? `${adVal.toFixed(3)} AU` : 'N/A';
  detPeriod.innerText = body.per ? `${Math.round(body.per)} days` : 'N/A';
  detMoid.innerText = body.moid !== null ? `${body.moid.toFixed(4)} AU` : 'Unknown';

  // 3. Handle Sentry Impact risk display
  const risk = sentryMap[body.pdes];
  if (risk) {
    sentryRiskSection.style.display = 'block';
    
    // Format probability nicely (e.g. 1 in 450000)
    let probStr = risk.ip.toExponential(2);
    if (risk.ip > 0) {
      const inv = Math.round(1 / risk.ip);
      probStr = `1 in ${inv.toLocaleString()}`;
    }
    detRiskProb.innerText = probStr;
    detRiskTorino.innerText = risk.ts_max !== null ? risk.ts_max.toString() : '0';
    detRiskPalermo.innerText = risk.ps_cum !== null ? risk.ps_cum.toFixed(2) : 'N/A';
    detRiskWindow.innerText = risk.range || 'N/A';
    detRiskImpacts.innerText = risk.n_imp !== null ? risk.n_imp.toString() : 'N/A';
    detRiskVrel.innerText = risk.v_inf !== null ? `${risk.v_inf.toFixed(1)} km/s` : 'Unknown';
  } else {
    sentryRiskSection.style.display = 'none';
  }

  // 4. Render Close Approaches list
  renderCloseApproaches(body.pdes);

  detailsPanel.classList.add('open');
  updateDeepLink();
}

// Draw the Close Approaches history/future list
function renderCloseApproaches(pdes: string) {
  detCaList.innerHTML = '';
  const list = closeApproachesMap[pdes];
  
  if (!list || list.length === 0) {
    detCaList.innerHTML = '<div style="padding: 10px; color: var(--text-secondary); text-align: center; font-size: 0.75rem;">No close approach events found.</div>';
    return;
  }

  // Display closest 10 approaches relative to current simulation JD
  const sortedList = [...list].sort((a, b) => {
    return Math.abs(a[0] - currentJD) - Math.abs(b[0] - currentJD);
  });

  const slice = sortedList.slice(0, 10).sort((a, b) => a[0] - b[0]); // Chronological order of closest ones

  slice.forEach(ca => {
    // ca represents [jd, cd, dist, v_rel, h]
    const jdVal = ca[0];
    const cdVal = ca[1];
    const distVal = ca[2];
    const vrelVal = ca[3];

    const distInLd = distVal / 0.002569; // 1 Lunar Distance ≈ 0.002569 AU

    const div = document.createElement('div');
    div.className = 'ca-item';
    
    // Check if future or past relative to simulation time
    const isFuture = jdVal > currentJD;
    const timeLabel = isFuture ? '🟢 Upcoming' : '⚫ Past';

    div.innerHTML = `
      <div class="ca-date" title="Julian Date: ${jdVal.toFixed(2)}">
        <span style="font-size: 0.65rem; display:block; color:var(--text-secondary);">${timeLabel}</span>
        ${cdVal.split(' ')[0]} <!-- Only grab date -->
      </div>
      <div class="ca-dist">
        <div class="ca-dist-ld">${distInLd.toFixed(1)} LD</div>
        <div style="font-size: 0.65rem; color:var(--text-secondary);">${distVal.toFixed(4)} AU | ${vrelVal.toFixed(1)} km/s</div>
      </div>
    `;

    detCaList.appendChild(div);
  });
}

function clearSelection() {
  selectedBody = null;
  if (selectedOrbitLine) {
    scene.remove(selectedOrbitLine);
    selectedOrbitLine = null;
  }
  detailsPanel.classList.remove('open');
  isLockedOnTarget = false;
  btnLock.classList.remove('active');
  
  // Clear sidebar select highlight
  const items = objectListContainer.querySelectorAll('.object-item');
  items.forEach(item => item.classList.remove('selected'));

  updateDeepLink();
}

// --- Event Listeners Setups ---
function setupUIEventListeners() {
  // Raycast picker (click on Canvas to select object)
  const container = document.getElementById('canvas-container')!;
  container.addEventListener('click', onCanvasClick);

  // Tab buttons
  const tabs = document.querySelectorAll('.tab-btn');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const targetId = tab.getAttribute('data-tab')!;
      if (targetId === 'tab-search') {
        tabSearch.classList.add('active');
        tabObjects.classList.remove('active');
      } else {
        tabSearch.classList.remove('active');
        tabObjects.classList.add('active');
      }
    });
  });

  // Filter triggers
  searchInput.addEventListener('input', applyFilters);
  filterHazard.addEventListener('change', applyFilters);
  filterClass.addEventListener('change', applyFilters);
  filterMoid.addEventListener('input', () => {
    document.getElementById('val-moid')!.innerText = `${parseFloat(filterMoid.value).toFixed(2)} AU`;
    applyFilters();
  });
  filterMagnitude.addEventListener('input', () => {
    document.getElementById('val-magnitude')!.innerText = filterMagnitude.value;
    applyFilters();
  });
  sortBy.addEventListener('change', applyFilters);
  resetFiltersBtn.addEventListener('click', () => {
    searchInput.value = '';
    filterHazard.value = 'all';
    filterClass.value = 'all';
    filterMoid.value = '1.0';
    document.getElementById('val-moid')!.innerText = '1.0 AU';
    filterMagnitude.value = '30';
    document.getElementById('val-magnitude')!.innerText = '30 (Smaller)';
    sortBy.value = 'name';
    applyFilters();
  });

  // Display toggles
  showOrbitsCheck.addEventListener('change', () => {
    planetOrbitsGroup.visible = showOrbitsCheck.checked;
    if (selectedBody) {
      // Refresh orbit path
      selectObject(selectedBody);
    }
  });

  showLabelsCheck.addEventListener('change', () => {
    Object.values(planetLabels).forEach(label => {
      label.visible = showLabelsCheck.checked;
    });
  });

  limitAsteroidsCheck.addEventListener('change', applyFilters);

  // Playback timeline events
  btnPlayPause.addEventListener('click', () => {
    isPlaying = !isPlaying;
    if (isPlaying) {
      btnPlayPause.innerText = '⏸';
      btnPlayPause.classList.add('active');
    } else {
      btnPlayPause.innerText = '▶';
      btnPlayPause.classList.remove('active');
    }
  });

  btnPrevDay.addEventListener('click', () => {
    isPlaying = false;
    btnPlayPause.innerText = '▶';
    btnPlayPause.classList.remove('active');
    currentJD -= 1.0;
    updateTimelineUI();
  });

  btnNextDay.addEventListener('click', () => {
    isPlaying = false;
    btnPlayPause.innerText = '▶';
    btnPlayPause.classList.remove('active');
    currentJD += 1.0;
    updateTimelineUI();
  });

  btnToday.addEventListener('click', () => {
    currentJD = dateToJulianDate(new Date());
    updateTimelineUI();
  });

  speedSlider.addEventListener('input', () => {
    simSpeed = parseFloat(speedSlider.value);
    displaySpeed.innerText = `${simSpeed.toFixed(0)} d/s`;
  });

  timeScrubber.addEventListener('input', () => {
    isPlaying = false;
    btnPlayPause.innerText = '▶';
    btnPlayPause.classList.remove('active');
    currentJD = parseInt(timeScrubber.value);
    updateTimelineUI();
  });

  detCloseBtn.addEventListener('click', clearSelection);

  // Lock and Follow Camera Toggle
  btnLock.addEventListener('click', () => {
    isLockedOnTarget = !isLockedOnTarget;
    if (isLockedOnTarget) {
      btnLock.classList.add('active');
      btnLock.innerHTML = '<span class="icon">🔒</span> Camera Locked';
      // Store current target position for relative tracking
      if (selectedBody) {
        if (selectedBody.class === 'planet') {
          lastSelectedPosition.copy(planetMeshes[selectedBody.name!].position);
        } else {
          lastSelectedPosition.copy(propagateOrbit(selectedBody, currentJD));
        }
      }
    } else {
      btnLock.classList.remove('active');
      btnLock.innerHTML = '<span class="icon">👁</span> Lock & Follow Camera';
    }
  });

  // Deep Link Copy Clipboard
  btnShare.addEventListener('click', () => {
    updateDeepLink();
    navigator.clipboard.writeText(window.location.href).then(() => {
      const originalText = btnShare.innerHTML;
      btnShare.innerHTML = '<span class="icon">✔</span> Link Copied!';
      btnShare.classList.add('active');
      setTimeout(() => {
        btnShare.innerHTML = originalText;
        btnShare.classList.remove('active');
      }, 1500);
    });
  });

  // Esc key clear selection
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      clearSelection();
    }
  });
}

function onCanvasClick(event: MouseEvent) {
  // Only click if clicking inside the Canvas (and not over overlay UI panels)
  if ((event.target as HTMLElement).id !== 'canvas-container' && (event.target as HTMLElement).tagName !== 'CANVAS') {
    return;
  }

  // Calculate mouse position in normalized device coordinates (-1 to +1)
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  // Raycast planets first
  const activePlanetMeshes = Object.values(planetMeshes);
  const planetIntersects = raycaster.intersectObjects(activePlanetMeshes);

  if (planetIntersects.length > 0) {
    const hitPlanet = planetIntersects[0].object;
    const body = hitPlanet.userData.body as OrbitalElements;
    // Inject custom class for planets display
    body.class = 'planet';
    selectObject(body);
    return;
  }

  // Raycast active asteroid/comet particle points
  const intersects = raycaster.intersectObjects(raycastablePoints);

  if (intersects.length > 0) {
    const hit = intersects[0];
    const pointIdx = hit.index!;
    const pointsSystem = hit.object as THREE.Points;
    const list = pointsSystem.userData.list as OrbitalElements[];
    const body = list[pointIdx];

    if (body) {
      selectObject(body);
    }
  }
}

// Re-computes scrubber values and date texts based on currentJD
function updateTimelineUI() {
  const date = julianDateToDate(currentJD);
  
  // Format beautifully: Year-Month-Day
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const formattedDate = `${date.getUTCFullYear()}-${months[date.getUTCMonth()]}-${date.getUTCDate().toString().padStart(2, '0')}`;
  
  displayDate.innerText = formattedDate;
  displayJd.innerText = `JD ${currentJD.toFixed(2)}`;
  timeScrubber.value = Math.round(currentJD).toString();

  // If Detail panel is open, refresh approaches lists to show upcoming and past indicators correctly
  if (selectedBody) {
    renderCloseApproaches(selectedBody.pdes);
  }
}

// --- Deep Linking and Router ---
function updateDeepLink() {
  const camPos = `${camera.position.x.toFixed(2)},${camera.position.y.toFixed(2)},${camera.position.z.toFixed(2)}`;
  let hash = `jd=${currentJD.toFixed(2)}&cam=${camPos}`;
  if (selectedBody) {
    hash += `&sel=${selectedBody.pdes}`;
    if (isLockedOnTarget) {
      hash += `&lock=1`;
    }
  }
  window.history.replaceState(null, '', '#' + hash);
}

function parseDeepLink() {
  if (!window.location.hash) return;
  const hash = window.location.hash.substring(1);
  const params = new URLSearchParams(hash);

  if (params.has('jd')) {
    currentJD = parseFloat(params.get('jd')!);
  }

  if (params.has('cam')) {
    const coords = params.get('cam')!.split(',').map(Number);
    if (coords.length === 3 && !coords.some(isNaN)) {
      camera.position.set(coords[0], coords[1], coords[2]);
    }
  }

  if (params.has('sel')) {
    const pdes = params.get('sel')!;
    // Search raw lists for match
    const asteroid = rawAsteroids.find(a => a.pdes === pdes);
    if (asteroid) {
      // Force delay slightly so assets are built first
      setTimeout(() => {
        selectObject(asteroid);
        if (params.get('lock') === '1') {
          isLockedOnTarget = true;
          btnLock.classList.add('active');
          btnLock.innerHTML = '<span class="icon">🔒</span> Camera Locked';
        }
      }, 500);
    } else {
      const comet = rawComets.find(c => c.pdes === pdes);
      if (comet) {
        setTimeout(() => {
          selectObject(comet);
        }, 500);
      } else {
        const planet = planets.find(p => p.name?.toLowerCase() === pdes.toLowerCase());
        if (planet) {
          planet.class = 'planet';
          setTimeout(() => {
            selectObject(planet);
          }, 500);
        }
      }
    }
  }
}

// --- Main Animation Frame Loop ---
function animate(timestamp: number) {
  requestAnimationFrame(animate);

  if (!lastFrameTime) lastFrameTime = timestamp;
  let delta = (timestamp - lastFrameTime) / 1000;
  if (delta > 0.1) delta = 0.1; // Clamp lags
  lastFrameTime = timestamp;

  // 1. Advance simulation time
  if (isPlaying) {
    currentJD += simSpeed * delta;
    
    // Clamp to timeline limits
    if (currentJD < startJD) { currentJD = startJD; isPlaying = false; }
    if (currentJD > endJD) { currentJD = endJD; isPlaying = false; }

    updateTimelineUI();
  }

  // 2. Propagate planets and update labels
  planets.forEach(p => {
    const pos = propagateOrbit(p, currentJD);
    const mesh = planetMeshes[p.name!];
    if (mesh) {
      mesh.position.copy(pos);
    }
    
    const label = planetLabels[p.name!];
    if (label) {
      // Position label slightly above planet sphere
      label.position.set(pos.x, pos.y, pos.z + 0.08);
    }
  });

  // 3. Propagate active asteroid and comet particles
  propagateParticles();

  // 4. Handle Lock & Follow Camera Tracking
  if (isLockedOnTarget && selectedBody) {
    const currentPos = new THREE.Vector3();
    if (selectedBody.class === 'planet') {
      currentPos.copy(planetMeshes[selectedBody.name!].position);
    } else {
      currentPos.copy(propagateOrbit(selectedBody, currentJD));
    }

    // Apply movement delta of target to camera so camera maintains angle/zoom
    const camDelta = new THREE.Vector3().copy(currentPos).sub(lastSelectedPosition);
    camera.position.add(camDelta);
    controls.target.copy(currentPos);
    
    lastSelectedPosition.copy(currentPos);
  }

  // 5. Update controls damping
  controls.update();

  // 6. Silent URL deep link updates periodically (every 2 seconds)
  if (isPlaying && Math.random() < 0.01) {
    updateDeepLink();
  }

  renderer.render(scene, camera);
}

// Start data fetch sequences at startup
init3D();
loadData();
