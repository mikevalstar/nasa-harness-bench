/** The one mutable app state object and a small typed pub/sub around it. */
import type { BodyRef } from "./bodies.ts";
import { ORBIT_GROUPS, type OrbitGroup } from "./data/catalog.ts";

export const COLOR_MODES = ["hazard", "class", "size", "moid", "risk"] as const;
export type ColorMode = (typeof COLOR_MODES)[number];

export interface Filters {
  groups: Record<OrbitGroup, boolean>;
  phaOnly: boolean;
  sentryOnly: boolean;
  /** Metres; 0 means any size, including unknown. */
  minDiameterM: number;
  maxMoidAu: number | null;
  /** Keep only objects with a recorded Earth close approach matching these bounds. */
  approachFromYear: number | null;
  approachToYear: number | null;
  approachMaxLd: number | null;
}

export const defaultFilters = (): Filters => ({
  groups: Object.fromEntries(ORBIT_GROUPS.map((g) => [g, true])) as Record<OrbitGroup, boolean>,
  phaOnly: false,
  sentryOnly: false,
  minDiameterM: 0,
  maxMoidAu: null,
  approachFromYear: null,
  approachToYear: null,
  approachMaxLd: null,
});

export const LAYERS = ["comets", "orbits", "labels", "grid", "flybys"] as const;
export type Layer = (typeof LAYERS)[number];

/** Playback speeds in simulated days per real second. */
export const SPEEDS = [
  { daysPerSecond: 1 / 24, label: "1 hour/s" },
  { daysPerSecond: 1, label: "1 day/s" },
  { daysPerSecond: 7, label: "1 week/s" },
  { daysPerSecond: 30, label: "1 month/s" },
  { daysPerSecond: 365.25, label: "1 year/s" },
  { daysPerSecond: 3652.5, label: "10 years/s" },
] as const;

export interface AppState {
  jd: number;
  playing: boolean;
  speedIndex: number;
  direction: 1 | -1;
  selected: BodyRef | null;
  follow: boolean;
  colorMode: ColorMode;
  filters: Filters;
  layers: Record<Layer, boolean>;
}

/**
 * `time` fires when the date jumps (scrub, date entry, link), not on every played frame;
 * views that track the clock continuously are ticked by the frame loop instead.
 */
export type Topic = "selection" | "follow" | "filters" | "colorMode" | "layers" | "transport" | "time";

export class Store {
  readonly state: AppState;
  private readonly listeners = new Map<Topic, Array<() => void>>();

  constructor(initial: AppState) {
    this.state = initial;
  }

  on(topics: Topic | Topic[], listener: () => void): void {
    for (const topic of Array.isArray(topics) ? topics : [topics]) {
      const list = this.listeners.get(topic) ?? [];
      list.push(listener);
      this.listeners.set(topic, list);
    }
  }

  emit(topic: Topic): void {
    for (const listener of this.listeners.get(topic) ?? []) listener();
  }

  select(ref: BodyRef | null, follow = false): void {
    this.state.selected = ref;
    this.state.follow = ref !== null && follow;
    this.emit("selection");
    this.emit("follow");
  }

  setFollow(follow: boolean): void {
    this.state.follow = follow && this.state.selected !== null;
    this.emit("follow");
  }

  /** Move the clock to a date and stop playback there. */
  jumpTo(jd: number): void {
    this.state.jd = jd;
    this.state.playing = false;
    this.emit("time");
    this.emit("transport");
  }
}
