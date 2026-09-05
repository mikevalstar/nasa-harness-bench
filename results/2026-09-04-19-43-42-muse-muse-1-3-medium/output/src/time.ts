// Julian-date <-> calendar conversions (proleptic Gregorian, astronomical).

export function jdFromDate(y: number, m: number, d: number, hh = 0, mm = 0, ss = 0): number {
  if (m <= 2) {
    y -= 1;
    m += 12;
  }
  const A = Math.floor(y / 100);
  const B = 2 - A + Math.floor(A / 4);
  const dayFrac = d + (hh + mm / 60 + ss / 3600) / 24;
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + dayFrac + B - 1524.5;
}

export function dateFromJd(jd: number): Date {
  return new Date((jd - 2440587.5) * 86400000);
}

export function parseDateInput(s: string): number | null {
  const m = /^(\d{3,4})-(\d{1,2})-(\d{1,2})$/.exec(s.trim());
  if (!m) return null;
  const y = +m[1];
  const mo = +m[2];
  const d = +m[3];
  if (mo < 1 || mo > 12 || d < 1 || d > 31 || y < 1500 || y > 2500) return null;
  return jdFromDate(y, mo, d);
}

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatJd(jd: number): string {
  const t = dateFromJd(jd);
  const y = t.getUTCFullYear();
  const pad = (v: number) => String(v).padStart(2, '0');
  return `${y}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())} ` +
    `${pad(t.getUTCHours())}:${pad(t.getUTCMinutes())} UTC`;
}

export function formatDateShort(jd: number): string {
  const t = dateFromJd(jd);
  return `${t.getUTCFullYear()}-${MON[t.getUTCMonth()]}-${String(t.getUTCDate()).padStart(2, '0')}`;
}
