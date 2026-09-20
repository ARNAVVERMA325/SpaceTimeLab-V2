/**
 * @license
 * Spacetime Lab — AnyaLabs
 * EHT Model-to-Data Comparison Modal (CLAUDE.md §14)
 * Strict comparison of vacuum Kerr black hole raytracing against real EHT radio interferometry,
 * disclosing plasma radiative transfer, optical depth, and beam PSF convolution.
 */

import React, { useState } from 'react';
import { X, Eye, Info, ExternalLink, ShieldCheck } from 'lucide-react';
import { EHT_TARGETS, EHT_DISCLOSURES } from '../../physics/data/eht';

interface EhtComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EhtComparisonModal: React.FC<EhtComparisonModalProps> = ({ isOpen, onClose }) => {
  const [selectedTarget, setSelectedTarget] = useState<'m87' | 'sgra'>('m87');
  const target = EHT_TARGETS[selectedTarget];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-950/50 border border-amber-800 text-amber-400">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-neutral-100 flex items-center gap-2">
                EHT Model-to-Data Comparison Laboratory
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 border border-neutral-700">
                  CLAUDE.md §14
                </span>
              </h2>
              <p className="text-xs text-neutral-400">
                Rigorous scientific comparison of theoretical Kerr geodesics against Event Horizon Telescope observations.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Target Tabs */}
        <div className="flex border-b border-neutral-800 bg-neutral-950 px-6 pt-2 gap-2 text-xs font-mono">
          {(['m87', 'sgra'] as const).map((key) => (
            <button
              key={key}
              onClick={() => setSelectedTarget(key)}
              className={`px-4 py-2 border-b-2 font-medium transition-colors ${
                selectedTarget === key
                  ? 'border-sky-400 text-sky-300 bg-neutral-900/50 rounded-t'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {EHT_TARGETS[key].name} ({EHT_TARGETS[key].host_galaxy})
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {/* Side by side comparison cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Theoretical Model Card */}
            <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                <span className="font-semibold text-sky-400 text-sm">Theoretical Mathematical Model</span>
                <span className="text-[10px] font-mono text-neutral-500 uppercase">Vacuum General Relativity</span>
              </div>
              <div className="aspect-square bg-neutral-900 rounded border border-neutral-800/80 flex items-center justify-center p-4 relative overflow-hidden">
                {/* Synthetic SVG representing pure Kerr shadow with photon ring */}
                <svg viewBox="0 0 200 200" className="w-48 h-48">
                  {/* Outer accretion emission */}
                  <defs>
                    <radialGradient id="accGrad" cx="45%" cy="50%" r="50%">
                      <stop offset="35%" stopColor="#000000" />
                      <stop offset="48%" stopColor="#f59e0b" stopOpacity="0.8" />
                      <stop offset="65%" stopColor="#ef4444" stopOpacity="0.4" />
                      <stop offset="90%" stopColor="#000000" stopOpacity="0" />
                    </radialGradient>
                  </defs>
                  <circle cx="100" cy="100" r="85" fill="url(#accGrad)" />
                  {/* Asymmetric Doppler brightening on approaching side */}
                  <ellipse cx="85" cy="100" rx="45" ry="30" fill="#38bdf8" opacity="0.25" />
                  {/* Sharp mathematical shadow boundary */}
                  <ellipse cx="102" cy="100" rx="36" ry="35" fill="#000000" stroke="#fbbf24" strokeWidth="1.5" />
                  {/* Photon ring sub-rings */}
                  <ellipse cx="102" cy="100" rx="37.5" ry="36.5" fill="none" stroke="#ffffff" strokeWidth="0.8" opacity="0.7" />
                </svg>
                <span className="absolute bottom-2 text-[10px] font-mono text-neutral-500">
                  Infinitely sharp mathematical photon ring
                </span>
              </div>
              <div className="space-y-1.5 font-mono text-[11px] text-neutral-300">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Predicted Shadow Diam.:</span>
                  <span className="text-sky-300 font-semibold">{target.predicted_kerr_diameter_microarcsec}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Critical Impact Parameter:</span>
                  <span>b_crit = 3√3 M ≈ 5.196 M</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Spacetime Geometry:</span>
                  <span>Stationary Axisymmetric Kerr</span>
                </div>
              </div>
            </div>

            {/* Reconstructed EHT Observation Card */}
            <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                <span className="font-semibold text-amber-400 text-sm">EHT Observational Reconstruction</span>
                <span className="text-[10px] font-mono text-neutral-500 uppercase">VLBI Calibrated Data</span>
              </div>
              <div className="aspect-square bg-neutral-900 rounded border border-neutral-800/80 flex items-center justify-center p-4 relative overflow-hidden">
                {/* Convolved blurry representation showing beam size */}
                <svg viewBox="0 0 200 200" className="w-48 h-48 filter blur-[2px]">
                  <circle cx="100" cy="100" r="45" fill="none" stroke="#f59e0b" strokeWidth="22" opacity="0.8" />
                  <circle cx="100" cy="100" r="32" fill="#000000" />
                  {/* Crescent brightness peak at south */}
                  <path d="M 60 115 A 45 45 0 0 0 140 115" fill="none" stroke="#fbbf24" strokeWidth="26" opacity="0.9" />
                </svg>
                <div className="absolute top-2 right-2 border border-neutral-700 bg-neutral-950/80 px-2 py-0.5 rounded font-mono text-[9px] text-neutral-400">
                  Beam PSF: ~20 μas
                </div>
                <span className="absolute bottom-2 text-[10px] font-mono text-neutral-500">
                  Synthesized beam convolved reconstruction
                </span>
              </div>
              <div className="space-y-1.5 font-mono text-[11px] text-neutral-300">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Measured Ring Diameter:</span>
                  <span className="text-amber-300 font-semibold">{target.measured_shadow_diameter_microarcsec}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Observed Asymmetry:</span>
                  <span>Southern crescent brightness peak</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Instrument Array:</span>
                  <span>Global 1.3 mm VLBI baseline</span>
                </div>
              </div>
            </div>
          </div>

          {/* Mandatory Disclosures (CLAUDE.md §14) */}
          <div className="bg-neutral-950 border border-amber-900/60 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-amber-300 text-xs uppercase tracking-wider">
              <Info className="w-4 h-4 text-amber-400" />
              Scientific Honesty: Disclosed Non-Vacuum Physical Effects
            </div>
            <p className="text-neutral-400 leading-relaxed text-xs">
              A vacuum Kerr raytracer computes light paths through idealized empty spacetime. The real image
              captured by the Event Horizon Telescope is governed by complex astrophysical processes:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              {EHT_DISCLOSURES.map((item, idx) => {
                const [title, desc] = item.split(': ');
                return (
                  <div key={idx} className="bg-neutral-900/70 p-3 rounded border border-neutral-800/80 space-y-1">
                    <span className="font-semibold text-neutral-200 block">{title}</span>
                    <span className="text-neutral-400 leading-normal block">{desc}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Astrophysical Metadata */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-4 font-mono text-[11px] space-y-2">
            <div className="text-neutral-400 uppercase text-[10px] tracking-wider font-semibold">
              Source Parameters: {target.name}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-neutral-300">
              <div>
                <span className="text-neutral-500 block">Host Galaxy:</span>
                <span>{target.host_galaxy}</span>
              </div>
              <div>
                <span className="text-neutral-500 block">Mass:</span>
                <span>{target.mass_solar}</span>
              </div>
              <div>
                <span className="text-neutral-500 block">Distance:</span>
                <span>{target.distance_Mpc} Mpc</span>
              </div>
              <div>
                <span className="text-neutral-500 block">Observation Campaign:</span>
                <span>{target.observation_date}</span>
              </div>
            </div>
            <div className="text-neutral-500 text-[10px] pt-1 border-t border-neutral-800/80">
              Citation: {target.citation}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-neutral-800 bg-neutral-950/80 text-[11px] text-neutral-400 flex items-center justify-between font-mono">
          <span>Model-to-Data Comparison • All Approximations Disclosed</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-sans transition-colors"
          >
            Close Comparison
          </button>
        </div>
      </div>
    </div>
  );
};
