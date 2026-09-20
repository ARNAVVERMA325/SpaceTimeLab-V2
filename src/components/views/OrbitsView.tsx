/**
 * @license
 * Spacetime Lab — AnyaLabs
 * Timelike Geodesic Dynamics & Orbital Phase Space View (CLAUDE.md §3 & §7.2)
 * Simulates relativistic test-particle motion, ISCO stability, zoom-whirl orbits,
 * and perihelion precession with live symplectic and RKF45 energy conservation tracking.
 */

import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, RotateCcw, Compass, Activity, Sliders } from 'lucide-react';
import { stepSymplecticVerlet, SymplecticOrbitState } from '../../physics/integrators/symplectic';
import { stepRK4 } from '../../physics/integrators/rk4';
import { stepRKF45 } from '../../physics/integrators/rkf45';
import { State8D } from '../../physics/integrators/geodesic_equations';
import { SchwarzschildMetric } from '../../physics/metrics/schwarzschild';
import { IntegratorType } from '../../physics/types';

interface OrbitPreset {
  id: string;
  name: string;
  description: string;
  r0: number;
  dr0: number;
  Lz: number;
}

const PRESETS: OrbitPreset[] = [
  {
    id: 'precession',
    name: 'Perihelion Precession',
    description: 'Bound eccentric orbit exhibiting General Relativistic rosette advance Δφ ≈ 6πM/p.',
    r0: 8.5,
    dr0: 0.0,
    Lz: 3.85,
  },
  {
    id: 'zoom_whirl',
    name: 'Zoom-Whirl Orbit',
    description: 'High eccentricity trajectory that whirls multiple times near r ≈ 3.5 M before zooming back out.',
    r0: 12.0,
    dr0: -0.18,
    Lz: 3.76,
  },
  {
    id: 'isco',
    name: 'ISCO (r = 6.0 M)',
    description: 'Innermost stable circular orbit at exactly r = 6 M. Marginally stable equilibrium.',
    r0: 6.0,
    dr0: 0.0,
    Lz: Math.sqrt(12.0), // 2*sqrt(3) ≈ 3.4641
  },
  {
    id: 'plunge',
    name: 'Horizon Plunge',
    description: 'Sub-critical angular momentum trajectory falling directly into the event horizon r = 2 M.',
    r0: 10.0,
    dr0: -0.25,
    Lz: 3.0,
  },
];

