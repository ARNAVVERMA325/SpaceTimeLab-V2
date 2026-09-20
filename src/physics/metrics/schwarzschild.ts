/**
 * @license
 * Spacetime Lab — AnyaLabs
 * Exact Schwarzschild metric in standard spherical coordinates (t, r, theta, phi).
 * Follows CLAUDE.md naming: g_mu_nu, g_inv_mu_nu, christoffel, kretschmann, lapse_alpha.
 */

import { FourVector, Metric4x4, ChristoffelSymbols, ADMSlicing } from '../types';

export class SchwarzschildMetric {
  static readonly metricName = 'Schwarzschild Spacetime';
  static readonly signature = '(-+++)';
  static readonly coordinates = 'Spherical Schwarzschild (t, r, theta, phi)';

  /**
   * Evaluates metric tensor g_mu_nu at (t, r, theta, phi) with mass M.
   */
  static g_mu_nu(x: FourVector, M = 1.0): Metric4x4 {
    const [, r, theta] = x;
    const f = 1.0 - (2.0 * M) / r;
    const sinTheta = Math.sin(theta);
    const sin2 = sinTheta * sinTheta;

    return [
      [-f, 0, 0, 0],
      [0, 1.0 / f, 0, 0],
      [0, 0, r * r, 0],
      [0, 0, 0, r * r * sin2],
    ];
  }

  /**
   * Inverse metric tensor g^mu_nu
   */
  static g_inv_mu_nu(x: FourVector, M = 1.0): Metric4x4 {
    const [, r, theta] = x;
    const f = 1.0 - (2.0 * M) / r;
    const sinTheta = Math.sin(theta);
    const sin2 = Math.max(sinTheta * sinTheta, 1e-12);

    return [
      [-1.0 / f, 0, 0, 0],
      [0, f, 0, 0],
      [0, 0, 1.0 / (r * r), 0],
      [0, 0, 0, 1.0 / (r * r * sin2)],
    ];
  }

  /**
   * Analytical Christoffel symbols Gamma^mu_{alpha, beta}
   */
  static christoffel(x: FourVector, M = 1.0): ChristoffelSymbols {
    const [, r, theta] = x;
    const gamma: number[][][] = [];
    for (let mu = 0; mu < 4; mu++) {
      gamma[mu] = [];
      for (let a = 0; a < 4; a++) {
        gamma[mu][a] = [0, 0, 0, 0];
      }
    }

    const sinTheta = Math.sin(theta);
    const cosTheta = Math.cos(theta);
    const cotTheta = cosTheta / (Math.abs(sinTheta) < 1e-12 ? 1e-12 : sinTheta);
    const r_minus_2M = r - 2.0 * M;
    const denom = r * r_minus_2M;

    // Gamma^0_{0, 1} = Gamma^0_{1, 0} = M / (r (r - 2M))
    const g0_01 = M / denom;
    gamma[0][0][1] = g0_01;
    gamma[0][1][0] = g0_01;

    // Gamma^1_{0, 0} = M (r - 2M) / r^3
    gamma[1][0][0] = (M * r_minus_2M) / (r * r * r);

    // Gamma^1_{1, 1} = -M / (r (r - 2M))
    gamma[1][1][1] = -M / denom;

    // Gamma^1_{2, 2} = -(r - 2M)
    gamma[1][2][2] = -r_minus_2M;

    // Gamma^1_{3, 3} = -(r - 2M) sin^2(theta)
    gamma[1][3][3] = -r_minus_2M * sinTheta * sinTheta;

    // Gamma^2_{1, 2} = Gamma^2_{2, 1} = 1 / r
    gamma[2][1][2] = 1.0 / r;
    gamma[2][2][1] = 1.0 / r;

    // Gamma^2_{3, 3} = -sin(theta) cos(theta)
    gamma[2][3][3] = -sinTheta * cosTheta;

    // Gamma^3_{1, 3} = Gamma^3_{3, 1} = 1 / r
    gamma[3][1][3] = 1.0 / r;
    gamma[3][3][1] = 1.0 / r;

    // Gamma^3_{2, 3} = Gamma^3_{3, 2} = cot(theta)
    gamma[3][2][3] = cotTheta;
    gamma[3][3][2] = cotTheta;

    return gamma;
  }

  /**
   * Kretschmann scalar K = R_abcd R^abcd = 48 M^2 / r^6
   * True curvature scalar invariant, diverging only at physical singularity r = 0.
   */
  static kretschmann(r: number, M = 1.0): number {
    return (48.0 * M * M) / Math.pow(r, 6);
  }

  /**
   * 3+1 ADM decomposition for Schwarzschild slice
   */
  static adm_slicing(r: number, theta: number, M = 1.0): ADMSlicing {
    const f = Math.max(1e-6, 1.0 - (2.0 * M) / r);
    const lapse_alpha = Math.sqrt(f);
    const shift_beta: [number, number, number] = [0, 0, 0];
    const sinTheta = Math.sin(theta);

    const spatial_metric_gamma: [[number, number, number], [number, number, number], [number, number, number]] = [
      [1.0 / f, 0, 0],
      [0, r * r, 0],
      [0, 0, r * r * sinTheta * sinTheta],
    ];

    return { lapse_alpha, shift_beta, spatial_metric_gamma };
  }

  /**
   * Flamm's paraboloid height z(r) = 2 * sqrt(2M(r - 2M))
   * Exact isometric embedding of equatorial 2D spatial slice into Euclidean R^3.
   */
  static flamms_embedding_z(r: number, M = 1.0): number {
    if (r <= 2.0 * M) return 0;
    return 2.0 * Math.sqrt(2.0 * M * (r - 2.0 * M));
  }

  /**
   * Calculates conserved energy E and angular momentum L_z from state [x, u]
   */
  static conserved_quantities(x: FourVector, u: FourVector, M = 1.0) {
    const [, r, theta] = x;
    const [u0, u1, u2, u3] = u;
    const f = 1.0 - (2.0 * M) / r;
    const sinTheta = Math.sin(theta);

    const energy_E = f * u0;
    const angular_momentum_Lz = r * r * sinTheta * sinTheta * u3;

    // g_mu_nu u^mu u^nu
    const norm = -f * u0 * u0 + (u1 * u1) / f + r * r * u2 * u2 + r * r * sinTheta * sinTheta * u3 * u3;

    return { energy_E, angular_momentum_Lz, norm };
  }
}
