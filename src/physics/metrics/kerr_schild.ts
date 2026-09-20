/**
 * @license
 * Spacetime Lab — AnyaLabs
 * Kerr-Schild Horizon-Penetrating Coordinates (CLAUDE.md §6.2 & Milestone 4B)
 * Metric form: g_mu_nu = eta_mu_nu + 2 * H * l_mu * l_nu
 * In Kerr-Schild coordinates, det(g) = -1 everywhere, and the metric components
 * remain smooth, finite, and non-singular across the event horizon r = r_+.
 */

import { FourVector, Metric4x4 } from '../types';

export class KerrSchildMetric {
  static readonly metricName = 'Kerr-Schild Horizon-Penetrating Coordinates';
  static readonly signature = '(-+++)';
  static readonly coordinates = 'Cartesian Kerr-Schild (T, x, y, z)';

  /**
   * Calculates the Boyer-Lindquist radial coordinate r from Cartesian (x, y, z)
   * r^4 - (x^2 + y^2 + z^2 - a^2) r^2 - a^2 z^2 = 0
   */
  static radiusFromCartesian(x: number, y: number, z: number, a = 0.9): number {
    const rho2 = x * x + y * y + z * z;
    const a2 = a * a;
    const disc = Math.pow(rho2 - a2, 2) + 4.0 * a2 * z * z;
    const r2 = 0.5 * (rho2 - a2 + Math.sqrt(Math.max(0, disc)));
    return Math.sqrt(Math.max(1e-12, r2));
  }

  /**
   * Kerr-Schild scalar H(x, y, z) = M * r^3 / (r^4 + a^2 * z^2)
   */
  static H_scalar(r: number, z: number, M = 1.0, a = 0.9): number {
    const r3 = r * r * r;
    const r4 = r3 * r;
    const denom = r4 + a * a * z * z;
    return (M * r3) / Math.max(1e-12, denom);
  }

  /**
   * Null vector l_mu in Kerr-Schild form
   * l_mu = (1, (r*x + a*y)/(r^2 + a^2), (r*y - a*x)/(r^2 + a^2), z/r)
   */
  static l_vector(x: number, y: number, z: number, r: number, a = 0.9): FourVector {
    const r2_plus_a2 = r * r + a * a;
    const lx = (r * x + a * y) / Math.max(1e-12, r2_plus_a2);
    const ly = (r * y - a * x) / Math.max(1e-12, r2_plus_a2);
    const lz = z / Math.max(1e-12, r);
    return [1.0, lx, ly, lz];
  }

  /**
   * Exact Kerr-Schild metric tensor g_mu_nu = eta_mu_nu + 2 * H * l_mu * l_nu
   */
  static g_mu_nu(pos: FourVector, M = 1.0, a = 0.9): Metric4x4 {
    const [, x, y, z] = pos;
    const r = this.radiusFromCartesian(x, y, z, a);
    const H = this.H_scalar(r, z, M, a);
    const l = this.l_vector(x, y, z, r, a);

    // eta_mu_nu = diag(-1, 1, 1, 1)
    const eta: Metric4x4 = [
      [-1, 0, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 1],
    ];

    const g: Metric4x4 = [
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];

    for (let mu = 0; mu < 4; mu++) {
      for (let nu = 0; nu < 4; nu++) {
        g[mu][nu] = eta[mu][nu] + 2.0 * H * l[mu] * l[nu];
      }
    }

    return g;
  }

  /**
   * Inverse metric g^mu_nu = eta^mu_nu - 2 * H * l^mu * l^nu
   * (Exact due to the remarkable property that l^mu is null with respect to both eta and g)
   */
  static g_inv_mu_nu(pos: FourVector, M = 1.0, a = 0.9): Metric4x4 {
    const [, x, y, z] = pos;
    const r = this.radiusFromCartesian(x, y, z, a);
    const H = this.H_scalar(r, z, M, a);
    const l_down = this.l_vector(x, y, z, r, a);

    // l^mu raised with flat Minkowski eta: l^0 = -l_0 = -1, l^i = l_i
    const l_up: FourVector = [-l_down[0], l_down[1], l_down[2], l_down[3]];

    const eta_inv: Metric4x4 = [
      [-1, 0, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 1],
    ];

    const g_inv: Metric4x4 = [
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];

    for (let mu = 0; mu < 4; mu++) {
      for (let nu = 0; nu < 4; nu++) {
        g_inv[mu][nu] = eta_inv[mu][nu] - 2.0 * H * l_up[mu] * l_up[nu];
      }
    }

    return g_inv;
  }
}
