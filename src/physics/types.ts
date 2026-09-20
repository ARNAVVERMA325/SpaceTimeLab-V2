/**
 * @license
 * Spacetime Lab — AnyaLabs
 * Mathematical data structures adhering strictly to CLAUDE.md §19 naming conventions.
 */

export type FourVector = [number, number, number, number]; // [0, 1, 2, 3] = [t, r, theta, phi] or [t, x, y, z]
export type ThreeVector = [number, number, number];
export type Metric4x4 = [FourVector, FourVector, FourVector, FourVector];
export type SpatialMetric3x3 = [ThreeVector, ThreeVector, ThreeVector];
export type ChristoffelSymbols = number[][][]; // [mu][alpha][beta]

export type MetricID = 'schwarzschild' | 'kerr' | 'minkowski';
export type GeodesicType = 'null' | 'timelike';
export type IntegratorType = 'rk4' | 'rkf45' | 'symplectic';
export type ObserverType = 'static' | 'free_falling' | 'keplerian';

export interface PhaseSpaceState {
  x: FourVector; // Coordinates [t, r, theta, phi]
  p: FourVector; // Four-momentum or tangent [p_t, p_r, p_theta, p_phi] or [p^0, p^1, p^2, p^3]
  lambda: number; // Affine parameter or proper time tau
}

export interface ConservedQuantities {
  energy_E: number; // -p_t (stationary Killing vector)
  angular_momentum_Lz: number; // p_phi (axisymmetric Killing vector)
  carter_Q?: number; // Carter constant (in Kerr spacetime)
  norm_check: number; // g_mu_nu p^mu p^nu (-1 for timelike, 0 for null)
}

export interface ObserverTetrad {
  e_0: FourVector; // u^mu: timelike four-velocity of observer
  e_1: FourVector; // Orthonormal radial spatial basis vector
  e_2: FourVector; // Orthonormal polar spatial basis vector
  e_3: FourVector; // Orthonormal azimuthal spatial basis vector
}

export interface ADMSlicing {
  lapse_alpha: number;
  shift_beta: ThreeVector;
  spatial_metric_gamma: SpatialMetric3x3;
}

export interface ValidationTestResult {
  id: string;
  name: string;
  category: 'Flat Space' | 'Normalization' | 'Conserved Quantities' | 'Known Solutions' | 'Convergence';
  description: string;
  expected: string;
  measured: string;
  numerical_error: number;
  tolerance: number;
  passed: boolean;
  citation?: string;
}
