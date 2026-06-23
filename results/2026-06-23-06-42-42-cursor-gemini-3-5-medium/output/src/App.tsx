import { useEffect, useState, useRef, useMemo } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Search,
  Filter,
  Calendar,
  ShieldAlert,
  Sliders,
  Activity,
  ChevronLeft,
  ChevronRight,
  Info,
  ExternalLink,
  Share2,
  Compass,
  Sparkles,
  X,
  MapPin,
} from 'lucide-react';
import { Asteroid, CloseApproach, Comet, Planet, SentryItem } from './types';
import { SolarSystemCanvas } from './components/SolarSystemCanvas';
import { OrbitSchematic } from './components/OrbitSchematic';
import {
  dateToJulianDate,
  julianDateToDate,
  formatJulianDate,
} from './utils/propagation';

export default function App() {
  // Loading & Progress States
  const [loading, setLoading] = useState(true);
  const [loadingStage, setLoadingStage] = useState('Initializing system...');
  const [loadingProgress, setLoadingProgress] = useState(10);

  // Raw Data States
  const [planets, setPlanets] = useState<Planet[]>([]);
  const [asteroids, setAsteroids] = useState<Asteroid[]>([]);
  const [comets, setComets] = useState<Comet[]>([]);
  const [sentryMap, setSentryMap] = useState<Map<string, SentryItem>>(new Map());
  const [closeApproachesMap, setCloseApproachesMap] = useState<Map<string, CloseApproach[]>>(new Map());

  // Interactive Simulation States
  const [currentJD, setCurrentJD] = useState(dateToJulianDate(new Date()));
  const [timeSpeed, setTimeSpeed] = useState(1); // days per real-time second
  const [isPaused, setIsPaused] = useState(true);
  const [selectedBody, setSelectedBody] = useState<Planet | Asteroid | Comet | null>(null);
  const [cameraMode, setCameraMode] = useState<'free' | 'follow'>('free');
  const [planetScale, setPlanetScale] = useState(5000); // Exaggeration scale
  
  // Sidebar visibility
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true);

  // Filtering States
  const [search, setSearch] = useState('');
  const [classCode, setClassCode] = useState('all'); // all, APO, ATE, AMO, IEO
  const [hazardStatus, setHazardStatus] = useState('all'); // all, pha, non-pha
  const [showComets, setShowComets] = useState(false);
  const [showSentryOnly, setShowSentryOnly] = useState(false);
  const [moidMax, setMoidMax] = useState(1.5); // max MOID in AU
  const [sizeRange, setSizeRange] = useState<[number, number]>([0, 10]); // min/max diameter in km

  const [copiedLink, setCopiedLink] = useState(false);

  // Time tracking ref for requestAnimationFrame
  const lastTimeRef = useRef<number | null>(null);

  // Orbit Class Definitions
  const orbitClassLabels: Record<string, string> = {
    APO: 'Apollo',
    ATE: 'Aten',
    AMO: 'Amor',
    IEO: 'Atira (IEO)',
  };

  const orbitClassDescriptions: Record<string, string> = {
    APO: 'Apollo asteroids have Earth-crossing orbits with a semi-major axis larger than Earth\'s (a > 1.0 AU) and perihelion distance smaller than Earth\'s aphelion (q < 1.017 AU).',
    ATE: 'Aten asteroids are Earth-crossing orbits with a semi-major axis smaller than Earth\'s (a < 1.0 AU) and aphelion distance larger than Earth\'s perihelion (ad > 0.983 AU).',
    AMO: 'Amor asteroids are Earth-approaching orbits that are outer-tangential to Earth\'s orbit but do not cross it (1.017 AU < q < 1.300 AU).',
    IEO: 'Atira asteroids (Inner-Earth Objects) have orbits completely contained within Earth\'s orbit (aphelion ad < 0.983 AU).',
  };

  // Convert JS Date for UI state
  const currentDate = useMemo(() => julianDateToDate(currentJD), [currentJD]);

  // Find Earth planet for schematic/lookups
  const earthPlanet = useMemo(() => {
    return planets.find((p) => p.name === 'Earth') || null;
  }, [planets]);

  // Load Database Files on Mount
  useEffect(() => {
    async function loadData() {
      try {
        setLoadingStage('Downloading celestial catalogs (1/5)...');
        setLoadingProgress(20);
        const planetsRes = await fetch('data/planets.json');
        const planetsData: Planet[] = await planetsRes.json();
        setPlanets(planetsData);

        setLoadingStage('Downloading impact-risk sentry database (2/5)...');
        setLoadingProgress(40);
        const sentryRes = await fetch('data/sentry.json');
        const sentryData: SentryItem[] = await sentryRes.json();
        const sMap = new Map<string, SentryItem>();
        sentryData.forEach((item) => sMap.set(item.des, item));
        setSentryMap(sMap);

        setLoadingStage('Downloading comets database (3/5)...');
        setLoadingProgress(60);
        const cometsRes = await fetch('data/comets.json');
        const cometsData: Comet[] = await cometsRes.json();
        setComets(cometsData);

        setLoadingStage('Downloading Earth close-approach registry (4/5)...');
        setLoadingProgress(80);
        const caRes = await fetch('data/close-approaches.json');
        const caData: CloseApproach[] = await caRes.json();
        const caMap = new Map<string, CloseApproach[]>();
        caData.forEach((ca) => {
          if (!caMap.has(ca.des)) caMap.set(ca.des, []);
          caMap.get(ca.des)!.push(ca);
        });
        setCloseApproachesMap(caMap);

        setLoadingStage('Downloading Near-Earth Asteroids master database (~42,000 objects) (5/5)...');
        setLoadingProgress(95);
        const astRes = await fetch('data/asteroids.json');
        const astData: Asteroid[] = await astRes.json();
        setAsteroids(astData);

        setLoadingStage('Initializing 3D orbital canvas...');
        setLoadingProgress(100);
        setLoading(false);
      } catch (err) {
        console.error('Failed to load dataset:', err);
        setLoadingStage('Error loading dataset. Please refresh or make sure files exist.');
      }
    }

    loadData();
  }, []);

  // Serialize App State to URL Hash (Deep Linking)
  useEffect(() => {
    if (loading) return;

    const params = new URLSearchParams();
    params.set('jd', currentJD.toFixed(4));
    
    if (selectedBody) {
      if ('radius_km' in selectedBody) {
        params.set('selected', selectedBody.name);
      } else {
        params.set('selected', selectedBody.pdes);
      }
    }
    
    if (showComets) params.set('comets', 'true');
    if (showSentryOnly) params.set('sentry', 'true');
    if (classCode !== 'all') params.set('class', classCode);
    if (cameraMode !== 'free') params.set('cam', cameraMode);
    if (planetScale !== 5000) params.set('scale', planetScale.toString());

    // Throttle or replace hash to avoid clogging history
    const newHash = '#' + params.toString();
    if (window.location.hash !== newHash) {
      window.history.replaceState(null, '', newHash);
    }
  }, [currentJD, selectedBody, showComets, showSentryOnly, classCode, cameraMode, planetScale, loading]);

  // Deserialize App State from URL Hash on Load
  useEffect(() => {
    if (loading || planets.length === 0 || asteroids.length === 0) return;

    const hash = window.location.hash;
    if (!hash || hash.length <= 1) return;

    try {
      const params = new URLSearchParams(hash.substring(1));
      
      const jdParam = params.get('jd');
      if (jdParam) {
        const parsedJD = parseFloat(jdParam);
        if (!isNaN(parsedJD)) setCurrentJD(parsedJD);
      }

      const selectedParam = params.get('selected');
      if (selectedParam) {
        // Look up in planets
        const matchedPlanet = planets.find((p) => p.name.toLowerCase() === selectedParam.toLowerCase());
        if (matchedPlanet) {
          setSelectedBody(matchedPlanet);
        } else {
          // Look up in asteroids
          const matchedAst = asteroids.find((a) => a.pdes.toLowerCase() === selectedParam.toLowerCase() || a.name?.toLowerCase() === selectedParam.toLowerCase());
          if (matchedAst) {
            setSelectedBody(matchedAst);
          } else {
            // Look up in comets
            const matchedComet = comets.find((c) => c.pdes.toLowerCase() === selectedParam.toLowerCase() || c.full_name.toLowerCase().includes(selectedParam.toLowerCase()));
            if (matchedComet) {
              setSelectedBody(matchedComet);
            }
          }
        }
      }

      if (params.get('comets') === 'true') setShowComets(true);
      if (params.get('sentry') === 'true') setShowSentryOnly(true);
      
      const classParam = params.get('class');
      if (classParam) setClassCode(classParam);

      const camParam = params.get('cam');
      if (camParam === 'follow') setCameraMode('follow');

      const scaleParam = params.get('scale');
      if (scaleParam) {
        const parsedScale = parseInt(scaleParam);
        if (!isNaN(parsedScale)) setPlanetScale(parsedScale);
      }
    } catch (err) {
      console.error('Error parsing URL hash:', err);
    }
  }, [loading, planets, asteroids, comets]);

  // Interactive Time Advance Loop (requestAnimationFrame)
  useEffect(() => {
    if (isPaused) {
      lastTimeRef.current = null;
      return;
    }

    let animationId: number;

    const frameStep = (timestamp: number) => {
      if (lastTimeRef.current === null) {
        lastTimeRef.current = timestamp;
      } else {
        const elapsedRealSec = (timestamp - lastTimeRef.current) / 1000;
        lastTimeRef.current = timestamp;

        // Julian Date increments by days.
        const jdDelta = elapsedRealSec * timeSpeed;
        setCurrentJD((prev) => prev + jdDelta);
      }
      animationId = requestAnimationFrame(frameStep);
    };

    animationId = requestAnimationFrame(frameStep);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [isPaused, timeSpeed]);

  // Generate shareable deep link copy
  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Helper to jump to Julian Date representing a calendar date
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.value) return;
    const date = new Date(e.target.value + 'T00:00:00');
    setCurrentJD(dateToJulianDate(date));
  };

  // Format date for the datepicker (YYYY-MM-DD)
  const datePickerValue = useMemo(() => {
    const d = julianDateToDate(currentJD);
    if (isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, [currentJD]);

  // Get active close approaches of the selected body
  const selectedCloseApproaches = useMemo(() => {
    if (!selectedBody) return [];
    return closeApproachesMap.get(selectedBody.pdes) || [];
  }, [selectedBody, closeApproachesMap]);

  // Get active sentry details of the selected body
  const selectedSentryDetails = useMemo(() => {
    if (!selectedBody) return null;
    return sentryMap.get(selectedBody.pdes) || null;
  }, [selectedBody, sentryMap]);

  // Total visible count based on current filters
  const visibleAsteroidsCount = useMemo(() => {
    return asteroids.filter((ast) => {
      if (search) {
        const query = search.toLowerCase();
        if (!ast.name?.toLowerCase().includes(query) && !ast.pdes.toLowerCase().includes(query) && !ast.full_name.toLowerCase().includes(query)) return false;
      }
      if (classCode !== 'all' && ast.class !== classCode) return false;
      if (hazardStatus === 'pha' && !ast.pha) return false;
      if (hazardStatus === 'non-pha' && ast.pha) return false;
      if (showSentryOnly && !sentryMap.has(ast.pdes)) return false;
      if (ast.diameter !== null && (ast.diameter < sizeRange[0] || ast.diameter > sizeRange[1])) return false;
      if (ast.diameter === null && sizeRange[0] > 0) return false;
      if (ast.moid > moidMax) return false;
      return true;
    }).length;
  }, [asteroids, search, classCode, hazardStatus, showSentryOnly, moidMax, sizeRange, sentryMap]);

  return (
    <div className="w-full h-full flex flex-col bg-gray-950 text-gray-100 overflow-hidden font-sans">
      {/* 1. Loading Screen overlay */}
      {loading && (
        <div className="absolute inset-0 bg-gray-950 flex flex-col items-center justify-center z-50 p-6 text-center">
          <div className="w-20 h-20 relative mb-8">
            <div className="absolute inset-0 border-4 border-cyan-500/20 rounded-full" />
            <div className="absolute inset-0 border-4 border-t-cyan-500 rounded-full animate-spin" />
            <Compass className="absolute inset-4 text-cyan-400 animate-pulse w-12 h-12" />
          </div>
          <h1 className="text-xl md:text-2xl font-bold font-mono tracking-widest text-cyan-400 mb-2 uppercase">
            Inner Celestial Navigator
          </h1>
          <p className="text-xs text-cyan-500/70 uppercase tracking-widest mb-6 font-mono">
            Near-Earth Orbit & Hazard Visualizer
          </p>
          <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-full h-2.5 overflow-hidden mb-3 shadow-inner">
            <div
              className="bg-gradient-to-r from-cyan-600 to-blue-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${loadingProgress}%` }}
            />
          </div>
          <p className="text-sm font-mono text-gray-400 animate-pulse">
            {loadingStage}
          </p>
          <div className="absolute bottom-6 text-[10px] font-mono text-gray-600">
            SOLAR SYSTEM PROPAGATION LABS © 2026
          </div>
        </div>
      )}

      {/* 2. Top Header HUD */}
      <header className="h-14 border-b border-gray-900 bg-gray-950/90 backdrop-blur-md px-4 flex items-center justify-between z-10 flex-shrink-0 select-none">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded bg-cyan-950/80 border border-cyan-800/40 text-cyan-400 shadow-md">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold font-mono tracking-wider uppercase text-gray-100 flex items-center gap-2">
              Celestial Navigator <span className="text-[10px] text-cyan-500 font-normal lowercase bg-cyan-950/50 border border-cyan-900/60 px-1.5 py-0.5 rounded">v2.1</span>
            </h1>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-mono">
              Inner Solar System & Near-Earth Objects
            </p>
          </div>
        </div>

        {/* Global Statistics Summary */}
        <div className="hidden lg:flex items-center gap-6 font-mono text-[11px] text-gray-400 border-l border-gray-900 pl-6 h-full">
          <div>
            Cataloged: <span className="text-gray-200 font-bold">{asteroids.length.toLocaleString()} NEOs</span>
          </div>
          <div>
            Impact Risk: <span className="text-red-500 font-bold">{sentryMap.size} Monitored</span>
          </div>
          <div>
            Comets: <span className="text-purple-400 font-bold">{comets.length.toLocaleString()}</span>
          </div>
        </div>

        {/* Quick Action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedBody(null)}
            disabled={!selectedBody}
            className={`px-2.5 py-1.5 text-xs font-mono rounded border flex items-center gap-1.5 transition ${
              selectedBody
                ? 'border-gray-800 bg-gray-900/60 text-gray-300 hover:bg-gray-800'
                : 'border-transparent text-gray-600 cursor-not-allowed'
            }`}
            title="Clear Selection"
          >
            <X className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Deselect</span>
          </button>
          
          <button
            onClick={handleCopyLink}
            className={`px-3 py-1.5 text-xs font-mono rounded border flex items-center gap-1.5 transition ${
              copiedLink
                ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-400'
                : 'border-cyan-900/60 bg-cyan-950/30 text-cyan-400 hover:bg-cyan-950/60'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{copiedLink ? 'Copied Link!' : 'Share View'}</span>
          </button>
        </div>
      </header>

      {/* 3. Main Split Content Area */}
      <div className="flex-1 w-full flex overflow-hidden relative">
        
        {/* Left Side: Filter & Search Panel */}
        <aside
          className={`absolute left-0 top-0 bottom-0 z-20 w-80 md:relative bg-gray-950/95 md:bg-gray-950 border-r border-gray-900 flex flex-col flex-shrink-0 transition-transform duration-300 h-full backdrop-blur-md md:backdrop-blur-none ${
            leftSidebarOpen ? 'translate-x-0' : '-translate-x-full md:absolute'
          }`}
        >
          {/* Scrollable Filters container */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5 select-none scrollbar-thin">
            
            {/* Search Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-mono uppercase tracking-wider text-gray-400 flex items-center gap-1">
                <Search className="w-3 h-3 text-cyan-500" /> Search Objects
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Designation or name (e.g. Apophis, 1950 DA)"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-gray-900/80 border border-gray-800 focus:border-cyan-500/50 outline-none rounded px-3 py-2 text-xs font-sans text-gray-200 placeholder-gray-500 transition shadow-inner"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-2 top-2.5 text-gray-500 hover:text-gray-300"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Orbit Class Filters */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-mono uppercase tracking-wider text-gray-400 flex items-center gap-1">
                <Filter className="w-3 h-3 text-cyan-500" /> Orbit Classification
              </label>
              <select
                value={classCode}
                onChange={(e) => setClassCode(e.target.value)}
                className="w-full bg-gray-900/80 border border-gray-800 outline-none focus:border-cyan-500/50 rounded p-2 text-xs font-mono text-gray-300 shadow-md cursor-pointer hover:bg-gray-900"
              >
                <option value="all">ALL CLASSES (NEOs)</option>
                <option value="APO">APOLLO (EARTH-CROSSER, a &gt; 1)</option>
                <option value="ATE">ATEN (EARTH-CROSSER, a &lt; 1)</option>
                <option value="AMO">AMOR (EARTH-APPROACHER)</option>
                <option value="IEO">ATIRA / IEO (INNER-EARTH)</option>
              </select>
            </div>

            {/* Hazard & Overlay Controls */}
            <div className="flex flex-col gap-2.5 border-t border-gray-900 pt-4">
              <label className="text-[10px] font-mono uppercase tracking-wider text-gray-400 flex items-center gap-1 mb-1">
                <Activity className="w-3 h-3 text-cyan-500" /> Filter & Overlay Overrides
              </label>
              
              {/* Hazard filters */}
              <div className="flex gap-1.5">
                {(['all', 'pha', 'non-pha'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setHazardStatus(status)}
                    className={`flex-1 py-1.5 text-[9px] font-mono font-bold uppercase rounded border transition ${
                      hazardStatus === status
                        ? 'border-orange-500 bg-orange-950/20 text-orange-400 shadow shadow-orange-500/20'
                        : 'border-gray-800 bg-gray-900/30 text-gray-400 hover:bg-gray-900'
                    }`}
                  >
                    {status === 'all' ? 'All NEOs' : status === 'pha' ? 'PHA Only' : 'Non-PHA'}
                  </button>
                ))}
              </div>

              {/* Toggles */}
              <div className="flex flex-col gap-2 bg-gray-900/30 border border-gray-900 p-2.5 rounded-lg shadow-inner">
                {/* Sentry Risk */}
                <label className="flex items-center justify-between cursor-pointer py-1">
                  <span className="text-xs font-mono text-gray-300 flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-red-500" />
                    Sentry Impact Risks
                  </span>
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={showSentryOnly}
                      onChange={(e) => setShowSentryOnly(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-8 h-4.5 bg-gray-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-400 after:border-gray-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-red-600 peer-checked:after:bg-white" />
                  </div>
                </label>

                {/* Comets overlay */}
                <label className="flex items-center justify-between cursor-pointer py-1">
                  <span className="text-xs font-mono text-gray-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    Overlay Comets
                  </span>
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={showComets}
                      onChange={(e) => setShowComets(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-8 h-4.5 bg-gray-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-400 after:border-gray-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-purple-600 peer-checked:after:bg-white" />
                  </div>
                </label>
              </div>
            </div>

            {/* Orbit Metrics Sliders */}
            <div className="flex flex-col gap-4 border-t border-gray-900 pt-4">
              <label className="text-[10px] font-mono uppercase tracking-wider text-gray-400 flex items-center gap-1">
                <Sliders className="w-3 h-3 text-cyan-500" /> Metric Constraints
              </label>

              {/* MOID Slider */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-gray-400">Max Earth MOID:</span>
                  <span className="text-cyan-400 font-bold">{moidMax.toFixed(2)} AU</span>
                </div>
                <input
                  type="range"
                  min="0.01"
                  max="2.5"
                  step="0.05"
                  value={moidMax}
                  onChange={(e) => setMoidMax(parseFloat(e.target.value))}
                  className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
                <span className="text-[8px] font-mono text-gray-600 uppercase text-right leading-none">
                  Minimum Orbit Intersection Distance
                </span>
              </div>

              {/* Diameter Filter Slider */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-gray-400">Min Size (Diameter):</span>
                  <span className="text-cyan-400 font-bold">
                    {sizeRange[0] === 0 ? 'All sizes' : `> ${sizeRange[0]} km`}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSizeRange([0, 10])}
                    className={`flex-1 py-1 text-[9px] font-mono uppercase border rounded ${
                      sizeRange[0] === 0
                        ? 'border-cyan-500 bg-cyan-950/20 text-cyan-400'
                        : 'border-gray-800 bg-gray-900/30 text-gray-400'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setSizeRange([0.1, 10])}
                    className={`flex-1 py-1 text-[9px] font-mono uppercase border rounded ${
                      sizeRange[0] === 0.1
                        ? 'border-cyan-500 bg-cyan-950/20 text-cyan-400'
                        : 'border-gray-800 bg-gray-900/30 text-gray-400'
                    }`}
                  >
                    &gt; 100m
                  </button>
                  <button
                    onClick={() => setSizeRange([1.0, 10])}
                    className={`flex-1 py-1 text-[9px] font-mono uppercase border rounded ${
                      sizeRange[0] === 1.0
                        ? 'border-cyan-500 bg-cyan-950/20 text-cyan-400'
                        : 'border-gray-800 bg-gray-900/30 text-gray-400'
                    }`}
                  >
                    &gt; 1km
                  </button>
                </div>
              </div>
            </div>

            {/* Planet Scale Settings */}
            <div className="flex flex-col gap-2.5 border-t border-gray-900 pt-4">
              <label className="text-[10px] font-mono uppercase tracking-wider text-gray-400 flex items-center gap-1">
                <Sliders className="w-3 h-3 text-cyan-500" /> Rendering Properties
              </label>

              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-gray-400">Planet Sizes:</span>
                  <span className="text-cyan-400 font-bold">{planetScale.toLocaleString()}x scale</span>
                </div>
                <input
                  type="range"
                  min="1000"
                  max="15000"
                  step="500"
                  value={planetScale}
                  onChange={(e) => setPlanetScale(parseInt(e.target.value))}
                  className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
              </div>
            </div>

            {/* Quick-select highlights */}
            <div className="flex flex-col gap-1.5 border-t border-gray-900 pt-4">
              <label className="text-[10px] font-mono uppercase tracking-wider text-gray-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-cyan-500" /> Historic Highlights
              </label>
              <div className="flex flex-col gap-1.5">
                <button
                  onClick={() => {
                    const apophis = asteroids.find((a) => a.pdes === '99942');
                    if (apophis) setSelectedBody(apophis);
                  }}
                  className="w-full text-left bg-gray-900/30 border border-gray-900 hover:border-cyan-900 hover:bg-cyan-950/10 p-2 rounded text-xs font-mono text-gray-300 transition flex justify-between items-center"
                >
                  <span>99942 Apophis (PHA)</span>
                  <ChevronRight className="w-3 h-3 text-cyan-500" />
                </button>
                <button
                  onClick={() => {
                    const halley = comets.find((c) => c.pdes === '1P');
                    if (halley) {
                      setShowComets(true);
                      setSelectedBody(halley);
                    }
                  }}
                  className="w-full text-left bg-gray-900/30 border border-gray-900 hover:border-purple-900 hover:bg-purple-950/10 p-2 rounded text-xs font-mono text-gray-300 transition flex justify-between items-center"
                >
                  <span>1P/Halley (Comet)</span>
                  <ChevronRight className="w-3 h-3 text-purple-400" />
                </button>
              </div>
            </div>

          </div>

          {/* Sidebar Status Footer (counts) */}
          <div className="border-t border-gray-900 p-3 bg-gray-950 flex flex-col font-mono text-[10px] text-gray-500 gap-0.5 select-none">
            <div className="flex justify-between">
              <span>ACTIVE ASTEROIDS:</span>
              <span className="text-cyan-400 font-bold">
                {visibleAsteroidsCount.toLocaleString()} / {asteroids.length.toLocaleString()}
              </span>
            </div>
            {showComets && (
              <div className="flex justify-between">
                <span>ACTIVE COMETS:</span>
                <span className="text-purple-400 font-bold">{filteredComets.length.toLocaleString()}</span>
              </div>
            )}
            <div className="text-[9px] text-gray-600 uppercase text-center mt-1 leading-none">
              Double-click orbit paths to reset camera angle
            </div>
          </div>
        </aside>

        {/* 3D Visualizer Canvas (Center viewport) */}
        <main className="flex-1 h-full relative overflow-hidden bg-gray-950">
          
          {/* Toggles to open/close sidebars */}
          <button
            onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}
            className="absolute left-3 top-3 z-30 p-2 rounded-md bg-gray-950/80 border border-gray-800 text-gray-300 hover:text-cyan-400 hover:bg-gray-900 backdrop-blur-md shadow-lg"
          >
            {leftSidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
            className="absolute right-3 top-3 z-30 p-2 rounded-md bg-gray-950/80 border border-gray-800 text-gray-300 hover:text-cyan-400 hover:bg-gray-900 backdrop-blur-md shadow-lg"
          >
            {rightSidebarOpen ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          {/* ThreeJS Component Canvas */}
          {planets.length > 0 && (
            <SolarSystemCanvas
              planets={planets}
              asteroids={asteroids}
              comets={comets}
              sentryMap={sentryMap}
              selectedBody={selectedBody}
              onSelectBody={setSelectedBody}
              currentJD={currentJD}
              showComets={showComets}
              showSentryOnly={showSentryOnly}
              asteroidFilter={{
                search,
                classCode,
                hazardStatus,
                sizeRange,
                moidMax,
              }}
              planetScale={planetScale}
              cameraMode={cameraMode}
              setCameraMode={setCameraMode}
            />
          )}

          {/* Follow Camera Locked indicator HUD */}
          {cameraMode === 'follow' && selectedBody && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 px-3 py-1.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase flex items-center gap-1.5 shadow-lg shadow-black/40 backdrop-blur-md animate-pulse">
              <MapPin className="w-3 h-3 text-yellow-400 animate-bounce" />
              Camera Locked to: {('name' in selectedBody ? selectedBody.name : selectedBody.name || selectedBody.pdes)}
              <button
                onClick={() => setCameraMode('free')}
                className="bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/40 rounded px-1.5 py-0.5 ml-1.5 transition"
              >
                Release
              </button>
            </div>
          )}
        </main>

        {/* Right Side: Detailed Body View Panel */}
        <aside
          className={`absolute right-0 top-0 bottom-0 z-20 w-80 md:relative bg-gray-950/95 md:bg-gray-950 border-l border-gray-900 flex flex-col flex-shrink-0 transition-transform duration-300 h-full backdrop-blur-md md:backdrop-blur-none ${
            rightSidebarOpen ? 'translate-x-0' : 'translate-x-full md:absolute'
          }`}
        >
          {selectedBody ? (
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 select-none scrollbar-thin">
              {/* Header card */}
              <div className="flex items-start justify-between border-b border-gray-900 pb-3">
                <div>
                  <div className="text-[9px] font-mono font-bold tracking-wider text-cyan-500 uppercase">
                    {'radius_km' in selectedBody ? 'Planet' : 'M1' in selectedBody ? 'Comet' : 'Asteroid'}
                  </div>
                  <h2 className="text-base font-extrabold font-mono tracking-wide text-gray-100 uppercase">
                    {('radius_km' in selectedBody ? selectedBody.name : selectedBody.name || selectedBody.pdes)}
                  </h2>
                  {!('radius_km' in selectedBody) && selectedBody.name && (
                    <div className="text-[11px] text-gray-400 font-mono">Des: {selectedBody.pdes}</div>
                  )}
                </div>
                <button
                  onClick={() => setSelectedBody(null)}
                  className="text-gray-500 hover:text-gray-300 border border-gray-900 hover:border-gray-800 p-1.5 rounded"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Target / Follow camera locking */}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setCameraMode(cameraMode === 'follow' ? 'free' : 'follow');
                  }}
                  className={`flex-1 py-1.5 text-xs font-mono font-bold uppercase rounded border transition flex items-center justify-center gap-1.5 ${
                    cameraMode === 'follow'
                      ? 'border-yellow-500 bg-yellow-950/20 text-yellow-400 shadow shadow-yellow-500/20'
                      : 'border-gray-800 bg-gray-900/30 text-gray-400 hover:bg-gray-900'
                  }`}
                >
                  <Compass className="w-3.5 h-3.5" />
                  {cameraMode === 'follow' ? 'Camera Locked' : 'Lock Camera'}
                </button>
              </div>

              {/* SENTRY RISK THREAT CARD OVERLAY */}
              {selectedSentryDetails && (
                <div className="glow-panel-red bg-red-950/20 border border-red-500/30 rounded-lg p-3 flex flex-col gap-1.5 animate-pulse-slow">
                  <div className="flex items-center gap-1.5 text-red-400 font-mono font-bold text-xs uppercase">
                    <ShieldAlert className="w-4 h-4 text-red-500" />
                    CNEOS IMPACT THREAT DETECTED
                  </div>
                  <div className="text-[10px] text-gray-300 leading-snug">
                    This object is monitored by JPL&apos;s Sentry System for potential impact risks with Earth.
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-1 border-t border-red-950 pt-2 font-mono text-[10px]">
                    <div>
                      <div className="text-gray-500 text-[8px] uppercase">Impact Probability</div>
                      <div className="text-red-400 font-bold">{(selectedSentryDetails.ip * 100).toFixed(6)}%</div>
                    </div>
                    <div>
                      <div className="text-gray-500 text-[8px] uppercase">Potential Impacts</div>
                      <div className="text-red-400 font-bold">{selectedSentryDetails.n_imp}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 text-[8px] uppercase">Torino Scale Max</div>
                      <div className="text-red-400 font-bold">{selectedSentryDetails.ts_max}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 text-[8px] uppercase">Risk Window</div>
                      <div className="text-red-400 font-bold">{selectedSentryDetails.range}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* 2D TOP-DOWN ORBIT SCHEMATIC */}
              {earthPlanet && (
                <div className="flex flex-col gap-1.5">
                  <span className="text-[9px] font-mono uppercase text-gray-500 tracking-wider">
                    Orbital Plane Alignment
                  </span>
                  <OrbitSchematic
                    selectedBody={selectedBody}
                    earth={earthPlanet}
                    currentJD={currentJD}
                  />
                </div>
              )}

              {/* Orbit Class description / warning */}
              {!('radius_km' in selectedBody) && selectedBody.class && (
                <div className="bg-gray-900/50 border border-gray-900/80 rounded p-2.5 text-[10px] text-gray-400 leading-normal flex flex-col gap-1 font-sans">
                  <span className="font-mono text-cyan-400 font-bold uppercase text-[9px] flex items-center gap-1">
                    <Info className="w-3 h-3 text-cyan-400" />
                    Orbit Class: {orbitClassLabels[selectedBody.class] || selectedBody.class}
                  </span>
                  {orbitClassDescriptions[selectedBody.class] || 'No classification notes available.'}
                </div>
              )}

              {/* Physical Parameters Card */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[9px] font-mono uppercase text-gray-500 tracking-wider">
                  Physical Properties
                </span>
                <div className="bg-gray-900/40 border border-gray-900 rounded p-3 font-mono text-[11px] grid grid-cols-2 gap-y-2 gap-x-3">
                  {'radius_km' in selectedBody ? (
                    <>
                      <div className="col-span-2 flex justify-between border-b border-gray-900 pb-1 mb-1">
                        <span className="text-gray-400 uppercase">Equatorial Radius</span>
                        <span className="text-gray-200 font-bold">{selectedBody.radius_km.toLocaleString()} km</span>
                      </div>
                      <div className="col-span-2 flex justify-between">
                        <span className="text-gray-400 uppercase">Mean Distance</span>
                        <span className="text-gray-200 font-bold">{selectedBody.a.toFixed(3)} AU</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <div className="text-gray-500 text-[8px] uppercase leading-none">Absolute Mag (H)</div>
                        <div className="text-gray-200 font-bold">{'H' in selectedBody ? selectedBody.H : 'M1' in selectedBody ? selectedBody.M1 : 'N/A'}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-[8px] uppercase leading-none">Diameter (Est)</div>
                        <div className="text-gray-200 font-bold">
                          {selectedBody.diameter !== null ? `${selectedBody.diameter.toFixed(2)} km` : 'Unknown'}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-[8px] uppercase leading-none">Albedo (Refl)</div>
                        <div className="text-gray-200 font-bold">
                          {'albedo' in selectedBody && selectedBody.albedo !== null ? selectedBody.albedo.toFixed(3) : 'Unknown'}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-[8px] uppercase leading-none">Rotation Per</div>
                        <div className="text-gray-200 font-bold">
                          {'rot_per' in selectedBody && selectedBody.rot_per !== null ? `${selectedBody.rot_per.toFixed(2)} hrs` : 'Unknown'}
                        </div>
                      </div>
                      {'spec_B' in selectedBody && (selectedBody.spec_B || selectedBody.spec_T) && (
                        <div className="col-span-2 border-t border-gray-900 pt-1.5 flex justify-between text-[10px]">
                          <span className="text-gray-500 uppercase">Spectral Type</span>
                          <span className="text-cyan-400 font-bold">{selectedBody.spec_B || selectedBody.spec_T}</span>
                        </div>
                      )}
                      {'first_obs' in selectedBody && selectedBody.first_obs && (
                        <div className="col-span-2 border-t border-gray-900 pt-1.5 flex justify-between text-[10px]">
                          <span className="text-gray-500 uppercase">First Observed</span>
                          <span className="text-gray-400 font-bold">{selectedBody.first_obs}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Orbital Elements Table */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[9px] font-mono uppercase text-gray-500 tracking-wider">
                  Orbital Kepler Elements
                </span>
                <div className="bg-gray-900/30 border border-gray-900/60 rounded p-2.5 font-mono text-[10px] flex flex-col gap-1.5">
                  <div className="flex justify-between">
                    <span className="text-gray-500" title="Semi-major Axis">a - Semi-major Axis:</span>
                    <span className="text-gray-300 font-bold">{selectedBody.a ? `${selectedBody.a.toFixed(6)} AU` : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500" title="Eccentricity">e - Eccentricity:</span>
                    <span className="text-gray-300 font-bold">{selectedBody.e.toFixed(6)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500" title="Inclination">i - Inclination:</span>
                    <span className="text-gray-300 font-bold">{selectedBody.i.toFixed(5)}°</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500" title="Longitude of Ascending Node">om - Longitude node:</span>
                    <span className="text-gray-300 font-bold">{selectedBody.om.toFixed(5)}°</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500" title="Argument of perihelion">w - Arg perihelion:</span>
                    <span className="text-gray-300 font-bold">{selectedBody.w.toFixed(5)}°</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500" title="Mean anomaly at epoch">ma - Mean anomaly:</span>
                    <span className="text-gray-300 font-bold">{selectedBody.ma.toFixed(5)}°</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-900 pt-1.5">
                    <span className="text-gray-500">Epoch Julian Date:</span>
                    <span className="text-gray-300">{selectedBody.epoch}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Orbital Period:</span>
                    <span className="text-gray-300">
                      {selectedBody.per ? `${(selectedBody.per / 365.25).toFixed(2)} yrs` : 'Hyperbolic/Open'}
                    </span>
                  </div>
                </div>
              </div>

              {/* EARTH CLOSE-APPROACH HISTORY REGISTRY */}
              {!('radius_km' in selectedBody) && (
                <div className="flex flex-col gap-1.5">
                  <span className="text-[9px] font-mono uppercase text-gray-500 tracking-wider flex items-center gap-1.5">
                    <Activity className="w-3 h-3 text-red-500" />
                    Earth Close-Approaches
                  </span>
                  {selectedCloseApproaches.length > 0 ? (
                    <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1 border border-gray-900 rounded p-1.5 bg-gray-900/20 scrollbar-thin">
                      {selectedCloseApproaches
                        .sort((a, b) => Math.abs(a.jd - currentJD) - Math.abs(b.jd - currentJD)) // Sort closest to active JD first!
                        .map((ca, idx) => {
                          const distLD = ca.dist * 389.17;
                          const isClosest = idx === 0;
                          return (
                            <div
                              key={ca.cd}
                              className={`p-2 rounded font-mono text-[10px] leading-tight flex flex-col gap-0.5 border ${
                                isClosest
                                  ? 'bg-red-950/20 border-red-500/30 text-red-300'
                                  : 'bg-gray-900/50 border-gray-950 text-gray-400'
                              }`}
                            >
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-gray-200">{ca.cd.split(' ')[0]}</span>
                                {isClosest && (
                                  <span className="text-[7px] bg-red-600 text-white px-1 py-0.5 rounded uppercase font-bold leading-none animate-pulse">
                                    Closest Event
                                  </span>
                                )}
                              </div>
                              <div className="flex justify-between mt-1">
                                <span>Distance Nominal:</span>
                                <span className="font-bold text-gray-300">{ca.dist.toFixed(4)} AU</span>
                              </div>
                              <div className="flex justify-between text-[9px]">
                                <span>Distance (Lunar):</span>
                                <span className="text-red-400 font-bold">{distLD.toFixed(1)} Lunar Distances (LD)</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Relative Velocity:</span>
                                <span className="text-gray-300">{ca.v_rel.toFixed(2)} km/s</span>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  ) : (
                    <div className="text-[10px] font-mono text-gray-600 text-center py-4 bg-gray-900/20 rounded border border-dashed border-gray-900">
                      No registered upcoming close-approaches to Earth.
                    </div>
                  )}
                </div>
              )}

              {/* External NASA/JPL Link */}
              {!('radius_km' in selectedBody) && (
                <a
                  href={`https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html#/?sstr=${selectedBody.spkid || selectedBody.pdes}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 text-center text-[10px] font-mono border border-gray-800 hover:border-cyan-500 hover:bg-cyan-950/10 text-cyan-500 py-1.5 rounded transition flex items-center justify-center gap-1.5 shadow-md shadow-black/10"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  JPL Small-Body Database Lookup
                </a>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 select-none font-mono text-xs text-gray-600 border-dashed">
              <Compass className="w-8 h-8 text-gray-800 mb-3 animate-spin-slow" />
              <p>NO CELESTIAL OBJECT SELECTED</p>
              <p className="text-[10px] text-gray-700 uppercase tracking-wider mt-1 max-w-[200px]">
                Click an orbital body on the map or search in the catalog sidebar.
              </p>
            </div>
          )}
        </aside>

      </div>

      {/* 4. Bottom HUD: Timeline Scrubber and Controls */}
      <footer className="border-t border-gray-900 bg-gray-950 px-4 py-3 select-none flex-shrink-0 z-10">
        <div className="flex flex-col gap-3 max-w-7xl mx-auto">
          
          {/* Timeline slider (scrubber) */}
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono text-gray-500 leading-none">2010</span>
            <input
              type="range"
              min={dateToJulianDate(new Date('2010-01-01'))}
              max={dateToJulianDate(new Date('2040-12-31'))}
              step="1"
              value={currentJD}
              onChange={(e) => {
                setCurrentJD(parseFloat(e.target.value));
                if (!isPaused) setIsPaused(true); // pause on manually scrubbing! Great UX detail
              }}
              className="flex-1 h-1.5 bg-gray-900 border border-gray-800 rounded-lg appearance-none cursor-ew-resize accent-cyan-500"
            />
            <span className="text-[10px] font-mono text-gray-500 leading-none">2040</span>
          </div>

          {/* Time speed and play controls */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            
            {/* Calendar date picker / calendar HUD */}
            <div className="flex items-center gap-2 font-mono">
              <div className="flex items-center gap-1.5 text-xs text-cyan-400 bg-cyan-950/40 border border-cyan-900/60 px-2.5 py-1.5 rounded shadow shadow-cyan-950/30">
                <Calendar className="w-3.5 h-3.5" />
                <span className="font-bold">UT DATE:</span>
                <input
                  type="date"
                  value={datePickerValue}
                  onChange={handleDateChange}
                  className="bg-transparent text-cyan-300 font-bold border-none outline-none cursor-pointer focus:ring-0 w-[110px]"
                />
              </div>
              <button
                onClick={() => {
                  setCurrentJD(dateToJulianDate(new Date()));
                  setIsPaused(true);
                }}
                className="p-1.5 rounded border border-gray-800 hover:border-gray-700 bg-gray-900 text-gray-400 hover:text-gray-200 transition text-xs flex items-center gap-1"
                title="Reset to Today"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Today</span>
              </button>
            </div>

            {/* Play, Pause, Speeds */}
            <div className="flex items-center gap-2">
              {/* Play / Pause button */}
              <button
                onClick={() => setIsPaused(!isPaused)}
                className={`p-2 md:px-4 rounded-md font-mono font-bold text-xs uppercase flex items-center gap-1.5 transition shadow-lg ${
                  isPaused
                    ? 'bg-cyan-600 hover:bg-cyan-500 text-white border border-cyan-500'
                    : 'bg-gray-800 hover:bg-gray-700 text-cyan-400 border border-gray-700'
                }`}
              >
                {isPaused ? (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span className="hidden sm:inline">Play Orbit</span>
                  </>
                ) : (
                  <>
                    <Pause className="w-4 h-4 fill-current" />
                    <span className="hidden sm:inline">Pause Orbit</span>
                  </>
                )}
              </button>

              {/* Speed Buttons */}
              <div className="flex border border-gray-900 rounded bg-gray-900/40 p-0.5 shadow-inner">
                {([
                  { label: '0.1d/s', val: 0.1 },
                  { label: '1d/s', val: 1 },
                  { label: '10d/s', val: 10 },
                  { label: '30d/s', val: 30 },
                  { label: '365d/s', val: 365 },
                ] as const).map((speed) => (
                  <button
                    key={speed.label}
                    onClick={() => {
                      setTimeSpeed(speed.val);
                      if (isPaused) setIsPaused(false); // Auto play when selecting speed
                    }}
                    className={`px-2 py-1 text-[10px] font-mono rounded transition ${
                      timeSpeed === speed.val && !isPaused
                        ? 'bg-cyan-950 border border-cyan-800/40 text-cyan-400'
                        : 'border-transparent text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    {speed.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Scale HUD info / coordinates (Right) */}
            <div className="hidden md:flex items-center gap-4 text-[10px] font-mono text-gray-500">
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                <span>1 AU ≈ 149.6M km</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                <span>Selected Orbit Line Active</span>
              </div>
            </div>

          </div>

        </div>
      </footer>
    </div>
  );
}