export const OrbitsView: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const potCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [selectedPreset, setSelectedPreset] = useState<string>('precession');
  const [integrator, setIntegrator] = useState<IntegratorType>('symplectic');
  const [isRunning, setIsRunning] = useState<boolean>(true);

  // Simulation state
  const stateRef = useRef<SymplecticOrbitState>({
    r: 8.5,
    phi: 0,
    p_r: 0,
    tau: 0,
    E: 0.95,
    L_z: 3.85,
  });

  const trajectoryRef = useRef<{ x: number; y: number }[]>([]);
  const initialEnergyRef = useRef<number>(0.95);
  const animRef = useRef<number | null>(null);

  const M = 1.0;

  // Reset to preset
  const resetToPreset = (presetId: string) => {
    const p = PRESETS.find((item) => item.id === presetId) || PRESETS[0];
    setSelectedPreset(p.id);

    const V_eff = (1.0 - (2.0 * M) / p.r0) * (1.0 + (p.Lz * p.Lz) / (p.r0 * p.r0));
    const E0 = Math.sqrt(p.dr0 * p.dr0 + V_eff);

    stateRef.current = {
      r: p.r0,
      phi: 0,
      p_r: p.dr0,
      tau: 0,
      E: E0,
      L_z: p.Lz,
    };
    initialEnergyRef.current = E0;
    trajectoryRef.current = [];
  };

  useEffect(() => {
    resetToPreset('precession');
  }, []);

  // Main simulation and render loop
  useEffect(() => {
    let lastTime = performance.now();

    const loop = (time: number) => {
      const dtMs = time - lastTime;
      lastTime = time;

      if (isRunning) {
        // Step simulation (multiple sub-steps for precision)
        const subSteps = 15;
        const dtau = 0.02 / subSteps;

        for (let s = 0; s < subSteps; s++) {
          if (stateRef.current.r <= 2.01 * M) {
            // Reached horizon
            break;
          }

          if (integrator === 'symplectic') {
            stateRef.current = stepSymplecticVerlet(stateRef.current, dtau, M);
          } else {
            // Standard Runge-Kutta step
            const r = stateRef.current.r;
            const phi = stateRef.current.phi;
            const f = 1.0 - (2.0 * M) / r;
            const u0 = stateRef.current.E / f;
            const u1 = stateRef.current.p_r;
            const u3 = stateRef.current.L_z / (r * r);

            const st8: State8D = {
              x: [0, r, Math.PI / 2, phi],
              u: [u0, u1, 0, u3],
            };

            const next = integrator === 'rkf45'
              ? stepRKF45(st8, dtau, 1e-8, 'schwarzschild', M).nextState
              : stepRK4(st8, dtau, 'schwarzschild', M);

            const nextR = next.x[1];
            const nextPhi = next.x[3];
            const nextPr = next.u[1];

            const V_eff = (1.0 - (2.0 * M) / nextR) * (1.0 + (stateRef.current.L_z * stateRef.current.L_z) / (nextR * nextR));
            const nextE = Math.sqrt(Math.max(0, nextPr * nextPr + V_eff));

            stateRef.current = {
              r: nextR,
              phi: nextPhi,
              p_r: nextPr,
              tau: stateRef.current.tau + dtau,
              E: nextE,
              L_z: stateRef.current.L_z,
            };
          }

          // Record trajectory points
          const x = stateRef.current.r * Math.cos(stateRef.current.phi);
          const y = stateRef.current.r * Math.sin(stateRef.current.phi);
          trajectoryRef.current.push({ x, y });
          if (trajectoryRef.current.length > 2500) {
            trajectoryRef.current.shift();
          }
        }
      }

      // Draw Orbit Canvas
      drawOrbitCanvas();
      drawPotentialCanvas();

      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isRunning, integrator]);

  const drawOrbitCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const scale = (w * 0.42) / 16.0; // 16M radius window

    ctx.fillStyle = '#050508';
    ctx.fillRect(0, 0, w, h);

    // Coordinate grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 1;
    [4, 8, 12, 16].forEach((rRing) => {
      ctx.beginPath();
      ctx.arc(cx, cy, rRing * scale, 0, Math.PI * 2);
      ctx.stroke();
    });

    // Event Horizon r = 2M
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(cx, cy, 2 * M * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Photon Sphere r = 3M
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.2;
    ctx.setLineDash([3, 4]);
    ctx.beginPath();
    ctx.arc(cx, cy, 3 * M * scale, 0, Math.PI * 2);
    ctx.stroke();

    // ISCO r = 6M
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 1.2;
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.arc(cx, cy, 6 * M * scale, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Trajectory path
    const pts = trajectoryRef.current;
    if (pts.length > 1) {
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(cx + pts[0].x * scale, cy - pts[0].y * scale);
      for (let i = 1; i < pts.length; i++) {
        ctx.lineTo(cx + pts[i].x * scale, cy - pts[i].y * scale);
      }
      ctx.stroke();
    }

    // Particle current position
    const current = stateRef.current;
    const px = cx + current.r * Math.cos(current.phi) * scale;
    const py = cy - current.r * Math.sin(current.phi) * scale;

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(px, py, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(px, py, 7.5, 0, Math.PI * 2);
    ctx.stroke();
  };

  const drawPotentialCanvas = () => {
    const canvas = potCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, w, h);

    const padL = 45;
    const padR = 20;
    const padT = 20;
    const padB = 30;
    const plotW = w - padL - padR;
    const plotH = h - padT - padB;

    const Lz = stateRef.current.L_z;
    const rMin = 2.05 * M;
    const rMax = 18.0 * M;
    const VMin = 0.8;
    const VMax = 1.05;

    const mapX = (rVal: number) => padL + ((rVal - rMin) / (rMax - rMin)) * plotW;
    const mapY = (vVal: number) => padT + (1.0 - (vVal - VMin) / (VMax - VMin)) * plotH;

    // Grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    [0.85, 0.9, 0.95, 1.0].forEach((v) => {
      const y = mapY(v);
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(w - padR, y);
      ctx.stroke();
      ctx.fillStyle = '#666';
      ctx.font = '9px monospace';
      ctx.fillText(v.toFixed(2), 10, y + 3);
    });

    // Draw V_eff curve
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2;
    ctx.beginPath();
    let first = true;
    for (let r = rMin; r <= rMax; r += 0.1) {
      const V_eff = (1.0 - (2.0 * M) / r) * (1.0 + (Lz * Lz) / (r * r));
      const x = mapX(r);
      const y = mapY(V_eff);
      if (first) {
        ctx.moveTo(x, y);
        first = false;
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();

    // Energy line E^2
    const E2 = stateRef.current.E * stateRef.current.E;
    const yE = mapY(E2);
    ctx.strokeStyle = '#ef4444';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(padL, yE);
    ctx.lineTo(w - padR, yE);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#ef4444';
    ctx.fillText(`E² = ${E2.toFixed(4)}`, w - padR - 75, yE - 4);

    // Particle dot on V_eff
    const currR = stateRef.current.r;
    const currV = (1.0 - (2.0 * M) / currR) * (1.0 + (Lz * Lz) / (currR * currR));
    const dotX = mapX(currR);
    const dotY = mapY(currV);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(dotX, dotY, 4, 0, Math.PI * 2);
    ctx.fill();

    // Axes
    ctx.strokeStyle = '#444';
    ctx.beginPath();
    ctx.moveTo(padL, padT);
    ctx.lineTo(padL, h - padB);
    ctx.lineTo(w - padR, h - padB);
    ctx.stroke();
    ctx.fillStyle = '#888';
    ctx.fillText('Radius r (M)', w / 2 - 20, h - 8);
  };

  const currentEnergy = stateRef.current.E;
  const relEnergyDrift = Math.abs(currentEnergy - initialEnergyRef.current) / initialEnergyRef.current;

  return (
    <div id="orbits-view-container" className="flex flex-col h-full bg-neutral-950 text-neutral-200">
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left: 2D Orbit plane */}
        <div className="flex-1 bg-black flex flex-col items-center justify-center p-4 relative">
          <canvas
            ref={canvasRef}
            width={540}
            height={540}
            className="w-full max-w-[500px] aspect-square rounded border border-neutral-800 shadow-2xl block"
          />

          {/* Orbit Legend */}
          <div className="absolute top-6 left-6 font-mono text-[11px] bg-neutral-900/85 backdrop-blur p-3 rounded border border-neutral-800 space-y-1">
            <div className="text-neutral-400 uppercase text-[9px] font-semibold tracking-wider">Features</div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <span>Horizon r = 2.0 M</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-0.5 border-b border-dashed border-sky-400" />
              <span>Photon Sphere r = 3.0 M</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-0.5 border-b border-dashed border-emerald-400" />
              <span>ISCO r = 6.0 M</span>
            </div>
          </div>
        </div>

        {/* Right: Effective potential & telemetry */}
        <div className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-neutral-800 bg-neutral-900/50 p-5 flex flex-col gap-4 overflow-y-auto">
          <div>
            <div className="text-xs uppercase tracking-wider font-semibold text-neutral-400 mb-1 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-sky-400" />
              Effective Potential V_eff(r)
            </div>
            <canvas
              ref={potCanvasRef}
              width={350}
              height={180}
              className="w-full rounded border border-neutral-800 block shadow-inner bg-black"
            />
          </div>

          {/* Numerical Invariants HUD */}
          <div className="bg-neutral-950 border border-neutral-800 rounded p-3 font-mono text-xs space-y-1.5">
            <div className="text-neutral-400 uppercase text-[10px] tracking-wider font-semibold border-b border-neutral-800 pb-1">
              Live Conserved Invariants
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Coordinate Radius r:</span>
              <span className="text-neutral-200">{stateRef.current.r.toFixed(3)} M</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Radial Velocity dr/dτ:</span>
              <span className="text-neutral-200">{stateRef.current.p_r.toFixed(4)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Killing Energy E:</span>
              <span className="text-amber-400 font-semibold">{stateRef.current.E.toFixed(6)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Angular Momentum L_z:</span>
              <span className="text-sky-300">{stateRef.current.L_z.toFixed(4)} M</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Relative Drift |ΔE/E|:</span>
              <span className={relEnergyDrift < 1e-4 ? 'text-emerald-400 font-semibold' : 'text-amber-400'}>
                {relEnergyDrift.toExponential(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Proper Time τ:</span>
              <span className="text-neutral-400">{stateRef.current.tau.toFixed(1)} M</span>
            </div>
          </div>

          {/* Preset details */}
          <div className="bg-neutral-950/60 border border-neutral-800 rounded p-3 text-xs space-y-1 font-mono">
            <div className="text-neutral-400 text-[10px] uppercase font-semibold">Active Dynamics Mode</div>
            <p className="text-[11px] text-neutral-300 leading-snug">
              {PRESETS.find((p) => p.id === selectedPreset)?.description}
            </p>
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="border-t border-neutral-800/80 bg-neutral-900/70 p-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            {/* Presets */}
            <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded border border-neutral-800">
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  id={`preset-${p.id}-btn`}
                  onClick={() => resetToPreset(p.id)}
                  className={`px-2.5 py-1.5 rounded font-medium transition-colors ${
                    selectedPreset === p.id
                      ? 'bg-sky-950/80 text-sky-300 border border-sky-800'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>

            {/* Integrator selection */}
            <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded border border-neutral-800">
              <span className="text-neutral-400 px-2 font-mono">Integrator:</span>
              {(['symplectic', 'rkf45', 'rk4'] as IntegratorType[]).map((type) => (
                <button
                  key={type}
                  id={`integrator-${type}-btn`}
                  onClick={() => setIntegrator(type)}
                  className={`px-2.5 py-1 rounded uppercase font-mono font-medium transition-colors ${
                    integrator === type
                      ? 'bg-neutral-800 text-white'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="orbit-play-pause-btn"
              onClick={() => setIsRunning(!isRunning)}
              className="px-3 py-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-white font-medium flex items-center gap-1.5 transition-colors"
            >
              {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              {isRunning ? 'Pause' : 'Resume'}
            </button>

            <button
              id="orbit-reset-btn"
              onClick={() => resetToPreset(selectedPreset)}
              className="p-1.5 rounded bg-neutral-950 border border-neutral-800 text-neutral-400 hover:text-neutral-200"
              title="Reset Orbit"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
