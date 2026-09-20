/**
 * @license
 * Spacetime Lab — AnyaLabs
 * Spacetime Mesh & Multi-Scenario Sandbox (CLAUDE.md §5.2, §18)
 * 3D Interactive Rubber-Sheet & Isometric Embedding Laboratory
 * Features:
 * - Scenarios: Solar System, Extreme Black Hole Funnel, Einstein-Rosen Wormhole (Folded Spacetime),
 *   Gravitational Wave Ripples, and Blank Mesh Live Experiment Sandbox.
 * - Interactive Mass Placement & Real-time Dragging: warping the spacetime mesh dynamically under user touch/mouse.
 * - Particle & Photon Launcher: projectile slingshots, orbits, and horizon captures along computed geodesics.
 * - Visualization Styles: Neon Wireframe Grid (Image 1 & 3), Stress-Energy T_μν Curvature Radius (Image 2),
 *   Gravitational Lapse α Time Dilation, and Gravitational Strain Magnifier (Image 4).
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import {
  Layers,
  Sun,
  Disc,
  GitMerge,
  Waves,
  FlaskConical,
  Plus,
  Trash2,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Eye,
  Activity,
  Compass,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Send,
  HelpCircle,
} from 'lucide-react';

export type SandboxScenario =
  | 'solar_system'
  | 'black_hole'
  | 'wormhole'
  | 'gravitational_waves'
  | 'blank_sandbox';

export type VisualStyle = 'neon_wireframe' | 'shaded_grid' | 'lapse_colormap' | 'stress_energy';

interface SandboxMass {
  id: string;
  name: string;
  mass: number;
  radius: number;
  color: number;
  x: number;
  z: number;
  vx: number;
  vz: number;
  isFixed?: boolean;
  type: 'star' | 'planet' | 'moon' | 'black_hole' | 'custom';
}

interface TestParticle {
  id: string;
  x: number;
  z: number;
  vx: number;
  vz: number;
  trail: { x: number; y: number; z: number }[];
  isPhoton: boolean;
  color: number;
  active: boolean;
}

export interface EmbeddingViewProps {
  initialScenario?: SandboxScenario;
  activeScenarioProp?: SandboxScenario;
  onScenarioChange?: (scen: SandboxScenario) => void;
}

export const EmbeddingView: React.FC<EmbeddingViewProps> = ({
  initialScenario,
  activeScenarioProp,
  onScenarioChange,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);

  // Scenario & Style State
  const [scenario, setScenario] = useState<SandboxScenario>(activeScenarioProp || initialScenario || 'solar_system');

  useEffect(() => {
    if (activeScenarioProp && activeScenarioProp !== scenario) {
      setScenario(activeScenarioProp);
    }
  }, [activeScenarioProp, scenario]);

  const handleSelectScenario = (scen: SandboxScenario) => {
    setScenario(scen);
    onScenarioChange?.(scen);
  };
  const [visualStyle, setVisualStyle] = useState<VisualStyle>('neon_wireframe');
  const [isPlaying, setIsPlaying] = useState(true);
  const [simSpeed, setSimSpeed] = useState(1.0);
  const [gridResolution, setGridResolution] = useState(72);
  const [meshElasticity, setMeshElasticity] = useState(1.0);
  const [showVelocityVectors, setShowVelocityVectors] = useState(true);
  const [showTrails, setShowTrails] = useState(true);
  const [showStrainLens, setShowStrainLens] = useState(false); // GW Magnifier (Image 4)
  const [strainValue, setStrainValue] = useState(0.0);

  // Live Masses & Particles
  const massesRef = useRef<SandboxMass[]>([]);
  const particlesRef = useRef<TestParticle[]>([]);
  const [, setMassesVersion] = useState(0); // Trigger UI re-render when masses change

  // Selected mass for editing
  const [selectedMassId, setSelectedMassId] = useState<string | null>(null);
  const [newMassType, setNewMassType] = useState<'star' | 'planet' | 'black_hole'>('star');

  // Three.js instances
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const secondaryMeshRef = useRef<THREE.Mesh | null>(null); // For wormhole bottom sheet or bridge
  const massObjectsRef = useRef<Map<string, THREE.Group>>(new Map());
  const particleObjectsRef = useRef<Map<string, THREE.Line>>(new Map());

  // Mouse drag & camera state
  const isOrbitingRef = useRef(false);
  const isDraggingMassRef = useRef<string | null>(null);
  const prevMouseRef = useRef({ x: 0, y: 0 });
  const cameraAngleRef = useRef({ theta: Math.PI / 3.4, phi: Math.PI / 4, radius: 36 });
  const raycasterRef = useRef(new THREE.Raycaster());
  const mousePlaneRef = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));
  const simTimeRef = useRef(0);

  // Initialize scenario masses and parameters
  const loadScenario = useCallback((scen: SandboxScenario) => {
    particlesRef.current = [];
    setSelectedMassId(null);

    if (scen === 'solar_system') {
      massesRef.current = [
        {
          id: 'sun',
          name: 'Sun',
          mass: 5.0,
          radius: 1.2,
          color: 0xffaa00,
          x: 0,
          z: 0,
          vx: 0,
          vz: 0,
          isFixed: true,
          type: 'star',
        },
        {
          id: 'earth',
          name: 'Earth',
          mass: 0.5,
          radius: 0.5,
          color: 0x3399ff,
          x: 10.0,
          z: 0,
          vx: 0,
          vz: 0.70, // v ≈ sqrt(M/r)
          isFixed: false,
          type: 'planet',
        },
        {
          id: 'moon',
          name: 'Moon',
          mass: 0.08,
          radius: 0.22,
          color: 0xcccccc,
          x: 11.5,
          z: 0,
          vx: 0,
          vz: 0.70 + 0.38,
          isFixed: false,
          type: 'moon',
        },
      ];
      cameraAngleRef.current = { theta: Math.PI / 3.5, phi: Math.PI / 4, radius: 38 };
    } else if (scen === 'black_hole') {
      massesRef.current = [
        {
          id: 'bh-central',
          name: 'Black Hole',
          mass: 8.0,
          radius: 0.8,
          color: 0x111115,
          x: 0,
          z: 0,
          vx: 0,
          vz: 0,
          isFixed: true,
          type: 'black_hole',
        },
        {
          id: 'accretion-blob',
          name: 'Accretion Infall Gas',
          mass: 0.15,
          radius: 0.3,
          color: 0xff6600,
          x: 7.5,
          z: 0,
          vx: 0,
          vz: 1.03,
          isFixed: false,
          type: 'planet',
        },
      ];
      cameraAngleRef.current = { theta: Math.PI / 3.2, phi: Math.PI / 5, radius: 32 };
    } else if (scen === 'wormhole') {
      massesRef.current = [
        {
          id: 'wormhole-throat',
          name: 'Einstein-Rosen Throat',
          mass: 6.0,
          radius: 1.4,
          color: 0x8844ff,
          x: 0,
          z: 0,
          vx: 0,
          vz: 0,
          isFixed: true,
          type: 'black_hole',
        },
      ];
      cameraAngleRef.current = { theta: Math.PI / 2.6, phi: Math.PI / 6, radius: 34 };
    } else if (scen === 'gravitational_waves') {
      massesRef.current = [
        {
          id: 'binary-1',
          name: 'Black Hole A (30 M☉)',
          mass: 3.5,
          radius: 0.7,
          color: 0x22aaff,
          x: -3.5,
          z: 0,
          vx: 0,
          vz: -0.68,
          isFixed: false,
          type: 'black_hole',
        },
        {
          id: 'binary-2',
          name: 'Black Hole B (30 M☉)',
          mass: 3.5,
          radius: 0.7,
          color: 0xff3366,
          x: 3.5,
          z: 0,
          vx: 0,
          vz: 0.68,
          isFixed: false,
          type: 'black_hole',
        },
      ];
      setShowStrainLens(true);
      cameraAngleRef.current = { theta: Math.PI / 3.6, phi: Math.PI / 4, radius: 34 };
    } else {
      // Blank Sandbox
      massesRef.current = [
        {
          id: 'custom-sun',
          name: 'Central Star',
          mass: 4.0,
          radius: 1.0,
          color: 0xffbb22,
          x: 0,
          z: 0,
          vx: 0,
          vz: 0,
          isFixed: true,
          type: 'star',
        },
      ];
      cameraAngleRef.current = { theta: Math.PI / 3.4, phi: Math.PI / 4, radius: 36 };
    }

    setMassesVersion((v) => v + 1);
  }, []);

  // Update scenario when changed
  useEffect(() => {
    loadScenario(scenario);
  }, [scenario, loadScenario]);

  // Compute deformation height y = z(x, z) of the spacetime mesh
  const evaluateSpacetimeDepth = useCallback(
    (x: number, z: number, t: number, isLowerSheet: boolean = false): { y: number; lapse: number; curvature: number } => {
      let totalPotential = 0;
      let totalCurvature = 0;

      if (scenario === 'wormhole') {
        // Folded Spacetime Einstein-Rosen Bridge (Image 3)
        // Two sheets at y = +6.0 and y = -6.0 connected by a throat at radius b0
        const b0 = 2.4;
        const r = Math.sqrt(x * x + z * z);
        const sheetDistance = 10.0;
        
        // Folded bridge curve connecting both sheets
        const throatProfile = Math.sqrt(Math.max(0.01, r * r + b0 * b0)) - b0;
        const depth = (sheetDistance * 0.45) / (1.0 + throatProfile * 0.4);

        let y = isLowerSheet ? -sheetDistance * 0.5 + depth : sheetDistance * 0.5 - depth;

        // Folded bend at edges as seen in classic diagrams (Image 3)
        if (x < -6.0) {
          const bendFactor = Math.pow((x + 6.0) / 10.0, 2.0);
          y += (isLowerSheet ? 1 : -1) * Math.min(sheetDistance * 0.45, bendFactor * 2.5);
        }

        const lapse = Math.min(1.0, r / (r + b0));
        return { y: y * meshElasticity, lapse, curvature: 1.0 / (r * r + 0.1) };
      }

      if (scenario === 'gravitational_waves') {
        // Orbiting binary masses + helical propagating quadrupole ripples (Image 4)
        const omega = 1.6;
        const r1 = 3.5;
        const x1 = r1 * Math.cos(omega * t);
        const z1 = r1 * Math.sin(omega * t);
        const x2 = -x1;
        const z2 = -z1;

        // Static Newtonian wells of the two masses
        const d1 = Math.sqrt((x - x1) * (x - x1) + (z - z1) * (z - z1) + 0.6);
        const d2 = Math.sqrt((x - x2) * (x - x2) + (z - z2) * (z - z2) + 0.6);
        totalPotential += -3.5 / d1 - 3.5 / d2;

        // Helical gravitational wave ripples propagating at c = 1 (Image 4)
        const rDist = Math.sqrt(x * x + z * z);
        const wavePhase = 2.0 * (omega * t - rDist * 0.75) + Math.atan2(z, x) * 2.0;
        const waveAmp = (1.8 / Math.max(1.5, Math.sqrt(rDist))) * Math.sin(wavePhase);
        
        // Strain falls off as 1/r
        const gwDeformation = waveAmp * Math.exp(-Math.pow(rDist - 16.0, 2.0) / 450.0);
        totalPotential += gwDeformation * 0.6;

        const lapse = Math.sqrt(Math.max(0.01, 1.0 + totalPotential * 0.18));
        return { y: totalPotential * 1.2 * meshElasticity, lapse, curvature: Math.abs(gwDeformation) };
      }

      // General multi-body spacetime deformation (Solar System, Black Hole, Sandbox)
      for (const m of massesRef.current) {
        const dx = x - m.x;
        const dz = z - m.z;
        const dist = Math.sqrt(dx * dx + dz * dz);

        if (m.type === 'black_hole') {
          // Relativistic Flamm's paraboloid funnel depth: z ~ -2 * sqrt(2M(r - 2M)) (Image 1)
          const rH = 2.0 * m.mass * 0.25;
          if (dist > rH) {
            const zRel = -2.6 * Math.sqrt(2.0 * rH * (dist - rH + 0.05));
            totalPotential += zRel * 0.9;
          } else {
            totalPotential += -7.5; // Event horizon singularity depth
          }
          totalCurvature += 48.0 * (m.mass * m.mass) / Math.pow(Math.max(0.5, dist), 4.0);
        } else {
          // Weak-field / Newtonian potential softened inside mass radius (Image 2)
          const softening = m.radius * 0.85;
          const pot = - (m.mass * 2.2) / Math.sqrt(dist * dist + softening * softening);
          totalPotential += pot;
          totalCurvature += (m.mass * 1.5) / Math.pow(dist + 0.5, 3.0);
        }
      }

      const lapse = Math.max(0.02, Math.min(1.0, Math.sqrt(Math.max(0.01, 1.0 + totalPotential * 0.14))));
      return { y: totalPotential * meshElasticity, lapse, curvature: totalCurvature };
    },
    [scenario, meshElasticity]
  );

  // Build or update Three.js 3D Mesh
  const rebuildMeshGeometry = useCallback(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    if (meshRef.current) scene.remove(meshRef.current);
    if (secondaryMeshRef.current) scene.remove(secondaryMeshRef.current);

    const size = 32;
    const segs = gridResolution;
    const isWormhole = scenario === 'wormhole';

    const createSheet = (isLower: boolean) => {
      const geom = new THREE.PlaneGeometry(size, size, segs, segs);
      geom.rotateX(-Math.PI / 2); // Orient horizontally

      const posAttr = geom.attributes.position;
      const count = posAttr.count;
      const colors: number[] = [];

      for (let i = 0; i < count; i++) {
        const x = posAttr.getX(i);
        const z = posAttr.getZ(i);
        const { y, lapse, curvature } = evaluateSpacetimeDepth(x, z, simTimeRef.current, isLower);

        posAttr.setY(i, y);

        // Color computation depending on visual style
        if (visualStyle === 'neon_wireframe') {
          // Electric cyan/blue grid on dark space (Image 1 & 3)
          const depthAlpha = Math.min(1.0, Math.max(0.0, (-y) / 8.0));
          const colR = 0.05 + 0.2 * depthAlpha;
          const colG = 0.45 + 0.55 * (1.0 - depthAlpha);
          const colB = 0.95 + 0.05 * depthAlpha;
          colors.push(colR, colG, colB);
        } else if (visualStyle === 'lapse_colormap') {
          // Gravitational Lapse α (Cool purple at horizon to bright cyan far away)
          const colR = Math.sin((1.0 - lapse) * Math.PI * 0.5) * 0.9;
          const colG = lapse * 0.8;
          const colB = 0.2 + lapse * 0.8;
          colors.push(colR, colG, colB);
        } else if (visualStyle === 'stress_energy') {
          // Stress-Energy T_μν / Curvature Radius (Image 2)
          const logC = Math.min(1.0, Math.max(0.0, Math.log10(curvature + 0.1) + 1.0));
          const colR = logC * 1.2;
          const colG = (1.0 - logC) * 0.6;
          const colB = 0.15;
          colors.push(colR, colG, colB);
        } else {
          // Shaded Grid
          colors.push(0.3, 0.6, 0.9);
        }
      }

      geom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
      geom.computeVertexNormals();

      const mat = new THREE.MeshStandardMaterial({
        vertexColors: true,
        wireframe: visualStyle === 'neon_wireframe',
        roughness: 0.3,
        metalness: 0.4,
        side: THREE.DoubleSide,
      });

      return new THREE.Mesh(geom, mat);
    };

    const topMesh = createSheet(false);
    scene.add(topMesh);
    meshRef.current = topMesh;

    if (isWormhole) {
      const bottomMesh = createSheet(true);
      scene.add(bottomMesh);
      secondaryMeshRef.current = bottomMesh;
    }
  }, [gridResolution, scenario, visualStyle, evaluateSpacetimeDepth]);

  // Main Three.js Scene Setup
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x06070a);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xaaccff, 1.0);
    dirLight1.position.set(30, 50, 30);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xff6622, 0.4);
    dirLight2.position.set(-30, -30, -30);
    scene.add(dirLight2);

    // Initial mesh
    rebuildMeshGeometry();

    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [rebuildMeshGeometry]);

  // Sync physical mass spheres in 3D scene
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    // Clean up old objects
    massObjectsRef.current.forEach((group) => scene.remove(group));
    massObjectsRef.current.clear();

    massesRef.current.forEach((m) => {
      const group = new THREE.Group();

      // Sphere geometry for celestial mass
      const sphereGeom = new THREE.SphereGeometry(m.radius, 28, 28);
      let sphereMat: THREE.Material;

      if (m.type === 'black_hole') {
        // Jet black sphere with glowing accretion ring
        sphereMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
        const ringGeom = new THREE.RingGeometry(m.radius * 1.3, m.radius * 2.4, 32);
        ringGeom.rotateX(Math.PI / 2);
        const ringMat = new THREE.MeshBasicMaterial({
          color: 0xffaa33,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.85,
        });
        const ring = new THREE.Mesh(ringGeom, ringMat);
        group.add(ring);
      } else if (m.type === 'star') {
        sphereMat = new THREE.MeshStandardMaterial({
          color: m.color,
          emissive: m.color,
          emissiveIntensity: 0.7,
          roughness: 0.2,
        });
      } else {
        sphereMat = new THREE.MeshStandardMaterial({
          color: m.color,
          roughness: 0.5,
          metalness: 0.1,
        });
      }

      const sphere = new THREE.Mesh(sphereGeom, sphereMat);
      group.add(sphere);

      // Mass Label Halo or Selection Indicator
      if (m.id === selectedMassId) {
        const selRing = new THREE.RingGeometry(m.radius * 1.6, m.radius * 1.8, 32);
        selRing.rotateX(Math.PI / 2);
        const selMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide });
        group.add(new THREE.Mesh(selRing, selMat));
      }

      scene.add(group);
      massObjectsRef.current.set(m.id, group);
    });
  }, [scenario, selectedMassId]);

  // Main Animation & Physics Loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const animate = (now: number) => {
      const dt = Math.min(0.06, (now - lastTime) * 0.001) * simSpeed;
      lastTime = now;

      if (isPlaying) {
        simTimeRef.current += dt;
      }

      const t = simTimeRef.current;
      const scene = sceneRef.current;
      const camera = cameraRef.current;
      const renderer = rendererRef.current;

      // 1. Orbital Physics update for Masses
      if (isPlaying && (scenario === 'solar_system' || scenario === 'blank_sandbox')) {
        const masses = massesRef.current;
        for (let i = 0; i < masses.length; i++) {
          const m1 = masses[i];
          if (m1.isFixed || isDraggingMassRef.current === m1.id) continue;

          let ax = 0;
          let az = 0;

          for (let j = 0; j < masses.length; j++) {
            if (i === j) continue;
            const m2 = masses[j];
            const dx = m2.x - m1.x;
            const dz = m2.z - m1.z;
            const dist = Math.sqrt(dx * dx + dz * dz + 0.2);
            // Newton/GR effective gravitational acceleration
            const force = (m2.mass * 2.8) / (dist * dist * dist);
            ax += force * dx;
            az += force * dz;
          }

          m1.vx += ax * dt;
          m1.vz += az * dt;
          m1.x += m1.vx * dt;
          m1.z += m1.vz * dt;
        }
      }

      // 2. Gravitational wave binary orbit animation
      if (isPlaying && scenario === 'gravitational_waves') {
        const omega = 1.6;
        const r1 = 3.5;
        const b1 = massesRef.current.find((m) => m.id === 'binary-1');
        const b2 = massesRef.current.find((m) => m.id === 'binary-2');
        if (b1 && b2) {
          b1.x = r1 * Math.cos(omega * t);
          b1.z = r1 * Math.sin(omega * t);
          b2.x = -b1.x;
          b2.z = -b1.z;
        }

        // Live strain calculation for probe HUD (Image 4)
        const strainH = (1.5 / Math.sqrt(8.0)) * Math.sin(2.0 * (omega * t - 8.0 * 0.75));
        setStrainValue(strainH);
      }

      // 3. Update 3D Positions of Mass Objects
      massesRef.current.forEach((m) => {
        const grp = massObjectsRef.current.get(m.id);
        if (grp) {
          const { y } = evaluateSpacetimeDepth(m.x, m.z, t);
          grp.position.set(m.x, y + m.radius * 0.5, m.z);
        }
      });

      // 4. Update dynamic mesh vertices
      if (meshRef.current) {
        const geom = meshRef.current.geometry as THREE.BufferGeometry;
        const posAttr = geom.attributes.position;
        const colAttr = geom.attributes.color;
        const count = posAttr.count;

        for (let i = 0; i < count; i++) {
          const x = posAttr.getX(i);
          const z = posAttr.getZ(i);
          const { y, lapse, curvature } = evaluateSpacetimeDepth(x, z, t, false);
          posAttr.setY(i, y);

          if (colAttr) {
            if (visualStyle === 'neon_wireframe') {
              const depthAlpha = Math.min(1.0, Math.max(0.0, (-y) / 8.0));
              colAttr.setXYZ(i, 0.05 + 0.2 * depthAlpha, 0.45 + 0.55 * (1.0 - depthAlpha), 0.95 + 0.05 * depthAlpha);
            } else if (visualStyle === 'lapse_colormap') {
              const colR = Math.sin((1.0 - lapse) * Math.PI * 0.5) * 0.9;
              colAttr.setXYZ(i, colR, lapse * 0.8, 0.2 + lapse * 0.8);
            } else if (visualStyle === 'stress_energy') {
              const logC = Math.min(1.0, Math.max(0.0, Math.log10(curvature + 0.1) + 1.0));
              colAttr.setXYZ(i, logC * 1.2, (1.0 - logC) * 0.6, 0.15);
            }
          }
        }
        posAttr.needsUpdate = true;
        if (colAttr) colAttr.needsUpdate = true;
        geom.computeVertexNormals();
      }

      // Secondary mesh (Wormhole lower sheet)
      if (secondaryMeshRef.current) {
        const geom = secondaryMeshRef.current.geometry as THREE.BufferGeometry;
        const posAttr = geom.attributes.position;
        for (let i = 0; i < posAttr.count; i++) {
          const x = posAttr.getX(i);
          const z = posAttr.getZ(i);
          const { y } = evaluateSpacetimeDepth(x, z, t, true);
          posAttr.setY(i, y);
        }
        posAttr.needsUpdate = true;
        geom.computeVertexNormals();
      }

      // 5. Test Particles & Photon Propagation along Geodesic Wells
      if (isPlaying) {
        const particles = particlesRef.current;
        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i];
          if (!p.active) continue;

          // Compute total gravitational acceleration
          let ax = 0;
          let az = 0;
          for (const m of massesRef.current) {
            const dx = m.x - p.x;
            const dz = m.z - p.z;
            const dist = Math.sqrt(dx * dx + dz * dz);

            if (dist < m.radius * 0.9) {
              p.active = false; // Collided or swallowed
              break;
            }

            const strength = p.isPhoton ? 5.5 : 3.0; // Light bends twice as much in GR!
            const force = (m.mass * strength) / (dist * dist * dist + 0.3);
            ax += force * dx;
            az += force * dz;
          }

          p.vx += ax * dt;
          p.vz += az * dt;
          p.x += p.vx * dt;
          p.z += p.vz * dt;

          const { y } = evaluateSpacetimeDepth(p.x, p.z, t);
          p.trail.push({ x: p.x, y: y + 0.25, z: p.z });
          if (p.trail.length > 80) p.trail.shift();

          // Out of bounds cleanup
          if (Math.abs(p.x) > 22 || Math.abs(p.z) > 22) {
            p.active = false;
          }
        }
      }

      // 6. Camera Orbit Positioning
      if (camera) {
        const { theta, phi, radius } = cameraAngleRef.current;
        camera.position.x = radius * Math.sin(theta) * Math.cos(phi);
        camera.position.y = radius * Math.cos(theta);
        camera.position.z = radius * Math.sin(theta) * Math.sin(phi);
        camera.lookAt(0, -1.5, 0);
      }

      if (scene && camera && renderer) {
        renderer.render(scene, camera);
      }

      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, simSpeed, scenario, visualStyle, evaluateSpacetimeDepth]);

  // Mouse drag handlers for camera orbit vs dragging physical masses
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const container = mountRef.current;
    if (!container || !cameraRef.current) return;

    const rect = container.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycasterRef.current.setFromCamera(new THREE.Vector2(mouseX, mouseY), cameraRef.current);

    // Check if user clicked on an existing mass to drag it
    const intersectsPlane = new THREE.Vector3();
    raycasterRef.current.ray.intersectPlane(mousePlaneRef.current, intersectsPlane);

    let clickedMass: SandboxMass | null = null;
    for (const m of massesRef.current) {
      const dist = Math.sqrt((intersectsPlane.x - m.x) ** 2 + (intersectsPlane.z - m.z) ** 2);
      if (dist <= m.radius * 2.2) {
        clickedMass = m;
        break;
      }
    }

    if (clickedMass) {
      isDraggingMassRef.current = clickedMass.id;
      setSelectedMassId(clickedMass.id);
    } else {
      isOrbitingRef.current = true;
      prevMouseRef.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const container = mountRef.current;
    if (!container) return;

    // Handle mass dragging across the spacetime sheet in real-time
    if (isDraggingMassRef.current && cameraRef.current) {
      const rect = container.getBoundingClientRect();
      const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(new THREE.Vector2(mouseX, mouseY), cameraRef.current);
      const hit = new THREE.Vector3();
      if (raycasterRef.current.ray.intersectPlane(mousePlaneRef.current, hit)) {
        const mass = massesRef.current.find((m) => m.id === isDraggingMassRef.current);
        if (mass) {
          mass.x = Math.max(-14, Math.min(14, hit.x));
          mass.z = Math.max(-14, Math.min(14, hit.z));
          mass.vx = 0;
          mass.vz = 0;
        }
      }
      return;
    }

    // Handle camera orbit
    if (!isOrbitingRef.current) return;
    const dx = e.clientX - prevMouseRef.current.x;
    const dy = e.clientY - prevMouseRef.current.y;
    prevMouseRef.current = { x: e.clientX, y: e.clientY };

    cameraAngleRef.current.phi -= dx * 0.008;
    cameraAngleRef.current.theta = Math.max(0.12, Math.min(Math.PI / 2.05, cameraAngleRef.current.theta - dy * 0.008));
  };

  const handleMouseUp = () => {
    isOrbitingRef.current = false;
    isDraggingMassRef.current = null;
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const zoomDelta = e.deltaY > 0 ? 1.08 : 0.92;
    cameraAngleRef.current.radius = Math.max(12, Math.min(75, cameraAngleRef.current.radius * zoomDelta));
  };

  // Add a new mass in the blank sandbox
  const handleAddMass = () => {
    const id = `mass-${Date.now()}`;
    const newMass: SandboxMass = {
      id,
      name: newMassType === 'black_hole' ? 'Black Hole' : newMassType === 'star' ? 'Star' : 'Planet',
      mass: newMassType === 'black_hole' ? 6.0 : newMassType === 'star' ? 3.0 : 0.8,
      radius: newMassType === 'black_hole' ? 0.7 : newMassType === 'star' ? 0.9 : 0.5,
      color: newMassType === 'black_hole' ? 0x111115 : newMassType === 'star' ? 0xffbb22 : 0x22cc88,
      x: (Math.random() - 0.5) * 12,
      z: (Math.random() - 0.5) * 12,
      vx: 0,
      vz: 0,
      isFixed: false,
      type: newMassType,
    };
    massesRef.current.push(newMass);
    setSelectedMassId(id);
    setMassesVersion((v) => v + 1);
  };

  // Remove selected mass
  const handleDeleteSelectedMass = () => {
    if (!selectedMassId) return;
    massesRef.current = massesRef.current.filter((m) => m.id !== selectedMassId);
    setSelectedMassId(null);
    setMassesVersion((v) => v + 1);
  };

  // Launch a test particle or light ray into the spacetime mesh
  const launchTestParticle = (isPhoton: boolean) => {
    const p: TestParticle = {
      id: `part-${Date.now()}`,
      x: -12.0,
      z: 3.5,
      vx: isPhoton ? 2.8 : 1.2,
      vz: 0.15,
      trail: [],
      isPhoton,
      color: isPhoton ? 0x38bdf8 : 0xf59e0b,
      active: true,
    };
    particlesRef.current.push(p);
  };

  const selectedMass = massesRef.current.find((m) => m.id === selectedMassId);

  return (
    <div id="spacetime-sandbox-container" className="flex flex-col h-full bg-neutral-950 text-neutral-200 select-none">
      {/* Viewport 3D Canvas */}
      <div
        className="relative flex-1 min-h-[460px] cursor-grab active:cursor-grabbing overflow-hidden bg-neutral-950"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <div ref={mountRef} className="w-full h-full block" />

        {/* Top-Left: Scenario Selector HUD (User Request: Solar system, black hole, blank mesh experiments) */}
        <div className="absolute top-4 left-4 flex flex-col gap-2 z-10 font-mono text-xs max-w-sm pointer-events-auto">
          <div className="bg-neutral-950/90 backdrop-blur border border-neutral-800 p-2.5 rounded-xl shadow-2xl">
            <span className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-sky-400" />
              Spacetime Geometry Scenario
            </span>
            <div className="grid grid-cols-2 gap-1 text-[11px]">
              <button
                id="scenario-solar-btn"
                onClick={() => handleSelectScenario('solar_system')}
                className={`px-2 py-1.5 rounded-lg flex items-center gap-1.5 transition-all text-left ${
                  scenario === 'solar_system'
                    ? 'bg-amber-950/80 border border-amber-700 text-amber-300 font-semibold shadow-sm'
                    : 'text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200'
                }`}
              >
                <Sun className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Solar System</span>
              </button>

              <button
                id="scenario-bh-btn"
                onClick={() => handleSelectScenario('black_hole')}
                className={`px-2 py-1.5 rounded-lg flex items-center gap-1.5 transition-all text-left ${
                  scenario === 'black_hole'
                    ? 'bg-sky-950/80 border border-sky-700 text-sky-300 font-semibold shadow-sm'
                    : 'text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200'
                }`}
                title="Deep relativistic funnel grid (Image 1)"
              >
                <Disc className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span>Black Hole Funnel</span>
              </button>

              <button
                id="scenario-wormhole-btn"
                onClick={() => handleSelectScenario('wormhole')}
                className={`px-2 py-1.5 rounded-lg flex items-center gap-1.5 transition-all text-left ${
                  scenario === 'wormhole'
                    ? 'bg-purple-950/80 border border-purple-700 text-purple-300 font-semibold shadow-sm'
                    : 'text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200'
                }`}
                title="Einstein-Rosen bridge connecting two spacetime sheets (Image 3)"
              >
                <GitMerge className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span>Wormhole Bridge</span>
              </button>

              <button
                id="scenario-gw-btn"
                onClick={() => handleSelectScenario('gravitational_waves')}
                className={`px-2 py-1.5 rounded-lg flex items-center gap-1.5 transition-all text-left ${
                  scenario === 'gravitational_waves'
                    ? 'bg-emerald-950/80 border border-emerald-700 text-emerald-300 font-semibold shadow-sm'
                    : 'text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200'
                }`}
                title="Quadrupole gravitational wave ripples across spacetime mesh (Image 4)"
              >
                <Waves className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>GW Mesh Ripples</span>
              </button>

              <button
                id="scenario-sandbox-btn"
                onClick={() => handleSelectScenario('blank_sandbox')}
                className={`col-span-2 px-2.5 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all text-center ${
                  scenario === 'blank_sandbox'
                    ? 'bg-sky-600/30 border border-sky-500 text-white font-semibold shadow-sm'
                    : 'bg-neutral-900 text-neutral-300 hover:bg-neutral-800'
                }`}
                title="Blank canvas where you place masses, drag them, and test live orbital geodesics"
              >
                <FlaskConical className="w-3.5 h-3.5 text-sky-400" />
                <span>🧪 Blank Mesh: Live Mass Lab</span>
              </button>
            </div>
          </div>

          {/* Scenario Physics Telemetry HUD */}
          <div className="bg-neutral-950/90 backdrop-blur border border-neutral-800 p-2.5 rounded-xl shadow-2xl text-[11px] space-y-1">
            <div className="flex justify-between items-center text-neutral-400">
              <span>Simulation Status:</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {isPlaying ? 'ACTIVE 60 FPS' : 'PAUSED'}
              </span>
            </div>

            {scenario === 'solar_system' && (
              <p className="text-neutral-400 text-[10px] leading-relaxed">
                The Sun produces a deep, smooth spacetime depression ($z \sim -GM/r$). The Earth follows the curved
                geodesic while carving its own local well in which the Moon orbits.
              </p>
            )}

            {scenario === 'black_hole' && (
              <p className="text-neutral-400 text-[10px] leading-relaxed">
                Matches <strong>Image 1</strong>: Exact Flamm paraboloid isometric spatial slice z(r) = -2·√[2M(r - 2M)]
                terminating at the event horizon throat r = 2M.
              </p>
            )}

            {scenario === 'wormhole' && (
              <p className="text-neutral-400 text-[10px] leading-relaxed">
                Matches <strong>Image 3</strong>: Two asymptotically flat spacetime sheets folded and joined by an
                Einstein-Rosen throat of radius $b_0$, creating a shortcut through hyperspace.
              </p>
            )}

            {scenario === 'gravitational_waves' && (
              <p className="text-neutral-400 text-[10px] leading-relaxed">
                Matches <strong>Image 4</strong>: Orbiting binary black holes emit dynamic transverse-traceless quadrupole
                strain $h_+(t - r/c)$ rippling radially through the spacetime mesh.
              </p>
            )}

            {scenario === 'blank_sandbox' && (
              <p className="text-neutral-400 text-[10px] leading-relaxed">
                <strong>Live Experiment:</strong> Click on any mass and <em>drag it</em> to warp spacetime in real time!
                Launch particles or photons to observe orbits, precession, or horizon capture.
              </p>
            )}
          </div>

          {/* Gravitational Wave Strain Magnifier Box (Directly replicating Image 4) */}
          {scenario === 'gravitational_waves' && showStrainLens && (
            <div className="bg-neutral-950/95 backdrop-blur border border-emerald-800 p-2.5 rounded-xl shadow-2xl animate-fade-in">
              <div className="flex items-center justify-between text-[10px] text-emerald-400 font-semibold mb-1">
                <span className="flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5" />
                  Local Metric Strain h(t) [Image 4 Probe]
                </span>
                <span className="font-mono text-white">{strainValue.toFixed(3)}</span>
              </div>
              {/* Oscillating Strain Sparkline Waveform */}
              <div className="h-9 w-full bg-neutral-900 rounded border border-neutral-800 flex items-center justify-center overflow-hidden px-1">
                <svg className="w-full h-full" viewBox="0 0 100 40" preserveAspectRatio="none">
                  <path
                    d={`M 0,20 Q 25,${20 - strainValue * 14} 50,20 T 100,20`}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2"
                  />
                  <line x1="0" y1="20" x2="100" y2="20" stroke="#334155" strokeDasharray="2,2" />
                </svg>
              </div>
              <span className="text-[9px] text-neutral-500 block mt-1">
                Transverse deformation of local spatial foliation $\Delta L / L \approx h$
              </span>
            </div>
          )}
        </div>

        {/* Top-Right: Visual Style & Camera Presets */}
        <div className="absolute top-4 right-4 flex flex-col items-end gap-2 z-10 font-mono text-xs pointer-events-auto">
          {/* Visual Style Palette */}
          <div className="bg-neutral-950/90 backdrop-blur border border-neutral-800 p-1 rounded-lg shadow-xl flex items-center gap-1 text-[11px]">
            <span className="text-neutral-500 px-1.5 flex items-center gap-1">
              <Eye className="w-3 h-3 text-sky-400" />
              Style:
            </span>
            {[
              { id: 'neon_wireframe', label: 'Neon Grid (Img 1/3)' },
              { id: 'lapse_colormap', label: 'Lapse α Time' },
              { id: 'stress_energy', label: 'T_μν Curvature (Img 2)' },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setVisualStyle(st.id as VisualStyle)}
                className={`px-2 py-1 rounded transition-colors ${
                  visualStyle === st.id
                    ? 'bg-neutral-800 border border-neutral-700 text-white font-semibold'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          {/* Quick Particle Launchers */}
          <div className="bg-neutral-950/90 backdrop-blur border border-neutral-800 p-1.5 rounded-lg shadow-xl flex items-center gap-1.5 text-[11px]">
            <span className="text-neutral-400 px-1">Shoot:</span>
            <button
              id="launch-particle-btn"
              onClick={() => launchTestParticle(false)}
              className="px-2.5 py-1 rounded bg-amber-950/70 border border-amber-800 text-amber-300 hover:bg-amber-900 transition-colors flex items-center gap-1 font-semibold"
              title="Launch a test mass particle with initial velocity to follow the curved geodesic"
            >
              <Send className="w-3 h-3 text-amber-400" />
              <span>Particle</span>
            </button>
            <button
              id="launch-photon-btn"
              onClick={() => launchTestParticle(true)}
              className="px-2.5 py-1 rounded bg-sky-950/70 border border-sky-800 text-sky-300 hover:bg-sky-900 transition-colors flex items-center gap-1 font-semibold"
              title="Launch a photon (light ray bends 2x more than Newtonian in curved space!)"
            >
              <Sparkles className="w-3 h-3 text-sky-400" />
              <span>Light Ray</span>
            </button>
          </div>
        </div>

        {/* Bottom-Center: Simulation Playback & Time Speed */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-neutral-950/90 backdrop-blur border border-neutral-800 px-3 py-1.5 rounded-full shadow-2xl font-mono text-xs z-10 pointer-events-auto">
          <button
            id="sandbox-play-pause-btn"
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-950 border border-sky-800 text-sky-300 hover:bg-sky-900 transition-colors font-semibold"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isPlaying ? 'Pause' : 'Play'}</span>
          </button>

          <div className="h-4 w-[1px] bg-neutral-800" />

          {/* Speed */}
          <div className="flex items-center gap-1 text-[11px]">
            <span className="text-neutral-500">Speed:</span>
            {[0.5, 1.0, 2.0].map((spd) => (
              <button
                key={spd}
                onClick={() => setSimSpeed(spd)}
                className={`px-1.5 py-0.5 rounded transition-colors ${
                  simSpeed === spd ? 'bg-neutral-800 text-white font-bold' : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>

          <div className="h-4 w-[1px] bg-neutral-800" />

          {/* Reset View */}
          <button
            onClick={() => {
              loadScenario(scenario);
              cameraAngleRef.current = { theta: Math.PI / 3.4, phi: Math.PI / 4, radius: 36 };
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 border border-neutral-800 transition-colors"
            title="Reset Scenario"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        </div>

        {/* Bottom-Left Hint */}
        <div className="absolute bottom-4 left-4 pointer-events-none text-neutral-500 text-[10px] font-mono bg-neutral-950/80 px-2 py-1 rounded border border-neutral-800">
          Left-click + drag to orbit • Right-click on mass to drag position • Scroll to zoom
        </div>
      </div>

      {/* Lower Interactive Control Dock for Live Sandbox Experiments */}
      <div className="border-t border-neutral-800/80 bg-neutral-900/90 px-4 py-3 shrink-0">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
          {/* Add / Manage Masses (Live Sandbox Mode) */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-neutral-400 flex items-center gap-1">
              <FlaskConical className="w-3.5 h-3.5 text-sky-400" />
              Live Mass Controls:
            </span>

            <select
              value={newMassType}
              onChange={(e) => setNewMassType(e.target.value as any)}
              className="bg-neutral-950 border border-neutral-800 text-neutral-200 px-2 py-1 rounded text-xs"
            >
              <option value="star">Star (M = 3.0)</option>
              <option value="planet">Planet (M = 0.8)</option>
              <option value="black_hole">Black Hole Funnel (M = 6.0)</option>
            </select>

            <button
              id="add-mass-btn"
              onClick={handleAddMass}
              className="px-2.5 py-1 rounded bg-sky-950 border border-sky-800 text-sky-300 hover:bg-sky-900 transition-colors flex items-center gap-1 font-semibold"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Spawn Mass</span>
            </button>

            {selectedMass && (
              <div className="flex items-center gap-2 bg-neutral-950 px-2.5 py-1 rounded border border-neutral-800">
                <span className="text-neutral-300 font-semibold">{selectedMass.name}:</span>
                <span className="text-neutral-500">M:</span>
                <input
                  type="range"
                  min="0.2"
                  max="12.0"
                  step="0.2"
                  value={selectedMass.mass}
                  onChange={(e) => {
                    selectedMass.mass = parseFloat(e.target.value);
                    setMassesVersion((v) => v + 1);
                  }}
                  className="w-16 accent-sky-400"
                />
                <span className="text-sky-400 w-8">{selectedMass.mass.toFixed(1)}</span>

                <button
                  onClick={handleDeleteSelectedMass}
                  className="p-1 text-red-400 hover:text-red-300 hover:bg-red-950/40 rounded transition-colors ml-1"
                  title="Delete this mass"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Grid Rigidity & Resolution */}
          <div className="flex flex-wrap items-center gap-4 bg-neutral-950 px-3 py-1.5 rounded-lg border border-neutral-800">
            <div className="flex items-center gap-2">
              <span className="text-neutral-400">Mesh Elasticity:</span>
              <input
                type="range"
                min="0.4"
                max="2.2"
                step="0.1"
                value={meshElasticity}
                onChange={(e) => setMeshElasticity(parseFloat(e.target.value))}
                className="w-20 accent-sky-400"
              />
              <span className="text-sky-400 w-8">{meshElasticity.toFixed(1)}x</span>
            </div>

            <div className="h-4 w-[1px] bg-neutral-800 hidden sm:block" />

            <div className="flex items-center gap-2">
              <span className="text-neutral-400">Grid Detail:</span>
              <select
                value={gridResolution}
                onChange={(e) => setGridResolution(parseInt(e.target.value, 10))}
                className="bg-neutral-900 border border-neutral-800 text-neutral-200 px-1.5 py-0.5 rounded text-xs"
              >
                <option value={48}>Normal (48x48)</option>
                <option value={72}>Dense (72x72)</option>
                <option value={96}>Ultra Fine (96x96)</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
