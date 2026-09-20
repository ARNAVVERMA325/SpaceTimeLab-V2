/**
 * @license
 * Spacetime Lab — AnyaLabs
 * Geodesic equation RHS evaluation using exact Christoffel symbols.
 * d x^mu / d lambda = u^mu
 * d u^mu / d lambda = - Gamma^mu_{alpha, beta} u^alpha u^beta
 */

import { FourVector } from '../types';
import { SchwarzschildMetric } from '../metrics/schwarzschild';
import { MinkowskiMetric } from '../metrics/minkowski';

export interface State8D {
  x: FourVector;
  u: FourVector;
}

export function computeGeodesicDerivatives(
  state: State8D,
  metricType: 'schwarzschild' | 'minkowski' = 'schwarzschild',
  M = 1.0
): State8D {
  const { x, u } = state;
  const [, r, theta] = x;

  if (metricType === 'minkowski') {
    return {
      x: [u[0], u[1], u[2], u[3]],
      u: [0, 0, 0, 0],
    };
  }

  // Schwarzschild coordinates
  if (r <= 2.000001 * M) {
    // Horizon boundary reached
    return {
      x: [0, 0, 0, 0],
      u: [0, 0, 0, 0],
    };
  }

  const gamma = SchwarzschildMetric.christoffel(x, M);
  const du: FourVector = [0, 0, 0, 0];

  for (let mu = 0; mu < 4; mu++) {
    let sum = 0;
    for (let alpha = 0; alpha < 4; alpha++) {
      if (u[alpha] === 0) continue;
      for (let beta = 0; beta < 4; beta++) {
        if (u[beta] === 0) continue;
        const g = gamma[mu][alpha][beta];
        if (g !== 0) {
          sum += g * u[alpha] * u[beta];
        }
      }
    }
    du[mu] = -sum;
  }

  return {
    x: [u[0], u[1], u[2], u[3]],
    u: du,
  };
}
