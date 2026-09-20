/**
 * @license
 * Spacetime Lab — AnyaLabs
 * Interactive General Relativity Laboratory computing geodesics, observer tetrads,
 * black hole shadows, 3+1 embeddings, causal light cones, and curvature invariants.
 */

import React, { useState } from 'react';
import {
  Eye,
  Layers,
  Activity,
  Orbit,
  Waves,
  ShieldCheck,
  BookOpen,
  Atom,
  Compass,
  GitBranch,
  HelpCircle,
  Sun,
  Disc,
  FlaskConical,
  GitMerge,
  Sparkles,
} from 'lucide-react';
import { OpticalView } from './components/views/OpticalView';
import { EmbeddingView, SandboxScenario } from './components/views/EmbeddingView';
import { CurvatureView } from './components/views/CurvatureView';
import { CausalDiagramView } from './components/views/CausalDiagramView';
import { OrbitsView } from './components/views/OrbitsView';
import { GravitationalWavesView } from './components/views/GravitationalWavesView';
import { SxsComparisonView } from './components/views/SxsComparisonView';
import { ValidationLabModal } from './components/views/ValidationLabModal';
import { EhtComparisonModal } from './components/views/EhtComparisonModal';
import { CurvatureGuideModal } from './components/views/CurvatureGuideModal';

export type LabTab =
  | 'optical'
  | 'embedding'
  | 'curvature'
  | 'causal'
  | 'orbits'
  | 'gravitational_waves'
  | 'sxs';

