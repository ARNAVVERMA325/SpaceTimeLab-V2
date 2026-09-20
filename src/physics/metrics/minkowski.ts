/**
 * @license
 * Spacetime Lab — AnyaLabs
 * Flat Minkowski spacetime in signature (-+++).
 */

import { FourVector, Metric4x4, ChristoffelSymbols } from '../types';

export class MinkowskiMetric {
  static readonly metricName = 'Minkowski Spacetime';
  static readonly signature = '(-+++)';
  static readonly coordinates = 'Cartesian (t, x, y, z)';

  /**
   * Metric tensor g_mu_nu = diag(-1, 1, 1, 1)
   */
  static g_mu_nu(): Metric4x4 {
    return [
      [-1, 0, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 1],
    ];
  }

  /**
   * Inverse metric tensor g_inv_mu_nu = diag(-1, 1, 1, 1)
   */
  static g_inv_mu_nu(): Metric4x4 {
    return [
      [-1, 0, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 1],
    ];
  }

  /**
   * Christoffel symbols Gamma^mu_{alpha, beta} are identically zero in flat Cartesian coordinates.
   */
  static christoffel(): ChristoffelSymbols {
    const gamma: number[][][] = [];
    for (let mu = 0; mu < 4; mu++) {
      gamma[mu] = [];
      for (let a = 0; a < 4; a++) {
        gamma[mu][a] = [0, 0, 0, 0];
      }
    }
    return gamma;
  }

  /**
   * Curvature invariants for flat space are zero
   */
  static kretschmann(): number {
    return 0.0;
  }
}
