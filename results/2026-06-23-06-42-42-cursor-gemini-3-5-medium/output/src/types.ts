export interface OrbitalElements {
  a: number;       // semi-major axis (au)
  e: number;       // eccentricity
  i: number;       // inclination (deg)
  om: number;      // longitude of ascending node (deg)
  w: number;       // argument of perihelion (deg)
  ma: number;      // mean anomaly at epoch (deg)
  epoch: number;   // epoch of elements (Julian Date)
  n?: number | null;    // mean motion (deg/day) - derivable if missing
  per?: number | null;  // orbital period (days) - derivable if missing
  q: number;       // perihelion distance (au)
  ad?: number | null;   // aphelion distance (au)
  tp: number;      // time of perihelion passage (Julian Date)
}

export interface Planet extends OrbitalElements {
  name: string;
  radius_km: number;
}

export interface Asteroid extends OrbitalElements {
  full_name: string;
  pdes: string;
  name: string | null;
  spkid: string;
  neo: boolean;
  pha: boolean;
  class: string;
  moid: number;
  H: number;
  G?: number | null;
  diameter: number | null;
  albedo: number | null;
  rot_per: number | null;
  spec_B: string | null;
  spec_T: string | null;
  first_obs: string;
  // Dynamic fields added at runtime or during filter
  isSentry?: boolean;
}

export interface Comet extends OrbitalElements {
  full_name: string;
  pdes: string;
  class: string;
  M1?: number | null; // total magnitude
  diameter: number | null;
}

export interface SentryItem {
  des: string;
  fullname: string;
  ip: number; // cumulative impact probability
  ps_cum: number; // cumulative Palermo scale
  ps_max: number; // max Palermo scale
  ts_max: number; // max Torino scale
  range: string; // year range of potential impacts
  n_imp: number; // number of potential impacts
  diameter: number; // size in km
  h: number; // absolute magnitude
  v_inf: number; // encounter velocity (km/s)
  last_obs: string;
  last_obs_jd: number;
}

export interface CloseApproach {
  des: string; // matches asteroid/comet pdes
  cd: string; // calendar date
  jd: number; // julian date
  dist: number; // nominal approach distance (au)
  dist_min: number; // 3σ min distance (au)
  dist_max: number; // 3σ max distance (au)
  v_rel: number; // relative velocity (km/s)
  v_inf: number; // unperturbed velocity (km/s)
  h: number; // absolute magnitude
}

export interface Position3D {
  x: number;
  y: number;
  z: number;
}
