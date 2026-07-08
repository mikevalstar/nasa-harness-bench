import * as THREE from 'three';

// Constants
const AU = 1; // Astronomical Unit in Three.js units (can be scaled later)
const DAYS_PER_YEAR = 365.25;

// Degrees to radians
const toRadians = (degrees: number) => degrees * Math.PI / 180;

interface OrbitalElements {
  a: number; // semi-major axis (AU)
  e: number; // eccentricity
  i: number; // inclination (deg)
  om: number; // longitude of ascending node (deg)
  w: number; // argument of perihelion (deg)
  ma: number; // mean anomaly at epoch (deg)
  epoch: number; // epoch of the elements (Julian date)
  n?: number; // mean motion (deg/day) - present on planets; derivable elsewhere
  per?: number; // orbital period (days)
  q?: number; // perihelion distance (AU)
  ad?: number; // aphelion distance (AU)
  tp?: number; // time of perihelion passage (Julian date)
}

/**
 * Converts orbital elements to a Cartesian position vector for a given Julian date.
 * Based on: https://en.wikipedia.org/wiki/Orbital_elements#From_orbital_elements_to_a_state_vector
 * and https://www.bogan.ca/orbits/kepler/orbteqtn.html
 *
 * @param elements - The orbital elements of the celestial body.
 * @param jd - The Julian date for which to calculate the position.
 * @returns A THREE.Vector3 representing the Cartesian coordinates (AU).
 */
export function calculatePosition(elements: OrbitalElements, jd: number): THREE.Vector3 {
  const { a, e, i, om, w, ma, epoch } = elements;

  // Calculate elapsed time since epoch in days
  const dt = jd - epoch;

  // Calculate Mean Anomaly (M) at current time
  let M: number;
  if (elements.n) {
    M = toRadians(ma + elements.n * dt); // For planets with defined mean motion
  } else if (elements.per) {
    const meanMotion = 360 / elements.per; // deg/day
    M = toRadians(ma + meanMotion * dt);
  } else {
    // Fallback: This case might need more sophisticated handling for asteroids without 'n' or 'per'
    // For now, let's assume 'per' or 'n' will always be present for bodies we track this way.
    // Or for objects where 'tp' is given, we could derive M from tp.
    console.warn("Missing mean motion or period for orbital elements, using epoch MA.", elements);
    M = toRadians(ma);
  }

  // Solve Kepler's Equation for Eccentric Anomaly (E)
  let E = M; // Initial guess
  let delta = 1; // Difference
  while (Math.abs(delta) > 1e-6) {
    delta = E - e * Math.sin(E) - M;
    E -= delta / (1 - e * Math.cos(E));
  }

  // Calculate true anomaly (nu) and distance (r)
  const r = a * (1 - e * Math.cos(E));
  const nu = 2 * Math.atan2(Math.sqrt(1 + e) * Math.sin(E / 2), Math.sqrt(1 - e) * Math.cos(E / 2));

  // Rotate coordinates to the orbital plane
  const Px = r * Math.cos(nu);
  const Py = r * Math.sin(nu);

  // Convert to J2000 Ecliptic coordinates
  const sin_i = Math.sin(toRadians(i));
  const cos_i = Math.cos(toRadians(i));
  const sin_om = Math.sin(toRadians(om));
  const cos_om = Math.cos(toRadians(om));
  const sin_w_plus_nu = Math.sin(toRadians(w) + nu);
  const cos_w_plus_nu = Math.cos(toRadians(w) + nu);

  const x = Px * (cos_om * cos_w_plus_nu - sin_om * sin_w_plus_nu * cos_i) - Py * (cos_om * sin_w_plus_nu + sin_om * cos_w_plus_nu * cos_i);
  const y = Px * (sin_om * cos_w_plus_nu + cos_om * sin_w_plus_nu * cos_i) + Py * (sin_om * sin_w_plus_nu - cos_om * cos_w_plus_nu * cos_i);
  const z = Px * (sin_w_plus_nu * sin_i) + Py * (cos_w_plus_nu * sin_i);

  return new THREE.Vector3(x, y, z);
}
