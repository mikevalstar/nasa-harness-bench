import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { calculatePosition } from './utils/orbital-mechanics';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import planetsData from '../../data/planets.json';

interface OrbitalElements {
  a: number; // semi-major axis (AU)
  e: number; // eccentricity
  i: number; // inclination (deg)
  om: number; // longitude of ascending node (deg)
  w: number; // argument of perihelion (deg)
  ma?: number; // mean anomaly at epoch (deg)
  epoch: number; // epoch of the elements (Julian date)
  n?: number; // mean motion (deg/day)
  per?: number; // orbital period (days)
  q?: number; // perihelion distance (AU)
  ad?: number; // aphelion distance (AU)
  tp?: number; // time of perihelion passage (Julian date)
}

interface PlanetData extends OrbitalElements {
  name: string;
  radius_km: number;
}

interface AsteroidData extends OrbitalElements {
  pdes: string;
  neo: boolean;
  pha: boolean;
  class: string;
  diameter: number | null;
}

interface CometData extends OrbitalElements {
  pdes: string;
  class: string;
  M1?: number;
  diameter?: number | null;
}

interface SentryData {
  des: string;
  fullname: string;
  ip: number;
  ps_cum: number;
  ps_max: number;
  ts_max: number;
  range: string;
  n_imp: number;
  diameter: number;
  h: number;
  v_inf: number;
}

// Constants
const AU_TO_KM = 149597870.7; // 1 AU in kilometers
const SUN_RADIUS_KM = 696000;

// VISUAL SCALING FACTORS
// Distances are in AU, so 1 unit = 1 AU
const PLANET_RADIUS_SCALE = 2000; // Multiplier for planet radii (to make them visible)
const SUN_RADIUS_SCALE = 200; // Multiplier for sun radius
const ASTEROID_RADIUS_VISIBILITY = 0.005; // Fixed visible radius for asteroids, regardless of actual diameter
const COMET_RADIUS_VISIBILITY = 0.008; // Fixed visible radius for comets
const INITIAL_CAMERA_DISTANCE = 20; // Initial camera distance from the origin
const CAMERA_FOLLOW_DISTANCE = 0.5; // Distance of camera from focused object
const CAMERA_LERP_FACTOR = 0.1; // Smoothness of camera movement

const MIN_JULIAN_DATE = 2451545.0 - 365 * 10; // ~10 years before J2000
const MAX_JULIAN_DATE = 2451545.0 + 365 * 100; // ~100 years after J2000

