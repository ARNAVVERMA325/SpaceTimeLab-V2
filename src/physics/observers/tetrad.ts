/**
 * @license
 * Spacetime Lab — AnyaLabs
 * Observer tetrads e^mu_(a) and relativistic frequency shift engine.
 * Follows CLAUDE.md §4 ("No God Camera") and §3.1-§3.3.
 */

import { FourVector, ObserverTetrad } from '../types';
import { SchwarzschildMetric } from '../metrics/schwarzschild';

export class TetradEngine {
  /**
   * Static observer at fixed (r, theta, phi) in Schwarzschild spacetime.
   * u^mu = ( 1/sqrt(1 - 2M/r), 0, 0, 0 )
   */
  static staticObserverTetrad(r: number, theta: number, M = 1.0): ObserverTetrad {
    const f = Math.max(1e-6, 1.0 - (2.0 * M) / r);
    const sqrtF = Math.sqrt(f);
    const sinTheta = Math.max(1e-12, Math.sin(theta));

    const e_0: FourVector = [1.0 / sqrtF, 0, 0, 0];
    const e_1: FourVector = [0, sqrtF, 0, 0]; // Radial unit vector
    const e_2: FourVector = [0, 0, 1.0 / r, 0]; // Polar unit vector
    const e_3: FourVector = [0, 0, 0, 1.0 / (r * sinTheta)]; // Azimuthal unit vector

    return { e_0, e_1, e_2, e_3 };
  }

  /**
   * Freely-falling observer dropping radially from rest at infinity (Painlevé-Gullstrand geodesic)
   * u^mu = ( 1 / (1 - 2M/r), -sqrt(2M/r), 0, 0 )
   */
  static freeFallingObserverTetrad(r: number, theta: number, M = 1.0): ObserverTetrad {
    const f = Math.max(1e-6, 1.0 - (2.0 * M) / r);
    const v_drop = Math.sqrt((2.0 * M) / r);
    const sinTheta = Math.max(1e-12, Math.sin(theta));

    const e_0: FourVector = [1.0 / f, -v_drop, 0, 0];
    const e_1: FourVector = [v_drop / f, -1.0, 0, 0];
    const e_2: FourVector = [0, 0, 1.0 / r, 0];
    const e_3: FourVector = [0, 0, 0, 1.0 / (r * sinTheta)];

    return { e_0, e_1, e_2, e_3 };
  }

  /**
   * Keplerian circular orbit observer at radius r in equatorial plane (theta = pi/2)
   * Omega = sqrt(M / r^3)
   */
  static keplerianObserverTetrad(r: number, M = 1.0): ObserverTetrad {
    const Omega = Math.sqrt(M / (r * r * r));
    const term = Math.max(1e-6, 1.0 - (3.0 * M) / r);
    const gamma_kepler = 1.0 / Math.sqrt(term);

    const u0 = gamma_kepler / Math.sqrt(1.0 - (2.0 * M) / r);
    const u3 = gamma_kepler * Omega;

    const e_0: FourVector = [u0, 0, 0, u3];
    const e_1: FourVector = [0, Math.sqrt(1.0 - (2.0 * M) / r), 0, 0];
    const e_2: FourVector = [0, 0, 1.0 / r, 0];
    const e_3: FourVector = [u3 * r * r, 0, 0, u0 / (r * r)]; // Orthogonalized in (t, phi)

    return { e_0, e_1, e_2, e_3 };
  }

  /**
   * Transforms local screen pixel direction (alpha, beta) into global photon wavevector k^mu
   */
  static rayDirectionFromTetrad(
    tetrad: ObserverTetrad,
    alpha: number, // Horizontal angle in radians
    beta: number   // Vertical angle in radians
  ): FourVector {
    // In local orthonormal frame, photon wavevector k^(a) has k^(0) = 1, and sum of spatial components = 1
    const n_z = Math.cos(alpha) * Math.cos(beta);
    const n_x = Math.sin(alpha) * Math.cos(beta);
    const n_y = Math.sin(beta);

    // k^mu = e^(0)^mu - n_z e^(1)^mu + n_x e^(3)^mu + n_y e^(2)^mu (backward-traced from screen)
    const k: FourVector = [0, 0, 0, 0];
    for (let c = 0; c < 4; c++) {
      k[c] = tetrad.e_0[c] - n_z * tetrad.e_1[c] + n_x * tetrad.e_3[c] + n_y * tetrad.e_2[c];
    }
    return k;
  }

  /**
   * Computes relativistic Doppler redshift factor (1 + z) and intensity factor (1+z)^(-4)
   * (1 + z) = (u^mu k_mu)_emitter / (u^mu k_mu)_observer
   */
  static computeFrequencyShift(
    k_mu_emitter: FourVector,
    u_emitter: FourVector,
    k_mu_obs: FourVector,
    u_obs: FourVector
  ): { one_plus_z: number; intensity_factor: number } {
    let E_em = 0;
    let E_obs = 0;

    for (let i = 0; i < 4; i++) {
      E_em -= u_emitter[i] * k_mu_emitter[i];
      E_obs -= u_obs[i] * k_mu_obs[i];
    }

    const one_plus_z = Math.max(1e-4, E_em / Math.max(1e-12, E_obs));
    const intensity_factor = 1.0 / Math.pow(one_plus_z, 4);

    return { one_plus_z, intensity_factor };
  }
}
