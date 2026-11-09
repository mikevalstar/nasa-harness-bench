/** Julian dates <-> JS dates and display formatting. All display is UTC. */

const UNIX_EPOCH_JD = 2440587.5;
const DAY_MS = 86_400_000;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const jdFromDate = (date: Date): number => date.getTime() / DAY_MS + UNIX_EPOCH_JD;
export const dateFromJd = (jd: number): Date => new Date((jd - UNIX_EPOCH_JD) * DAY_MS);
export const jdFromYear = (year: number): number => jdFromDate(new Date(Date.UTC(year, 0, 1)));

/** The app covers the span of the close-approach table. */
export const JD_MIN = jdFromYear(1900);
export const JD_MAX = jdFromYear(2200);

const pad = (value: number): string => String(value).padStart(2, "0");

export function formatDate(jd: number): string {
  const d = dateFromJd(jd);
  return `${d.getUTCFullYear()} ${MONTHS[d.getUTCMonth()]} ${pad(d.getUTCDate())}`;
}

export function formatDateTime(jd: number): string {
  const d = dateFromJd(jd);
  return `${formatDate(jd)} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
}

/** `YYYY-MM-DD`, the value format of `<input type="date">`. */
export function isoDate(jd: number): string {
  return dateFromJd(jd).toISOString().slice(0, 10);
}

export function jdFromIsoDate(value: string): number | null {
  const ms = Date.parse(`${value}T00:00:00Z`);
  return Number.isNaN(ms) ? null : ms / DAY_MS + UNIX_EPOCH_JD;
}
