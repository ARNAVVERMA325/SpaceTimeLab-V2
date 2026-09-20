/**
 * @license
 * Spacetime Lab — AnyaLabs
 * Event Horizon Telescope (EHT) observational datasets and physical disclosures.
 * Follows CLAUDE.md §14 (Model-to-Data Comparison & Disclosure of Non-Vacuum Effects).
 */

export interface EHTTarget {
  name: string;
  host_galaxy: string;
  distance_Mpc: number;
  mass_solar: string;
  measured_shadow_diameter_microarcsec: string;
  predicted_kerr_diameter_microarcsec: string;
  spin_estimate: string;
  observation_date: string;
  citation: string;
}

export const EHT_TARGETS: Record<'m87' | 'sgra', EHTTarget> = {
  m87: {
    name: 'M87*',
    host_galaxy: 'Messier 87 (Virgo A)',
    distance_Mpc: 16.8, // 55 million light years
    mass_solar: '(6.5 ± 0.7) × 10^9 M_☉',
    measured_shadow_diameter_microarcsec: '42 ± 3 μas',
    predicted_kerr_diameter_microarcsec: '39 – 43 μas (for a ~ 0.5 – 0.94)',
    spin_estimate: '|a*| ~ 0.90 ± 0.05 (inferred from jet energetics)',
    observation_date: 'April 2017 (1.3 mm / 230 GHz VLBI array)',
    citation: 'The Event Horizon Telescope Collaboration, ApJL 875, L1 (2019)',
  },
  sgra: {
    name: 'Sagittarius A*',
    host_galaxy: 'Milky Way Galactic Center',
    distance_Mpc: 0.0082, // 26,700 light years
    mass_solar: '(4.154 ± 0.014) × 10^6 M_☉',
    measured_shadow_diameter_microarcsec: '48.7 ± 7.0 μas',
    predicted_kerr_diameter_microarcsec: '48.7 ± 2.0 μas',
    spin_estimate: 'High spin favored by polarization & ring symmetry',
    observation_date: 'April 2017 (1.3 mm / 230 GHz VLBI array)',
    citation: 'The Event Horizon Telescope Collaboration, ApJL 930, L12 (2022)',
  },
};

export const EHT_DISCLOSURES = [
  'Radiative Transfer & Plasma Physics: Vacuum Kerr ray-tracing computes geodesics in empty spacetime. Real EHT observations image synchrotron emission from hot, turbulent, magnetized plasma (GRMHD).',
  'Optical Depth: The millimeter accretion flow is partially optically thin; emission originating behind the black hole is lensed around the photon ring into secondary and tertiary sub-rings.',
  'Interferometric Reconstruction: EHT images are not direct camera photographs; they are reconstructed from sparse Fourier (u,v) coverage using regularized maximum likelihood (RML) and CLEAN algorithms.',
  'Instrumental Resolution & Beam Blur: The telescope array has a finite synthesized beam size (~20 μas at 230 GHz), convolving the sharp theoretical mathematical shadow into the observed fuzzy ring.',
];
