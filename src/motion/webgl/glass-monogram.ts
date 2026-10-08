import * as THREE from "three";

// Three.js 3D extruded optical crystal prism monogram
// Features:
// - Pure optical crystal prism aesthetics matching luxury faceted glass:
//     * Physical continuous multi-wavelength chromatic dispersion (Red -> Amber -> Green -> Cyan -> Blue)
//     * Silky planar front caps (normal-flattened, zero creases, zero polygon seams)
//     * Ultra-smooth circular ring subdivision (128 curve segments, zero faceted segments)
//     * Pure optical crystal transparency (crystal clear core, zero milky gray haze, zero 2D stripes)
//     * Razor-sharp diamond specular glints & studio softbox linear reflections
//     * Dynamic dual-temperature studio lighting: warm solar amber on top, electric cyan on bottom
// - 100% transparent canvas (seamless background blend, no opaque bounding box)
// - Smooth pointer-tracked tilt and continuous slow idle rotation

const S = 1.9;

const CRYSTAL_VERTEX = /* glsl */ `
varying vec3 vNormal;
varying vec3 vViewPosition;
varying vec3 vWorldPosition;
varying vec3 vLocalPosition;
varying vec2 vUv;

void main() {
  vUv = uv;
  vLocalPosition = position;
  vNormal = normalize(normalMatrix * normal);
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorldPosition = worldPos.xyz;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  vViewPosition = -mvPosition.xyz;
  gl_Position = projectionMatrix * mvPosition;
}
`;

