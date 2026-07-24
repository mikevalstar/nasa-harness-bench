import { AU_KM } from './astro';

export function fmt(v: number | null | undefined, digits = 3, unit = ''): string {
  if (v === null || v === undefined || !Number.isFinite(v)) return '—';
  const a = Math.abs(v);
  let s: string;
  if (a !== 0 && (a < 1e-3 || a >= 1e6)) s = v.toExponential(2);
  else s = v.toFixed(digits).replace(/\.?0+$/, '');
  return unit ? `${s} ${unit}` : s;
}

export function fmtInt(v: number | null | undefined): string {
  if (v === null || v === undefined || !Number.isFinite(v)) return '—';
  return Math.round(v).toLocaleString('en-US');
}

/** Diameter in km -> a readable size string. */
export function fmtSize(km: number | null | undefined): string {
  if (km === null || km === undefined || !Number.isFinite(km) || km <= 0) return '—';
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(km < 10 ? 2 : 1)} km`;
}

/** Distance in au -> au plus lunar distances, which is how approaches are read. */
export function fmtDist(au: number | null | undefined): string {
  if (au === null || au === undefined || !Number.isFinite(au)) return '—';
  const ld = au / 0.00256955529;
  return `${au.toFixed(5)} au (${ld.toFixed(1)} LD)`;
}

export function fmtAuKm(au: number): string {
  return `${(au * AU_KM).toLocaleString('en-US', { maximumFractionDigits: 0 })} km`;
}

export function fmtProb(p: number | null | undefined): string {
  if (p === null || p === undefined || !Number.isFinite(p) || p <= 0) return '—';
  const oneIn = Math.round(1 / p);
  return `${p.toExponential(2)}  (1 in ${oneIn.toLocaleString('en-US')})`;
}

export function fmtDuration(days: number): string {
  const a = Math.abs(days);
  if (a < 1) return `${(a * 24).toFixed(1)} h`;
  if (a < 365) return `${a.toFixed(a < 10 ? 1 : 0)} d`;
  return `${(a / 365.25).toFixed(1)} yr`;
}

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

/** Torino scale colour band. */
export function torinoColor(ts: number | null | undefined): string {
  if (ts === null || ts === undefined) return '#8892a4';
  if (ts === 0) return '#7f8ea6';
  if (ts <= 1) return '#4ade80';
  if (ts <= 4) return '#ffd166';
  if (ts <= 7) return '#ff9f43';
  return '#ff5470';
}
