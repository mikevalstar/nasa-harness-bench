/** Number formatting shared by the panels. */
import { AU_KM, LD_AU } from "./orbit.ts";

export const sig = (value: number, digits = 3): string =>
  Number(value.toPrecision(digits)).toLocaleString("en-US", { maximumSignificantDigits: digits });

export function formatDiameter(km: number): string {
  if (Number.isNaN(km)) return "unknown";
  return km >= 1 ? `${sig(km)} km` : `${sig(km * 1000, km < 0.01 ? 2 : 3)} m`;
}

/** Distances near Earth read best in lunar distances, larger ones in au. */
export function formatDistance(au: number): string {
  if (au < 0.1) return `${sig(au / LD_AU)} LD`;
  return `${sig(au)} au`;
}

export const formatKm = (au: number): string => `${sig(au * AU_KM)} km`;

export function formatOdds(probability: number): string {
  if (probability >= 0.01) return `${sig(probability * 100, 2)}%`;
  return `1 in ${Math.round(Number((1 / probability).toPrecision(2))).toLocaleString("en-US")}`;
}

export function formatPeriod(days: number): string {
  if (days < 1000) return `${sig(days)} days`;
  return `${sig(days / 365.25)} years`;
}
