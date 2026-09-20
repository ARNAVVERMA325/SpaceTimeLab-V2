/**
 * @license
 * Spacetime Lab — AnyaLabs
 * Adaptive Runge-Kutta-Fehlberg 4(5) (RKF45) with embedded error estimation.
 * Follows CLAUDE.md §7.1 for adaptive step-size control.
 */

import { FourVector } from '../types';
import { State8D, computeGeodesicDerivatives } from './geodesic_equations';

// Butcher tableau coefficients for RKF45
const c2 = 1 / 4, a21 = 1 / 4;
const c3 = 3 / 8, a31 = 3 / 32, a32 = 9 / 32;
const c4 = 12 / 13, a41 = 1932 / 2197, a42 = -7200 / 2197, a43 = 7296 / 2197;
const c5 = 1, a51 = 439 / 216, a52 = -8, a53 = 3680 / 513, a54 = -845 / 4104;
const c6 = 1 / 2, a61 = -8 / 27, a62 = 2, a63 = -3544 / 2565, a64 = 1859 / 4104, a65 = -11 / 40;

// 4th order solution weights (b)
const b1 = 25 / 216, b2 = 0, b3 = 1408 / 2565, b4 = 2197 / 4104, b5 = -1 / 5, b6 = 0;
// 5th order solution weights (bHat)
const bHat1 = 16 / 135, bHat2 = 0, bHat3 = 6656 / 12825, bHat4 = 28561 / 56430, bHat5 = -9 / 50, bHat6 = 2 / 55;

export interface RKF45StepResult {
  nextState: State8D;
  hNext: number;
  accepted: boolean;
  estimatedError: number;
}

function combineStages(s: State8D, kStages: State8D[], weights: number[], h: number): State8D {
  const nextX: FourVector = [...s.x];
  const nextU: FourVector = [...s.u];

  for (let i = 0; i < kStages.length; i++) {
    const w = weights[i];
    if (w === 0) continue;
    for (let c = 0; c < 4; c++) {
      nextX[c] += h * w * kStages[i].x[c];
      nextU[c] += h * w * kStages[i].u[c];
    }
  }

  return { x: nextX, u: nextU };
}

export function stepRKF45(
  current: State8D,
  h: number,
  tolerance = 1e-7,
  metricType: 'schwarzschild' | 'minkowski' = 'schwarzschild',
  M = 1.0
): RKF45StepResult {
  const k1 = computeGeodesicDerivatives(current, metricType, M);

  // Stage 2
  const s2 = combineStages(current, [k1], [a21], h);
  const k2 = computeGeodesicDerivatives(s2, metricType, M);

  // Stage 3
  const s3 = combineStages(current, [k1, k2], [a31, a32], h);
  const k3 = computeGeodesicDerivatives(s3, metricType, M);

  // Stage 4
  const s4 = combineStages(current, [k1, k2, k3], [a41, a42, a43], h);
  const k4 = computeGeodesicDerivatives(s4, metricType, M);

  // Stage 5
  const s5 = combineStages(current, [k1, k2, k3, k4], [a51, a52, a53, a54], h);
  const k5 = computeGeodesicDerivatives(s5, metricType, M);

  // Stage 6
  const s6 = combineStages(current, [k1, k2, k3, k4, k5], [a61, a62, a63, a64, a65], h);
  const k6 = computeGeodesicDerivatives(s6, metricType, M);

  const stages = [k1, k2, k3, k4, k5, k6];
  const y4 = combineStages(current, stages, [b1, b2, b3, b4, b5, b6], h);
  const y5 = combineStages(current, stages, [bHat1, bHat2, bHat3, bHat4, bHat5, bHat6], h);

  // Local truncation error estimate = ||y5 - y4||
  let maxError = 0;
  for (let c = 0; c < 4; c++) {
    const errX = Math.abs(y5.x[c] - y4.x[c]);
    const errU = Math.abs(y5.u[c] - y4.u[c]);
    if (errX > maxError) maxError = errX;
    if (errU > maxError) maxError = errU;
  }

  // Safety factor
  const s = 0.84;
  let hNext = h;
  if (maxError > 0) {
    const scale = s * Math.pow(tolerance / maxError, 0.2);
    hNext = h * Math.min(2.0, Math.max(0.2, scale));
  }

  const accepted = maxError <= tolerance || h <= 1e-8;

  return {
    nextState: accepted ? y5 : current,
    hNext: Math.max(1e-8, Math.min(1.0, hNext)),
    accepted,
    estimatedError: maxError,
  };
}
