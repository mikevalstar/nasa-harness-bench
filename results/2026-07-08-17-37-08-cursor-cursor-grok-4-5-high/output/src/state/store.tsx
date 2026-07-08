import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { AppData, Filters, Selection } from "../data/types";
import {
  defaultUrlState,
  filtersFromUrl,
  readUrlState,
  writeUrlState,
  type UrlState,
} from "./url";
import { asteroidElements, cometElements } from "../data/load";
import { positionAt } from "../astro/kepler";

type CamPose = NonNullable<UrlState["cam"]>;

type Store = {
  data: AppData;
  jd: number;
  setJd: (jd: number) => void;
  playing: boolean;
  setPlaying: (p: boolean) => void;
  speed: number;
  setSpeed: (s: number) => void;
  selection: Selection;
  setSelection: (s: Selection) => void;
  follow: boolean;
  setFollow: (f: boolean) => void;
  filters: Filters;
  setFilters: (fn: (f: Filters) => Filters) => void;
  cam: CamPose | undefined;
  setCam: (c: CamPose) => void;
  visibleAsteroidIndices: number[];
  selectedPosition: { x: number; y: number; z: number } | null;
  hoverLabel: string | null;
  setHoverLabel: (s: string | null) => void;
};

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ data, children }: { data: AppData; children: ReactNode }) {
  const initial = useMemo(() => readUrlState(), []);
  const [jd, setJdState] = useState(initial.jd);
  const [playing, setPlaying] = useState(initial.playing);
  const [speed, setSpeed] = useState(initial.speed);
  const [selection, setSelectionState] = useState<Selection>(initial.selection);
  const [follow, setFollow] = useState(initial.follow);
  const [filters, setFiltersState] = useState<Filters>(() => filtersFromUrl(initial));
  const [cam, setCam] = useState<CamPose | undefined>(initial.cam);
  const [hoverLabel, setHoverLabel] = useState<string | null>(null);

  const setJd = useCallback((v: number) => setJdState(v), []);
  const setSelection = useCallback((s: Selection) => {
    setSelectionState(s);
    if (s) setFollow(true);
  }, []);
  const setFilters = useCallback((fn: (f: Filters) => Filters) => {
    setFiltersState(fn);
  }, []);

  // Time tick
  const lastRef = useRef<number | null>(null);
  useEffect(() => {
    if (!playing) {
      lastRef.current = null;
      return;
    }
    let raf = 0;
    const tick = (t: number) => {
      if (lastRef.current == null) lastRef.current = t;
      const dt = (t - lastRef.current) / 1000;
      lastRef.current = t;
      setJdState((j) => j + dt * speed);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, speed]);

  // URL sync (throttled)
  useEffect(() => {
    const id = window.setTimeout(() => {
      writeUrlState({
        jd,
        playing,
        speed,
        selection,
        follow,
        showComets: filters.showComets,
        phaOnly: filters.phaOnly,
        sentryOnly: filters.sentryOnly,
        query: filters.query,
        cam,
      });
    }, 250);
    return () => clearTimeout(id);
  }, [jd, playing, speed, selection, follow, filters, cam]);

  const visibleAsteroidIndices = useMemo(() => {
    const { asteroids } = data;
    const q = filters.query.trim().toLowerCase();
    const out: number[] = [];
    const classFilter = filters.classes.size > 0;
    for (let i = 0; i < asteroids.count; i++) {
      const pha = asteroids.flags[i * 3] === 1;
      const hasSentry = asteroids.flags[i * 3 + 2] === 1;
      const classIndex = asteroids.flags[i * 3 + 1];
      const cls = asteroids.classes[classIndex];
      if (filters.phaOnly && !pha) continue;
      if (filters.sentryOnly && !hasSentry) continue;
      if (classFilter && !filters.classes.has(cls)) continue;
      const o = i * asteroids.floatStride;
      const diameter = asteroids.floats[o + 10];
      const moid = asteroids.floats[o + 11];
      if (filters.minDiameter != null && !(diameter >= filters.minDiameter)) continue;
      if (filters.maxMoid != null && !(moid <= filters.maxMoid)) continue;
      if (q) {
        const meta = asteroids.catalog[i];
        const hay = `${meta.full_name} ${meta.pdes} ${meta.name ?? ""}`.toLowerCase();
        if (!hay.includes(q)) continue;
      }
      out.push(i);
    }
    return out;
  }, [data, filters]);

  const selectedPosition = useMemo(() => {
    if (!selection) return null;
    if (selection.kind === "planet") {
      const p = data.planets[selection.index];
      if (!p) return null;
      return positionAt(
        { a: p.a, e: p.e, i: p.i, om: p.om, w: p.w, ma: p.ma, epoch: p.epoch, n: p.n },
        jd,
      );
    }
    if (selection.kind === "asteroid") {
      const el = asteroidElements(data.asteroids, selection.index);
      return positionAt(el, jd);
    }
    const el = cometElements(data.comets, selection.index);
    return positionAt(el, jd);
  }, [selection, data, jd]);

  const value: Store = {
    data,
    jd,
    setJd,
    playing,
    setPlaying,
    speed,
    setSpeed,
    selection,
    setSelection,
    follow,
    setFollow,
    filters,
    setFilters,
    cam,
    setCam,
    visibleAsteroidIndices,
    selectedPosition,
    hoverLabel,
    setHoverLabel,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error("useStore outside provider");
  return s;
}

export { defaultUrlState };
