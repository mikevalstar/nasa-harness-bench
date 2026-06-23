// Time conversions and helpers.

const MS_PER_DAY = 86400000;

// Julian date ↔ Date
export function jdToDate(jd: number): Date {
  return new Date((jd - 2440587.5) * MS_PER_DAY);
}

export function dateToJd(d: Date): number {
  return d.getTime() / MS_PER_DAY + 2440587.5;
}

export function jdToIso(jd: number): string {
  return jdToDate(jd).toISOString();
}

export function formatDate(jd: number, withTime = true): string {
  const d = jdToDate(jd);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  if (!withTime) return `${y}-${m}-${day}`;
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mm = String(d.getUTCMinutes()).padStart(2, '0');
  const ss = String(d.getUTCSeconds()).padStart(2, '0');
  return `${y}-${m}-${day} ${hh}:${mm}:${ss} UTC`;
}

export function formatDateShort(jd: number): string {
  return formatDate(jd, false);
}

export function formatNumber(n: number | null | undefined, sig = 4): string {
  if (n === null || n === undefined || !isFinite(n)) return '—';
  if (n === 0) return '0';
  const abs = Math.abs(n);
  if (abs >= 1e6 || abs < 1e-3) return n.toExponential(2);
  return n.toPrecision(sig).replace(/\.?0+$/, '');
}

export function formatAu(au: number): string {
  if (au === null || au === undefined || !isFinite(au)) return '—';
  return `${formatNumber(au)} au`;
}

export function formatKm(km: number): string {
  if (km === null || km === undefined || !isFinite(km)) return '—';
  if (km > 1e6) return `${formatNumber(km / 1e6)} Gm`;
  if (km > 1e3) return `${formatNumber(km / 1e3)} Mm`;
  return `${formatNumber(km)} m`;
}

export function formatDays(d: number): string {
  if (d === null || d === undefined || !isFinite(d)) return '—';
  if (d < 1) return `${(d * 24).toFixed(2)} h`;
  if (d < 365.25) return `${d.toFixed(2)} d`;
  return `${(d / 365.25).toFixed(2)} yr`;
}

export function clamp(x: number, a: number, b: number): number {
  return x < a ? a : x > b ? b : x;
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function wrap360(deg: number): number {
  let d = deg % 360;
  if (d < 0) d += 360;
  return d;
}

// Color helpers
export function hexToRgb(hex: number): [number, number, number] {
  return [(hex >> 16) / 255, ((hex >> 8) & 0xff) / 255, (hex & 0xff) / 255];
}

// Build a small "Munsell-ish" color from a magnitude value.
export function sizeToColor(diameter_km: number | null, hasAlbedo: boolean): number {
  // Default: cool grey.
  if (diameter_km == null) return 0xc8d1e3;
  if (diameter_km > 30) return 0x9aa6c2;
  if (diameter_km > 10) return 0xb6c0d6;
  if (diameter_km > 3) return 0xc8d1e3;
  if (diameter_km > 1) return 0xd4dbe8;
  return 0xdee3ef;
}
