// Simulation clock. Holds the current Julian date and advances it by a
// signed rate (days per real second) when playing.

import { dateToJD, jdToDate } from "./kepler";

export class TimeController {
  jd: number;
  rate = 5; // days per second
  playing = true;
  onChange: (() => void) | null = null;

  constructor(jd?: number) {
    this.jd = jd ?? dateToJD(new Date());
  }

  tick(dtSeconds: number) {
    if (this.playing) {
      this.jd += this.rate * dtSeconds;
    }
  }

  setDate(d: Date) {
    this.jd = dateToJD(d);
    this.onChange?.();
  }

  setJD(jd: number) {
    this.jd = jd;
    this.onChange?.();
  }

  get date(): Date {
    return jdToDate(this.jd);
  }
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export function formatDate(d: Date): string {
  return `${d.getUTCDate().toString().padStart(2, "0")} ${
    MONTHS[d.getUTCMonth()]
  } ${d.getUTCFullYear()}`;
}

export function formatDateTime(d: Date): string {
  return `${formatDate(d)} ${d
    .getUTCHours()
    .toString()
    .padStart(2, "0")}:${d.getUTCMinutes().toString().padStart(2, "0")} UTC`;
}
