/** Astronomical / scene constants */

export const AU_KM = 149_597_870.7;
export const SUN_RADIUS_KM = 696_000;
export const GM_SUN = 0.0002959122082855911; // au³/day²

/** Scene units: 1 unit = 1 AU */
export const SCENE_SCALE = 1;

/** Visual radii (scene units) — exaggerated for visibility */
export const SUN_VISUAL_RADIUS = 0.045;
export const PLANET_VISUAL_SCALE = 0.0008; // applied to radius_km / AU_KM then boosted
export const MIN_PLANET_RADIUS = 0.008;
export const MAX_PLANET_RADIUS = 0.035;

export const PLANET_COLORS: Record<string, string> = {
  Mercury: "#b1b1b1",
  Venus: "#e8cda0",
  Earth: "#4f8fba",
  Mars: "#c1440e",
  Jupiter: "#d4a574",
  Saturn: "#e6d3a3",
  Uranus: "#7de3e0",
  Neptune: "#4169e1",
};

export const CLASS_LABELS: Record<string, string> = {
  APO: "Apollo",
  ATE: "Aten",
  AMO: "Amor",
  IEO: "Atira (IEO)",
  JFc: "Jupiter-family comet",
  JFC: "Jupiter-family comet",
  HTC: "Halley-type comet",
  ETc: "Encke-type comet",
  PAR: "Parabolic",
  HYP: "Hyperbolic",
  UNK: "Unknown",
};