const CRYSTAL_FRAGMENT = /* glsl */ `
varying vec3 vNormal;
varying vec3 vViewPosition;
varying vec3 vWorldPosition;
varying vec3 vLocalPosition;
varying vec2 vUv;

uniform float uTime;
uniform vec3 uLightPos;
uniform float uDark;
uniform float uDispersion;
uniform float uIor;
uniform float uFresnel;
uniform float uStreak;

// Optical dispersion rainbow function
vec3 spectralRainbow(float t) {
  vec3 a = vec3(0.5, 0.5, 0.5);
  vec3 b = vec3(0.5, 0.5, 0.5);
  vec3 c = vec3(1.0, 1.0, 1.0);
  vec3 d = vec3(0.00, 0.33, 0.67);
  return a + b * cos(6.2831853 * (c * t + d));
}

void main() {
  vec3 N = normalize(vNormal);
  vec3 V = normalize(vViewPosition);

  float NdotV = max(dot(N, V), 0.0);
  float fresnel = 1.0 - NdotV;
  float fresnelEdge = pow(fresnel, uFresnel);

  // ── 1. Physical Chromatic Dispersion (Multi-Wavelength Refraction) ──
  // Simulates true optical dispersion by refracting 5 discrete spectral wavelengths:
  // Red -> Yellow -> Green -> Cyan -> Blue
  float ior = uIor;
  float d = 0.035 * uDispersion;
  vec3 rayR = refract(-V, N, 1.0 / max(ior - d * 1.5, 1.01));
  vec3 rayY = refract(-V, N, 1.0 / max(ior - d * 0.5, 1.01));
  vec3 rayG = refract(-V, N, 1.0 / max(ior, 1.01));
  vec3 rayC = refract(-V, N, 1.0 / max(ior + d * 0.8, 1.01));
  vec3 rayB = refract(-V, N, 1.0 / max(ior + d * 2.0, 1.01));

  // Studio Light A: Warm golden amber key light (top-right)
  vec3 L_warm = normalize(vec3(0.55, 0.70, 0.45));
  float spotR = pow(max(dot(rayR, L_warm), 0.0), 10.0);
  float spotY = pow(max(dot(rayY, L_warm), 0.0), 10.0);
  float spotG = pow(max(dot(rayG, L_warm), 0.0), 10.0);
  float spotC = pow(max(dot(rayC, L_warm), 0.0), 10.0);
  float spotB = pow(max(dot(rayB, L_warm), 0.0), 10.0);

  vec3 warmDispersion = (
    vec3(1.00, 0.25, 0.05) * spotR * 1.5 +
    vec3(1.00, 0.75, 0.15) * spotY * 1.8 +
    vec3(0.40, 0.95, 0.25) * spotG * 1.3 +
    vec3(0.10, 0.85, 0.95) * spotC * 1.4 +
    vec3(0.15, 0.40, 1.00) * spotB * 1.6
  );

  // Studio Light B: Electric cyan / sapphire fill light (bottom-left)
  vec3 L_cool = normalize(vec3(-0.55, -0.65, 0.50));
  float coolR = pow(max(dot(rayR, L_cool), 0.0), 10.0);
  float coolY = pow(max(dot(rayY, L_cool), 0.0), 10.0);
  float coolG = pow(max(dot(rayG, L_cool), 0.0), 10.0);
  float coolC = pow(max(dot(rayC, L_cool), 0.0), 10.0);
  float coolB = pow(max(dot(rayB, L_cool), 0.0), 10.0);

  vec3 coolDispersion = (
    vec3(0.70, 0.20, 0.95) * coolR * 1.3 +
    vec3(0.15, 0.55, 1.00) * coolY * 1.5 +
    vec3(0.08, 0.85, 0.95) * coolG * 1.6 +
    vec3(0.10, 0.95, 0.85) * coolC * 1.8 +
    vec3(0.05, 0.45, 1.00) * coolB * 2.0
  );

  // ── 2. Total Internal Reflection (TIR) Dispersion Rim ──
  // Prismatic chromatic fringing along the bevel chamfers
  float sin2 = 1.0 - NdotV * NdotV;
  float tirR = smoothstep(0.38, 0.48, sin2);
  float tirG = smoothstep(0.35, 0.45, sin2);
  float tirB = smoothstep(0.32, 0.42, sin2);
  vec3 tirFringe = vec3(tirR * 1.0, tirG * 0.85, tirB * 1.15) * fresnelEdge * 1.6 * uDispersion;

  // ── 3. Subtle Translucent Crystal Tint (Pure Optical Glass Body) ──
  vec3 darkGlassTint = vec3(0.01, 0.08, 0.28) * (fresnelEdge * 0.35 + 0.04);
  vec3 lightGlassTint = vec3(0.04, 0.16, 0.45) * (fresnelEdge * 0.45 + 0.08);
  vec3 glassBodyTint = mix(lightGlassTint, darkGlassTint, uDark);

  // ── 4. Electric Blue Neon Rim & Reflection Streaks ──
  vec3 neonBlue = vec3(0.00, 0.45, 1.00);
  vec3 neonCyan = vec3(0.15, 0.85, 1.00);
  vec3 neonCore = vec3(0.85, 0.95, 1.00);

  // Intense electric blue rim grazing light
  float rimPower = pow(fresnel, 3.0);
  vec3 electricRim = (neonBlue * 2.8 + neonCyan * 1.8) * rimPower * (uDark * 1.6 + 0.7);

  // Polished glass light streak sweeping across the crystal face
  vec3 R = reflect(-V, N);
  vec3 streakDir = normalize(vec3(0.35, 0.80, 0.45));
  float streakVal = pow(max(dot(R, streakDir), 0.0), 22.0);
  vec3 faceStreak = (neonBlue * streakVal * 2.2 + neonCyan * pow(streakVal, 2.5) * 3.0 + neonCore * pow(streakVal, 6.0) * 3.5) * (uDark * 1.2 + 0.6) * uStreak;

  // ── 5. Surface Specular Highlights & Diamond Glints ──
  vec3 L_key = normalize(uLightPos - vWorldPosition);
  vec3 H_key = normalize(L_key + V);
  float NdotH_key = max(dot(N, H_key), 0.0);
  float specSharp = pow(NdotH_key, 240.0) * 5.0; // Needle-point diamond glint
  float specRidge = pow(NdotH_key, 35.0) * 0.8;

  // Secondary rim glint
  vec3 L_rim = normalize(vec3(-110.0, -130.0, 140.0) - vWorldPosition);
  vec3 H_rim = normalize(L_rim + V);
  float specRim = pow(max(dot(N, H_rim), 0.0), 50.0) * 1.6;

  vec3 specular = vec3(1.0) * (specSharp + specRidge + specRim);

  // ── 6. Final Color Assembly ──
  vec3 finalColor = 
      warmDispersion +
      coolDispersion +
      tirFringe +
      electricRim +
      faceStreak +
      specular +
      glassBodyTint;

  // ── 7. Pure Optical Crystal Transparency ──
  // The crystal body is truly translucent (~94% transparent in dark mode)
  // Only the electric rims, reflection streaks, and diamond glints catch brilliant light!
  float isFacet = 1.0 - abs(N.z); // 0 on flat face, >0 on bevels and edges
  float alphaBase = mix(0.20, 0.06, uDark);
  
  float alpha = clamp(
    fresnelEdge * 0.70 +
    isFacet * 0.55 +
    streakVal * 0.75 +
    specSharp * 1.0 +
    alphaBase,
    0.0,
    0.95
  );

  gl_FragColor = vec4(finalColor, alpha);
}
`;

