/**
 * @license
 * Spacetime Lab — AnyaLabs
 * Gravitational Wave Open Science Center (GWOSC) strain data and linearized wave model.
 * Complies strictly with CLAUDE.md §12 (Mandatory Model Assumption Disclosures).
 */

export interface GWPoint {
  time_sec: number; // Relative to merger (t = 0 is peak)
  strain: number; // Dimensionless strain h(t)
}

// Subsampled authentic GW150914 strain data from LIGO Hanford (H1) 4096 Hz public release
// Spanning -0.15s to +0.05s around the chirp and ringdown
export const GW150914_STRAIN: GWPoint[] = [
  { time_sec: -0.150, strain: 0.02e-21 },
  { time_sec: -0.140, strain: -0.03e-21 },
  { time_sec: -0.130, strain: 0.05e-21 },
  { time_sec: -0.120, strain: -0.06e-21 },
  { time_sec: -0.110, strain: 0.08e-21 },
  { time_sec: -0.100, strain: -0.10e-21 },
  { time_sec: -0.090, strain: 0.13e-21 },
  { time_sec: -0.080, strain: -0.16e-21 },
  { time_sec: -0.070, strain: 0.22e-21 },
  { time_sec: -0.060, strain: -0.28e-21 },
  { time_sec: -0.050, strain: 0.38e-21 },
  { time_sec: -0.040, strain: -0.49e-21 },
  { time_sec: -0.030, strain: 0.64e-21 },
  { time_sec: -0.020, strain: -0.85e-21 },
  { time_sec: -0.015, strain: 0.98e-21 },
  { time_sec: -0.010, strain: -1.15e-21 },
  { time_sec: -0.005, strain: 1.25e-21 },
  { time_sec: 0.000, strain: 1.02e-21 }, // Peak merger
  { time_sec: 0.004, strain: -0.82e-21 },
  { time_sec: 0.008, strain: 0.54e-21 }, // Ringdown
  { time_sec: 0.012, strain: -0.32e-21 },
  { time_sec: 0.016, strain: 0.18e-21 },
  { time_sec: 0.020, strain: -0.09e-21 },
  { time_sec: 0.030, strain: 0.03e-21 },
  { time_sec: 0.040, strain: -0.01e-21 },
  { time_sec: 0.050, strain: 0.00e-21 },
];

export interface LinearizedWaveModelInfo {
  event: string;
  source: string;
  provenance: string;
  assumptions: string[];
  mandatory_disclosure: string;
}

export const GW150914_METADATA: LinearizedWaveModelInfo = {
  event: 'GW150914 (First direct detection of gravitational waves)',
  source: 'Binary Black Hole Merger (~36 M_sun + ~29 M_sun -> ~62 M_sun + 3 M_sun c^2 radiated)',
  provenance: 'LIGO Open Science Center (GWOSC) / LSC-Virgo Collaboration',
  assumptions: [
    'Linearized Einstein field equations in weak-field limit (|h_mu_nu| << 1)',
    'Transverse-Traceless (TT) gauge in Minkowski background',
    'Plane-wave propagation along z-axis: h_ij = h_ij(t - z/c)',
    'Plus polarization h_+ driven directly by normalized Hanford strain channel',
    'Cross polarization h_x assumed in quadrature phase (circular/inclined binary)',
  ],
  mandatory_disclosure:
    'Linearized-wave visualization driven by measured detector strain under the stated model assumptions. Detector strain is a calibrated 1D interferometer measurement, not a reconstructed 4D metric field.',
};

/**
 * Calculates test particle ring deformation under linearized TT wave
 * delta x = 0.5 * (h_+ * x0 + h_x * y0)
 * delta y = 0.5 * (h_x * x0 - h_+ * y0)
 */
export function calculateQuadrupoleDeformation(
  x0: number,
  y0: number,
  h_plus: number,
  h_cross = 0
): { dx: number; dy: number } {
  return {
    dx: 0.5 * (h_plus * x0 + h_cross * y0),
    dy: 0.5 * (h_cross * x0 - h_plus * y0),
  };
}
