/**
 * @license
 * Spacetime Lab — AnyaLabs
 * Observer / Optical View & Interactive Spacetime Simulation (CLAUDE.md §5.1, §4, §6.1)
 * Real-time backward-tracing null geodesic simulation with observer tetrad,
 * relativistic Doppler boosting (1+z)^(-4), gravitational redshift, celestial grid lensing,
 * dynamic Keplerian plasma disk rotation, variable camera zoom (3.5M to 80M+),
 * automated flight simulations, and live infalling probe telemetry.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Play,
  Pause,
  RefreshCw,
  Eye,
  Disc,
  Compass,
  ShieldCheck,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Sliders,
  Send,
  Navigation,
  Flame,
  Layers,
  Sparkles,
  Activity,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { ObserverType } from '../../physics/types';

const VERTEX_SHADER_SRC = `#version 300 es
in vec2 position;
out vec2 vUv;
void main() {
  vUv = position * 0.5 + 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER_SRC = `#version 300 es
precision highp float;

in vec2 vUv;
out vec4 fragColor;

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_mass;
uniform float u_spin;
uniform float u_cam_dist;
uniform float u_cam_theta;
uniform float u_cam_phi;
uniform float u_fov;
uniform int u_observer_type; // 0: static, 1: free-falling, 2: keplerian
uniform bool u_show_disk;
uniform bool u_show_grid;
uniform bool u_doppler_enabled;
uniform float u_disk_outer;
uniform int u_palette; // 0: realistic astrophysical flame, 1: gargantua gold/white, 2: synchrotron blue, 3: infrared crimson

#define PI 3.14159265358979323846

// 2D Hash
float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

// 2D Value Noise with smooth hermite interpolation
float valueNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

// Fractional Brownian Motion for turbulent MHD plasma filaments
float fbmTurbulence(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 rot = mat2(0.80, -0.60, 0.60, 0.80);
  for (int i = 0; i < 4; i++) {
    v += a * valueNoise(p);
    p = rot * p * 2.05;
    a *= 0.5;
  }
  return v;
}

// Cinematic Blackbody / Planck thermal radiation color curve (0 = smoke/charcoal, 1 = incandescent white-blue)
vec3 blackbodyRadiation(float t, int palette) {
  t = clamp(t, 0.0, 3.5);
  
  if (palette == 2) {
    // Synchrotron Relativistic Blue Jet
    vec3 c0 = vec3(0.01, 0.03, 0.08);
    vec3 c1 = vec3(0.10, 0.35, 0.95);
    vec3 c2 = vec3(0.45, 0.80, 1.60);
    vec3 c3 = vec3(1.40, 1.80, 2.20);
    if (t < 0.3) return mix(c0, c1, t / 0.3);
    if (t < 0.8) return mix(c1, c2, (t - 0.3) / 0.5);
    return mix(c2, c3, clamp((t - 0.8) / 0.8, 0.0, 1.0));
  }
  
  if (palette == 3) {
    // Deep Infrared / Thermal Red
    vec3 c0 = vec3(0.03, 0.005, 0.002);
    vec3 c1 = vec3(0.60, 0.08, 0.02);
    vec3 c2 = vec3(1.20, 0.28, 0.05);
    vec3 c3 = vec3(1.80, 0.90, 0.30);
    if (t < 0.3) return mix(c0, c1, t / 0.3);
    if (t < 0.8) return mix(c1, c2, (t - 0.3) / 0.5);
    return mix(c2, c3, clamp((t - 0.8) / 0.8, 0.0, 1.0));
  }

  // Realistic Astrophysical Flame & Gargantua:
  // t < 0.16: Interstellar soot, dust absorption, deep crimson edge
  // t = 0.16 - 0.42: Fiery copper-amber, molten orange plasma filaments
  // t = 0.42 - 0.78: Radiant incandescent golden plasma
  // t = 0.78 - 1.25: Blinding pure white-hot ISCO rim
  // t > 1.25: Ultra-relativistic blue-white core
  vec3 col = vec3(0.0);
  if (t < 0.16) {
    float f = t / 0.16;
    col = mix(vec3(0.04, 0.008, 0.003), vec3(0.55, 0.09, 0.02), f);
  } else if (t < 0.42) {
    float f = (t - 0.16) / 0.26;
    col = mix(vec3(0.55, 0.09, 0.02), vec3(1.25, 0.42, 0.05), f);
  } else if (t < 0.78) {
    float f = (t - 0.42) / 0.36;
    col = mix(vec3(1.25, 0.42, 0.05), vec3(1.65, 0.95, 0.32), f);
  } else if (t < 1.25) {
    float f = (t - 0.78) / 0.47;
    col = mix(vec3(1.65, 0.95, 0.32), vec3(1.95, 1.85, 1.70), f);
  } else {
    float f = clamp((t - 1.25) / 1.0, 0.0, 1.0);
    col = mix(vec3(1.95, 1.85, 1.70), vec3(2.20, 2.30, 2.70), f);
  }
  
  if (palette == 1) {
    // Subtle golden cinematic tone
    col = mix(col, vec3(col.r * 1.05, col.g * 0.98, col.b * 0.82), 0.25);
  }
  
  return col;
}

// Celestial sphere background texture (coordinate grid + realistic deep space starfield)
vec3 sampleCelestialBackground(vec3 dir) {
  float theta = acos(clamp(dir.y, -1.0, 1.0));
  float phi = atan(dir.z, dir.x);
  
  if (!u_show_grid) {
    // Multi-tier realistic deep-space star field
    float s1 = pow(clamp(sin(phi * 62.0) * sin(theta * 62.0), 0.0, 1.0), 55.0) * 3.5;
    float s2 = pow(clamp(sin(phi * 120.0 + 2.1) * sin(theta * 120.0 + 1.4), 0.0, 1.0), 75.0) * 4.2;
    float s3 = pow(clamp(sin(phi * 24.0 - 1.7) * sin(theta * 24.0 + 3.1), 0.0, 1.0), 32.0) * 1.8;
    
    vec3 starCol1 = vec3(0.85, 0.92, 1.1) * s1;
    vec3 starCol2 = vec3(1.05, 0.95, 0.82) * s2;
    vec3 starCol3 = vec3(1.15, 0.70, 0.55) * s3;

    // Milky Way galactic plane band & subtle interstellar nebula haze
    float mw = exp(-pow(dir.y * 3.2, 2.0)) * 0.18;
    float mwDust = fbmTurbulence(vec2(phi * 3.0, theta * 4.0)) * 0.12;
    vec3 mwCol = vec3(0.06, 0.09, 0.16) * (mw + mwDust);

    return starCol1 + starCol2 + starCol3 + mwCol;
  }
  
  // Coordinate grid on celestial sphere
  float gridTheta = abs(fract(theta / (PI / 12.0) + 0.5) - 0.5) * 2.0;
  float gridPhi = abs(fract(phi / (PI / 12.0) + 0.5) - 0.5) * 2.0;
  float lineW = 0.07;
  float grid = step(1.0 - lineW, gridTheta) + step(1.0 - lineW, gridPhi);
  
  vec3 col = vec3(0.03, 0.04, 0.07);
  if (dir.y > 0.0) col += vec3(0.02, 0.03, 0.05);
  else col += vec3(0.04, 0.02, 0.03);
  
  col = mix(col, vec3(0.30, 0.42, 0.62), clamp(grid, 0.0, 1.0) * 0.40);
  
  float starSeed = sin(phi * 48.0) * cos(theta * 48.0);
  float star = pow(clamp(starSeed, 0.0, 1.0), 42.0) * 2.6;
  col += vec3(star * 0.9, star * 0.95, star * 1.05);
  
  return col;
}

// ACES Filmic Tone Mapping (prevents color clipping, produces glowing white highlights)
vec3 acesFilm(vec3 x) {
  float a = 2.51;
  float b = 0.03;
  float c = 2.43;
  float d = 0.59;
  float e = 0.14;
  return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);
}

void main() {
  vec2 st = (gl_FragCoord.xy - 0.5 * u_resolution) / min(u_resolution.x, u_resolution.y);
  
  float M = u_mass;
  float a = u_spin;
  float r_horizon = M + sqrt(max(0.0, M * M - a * a));
  float r_ps = 3.0 * M;
  float r_isco = 6.0 * M * (1.0 - 0.5 * a);
  float r_disk_in = r_isco;
  float r_disk_out = u_disk_outer * M;
  
  // Camera spherical position
  float r_cam = u_cam_dist;
  float th_cam = u_cam_theta;
  float ph_cam = u_cam_phi;
  
  // Observer local orthonormal tetrad frame
  vec3 camPos = vec3(
    r_cam * sin(th_cam) * cos(ph_cam),
    r_cam * cos(th_cam),
    r_cam * sin(th_cam) * sin(ph_cam)
  );
  
  vec3 forward = -normalize(camPos);
  vec3 up = vec3(0.0, 1.0, 0.0);
  vec3 right = normalize(cross(forward, up));
  up = cross(right, forward);
  
  // Initial ray direction in observer frame with dynamic FOV
  float fov = tan(u_fov * 0.5);
  vec3 rayDir = normalize(forward + st.x * fov * right + st.y * fov * up);
  
  // Relativistic aberration for moving observer frame
  if (u_observer_type == 1) {
    float beta = sqrt(clamp(2.0 * M / r_cam, 0.0, 0.92));
    rayDir = normalize(rayDir + beta * forward * 0.55);
  } else if (u_observer_type == 2) {
    float beta = sqrt(clamp(M / r_cam, 0.0, 0.65));
    rayDir = normalize(rayDir + beta * right * 0.55);
  }
  
  // Ray escape radius: scales dynamically with camera distance to allow arbitrary unzoom
  float r_escape = max(140.0 * M, r_cam * 1.8);
  
  // Numerical backward null geodesic integration
  vec3 pos = camPos;
  vec3 vel = rayDir;
  
  vec3 color = vec3(0.0);
  bool hitHorizon = false;
  float diskAccumulation = 0.0;
  vec3 diskColorAccum = vec3(0.0);
  
  float stepSize = 0.20;
  int maxSteps = 260;
  
  for (int i = 0; i < maxSteps; i++) {
    float r = length(pos);
    
    // Check event horizon capture (black hole shadow)
    if (r <= r_horizon * 1.008) {
      hitHorizon = true;
      break;
    }
    
    // Check escape to celestial sphere
    if (r > r_escape) {
      break;
    }
    
    vec3 prevPos = pos;
    
    // Effective GR acceleration on photon in curved spacetime
    vec3 L = cross(pos, vel);
    float L2 = dot(L, L);
    
    // General Relativistic centripetal deflection
    vec3 acc = - (3.0 * M * L2 / (r * r * r * r * r)) * pos;
    
    // Kerr frame-dragging cross term
    if (abs(a) > 0.001) {
      vec3 spinAxis = vec3(0.0, 1.0, 0.0);
      vec3 drag = (2.0 * M * a / (r * r * r)) * cross(spinAxis, vel);
      acc += drag;
    }
    
    // Adaptive step size: razor-sharp precision near horizon & photon sphere
    float r_dist = max(0.04, r - r_horizon);
    float currentStep = stepSize * (0.16 + 0.84 * clamp(r_dist / (3.5 * M), 0.06, 1.0) + max(0.0, r - 6.0 * M) * 0.14);
    
    vel += acc * currentStep;
    vel = normalize(vel);
    pos += vel * currentStep;
    
    // Accretion disk equatorial intersection test (plane y = 0)
    // Photons orbiting the black hole can cross multiple times (primary front disk + warped rear halo)
    if (u_show_disk && (prevPos.y * pos.y <= 0.0)) {
      float tIntersect = -prevPos.y / (pos.y - prevPos.y);
      vec3 hitPos = mix(prevPos, pos, tIntersect);
      float rHit = length(hitPos.xz);
      
      if (rHit >= r_disk_in && rHit <= r_disk_out) {
        // Differential Keplerian orbital angular velocity: Omega = sqrt(M / r^3)
        float omega = sqrt(M / (rHit * rHit * rHit));
        float diskAngle = atan(hitPos.z, hitPos.x) - omega * u_time * 2.2;
        
        // Multi-frequency sheared turbulence: stretched 14x along flow lines to form realistic fibrous streaks
        vec2 turbUV = vec2(log(rHit / r_disk_in) * 4.2, diskAngle * 14.0);
        float turbulence = fbmTurbulence(turbUV);
        
        // Spiral density waves & magnetic shear eddies
        float spiral = 0.5 + 0.5 * sin(diskAngle * 2.0 + log(rHit) * 3.8);
        float macroFlakes = 0.5 + 0.5 * sin(diskAngle * 5.0 - omega * u_time * 4.0) * sin(rHit * 2.0);
        
        // Orbiting synchrotron hot-spot flare near ISCO
        float flareAngle = diskAngle + 0.65 * sin(u_time * 0.3);
        float flare = exp(-16.0 * (1.0 - cos(flareAngle))) * exp(-pow(rHit - 1.18 * r_disk_in, 2.0) / 2.5);
        
        // Gas orbital velocity vector (counter-clockwise)
        float v_gas = sqrt(M / rHit);
        vec3 gasDir = normalize(vec3(-hitPos.z, 0.0, hitPos.x));
        
        // Doppler factor: photon tangent vs gas velocity
        float cosAngle = dot(-vel, gasDir);
        float gamma = 1.0 / sqrt(max(0.01, 1.0 - v_gas * v_gas));
        
        // Gravitational redshift
        float gravRedshift = sqrt(max(0.01, 1.0 - 2.0 * M / rHit));
        
        // Relativistic frequency shift: (1 + z) = 1 / (gamma * (1 - v * cosAngle)) * (1 / gravRedshift)
        float one_plus_z = (gamma * (1.0 - v_gas * cosAngle)) / gravRedshift;
        float dopplerDelta = 1.0 / max(0.05, one_plus_z);
        
        // Relativistic beaming intensity scaling (1 + z)^(-4)
        float dopplerBoost = 1.0;
        if (u_doppler_enabled) {
          dopplerBoost = pow(clamp(dopplerDelta, 0.12, 4.8), 4.0);
        }
        
        // Novikov-Thorne standard thin-disk emissivity profile
        float novikov = pow(r_disk_in / rHit, 0.75) * pow(max(0.0, 1.0 - sqrt(r_disk_in / rHit)), 0.25);
        
        // Incandescent inner rim (ISCO photon boundary surge)
        float innerRimSurge = 1.45 * exp(-pow((rHit - r_disk_in) / (0.42 * M), 2.0));
        
        // Plasma density modulation: dark dust absorption lanes vs glowing gas filaments
        float densityMod = 0.55 + 0.35 * turbulence + 0.15 * spiral + 0.12 * macroFlakes + 1.35 * flare;
        
        // Thermodynamic effective temperature
        float T_eff = (novikov * 1.25 + innerRimSurge + turbulence * 0.22);
        if (u_doppler_enabled) {
          T_eff *= pow(dopplerDelta, 1.15);
        }
        
        // Radiative Blackbody Emission (Planckian curve — no cartoonish yellow!)
        vec3 diskCol = blackbodyRadiation(T_eff, u_palette) * dopplerBoost * densityMod * 2.7;
        
        // Volumetric optical depth
        float opacity = clamp((novikov * 1.6 + innerRimSurge * 0.85 + turbulence * 0.3) * 0.78, 0.12, 0.92);
        
        diskColorAccum += diskCol * opacity * (1.0 - diskAccumulation);
        diskAccumulation += opacity;
        
        if (diskAccumulation >= 0.95) break;
      }
    }
  }
  
  if (hitHorizon) {
    // Ray swallowed by black hole event horizon
    color = diskColorAccum;
  } else {
    // Escaped to background sky
    vec3 bgCol = sampleCelestialBackground(vel);
    color = mix(bgCol, diskColorAccum, clamp(diskAccumulation, 0.0, 1.0));
  }
  
  // ACES Filmic Tone Mapping for cinematic dynamic range & incandescent bloom
  color = acesFilm(color * 1.15);
  // Gamma correction
  color = pow(color, vec3(1.0 / 2.2));
  
  fragColor = vec4(color, 1.0);
}
`;

type SimulationMode = 'manual' | 'orbit' | 'polar_sweep' | 'horizon_plunge';

export const OpticalView: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const glRef = useRef<WebGL2RenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Simulation parameters
  const [isPlaying, setIsPlaying] = useState(true);
  const [simSpeed, setSimSpeed] = useState(1.0);
  const [simMode, setSimMode] = useState<SimulationMode>('manual');
  const [metric, setMetric] = useState<'schwarzschild' | 'kerr'>('kerr');
  const [spinA, setSpinA] = useState(0.60);
  
  // Camera & Zoom controls (allows wide unzoom to see entire system!)
  const [camDist, setCamDist] = useState(26.0); // Default distance giving a balanced view of disk
  const [camThetaDeg, setCamThetaDeg] = useState(82.0);
  const [camPhiDeg, setCamPhiDeg] = useState(0.0);
  const [fovDeg, setFovDeg] = useState(55.0); // Field of view in degrees

  // Visual settings
  const [observerType, setObserverType] = useState<ObserverType>('static');
  const [showDisk, setShowDisk] = useState(true);
  const [showGrid, setShowGrid] = useState(false); // Deep space starfield matching reference photo
  const [dopplerEnabled, setDopplerEnabled] = useState(true);
  const [diskOuterR, setDiskOuterR] = useState(22.0);
  const [diskPalette, setDiskPalette] = useState<0 | 1 | 2 | 3>(0);
  const [isControlsExpanded, setIsControlsExpanded] = useState(true);
  const [showTelemetryConsole, setShowTelemetryConsole] = useState(true);

  // Interactive Test Probe Simulation
  const [isProbeActive, setIsProbeActive] = useState(false);
  const [probeR, setProbeR] = useState<number | null>(null);
  const [probeTau, setProbeTau] = useState(0.0);
  const [probeRedshift, setProbeRedshift] = useState(1.0);

  // Drag interaction
  const isDraggingRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });

  // Plunge animation timer
  const plungeT = useRef(0);

  // Update spin when metric changes
  const handleMetricChange = (newMetric: 'schwarzschild' | 'kerr') => {
    setMetric(newMetric);
    if (newMetric === 'schwarzschild') setSpinA(0.0);
    else if (spinA === 0.0) setSpinA(0.92);
  };

  // Zoom handlers (supports wide unzoom up to 80M)
  const zoomIn = () => {
    setCamDist((prev) => Math.max(3.5, prev * 0.82));
  };

  const zoomOut = () => {
    setCamDist((prev) => Math.min(80.0, prev * 1.22));
  };

  // Preset camera distances
  const setPresetView = (distance: number, fov: number, theta: number = 78.0) => {
    setCamDist(distance);
    setFovDeg(fov);
    setCamThetaDeg(theta);
  };

  // Canvas Mouse Wheel for smooth infinite zoom in / out
  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 1.08 : 0.92;
    setCamDist((prev) => {
      const next = prev * zoomFactor;
      return Math.min(80.0, Math.max(3.5, next));
    });
  }, []);

  // WebGL initialization
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl2');
    if (!gl) {
      console.error('WebGL2 not supported');
      return;
    }
    glRef.current = gl;

    const createShader = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.error('Shader compile error:', gl.getShaderInfoLog(s));
        gl.deleteShader(s);
        return null;
      }
      return s;
    };

    const vs = createShader(gl.VERTEX_SHADER, VERTEX_SHADER_SRC);
    const fs = createShader(gl.FRAGMENT_SHADER, FRAGMENT_SHADER_SRC);
    if (!vs || !fs) return;

    const program = gl.createProgram()!;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program));
      return;
    }
    programRef.current = program;

    const quadVerts = new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
      -1,  1,
       1, -1,
       1,  1,
    ]);

    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    const vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, quadVerts, gl.STATIC_DRAW);

    const posAttr = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(posAttr);
    gl.vertexAttribPointer(posAttr, 2, gl.FLOAT, false, 0, 0);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(vbo);
      gl.deleteVertexArray(vao);
    };
  }, []);

  // Main interactive simulation loop
  useEffect(() => {
    const gl = glRef.current;
    const program = programRef.current;
    const canvas = canvasRef.current;
    if (!gl || !program || !canvas) return;

    let startTime = performance.now();
    let accumulatedSimTime = 0;
    let lastTick = performance.now();

    const render = (now: number) => {
      const dt = Math.min(0.1, (now - lastTick) * 0.001);
      lastTick = now;

      if (isPlaying) {
        accumulatedSimTime += dt * simSpeed;
      }

      // Handle automated simulation camera flight modes
      if (isPlaying) {
        if (simMode === 'orbit') {
          setCamPhiDeg((prev) => (prev + dt * 18.0 * simSpeed) % 360);
        } else if (simMode === 'polar_sweep') {
          setCamPhiDeg((prev) => (prev + dt * 10.0 * simSpeed) % 360);
          setCamThetaDeg(55.0 + 35.0 * Math.sin(accumulatedSimTime * 0.4));
        } else if (simMode === 'horizon_plunge') {
          plungeT.current += dt * 0.15 * simSpeed;
          // Plunge from 50M to 3.2M then loop back
          const tCycle = (plungeT.current % 1.0);
          const rTarget = 45.0 * Math.exp(-tCycle * 2.6) + 3.2;
          setCamDist(rTarget);
        }
      }

      // Handle infalling probe telemetry simulation
      if (isProbeActive && isPlaying) {
        setProbeR((currentR) => {
          const rNow = currentR ?? camDist;
          // dr/dtau = - sqrt(2M/r) for radial free-fall
          const dr = -Math.sqrt(Math.max(0.001, 2.0 / rNow)) * dt * simSpeed * 2.5;
          const nextR = Math.max(2.001, rNow + dr);
          
          setProbeTau((t) => t + dt * simSpeed);
          // Gravitational + kinematic redshift factor (1+z)
          const zFactor = 1.0 / Math.sqrt(Math.max(0.01, 1.0 - 2.0 / nextR));
          setProbeRedshift(zFactor);

          if (nextR <= 2.005) {
            setIsProbeActive(false);
          }
          return nextR;
        });
      }

      // Handle canvas resize
      const dpr = window.devicePixelRatio || 1;
      const displayWidth = Math.floor(canvas.clientWidth * Math.min(dpr, 1.25));
      const displayHeight = Math.floor(canvas.clientHeight * Math.min(dpr, 1.25));
      if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width = displayWidth;
        canvas.height = displayHeight;
        gl.viewport(0, 0, displayWidth, displayHeight);
      }

      gl.useProgram(program);

      // Pass uniforms
      gl.uniform2f(gl.getUniformLocation(program, 'u_resolution'), canvas.width, canvas.height);
      gl.uniform1f(gl.getUniformLocation(program, 'u_time'), accumulatedSimTime);
      gl.uniform1f(gl.getUniformLocation(program, 'u_mass'), 1.0);
      gl.uniform1f(gl.getUniformLocation(program, 'u_spin'), metric === 'kerr' ? spinA : 0.0);
      gl.uniform1f(gl.getUniformLocation(program, 'u_cam_dist'), camDist);
      gl.uniform1f(gl.getUniformLocation(program, 'u_cam_theta'), (camThetaDeg * Math.PI) / 180.0);
      gl.uniform1f(gl.getUniformLocation(program, 'u_cam_phi'), (camPhiDeg * Math.PI) / 180.0);
      gl.uniform1f(gl.getUniformLocation(program, 'u_fov'), (fovDeg * Math.PI) / 180.0);

      const obsCode = observerType === 'static' ? 0 : observerType === 'free_falling' ? 1 : 2;
      gl.uniform1i(gl.getUniformLocation(program, 'u_observer_type'), obsCode);
      gl.uniform1i(gl.getUniformLocation(program, 'u_show_disk'), showDisk ? 1 : 0);
      gl.uniform1i(gl.getUniformLocation(program, 'u_show_grid'), showGrid ? 1 : 0);
      gl.uniform1i(gl.getUniformLocation(program, 'u_doppler_enabled'), dopplerEnabled ? 1 : 0);
      gl.uniform1f(gl.getUniformLocation(program, 'u_disk_outer'), diskOuterR);
      gl.uniform1i(gl.getUniformLocation(program, 'u_palette'), diskPalette);

      gl.drawArrays(gl.TRIANGLES, 0, 6);

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [
    isPlaying,
    simSpeed,
    simMode,
    metric,
    spinA,
    camDist,
    camThetaDeg,
    camPhiDeg,
    fovDeg,
    observerType,
    showDisk,
    showGrid,
    dopplerEnabled,
    diskOuterR,
    diskPalette,
    isProbeActive,
  ]);

  // Mouse drag interaction for rotating camera
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    lastMouseRef.current = { x: e.clientX, y: e.clientY };
    if (simMode !== 'manual') {
      setSimMode('manual');
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - lastMouseRef.current.x;
    const dy = e.clientY - lastMouseRef.current.y;
    lastMouseRef.current = { x: e.clientX, y: e.clientY };

    setCamPhiDeg((prev) => (prev - dx * 0.35) % 360);
    setCamThetaDeg((prev) => Math.min(172, Math.max(8, prev - dy * 0.35)));
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  // Launch test probe
  const launchProbe = () => {
    setProbeR(camDist);
    setProbeTau(0.0);
    setProbeRedshift(1.0);
    setIsProbeActive(true);
  };

  // Physical calculations for HUD
  const M = 1.0;
  const r_horizon = metric === 'kerr' ? M + Math.sqrt(Math.max(0, M * M - spinA * spinA)) : 2.0 * M;
  const r_isco = metric === 'kerr' ? 6.0 * (1.0 - 0.5 * spinA) : 6.0 * M;
  const shadowDiameter = metric === 'kerr' ? (5.196 - 0.35 * spinA).toFixed(3) : '5.196';
  const lapseObs = Math.sqrt(Math.max(0, 1 - (2 * M) / camDist)).toFixed(4);

  return (
    <div id="optical-simulation-container" className="flex flex-col h-full bg-neutral-950 text-neutral-200 select-none">
      {/* Viewport Canvas Area */}
      <div
        className="relative flex-1 min-h-[460px] cursor-grab active:cursor-grabbing overflow-hidden bg-black"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <canvas ref={canvasRef} className="w-full h-full block" />

        {/* Top-Left: Scientific Telemetry HUD & AnyaLabs Mission Control Header */}
        <div className="absolute top-4 left-4 pointer-events-none flex flex-col gap-2 font-mono text-xs z-10">
          {/* AnyaLabs Mission Control Header */}
          <div className="bg-neutral-950/90 backdrop-blur border border-neutral-800/90 px-3.5 py-2 rounded-lg shadow-2xl max-w-xs transition-all flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <div>
                <div className="text-[11px] font-bold text-white tracking-wider">KERR BLACK HOLE</div>
                <div className="text-[9px] text-sky-400 font-semibold tracking-wide flex items-center gap-1">
                  <span>ANYALABS</span>
                  <span className="text-neutral-600">•</span>
                  <span>PHYSICS: METRICS</span>
                </div>
              </div>
            </div>
            <div className="text-right text-[9px] text-neutral-400">
              <div>SPIN <strong className="text-amber-400">{spinA.toFixed(2)}</strong></div>
              <div>ACCR <strong className="text-sky-400">0.03 Ṁ</strong></div>
            </div>
          </div>

          <div className="bg-neutral-950/85 backdrop-blur border border-neutral-800/90 px-3.5 py-2.5 rounded-lg shadow-2xl max-w-xs transition-all">
            <div className="text-neutral-400 uppercase tracking-widest text-[10px] mb-1.5 font-semibold flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-sky-400">
                <Compass className="w-3.5 h-3.5" />
                Observer Frame
              </span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-sky-950 text-sky-300 border border-sky-800">
                {observerType.toUpperCase().replace('_', ' ')}
              </span>
            </div>
            <div className="space-y-1 text-neutral-300">
              <div className="flex justify-between">
                <span className="text-neutral-500">Radial Distance r_obs:</span>
                <span className="font-semibold text-white">{camDist.toFixed(1)} M</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Polar Inclination θ:</span>
                <span>{camThetaDeg.toFixed(1)}°</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Field of View (FOV):</span>
                <span>{fovDeg.toFixed(0)}°</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Lapse α(r_obs):</span>
                <span className="text-amber-400">{lapseObs}</span>
              </div>
            </div>
          </div>

          <div className="bg-neutral-950/85 backdrop-blur border border-neutral-800/90 px-3.5 py-2.5 rounded-lg shadow-2xl max-w-xs">
            <div className="text-neutral-400 uppercase tracking-widest text-[10px] mb-1.5 font-semibold flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                Spacetime Geometry
              </span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold uppercase">
                {metric} {metric === 'kerr' ? `(a=${spinA.toFixed(2)})` : ''}
              </span>
            </div>
            <div className="space-y-1 text-neutral-300">
              <div className="flex justify-between">
                <span className="text-neutral-500">Event Horizon r+:</span>
                <span>{r_horizon.toFixed(3)} M</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Photon Sphere:</span>
                <span>3.000 M</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">ISCO Radius:</span>
                <span className="text-sky-300">{r_isco.toFixed(3)} M</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Shadow Diam. (b_crit):</span>
                <span className="text-amber-300 font-semibold">{shadowDiameter} M</span>
              </div>
            </div>
          </div>

          {/* Live Infalling Probe Telemetry */}
          {isProbeActive && (
            <div className="bg-neutral-950/90 backdrop-blur border border-amber-800/80 px-3.5 py-2.5 rounded-lg shadow-2xl max-w-xs animate-fade-in">
              <div className="text-amber-400 uppercase tracking-widest text-[10px] mb-1 font-semibold flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5 animate-pulse" />
                Infalling Probe Telemetry
              </div>
              <div className="space-y-1 text-neutral-300">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Probe Radius r:</span>
                  <span className="font-bold text-amber-300">{(probeR ?? 0).toFixed(2)} M</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Proper Time τ:</span>
                  <span>{probeTau.toFixed(2)} M</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Redshift factor (1+z):</span>
                  <span className="text-red-400 font-mono font-bold">
                    {probeRedshift > 50 ? '∞ (Horizon)' : probeRedshift.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Top-Right: Quick Zoom & Simulation Mode Bar */}
        <div className="absolute top-4 right-4 flex flex-col items-end gap-2 z-10">
          {/* Zoom In/Out Overlay Controls */}
          <div className="flex items-center gap-1 bg-neutral-950/90 backdrop-blur border border-neutral-800 p-1 rounded-lg shadow-xl font-mono text-xs">
            <button
              id="zoom-out-btn"
              onClick={zoomOut}
              className="p-1.5 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-200 transition-colors"
              title="Zoom out (Mouse wheel down) - view entire black hole and accretion disk"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="px-2 font-bold text-sky-400">{camDist.toFixed(0)}M</span>
            <button
              id="zoom-in-btn"
              onClick={zoomIn}
              className="p-1.5 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-200 transition-colors"
              title="Zoom in (Mouse wheel up)"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Perspective Presets */}
          <div className="flex items-center gap-1 bg-neutral-950/90 backdrop-blur border border-neutral-800 p-1 rounded-lg shadow-xl text-[11px] font-mono">
            <button
              id="preset-wide-btn"
              onClick={() => setPresetView(45.0, 58.0)}
              className={`px-2.5 py-1 rounded transition-colors ${
                camDist >= 40.0
                  ? 'bg-sky-950 border border-sky-800 text-sky-300 font-semibold'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
              }`}
              title="Unzoom to see full black hole and disk system (45M)"
            >
              Wide (45M)
            </button>
            <button
              id="preset-orbit-btn"
              onClick={() => setPresetView(20.0, 52.0)}
              className={`px-2.5 py-1 rounded transition-colors ${
                camDist >= 15.0 && camDist < 40.0
                  ? 'bg-sky-950 border border-sky-800 text-sky-300 font-semibold'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
              }`}
              title="Standard orbital view (20M)"
            >
              Mid (20M)
            </button>
            <button
              id="preset-close-btn"
              onClick={() => setPresetView(6.0, 48.0)}
              className={`px-2.5 py-1 rounded transition-colors ${
                camDist < 15.0
                  ? 'bg-sky-950 border border-sky-800 text-sky-300 font-semibold'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
              }`}
              title="Near-horizon photon sphere zoom (6M)"
            >
              Close (6M)
            </button>
          </div>

          {/* Simulation Flight Modes & Telemetry Toggle */}
          <div className="flex items-center gap-1.5 bg-neutral-950/90 backdrop-blur border border-neutral-800 p-1 rounded-lg shadow-xl text-[11px] font-mono">
            <span className="text-neutral-500 px-1.5 flex items-center gap-1">
              <Navigation className="w-3 h-3 text-sky-400" />
              Flight:
            </span>
            {(
              [
                { id: 'manual', label: 'Free Drag' },
                { id: 'orbit', label: 'Auto Orbit' },
                { id: 'polar_sweep', label: 'Polar Flyover' },
                { id: 'horizon_plunge', label: 'Infall Plunge' },
              ] as const
            ).map((mode) => (
              <button
                key={mode.id}
                id={`sim-mode-${mode.id}-btn`}
                onClick={() => setSimMode(mode.id)}
                className={`px-2 py-1 rounded transition-colors ${
                  simMode === mode.id
                    ? 'bg-neutral-800 border border-neutral-700 text-white font-medium'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
                }`}
              >
                {mode.label}
              </button>
            ))}

            <div className="h-4 w-[1px] bg-neutral-800 mx-0.5" />

            <button
              id="toggle-telemetry-hud-btn"
              onClick={() => setShowTelemetryConsole(!showTelemetryConsole)}
              className={`px-2 py-1 rounded flex items-center gap-1 transition-colors ${
                showTelemetryConsole
                  ? 'bg-amber-950/80 border border-amber-800 text-amber-300 font-semibold'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
              }`}
              title="Toggle AnyaLabs Telemetry HUD"
            >
              <Activity className="w-3 h-3 text-amber-400" />
              <span>Metrics</span>
            </button>
          </div>
        </div>

        {/* Right-Side: AnyaLabs Mission Control Research Telemetry Console */}
        {showTelemetryConsole && (
          <div className="absolute top-20 right-4 pointer-events-auto flex flex-col gap-2.5 font-mono text-xs z-10 w-72 max-h-[calc(100%-120px)] overflow-y-auto custom-scrollbar">
            {/* Mass Metrics & Accretion Flux Curve Card */}
            <div className="bg-neutral-950/90 backdrop-blur border border-neutral-800/90 p-3 rounded-lg shadow-2xl">
              <div className="flex items-center justify-between text-[11px] mb-2 font-semibold">
                <span className="text-amber-400 flex items-center gap-1.5 uppercase tracking-wider">
                  <Flame className="w-3.5 h-3.5" />
                  Mass Metrics • F(r)
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-950/60 border border-amber-800/70 text-amber-300">
                  NOVIKOV-THORNE
                </span>
              </div>
              <div className="text-[10px] text-neutral-400 mb-1.5 flex justify-between">
                <span>Dissipation Flux Profile</span>
                <span className="text-neutral-300 font-bold">r_peak ≈ {(1.36 * r_isco).toFixed(2)} M</span>
              </div>
              {/* Dynamic SVG Accretion Energy Dissipation Graph */}
              <div className="relative bg-black/60 rounded border border-neutral-900 p-1.5">
                <svg viewBox="0 0 240 60" className="w-full h-14 overflow-visible">
                  <defs>
                    <linearGradient id="fluxGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.45" />
                      <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  {/* Subtle Grid Lines */}
                  <line x1="0" y1="15" x2="240" y2="15" stroke="#262626" strokeDasharray="2,2" strokeWidth="0.8" />
                  <line x1="0" y1="35" x2="240" y2="35" stroke="#262626" strokeDasharray="2,2" strokeWidth="0.8" />
                  <line x1="0" y1="55" x2="240" y2="55" stroke="#333333" strokeWidth="1" />
                  
                  {/* ISCO vertical boundary */}
                  <line x1="30" y1="5" x2="30" y2="55" stroke="#38bdf8" strokeDasharray="2,2" strokeWidth="1" />
                  <text x="33" y="14" fill="#38bdf8" fontSize="8" fontFamily="monospace">ISCO</text>

                  {/* Flux Curve Path */}
                  <path
                    d="M 30,55 Q 52,8 85,24 T 150,45 T 235,53 L 235,55 L 30,55 Z"
                    fill="url(#fluxGrad)"
                  />
                  <path
                    d="M 30,55 Q 52,8 85,24 T 150,45 T 235,53"
                    fill="none"
                    stroke="#fbbf24"
                    strokeWidth="2"
                  />
                  {/* Peak Marker Dot */}
                  <circle cx="56" cy="11" r="3" fill="#fef08a" stroke="#d97706" strokeWidth="1.5" className="animate-pulse" />
                </svg>
                <div className="flex justify-between text-[8px] text-neutral-500 font-mono mt-1">
                  <span>{r_isco.toFixed(1)}M</span>
                  <span>10M</span>
                  <span>20M</span>
                  <span>30M</span>
                </div>
              </div>
            </div>

            {/* Spin-Parameter Metric Curves Card */}
            <div className="bg-neutral-950/90 backdrop-blur border border-neutral-800/90 p-3 rounded-lg shadow-2xl">
              <div className="flex items-center justify-between text-[11px] mb-2 font-semibold">
                <span className="text-sky-400 flex items-center gap-1.5 uppercase tracking-wider">
                  <Sliders className="w-3.5 h-3.5" />
                  Spin-Parameter • a*
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-sky-950/60 border border-sky-800/70 text-sky-300">
                  a = {spinA.toFixed(2)}
                </span>
              </div>
              <div className="text-[10px] text-neutral-400 mb-1.5 flex justify-between">
                <span>Horizon & ISCO Radii</span>
                <span className="text-amber-400 font-semibold">r+(a)={r_horizon.toFixed(2)}M</span>
              </div>
              {/* Dynamic SVG Spin Evolution Graph */}
              <div className="relative bg-black/60 rounded border border-neutral-900 p-1.5">
                <svg viewBox="0 0 240 65" className="w-full h-16 overflow-visible">
                  {/* Grid */}
                  <line x1="0" y1="20" x2="240" y2="20" stroke="#262626" strokeDasharray="2,2" strokeWidth="0.8" />
                  <line x1="0" y1="40" x2="240" y2="40" stroke="#262626" strokeDasharray="2,2" strokeWidth="0.8" />
                  <line x1="0" y1="60" x2="240" y2="60" stroke="#333333" strokeWidth="1" />

                  {/* ISCO Radius Curve: goes from 6M at a=0 (y=8) down to 1M at a=1 (y=56) */}
                  <path
                    d="M 10,8 C 70,12 140,28 230,56"
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="1.8"
                  />
                  {/* Event Horizon Curve: goes from 2M at a=0 (y=44) down to 1M at a=1 (y=56) */}
                  <path
                    d="M 10,44 C 80,45 160,48 230,56"
                    fill="none"
                    stroke="#f97316"
                    strokeWidth="1.8"
                  />

                  {/* Current Spin Indicator Marker */}
                  {(() => {
                    const markerX = 10 + spinA * 220;
                    // Interpolated approximate Y values
                    const iscoY = 8 + (56 - 8) * Math.pow(spinA, 1.25);
                    const rPlusY = 44 + (56 - 44) * Math.pow(spinA, 2.0);
                    return (
                      <g>
                        <line x1={markerX} y1="2" x2={markerX} y2="60" stroke="#a855f7" strokeDasharray="2,2" strokeWidth="1.2" />
                        <circle cx={markerX} cy={iscoY} r="3.5" fill="#38bdf8" stroke="#0369a1" strokeWidth="1.5" />
                        <circle cx={markerX} cy={rPlusY} r="3" fill="#f97316" stroke="#9a3412" strokeWidth="1.5" />
                      </g>
                    );
                  })()}
                </svg>
                <div className="flex justify-between text-[8px] text-neutral-500 font-mono mt-1">
                  <span>a=0.0 (Schwarzschild)</span>
                  <span className="text-sky-400">ISCO r_isco</span>
                  <span className="text-orange-400">Horizon r+</span>
                  <span>a=1.0 (Extremal)</span>
                </div>
              </div>
            </div>

            {/* Relativistic Observer Telemetry Grid */}
            <div className="bg-neutral-950/90 backdrop-blur border border-neutral-800/90 p-3 rounded-lg shadow-2xl">
              <div className="text-[10px] text-neutral-400 uppercase tracking-widest mb-2 font-semibold flex items-center justify-between">
                <span className="text-emerald-400 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5" />
                  Telemetry Readout
                </span>
                <span className="text-[8px] px-1 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono">
                  LIVE
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div className="bg-neutral-900/80 p-1.5 rounded border border-neutral-800">
                  <div className="text-neutral-500 text-[9px]">Velocity β = v/c</div>
                  <div className="text-white font-bold font-mono">
                    {(Math.sqrt(1.0 / Math.max(1.0, r_isco))).toFixed(3)} c
                  </div>
                </div>
                <div className="bg-neutral-900/80 p-1.5 rounded border border-neutral-800">
                  <div className="text-neutral-500 text-[9px]">Doppler Factor δ</div>
                  <div className="text-sky-300 font-bold font-mono">
                    {metric === 'kerr' ? (1.0 + 0.9 * (1.0 - Math.abs(Math.cos((camThetaDeg * Math.PI) / 180)))).toFixed(2) : '1.38'}×
                  </div>
                </div>
                <div className="bg-neutral-900/80 p-1.5 rounded border border-neutral-800">
                  <div className="text-neutral-500 text-[9px]">Redshift z(isco)</div>
                  <div className="text-red-400 font-bold font-mono">
                    {(1.0 / Math.sqrt(Math.max(0.01, 1 - 2 / r_isco)) - 1.0).toFixed(2)}
                  </div>
                </div>
                <div className="bg-neutral-900/80 p-1.5 rounded border border-neutral-800">
                  <div className="text-neutral-500 text-[9px]">Deflection Scale</div>
                  <div className="text-amber-300 font-bold font-mono">0.900</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bottom-Center Interactive Simulation Control Bar */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-neutral-950/90 backdrop-blur border border-neutral-800 px-3 py-1.5 rounded-full shadow-2xl font-mono text-xs z-10">
          <button
            id="sim-play-pause-btn"
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-950 border border-sky-800 text-sky-300 hover:bg-sky-900 transition-colors font-semibold"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isPlaying ? 'Pause Sim' : 'Play Sim'}</span>
          </button>

          <div className="h-4 w-[1px] bg-neutral-800" />

          {/* Time Speed */}
          <div className="flex items-center gap-1 text-[11px]">
            <span className="text-neutral-500">Speed:</span>
            {[0.5, 1.0, 2.0, 4.0].map((spd) => (
              <button
                key={spd}
                id={`speed-${spd}x-btn`}
                onClick={() => setSimSpeed(spd)}
                className={`px-1.5 py-0.5 rounded transition-colors ${
                  simSpeed === spd
                    ? 'bg-neutral-800 text-white font-bold'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>

          <div className="h-4 w-[1px] bg-neutral-800" />

          {/* Launch Probe Action */}
          <button
            id="launch-probe-btn"
            onClick={launchProbe}
            disabled={isProbeActive}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full border transition-colors ${
              isProbeActive
                ? 'bg-amber-950/40 border-amber-800/50 text-amber-500 cursor-not-allowed'
                : 'bg-neutral-900 hover:bg-neutral-800 border-neutral-700 text-amber-300'
            }`}
            title="Launch test probe and watch gravitational redshift as it approaches horizon"
          >
            <Send className="w-3 h-3 text-amber-400" />
            <span>{isProbeActive ? 'Probe Infalling...' : 'Launch Probe'}</span>
          </button>
        </div>

        {/* Bottom Hint */}
        <div className="absolute bottom-4 left-4 pointer-events-none text-neutral-500 text-[10px] font-mono bg-neutral-950/80 px-2 py-1 rounded border border-neutral-800">
          Scroll mouse wheel or use zoom slider to unzoom & see the entire system
        </div>
      </div>

      {/* Collapsible Lower Settings & Physics Control Dock */}
      <div className="border-t border-neutral-800/80 bg-neutral-900/90">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col gap-3">
          {/* Main Controls Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Metric & Geometry */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-lg border border-neutral-800">
                <button
                  id="select-schwarzschild-btn"
                  onClick={() => handleMetricChange('schwarzschild')}
                  className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                    metric === 'schwarzschild'
                      ? 'bg-neutral-800 text-white shadow-sm'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  Schwarzschild (a = 0)
                </button>
                <button
                  id="select-kerr-btn"
                  onClick={() => handleMetricChange('kerr')}
                  className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                    metric === 'kerr'
                      ? 'bg-neutral-800 text-white shadow-sm'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  Kerr (Spinning)
                </button>
              </div>

              {metric === 'kerr' && (
                <div className="flex items-center gap-2 bg-neutral-950 px-3 py-1.5 rounded-lg border border-neutral-800">
                  <span className="text-neutral-400 font-mono">Spin a/M:</span>
                  <input
                    id="spin-slider"
                    type="range"
                    min="0.0"
                    max="0.98"
                    step="0.02"
                    value={spinA}
                    onChange={(e) => setSpinA(parseFloat(e.target.value))}
                    className="w-20 accent-sky-400"
                  />
                  <span className="font-mono text-sky-400 w-9 font-bold">{spinA.toFixed(2)}</span>
                </div>
              )}

              {/* Observer Class */}
              <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-lg border border-neutral-800">
                <span className="text-neutral-400 px-2 font-mono flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5 text-neutral-500" />
                  Observer:
                </span>
                {(['static', 'free_falling', 'keplerian'] as ObserverType[]).map((type) => (
                  <button
                    key={type}
                    id={`obs-type-${type}-btn`}
                    onClick={() => setObserverType(type)}
                    className={`px-2.5 py-1 rounded capitalize font-medium transition-colors ${
                      observerType === type
                        ? 'bg-sky-950 text-sky-300 border border-sky-800'
                        : 'text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    {type.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Camera Zoom & Distance Sliders */}
            <div className="flex flex-wrap items-center gap-3 bg-neutral-950 px-3 py-1.5 rounded-lg border border-neutral-800 font-mono">
              <div className="flex items-center gap-2">
                <span className="text-neutral-400">Distance r_obs:</span>
                <input
                  id="cam-dist-slider"
                  type="range"
                  min="3.5"
                  max="80.0"
                  step="0.5"
                  value={camDist}
                  onChange={(e) => setCamDist(parseFloat(e.target.value))}
                  className="w-24 accent-sky-400"
                  title="Unzoom to 50-80M to see the entire black hole and accretion disk"
                />
                <span className="text-sky-400 w-12 font-bold">{camDist.toFixed(1)}M</span>
              </div>

              <div className="h-4 w-[1px] bg-neutral-800 hidden sm:block" />

              <div className="flex items-center gap-2">
                <span className="text-neutral-400">FOV:</span>
                <input
                  id="cam-fov-slider"
                  type="range"
                  min="25"
                  max="85"
                  step="1"
                  value={fovDeg}
                  onChange={(e) => setFovDeg(parseFloat(e.target.value))}
                  className="w-20 accent-sky-400"
                  title="Field of view angle"
                />
                <span className="text-sky-400 w-8">{fovDeg.toFixed(0)}°</span>
              </div>
            </div>

            {/* Toggle Dock Collapse */}
            <button
              onClick={() => setIsControlsExpanded(!isControlsExpanded)}
              className="p-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-400 hover:text-white transition-colors"
              title="Toggle detailed visual settings"
            >
              {isControlsExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>

          {/* Expanded Visual & Accretion Disk Physics Controls */}
          {isControlsExpanded && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-neutral-800/60 text-xs animate-fade-in">
              {/* Accretion Disk Dimensions */}
              <div className="bg-neutral-950 p-2.5 rounded-lg border border-neutral-800 space-y-2">
                <div className="flex items-center justify-between font-mono">
                  <span className="text-neutral-400 flex items-center gap-1.5">
                    <Disc className="w-3.5 h-3.5 text-amber-400" />
                    Disk Outer Radius:
                  </span>
                  <span className="text-amber-400 font-bold">{diskOuterR.toFixed(1)} M</span>
                </div>
                <input
                  type="range"
                  min="10.0"
                  max="35.0"
                  step="1.0"
                  value={diskOuterR}
                  onChange={(e) => setDiskOuterR(parseFloat(e.target.value))}
                  className="w-full accent-amber-400"
                />
                <div className="flex justify-between text-[10px] text-neutral-500 font-mono">
                  <span>Compact (10M)</span>
                  <span>Extended (35M)</span>
                </div>
              </div>

              {/* Color Palette Selector */}
              <div className="bg-neutral-950 p-2.5 rounded-lg border border-neutral-800 space-y-2">
                <span className="text-neutral-400 font-mono flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-orange-400" />
                  Disk Thermal Palette:
                </span>
                <div className="grid grid-cols-2 gap-1 font-mono text-[11px]">
                  {[
                    { id: 0, label: 'Astrophysical Orange' },
                    { id: 1, label: 'Gargantua Gold' },
                    { id: 2, label: 'Synchrotron Blue' },
                    { id: 3, label: 'Thermal Infrared' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setDiskPalette(item.id as 0 | 1 | 2 | 3)}
                      className={`px-2 py-1 rounded text-left truncate transition-colors ${
                        diskPalette === item.id
                          ? 'bg-neutral-800 border border-neutral-700 text-white font-semibold'
                          : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Relativistic Toggles & Reset */}
              <div className="bg-neutral-950 p-2.5 rounded-lg border border-neutral-800 flex flex-col justify-between space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    id="toggle-disk-btn"
                    onClick={() => setShowDisk(!showDisk)}
                    className={`px-2.5 py-1 rounded flex items-center gap-1 border transition-colors ${
                      showDisk
                        ? 'bg-amber-950/70 border-amber-800 text-amber-300'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-500'
                    }`}
                  >
                    <Disc className="w-3 h-3" />
                    Disk
                  </button>

                  <button
                    id="toggle-doppler-btn"
                    onClick={() => setDopplerEnabled(!dopplerEnabled)}
                    className={`px-2.5 py-1 rounded flex items-center gap-1 border transition-colors ${
                      dopplerEnabled
                        ? 'bg-sky-950/70 border-sky-800 text-sky-300'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-500'
                    }`}
                    title="Relativistic Doppler boosting (1+z)⁻⁴"
                  >
                    Doppler (1+z)⁻⁴
                  </button>

                  <button
                    id="toggle-grid-btn"
                    onClick={() => setShowGrid(!showGrid)}
                    className={`px-2.5 py-1 rounded border transition-colors ${
                      showGrid
                        ? 'bg-neutral-800 border-neutral-700 text-white'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-500'
                    }`}
                  >
                    Celestial Grid
                  </button>
                </div>

                <div className="flex justify-end">
                  <button
                    id="reset-cam-btn"
                    onClick={() => {
                      setCamDist(25.0);
                      setCamThetaDeg(78.0);
                      setCamPhiDeg(0.0);
                      setFovDeg(55.0);
                      setSimMode('manual');
                    }}
                    className="flex items-center gap-1 px-3 py-1 rounded bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-neutral-200 transition-colors font-mono text-[11px]"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Reset Camera
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
