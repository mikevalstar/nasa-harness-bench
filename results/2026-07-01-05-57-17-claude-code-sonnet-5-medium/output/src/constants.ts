// Scene scale: 1 scene unit = 1 astronomical unit.
export const AU_SCENE_UNITS = 50;
// Body radii are rendered on a compressed non-physical scale (else the Sun
// and planets would be invisible dots at true 1:1 au scale); orbit *shapes*
// stay geometrically correct regardless.
export const SUN_RADIUS_KM = 696000;
export const KM_TO_SCENE = AU_SCENE_UNITS / 1.495978707e8; // 1 au in km
export const PLANET_RADIUS_EXAGGERATION = 800; // planets rendered ~800x true size
export const SUN_RADIUS_EXAGGERATION = 40;

export const MS_PER_DAY = 86400000;
export const JD_UNIX_EPOCH = 2440587.5; // JD at 1970-01-01T00:00:00Z

export function dateToJD(date: Date): number {
  return date.getTime() / MS_PER_DAY + JD_UNIX_EPOCH;
}

export function jdToDate(jd: number): Date {
  return new Date((jd - JD_UNIX_EPOCH) * MS_PER_DAY);
}
