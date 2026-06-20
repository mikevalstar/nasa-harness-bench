// Julian Date helpers. We keep "time" everywhere as a full Julian Date (JD).
// Orbital elements in the data use JD epochs; the UI converts to/from calendar
// dates for display and scrubbing.

export const J2000 = 2451545.0;
export const DAY_MS = 86400000;

// Unix epoch (1970-01-01T00:00:00Z) in Julian Date.
const UNIX_EPOCH_JD = 2440587.5;

export function dateToJD(date: Date): number {
  return date.getTime() / DAY_MS + UNIX_EPOCH_JD;
}

export function jdToDate(jd: number): Date {
  return new Date((jd - UNIX_EPOCH_JD) * DAY_MS);
}

export function nowJD(): number {
  return dateToJD(new Date());
}

// Format a JD as a compact UTC calendar string.
export function formatJD(jd: number): string {
  const d = jdToDate(jd);
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const y = d.getUTCFullYear();
  const mo = months[d.getUTCMonth()];
  const day = String(d.getUTCDate()).padStart(2, "0");
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  return `${y} ${mo} ${day} ${hh}:${mm} UTC`;
}

// YYYY-MM-DD for <input type="date">
export function jdToInputDate(jd: number): string {
  const d = jdToDate(jd);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function inputDateToJD(value: string): number | null {
  const m = /^(-?\d{1,6})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return null;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  if (isNaN(d.getTime())) return null;
  return dateToJD(d);
}
