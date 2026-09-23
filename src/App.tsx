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
  Settings,
  Terminal,
  Globe,
} from 'lucide-react';
import { WorkstationView } from './components/views/WorkstationView';
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
import { DomainGuideModal } from './components/views/DomainGuideModal';

export type MainNavTab = 'explore' | 'simulate' | 'observations' | 'theory' | 'data';

export type LabTab =
  | 'optical'
  | 'embedding'
  | 'curvature'
  | 'causal'
  | 'orbits'
  | 'gravitational_waves'
  | 'sxs';

export default function App() {
  const [mainTab, setMainTab] = useState<MainNavTab>('explore');
  const [activeTab, setActiveTab] = useState<LabTab>('embedding');
  const [sandboxScenario, setSandboxScenario] = useState<SandboxScenario>('solar_system');
  const [isValidationModalOpen, setIsValidationModalOpen] = useState(false);
  const [isEhtModalOpen, setIsEhtModalOpen] = useState(false);
  const [isCurvatureGuideOpen, setIsCurvatureGuideOpen] = useState(false);
  const [isDomainModalOpen, setIsDomainModalOpen] = useState(false);
  const [isInfoExpanded, setIsInfoExpanded] = useState(false);

  const mainTabs: { id: MainNavTab; label: string; description: string }[] = [
    {
      id: 'explore',
      label: 'Explore',
      description: 'Unified Research Console with multi-window raytracer, 3+1 foliation, and telemetry dock',
    },
    {
      id: 'simulate',
      label: 'Simulate',
      description: 'Full-screen 3D Spacetime Sandbox with Solar System, Black Hole, and Live Mass placement',
    },
    {
      id: 'observations',
      label: 'Observations',
      description: 'LIGO GWOSC strain ripples, quadrupole distortions, and Event Horizon Telescope data',
    },
    {
      id: 'theory',
      label: 'Theory',
      description: 'Curvature Invariant Kretschmann scalar fields, causal light cones, and coordinate transformations',
    },
    {
      id: 'data',
      label: 'Data',
      description: 'SXS Numerical Relativity waveforms vs 3.5PN post-Newtonian models',
    },
  ];

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
      {/* Top Navigation Bar matching ChatGPT reference */}
      <header className="h-12 border-b border-[#152238] bg-[#090f1a] px-4 flex items-center justify-between shrink-0 z-30 font-mono">
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-400 shadow-sm">
              <Atom className="w-4 h-4" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm font-bold tracking-wider text-white">SPACETIME LAB</span>
              <span className="text-[11px] text-slate-400 font-sans">by AnyaLabs</span>
            </div>
          </div>
        </div>

        {/* Center Primary Navigation Tabs: Explore, Simulate, Observations, Theory, Data */}
        <nav className="flex items-center gap-1 bg-[#05080f] p-1 rounded-xl border border-[#16253c] text-xs">
          {mainTabs.map((tab) => {
            const isActive = mainTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`main-nav-${tab.id}-btn`}
                onClick={() => setMainTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition-all ${
                  isActive
                    ? 'bg-[#0e2c56] text-sky-200 border border-sky-500/40 shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#0c1422]'
                }`}
                title={tab.description}
              >
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Top-Right Telemetry & Action Badges */}
        <div className="flex items-center gap-3 text-xs">
          {/* WebGPU Status Indicator */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#0c1524] border border-[#17263d] text-emerald-300 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold">WebGPU</span>
          </div>

          {/* FPS Counter */}
          <div className="px-2 py-1 rounded-lg bg-[#0c1524] border border-[#17263d] text-slate-300 text-[11px] font-mono">
            <span>FPS: 58</span>
          </div>

          {/* Curvature Guide button */}
          <button
            id="open-curvature-guide-btn"
            onClick={() => setIsCurvatureGuideOpen(true)}
            className="p-1.5 rounded-lg bg-[#0c1524] border border-[#17263d] text-slate-400 hover:text-white transition-colors"
            title="Spacetime Curvature Guide"
          >
            <Compass className="w-4 h-4 text-sky-400" />
          </button>

          {/* Validation Suite / Settings modal */}
          <button
            id="open-validation-modal-btn"
            onClick={() => setIsValidationModalOpen(true)}
            className="p-1.5 rounded-lg bg-[#0c1524] border border-[#17263d] text-slate-400 hover:text-white transition-colors"
            title="Validation Suite & Settings"
          >
            <Settings className="w-4 h-4 text-slate-300" />
          </button>
        </div>
      </header>

      {/* Main Viewport Container */}
      <main className="flex-1 relative overflow-hidden bg-[#05080f]">
        {/* TAB 1: Unified Research Workstation Console (ChatGPT reference UI) */}
        {mainTab === 'explore' && (
          <WorkstationView
            onOpenValidationModal={() => setIsValidationModalOpen(true)}
            onOpenEhtModal={() => setIsEhtModalOpen(true)}
            onOpenCurvatureGuide={() => setIsCurvatureGuideOpen(true)}
            onOpenDomainGuide={() => setIsDomainModalOpen(true)}
          />
        )}

        {/* TAB 2: Full-screen 3D Spacetime Sandbox */}
        {mainTab === 'simulate' && (
          <div className="h-full flex flex-col">
            {/* Quick Scenario bar for simulate */}
            <div className="h-9 border-b border-[#152238] bg-[#090f1a] px-4 flex items-center justify-between text-xs font-mono shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Scenario:
                </span>
                <div className="flex items-center gap-1">
                  {[
                    { id: 'solar_system', label: 'Solar System' },
                    { id: 'black_hole', label: 'Black Hole' },
                    { id: 'wormhole', label: 'Wormhole' },
                    { id: 'gw_waves', label: 'GW Ripples' },
                    { id: 'blank_sandbox', label: '🧪 Blank Mesh (Live Lab)' },
                  ].map((scen) => (
                    <button
                      key={scen.id}
                      onClick={() => setSandboxScenario(scen.id as SandboxScenario)}
                      className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
                        sandboxScenario === scen.id
                          ? 'bg-[#123668] border border-sky-500 text-sky-200 font-semibold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {scen.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex-1 relative">
              <EmbeddingView
                activeScenarioProp={sandboxScenario}
                onScenarioChange={(scen) => setSandboxScenario(scen)}
              />
            </div>
          </div>
        )}

        {/* TAB 3: Observations (LIGO & EHT) */}
        {mainTab === 'observations' && (
          <div className="h-full flex flex-col">
            <div className="h-9 border-b border-[#152238] bg-[#090f1a] px-4 flex items-center justify-between text-xs font-mono shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Observatory Mode:</span>
                <button
                  onClick={() => setIsEhtModalOpen(true)}
                  className="px-2.5 py-0.5 rounded bg-amber-950/60 border border-amber-700 text-amber-300 text-[10px] font-semibold hover:bg-amber-900/60"
                >
                  Open EHT M87* Synthetic Comparison
                </button>
              </div>
            </div>
            <div className="flex-1 relative">
              <GravitationalWavesView />
            </div>
          </div>
        )}

        {/* TAB 4: Theory (Curvature & Causal Light Cones) */}
        {mainTab === 'theory' && (
          <div className="h-full flex flex-col">
            <div className="h-9 border-b border-[#152238] bg-[#090f1a] px-4 flex items-center gap-2 text-xs font-mono shrink-0">
              <button
                onClick={() => setActiveTab('curvature')}
                className={`px-2.5 py-0.5 rounded text-[11px] ${
                  activeTab === 'curvature'
                    ? 'bg-[#123668] border border-sky-500 text-sky-200 font-semibold'
                    : 'text-slate-400'
                }`}
              >
                Kretschmann Curvature
              </button>
              <button
                onClick={() => setActiveTab('causal')}
                className={`px-2.5 py-0.5 rounded text-[11px] ${
                  activeTab === 'causal'
                    ? 'bg-[#123668] border border-sky-500 text-sky-200 font-semibold'
                    : 'text-slate-400'
                }`}
              >
                Causal Light Cones
              </button>
              <button
                onClick={() => setActiveTab('orbits')}
                className={`px-2.5 py-0.5 rounded text-[11px] ${
                  activeTab === 'orbits'
                    ? 'bg-[#123668] border border-sky-500 text-sky-200 font-semibold'
                    : 'text-slate-400'
                }`}
              >
                Timelike Orbits
              </button>
            </div>
            <div className="flex-1 relative">
              {activeTab === 'causal' ? (
                <CausalDiagramView />
              ) : activeTab === 'orbits' ? (
                <OrbitsView />
              ) : (
                <CurvatureView />
              )}
            </div>
          </div>
        )}

        {/* TAB 5: Data (SXS Numerical Relativity Waveforms) */}
        {mainTab === 'data' && (
          <div className="h-full relative">
            <SxsComparisonView />
          </div>
        )}
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
      <DomainGuideModal
        isOpen={isDomainModalOpen}
        onClose={() => setIsDomainModalOpen(false)}
      />
    </div>
  );
}
