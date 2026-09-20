/**
 * @license
 * Spacetime Lab — AnyaLabs
 * SXS Numerical-Relativity Laboratory View (CLAUDE.md §13 & Milestone 5B)
 * Rigorous multi-trace comparison of pure Numerical Relativity simulation data (SXS:BBH:0305)
 * against Post-Newtonian inspiral approximations and Perturbative QNM ringdown models.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Activity, Info, BarChart3, Radio } from 'lucide-react';
import {
  SXS_BBH_0305_METADATA,
  SXS_BBH_0305_WAVEFORM,
  getPostNewtonianApproximation,
  getQnmRingdownApproximation,
} from '../../physics/data/sxs';

export const SxsComparisonView: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [timeIdx, setTimeIdx] = useState<number>(13); // Merger peak
  const [showPN, setShowPN] = useState<boolean>(true);
  const [showQNM, setShowQNM] = useState<boolean>(true);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Playback timer
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setTimeIdx((prev) => (prev + 1) % SXS_BBH_0305_WAVEFORM.length);
    }, 200);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const currentPt = SXS_BBH_0305_WAVEFORM[timeIdx];

  // Draw Waveform Comparison Plot
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const padL = 55;
    const padR = 25;
    const padT = 30;
    const padB = 40;
    const plotW = w - padL - padR;
    const plotH = h - padT - padB;
    const midY = padT + plotH / 2;

    ctx.fillStyle = '#050508';
    ctx.fillRect(0, 0, w, h);

    const tMin = -85;
    const tMax = 35;
    const hMax = 0.45;

    const mapX = (t: number) => padL + ((t - tMin) / (tMax - tMin)) * plotW;
    const mapY = (val: number) => midY - (val / hMax) * (plotH / 2) * 0.9;

    // Time grids
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 1;
    [-80, -60, -40, -20, 0, 20].forEach((t) => {
      const x = mapX(t);
      ctx.beginPath();
      ctx.moveTo(x, padT);
      ctx.lineTo(x, h - padB);
      ctx.stroke();
      ctx.fillStyle = '#64748b';
      ctx.font = '10px monospace';
      ctx.fillText(`${t}M`, x - 10, h - padB + 16);
    });

    // Zero-axis
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.beginPath();
    ctx.moveTo(padL, midY);
    ctx.lineTo(w - padR, midY);
    ctx.stroke();

    // Merger t = 0 marker
    const mergerX = mapX(0);
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(mergerX, padT);
    ctx.lineTo(mergerX, h - padB);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#ef4444';
    ctx.font = '9px monospace';
    ctx.fillText('Merger Peak (t=0)', mergerX - 45, padT - 10);

    // 1. Post-Newtonian Curve (Cyan dashed)
    if (showPN) {
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 1.6;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      let first = true;
      for (let t = -80; t <= -15; t += 1.0) {
        const pnVal = getPostNewtonianApproximation(t);
        if (pnVal !== null) {
          const x = mapX(t);
          const y = mapY(pnVal);
          if (first) {
            ctx.moveTo(x, y);
            first = false;
          } else {
            ctx.lineTo(x, y);
          }
        }
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 2. Perturbative QNM Ringdown Curve (Purple dashed)
    if (showQNM) {
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 1.6;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      let first = true;
      for (let t = 0; t <= 30; t += 0.5) {
        const qnmVal = getQnmRingdownApproximation(t);
        if (qnmVal !== null) {
          const x = mapX(t);
          const y = mapY(qnmVal);
          if (first) {
            ctx.moveTo(x, y);
            first = false;
          } else {
            ctx.lineTo(x, y);
          }
        }
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 3. Full Numerical Relativity SXS:BBH:0305 (Bright Amber/Gold Solid Line)
    const pts = SXS_BBH_0305_WAVEFORM;
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(mapX(pts[0].time_M), mapY(pts[0].h_plus));
    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(mapX(pts[i].time_M), mapY(pts[i].h_plus));
    }
    ctx.stroke();

    // Time Scrubber Cursor
    const currX = mapX(currentPt.time_M);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(currX, padT);
    ctx.lineTo(currX, h - padB);
    ctx.stroke();

    // Cursor data point
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(currX, mapY(currentPt.h_plus), 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Y-Axis labels
    ctx.fillStyle = '#64748b';
    ctx.font = '9px monospace';
    ctx.fillText('+0.4', padL - 32, mapY(0.4) + 3);
    ctx.fillText('0.0', padL - 25, midY + 3);
    ctx.fillText('-0.4', padL - 32, mapY(-0.4) + 3);
    ctx.fillText('Dimensionless Strain h_22', padL, padT - 10);
  }, [timeIdx, showPN, showQNM, currentPt]);

  return (
    <div id="sxs-comparison-container" className="flex flex-col h-full bg-neutral-950 text-neutral-200">
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left: Waveform plot */}
        <div className="flex-1 bg-black flex flex-col items-center justify-center p-4 relative">
          <canvas
            ref={canvasRef}
            width={650}
            height={440}
            className="w-full max-w-[620px] aspect-[650/440] rounded border border-neutral-800 shadow-2xl block"
          />

          {/* Trace Legend */}
          <div className="absolute top-6 right-6 font-mono text-[11px] bg-neutral-900/85 backdrop-blur p-3 rounded border border-neutral-800 space-y-1.5">
            <div className="text-neutral-400 uppercase text-[9px] font-semibold tracking-wider">Traces</div>
            <div className="flex items-center gap-2 text-amber-300">
              <span className="w-4 h-0.5 bg-amber-400" />
              <span>SXS:BBH:0305 (Full Numerical Relativity)</span>
            </div>
            <div className="flex items-center gap-2 text-cyan-300">
              <span className="w-4 h-0.5 border-b border-dashed border-cyan-400" />
              <span>3.5PN Post-Newtonian Inspiral</span>
            </div>
            <div className="flex items-center gap-2 text-purple-300">
              <span className="w-4 h-0.5 border-b border-dotted border-purple-400" />
              <span>Perturbative QNM Ringdown</span>
            </div>
          </div>
        </div>

        {/* Right: Telemetry & Model Disclosures */}
        <div className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-neutral-800 bg-neutral-900/50 p-5 flex flex-col gap-4 overflow-y-auto">
          <div>
            <div className="text-xs uppercase tracking-wider font-semibold text-neutral-400 mb-1 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-amber-400" />
              Numerical Relativity Data Ingestion
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed font-sans">
              Comparing the true non-linear numerical solution against asymptotic analytical models.
            </p>
          </div>

          {/* Current Simulation Telemetry */}
          <div className="bg-neutral-950 border border-neutral-800 rounded p-3 font-mono text-xs space-y-2">
            <div className="text-amber-400 font-semibold uppercase text-[10px] tracking-wider border-b border-neutral-800 pb-1 flex justify-between">
              <span>Simulation State: {SXS_BBH_0305_METADATA.simulation_id}</span>
              <span>t = {currentPt.time_M} M</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Gravitational Strain h_22:</span>
              <span className="text-amber-300 font-semibold">{currentPt.h_plus.toFixed(4)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Wave Angular Frequency M·ω:</span>
              <span className="text-sky-300 font-semibold">{currentPt.frequency_M.toFixed(3)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Orbital Phase:</span>
              <span className="text-neutral-200">{(currentPt.phase_rad / Math.PI).toFixed(2)} π rad</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Regime:</span>
              <span className={currentPt.time_M < -15 ? 'text-cyan-400' : currentPt.time_M <= 2 ? 'text-red-400 font-semibold' : 'text-purple-400'}>
                {currentPt.time_M < -15 ? 'Late Inspiral' : currentPt.time_M <= 2 ? 'Non-Linear Merger' : 'QNM Ringdown'}
              </span>
            </div>
          </div>

          {/* Mandatory Disclosure (CLAUDE.md §13) */}
          <div className="bg-neutral-950 border border-amber-900/60 rounded p-3 text-xs space-y-2">
            <div className="flex items-center gap-1.5 font-semibold text-amber-300 text-[11px] uppercase tracking-wider">
              <Info className="w-3.5 h-3.5 shrink-0" />
              Mandatory Scientific Disclosure (CLAUDE.md §13)
            </div>
            <p className="text-neutral-300 text-[11px] leading-relaxed">
              {SXS_BBH_0305_METADATA.mandatory_disclosure}
            </p>
            <div className="border-t border-neutral-800/80 pt-2 text-[10px] text-neutral-400 font-mono space-y-0.5">
              <div>• Mass Ratio q = {SXS_BBH_0305_METADATA.mass_ratio_q} (Equal Mass)</div>
              <div>• Initial Eccentricity e = {SXS_BBH_0305_METADATA.eccentricity}</div>
              <div>• Extrapolation: {SXS_BBH_0305_METADATA.extrapolation_order}</div>
            </div>
          </div>

          {/* Citation */}
          <div className="bg-neutral-950/60 border border-neutral-800 rounded p-2.5 text-[10px] font-mono text-neutral-500">
            {SXS_BBH_0305_METADATA.citation}
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="border-t border-neutral-800/80 bg-neutral-900/70 p-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            {/* Time Slider */}
            <div className="flex items-center gap-2 bg-neutral-950 px-3 py-1.5 rounded border border-neutral-800">
              <span className="text-neutral-400 font-mono">Time (M):</span>
              <input
                id="sxs-time-slider"
                type="range"
                min="0"
                max={SXS_BBH_0305_WAVEFORM.length - 1}
                value={timeIdx}
                onChange={(e) => {
                  setTimeIdx(parseInt(e.target.value));
                  setIsPlaying(false);
                }}
                className="w-32 accent-amber-400"
              />
              <span className="font-mono text-amber-400 w-12">{currentPt.time_M} M</span>
            </div>

            {/* Trace Toggles */}
            <div className="flex items-center gap-2 bg-neutral-950 px-3 py-1.5 rounded border border-neutral-800">
              <label className="flex items-center gap-1.5 cursor-pointer text-cyan-300">
                <input
                  type="checkbox"
                  checked={showPN}
                  onChange={(e) => setShowPN(e.target.checked)}
                  className="accent-cyan-400"
                />
                <span>Show 3.5PN</span>
              </label>
              <span className="text-neutral-700">|</span>
              <label className="flex items-center gap-1.5 cursor-pointer text-purple-300">
                <input
                  type="checkbox"
                  checked={showQNM}
                  onChange={(e) => setShowQNM(e.target.checked)}
                  className="accent-purple-400"
                />
                <span>Show QNM</span>
              </label>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="sxs-play-pause-btn"
              onClick={() => setIsPlaying(!isPlaying)}
              className="px-3 py-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-white font-medium flex items-center gap-1.5 transition-colors"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              {isPlaying ? 'Pause' : 'Play Waveform'}
            </button>

            <button
              id="sxs-reset-btn"
              onClick={() => {
                setTimeIdx(0);
                setIsPlaying(true);
              }}
              className="p-1.5 rounded bg-neutral-950 border border-neutral-800 text-neutral-400 hover:text-neutral-200"
              title="Reset Waveform"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
