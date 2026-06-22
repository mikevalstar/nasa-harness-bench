/** Julian date ↔ calendar conversions (UTC, sufficient for visualization) */

const MONTHS = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];

function isLeapYear(y: number): boolean {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}

/** Calendar date (year, month 1-12, day + fraction) → Julian date */
export function calendarToJD(year: number, month: number, day: number): number {
  let y = year;
  let m = month;
  if (m <= 2) {
    y -= 1;
    m += 12;
  }
  const A = Math.floor(y / 100);
  const B = 2 - A + Math.floor(A / 4);
  const dayOfYear =
    day +
    MONTHS[m - 1] +
    (m > 2 && isLeapYear(year) ? 1 : 0);
  const jd =
    Math.floor(365.25 * (y + 4716)) +
    Math.floor(30.6001 * (m + 1)) +
    dayOfYear +
    B -
    1524.5;
  return jd;
}

export function dateToJD(d: Date): number {
  const frac =
    d.getUTCHours() / 24 +
    d.getUTCMinutes() / 1440 +
    d.getUTCSeconds() / 86400;
  return calendarToJD(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate() + frac);
}

export function jdToDate(jd: number): Date {
  const Z = Math.floor(jd + 0.5);
  const F = jd + 0.5 - Z;
  let A = Z;
  if (Z >= 2299161) {
    const alpha = Math.floor((Z - 1867216.25) / 36524.25);
    A = Z + 1 + alpha - Math.floor(alpha / 4);
  }
  const B = A + 1524;
  const C = Math.floor((B - 122.1) / 365.25);
  const D = Math.floor(365.25 * C);
  const E = Math.floor((B - D) / 30.6001);
  const day = B - D - Math.floor(30.6001 * E) + F;
  const month = E < 14 ? E - 1 : E - 13;
  const year = month > 2 ? C - 4716 : C - 4715;
  const dayInt = Math.floor(day);
  const frac = day - dayInt;
  const hours = Math.floor(frac * 24);
  const minutes = Math.floor((frac * 24 - hours) * 60);
  const seconds = Math.floor(((frac * 24 - hours) * 60 - minutes) * 60);
  return new Date(Date.UTC(year, month - 1, dayInt, hours, minutes, seconds));
}

export function formatJD(jd: number): string {
  const d = jdToDate(jd);
  return d.toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
}

export function formatDateShort(jd: number): string {
  const d = jdToDate(jd);
  return d.toISOString().slice(0, 10);
}

/** Default time range for slider: 2000 – 2040 */
export const JD_MIN = calendarToJD(2000, 1, 1);
export const JD_MAX = calendarToJD(2040, 12, 31);
export const JD_DEFAULT = calendarToJD(2024, 6, 21);
