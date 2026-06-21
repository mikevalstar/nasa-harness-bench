import React, { useEffect, useState, useTransition } from 'react';
import { OrbitViewer } from './components/OrbitViewer';
import { TimeControl } from './components/TimeControl';
import { Sidebar } from './components/Sidebar';
import { DetailsPanel } from './components/DetailsPanel';
import { getJulianDate, getDateFromJulian } from './math/orbits';
import { Sparkles, Compass } from 'lucide-react';

export default function App() {
  // --- Simulation State ---
  const [jd, setJd] = useState(() => {
    // Check URL query parameters first
    const params = new URLSearchParams(window.location.search);
    const jdParam = params.get('jd');
    return jdParam ? parseFloat(jdParam) : getJulianDate(new Date());
  });
  
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState(10); // days per second

  // --- Display Config State ---
  const [showOrbits, setShowOrbits] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('orbits') !== '0'; // default true
  });
  
  const [showAsteroids, setShowAsteroids] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('asteroids') !== '0'; // default true
  });

  const [showComets, setShowComets] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('comets') === '1'; // default false
  });

  const [followSelected, setFollowSelected] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('follow') === '1'; // default false
  });

  const [highlightHazardous, setHighlightHazardous] = useState(false);
  const [filterClass, setFilterClass] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // --- Datasets State ---
  const [planets, setPlanets] = useState<any[]>([]);
  const [asteroids, setAsteroids] = useState<any[][]>([]);
  const [comets, setComets] = useState<any[][]>([]);
  const [sentryData, setSentryData] = useState<Record<string, any>>({});
  const [closeApproachesData, setCloseApproachesData] = useState<Record<string, any[][]>>({});
  
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [selectedObject, setSelectedObject] = useState<any | null>(null);

  // UseTransition for filtering to keep UI buttery smooth
  const [, startTransition] = useTransition();

  // --- Step 1: Load Datasets ---
  useEffect(() => {
    async function loadData() {
      try {
        setLoadingProgress(10);
        // Fetch planets (always required and small)
        const planetsRes = await fetch('data/planets.json');
        const planetsJson = await planetsRes.json();
        setPlanets(planetsJson);
        setLoadingProgress(25);

        // Fetch sentry (small)
        const sentryRes = await fetch('data/sentry_grouped.json');
        const sentryJson = await sentryRes.json();
        setSentryData(sentryJson);
        setLoadingProgress(35);

        // Fetch comets (medium)
        const cometsRes = await fetch('data/comets_optimized.json');
        const cometsJson = await cometsRes.json();
        setComets(cometsJson);
        setLoadingProgress(50);

        // Fetch close approaches (medium-large)
        const caRes = await fetch('data/close_approaches_grouped.json');
        const caJson = await caRes.json();
        setCloseApproachesData(caJson);
        setLoadingProgress(70);

        // Fetch asteroids (large)
        const asteroidsRes = await fetch('data/asteroids_optimized.json');
        const asteroidsJson = await asteroidsRes.json();
        setAsteroids(asteroidsJson);
        setLoadingProgress(100);

        // --- Step 2: Handle URL selection parameter on initial load ---
        const params = new URLSearchParams(window.location.search);
        const selParam = params.get('sel'); // format "type:id", e.g. "asteroid:433" or "planet:Mars"
        if (selParam) {
          const [type, id] = selParam.split(':');
          if (type === 'planet') {
            const matched = planetsJson.find((p: any) => p.name.toLowerCase() === id.toLowerCase());
            if (matched) setSelectedObject({ type: 'planet', data: matched });
          } else if (type === 'asteroid') {
            const matched = asteroidsJson.find((a: any[]) => a[0] === id || (a[1] && a[1].toLowerCase() === id.toLowerCase()));
            if (matched) setSelectedObject({ type: 'asteroid', data: matched });
          } else if (type === 'comet') {
            const matched = cometsJson.find((c: any[]) => c[0] === id || (c[1] && c[1].toLowerCase() === id.toLowerCase()));
            if (matched) setSelectedObject({ type: 'comet', data: matched });
          }
        }

        setIsLoading(false);
      } catch (err) {
        console.error('Failed to load datasets', err);
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  // --- Step 3: Run Real-time Simulation Clock ---
  useEffect(() => {
    if (!isPlaying || isLoading) return;

    let lastTime = performance.now();
    let animId = 0;

    const tick = () => {
      const now = performance.now();
      const dtSec = (now - lastTime) / 1000;
      lastTime = now;

      const deltaDays = dtSec * speed;
      setJd((prev) => prev + deltaDays);

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, speed, isLoading]);

  // --- Step 4: Sync Application State to URL Query Parameters ---
  useEffect(() => {
    if (isLoading) return;

    const params = new URLSearchParams();
    
    // Time
    params.set('jd', jd.toFixed(4));
    
    // Display modes
    params.set('orbits', showOrbits ? '1' : '0');
    params.set('asteroids', showAsteroids ? '1' : '0');
    params.set('comets', showComets ? '1' : '0');
    params.set('follow', followSelected ? '1' : '0');

    // Selection
    if (selectedObject) {
      let idStr = '';
      if (selectedObject.type === 'planet') {
        idStr = selectedObject.data.name;
      } else {
        idStr = selectedObject.data[0]; // pdes
      }
      params.set('sel', `${selectedObject.type}:${idStr}`);
    }

    const currentQueryString = window.location.search;
    const newQueryString = '?' + params.toString();

    // Only update if changes were actually made to prevent infinite loops / lag
    if (currentQueryString !== newQueryString) {
      window.history.replaceState(null, '', newQueryString);
    }
  }, [jd, showOrbits, showAsteroids, showComets, followSelected, selectedObject, isLoading]);

  if (isLoading) {
    return (
      <div className="w-screen h-screen flex flex-col items-center justify-center bg-slate-950 text-slate-100 select-none">
        <div className="flex flex-col items-center max-w-sm w-full px-6 text-center">
          <Compass className="w-16 h-16 text-cyan-400 animate-spin mb-4" />
          <h2 className="text-2xl font-bold tracking-wider uppercase bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent mb-1">
            Loading Solar System
          </h2>
          <p className="text-xs text-slate-400 mb-6 font-semibold">Streaming NASA/JPL Keplerian Datasets...</p>
          
          {/* Progress bar container */}
          <div className="w-full bg-slate-900 border border-slate-800 rounded-full h-3 overflow-hidden p-0.5 mb-2 shadow-inner">
            <div
              className="bg-gradient-to-r from-cyan-500 to-indigo-500 h-full rounded-full transition-all duration-300 shadow-lg shadow-cyan-500/50"
              style={{ width: `${loadingProgress}%` }}
            ></div>
          </div>
          <span className="text-[10px] font-mono text-cyan-400 font-bold">{loadingProgress}% Complete</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen overflow-hidden flex relative font-sans text-slate-100 bg-slate-950">
      {/* Sidebar (Filters, searches, configs) */}
      <Sidebar
        planets={planets}
        asteroids={asteroids}
        comets={comets}
        selectedObject={selectedObject}
        onSelectObject={(obj) => {
          setSelectedObject(obj);
          if (obj) setFollowSelected(true); // Auto track on selection
        }}
        showOrbits={showOrbits}
        setShowOrbits={setShowOrbits}
        showAsteroids={showAsteroids}
        setShowAsteroids={setShowAsteroids}
        showComets={showComets}
        setShowComets={setShowComets}
        followSelected={followSelected}
        setFollowSelected={setFollowSelected}
        highlightHazardous={highlightHazardous}
        setHighlightHazardous={(val) => startTransition(() => setHighlightHazardous(val))}
        sentryData={sentryData}
        filterClass={filterClass}
        setFilterClass={(val) => startTransition(() => setFilterClass(val))}
        searchQuery={searchQuery}
        setSearchQuery={(val) => startTransition(() => setSearchQuery(val))}
      />

      {/* Main 3D Interactive Viewport */}
      <div className="flex-1 h-full relative">
        {/* HUD top-right indicator */}
        <div className="absolute top-6 right-6 flex items-center gap-1.5 bg-slate-950/60 backdrop-blur border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 font-mono z-10">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
          WebGL Engines Active | {asteroids.length.toLocaleString()} NEOs Loaded
        </div>

        <OrbitViewer
          jd={jd}
          planets={planets}
          asteroids={asteroids}
          comets={comets}
          selectedObject={selectedObject}
          onSelectObject={(obj) => {
            setSelectedObject(obj);
            if (obj) setFollowSelected(true);
          }}
          showOrbits={showOrbits}
          showAsteroids={showAsteroids}
          showComets={showComets}
          followSelected={followSelected}
          highlightHazardous={highlightHazardous}
          sentryData={sentryData}
          filterClass={filterClass}
        />

        {/* Floating Time Controls Overlay */}
        <TimeControl
          jd={jd}
          setJd={setJd}
          isPlaying={isPlaying}
          setIsPlaying={setIsPlaying}
          speed={speed}
          setSpeed={setSpeed}
        />

        {/* Sliding Details Inspector Panel */}
        {selectedObject && (
          <DetailsPanel
            selectedObject={selectedObject}
            onClose={() => {
              setSelectedObject(null);
              setFollowSelected(false);
            }}
            sentryData={sentryData}
            closeApproachesData={closeApproachesData}
          />
        )}
      </div>
    </div>
  );
}