function monogramGeometry(): THREE.BufferGeometry {
  const P = (x: number, y: number) =>
    new THREE.Vector2((x - 50) * S, (50 - y) * S);

  // Ultra-high curveSegments (128) guarantees a perfectly smooth circular ring with zero polygon segments
  const ring = new THREE.Shape().absarc(0, 0, 44 * S, 0, Math.PI * 2, false);
  ring.holes.push(new THREE.Path().absarc(0, 0, 38 * S, 0, Math.PI * 2, true));

  const w = new THREE.Shape(
    (
      [
        [24.25, 34],
        [33.25, 66],
        [42.25, 66],
        [46.75, 50],
        [51.25, 66],
        [60.25, 66],
        [69.25, 34],
        [60.25, 34],
        [55.75, 50],
        [51.25, 34],
        [42.25, 34],
        [37.75, 50],
        [33.25, 34],
      ] as const
    ).map(([x, y]) => P(x, y)),
  );

  const c = P(71.25, 61.5);
  const dot = new THREE.Shape().absarc(
    c.x,
    c.y,
    4.5 * S,
    0,
    Math.PI * 2,
    false,
  );

  // Smooth multi-segment diamond bevel for silky crystal bevels
  const geo = new THREE.ExtrudeGeometry([ring, w, dot], {
    depth: 16,
    bevelEnabled: true,
    bevelThickness: 3.8,
    bevelSize: 2.6,
    bevelSegments: 4,
    curveSegments: 128,
  });
  geo.center();

  // ── FIX FRONT & BACK CAP NORMALS ──
  // Forces all front-cap triangles to normal (0, 0, 1),
  // completely eliminating any triangulation creases or seams across the W!
  const posAttr = geo.getAttribute("position");
  const normAttr = geo.getAttribute("normal");
  if (posAttr && normAttr) {
    const pos = posAttr.array as Float32Array;
    const norm = normAttr.array as Float32Array;
    let minZ = Infinity;
    let maxZ = -Infinity;
    for (let i = 2; i < pos.length; i += 3) {
      const z = pos[i] ?? 0;
      if (z < minZ) minZ = z;
      if (z > maxZ) maxZ = z;
    }

    for (let i = 0; i < pos.length; i += 9) {
      const z0 = pos[i + 2] ?? 0;
      const z1 = pos[i + 5] ?? 0;
      const z2 = pos[i + 8] ?? 0;
      // Front cap triangle
      if (
        Math.abs(z0 - maxZ) < 0.001 &&
        Math.abs(z1 - maxZ) < 0.001 &&
        Math.abs(z2 - maxZ) < 0.001
      ) {
        norm[i] = 0;
        norm[i + 1] = 0;
        norm[i + 2] = 1;
        norm[i + 3] = 0;
        norm[i + 4] = 0;
        norm[i + 5] = 1;
        norm[i + 6] = 0;
        norm[i + 7] = 0;
        norm[i + 8] = 1;
      }
      // Back cap triangle
      if (
        Math.abs(z0 - minZ) < 0.001 &&
        Math.abs(z1 - minZ) < 0.001 &&
        Math.abs(z2 - minZ) < 0.001
      ) {
        norm[i] = 0;
        norm[i + 1] = 0;
        norm[i + 2] = -1;
        norm[i + 3] = 0;
        norm[i + 4] = 0;
        norm[i + 5] = -1;
        norm[i + 6] = 0;
        norm[i + 7] = 0;
        norm[i + 8] = -1;
      }
    }
    normAttr.needsUpdate = true;
  }

  return geo;
}

