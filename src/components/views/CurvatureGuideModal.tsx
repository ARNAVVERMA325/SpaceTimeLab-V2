/**
 * @license
 * Spacetime Lab — AnyaLabs
 * Spacetime Curvature Scientific Guide Modal
 * Explains how spacetime curvature is mathematically defined and visually observed across the lab,
 * directly referencing CLAUDE.md §5, §6, §7, and §18.
 */

import React from 'react';
import { X, Layers, Activity, Eye, Orbit, Compass, BookOpen, ExternalLink, ArrowRight } from 'lucide-react';
import { LabTab } from '../../App';

interface CurvatureGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab: (tab: LabTab) => void;
}

export const CurvatureGuideModal: React.FC<CurvatureGuideModalProps> = ({
  isOpen,
  onClose,
  onSelectTab,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-sky-950/50 border border-sky-800 text-sky-400">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-neutral-100 flex items-center gap-2">
                How to See Spacetime Curvature
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 border border-neutral-700">
                  CLAUDE.md §5, §6 & §18
                </span>
              </h2>
              <p className="text-xs text-neutral-400">
                General Relativity defines curvature as geometry, not a Newtonian force. Here is where and how to see it.
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
          <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-4 space-y-2">
            <span className="font-semibold text-neutral-200 text-sm block">
              Is Spacetime Curvature Mentioned in the Project Documentation?
            </span>
            <p className="text-neutral-300 leading-relaxed font-sans">
              <strong className="text-sky-300">Yes, extensively.</strong> In <code className="text-amber-300">CLAUDE.md</code>,
              General Relativity curvature is treated with strict mathematical rigor. Rather than using the classic pop-science
              &quot;bowling ball on a rubber sheet&quot; (which falsely relies on external gravity pulling downward), the project
              splits curvature into 4 distinct physical and mathematical representations:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. Curvature Invariant */}
            <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-4 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center gap-2 text-emerald-400 font-semibold mb-1">
                  <Activity className="w-4 h-4" />
                  <span>1. True Coordinate-Independent Curvature</span>
                </div>
                <div className="text-[11px] text-neutral-500 font-mono mb-2">
                  Referenced in: CLAUDE.md §5.3 (Curvature View)
                </div>
                <p className="text-neutral-300 leading-relaxed font-sans">
                  The true intrinsic curvature of 4D spacetime is given by the Riemann curvature tensor \(R^\alpha_&#123;\beta\gamma\delta&#125;\).
                  In the <strong>Curvature Invariant</strong> tab, we evaluate the <strong>Kretschmann scalar</strong>:
                  <code className="block bg-neutral-900 p-1.5 my-1.5 rounded text-amber-300 font-mono">
                    K = R_abcd R^abcd = 48 M² / r⁶
                  </code>
                  You can see that as \(r \to 0\), \(K \to \infty\) (genuine singularity), but at the horizon \(r = 2M\),
                  \(K = 3/(4M⁴)\) is completely finite!
                </p>
              </div>
              <button
                onClick={() => {
                  onSelectTab('curvature');
                  onClose();
                }}
                className="w-full py-1.5 px-3 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-medium flex items-center justify-center gap-1.5 transition-colors text-xs"
              >
                <span>Open Curvature Invariant View</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 2. 3+1 Spatial Embedding */}
            <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-4 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center gap-2 text-sky-400 font-semibold mb-1">
                  <Layers className="w-4 h-4" />
                  <span>2. Spatial Metric Isometric Embedding</span>
                </div>
                <div className="text-[11px] text-neutral-500 font-mono mb-2">
                  Referenced in: CLAUDE.md §5.2 (3+1 Spatial View)
                </div>
                <p className="text-neutral-300 leading-relaxed font-sans">
                  In the <strong>3+1 Embedding</strong> tab, we take an equatorial 2D spatial slice at constant time \(t\)
                  and embed it isometrically into 3D Euclidean space as <strong>Flamm&apos;s Paraboloid</strong>:
                  <code className="block bg-neutral-900 p-1.5 my-1.5 rounded text-amber-300 font-mono">
                    z(r) = 2 · √[ 2M (r - 2M) ]
                  </code>
                  The funnel&apos;s slope illustrates the spatial distance stretching \(\gamma_&#123;rr&#125; = (1 - 2M/r)^&#123;-1&#125;\),
                  colormapped by the gravitational lapse \(\alpha(r) = \sqrt&#123;1 - 2M/r&#125;\) (rate of proper time).
                </p>
              </div>
              <button
                onClick={() => {
                  onSelectTab('embedding');
                  onClose();
                }}
                className="w-full py-1.5 px-3 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-medium flex items-center justify-center gap-1.5 transition-colors text-xs"
              >
                <span>Open 3+1 Embedding View</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 3. Optical Lensing */}
            <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-4 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center gap-2 text-amber-400 font-semibold mb-1">
                  <Eye className="w-4 h-4" />
                  <span>3. Optical Ray Deflection & Shadow</span>
                </div>
                <div className="text-[11px] text-neutral-500 font-mono mb-2">
                  Referenced in: CLAUDE.md §5.1 (Optical View)
                </div>
                <p className="text-neutral-300 leading-relaxed font-sans">
                  Light travels along null geodesics \(k^\mu k_\mu = 0\). Curvature bends these paths according to
                  Einstein&apos;s weak-field deflection \(\hat&#123;\alpha&#125; \approx 4M/b\). In the <strong>Observer / Optical</strong> tab,
                  you can see background celestial stars lensed into arcs and Einstein rings around the shadow, plus
                  gravitational redshift and Doppler beaming of the accretion disk.
                </p>
              </div>
              <button
                onClick={() => {
                  onSelectTab('optical');
                  onClose();
                }}
                className="w-full py-1.5 px-3 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-medium flex items-center justify-center gap-1.5 transition-colors text-xs"
              >
                <span>Open Observer / Optical View</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 4. Causal Diagram & Light Cones */}
            <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-4 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center gap-2 text-purple-400 font-semibold mb-1">
                  <Compass className="w-4 h-4" />
                  <span>4. Causal Structure & Light-Cone Tilting</span>
                </div>
                <div className="text-[11px] text-neutral-500 font-mono mb-2">
                  Referenced in: CLAUDE.md §5.4 (Causal View)
                </div>
                <p className="text-neutral-300 leading-relaxed font-sans">
                  Spacetime curvature also manifests in the causal structure of time. In the <strong>Causal Diagram</strong> tab,
                  watch the future light cones tilt inward as an observer drops toward the black hole. At \(r &lt; 2M\),
                  the light cones tip completely inward: even light rays fired outward move toward \(r = 0\)!
                </p>
              </div>
              <button
                onClick={() => {
                  onSelectTab('causal');
                  onClose();
                }}
                className="w-full py-1.5 px-3 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-medium flex items-center justify-center gap-1.5 transition-colors text-xs"
              >
                <span>Open Causal Diagram View</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-neutral-800 bg-neutral-950/80 text-[11px] text-neutral-400 flex items-center justify-between font-mono">
          <span>Spacetime Lab • Geometric Gravitation in Action</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-sans transition-colors"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
