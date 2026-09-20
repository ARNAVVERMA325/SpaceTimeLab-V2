/**
 * @license
 * Spacetime Lab — AnyaLabs
 * Symplectic Verlet integrator for long-term timelike conservative geodesic orbits.
 * Follows CLAUDE.md §7.2 for controlling long-time Hamiltonian secular energy drift.
 */

export interface SymplecticOrbitState {
  r: number;
  phi: number;
  p_r: number; // dr / dtau
  tau: number;
  E: number;
  L_z: number;
}

export function computeRadialAcceleration(r: number, L_z: number, M = 1.0): number {
  if (r <= 2.0 * M) return 0;
  // Effective potential radial derivative: d^2r/dtau^2 = -1/2 d(V_eff)/dr
  // V_eff(r) = (1 - 2M/r)(1 + L_z^2/r^2) = 1 - 2M/r + L_z^2/r^2 - 2M L_z^2 / r^3
  // dV_eff/dr = 2M/r^2 - 2 L_z^2/r^3 + 6M L_z^2 / r^4
  // So -1/2 dV_eff/dr = -M/r^2 + L_z^2/r^3 - 3M L_z^2 / r^4
  const r2 = r * r;
  const r3 = r2 * r;
  const r4 = r3 * r;
  return -M / r2 + (L_z * L_z) / r3 - (3.0 * M * L_z * L_z) / r4;
}

export function stepSymplecticVerlet(
  state: SymplecticOrbitState,
  dtau: number,
  M = 1.0
): SymplecticOrbitState {
  const { r, phi, p_r, tau, L_z } = state;

  // Half-step momentum
  const a0 = computeRadialAcceleration(r, L_z, M);
  const p_r_half = p_r + 0.5 * dtau * a0;

  // Full-step position
  const r_next = r + dtau * p_r_half;
  const phi_next = phi + dtau * (L_z / (r_next * r_next));

  // Full-step momentum
  const a1 = computeRadialAcceleration(r_next, L_z, M);
  const p_r_next = p_r_half + 0.5 * dtau * a1;

  // Compute energy E: E^2 = (dr/dtau)^2 + V_eff(r)
  const V_eff = (1.0 - (2.0 * M) / r_next) * (1.0 + (L_z * L_z) / (r_next * r_next));
  const E_sq = p_r_next * p_r_next + V_eff;
  const E_next = Math.sqrt(Math.max(0, E_sq));

  return {
    r: r_next,
    phi: phi_next,
    p_r: p_r_next,
    tau: tau + dtau,
    E: E_next,
    L_z,
  };
}
