import { dateToJD } from './constants';

export type ClockListener = (jd: number) => void;

/** Simulation clock: tracks the current Julian date and advances it at a
 * configurable speed (in simulated days per real second) when playing. */
export class SimClock {
  private jd: number;
  private speedDaysPerSecond: number;
  private playing = false;
  private listeners = new Set<ClockListener>();

  constructor(startDate = new Date()) {
    this.jd = dateToJD(startDate);
    this.speedDaysPerSecond = 1;
  }

  get julianDate(): number {
    return this.jd;
  }

  get isPlaying(): boolean {
    return this.playing;
  }

  get speed(): number {
    return this.speedDaysPerSecond;
  }

  setSpeed(daysPerSecond: number): void {
    this.speedDaysPerSecond = daysPerSecond;
  }

  play(): void {
    this.playing = true;
  }

  pause(): void {
    this.playing = false;
  }

  togglePlay(): void {
    this.playing = !this.playing;
  }

  setJulianDate(jd: number): void {
    this.jd = jd;
    this.notify();
  }

  step(realDeltaSeconds: number): void {
    if (!this.playing) return;
    this.jd += this.speedDaysPerSecond * realDeltaSeconds;
    this.notify();
  }

  onChange(fn: ClockListener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private notify(): void {
    for (const fn of this.listeners) fn(this.jd);
  }
}
