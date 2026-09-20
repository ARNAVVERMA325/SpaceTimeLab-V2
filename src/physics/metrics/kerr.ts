/**
 * @license
 * Spacetime Lab — AnyaLabs
 * Kerr spacetime in Boyer-Lindquist coordinates (t, r, theta, phi).
 * Parameters: Mass M, spin parameter a = J/M.
 */

import { FourVector, Metric4x4 } from '../types';

export class KerrMetric {
  static readonly metricName = 'Kerr Spacetime';
  static readonly signature = '(-+++)';
  static readonly coordinates = 'Boyer-Lindquist (t, r, theta, phi)';

  /**
   * Horizon radii: outer (event) r_plus and inner (Cauchy) r_minus
   */
  static horizons(M = 1.0, a = 0.9): { r_plus: number; r_minus: number } {
    const disc = Math.max(0, M * M - a * a);
    const sqrtDisc = Math.sqrt(disc);
    return {
      r_plus: M + sqrtDisc,
      r_minus: M - sqrtDisc,
    };
  }

  /**
   * Ergosphere boundary radius as a function of polar angle theta
   * r_E(theta) = M + sqrt(M^2 - a^2 cos^2(theta))
   */
  static ergosphere_radius(theta: number, M = 1.0, a = 0.9): number {
    const cosTheta = Math.cos(theta);
    const term = Math.max(0, M * M - a * a * cosTheta * cosTheta);
    return M + Math.sqrt(term);
  }

  /**
   * Metric tensor g_mu_nu in Boyer-Lindquist coordinates
   */
  static g_mu_nu(x: FourVector, M = 1.0, a = 0.9): Metric4x4 {
    const [, r, theta] = x;
    const sinTheta = Math.sin(theta);
    const cosTheta = Math.cos(theta);
    const sin2 = Math.max(sinTheta * sinTheta, 1e-12);
    const cos2 = cosTheta * cosTheta;

    const Sigma = r * r + a * a * cos2;
    const Delta = r * r - 2.0 * M * r + a * a;

    const g_tt = -(1.0 - (2.0 * M * r) / Sigma);
    const g_tphi = -(2.0 * M * a * r * sin2) / Sigma;
    const g_rr = Sigma / (Math.abs(Delta) < 1e-12 ? 1e-12 : Delta);
    const g_thth = Sigma;
    const g_phiphi = (r * r + a * a + (2.0 * M * r * a * a * sin2) / Sigma) * sin2;

    return [
      [g_tt, 0, 0, g_tphi],
      [0, g_rr, 0, 0],
      [0, 0, g_thth, 0],
      [g_tphi, 0, 0, g_phiphi],
    ];
  }

  /**
   * Inverse metric tensor g^mu_nu
   */
  static g_inv_mu_nu(x: FourVector, M = 1.0, a = 0.9): Metric4x4 {
    const [, r, theta] = x;
    const sinTheta = Math.sin(theta);
    const cosTheta = Math.cos(theta);
    const sin2 = Math.max(sinTheta * sinTheta, 1e-12);
    const cos2 = cosTheta * cosTheta;

    const Sigma = r * r + a * a * cos2;
    const Delta = r * r - 2.0 * M * r + a * a;
    const A = Math.pow(r * r + a * a, 2) - a * a * Delta * sin2;
    const sigDelta = Sigma * (Math.abs(Delta) < 1e-12 ? 1e-12 : Delta);

    const g_inv_tt = -A / sigDelta;
    const g_inv_tphi = -(2.0 * M * a * r) / sigDelta;
    const g_inv_rr = Delta / Sigma;
    const g_inv_thth = 1.0 / Sigma;
    const g_inv_phiphi = (Delta - a * a * sin2) / (sigDelta * sin2);

    return [
      [g_inv_tt, 0, 0, g_inv_tphi],
      [0, g_inv_rr, 0, 0],
      [0, 0, g_inv_thth, 0],
      [g_inv_tphi, 0, 0, g_inv_phiphi],
    ];
  }

  /**
   * Frame-dragging angular velocity omega = -g_tphi / g_phiphi
   */
  static frame_dragging_omega(r: number, theta: number, M = 1.0, a = 0.9): number {
    const sinTheta = Math.sin(theta);
    const cosTheta = Math.cos(theta);
    const sin2 = Math.max(sinTheta * sinTheta, 1e-12);
    const Sigma = r * r + a * a * cosTheta * cosTheta;
    const Delta = r * r - 2.0 * M * r + a * a;
    const A = Math.pow(r * r + a * a, 2) - a * a * Delta * sin2;
    return (2.0 * M * a * r) / (A < 1e-12 ? 1e-12 : A);
  }

  /**
   * Kretschmann scalar invariant for Kerr spacetime
   */
  static kretschmann(r: number, theta: number, M = 1.0, a = 0.9): number {
    const v = a * Math.cos(theta);
    const r2 = r * r;
    const v2 = v * v;
    const r2_minus_v2 = r2 - v2;
    const r2_plus_v2 = r2 + v2;
    const numerator = 48.0 * M * M * r2_minus_v2 * (Math.pow(r2_plus_v2, 2) - 16.0 * r2 * v2);
    const denominator = Math.pow(r2_plus_v2, 6);
    return numerator / Math.max(1e-18, denominator);
  }

  /**
   * Calculates Carter constant Q, energy E, and angular momentum L_z
   * Q = p_theta^2 + cos^2(theta) * ( a^2 (mu^2 - E^2) + L_z^2 / sin^2(theta) )
   */
  static carter_constant(
    theta: number,
    p_theta: number,
    E: number,
    Lz: number,
    isTimelike: boolean,
    a = 0.9
  ): number {
    const cosTheta = Math.cos(theta);
    const sinTheta = Math.sin(theta);
    const sin2 = Math.max(sinTheta * sinTheta, 1e-12);
    const cos2 = cosTheta * cosTheta;
    const mu2 = isTimelike ? 1.0 : 0.0;

    return p_theta * p_theta + cos2 * (a * a * (mu2 - E * E) + (Lz * Lz) / sin2);
  }
}
