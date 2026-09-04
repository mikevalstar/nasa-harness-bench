export const J2000_JD = 2451545.0;
export const MS_PER_DAY = 86400000;
export const UNIX_EPOCH_JD = 2440587.5;

export function dateToJulianDate(date: Date): number {
  return date.getTime() / MS_PER_DAY + UNIX_EPOCH_JD;
}

export function julianDateToDate(jd: number): Date {
  return new Date((jd - UNIX_EPOCH_JD) * MS_PER_DAY);
}

export function formatJulianDate(jd: number): string {
  const d = julianDateToDate(jd);
  return d.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
}

export function formatShortDate(jd: number): string {
  const d = julianDateToDate(jd);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseDateInput(str: string): number | null {
  const parsed = Date.parse(str + (str.includes('T') ? '' : 'T00:00:00Z'));
  if (isNaN(parsed)) return null;
  return dateToJulianDate(new Date(parsed));
}
