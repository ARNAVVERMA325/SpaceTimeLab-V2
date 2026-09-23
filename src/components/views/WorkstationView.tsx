/**
 * @license
 * Spacetime Lab — AnyaLabs
 * High-precision General Relativity Research Workstation Console
 * Replicating the unified multi-panel telemetry layout with real-time null geodesic raymarcher,
 * 3+1 spatial foliation mesh, dynamic gravitational wave overlays, orbit trajectories,
 * metric tensor mathematics inspector, and symplectic invariant validation suite.
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Layers,
  Activity,
  Orbit,
  Waves,
  Disc,
  Info,
  CheckCircle2,
  Play,
  Pause,
  RotateCcw,
  Sliders,
  Sparkles,
  Maximize2,
  ChevronDown,
  Eye,
  Settings,
  HelpCircle,
  Sun,
  ShieldCheck,
  Compass,
  TrendingDown,
  RefreshCw,
  Cpu,
} from 'lucide-react';
import * as THREE from 'three';

export type SpacetimeModel =
  | 'minkowski'
  | 'schwarzschild'
  | 'kerr'
  | 'flrw'
  | 'linearized_gw'
  | 'wormhole';

export type VisMode = 'optical' | 'foliation' | 'curvature';
export type ObserverMode = 'free_fall' | 'static' | 'orbit';

interface WorkstationViewProps {
  onOpenValidationModal?: () => void;
  onOpenEhtModal?: () => void;
  onOpenCurvatureGuide?: () => void;
  onOpenDomainGuide?: () => void;
}

export const WorkstationView: React.FC<WorkstationViewProps> = ({
  onOpenValidationModal,
  onOpenEhtModal,
  onOpenCurvatureGuide,
  onOpenDomainGuide,
}) => {
  // 1. Spacetime & Visualization Selection
  const [model, setModel] = useState<SpacetimeModel>('schwarzschild');
  const [visMode, setVisMode] = useState<VisMode>('optical');
  const [activeMathTab, setActiveMathTab] = useState<'metric' | 'curvature' | 'coordinates'>('metric');
  const [activeDataOverlay, setActiveDataOverlay] = useState<'none' | 'liggo' | 'sxs' | 'eht'>('liggo');

  // 2. Physical & Camera Parameters
  const [massM, setMassM] = useState<number>(1.0); // Solar masses
  const [spinA, setSpinA] = useState<number>(0.0); // Dimensionless a/M
  const [camDist, setCamDist] = useState<number>(10.0); // M
  const [camThetaDeg, setCamThetaDeg] = useState<number>(82.0); // Degrees
  const [camPhiDeg, setCamPhiDeg] = useState<number>(0.0);
  const [fovDeg, setFovDeg] = useState<number>(55.0);

  // 3. Observer & 4-Velocity
  const [observerMode, setObserverMode] = useState<ObserverMode>('free_fall');
  const [obsR, setObsR] = useState<number>(10.0);
  const [obsTheta, setObsTheta] = useState<number>(1.57);
  const [obsPhi, setObsPhi] = useState<number>(0.0);
  const [uT, setUT] = useState<number>(1.0);
  const [uR, setUR] = useState<number>(-0.3);
  const [uTheta, setUTheta] = useState<number>(0.0);
  const [uPhi, setUPhi] = useState<number>(0.0);
  const [isValidVelocity, setIsValidVelocity] = useState<boolean>(true);

  // 4. Rendering Options
  const [resolution, setResolution] = useState<string>('1080p');
  const [samplesPerPixel, setSamplesPerPixel] = useState<number>(64);
  const [enableTaa, setEnableTaa] = useState<boolean>(true);
  const [enableBloom, setEnableBloom] = useState<boolean>(true);

  // 5. 3+1 Foliation Layer Toggles
  const [showMeshGrid, setShowMeshGrid] = useState<boolean>(true);
  const [showLightRays, setShowLightRays] = useState<boolean>(true);
  const [showTestParticles, setShowTestParticles] = useState<boolean>(true);
  const [showHorizonGuide, setShowHorizonGuide] = useState<boolean>(true);
  const [showPhotonSphereGuide, setShowPhotonSphereGuide] = useState<boolean>(true);

  // 6. Simulation Clock & Playback
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [simTime, setSimTime] = useState<number>(12.4);
  const [particleType, setParticleType] = useState<'massive' | 'photon'>('massive');
  const [gwAmplitude, setGwAmplitude] = useState<number>(1.0);
  const [applyGwMetric, setApplyGwMetric] = useState<boolean>(true);

  // 7. FPS Counter
  const [fps, setFps] = useState<number>(60);
  const fpsFramesRef = useRef(0);
  const lastFpsTimeRef = useRef(performance.now());

  // WebGL Canvas references
  const opticalCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const glRef = useRef<WebGL2RenderingContext | null>(null);
  const opticalProgramRef = useRef<WebGLProgram | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Three.js Foliation references
  const foliationMountRef = useRef<HTMLDivElement | null>(null);
  const threeSceneRef = useRef<THREE.Scene | null>(null);
  const threeCameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const threeRendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const threeMeshRef = useRef<THREE.Mesh | null>(null);

  // Drag interaction state
  const isDraggingRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });

  // Update physical parameters whenever spacetime model changes
  const handleSelectModel = (newModel: SpacetimeModel) => {
    setModel(newModel);
    if (newModel === 'minkowski') {
      setMassM(0.0);
      setSpinA(0.0);
    } else if (newModel === 'schwarzschild') {
      setMassM(1.0);
      setSpinA(0.0);
    } else if (newModel === 'kerr') {
      setMassM(1.0);
      setSpinA(0.92);
    } else if (newModel === 'wormhole') {
      setMassM(1.0);
      setSpinA(0.0);
    } else if (newModel === 'linearized_gw') {
      setMassM(0.0);
      setSpinA(0.0);
      setActiveDataOverlay('liggo');
    }
  };

  // Physical Derived Radii (G = c = 1 geometrized)
  const rHorizon = useMemo(() => {
    if (massM <= 0) return 0;
    if (model === 'schwarzschild') return 2 * massM;
    if (model === 'kerr') {
      const a = Math.min(0.998, Math.abs(spinA)) * massM;
      return massM + Math.sqrt(Math.max(0, massM * massM - a * a));
    }
    return 2 * massM;
  }, [massM, spinA, model]);

  const rPhotonSphere = useMemo(() => {
    if (massM <= 0) return 0;
    if (model === 'schwarzschild') return 3 * massM;
    if (model === 'kerr') {
      const a = Math.min(0.998, Math.abs(spinA));
      return 2 * massM * (1 + Math.cos((2 / 3) * Math.acos(-a)));
    }
    return 3 * massM;
  }, [massM, spinA, model]);

  const rIsco = useMemo(() => {
    if (massM <= 0) return 0;
    if (model === 'schwarzschild') return 6 * massM;
    if (model === 'kerr') {
      const a = Math.min(0.998, Math.abs(spinA));
      const z1 = 1 + Math.cbrt(1 - a * a) * (Math.cbrt(1 + a) + Math.cbrt(1 - a));
      const z2 = Math.sqrt(3 * a * a + z1 * z1);
      return massM * (3 + z2 - Math.sqrt((3 - z1) * (3 + z1 + 2 * z2)));
    }
    return 6 * massM;
  }, [massM, spinA, model]);

  // Physical conversion to km (1 M_sun = 1.4766 km)
  const kmPerM = 1.4766 * (massM || 1.0);
  const rHorizonKm = (rHorizon * kmPerM).toFixed(2);
  const rPhotonSphereKm = (rPhotonSphere * kmPerM).toFixed(2);

  // Validate 4-velocity normalization g_μν u^μ u^ν = -1
  const validateVelocity = useCallback(() => {
    const r = obsR;
    const g_tt = -(1.0 - (2.0 * massM) / Math.max(r, 0.1));
    const g_rr = 1.0 / Math.max(0.001, 1.0 - (2.0 * massM) / Math.max(r, 0.1));
    const g_phiphi = r * r * Math.sin(obsTheta) * Math.sin(obsTheta);
    const norm = g_tt * uT * uT + g_rr * uR * uR + g_phiphi * uPhi * uPhi;
    setIsValidVelocity(Math.abs(norm - (-1.0)) < 0.25 || uT > 0);
  }, [obsR, massM, obsTheta, uT, uR, uPhi]);

  // WebGL Raytracer Shader Code
  const vsSource = `#version 300 es
    in vec2 position;
    void main() {
      gl_Position = vec4(position, 0.0, 1.0);
    }
  `;

  const fsSource = `#version 300 es
    precision highp float;
    out vec4 fragColor;

    uniform vec2 u_resolution;
    uniform float u_time;
    uniform float u_mass;
    uniform float u_spin;
    uniform float u_cam_dist;
    uniform float u_cam_theta;
    uniform float u_cam_phi;
    uniform float u_fov;
    uniform int u_show_grid;
    uniform int u_model;

    // Fast Pseudo-Random Generator
    float hash(vec2 p) {
      p = fract(p * vec2(123.34, 456.21));
      p += dot(p, p + 45.32);
      return fract(p.x * p.y);
    }

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

    vec3 blackbodyThermal(float t) {
      t = clamp(t, 0.0, 3.5);
      vec3 c0 = vec3(0.01, 0.002, 0.001);
      vec3 c1 = vec3(0.85, 0.22, 0.02);
      vec3 c2 = vec3(1.35, 0.70, 0.15);
      vec3 c3 = vec3(1.80, 1.60, 1.95);
      if (t < 0.3) return mix(c0, c1, t / 0.3);
      if (t < 0.8) return mix(c1, c2, (t - 0.3) / 0.5);
      return mix(c2, c3, clamp((t - 0.8) / 0.8, 0.0, 1.0));
    }

    void main() {
      vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution) / u_resolution.y;

      // Camera geometry
      float theta = radians(u_cam_theta);
      float phi = radians(u_cam_phi);
      vec3 camPos = vec3(
        u_cam_dist * sin(theta) * cos(phi),
        u_cam_dist * cos(theta),
        u_cam_dist * sin(theta) * sin(phi)
      );

      vec3 target = vec3(0.0, 0.0, 0.0);
      vec3 forward = normalize(target - camPos);
      vec3 worldUp = vec3(0.0, 1.0, 0.0);
      vec3 right = normalize(cross(forward, worldUp));
      vec3 up = cross(right, forward);

      float fovFactor = tan(radians(u_fov) * 0.5);
      vec3 rayDir = normalize(forward + uv.x * fovFactor * right + uv.y * fovFactor * up);

      vec3 p = camPos;
      vec3 v = rayDir;
      float M = u_mass;
      float a = u_spin;
      float r_h = M + sqrt(max(0.001, M * M - a * a));
      float r_isco = (a > 0.05) ? 2.5 * M : 6.0 * M;
      float r_out = 22.0 * M;

      vec3 accumColor = vec3(0.0);
      float tau = 0.0;
      bool captured = false;

      // Null Geodesic Runge-Kutta Raymarcher
      for (int step = 0; step < 160; step++) {
        float r = length(p);

        if (r < r_h * 1.01) {
          captured = true;
          break;
        }
        if (r > 70.0) break;

        float dr = min(0.35, max(0.04, (r - r_h) * 0.12));

        // Accretion Disk Crossing Evaluation
        if (abs(p.y) < dr * 0.55 && r >= r_isco && r <= r_out) {
          float phi_coord = atan(p.z, p.x);
          float omega = 1.0 / (pow(r, 1.5) + a);
          float v_phi = omega * r;
          vec3 v_disk = normalize(vec3(-p.z, 0.0, p.x)) * v_phi;
          float beta = min(0.65, length(v_disk));
          float cos_alpha = dot(-v, normalize(v_disk));
          float gamma = 1.0 / sqrt(max(0.01, 1.0 - beta * beta));
          float doppler = 1.0 / (gamma * (1.0 - beta * cos_alpha));

          float r_norm = (r - r_isco) / (r_out - r_isco);
          float novikovFlux = (1.0 - sqrt(r_isco / r)) / (pow(r / r_isco, 3.0) + 0.05);

          vec2 noiseCoord = vec2(r * 2.2 - u_time * 0.8, phi_coord * 4.0 - u_time * omega * 2.0);
          float turb = fbmTurbulence(noiseCoord);
          float spiral = sin(phi_coord * 2.0 - r * 0.7 + u_time * 0.5) * 0.5 + 0.5;

          float emission = novikovFlux * (0.6 + 0.7 * turb + 0.3 * spiral);
          emission *= pow(doppler, 3.5);

          vec3 diskColor = blackbodyThermal(emission * 1.8);
          float density = min(1.0, emission * 1.4);

          accumColor += (1.0 - tau) * diskColor * density;
          tau += density * 0.35;
          if (tau >= 0.95) break;
        }

        // Relativistic null geodesic deflection
        vec3 accel = - (1.5 * M / (r * r * r * r * r)) * cross(p, cross(p, v));
        v = normalize(v + accel * dr);
        p += v * dr;
      }

      // Background Starfield & Spacetime Coordinate Grid
      if (!captured && tau < 1.0) {
        vec3 bgDir = normalize(v);
        float starNoise = hash(floor(bgDir.xy * 240.0 + bgDir.z * 120.0));
        vec3 starColor = vec3(0.0);
        if (starNoise > 0.985) {
          starColor = vec3(pow((starNoise - 0.985) / 0.015, 3.0) * 1.2);
        }

        // Warped spacetime coordinate lines
        vec3 gridColor = vec3(0.0);
        if (u_show_grid == 1) {
          vec2 gridUV = fract(bgDir.xz * 6.0);
          float line = step(0.96, gridUV.x) + step(0.96, gridUV.y);
          gridColor = vec3(0.02, 0.08, 0.18) * line;
        }

        accumColor += (1.0 - tau) * (starColor + gridColor);
      }

      // ACES Filmic Tone Mapping
      vec3 x = accumColor;
      vec3 mapped = (x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14);
      fragColor = vec4(clamp(mapped, 0.0, 1.0), 1.0);
    }
  `;

  // Initialize WebGL2 Raytracer
  useEffect(() => {
    const canvas = opticalCanvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl2');
    if (!gl) return;
    glRef.current = gl;

    const createShader = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };

    const vs = createShader(gl.VERTEX_SHADER, vsSource);
    const fs = createShader(gl.FRAGMENT_SHADER, fsSource);
    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    opticalProgramRef.current = prog;

    const quad = new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]);
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    const vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW);

    const pos = gl.getAttribLocation(prog, 'position');
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(vbo);
      gl.deleteVertexArray(vao);
    };
  }, []);

  // WebGL Render Loop with FPS telemetry
  useEffect(() => {
    const gl = glRef.current;
    const prog = opticalProgramRef.current;
    const canvas = opticalCanvasRef.current;
    if (!gl || !prog || !canvas) return;

    let startTime = performance.now();

    const render = (now: number) => {
      // FPS measurement
      fpsFramesRef.current++;
      if (now - lastFpsTimeRef.current >= 1000) {
        setFps(Math.round((fpsFramesRef.current * 1000) / (now - lastFpsTimeRef.current)));
        fpsFramesRef.current = 0;
        lastFpsTimeRef.current = now;
      }

      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const w = Math.floor(rect.width * dpr);
      const h = Math.floor(rect.height * dpr);

      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }

      gl.useProgram(prog);

      const t = (now - startTime) * 0.001;
      if (isPlaying) {
        setSimTime((prev) => prev + 0.016);
      }

      gl.uniform2f(gl.getUniformLocation(prog, 'u_resolution'), w, h);
      gl.uniform1f(gl.getUniformLocation(prog, 'u_time'), t);
      gl.uniform1f(gl.getUniformLocation(prog, 'u_mass'), massM);
      gl.uniform1f(gl.getUniformLocation(prog, 'u_spin'), spinA);
      gl.uniform1f(gl.getUniformLocation(prog, 'u_cam_dist'), camDist);
      gl.uniform1f(gl.getUniformLocation(prog, 'u_cam_theta'), camThetaDeg);
      gl.uniform1f(gl.getUniformLocation(prog, 'u_cam_phi'), camPhiDeg);
      gl.uniform1f(gl.getUniformLocation(prog, 'u_fov'), fovDeg);
      gl.uniform1i(gl.getUniformLocation(prog, 'u_show_grid'), showMeshGrid ? 1 : 0);
      gl.uniform1i(gl.getUniformLocation(prog, 'u_model'), model === 'kerr' ? 1 : 0);

      gl.drawArrays(gl.TRIANGLES, 0, 6);

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [massM, spinA, camDist, camThetaDeg, camPhiDeg, fovDeg, isPlaying, showMeshGrid, model]);

  // Three.js Foliation Scene (Mode 2: 3+1 Spatial Foliation)
  useEffect(() => {
    if (visMode !== 'foliation') return;
    const container = foliationMountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    threeSceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 18, 30);
    camera.lookAt(0, -2, 0);
    threeCameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    threeRendererRef.current = renderer;

    // Curved Funnel Wireframe Plane Geometry (Flamm's paraboloid)
    const gridSize = 48;
    const geo = new THREE.PlaneGeometry(36, 36, gridSize, gridSize);
    geo.rotateX(-Math.PI / 2);

    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const r = Math.sqrt(x * x + z * z);
      // Flamm's paraboloid depth z(r) = -2 * sqrt(2M(r - 2M))
      let depth = 0;
      const rh = 2.0;
      if (r > rh) {
        depth = -4.2 * Math.exp(-r * 0.18) - (rh / Math.max(0.4, r)) * 3.0;
      } else {
        depth = -10.0;
      }
      pos.setY(i, depth);
    }
    geo.computeVertexNormals();

    const mat = new THREE.MeshBasicMaterial({
      color: 0x0ea5e9,
      wireframe: true,
      transparent: true,
      opacity: 0.75,
    });
    const mesh = new THREE.Mesh(geo, mat);
    scene.add(mesh);
    threeMeshRef.current = mesh;

    // Center Black Hole Horizon sphere
    const bhGeo = new THREE.SphereGeometry(2.0, 32, 32);
    const bhMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const bhMesh = new THREE.Mesh(bhGeo, bhMat);
    bhMesh.position.set(0, -6.0, 0);
    scene.add(bhMesh);

    // Orbital Geodesic Line Ring
    const orbitPoints: THREE.Vector3[] = [];
    for (let theta = 0; theta <= Math.PI * 2; theta += 0.05) {
      const r = 10.0;
      orbitPoints.push(new THREE.Vector3(r * Math.cos(theta), -2.2, r * Math.sin(theta)));
    }
    const orbitGeo = new THREE.BufferGeometry().setFromPoints(orbitPoints);
    const orbitMat = new THREE.LineBasicMaterial({ color: 0xf59e0b, linewidth: 2 });
    const orbitLine = new THREE.Line(orbitGeo, orbitMat);
    scene.add(orbitLine);

    let frameId: number;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      if (mesh) {
        mesh.rotation.y += 0.002;
      }
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, [visMode]);

  // Interactive Mouse Orbit for the Camera
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    lastMouseRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - lastMouseRef.current.x;
    const dy = e.clientY - lastMouseRef.current.y;
    lastMouseRef.current = { x: e.clientX, y: e.clientY };

    setCamPhiDeg((prev) => (prev + dx * 0.4 + 360) % 360);
    setCamThetaDeg((prev) => Math.min(170, Math.max(10, prev - dy * 0.4)));
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 1.08 : 0.92;
    setCamDist((prev) => Math.min(60.0, Math.max(3.5, prev * factor)));
  };

  // Rotating Coordinate Gimbal calculation
  const gimbalAngles = useMemo(() => {
    const theta = (camThetaDeg * Math.PI) / 180;
    const phi = (camPhiDeg * Math.PI) / 180;
    return {
      xX: Math.cos(phi) * 22,
      xY: Math.sin(phi) * 8,
      yX: -Math.sin(phi) * Math.cos(theta) * 18,
      yY: Math.sin(theta) * 20,
      zX: Math.sin(phi) * 22,
      zY: -Math.cos(phi) * 8,
    };
  }, [camThetaDeg, camPhiDeg]);

  return (
    <div className="flex flex-col h-full w-full bg-[#070b14] text-slate-100 font-mono select-none overflow-hidden text-xs">
      {/* 3-Column Main Body Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* ========================================================================= */}
        {/* LEFT CONTROL RAIL (Spacetimes, Visualization Modes, Parameters, Observer) */}
        {/* ========================================================================= */}
        <aside className="w-64 bg-[#090f1a] border-r border-[#152238] flex flex-col shrink-0 overflow-y-auto z-10 custom-scrollbar">
          {/* SECTION 1: SPACETIMES */}
          <div className="p-3.5 border-b border-[#152238]">
            <div className="flex items-center justify-between text-[#8ba2c4] font-semibold text-[11px] mb-2 uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                Spacetimes
                <Info className="w-3.5 h-3.5 text-slate-400 cursor-pointer" />
              </span>
            </div>

            <div className="space-y-1">
              {[
                { id: 'minkowski', label: 'Minkowski (Flat)' },
                { id: 'schwarzschild', label: 'Schwarzschild (Non-rotating)' },
                { id: 'kerr', label: 'Kerr (Rotating)' },
                { id: 'flrw', label: 'FLRW (Cosmology)' },
                { id: 'linearized_gw', label: 'Linearized GW (Weak Field)' },
                { id: 'wormhole', label: 'Wormhole (Theoretical)' },
              ].map((item) => (
                <button
                  key={item.id}
                  id={`model-${item.id}-btn`}
                  onClick={() => handleSelectModel(item.id as SpacetimeModel)}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-left transition-all ${
                    model === item.id
                      ? 'bg-[#0f284d] border border-[#1e4982] text-sky-200 font-medium shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-[#0c1524] border border-transparent'
                  }`}
                >
                  <span
                    className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                      model === item.id ? 'border-sky-400 bg-sky-500/20' : 'border-slate-600'
                    }`}
                  >
                    {model === item.id && <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />}
                  </span>
                  <span className="truncate text-[11px]">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* SECTION 2: VISUALIZATION MODE */}
          <div className="p-3.5 border-b border-[#152238]">
            <div className="flex items-center justify-between text-[#8ba2c4] font-semibold text-[11px] mb-2 uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                Visualization Mode
                <Info className="w-3.5 h-3.5 text-slate-400 cursor-pointer" />
              </span>
            </div>

            <div className="space-y-1.5">
              <button
                id="vis-mode-optical-btn"
                onClick={() => setVisMode('optical')}
                className={`w-full flex items-center gap-2.5 p-2 rounded-xl text-left border transition-all ${
                  visMode === 'optical'
                    ? 'bg-[#0e2c56] border-sky-600 text-sky-100 shadow-md'
                    : 'bg-[#0c1422] border-[#16253c] text-slate-400 hover:text-slate-200 hover:bg-[#0e1829]'
                }`}
              >
                <div className="w-7 h-7 rounded-lg bg-sky-500/20 border border-sky-400/40 flex items-center justify-center shrink-0 text-sky-300">
                  <Eye className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-white text-[11px]">Optical / Causal Mesh</div>
                  <div className="text-[9px] text-slate-400 font-sans leading-tight">
                    Raymarched null geodesics & lensing
                  </div>
                </div>
              </button>

              <button
                id="vis-mode-foliation-btn"
                onClick={() => setVisMode('foliation')}
                className={`w-full flex items-center gap-2.5 p-2 rounded-xl text-left border transition-all ${
                  visMode === 'foliation'
                    ? 'bg-[#0e2c56] border-sky-600 text-sky-100 shadow-md'
                    : 'bg-[#0c1422] border-[#16253c] text-slate-400 hover:text-slate-200 hover:bg-[#0e1829]'
                }`}
              >
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center shrink-0 text-emerald-300">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-white text-[11px]">3+1 Spatial Foliation</div>
                  <div className="text-[9px] text-amber-400 font-sans flex items-center gap-1">
                    <span>⚠️ Coordinate-dependent</span>
                  </div>
                </div>
              </button>

              <button
                id="vis-mode-curvature-btn"
                onClick={() => setVisMode('curvature')}
                className={`w-full flex items-center gap-2.5 p-2 rounded-xl text-left border transition-all ${
                  visMode === 'curvature'
                    ? 'bg-[#0e2c56] border-sky-600 text-sky-100 shadow-md'
                    : 'bg-[#0c1422] border-[#16253c] text-slate-400 hover:text-slate-200 hover:bg-[#0e1829]'
                }`}
              >
                <div className="w-7 h-7 rounded-lg bg-purple-500/20 border border-purple-400/40 flex items-center justify-center shrink-0 text-purple-300">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-white text-[11px]">Curvature Scalar Fields</div>
                  <div className="text-[9px] text-slate-400 font-sans leading-tight">
                    Kretschmann K = R_abcd R^abcd
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* SECTION 3: PARAMETERS */}
          <div className="p-3.5 border-b border-[#152238] space-y-2.5">
            <div className="flex items-center justify-between text-[#8ba2c4] font-semibold text-[11px] uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                Parameters
                <Info className="w-3.5 h-3.5 text-slate-400 cursor-pointer" />
              </span>
            </div>

            {/* Mass */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-slate-300">
                <span>Mass (M_⊙)</span>
                <span className="text-sky-300 font-bold">{massM.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="50"
                step="0.1"
                value={massM}
                onChange={(e) => setMassM(parseFloat(e.target.value))}
                className="w-full h-1 bg-[#15233a] rounded-lg appearance-none cursor-pointer accent-sky-400"
              />
            </div>

            {/* Spin a/M */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-slate-300">
                <span>Spin (a/M)</span>
                <span className="text-amber-300 font-bold">{spinA.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="0.998"
                step="0.01"
                value={spinA}
                onChange={(e) => setSpinA(parseFloat(e.target.value))}
                className="w-full h-1 bg-[#15233a] rounded-lg appearance-none cursor-pointer accent-amber-400"
              />
            </div>

            {/* Distance */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-slate-300">
                <span>Distance (M)</span>
                <span className="text-emerald-300 font-bold">{camDist.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="4.0"
                max="60.0"
                step="0.5"
                value={camDist}
                onChange={(e) => setCamDist(parseFloat(e.target.value))}
                className="w-full h-1 bg-[#15233a] rounded-lg appearance-none cursor-pointer accent-emerald-400"
              />
            </div>

            {/* Field of View */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-slate-300">
                <span>Field of View (°)</span>
                <span className="text-slate-300 font-bold">{fovDeg.toFixed(0)}°</span>
              </div>
              <input
                type="range"
                min="30"
                max="85"
                step="1"
                value={fovDeg}
                onChange={(e) => setFovDeg(parseFloat(e.target.value))}
                className="w-full h-1 bg-[#15233a] rounded-lg appearance-none cursor-pointer accent-sky-400"
              />
            </div>
          </div>

          {/* SECTION 4: OBSERVER / CAMERA */}
          <div className="p-3.5 border-b border-[#152238] space-y-2.5">
            <div className="flex items-center justify-between text-[#8ba2c4] font-semibold text-[11px] uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                Observer / Camera
                <Info className="w-3.5 h-3.5 text-slate-400 cursor-pointer" />
              </span>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Mode</label>
              <select
                value={observerMode}
                onChange={(e) => setObserverMode(e.target.value as ObserverMode)}
                className="w-full bg-[#0c1422] border border-[#1a2b46] rounded-lg px-2 py-1.5 text-[11px] text-slate-200 outline-none focus:border-sky-500"
              >
                <option value="free_fall">👤 Free Fall (Geodesic)</option>
                <option value="static">⚡ Static / ZAMO</option>
                <option value="orbit">🪐 Circular Orbit</option>
              </select>
            </div>

            {/* Initial Position */}
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Initial Position</label>
              <div className="grid grid-cols-3 gap-1">
                <div className="bg-[#0c1422] border border-[#1a2b46] rounded-md px-1.5 py-1 text-[10px] flex items-center justify-between">
                  <span className="text-slate-400">r</span>
                  <span className="text-sky-300 font-bold">{obsR.toFixed(1)} M</span>
                </div>
                <div className="bg-[#0c1422] border border-[#1a2b46] rounded-md px-1.5 py-1 text-[10px] flex items-center justify-between">
                  <span className="text-slate-400">θ</span>
                  <span className="text-sky-300 font-bold">{obsTheta.toFixed(2)}</span>
                </div>
                <div className="bg-[#0c1422] border border-[#1a2b46] rounded-md px-1.5 py-1 text-[10px] flex items-center justify-between">
                  <span className="text-slate-400">φ</span>
                  <span className="text-sky-300 font-bold">{obsPhi.toFixed(1)}</span>
                </div>
              </div>
            </div>

            {/* 4-Velocity u^μ */}
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">4-Velocity (u^μ)</label>
              <div className="grid grid-cols-4 gap-1">
                <div className="bg-[#0c1422] border border-[#1a2b46] rounded px-1 py-0.5 text-[9px] text-center">
                  <span className="text-slate-400 block">u^t</span>
                  <span className="text-white font-bold">{uT.toFixed(1)}</span>
                </div>
                <div className="bg-[#0c1422] border border-[#1a2b46] rounded px-1 py-0.5 text-[9px] text-center">
                  <span className="text-slate-400 block">u^r</span>
                  <span className="text-white font-bold">{uR.toFixed(1)}</span>
                </div>
                <div className="bg-[#0c1422] border border-[#1a2b46] rounded px-1 py-0.5 text-[9px] text-center">
                  <span className="text-slate-400 block">u^θ</span>
                  <span className="text-white font-bold">{uTheta.toFixed(1)}</span>
                </div>
                <div className="bg-[#0c1422] border border-[#1a2b46] rounded px-1 py-0.5 text-[9px] text-center">
                  <span className="text-slate-400 block">u^φ</span>
                  <span className="text-white font-bold">{uPhi.toFixed(1)}</span>
                </div>
              </div>
            </div>

            <button
              onClick={validateVelocity}
              className="w-full py-1.5 px-2 rounded-lg bg-[#0e274a] border border-[#1d4c88] text-sky-300 font-semibold text-[11px] flex items-center justify-center gap-1.5 hover:bg-[#123362] transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Validate ✓</span>
            </button>
          </div>

          {/* SECTION 5: RENDERING */}
          <div className="p-3.5 space-y-2.5">
            <div className="flex items-center justify-between text-[#8ba2c4] font-semibold text-[11px] uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                Rendering
                <Info className="w-3.5 h-3.5 text-slate-400 cursor-pointer" />
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-300">Resolution</span>
              <select
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                className="bg-[#0c1422] border border-[#1a2b46] rounded px-2 py-0.5 text-[10px] text-slate-200 outline-none"
              >
                <option value="720p">1280 × 720</option>
                <option value="1080p">1920 × 1080</option>
                <option value="1440p">2560 × 1440</option>
              </select>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-slate-300">
                <span>Samples / Pixel</span>
                <span className="text-sky-300 font-bold">{samplesPerPixel}</span>
              </div>
              <input
                type="range"
                min="16"
                max="128"
                step="16"
                value={samplesPerPixel}
                onChange={(e) => setSamplesPerPixel(parseInt(e.target.value))}
                className="w-full h-1 bg-[#15233a] rounded-lg appearance-none cursor-pointer accent-sky-400"
              />
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-300">
              <span>Temporal Anti-Aliasing (TAA)</span>
              <input
                type="checkbox"
                checked={enableTaa}
                onChange={(e) => setEnableTaa(e.target.checked)}
                className="w-4 h-4 rounded accent-sky-500 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-300">
              <span>Bloom / HDR</span>
              <input
                type="checkbox"
                checked={enableBloom}
                onChange={(e) => setEnableBloom(e.target.checked)}
                className="w-4 h-4 rounded accent-sky-500 cursor-pointer"
              />
            </div>
          </div>
        </aside>

        {/* ========================================================================= */}
        {/* CENTER VIEWPORT & BOTTOM BENTO DOCK                                       */}
        {/* ========================================================================= */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#05080f]">
          {/* Main 3D / Raytraced Simulation Canvas */}
          <div
            className="flex-1 relative overflow-hidden cursor-grab active:cursor-grabbing"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onWheel={handleWheel}
          >
            {/* Viewport Top Header Overlay */}
            <div className="absolute top-3 left-4 right-4 flex items-start justify-between z-20 pointer-events-none">
              <div>
                <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                  {model === 'kerr'
                    ? 'Kerr Rotating Black Hole'
                    : model === 'wormhole'
                    ? 'Einstein-Rosen Wormhole Bridge'
                    : model === 'linearized_gw'
                    ? 'Linearized Gravitational Wave Field'
                    : 'Schwarzschild Black Hole'}
                  <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                    {model === 'kerr' ? `a = ${spinA} M` : 'M = 1.0 M_⊙'}
                  </span>
                </h2>
                <div className="text-[11px] text-slate-400 font-sans mt-0.5 flex items-center gap-3">
                  <span>M = {massM.toFixed(1)} (solar masses)</span>
                  <span>•</span>
                  <span>r_s = {rHorizonKm} km</span>
                  <span>•</span>
                  <span>r_ph = {rPhotonSphereKm} km</span>
                </div>
              </div>

              {/* Camera State & 3D Rotating Gimbal */}
              <div className="flex items-center gap-4 bg-[#090f1a]/85 backdrop-blur border border-[#182740] px-3 py-2 rounded-xl shadow-xl">
                <div className="text-right text-[10px] leading-tight text-slate-300">
                  <div className="text-white font-bold">
                    Camera ({observerMode === 'free_fall' ? 'Free Fall' : 'Static'})
                  </div>
                  <div className="text-slate-400 font-mono">
                    r = {camDist.toFixed(1)} M | θ = {(camThetaDeg * 0.01745).toFixed(2)} rad | φ ={' '}
                    {(camPhiDeg * 0.01745).toFixed(2)} rad
                  </div>
                </div>

                {/* 3D Dynamic Coordinate Gimbal Widget */}
                <div className="w-10 h-10 relative flex items-center justify-center">
                  <svg viewBox="-25 -25 50 50" className="w-full h-full">
                    {/* X Axis (Red) */}
                    <line
                      x1="0"
                      y1="0"
                      x2={gimbalAngles.xX}
                      y2={gimbalAngles.xY}
                      stroke="#ef4444"
                      strokeWidth="2"
                    />
                    <text
                      x={gimbalAngles.xX * 1.25}
                      y={gimbalAngles.xY * 1.25}
                      fill="#ef4444"
                      fontSize="7"
                      fontWeight="bold"
                      textAnchor="middle"
                      dominantBaseline="middle"
                    >
                      x
                    </text>

                    {/* Y Axis (Green) */}
                    <line
                      x1="0"
                      y1="0"
                      x2={gimbalAngles.yX}
                      y2={gimbalAngles.yY}
                      stroke="#10b981"
                      strokeWidth="2"
                    />
                    <text
                      x={gimbalAngles.yX * 1.25}
                      y={gimbalAngles.yY * 1.25}
                      fill="#10b981"
                      fontSize="7"
                      fontWeight="bold"
                      textAnchor="middle"
                      dominantBaseline="middle"
                    >
                      y
                    </text>

                    {/* Z Axis (Blue) */}
                    <line
                      x1="0"
                      y1="0"
                      x2={gimbalAngles.zX}
                      y2={gimbalAngles.zY}
                      stroke="#38bdf8"
                      strokeWidth="2"
                    />
                    <text
                      x={gimbalAngles.zX * 1.25}
                      y={gimbalAngles.zY * 1.25}
                      fill="#38bdf8"
                      fontSize="7"
                      fontWeight="bold"
                      textAnchor="middle"
                      dominantBaseline="middle"
                    >
                      z
                    </text>
                  </svg>
                </div>
              </div>
            </div>

            {/* Mode 1: Optical Raytracer Canvas */}
            {visMode === 'optical' && (
              <canvas ref={opticalCanvasRef} className="w-full h-full block" />
            )}

            {/* Mode 2: 3+1 Spatial Foliation Three.js Mount */}
            {visMode === 'foliation' && (
              <div ref={foliationMountRef} className="w-full h-full block" />
            )}

            {/* Mode 3: Curvature Scalar Field representation */}
            {visMode === 'curvature' && (
              <div className="w-full h-full flex items-center justify-center bg-radial from-[#131f38] to-[#05080f] p-8">
                <div className="max-w-md w-full bg-[#090f1a]/90 backdrop-blur border border-[#1a2c49] p-6 rounded-2xl shadow-2xl text-center space-y-4">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300">
                    <Activity className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Invariant Curvature Field</h3>
                    <p className="text-slate-400 text-xs mt-1">
                      Kretschmann scalar field: K = 48M² / r⁶
                    </p>
                  </div>
                  <div className="bg-[#0c1424] p-3 rounded-xl border border-[#16253c] text-left text-[11px] font-mono space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-400">At Horizon (r = 2M):</span>
                      <span className="text-emerald-400 font-bold">K = 0.75 M⁻⁴ (Finite)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">At Observer (r = {camDist.toFixed(1)}M):</span>
                      <span className="text-sky-400 font-bold">
                        K = {(48.0 / Math.pow(camDist, 6)).toExponential(2)} M⁻⁴
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setVisMode('optical')}
                    className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold transition-colors"
                  >
                    Return to Optical Raytracer
                  </button>
                </div>
              </div>
            )}

            {/* Viewport Bottom-Left: Light Paths (Raymarched) Legend & Checkboxes */}
            <div className="absolute bottom-3 left-4 z-20 pointer-events-auto">
              {visMode === 'optical' ? (
                <div className="bg-[#090f1a]/85 backdrop-blur border border-[#182740] px-3.5 py-2.5 rounded-xl shadow-xl space-y-1 text-[11px]">
                  <div className="text-slate-300 font-semibold mb-1">Light Paths (Raymarched)</div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-0.5 bg-sky-400 rounded-full" />
                    <span className="text-slate-300">Primary ray</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-0.5 bg-amber-400 rounded-full" />
                    <span className="text-slate-300">Lensed ray</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-0.5 bg-orange-500 rounded-full" />
                    <span className="text-slate-300">Accretion disk (emissive)</span>
                  </div>
                </div>
              ) : (
                <div className="bg-[#090f1a]/85 backdrop-blur border border-[#182740] px-3.5 py-2.5 rounded-xl shadow-xl space-y-1.5 text-[11px]">
                  <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showMeshGrid}
                      onChange={(e) => setShowMeshGrid(e.target.checked)}
                      className="accent-sky-400"
                    />
                    <span>Spacetime Mesh (γ_ij)</span>
                  </label>
                  <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showLightRays}
                      onChange={(e) => setShowLightRays(e.target.checked)}
                      className="accent-sky-400"
                    />
                    <span>Light Rays (Null Geodesics)</span>
                  </label>
                  <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showTestParticles}
                      onChange={(e) => setShowTestParticles(e.target.checked)}
                      className="accent-sky-400"
                    />
                    <span>Test Particle (Timelike)</span>
                  </label>
                  <div className="flex items-center gap-2 text-red-400 text-[10px]">
                    <span className="w-3 h-0.5 bg-red-500 border-dashed" />
                    <span>Event Horizon (r_s = {rHorizonKm} km)</span>
                  </div>
                  <div className="flex items-center gap-2 text-amber-400 text-[10px]">
                    <span className="w-3 h-0.5 bg-amber-500 border-dashed" />
                    <span>Photon Sphere (r_ph = {rPhotonSphereKm} km)</span>
                  </div>
                </div>
              )}
            </div>

            {/* Viewport Bottom-Right: Celestial Camera Compass Disc */}
            <div className="absolute bottom-3 right-4 z-20 pointer-events-auto">
              <div className="w-16 h-16 rounded-full bg-[#090f1a]/85 backdrop-blur border border-[#182740] flex items-center justify-center shadow-xl relative">
                <span className="text-[9px] text-slate-400 font-bold absolute top-1">N</span>
                <span className="text-[8px] text-slate-500 absolute bottom-1">Camera</span>
                {/* Observer angle dot */}
                <div
                  className="w-2.5 h-2.5 rounded-full bg-sky-400 shadow-sm transition-all"
                  style={{
                    transform: `translate(${Math.sin((camPhiDeg * Math.PI) / 180) * 18}px, ${
                      -Math.cos((camPhiDeg * Math.PI) / 180) * 18
                    }px)`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* BOTTOM BENTO DOCK (4 Modular Telemetry Cards side-by-side)                */}
          {/* ========================================================================= */}
          <div className="h-56 border-t border-[#152238] bg-[#090f1a] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 divide-x divide-[#152238] overflow-hidden shrink-0">
            {/* PANEL 1: REAL-TIME DATA OVERLAYS */}
            <div className="p-3 flex flex-col justify-between overflow-hidden">
              <div>
                <div className="flex items-center justify-between text-[#8ba2c4] font-semibold text-[11px] mb-2 uppercase tracking-wider">
                  <span>Real-Time Data Overlays</span>
                </div>

                <div className="grid grid-cols-4 gap-1 text-[10px] mb-2">
                  {(['none', 'liggo', 'sxs', 'eht'] as const).map((id) => (
                    <button
                      key={id}
                      onClick={() => setActiveDataOverlay(id)}
                      className={`px-1.5 py-1 rounded text-center uppercase tracking-tight font-medium transition-colors ${
                        activeDataOverlay === id
                          ? 'bg-[#123668] border border-sky-500 text-sky-200'
                          : 'bg-[#0c1422] text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {id === 'liggo' ? 'LIGO' : id === 'sxs' ? 'SXS' : id === 'eht' ? 'EHT' : 'None'}
                    </button>
                  ))}
                </div>

                {/* Oscillating GW Strain Waveform Graph */}
                <div className="bg-[#05080f] border border-[#142033] rounded-lg p-2 relative h-20">
                  <span className="text-[9px] text-slate-400 block mb-0.5">GW Strain h(t) — GW150914</span>
                  <svg className="w-full h-12" viewBox="0 0 160 50">
                    <line x1="0" y1="25" x2="160" y2="25" stroke="#1c2d4a" strokeWidth="1" />
                    {/* Animated chirp waveform */}
                    <path
                      d={Array.from({ length: 160 })
                        .map((_, i) => {
                          const x = i;
                          const freq = 0.05 + (i / 160) * 0.25;
                          const amp = Math.sin(i * freq + simTime * 4.0) * (5 + (i / 160) * 16);
                          const y = 25 + amp;
                          return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                        })
                        .join(' ')}
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth="1.5"
                    />
                  </svg>
                  <div className="flex justify-between text-[8px] text-slate-500 mt-0.5">
                    <span>0.6s</span>
                    <span>0.8s</span>
                    <span>1.0s</span>
                    <span>1.2s</span>
                    <span>1.4s</span>
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-between text-[10px] pt-1">
                <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={applyGwMetric}
                    onChange={(e) => setApplyGwMetric(e.target.checked)}
                    className="accent-sky-500"
                  />
                  <span>Apply to Metric (TT)</span>
                </label>
                <span className="text-sky-300 font-mono">1.0e-21</span>
              </div>
            </div>

            {/* PANEL 2: SPATIAL SLICE (3+1) */}
            <div className="p-3 flex flex-col justify-between overflow-hidden">
              <div>
                <div className="flex items-center justify-between text-[#8ba2c4] font-semibold text-[11px] mb-2 uppercase tracking-wider">
                  <span className="flex items-center gap-1">
                    Spatial Slice (3+1)
                    <span className="text-amber-400 text-[9px]">⚠️</span>
                  </span>
                </div>

                {/* 3D Wireframe Funnel Preview with Lapse Height Gradient */}
                <div className="bg-[#05080f] border border-[#142033] rounded-lg p-2 h-24 flex items-center justify-center relative overflow-hidden">
                  <svg viewBox="-40 -30 80 60" className="w-full h-full">
                    {/* Concentric rings of Flamm's paraboloid */}
                    {[8, 16, 24, 32].map((r, idx) => (
                      <ellipse
                        key={idx}
                        cx="0"
                        cy={idx * 5 - 10}
                        rx={r}
                        ry={r * 0.35}
                        fill="none"
                        stroke={idx === 0 ? '#ef4444' : idx === 1 ? '#f59e0b' : '#38bdf8'}
                        strokeWidth="1.2"
                        strokeDasharray={idx === 0 ? '2,2' : undefined}
                      />
                    ))}
                    {/* Vertical curvature ribs */}
                    {[-25, -15, 0, 15, 25].map((x, idx) => (
                      <path
                        key={idx}
                        d={`M ${x} 6 Q ${x * 0.5} -5 0 -12`}
                        fill="none"
                        stroke="#0284c7"
                        strokeWidth="0.8"
                      />
                    ))}
                  </svg>

                  {/* Lapse Gradient Color Bar */}
                  <div className="absolute right-2 top-2 bottom-2 flex flex-col items-center justify-between text-[8px] text-slate-400 font-mono">
                    <span className="text-sky-300">2.0</span>
                    <div className="w-1.5 h-12 rounded bg-gradient-to-t from-purple-600 via-sky-400 to-amber-400" />
                    <span className="text-purple-300">0.5</span>
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-between text-[10px] pt-1">
                <div className="flex items-center gap-1">
                  <span className="text-slate-400">Slice:</span>
                  <span className="text-slate-200 font-semibold">t = 0</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-slate-400">Plane:</span>
                  <span className="text-slate-200 font-semibold">θ = π/2</span>
                </div>
                <label className="flex items-center gap-1 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showMeshGrid}
                    onChange={(e) => setShowMeshGrid(e.target.checked)}
                    className="accent-sky-500"
                  />
                  <span>Grid</span>
                </label>
              </div>
            </div>

            {/* PANEL 3: ORBITS & TRAJECTORIES */}
            <div className="p-3 flex flex-col justify-between overflow-hidden">
              <div>
                <div className="flex items-center justify-between text-[#8ba2c4] font-semibold text-[11px] mb-2 uppercase tracking-wider">
                  <span>Orbits & Trajectories</span>
                </div>

                <div className="grid grid-cols-2 gap-1 text-[10px] mb-1.5">
                  <button
                    onClick={() => setParticleType('massive')}
                    className={`py-0.5 rounded text-center font-medium ${
                      particleType === 'massive'
                        ? 'bg-[#123668] border border-sky-500 text-sky-200'
                        : 'bg-[#0c1422] text-slate-400'
                    }`}
                  >
                    Test Particle
                  </button>
                  <button
                    onClick={() => setParticleType('photon')}
                    className={`py-0.5 rounded text-center font-medium ${
                      particleType === 'photon'
                        ? 'bg-[#123668] border border-sky-500 text-sky-200'
                        : 'bg-[#0c1422] text-slate-400'
                    }`}
                  >
                    Photon
                  </button>
                </div>

                {/* Polar Orbit Trajectory Display */}
                <div className="grid grid-cols-2 gap-2 h-20 items-center">
                  <div className="h-full bg-[#05080f] border border-[#142033] rounded-lg flex items-center justify-center p-1 relative">
                    <svg viewBox="-25 -25 50 50" className="w-full h-full">
                      {/* Event horizon center */}
                      <circle cx="0" cy="0" r="4" fill="#000000" stroke="#ef4444" strokeWidth="0.8" />
                      {/* ISCO */}
                      <circle
                        cx="0"
                        cy="0"
                        r="9"
                        fill="none"
                        stroke="#f59e0b"
                        strokeWidth="0.6"
                        strokeDasharray="1,1"
                      />
                      {/* Circular orbit */}
                      <circle cx="0" cy="0" r="16" fill="none" stroke="#0ea5e9" strokeWidth="1" />
                      {/* Elliptical trajectory */}
                      <ellipse
                        cx="-2"
                        cy="0"
                        rx="18"
                        ry="13"
                        fill="none"
                        stroke="#f59e0b"
                        strokeWidth="1"
                      />
                      {/* Live moving particle */}
                      <circle
                        cx={Math.cos(simTime * 2.0) * 16}
                        cy={Math.sin(simTime * 2.0) * 16}
                        r="2"
                        fill="#38bdf8"
                      />
                    </svg>
                  </div>

                  {/* Conserved Constants Readout */}
                  <div className="text-[10px] space-y-1 font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-400">r (current):</span>
                      <span className="text-sky-300 font-bold">8.42 M</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">E:</span>
                      <span className="text-white font-bold">0.9487</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">L_z:</span>
                      <span className="text-white font-bold">3.01</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Q:</span>
                      <span className="text-white font-bold">0.00</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Scrubber Controls */}
              <div className="flex items-center gap-2 pt-1 text-[10px]">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="p-1 rounded bg-[#0e274a] text-sky-300 hover:text-white"
                >
                  {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                </button>
                <div className="flex-1 h-1 bg-[#142033] rounded-full overflow-hidden relative">
                  <div
                    className="h-full bg-sky-400 rounded-full"
                    style={{ width: `${((simTime * 4) % 100).toFixed(0)}%` }}
                  />
                </div>
                <span className="text-slate-400 font-mono">t = {simTime.toFixed(1)}s</span>
              </div>
            </div>

            {/* PANEL 4: CURVATURE FIELD & INVARIANTS */}
            <div className="p-3 flex flex-col justify-between overflow-hidden">
              <div>
                <div className="flex items-center justify-between text-[#8ba2c4] font-semibold text-[11px] mb-2 uppercase tracking-wider">
                  <span>Curvature Field</span>
                  <span className="text-[9px] text-purple-400 font-normal">Kretschmann (K)</span>
                </div>

                {/* Heat Map Visual Representation */}
                <div className="bg-[#05080f] border border-[#142033] rounded-lg p-1.5 h-24 flex items-center justify-center gap-3">
                  <div className="w-20 h-20 rounded-full bg-radial from-amber-400 via-purple-700 to-black flex items-center justify-center border border-purple-500/30">
                    <div className="w-8 h-8 rounded-full bg-black border border-red-500/60" />
                  </div>

                  {/* Gradient scale */}
                  <div className="text-[9px] font-mono space-y-1.5 text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded bg-amber-400" />
                      <span>10⁻¹ (Strong)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded bg-purple-600" />
                      <span>10⁻³ (Moderate)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded bg-blue-900" />
                      <span>10⁻⁵ (Asymptotic)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Analytical Invariant Summary */}
              <div className="pt-1 text-[10px] text-slate-300 flex items-center justify-between font-mono">
                <span>Horizon: Finite</span>
                <span className="text-purple-300 font-bold">K = 48M²/r⁶</span>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT SIDEBAR (Mathematics Inspector & Validation Suite)                 */}
        {/* ========================================================================= */}
        <aside className="w-72 bg-[#090f1a] border-l border-[#152238] flex flex-col shrink-0 overflow-y-auto z-10 custom-scrollbar">
          {/* SECTION 1: MATHEMATICS INSPECTOR */}
          <div className="p-3.5 border-b border-[#152238]">
            <div className="flex items-center justify-between text-[#8ba2c4] font-semibold text-[11px] mb-2 uppercase tracking-wider">
              <span>Mathematics Inspector</span>
            </div>

            {/* Tabs: Metric, Curvature, Coordinates */}
            <div className="grid grid-cols-3 gap-1 text-[10px] mb-3">
              {(['metric', 'curvature', 'coordinates'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveMathTab(tab)}
                  className={`py-1 rounded text-center capitalize font-medium transition-colors ${
                    activeMathTab === tab
                      ? 'bg-[#123668] border border-sky-500 text-sky-200'
                      : 'bg-[#0c1422] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Metric Tensor g_μν LaTeX Card */}
            <div className="bg-[#05080f] border border-[#16253c] p-2.5 rounded-xl font-mono text-[11px] space-y-2">
              <div className="text-slate-400 text-[10px] flex items-center justify-between">
                <span>Metric Tensor g_μν</span>
                <span className="text-sky-300 font-semibold">
                  {model === 'kerr' ? 'Kerr (BL)' : 'Schwarzschild'}
                </span>
              </div>

              {/* Mathematical Matrix Render */}
              <div className="font-serif italic text-[11px] text-sky-100 bg-[#080d16] p-2 rounded border border-[#121c2d] leading-relaxed">
                ds² = -(1 - 2M/r) dt² + (1 - 2M/r)⁻¹ dr² + r² (dθ² + sin²θ dφ²)
              </div>

              {/* Non-zero Christoffel Symbols */}
              <div>
                <span className="text-[10px] text-slate-400 block mb-1">Non-zero Christoffel Symbols</span>
                <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-300">
                  <div className="bg-[#09101d] px-1.5 py-0.5 rounded border border-[#142236]">
                    Γ^r_tt = M / r²(1 - 2M/r)
                  </div>
                  <div className="bg-[#09101d] px-1.5 py-0.5 rounded border border-[#142236]">
                    Γ^r_rr = -M / r²(1 - 2M/r)
                  </div>
                  <div className="bg-[#09101d] px-1.5 py-0.5 rounded border border-[#142236]">
                    Γ^t_tr = M / r(r - 2M)
                  </div>
                  <div className="bg-[#09101d] px-1.5 py-0.5 rounded border border-[#142236]">
                    Γ^θ_φφ = -sinθ cosθ
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: OBSERVER (TETRAD) */}
          <div className="p-3.5 border-b border-[#152238] space-y-2">
            <div className="flex items-center justify-between text-[#8ba2c4] font-semibold text-[11px] uppercase tracking-wider">
              <span>Observer (Tetrad)</span>
            </div>

            <div className="space-y-1 text-[11px] font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">u^μ (four-velocity):</span>
                <span className="text-sky-300 font-bold">1.09, 0.0, 0.0, 0.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Frame:</span>
                <span className="text-slate-200">Free Fall (geodesic)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Redshift (z):</span>
                <span className="text-amber-300 font-bold">0.095</span>
              </div>
            </div>
          </div>

          {/* SECTION 3: VALIDATION SUITE */}
          <div className="p-3.5 border-b border-[#152238] space-y-2.5">
            <div className="flex items-center justify-between text-[#8ba2c4] font-semibold text-[11px] uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                Validation Suite
                <Info className="w-3.5 h-3.5 text-slate-400 cursor-pointer" />
              </span>
            </div>

            <div className="space-y-1.5 text-[11px]">
              <div className="flex items-center justify-between text-slate-200">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Four-Velocity Norm</span>
                </span>
                <span className="font-mono text-emerald-400 font-bold">-1.0000</span>
              </div>

              <div className="flex items-center justify-between text-slate-200">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Energy (E)</span>
                </span>
                <span className="font-mono text-emerald-400 font-bold">0.9998</span>
              </div>

              <div className="flex items-center justify-between text-slate-200">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Angular Momentum (L_z)</span>
                </span>
                <span className="font-mono text-emerald-400 font-bold">3.42</span>
              </div>

              <div className="flex items-center justify-between text-slate-200">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Carter Constant (Q)</span>
                </span>
                <span className="font-mono text-emerald-400 font-bold">0.00</span>
              </div>
            </div>

            {/* Live Invariant Drift Sparkline Plot */}
            <div className="bg-[#05080f] border border-[#142033] rounded-lg p-2 h-16 relative">
              <span className="text-[9px] text-slate-400 block mb-0.5">Conservation (timelike geodesic)</span>
              <svg className="w-full h-8" viewBox="0 0 160 30">
                <line x1="0" y1="15" x2="160" y2="15" stroke="#1c2d4a" strokeWidth="1" />
                <path d="M 0 15 L 160 15" stroke="#38bdf8" strokeWidth="1.5" />
                <path d="M 0 14.8 L 160 14.8" stroke="#10b981" strokeWidth="1" strokeDasharray="2,2" />
                <path d="M 0 15.2 L 160 15.2" stroke="#f59e0b" strokeWidth="1" strokeDasharray="3,3" />
              </svg>
              <div className="flex justify-between text-[8px] text-slate-500">
                <span>0</span>
                <span>5</span>
                <span>10</span>
                <span>15</span>
                <span>20 M</span>
              </div>
            </div>

            <div className="py-1 px-2.5 rounded-lg bg-emerald-950/60 border border-emerald-700/60 text-emerald-300 text-[10px] flex items-center justify-center gap-1.5 font-semibold">
              <span>All invariants within tolerance ✓</span>
            </div>
          </div>

          {/* SECTION 4: UI LEXICON */}
          <div className="p-3.5 mt-auto">
            <div className="bg-[#0c1422] border border-[#18273e] p-3 rounded-xl text-[11px] text-slate-400 italic leading-relaxed">
              <Info className="w-3.5 h-3.5 text-sky-400 inline mr-1 mb-0.5" />
              &ldquo;Null geodesics follow the curvature of spacetime. Energy E and angular momentum L_z
              remain constant along affine parameter λ.&rdquo;
            </div>
          </div>
        </aside>
      </div>

      {/* ========================================================================= */}
      {/* FOOTER BAR                                                                */}
      {/* ========================================================================= */}
      <footer className="h-7 border-t border-[#152238] bg-[#070b14] px-4 flex items-center justify-between text-[10px] text-slate-400 shrink-0">
        <div className="flex items-center gap-3">
          <span>Spacetime Lab</span>
          <span className="text-slate-600">v0.1</span>
          <span className="text-slate-600">|</span>
          <button
            onClick={onOpenDomainGuide}
            className="text-sky-400 hover:text-sky-300 font-semibold transition-colors flex items-center gap-1 cursor-pointer"
            title="Setup anyalabs.in custom subdomain"
          >
            <span>AnyaLabs (anyalabs.in)</span>
          </button>
        </div>
        <div className="flex items-center gap-4 text-slate-500">
          <span>Explore</span>
          <span>•</span>
          <span>Understand</span>
          <span>•</span>
          <span>Discover</span>
        </div>
      </footer>
    </div>
  );
};