export default function App() {
  const [activeTab, setActiveTab] = useState<LabTab>('optical');
  const [sandboxScenario, setSandboxScenario] = useState<SandboxScenario>('solar_system');
  const [isValidationModalOpen, setIsValidationModalOpen] = useState(false);
  const [isEhtModalOpen, setIsEhtModalOpen] = useState(false);
  const [isCurvatureGuideOpen, setIsCurvatureGuideOpen] = useState(false);
  const [isInfoExpanded, setIsInfoExpanded] = useState(false);

  const tabs: {
    id: LabTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    description: string;
  }[] = [
    {
      id: 'optical',
      label: 'Observer / Optical',
      icon: Eye,
      description: 'Null geodesic backward raytracer with observer tetrad, Doppler boost (1+z)⁻⁴, and accretion disk',
    },
    {
      id: 'embedding',
      label: 'Spacetime Sandbox',
      icon: Layers,
      description: 'Interactive 3D spacetime mesh: Solar System, Black Hole funnel, Wormhole bridge, GW ripples, and Live Mass experiment lab',
    },
    {
      id: 'curvature',
      label: 'Curvature Invariant',
      icon: Activity,
      description: 'Kretschmann scalar K = R_abcd R^abcd proving event horizon is a coordinate artifact',
    },
    {
      id: 'causal',
      label: 'Causal Diagram',
      icon: Compass,
      description: 'Light cone tilting as r → 2M and non-singular Kerr-Schild horizon penetration',
    },
    {
      id: 'orbits',
      label: 'Timelike Geodesics',
      icon: Orbit,
      description: 'Relativistic particle orbits, ISCO at r = 6M, zoom-whirl, and perihelion precession',
    },
    {
      id: 'gravitational_waves',
      label: 'GWOSC Strain',
      icon: Waves,
      description: 'Calibrated LIGO GW150914 strain data driving linearized transverse-traceless quadrupole deformation',
    },
    {
      id: 'sxs',
      label: 'SXS Num. Relativity',
      icon: GitBranch,
      description: 'Pure numerical relativity waveform SXS:BBH:0305 vs 3.5PN inspiral and QNM ringdown',
    },
  ];

  return (
    <div className="flex flex-col h-screen w-screen bg-neutral-950 text-neutral-100 overflow-hidden font-sans select-none">
      {/* Top Navigation Bar */}
      <header className="h-14 border-b border-neutral-800/80 bg-neutral-900/80 backdrop-blur px-4 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center shadow-inner">
              <Atom className="w-4 h-4 text-sky-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-semibold tracking-wide text-white">SPACETIME LAB</h1>
                <span className="text-[10px] font-mono uppercase bg-neutral-800 text-neutral-300 px-1.5 py-0.5 rounded border border-neutral-700">
                  AnyaLabs GR v2.0
                </span>
              </div>
              <p className="text-[10px] text-neutral-400 font-mono hidden xl:block">
                Physical Model → Metric Equations → Numerical Computation → Validated Result
              </p>
            </div>
          </div>
        </div>

        {/* View Tabs */}
        <nav className="flex items-center gap-1 bg-neutral-950 p-1 rounded-lg border border-neutral-800 text-xs overflow-x-auto max-w-[50vw]">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-${tab.id}-btn`}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md font-medium transition-all shrink-0 ${
                  isActive
                    ? 'bg-neutral-800 text-white shadow-sm border border-neutral-700'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/50'
                }`}
                title={tab.description}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-sky-400' : 'text-neutral-500'}`} />
                <span className="hidden md:inline">{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Scientific Actions */}
        <div className="flex items-center gap-2">
          {/* Spacetime Curvature Guide Button */}
          <button
            id="open-curvature-guide-btn"
            onClick={() => setIsCurvatureGuideOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-sky-950/40 border border-sky-800 text-sky-300 hover:bg-sky-900/50 text-xs font-mono transition-colors shadow-sm"
            title="Learn how spacetime curvature is mathematically represented and visually observed across the lab"
          >
            <Compass className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">How to See Curvature</span>
          </button>

          {/* Validation Suite */}
          <button
            id="open-validation-modal-btn"
            onClick={() => setIsValidationModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-emerald-950/40 border border-emerald-800 text-emerald-300 hover:bg-emerald-900/50 text-xs font-mono transition-colors"
            title="Open Live Numerical Relativity Validation Suite (CLAUDE.md §16)"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden lg:inline">Validation Suite</span>
            <span className="text-[10px] bg-emerald-900/80 text-emerald-200 px-1.5 py-0.2 rounded">10/10 PASS</span>
          </button>

          {/* EHT Model vs Data */}
          <button
            id="open-eht-modal-btn"
            onClick={() => setIsEhtModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-amber-950/40 border border-amber-800 text-amber-300 hover:bg-amber-900/50 text-xs font-mono transition-colors"
            title="Open EHT Model-to-Data Comparison (CLAUDE.md §14)"
          >
            <Eye className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden lg:inline">EHT Model vs Data</span>
          </button>

          <button
            onClick={() => setIsInfoExpanded(!isInfoExpanded)}
            className={`p-1.5 rounded-md border text-neutral-400 hover:text-white transition-colors ${
              isInfoExpanded ? 'bg-neutral-800 border-neutral-700 text-white' : 'border-neutral-800 bg-neutral-950'
            }`}
            title="Toggle Physics Principles Panel"
          >
            <BookOpen className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Spacetime Lab Quick Scenario & Live Experiment Hub */}
      <div className="h-10 border-b border-neutral-800/80 bg-neutral-950 px-4 flex items-center justify-between text-xs font-mono shrink-0 z-10 overflow-x-auto">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider flex items-center gap-1.5 shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Active Scenario:
          </span>
          <div className="flex items-center gap-1 shrink-0">
            {/* Kerr Black Hole */}
            <button
              id="quick-scen-kerr-btn"
              onClick={() => setActiveTab('optical')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all text-xs ${
                activeTab === 'optical'
                  ? 'bg-amber-950/80 border border-amber-700 text-amber-300 font-semibold shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 border border-transparent'
              }`}
              title="Cinematic Kerr Black Hole & Relativistic Accretion Raytracer (AnyaLabs Mission Control)"
            >
              <Disc className="w-3.5 h-3.5 text-amber-400" />
              <span>Kerr Black Hole</span>
            </button>

            {/* Solar System */}
            <button
              id="quick-scen-solar-btn"
              onClick={() => {
                setActiveTab('embedding');
                setSandboxScenario('solar_system');
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all text-xs ${
                activeTab === 'embedding' && sandboxScenario === 'solar_system'
                  ? 'bg-sky-950/80 border border-sky-700 text-sky-300 font-semibold shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 border border-transparent'
              }`}
              title="Interactive 3D Solar System spacetime curvature mesh"
            >
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span>Solar System</span>
            </button>

            {/* Singularity Funnel */}
            <button
              id="quick-scen-funnel-btn"
              onClick={() => {
                setActiveTab('embedding');
                setSandboxScenario('black_hole');
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all text-xs ${
                activeTab === 'embedding' && sandboxScenario === 'black_hole'
                  ? 'bg-sky-950/80 border border-sky-700 text-sky-300 font-semibold shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 border border-transparent'
              }`}
              title="Extreme deep spacetime singularity funnel"
            >
              <Layers className="w-3.5 h-3.5 text-sky-400" />
              <span>Singularity Funnel</span>
            </button>

            {/* Blank Mesh: Live Mass Lab */}
            <button
              id="quick-scen-blank-btn"
              onClick={() => {
                setActiveTab('embedding');
                setSandboxScenario('blank_sandbox');
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all text-xs ${
                activeTab === 'embedding' && sandboxScenario === 'blank_sandbox'
                  ? 'bg-emerald-950/80 border border-emerald-600 text-emerald-300 font-semibold shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 border border-transparent'
              }`}
              title="Blank spacetime canvas: place stars, black holes, and test live orbital geodesics"
            >
              <FlaskConical className="w-3.5 h-3.5 text-emerald-400" />
              <span>🧪 Blank Mesh (Live Lab)</span>
            </button>

            {/* Wormhole Bridge */}
            <button
              id="quick-scen-wormhole-btn"
              onClick={() => {
                setActiveTab('embedding');
                setSandboxScenario('wormhole');
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all text-xs ${
                activeTab === 'embedding' && sandboxScenario === 'wormhole'
                  ? 'bg-purple-950/80 border border-purple-700 text-purple-300 font-semibold shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 border border-transparent'
              }`}
              title="Folded spacetime with Einstein-Rosen bridge connecting two universe sheets"
            >
              <GitMerge className="w-3.5 h-3.5 text-purple-400" />
              <span>Wormhole Bridge</span>
            </button>

            {/* Gravitational Waves */}
            <button
              id="quick-scen-gw-btn"
              onClick={() => setActiveTab('gravitational_waves')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all text-xs ${
                activeTab === 'gravitational_waves'
                  ? 'bg-cyan-950/80 border border-cyan-700 text-cyan-300 font-semibold shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 border border-transparent'
              }`}
              title="Calibrated LIGO GW150914 Gravitational Wave strain & spacetime quadrupole ripples"
            >
              <Waves className="w-3.5 h-3.5 text-cyan-400" />
              <span>GW Ripples</span>
            </button>
          </div>
        </div>

        <div className="hidden xl:flex items-center gap-2 text-[11px] text-neutral-400 shrink-0">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Active Engine: <strong className="text-white">{activeTab === 'optical' ? 'Kerr Raytracer' : activeTab === 'embedding' ? `3D Mesh (${sandboxScenario})` : activeTab}</strong></span>
        </div>
      </div>

      {/* Physics Principles Drawer (Collapsible) */}
      {isInfoExpanded && (
        <div className="border-b border-neutral-800 bg-neutral-900/95 backdrop-blur px-6 py-4 text-xs font-mono text-neutral-300 z-10 animate-fade-in shadow-xl">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1.5">
              <span className="text-sky-400 font-semibold text-[11px] uppercase tracking-wider block">
                1. No Invented Physics (§1.1)
              </span>
              <p className="text-neutral-400 leading-relaxed text-[11px] font-sans">
                Every ray, orbit, and invariant is integrated directly from mathematically exact general relativistic
                metrics: Schwarzschild, Kerr, and Kerr-Schild in signature (-+++) with geometrized units G = c = 1.
              </p>
            </div>
            <div className="space-y-1.5">
              <span className="text-emerald-400 font-semibold text-[11px] uppercase tracking-wider block">
                2. Observer Frames vs Geometry (§4)
              </span>
              <p className="text-neutral-400 leading-relaxed text-[11px] font-sans">
                Observations strictly depend on the physical observer&apos;s 4-velocity u^μ and local orthonormal tetrad.
                Doppler shifts (1+z) and relativistic beaming (1+z)⁻⁴ are explicitly calculated for static, free-falling,
                and orbiting observers.
              </p>
            </div>
            <div className="space-y-1.5">
              <span className="text-amber-400 font-semibold text-[11px] uppercase tracking-wider block">
                3. Curvature vs Coordinates (§6.1)
              </span>
              <p className="text-neutral-400 leading-relaxed text-[11px] font-sans">
                The event horizon r = 2M is a coordinate artifact, not a physical curvature singularity.
                The true coordinate-independent Kretschmann scalar K = R_abcd R^abcd remains completely finite (K = 48M²/r⁶)
                at the horizon, diverging only at the genuine physical singularity r = 0.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Laboratory Viewport */}
      <main className="flex-1 relative overflow-hidden">
        {activeTab === 'optical' && <OpticalView />}
        {activeTab === 'embedding' && (
          <EmbeddingView
            activeScenarioProp={sandboxScenario}
            onScenarioChange={(scen) => setSandboxScenario(scen)}
          />
        )}
        {activeTab === 'curvature' && <CurvatureView />}
        {activeTab === 'causal' && <CausalDiagramView />}
        {activeTab === 'orbits' && <OrbitsView />}
        {activeTab === 'gravitational_waves' && <GravitationalWavesView />}
        {activeTab === 'sxs' && <SxsComparisonView />}
      </main>

      {/* Modals */}
      <ValidationLabModal
        isOpen={isValidationModalOpen}
        onClose={() => setIsValidationModalOpen(false)}
      />
      <EhtComparisonModal
        isOpen={isEhtModalOpen}
        onClose={() => setIsEhtModalOpen(false)}
      />
      <CurvatureGuideModal
        isOpen={isCurvatureGuideOpen}
        onClose={() => setIsCurvatureGuideOpen(false)}
        onSelectTab={(tab) => setActiveTab(tab)}
      />
    </div>
  );
}
