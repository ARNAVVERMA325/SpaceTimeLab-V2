/**
 * @license
 * Spacetime Lab — AnyaLabs
 * Curvature / Invariant View (CLAUDE.md §5.3)
 * Evaluates the true coordinate-independent Kretschmann curvature scalar:
 * K = R_abcd R^abcd for Schwarzschild and Kerr spacetimes, distinguishing
 * coordinate singularities from genuine physical curvature singularities.
 */

import React, { useState, useRef, useEffect } from 'react';
import { ShieldAlert, Compass, Activity, Sliders, Info } from 'lucide-react';
import { SchwarzschildMetric } from '../../physics/metrics/schwarzschild';
import { KerrMetric } from '../../physics/metrics/kerr';

export const CurvatureView: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [metric, setMetric] = useState<'schwarzschild' | 'kerr'>('schwarzschild');
  const [massM, setMassM] = useState(1.0);
  const [spinA, setSpinA] = useState(0.85);
  const [viewportRadius, setViewportRadius] = useState(8.0); // Spatial window in M
  const [probePos, setProbePos] = useState<{ r: number; theta: number } | null>({
    r: 3.5,
    theta: Math.PI / 3,
  });

  const horizons = metric === 'kerr' ? KerrMetric.horizons(massM, spinA) : { r_plus: 2 * massM, r_minus: 0 };

  // Draw 2D Meridional Curvature Map (x = r sin theta, z = r cos theta)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const cx = width / 2;
    const cy = height / 2;
    const scale = (width * 0.45) / viewportRadius; // pixels per M

    const imgData = ctx.createImageData(width, height);
    const data = imgData.data;

    // Evaluate Kretschmann scalar across grid
    for (let py = 0; py < height; py += 2) {
      const z = (cy - py) / scale;
      for (let px = 0; px < width; px += 2) {
        const x = (px - cx) / scale;
        const r = Math.sqrt(x * x + z * z);
        const theta = Math.atan2(Math.abs(x), z);

        let K = 0;
        if (metric === 'schwarzschild') {
          K = SchwarzschildMetric.kretschmann(Math.max(0.1, r), massM);
        } else {
          K = KerrMetric.kretschmann(Math.max(0.1, r), theta, massM, spinA);
        }

        // Logarithmic colormap: log10(K) typically ranges from -4 (at r=15) to +4 (at r=0.5)
        const logK = Math.log10(Math.max(1e-6, Math.abs(K)));
        const normK = Math.min(1.0, Math.max(0.0, (logK + 3.0) / 6.0));

        // Deep blue (low curvature) -> cyan -> orange -> intense white (high curvature)
        let rCol = 0, gCol = 0, bCol = 0;
        if (normK < 0.33) {
          const t = normK / 0.33;
          rCol = Math.floor(10 + 20 * t);
          gCol = Math.floor(20 + 80 * t);
          bCol = Math.floor(60 + 150 * t);
        } else if (normK < 0.66) {
          const t = (normK - 0.33) / 0.33;
          rCol = Math.floor(30 + 190 * t);
          gCol = Math.floor(100 + 100 * t);
          bCol = Math.floor(210 * (1 - t));
        } else {
          const t = (normK - 0.66) / 0.34;
          rCol = Math.floor(220 + 35 * t);
          gCol = Math.floor(200 + 55 * t);
          bCol = Math.floor(50 + 205 * t);
        }

        // Fill 2x2 block
        for (let dy = 0; dy < 2 && py + dy < height; dy++) {
          for (let dx = 0; dx < 2 && px + dx < width; dx++) {
            const idx = ((py + dy) * width + (px + dx)) * 4;
            data[idx] = rCol;
            data[idx + 1] = gCol;
            data[idx + 2] = bCol;
            data[idx + 3] = 255;
          }
        }
      }
    }

    ctx.putImageData(imgData, 0, 0);

    // Draw coordinate axes
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, cy);
    ctx.lineTo(width, cy);
    ctx.moveTo(cx, 0);
    ctx.lineTo(cx, height);
    ctx.stroke();

    // Draw Horizon boundaries
    if (metric === 'schwarzschild') {
      const rH = 2 * massM * scale;
      ctx.strokeStyle = '#ef4444'; // Red horizon
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(cx, cy, rH, 0, Math.PI * 2);
      ctx.stroke();

      // Photon sphere at 3M
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([2, 4]);
      ctx.beginPath();
      ctx.arc(cx, cy, 3 * massM * scale, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      // Kerr: Event Horizon r+ and Ergosphere boundary r_E(theta)
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(cx, cy, horizons.r_plus * scale, 0, Math.PI * 2);
      ctx.stroke();

      // Ergosphere curve r_E(theta) = M + sqrt(M^2 - a^2 cos^2 theta)
      ctx.strokeStyle = '#f59e0b'; // Amber ergosphere
      ctx.lineWidth = 2;
      ctx.setLineDash([]);
      ctx.beginPath();
      for (let angle = 0; angle <= Math.PI * 2; angle += 0.05) {
        const rE = KerrMetric.ergosphere_radius(angle, massM, spinA) * scale;
        const px = cx + rE * Math.sin(angle);
        const py = cy - rE * Math.cos(angle);
        if (angle === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Draw interactive probe marker
    if (probePos) {
      const px = cx + probePos.r * Math.sin(probePos.theta) * scale;
      const py = cy - probePos.r * Math.cos(probePos.theta) * scale;

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(px, py, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Pulsing ring
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(px, py, 9, 0, Math.PI * 2);
      ctx.stroke();
    }
  }, [metric, massM, spinA, viewportRadius, probePos]);

  // Click handler to position probe
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const scale = (canvas.width * 0.45) / viewportRadius;

    const clickX = (e.clientX - rect.left) * (canvas.width / rect.width);
    const clickY = (e.clientY - rect.top) * (canvas.height / rect.height);

    const x = (clickX - cx) / scale;
    const z = (cy - clickY) / scale;
    const r = Math.max(0.1, Math.sqrt(x * x + z * z));
    const theta = Math.atan2(Math.abs(x), z);

    setProbePos({ r, theta });
  };

  // Probe telemetry calculations
  const probeK =
    probePos &&
    (metric === 'schwarzschild'
      ? SchwarzschildMetric.kretschmann(probePos.r, massM)
      : KerrMetric.kretschmann(probePos.r, probePos.theta, massM, spinA));

  const horizonK =
    metric === 'schwarzschild'
      ? SchwarzschildMetric.kretschmann(2 * massM, massM)
      : KerrMetric.kretschmann(horizons.r_plus, Math.PI / 2, massM, spinA);

  return (
    <div id="curvature-view-container" className="flex flex-col h-full bg-neutral-950 text-neutral-200">
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Canvas area */}
        <div className="relative flex-1 bg-black flex items-center justify-center p-4">
          <canvas
            ref={canvasRef}
            width={600}
            height={600}
            onClick={handleCanvasClick}
            className="w-full max-w-[560px] aspect-square rounded border border-neutral-800 cursor-crosshair shadow-2xl block"
          />

          {/* Map legend */}
          <div className="absolute bottom-6 left-6 font-mono text-[11px] bg-neutral-900/90 backdrop-blur p-2.5 rounded border border-neutral-800 space-y-1.5 pointer-events-none">
            <div className="text-neutral-400 uppercase text-[9px] font-semibold tracking-wider">Legend</div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-0.5 border-b-2 border-dashed border-red-500" />
              <span>Event Horizon r+ ({horizons.r_plus.toFixed(2)} M)</span>
            </div>
            {metric === 'kerr' && (
              <div className="flex items-center gap-2">
                <span className="w-3 h-0.5 bg-amber-500" />
                <span>Ergosphere r_E(θ)</span>
              </div>
            )}
            {metric === 'schwarzschild' && (
              <div className="flex items-center gap-2">
                <span className="w-3 h-0.5 border-b-2 border-dotted border-sky-400" />
                <span>Photon Sphere (3.00 M)</span>
              </div>
            )}
            <div className="flex items-center gap-2 pt-1 border-t border-neutral-800 text-neutral-400">
              <span>Click map to inspect local curvature tensor</span>
            </div>
          </div>
        </div>

        {/* Telemetry & Analysis Panel */}
        <div className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-neutral-800 bg-neutral-900/50 p-5 flex flex-col gap-4 overflow-y-auto">
          <div>
            <div className="text-xs uppercase tracking-wider font-semibold text-neutral-400 mb-1 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-emerald-400" />
              Kretschmann Invariant Telemetry
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Coordinate-independent scalar invariant: \(K = R_&#123;\alpha\beta\gamma\delta&#125; R^&#123;\alpha\beta\gamma\delta&#125;\).
            </p>
          </div>

          {/* Probe inspector */}
          {probePos && probeK !== null && (
            <div className="bg-neutral-950 border border-neutral-800 rounded p-3 font-mono text-xs space-y-2">
              <div className="text-sky-400 font-semibold uppercase text-[10px] tracking-wider border-b border-neutral-800 pb-1 flex justify-between">
                <span>Active Probe Location</span>
                <span>Coordinates (r, θ)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Radius r:</span>
                <span className="text-neutral-200">{probePos.r.toFixed(3)} M</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Polar Angle θ:</span>
                <span className="text-neutral-200">{((probePos.theta * 180) / Math.PI).toFixed(1)}°</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Kretschmann K:</span>
                <span className="text-amber-400 font-semibold">{probeK.toExponential(4)} M⁻⁴</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Tidal Acceleration:</span>
                <span className="text-neutral-300">~ (M / r³) ≈ {(massM / Math.pow(probePos.r, 3)).toExponential(3)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Physical Status:</span>
                <span className={probePos.r < horizons.r_plus ? 'text-red-400 font-semibold' : 'text-emerald-400'}>
                  {probePos.r < horizons.r_plus ? 'Inside Horizon' : 'Exterior Spacetime'}
                </span>
              </div>
            </div>
          )}

          {/* Coordinate singularity comparison */}
          <div className="bg-neutral-950/80 border border-neutral-800 rounded p-3 text-xs space-y-1.5 font-mono">
            <div className="text-neutral-400 font-semibold text-[10px] uppercase tracking-wider">
              Singularity Classification
            </div>
            <div className="flex justify-between text-neutral-300">
              <span className="text-neutral-500">K at Event Horizon r+:</span>
              <span className="text-emerald-400 font-semibold">{horizonK.toFixed(4)} M⁻⁴</span>
            </div>
            <p className="text-[11px] text-neutral-400 leading-snug pt-1">
              Notice that \(K(r_+)\) is completely finite and well-behaved! This rigorously proves that the
              event horizon \(r = 2M\) is merely a coordinate pathology of Schwarzschild coordinates, NOT a
              physical curvature singularity.
            </p>
          </div>

          {/* Mathematical formulas */}
          <div className="bg-neutral-950/60 border border-neutral-800 rounded p-3 text-xs space-y-2 font-mono">
            <div className="text-neutral-400 text-[10px] uppercase tracking-wider font-semibold">
              Exact Curvature Tensor Form
            </div>
            <div className="text-[11px] text-neutral-300 bg-neutral-900 p-2 rounded border border-neutral-800">
              {metric === 'schwarzschild' ? (
                <div>
                  K_schwarzschild = 48 M² / r⁶<br />
                  Ricci Scalar R ≡ 0 (Vacuum)
                </div>
              ) : (
                <div>
                  K_kerr = 48 M² (r² - v²)[(r² + v²)² - 16 r² v²] / (r² + v²)⁶<br />
                  where v = a cos(θ)
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="border-t border-neutral-800/80 bg-neutral-900/70 p-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded border border-neutral-800">
              <button
                id="curvature-metric-schwarzschild"
                onClick={() => setMetric('schwarzschild')}
                className={`px-3 py-1.5 rounded font-medium transition-colors ${
                  metric === 'schwarzschild' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                Schwarzschild
              </button>
              <button
                id="curvature-metric-kerr"
                onClick={() => setMetric('kerr')}
                className={`px-3 py-1.5 rounded font-medium transition-colors ${
                  metric === 'kerr' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                Kerr (Spinning)
              </button>
            </div>

            {metric === 'kerr' && (
              <div className="flex items-center gap-2 bg-neutral-950 px-3 py-1.5 rounded border border-neutral-800">
                <span className="text-neutral-400 font-mono">Spin a:</span>
                <input
                  id="curvature-spin-slider"
                  type="range"
                  min="0.0"
                  max="0.98"
                  step="0.02"
                  value={spinA}
                  onChange={(e) => setSpinA(parseFloat(e.target.value))}
                  className="w-20 accent-emerald-400"
                />
                <span className="font-mono text-emerald-400 w-8">{spinA.toFixed(2)}</span>
              </div>
            )}

            <div className="flex items-center gap-2 bg-neutral-950 px-3 py-1.5 rounded border border-neutral-800">
              <span className="text-neutral-400 font-mono">Window:</span>
              <input
                id="curvature-radius-slider"
                type="range"
                min="4.0"
                max="16.0"
                step="1.0"
                value={viewportRadius}
                onChange={(e) => setViewportRadius(parseFloat(e.target.value))}
                className="w-20 accent-emerald-400"
              />
              <span className="font-mono text-emerald-400 w-8">{viewportRadius.toFixed(0)} M</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
