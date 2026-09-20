/**
 * @license
 * Spacetime Lab — AnyaLabs
 * Gravitational Wave & GWOSC Strain View (CLAUDE.md §12)
 * Drives a linearized transverse-traceless metric perturbation using real LIGO strain data (GW150914)
 * with strict scientific disclosures of plane-wave and weak-field assumptions.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Waves, Info, Radio } from 'lucide-react';
import {
  GW150914_STRAIN,
  GW150914_METADATA,
  calculateQuadrupoleDeformation,
} from '../../physics/data/gwosc';

export const GravitationalWavesView: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTimeIdx, setCurrentTimeIdx] = useState(17); // peak merger
  const [polarization, setPolarization] = useState<'plus' | 'cross' | 'both'>('plus');
  const [strainAmpScale, setStrainAmpScale] = useState(1.0); // Visual amplification factor

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const waveCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Playback timer
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setCurrentTimeIdx((prev) => (prev + 1) % GW150914_STRAIN.length);
    }, 120);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const currentPoint = GW150914_STRAIN[currentTimeIdx];
  const rawStrain = currentPoint.strain;
  // Visual amplification factor for human eye (since real strain is ~ 10^-21)
  const normStrain = (rawStrain / 1.25e-21) * 0.35 * strainAmpScale;

  const h_plus = polarization === 'cross' ? 0 : normStrain;
  const h_cross = polarization === 'plus' ? 0 : normStrain * 0.8;

  // Draw ring of test masses undergoing quadrupole distortion
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const baseRadius = w * 0.32;

    ctx.fillStyle = '#050508';
    ctx.fillRect(0, 0, w, h);

    // Background grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    const gridStep = 30;
    for (let x = 0; x <= w; x += gridStep) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y <= h; y += gridStep) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Unperturbed reference circle
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(cx, cy, baseRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Quadrupole deformed ring path
    const numParticles = 36;
    const deformedPts: { x: number; y: number }[] = [];

    for (let i = 0; i < numParticles; i++) {
      const angle = (i / numParticles) * Math.PI * 2;
      const x0 = baseRadius * Math.cos(angle);
      const y0 = baseRadius * Math.sin(angle);

      const { dx, dy } = calculateQuadrupoleDeformation(x0, y0, h_plus, h_cross);
      deformedPts.push({ x: cx + x0 + dx, y: cy + y0 + dy });
    }

    // Connect particles into smooth ellipse
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(deformedPts[0].x, deformedPts[0].y);
    for (let i = 1; i < deformedPts.length; i++) {
      ctx.lineTo(deformedPts[i].x, deformedPts[i].y);
    }
    ctx.closePath();
    ctx.stroke();

    // Draw individual test particles
    deformedPts.forEach((pt, i) => {
      ctx.fillStyle = i % 2 === 0 ? '#38bdf8' : '#ffffff';
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    // Center marker (wave propagates perpendicular to screen along z-axis)
    ctx.fillStyle = '#64748b';
    ctx.beginPath();
    ctx.arc(cx, cy, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#38bdf8';
    ctx.strokeText('Propagation k^z ⊙', cx - 45, cy + 20);
  }, [h_plus, h_cross]);

  // Draw Strain Time Series Chart
  useEffect(() => {
    const canvas = waveCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const padL = 40;
    const padR = 20;
    const padT = 15;
    const padB = 25;
    const plotW = w - padL - padR;
    const plotH = h - padT - padB;
    const midY = padT + plotH / 2;

    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, w, h);

    // Center zero strain line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padL, midY);
    ctx.lineTo(w - padR, midY);
    ctx.stroke();

    // Draw strain waveform
    const maxVal = 1.4e-21;
    const pts = GW150914_STRAIN;

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < pts.length; i++) {
      const px = padL + (i / (pts.length - 1)) * plotW;
      const py = midY - (pts[i].strain / maxVal) * (plotH / 2) * 0.9;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // Time scrubber marker
    const currentX = padL + (currentTimeIdx / (pts.length - 1)) * plotW;
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(currentX, padT);
    ctx.lineTo(currentX, h - padB);
    ctx.stroke();

    // Current point dot
    const currentY = midY - (currentPoint.strain / maxVal) * (plotH / 2) * 0.9;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(currentX, currentY, 4.5, 0, Math.PI * 2);
    ctx.fill();

    // Labels
    ctx.fillStyle = '#64748b';
    ctx.font = '9px monospace';
    ctx.fillText('-0.15s', padL, h - 8);
    ctx.fillText('Merger t=0', padL + plotW * 0.7 - 20, h - 8);
    ctx.fillText('+0.05s', w - padR - 35, h - 8);
  }, [currentTimeIdx, currentPoint]);

  return (
    <div id="gravitational-waves-container" className="flex flex-col h-full bg-neutral-950 text-neutral-200">
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left: Quadrupole Test Mass Ring */}
        <div className="flex-1 bg-black flex flex-col items-center justify-center p-4 relative">
          <canvas
            ref={canvasRef}
            width={500}
            height={500}
            className="w-full max-w-[460px] aspect-square rounded border border-neutral-800 shadow-2xl block"
          />

          <div className="absolute top-6 left-6 font-mono text-[11px] bg-neutral-900/85 backdrop-blur p-3 rounded border border-neutral-800 space-y-1">
            <div className="text-sky-400 uppercase text-[9px] font-semibold tracking-wider flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5" />
              LIGO Hanford H1 Calibrated Strain
            </div>
            <div className="text-neutral-300">
              Time: <span className="text-amber-400 font-semibold">{currentPoint.time_sec.toFixed(3)} s</span>
            </div>
            <div className="text-neutral-300">
              Raw Strain h(t): <span className="text-neutral-100 font-semibold">{(currentPoint.strain * 1e21).toFixed(2)} × 10⁻²¹</span>
            </div>
            <div className="text-neutral-400 text-[10px]">
              Transverse Quadrupole Metric: h_xx = -h_yy = h_+
            </div>
          </div>
        </div>

        {/* Right: Waveform graph & scientific disclosures */}
        <div className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-neutral-800 bg-neutral-900/50 p-5 flex flex-col gap-4 overflow-y-auto">
          <div>
            <div className="text-xs uppercase tracking-wider font-semibold text-neutral-400 mb-1 flex items-center gap-1.5">
              <Waves className="w-4 h-4 text-sky-400" />
              GW150914 Strain Waveform h(t)
            </div>
            <canvas
              ref={waveCanvasRef}
              width={350}
              height={160}
              className="w-full rounded border border-neutral-800 block shadow-inner bg-black"
            />
          </div>

          {/* Mandatory Model Disclosure (CLAUDE.md §12) */}
          <div className="bg-neutral-950 border border-amber-900/60 rounded p-3 text-xs space-y-2">
            <div className="flex items-center gap-1.5 font-semibold text-amber-300 text-[11px] uppercase tracking-wider">
              <Info className="w-3.5 h-3.5 shrink-0" />
              Mandatory Scientific Disclosure (CLAUDE.md §12)
            </div>
            <p className="text-neutral-300 text-[11px] leading-relaxed">
              {GW150914_METADATA.mandatory_disclosure}
            </p>
            <div className="border-t border-neutral-800/80 pt-2 space-y-1 text-[10px] text-neutral-400 font-mono">
              <div>• {GW150914_METADATA.assumptions[0]}</div>
              <div>• {GW150914_METADATA.assumptions[1]}</div>
              <div>• {GW150914_METADATA.assumptions[2]}</div>
            </div>
          </div>

          {/* Event Metadata */}
          <div className="bg-neutral-950/60 border border-neutral-800 rounded p-3 text-xs space-y-1 font-mono">
            <div className="text-neutral-400 text-[10px] uppercase font-semibold">Event Provenance</div>
            <div className="text-neutral-300 font-semibold">{GW150914_METADATA.event}</div>
            <div className="text-neutral-400 text-[11px]">{GW150914_METADATA.source}</div>
            <div className="text-neutral-500 text-[10px]">{GW150914_METADATA.provenance}</div>
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="border-t border-neutral-800/80 bg-neutral-900/70 p-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            {/* Polarization selector */}
            <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded border border-neutral-800">
              <span className="text-neutral-400 px-2 font-mono">Polarization:</span>
              {(['plus', 'cross', 'both'] as const).map((p) => (
                <button
                  key={p}
                  id={`polarization-${p}-btn`}
                  onClick={() => setPolarization(p)}
                  className={`px-2.5 py-1 rounded capitalize font-medium transition-colors ${
                    polarization === p
                      ? 'bg-sky-950 text-sky-300 border border-sky-800'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  {p === 'plus' ? 'h₊ (Plus)' : p === 'cross' ? 'h_× (Cross)' : 'h₊ + h_×'}
                </button>
              ))}
            </div>

            {/* Time scrubber slider */}
            <div className="flex items-center gap-2 bg-neutral-950 px-3 py-1.5 rounded border border-neutral-800">
              <span className="text-neutral-400 font-mono">Time:</span>
              <input
                id="gw-time-scrubber"
                type="range"
                min="0"
                max={GW150914_STRAIN.length - 1}
                value={currentTimeIdx}
                onChange={(e) => {
                  setCurrentTimeIdx(parseInt(e.target.value));
                  setIsPlaying(false);
                }}
                className="w-32 accent-sky-400"
              />
              <span className="font-mono text-amber-400 w-16">{currentPoint.time_sec.toFixed(3)}s</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="gw-play-pause-btn"
              onClick={() => setIsPlaying(!isPlaying)}
              className="px-3 py-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-white font-medium flex items-center gap-1.5 transition-colors"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              {isPlaying ? 'Pause' : 'Play Chirp'}
            </button>

            <button
              id="gw-reset-btn"
              onClick={() => {
                setCurrentTimeIdx(0);
                setIsPlaying(true);
              }}
              className="p-1.5 rounded bg-neutral-950 border border-neutral-800 text-neutral-400 hover:text-neutral-200"
              title="Restart Waveform"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