function App() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [currentTime, setCurrentTime] = useState(2451545.0); // J2000 epoch as initial time
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState(1); // Days per second
  const [allAsteroids, setAllAsteroids] = useState<AsteroidData[]>([]);
  const [filteredAsteroids, setFilteredAsteroids] = useState<AsteroidData[]>([]);
  const [allComets, setAllComets] = useState<CometData[]>([]);
  const [sentryData, setSentryData] = useState<Record<string, SentryData>>({}); // Map pdes to SentryData
  const [showPhaOnly, setShowPhaOnly] = useState(false);
  const [selectedObject, setSelectedObject] = useState<any>(null); // To store selected object data
  const [focusedObject, setFocusedObject] = useState<any>(null); // To store currently focused object data

  const animateRef = useRef<number>();
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const planetMeshesRef = useRef<{ mesh: THREE.Mesh, data: PlanetData }[]>([]);
  const asteroidInstancedMeshRef = useRef<THREE.InstancedMesh | null>(null);
  const phaInstancedMeshRef = useRef<THREE.InstancedMesh | null>(null); // Ref for PHA InstancedMesh
  const cometInstancedMeshRef = useRef<THREE.InstancedMesh | null>(null);
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());

  // Parse URL parameters on initial load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initialTime = parseFloat(params.get('time') || '');
    if (!isNaN(initialTime)) {
      setCurrentTime(initialTime);
    }
    const selectedObjectName = params.get('selectedObject');
    // Handle selected object restoration after data is loaded.
    // This will be handled in a separate useEffect once allAsteroids, allComets, planetsData are available.
  }, []);

  // Update URL parameters when state changes
  useEffect(() => {
    const params = new URLSearchParams();
    params.set('time', currentTime.toString());
    if (selectedObject) {
      params.set('selectedObject', selectedObject.name || selectedObject.pdes);
      params.set('selectedObjectType', selectedObject.type);
    }
    // Consider adding camera position/target to URL for full deep linking
    window.history.replaceState(null, '', `?${params.toString()}`);
  }, [currentTime, selectedObject]);

  // Load data
  useEffect(() => {
    fetch('./asteroids_processed.json')
      .then(res => res.json())
      .then((data: AsteroidData[]) => {
        setAllAsteroids(data);
        setFilteredAsteroids(data);
        console.log(`Loaded ${data.length} asteroids.`);
      })
      .catch(error => console.error("Error loading asteroid data:", error));

    fetch('./comets_processed.json')
      .then(res => res.json())
      .then((data: CometData[]) => {
        setAllComets(data);
        console.log(`Loaded ${data.length} comets.`);
      })
      .catch(error => console.error("Error loading comet data:", error));

    fetch('./sentry_processed.json')
      .then(res => res.json())
      .then((data: SentryData[]) => {
        const sentryMap: Record<string, SentryData> = {};
        data.forEach(item => {
          sentryMap[item.des] = item;
        });
        setSentryData(sentryMap);
        console.log(`Loaded ${data.length} Sentry items.`);
      })
      .catch(error => console.error("Error loading Sentry data:", error));
  }, []);

  // Restore selected object from URL after data is loaded
  useEffect(() => {
    if (allAsteroids.length > 0 && allComets.length > 0) { // Check if data is loaded
      const params = new URLSearchParams(window.location.search);
      const name = params.get('selectedObject');
      const type = params.get('selectedObjectType');

      if (name && type) {
        let objectToSelect: any = null;
        if (type === 'Planet') {
          objectToSelect = planetsData.find(p => p.name === name);
          if (objectToSelect) objectToSelect = { type: 'Planet', name: objectToSelect.name, data: objectToSelect };
        } else if (type === 'Asteroid' || type === 'Potentially Hazardous Asteroid') {
          objectToSelect = allAsteroids.find(a => a.pdes === name);
          if (objectToSelect) objectToSelect = { type: type, name: objectToSelect.pdes, data: objectToSelect };
        } else if (type === 'Comet') {
          objectToSelect = allComets.find(c => c.pdes === name);
          if (objectToSelect) objectToSelect = { type: 'Comet', name: objectToSelect.pdes, data: objectToSelect };
        } else if (type === 'Sun') {
          objectToSelect = { type: 'Sun', name: 'Sun' };
        }

        if (objectToSelect) {
          setSelectedObject(objectToSelect);
          setFocusedObject(objectToSelect);
        }
      }
    }
  }, [allAsteroids, allComets, planetsData]);

  // Filter asteroids based on showPhaOnly state
  useEffect(() => {
    if (showPhaOnly) {
      setFilteredAsteroids(allAsteroids.filter(asteroid => asteroid.pha || sentryData[asteroid.pdes]));
    } else {
      setFilteredAsteroids(allAsteroids);
    }
  }, [showPhaOnly, allAsteroids, sentryData]);

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x000000); // Black background for space

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 1000; // Limit how far the camera can go
    controlsRef.current = controls;

    // Event listener to clear focus if user interacts with controls manually
    const onControlsChange = () => {
      if (focusedObject) {
        setFocusedObject(null);
      }
    };
    controls.addEventListener('start', onControlsChange);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x333333);
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0xffffff, 2, 0);
    pointLight.position.set(0, 0, 0); // Sun is the light source
    scene.add(pointLight);

    // Sun
    const sunGeometry = new THREE.SphereGeometry(SUN_RADIUS_KM / AU_TO_KM * SUN_RADIUS_SCALE, 32, 32);
    const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffa500 }); // Orange/yellow for sun
    const sun = new THREE.Mesh(sunGeometry, sunMaterial);
    sun.userData = { type: 'Sun', name: 'Sun' }; // Add userData for identification
    scene.add(sun);

    // Planets
    (planetsData as PlanetData[]).forEach(planetData => {
      const radiusAU = planetData.radius_km / AU_TO_KM * PLANET_RADIUS_SCALE;
      const geometry = new THREE.SphereGeometry(radiusAU, 32, 32);
      let materialColor;
      switch (planetData.name) {
        case 'Mercury': materialColor = 0xaaaaaa; break;
        case 'Venus': materialColor = 0xe6e6b8; break;
        case 'Earth': materialColor = 0x0000ff; break;
        case 'Mars': materialColor = 0xff0000; break;
        case 'Jupiter': materialColor = 0xdda0dd; break;
        case 'Saturn': materialColor = 0xffd700; break;
        case 'Uranus': materialColor = 0xadd8e6; break;
        case 'Neptune': materialColor = 0x00008b; break;
        default: materialColor = 0xcccccc; break;
      }
      const material = new THREE.MeshStandardMaterial({ color: materialColor });
      const planet = new THREE.Mesh(geometry, material);
      planet.userData = { type: 'Planet', name: planetData.name, data: planetData };
      scene.add(planet);
      planetMeshesRef.current.push({ mesh: planet, data: planetData });
    });

    // Asteroids (using InstancedMesh for performance)
    const asteroidGeometry = new THREE.SphereGeometry(ASTEROID_RADIUS_VISIBILITY, 8, 8); // Small spheres for asteroids
    const asteroidMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 });
    const phaMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 }); // Red for PHAs
    const asteroidInstancedMesh = new THREE.InstancedMesh(asteroidGeometry, asteroidMaterial, allAsteroids.length);
    const phaInstancedMesh = new THREE.InstancedMesh(asteroidGeometry, phaMaterial, allAsteroids.length);

    asteroidInstancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    asteroidInstancedMesh.userData = { type: 'Asteroids' };
    scene.add(asteroidInstancedMesh);
    asteroidInstancedMeshRef.current = asteroidInstancedMesh;

    phaInstancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    phaInstancedMesh.userData = { type: 'PHAAsteroids' }; // Differentiate PHAs
    scene.add(phaInstancedMesh);
    phaInstancedMeshRef.current = phaInstancedMesh;

    // Comets (using InstancedMesh for performance)
    const cometGeometry = new THREE.SphereGeometry(COMET_RADIUS_VISIBILITY, 8, 8);
    const cometMaterial = new THREE.MeshStandardMaterial({ color: 0x87CEEB }); // Light blue for comets
    const maxComets = allComets.length;
    const cometInstancedMesh = new THREE.InstancedMesh(cometGeometry, cometMaterial, maxComets);
    cometInstancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    cometInstancedMesh.userData = { type: 'Comets' };
    scene.add(cometInstancedMesh);
    cometInstancedMeshRef.current = cometInstancedMesh;

    camera.position.z = INITIAL_CAMERA_DISTANCE; // Adjust camera position to see the system
    controls.update();

    // Raycasting for object selection
    const onCanvasClick = (event: MouseEvent) => {
      if (!cameraRef.current || !rendererRef.current || !sceneRef.current) return;

      // Calculate mouse position in normalized device coordinates (-1 to +1)
      mouseRef.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = -(event.clientY / window.innerHeight) * 2 + 1;

      raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);

      const intersects = raycasterRef.current.intersectObjects(sceneRef.current.children);

      if (intersects.length > 0) {
        const intersectedObject = intersects[0].object;

        if (intersectedObject.userData.type === 'Planet' || intersectedObject.userData.type === 'Sun') {
          setSelectedObject(intersectedObject.userData);
        } else if (intersectedObject.userData.type === 'Asteroids') {
          const instanceId = intersects[0].instanceId;
          if (instanceId !== undefined && filteredAsteroids[instanceId]) {
            setSelectedObject({
              type: 'Asteroid',
              name: filteredAsteroids[instanceId].pdes,
              data: filteredAsteroids[instanceId]
            });
          }
        } else if (intersectedObject.userData.type === 'PHAAsteroids') {
            const instanceId = intersects[0].instanceId;
            if (instanceId !== undefined && filteredAsteroids[instanceId]) {
              setSelectedObject({
                type: 'Potentially Hazardous Asteroid',
                name: filteredAsteroids[instanceId].pdes,
                data: filteredAsteroids[instanceId]
              });
            }
        } else if (intersectedObject.userData.type === 'Comets') {
          const instanceId = intersects[0].instanceId;
          if (instanceId !== undefined && allComets[instanceId]) {
            setSelectedObject({
              type: 'Comet',
              name: allComets[instanceId].pdes,
              data: allComets[instanceId]
            });
          }
        }
      } else {
        setSelectedObject(null);
      }
    };
    renderer.domElement.addEventListener('click', onCanvasClick);

    // Animation loop
    const animate = () => {
      animateRef.current = requestAnimationFrame(animate);

      if (isPlaying) {
        setCurrentTime(prevTime => {
          const newTime = prevTime + playSpeed / 60; // Assuming 60 fps for simplicity
          return Math.min(Math.max(newTime, MIN_JULIAN_DATE), MAX_JULIAN_DATE);
        });
      }

      // Update planets positions
      planetMeshesRef.current.forEach(({ mesh, data }) => {
        const position = calculatePosition(data, currentTime);
        mesh.position.copy(position);
      });

      // Update asteroids positions
      if (asteroidInstancedMeshRef.current && phaInstancedMeshRef.current && filteredAsteroids.length > 0) {
        const matrix = new THREE.Matrix4();
        let normalAsteroidCount = 0;
        let phaAsteroidCount = 0;

        for (let i = 0; i < filteredAsteroids.length; i++) {
          const asteroid = filteredAsteroids[i];
          const position = calculatePosition(asteroid, currentTime);

          // Only render a subset of asteroids for performance/visibility
          if (normalAsteroidCount + phaAsteroidCount < 2000) { // Limit to 2000 asteroids visible at once
            if (asteroid.pha) {
              matrix.setPosition(position);
              phaInstancedMeshRef.current.setMatrixAt(phaAsteroidCount, matrix);
              phaAsteroidCount++;
            } else {
              matrix.setPosition(position);
              asteroidInstancedMeshRef.current.setMatrixAt(normalAsteroidCount, matrix);
              normalAsteroidCount++;
            }
          } else {
            break; // Stop adding more instances if limit is reached
          }
        }

        // Hide unused normal asteroid instances
        for (let i = normalAsteroidCount; i < asteroidInstancedMeshRef.current.count; i++) {
          asteroidInstancedMeshRef.current.setMatrixAt(i, new THREE.Matrix4().makeScale(0, 0, 0));
        }
        asteroidInstancedMeshRef.current.instanceMatrix.needsUpdate = true;
        asteroidInstancedMeshRef.current.count = normalAsteroidCount;

        // Hide unused PHA asteroid instances
        for (let i = phaAsteroidCount; i < phaInstancedMeshRef.current.count; i++) {
          phaInstancedMeshRef.current.setMatrixAt(i, new THREE.Matrix4().makeScale(0, 0, 0));
        }
        phaInstancedMeshRef.current.instanceMatrix.needsUpdate = true;
        phaInstancedMeshRef.current.count = phaAsteroidCount;

      } else if (asteroidInstancedMeshRef.current && phaInstancedMeshRef.current) {
        // If no asteroids or filtered asteroids, hide all instances
        for (let i = 0; i < asteroidInstancedMeshRef.current.count; i++) {
          asteroidInstancedMeshRef.current.setMatrixAt(i, new THREE.Matrix4().makeScale(0, 0, 0));
        }
        asteroidInstancedMeshRef.current.instanceMatrix.needsUpdate = true;
        asteroidInstancedMeshRef.current.count = 0;

        for (let i = 0; i < phaInstancedMeshRef.current.count; i++) {
            phaInstancedMeshRef.current.setMatrixAt(i, new THREE.Matrix4().makeScale(0, 0, 0));
        }
        phaInstancedMeshRef.current.instanceMatrix.needsUpdate = true;
        phaInstancedMeshRef.current.count = 0;
      }

      // Update comets positions
      if (cometInstancedMeshRef.current && allComets.length > 0) {
        const matrix = new THREE.Matrix4();
        let cometCount = 0;
        for (let i = 0; i < allComets.length; i++) {
          const comet = allComets[i];
          const position = calculatePosition(comet, currentTime);
          // Limit rendering of comets too for performance if needed
          if (cometCount < 1000) { // Limit to 1000 comets visible at once
            matrix.setPosition(position);
            cometInstancedMeshRef.current.setMatrixAt(cometCount, matrix);
            cometCount++;
          } else {
            break;
          }
        }
        // Hide unused instances
        for (let i = cometCount; i < cometInstancedMeshRef.current.count; i++) {
          cometInstancedMeshRef.current.setMatrixAt(i, new THREE.Matrix4().makeScale(0, 0, 0));
        }
        cometInstancedMeshRef.current.instanceMatrix.needsUpdate = true;
        cometInstancedMeshRef.current.count = cometCount;
      } else if (cometInstancedMeshRef.current) {
        for (let i = 0; i < cometInstancedMeshRef.current.count; i++) {
          cometInstancedMeshRef.current.setMatrixAt(i, new THREE.Matrix4().makeScale(0, 0, 0));
        }
        cometInstancedMeshRef.current.instanceMatrix.needsUpdate = true;
        cometInstancedMeshRef.current.count = 0;
      }

      // If an object is focused, update camera to follow it
      if (focusedObject && controlsRef.current && cameraRef.current) {
        let targetPosition: THREE.Vector3;
        if (focusedObject.type === 'Sun') {
          targetPosition = new THREE.Vector3(0, 0, 0);
        } else {
          targetPosition = calculatePosition(focusedObject.data, currentTime);
        }

        // Smoothly interpolate camera position and target
        controlsRef.current.target.lerp(targetPosition, CAMERA_LERP_FACTOR);
        cameraRef.current.position.lerp(targetPosition.clone().add(
          cameraRef.current.position.clone().sub(controlsRef.current.target).normalize().multiplyScalar(CAMERA_FOLLOW_DISTANCE)
        ), CAMERA_LERP_FACTOR);
      }
      controlsRef.current.update();
      renderer.render(scene, camera);
    };
    animateRef.current = requestAnimationFrame(animate);

    // Handle window resize
    const handleResize = () => {
      if (cameraRef.current && rendererRef.current) {
        cameraRef.current.aspect = window.innerWidth / window.innerHeight;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(window.innerWidth, window.innerHeight);
      }
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('click', onCanvasClick);
      controls.removeEventListener('start', onControlsChange);
      if (mountRef.current && rendererRef.current) {
        mountRef.current.removeChild(rendererRef.current.domElement);
      }
      if (animateRef.current) {
        cancelAnimationFrame(animateRef.current);
      }
      if (controlsRef.current) {
        controlsRef.current.dispose();
      }
    };
  }, [isPlaying, playSpeed, currentTime, filteredAsteroids, allAsteroids, allComets, sentryData, focusedObject]);

  const handleSliderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentTime(parseFloat(event.target.value));
  };

  const handleSpeedChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setPlaySpeed(parseFloat(event.target.value));
  };

  const handleFocusObject = useCallback(() => {
    if (selectedObject && selectedObject.data) {
      setFocusedObject(selectedObject);
    } else if (selectedObject && selectedObject.type === 'Sun') {
      setFocusedObject(selectedObject);
    }
  }, [selectedObject]);

  // Convert Julian date to readable date for display
  const julianToDate = (jd: number) => {
    const date = new Date((jd - 2440587.5) * 86400000); // Convert Julian to Unix timestamp
    return date.toUTCString();
  };

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative' }}>
      <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: '10px',
        color: 'white',
        zIndex: 100
      }}>
        <label>
          <input
            type="checkbox"
            checked={showPhaOnly}
            onChange={(e) => setShowPhaOnly(e.target.checked)}
          />
          Show Potentially Hazardous Asteroids Only (PHA/Sentry)
        </label>
      </div>

      {selectedObject && (
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'rgba(0,0,0,0.7)',
          padding: '10px',
          color: 'white',
          zIndex: 100,
          maxWidth: '300px',
          maxHeight: '80%',
          overflowY: 'auto'
        }}>
          <h3>{selectedObject.name || selectedObject.pdes}</h3>
          <p>Type: {selectedObject.type}</p>
          {selectedObject.data && (
            <pre style={{ fontSize: '0.8em' }}>
              {JSON.stringify(selectedObject.data, null, 2)}
            </pre>
          )}
          {selectedObject.data && sentryData[selectedObject.data.pdes] && (
            <div>
              <h4>Sentry Impact Risk:</h4>
              <pre style={{ fontSize: '0.8em' }}>
                {JSON.stringify(sentryData[selectedObject.data.pdes], null, 2)}
              </pre>
            </div>
          )}
          <button onClick={handleFocusObject}>Focus</button>
        </div>
      )}

      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: '10px',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        <button onClick={() => setIsPlaying(!isPlaying)}>
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        <label>Speed:</label>
        <select value={playSpeed} onChange={handleSpeedChange}>
          <option value={0.1}>0.1x</option>
          <option value={1}>1x</option>
          <option value={10}>10x</option>
          <option value={100}>100x</option>
          <option value={1000}>1000x</option>
        </select>
        <input
          type="range"
          min={MIN_JULIAN_DATE}
          max={MAX_JULIAN_DATE}
          step="1"
          value={currentTime}
          onChange={handleSliderChange}
          style={{ flexGrow: 1 }}
        />
        <span>{julianToDate(currentTime)}</span>
      </div>
    </div>
  );
}

export default App;
