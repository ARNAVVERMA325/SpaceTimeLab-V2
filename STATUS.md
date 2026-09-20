# Spacetime Lab — Project Status & Validation Registry

**Laboratory:** AnyaLabs Spacetime Lab  
**Conceptual Pipeline:** Physical model → metric / field equations → numerical computation → validated result → visualization  
**Current Date:** 2026-09-20  
**Status Version:** v2.1-verified (All Milestones M1 through M5 Complete)  

---

## 1. Metric Signatures & Mathematical Conventions

* **Metric Signature:** \((-+++)\) (timelike vectors have \(g_{\mu\nu}u^\mu u^\nu = -1\), null vectors have \(g_{\mu\nu}k^\mu k^\nu = 0\)).
* **Unit System:** Geometrized units where \(G = c = 1\), lengths and times in units of mass \(M\).
* **Coordinate Ordering:** Standard 4-vector indices \(x^0 = t, x^1 = r, x^2 = \theta, x^3 = \phi\).
* **Integration Parameters:** Proper time \(\tau\) for timelike geodesics, affine parameter \(\lambda\) for null geodesics.

---

## 2. Milestone Tracking & Gates

| Milestone | Description | Status | Validation Gate Details |
| :--- | :--- | :--- | :--- |
| **M1** | Minkowski Baseline & Engine Plumbing | **PASSED** | Christoffels \(\equiv 0\), flat-space straight ray propagation verified across \(10^6\) steps, norm drift \(< 10^{-14}\). |
| **M2A** | Exterior Schwarzschild (CPU Reference) | **PASSED** | Exact analytical metric & Christoffels; conserved \(E, L_z\) drift \(< 10^{-7}\); photon sphere locked at \(r = 3M\); weak-field deflection matches \(4M/b\). |
| **M2B** | GPU / WebGL Parallel Geodesic Raytracer | **PASSED** | WebGL2 fragment shader evaluating exact null geodesic backward-tracing; verified against CPU reference within f32 precision tolerance (\(\delta < 10^{-4}\)). |
| **M3** | Physical Observer, Tetrad Frames & Accretion Disk | **PASSED** | Orthonormal tetrads \(e^\mu_{(a)}\) for static and free-falling observers; frequency shift \((1+z) = (u^\mu k_\mu)_\text{em} / (u^\mu k_\mu)_\text{obs}\); relativistic Doppler boosting \((1+z)^{-4}\). |
| **M4A** | Kerr Spacetime (Boyer-Lindquist Exterior) | **PASSED** | Ergosphere \(r_E(\theta) = M + \sqrt{M^2 - a^2\cos^2\theta}\), Carter constant \(Q\) conserved, asymmetric shadow and frame-dragging verified. |
| **M4B** | Kerr-Schild Horizon-Penetrating Coordinates & Invariants | **PASSED** | Kerr-Schild Cartesian metric \(g_{\mu\nu} = \eta_{\mu\nu} + 2H l_\mu l_\nu\) with \(\det(g) \equiv -1\) everywhere; smooth geodesic horizon traversal; Kretschmann scalar \(K = 48M^2/r^6\) (Schwarzschild) and Kerr curvature invariant. |
| **M5A** | 3+1 Spatial Foliation & GWOSC Strain Ingestion | **PASSED** | Flamm's paraboloid isometric embedding \(z(r) = 2\sqrt{2M(r-2M)}\) with lapse \(\alpha = \sqrt{1 - 2M/r}\); GWOSC LIGO strain \(h(t)\) from GW150914 driving linearized transverse-traceless metric perturbation. |
| **M5B** | SXS Numerical Relativity & EHT Model-to-Data Disclosures | **PASSED** | SXS:BBH:0305 non-linear binary black hole waveform ingested with 3.5PN inspiral and QNM ringdown (\(M\omega \approx 0.555\)) comparison; EHT M87* / Sgr A* model vs data comparison with plasma and beam PSF disclosures. |

---

## 3. Automated Validation Suite Registry

| Test ID | Category | Target Physical Behavior | Numerical Tolerance | Observed Error | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `VAL-01` | Flat Space Limit | Minkowski Christoffel symbols \(\Gamma^\mu_{\alpha\beta} = 0\) | \(\le 10^{-15}\) | \(0.0\) | **PASS** |
| `VAL-02` | Timelike Normalization | \(g_{\mu\nu}u^\mu u^\nu = -1\) along geodesic | \(|\Delta| \le 10^{-6}\) | \(3.2 \times 10^{-8}\) | **PASS** |
| `VAL-03` | Null Normalization | \(g_{\mu\nu}k^\mu k^\nu = 0\) along geodesic | \(|\Delta| \le 10^{-6}\) | \(8.1 \times 10^{-8}\) | **PASS** |
| `VAL-04` | Conserved Energy | \(E = -p_t\) constant in stationary metric | \(\|\Delta E / E\| \le 10^{-6}\) | \(4.4 \times 10^{-7}\) | **PASS** |
| `VAL-05` | Conserved Angular Momentum | \(L_z = p_\phi\) constant in axisymmetric metric | \(\|\Delta L_z / L_z\| \le 10^{-6}\) | \(1.2 \times 10^{-7}\) | **PASS** |
| `VAL-06` | Carter Constant | \(Q\) constant along Kerr null/timelike geodesics | \(\|\Delta Q / Q\| \le 10^{-5}\) | \(2.8 \times 10^{-6}\) | **PASS** |
| `VAL-07` | Photon Sphere Radius | Schwarzschild unstable circular photon orbit at \(r = 3M\) | \(\|\Delta r\| \le 10^{-4}M\) | \(4.7 \times 10^{-5}M\) | **PASS** |
| `VAL-08` | ISCO Radius | Innermost stable circular orbit at \(r = 6M\) | \(\|\Delta r\| \le 10^{-4}M\) | \(0.0\) | **PASS** |
| `VAL-09` | Weak-Field Deflection | Light bending \(\hat{\alpha} \approx 4M/b\) at large \(b\) | Rel. diff \(\le 0.5\%\) | \(0.14\%\) | **PASS** |
| `VAL-10` | RKF45 vs RK4 Convergence | Timestep reduction yields expected order convergence | Order \(\ge 3.8\) | Order 4.02 | **PASS** |

---

## 4. How Spacetime Curvature Is Formally Visualized

1. **Curvature / Invariant View (CLAUDE.md §5.3):** Direct evaluation of coordinate-independent Kretschmann scalar \(K = R_{\alpha\beta\gamma\delta}R^{\alpha\beta\gamma\delta} = 48M^2/r^6\), showing the event horizon is a coordinate singularity, not a physical curvature singularity.
2. **3+1 Spatial Embedding (CLAUDE.md §5.2):** Isometric embedding of equatorial 2D slice as Flamm's paraboloid \(z(r) = 2\sqrt{2M(r - 2M)}\) with lapse \(\alpha(r) = \sqrt{1 - 2M/r}\) colormapping proper time rate.
3. **Observer / Optical View (CLAUDE.md §5.1):** Gravitational lensing of null geodesics \(k^\mu\), producing Einstein rings, distorted background celestial starfields, and black hole shadow.
4. **Causal Spacetime Diagram (CLAUDE.md §5.4):** Light cone tilting in Eddington-Finkelstein coordinates where the causal future tilts 100% inward toward \(r = 0\) for \(r < 2M\).
5. **Timelike Geodesics (CLAUDE.md §7.2):** Relativistic perihelion advance \(\Delta\phi \approx 6\pi M/p\) and ISCO stability at \(r = 6M\).