export type MonogramShaderParams = {
  dispersion: number;
  ior: number;
  fresnel: number;
  streak: number;
  speed: number;
};

export const DEFAULT_MONOGRAM_PARAMS: MonogramShaderParams = {
  dispersion: 1.0,
  ior: 1.52,
  fresnel: 2.5,
  streak: 1.0,
  speed: 0.45,
};

export type GlassMonogram = {
  start: () => void;
  stop: () => void;
  dispose: () => void;
  setParams: (params: Partial<MonogramShaderParams>) => void;
  resetRotation: () => void;
};

/** Mounts 3D glass monogram scene into host element. Returns null if WebGL is unavailable. */
export function mountGlassMonogram(
  host: HTMLElement,
  options: {
    animate: boolean;
    drag?: boolean;
    initialParams?: Partial<MonogramShaderParams>;
  },
): GlassMonogram | null {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  } catch {
    return null;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  // Transparent clear color: zero alpha blends flawlessly into section background
  renderer.setClearColor(0x000000, 0);
  const canvas = renderer.domElement;
  canvas.setAttribute("aria-hidden", "true");
  canvas.style.background = "transparent";
  host.append(canvas);

  const isDark = () =>
    document.documentElement.classList.contains("dark") ||
    document.documentElement.dataset.theme === "dark" ||
    (!document.documentElement.dataset.theme &&
      !document.documentElement.classList.contains("light") &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 1, 1000);

  const init = { ...DEFAULT_MONOGRAM_PARAMS, ...options.initialParams };
  let speedMultiplier = init.speed;

  const uniforms = {
    uTime: { value: 0 },
    uLightPos: { value: new THREE.Vector3(110, 150, 180) },
    uDark: { value: isDark() ? 1.0 : 0.0 },
    uDispersion: { value: init.dispersion },
    uIor: { value: init.ior },
    uFresnel: { value: init.fresnel },
    uStreak: { value: init.streak },
  };

  const crystalMaterial = new THREE.ShaderMaterial({
    vertexShader: CRYSTAL_VERTEX,
    fragmentShader: CRYSTAL_FRAGMENT,
    uniforms,
    transparent: true,
    depthWrite: true,
    depthTest: true,
    side: THREE.FrontSide,
    blending: THREE.NormalBlending,
  });

  const geometry = monogramGeometry();
  const logo = new THREE.Mesh(geometry, crystalMaterial);
  scene.add(logo);

  const applyTheme = () => {
    const dark = isDark();
    uniforms.uDark.value = dark ? 1.0 : 0.0;
    if (!running) renderer.render(scene, camera);
  };
  window.addEventListener("wu:theme-change", applyTheme);

  const resize = () => {
    const { width, height } = host.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    // Maintain padding margin around logo in portrait or square viewports
    camera.position.z = 340 * (width / height < 0.9 ? 1.3 : 1);
    camera.updateProjectionMatrix();
  };
  const ro = new ResizeObserver(() => {
    resize();
    if (!running) renderer.render(scene, camera);
  });
  ro.observe(host);
  resize();

  // Pointer interaction: smoothed tilt angles and optional 360° drag
  const pointer = { x: 0, y: 0 };
  const tilt = { x: 0, y: 0 };
  const dragRot = { x: 0, y: 0 };
  let isDragging = false;
  let dragStart = { x: 0, y: 0 };

  const onPointerDown = (e: PointerEvent) => {
    if (!options.drag) return;
    isDragging = true;
    dragStart = { x: e.clientX, y: e.clientY };
    try {
      host.setPointerCapture(e.pointerId);
    } catch {}
  };

  const onPointerUp = (e: PointerEvent) => {
    if (!isDragging) return;
    isDragging = false;
    try {
      host.releasePointerCapture(e.pointerId);
    } catch {}
  };

  const onMove = (e: PointerEvent) => {
    const r = host.getBoundingClientRect();
    pointer.x = (e.clientX - r.left) / r.width - 0.5;
    pointer.y = (e.clientY - r.top) / r.height - 0.5;

    if (isDragging) {
      const dx = (e.clientX - dragStart.x) * 0.012;
      const dy = (e.clientY - dragStart.y) * 0.012;
      dragRot.x += dy;
      dragRot.y += dx;
      dragStart = { x: e.clientX, y: e.clientY };
    }
  };

  const onLeave = () => {
    if (!isDragging) {
      pointer.x = 0;
      pointer.y = 0;
    }
  };

  if (options.animate) {
    host.addEventListener("pointermove", onMove);
    host.addEventListener("pointerleave", onLeave);
    if (options.drag) {
      host.addEventListener("pointerdown", onPointerDown);
      host.addEventListener("pointerup", onPointerUp);
      host.addEventListener("pointercancel", onPointerUp);
      host.style.cursor = "grab";
    }
  }

  let running = false;
  let raf = 0;
  let last = 0;
  let spin = 0;

  const pose = () => {
    logo.rotation.x = dragRot.x + tilt.x + Math.sin(spin * 0.4) * 0.05;
    logo.rotation.y = dragRot.y + tilt.y + Math.cos(spin * 0.5) * 0.07;
  };

  const frame = (now: number) => {
    if (!running) return;
    const dt = Math.min((now - last) / 1000, 0.1);
    last = now;
    spin += dt * speedMultiplier;
    uniforms.uTime.value = now * 0.001;
    tilt.x += (pointer.y * 0.5 - tilt.x) * 0.06;
    tilt.y += (pointer.x * 0.7 - tilt.y) * 0.06;
    pose();
    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  };
  pose();
  renderer.render(scene, camera);

  return {
    start() {
      if (running || !options.animate) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    },
    stop() {
      running = false;
      cancelAnimationFrame(raf);
    },
    setParams(params: Partial<MonogramShaderParams>) {
      if (params.dispersion !== undefined)
        uniforms.uDispersion.value = params.dispersion;
      if (params.ior !== undefined) uniforms.uIor.value = params.ior;
      if (params.fresnel !== undefined)
        uniforms.uFresnel.value = params.fresnel;
      if (params.streak !== undefined) uniforms.uStreak.value = params.streak;
      if (params.speed !== undefined) speedMultiplier = params.speed;
      if (!running) {
        pose();
        renderer.render(scene, camera);
      }
    },
    resetRotation() {
      dragRot.x = 0;
      dragRot.y = 0;
      tilt.x = 0;
      tilt.y = 0;
      spin = 0;
      pose();
      if (!running) renderer.render(scene, camera);
    },
    dispose() {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("wu:theme-change", applyTheme);
      ro.disconnect();
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", onLeave);
      if (options.drag) {
        host.removeEventListener("pointerdown", onPointerDown);
        host.removeEventListener("pointerup", onPointerUp);
        host.removeEventListener("pointercancel", onPointerUp);
      }
      geometry.dispose();
      crystalMaterial.dispose();
      renderer.dispose();
      canvas.remove();
    },
  };
}
