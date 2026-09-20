/**
 * @license
 * Spacetime Lab — AnyaLabs
 * Classical 4th-order Runge-Kutta (RK4) integrator for first-order geodesic equations.
 */

import { FourVector } from '../types';
import { State8D, computeGeodesicDerivatives } from './geodesic_equations';

function addScaled(s: State8D, k: State8D, scale: number): State8D {
  return {
    x: [
      s.x[0] + k.x[0] * scale,
      s.x[1] + k.x[1] * scale,
      s.x[2] + k.x[2] * scale,
      s.x[3] + k.x[3] * scale,
    ],
    u: [
      s.u[0] + k.u[0] * scale,
      s.u[1] + k.u[1] * scale,
      s.u[2] + k.u[2] * scale,
      s.u[3] + k.u[3] * scale,
    ],
  };
}

export function stepRK4(
  current: State8D,
  h: number,
  metricType: 'schwarzschild' | 'minkowski' = 'schwarzschild',
  M = 1.0
): State8D {
  const k1 = computeGeodesicDerivatives(current, metricType, M);
  const k2 = computeGeodesicDerivatives(addScaled(current, k1, 0.5 * h), metricType, M);
  const k3 = computeGeodesicDerivatives(addScaled(current, k2, 0.5 * h), metricType, M);
  const k4 = computeGeodesicDerivatives(addScaled(current, k3, h), metricType, M);

  const nextX: FourVector = [
    current.x[0] + (h / 6.0) * (k1.x[0] + 2.0 * k2.x[0] + 2.0 * k3.x[0] + k4.x[0]),
    current.x[1] + (h / 6.0) * (k1.x[1] + 2.0 * k2.x[1] + 2.0 * k3.x[1] + k4.x[1]),
    current.x[2] + (h / 6.0) * (k1.x[2] + 2.0 * k2.x[2] + 2.0 * k3.x[2] + k4.x[2]),
    current.x[3] + (h / 6.0) * (k1.x[3] + 2.0 * k2.x[3] + 2.0 * k3.x[3] + k4.x[3]),
  ];

  const nextU: FourVector = [
    current.u[0] + (h / 6.0) * (k1.u[0] + 2.0 * k2.u[0] + 2.0 * k3.u[0] + k4.u[0]),
    current.u[1] + (h / 6.0) * (k1.u[1] + 2.0 * k2.u[1] + 2.0 * k3.u[1] + k4.u[1]),
    current.u[2] + (h / 6.0) * (k1.u[2] + 2.0 * k2.u[2] + 2.0 * k3.u[2] + k4.u[2]),
    current.u[3] + (h / 6.0) * (k1.u[3] + 2.0 * k2.u[3] + 2.0 * k3.u[3] + k4.u[3]),
  ];

  return { x: nextX, u: nextU };
}
