import { KM_PER_AU } from "./orbit.ts";

export const AU_PER_LD = 384_400 / KM_PER_AU;

// Values that round to zero are shown as 0 rather than "-0".
const num = (x: number, digits: number) =>
  (Math.abs(x) < 0.5 * 10 ** -digits ? 0 : x).toLocaleString("en-US", { maximumFractionDigits: digits, minimumFractionDigits: 0 });

export const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Distance with the most readable unit: lunar distances when close, au otherwise. */
export function fmtDistance(au: number): string {
  if (au < 0.05) {
    const ld = au / AU_PER_LD;
    const km = au * KM_PER_AU;
    return ld < 1 ? `${num(km, 0)} km (${ld.toFixed(2)} LD)` : `${ld.toFixed(ld < 10 ? 2 : 1)} LD (${num(km / 1e6, 2)}M km)`;
  }
  return `${au.toFixed(au < 1 ? 4 : 3)} au (${num((au * KM_PER_AU) / 1e6, 1)}M km)`;
}

export function fmtDiameter(km: number): string {
  if (!Number.isFinite(km)) return "—";
  return km < 1 ? `${num(km * 1000, km < 0.1 ? 1 : 0)} m` : `${num(km, 2)} km`;
}

/** "1 in 2,700" style probability. */
export function fmtOdds(p: number): string {
  if (p <= 0) return "0";
  const inv = 1 / p;
  return inv < 10 ? `${(p * 100).toFixed(1)}%` : `1 in ${num(Number(inv.toPrecision(2)), 0)}`;
}

export function fmtRelDays(days: number): string {
  const a = Math.abs(days);
  const s =
    a < 1 ? `${Math.round(a * 24)} h` : a < 60 ? `${Math.round(a)} d` : a < 730 ? `${Math.round(a / 30.44)} mo` : `${(a / 365.25).toFixed(1)} yr`;
  return days >= 0 ? `in ${s}` : `${s} ago`;
}

export const fmtNum = (x: number | null | undefined, digits = 3, unit = "") =>
  x == null || !Number.isFinite(x) ? "—" : `${num(x, digits)}${unit}`;

/** Everyday objects for conveying asteroid size. */
const REFERENCES: [metres: number, name: string][] = [
  [4.5, "a car"],
  [12, "a bus"],
  [30, "a blue whale"],
  [70, "a jumbo jet's wingspan"],
  [105, "a football pitch"],
  [330, "the Eiffel Tower"],
  [830, "the Burj Khalifa"],
  [2700, "the Golden Gate Bridge"],
  [8850, "Mount Everest"],
  [21000, "Manhattan's length"],
];

export function sizeComparison(km: number): string {
  if (!Number.isFinite(km)) return "";
  const m = km * 1000;
  let best = REFERENCES[0]!;
  for (const r of REFERENCES) if (Math.abs(Math.log(m / r[0])) < Math.abs(Math.log(m / best[0]))) best = r;
  const ratio = m / best[0];
  return ratio > 0.8 && ratio < 1.25 ? `about the size of ${best[1]}` : `≈ ${ratio < 1 ? ratio.toFixed(2) : ratio.toFixed(1)}× ${best[1]}`;
}

/** Plain-language reading of the Palermo technical scale. */
export function palermoMeaning(ps: number): string {
  if (ps >= 0) return "risk above the background level — merits concern";
  if (ps >= -2) return "merits careful monitoring";
  return "no likely consequences (below background risk)";
}
