"use client";

import React, { useRef, useState, useEffect, useMemo, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * CRYSTALLINE TWINKLING MICRO-STARFIELD
 */
const StarfieldShader = {
  vertexShader: `
    uniform float uTime;
    attribute float aSeed;
    attribute float aSize;
    varying float vAlpha;
    varying float vSeed;
    void main() {
      vSeed = aSeed;
      vec3 pos = position;
      pos.x += sin(uTime * 0.04 + aSeed * 6.28) * 0.03;
      pos.y += cos(uTime * 0.05 + aSeed * 3.14) * 0.03;
      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      gl_Position = projectionMatrix * mvPosition;
      float twinkle = sin(uTime * (0.4 + aSeed * 1.2) + aSeed * 6.28) * 0.5 + 0.5;
      vAlpha = mix(0.15, 0.75, twinkle);
      gl_PointSize = clamp(aSize * (380.0 / -mvPosition.z), 1.0, 3.5);
    }
  `,
  fragmentShader: `
    varying float vAlpha;
    varying float vSeed;
    void main() {
      vec2 coord = gl_PointCoord - vec2(0.5);
      float dist = length(coord);
      if (dist > 0.5) discard;
      float alpha = smoothstep(0.5, 0.0, dist) * vAlpha;
      vec3 c = vec3(1.0);
      if (vSeed > 0.72) c = vec3(0.88, 0.80, 1.0);
      else if (vSeed < 0.28) c = vec3(0.75, 0.93, 1.0);
      gl_FragColor = vec4(c, alpha);
    }
  `,
};

/**
 * MASTER 3-STATE PARTICLE SHADER
 * Key design rules:
 *   - ALL particle positions are structural (M strokes, Lotus outlines, Mobius ribbon)
 *   - Zero random scatter / confetti filling
 *   - Zero shader jitter when Lotus is active (only gentle breathe on M and Mobius)
 */
const MasterShader = {
  uniforms: {
    uTime: { value: 0 },
    uMouse3D: { value: new THREE.Vector3(999, 999, 999) },
    uScrollProgress: { value: 0 },
    uRepulsion: { value: 0.32 },
  },
  vertexShader: `
    uniform float uTime;
    uniform vec3 uMouse3D;
    uniform float uScrollProgress;
    uniform float uRepulsion;

    attribute vec3 aLotusPos;
    attribute vec3 aMobiusPos;
    attribute float aSeed;
    attribute float aSize;
    attribute float aIsLotusOutline;   // 1.0 = petal outline edge, 0.5 = spine vein, 0.0 = core
    attribute float aTipFactor;        // 0 = base, 1 = tip (used for color)

    varying vec3 vPos;
    varying float vDist;
    varying float vScroll;
    varying float vSeed;
    varying float vIsLotusOutline;
    varying float vTipFactor;

    void main() {
      vSeed = aSeed;
      vIsLotusOutline = aIsLotusOutline;
      vTipFactor = aTipFactor;
      vScroll = uScrollProgress;

      // Per-particle scroll offset for organic vortex transit
      float seedDelay = aSeed * 0.14;
      float t = clamp((uScrollProgress - seedDelay) / (1.0 - 0.14), 0.0, 1.0);

      float p1 = smoothstep(0.0, 0.50, t);  // M -> Lotus
      float p2 = smoothstep(0.50, 1.0, t);  // Lotus -> Mobius

      vec3 base = mix(position, aLotusPos, p1);
      base = mix(base, aMobiusPos, p2);

      // Gravitational spiral only during transit — ZERO when fully at Lotus
      float transit = sin(p1 * 3.14159) * (1.0 - p2) + sin(p2 * 3.14159);
      if (transit > 0.02) {
        vec3 axis = vec3(0.0, 0.0, 1.0);
        vec3 swirl = cross(base, axis);
        float str = transit * (0.22 + aSeed * 0.18);
        base += swirl * str * sin(uTime * 1.4 + aSeed * 6.28);
      }

      // Gentle breathing ONLY on M and Mobius phases (not on Lotus)
      float lotusRest = p1 * (1.0 - p2); // peaks at 1.0 exactly at Lotus
      float breathScale = 1.0 - lotusRest; // 0.0 when fully at Lotus
      float breathe = sin(uTime * 1.5 + base.y * 2.8 + aSeed * 6.28) * 0.018 * breathScale;
      base += normalize(base + vec3(0.001)) * breathe;

      // Mouse deflection
      float d = distance(base, uMouse3D);
      vDist = d;
      if (d < uRepulsion) {
        float f = 1.0 - d / uRepulsion;
        base += normalize(base - uMouse3D) * f * 0.35;
      }

      vPos = base;

      vec4 mvPos = modelViewMatrix * vec4(base, 1.0);
      gl_Position = projectionMatrix * mvPos;

      // Size: outline edges slightly larger for crisp vector contours
      float sz = aSize * mix(1.0, 1.4, aIsLotusOutline);
      float boost = mix(1.0, 1.35, transit);
      gl_PointSize = clamp(sz * boost * (480.0 / -mvPos.z), 2.0, 6.5);
    }
  `,
  fragmentShader: `
    uniform float uTime;
    varying vec3 vPos;
    varying float vDist;
    varying float vScroll;
    varying float vSeed;
    varying float vIsLotusOutline;
    varying float vTipFactor;

    void main() {
      vec2 coord = gl_PointCoord - vec2(0.5);
      float dist = length(coord);
      if (dist > 0.5) discard;
      float alpha = smoothstep(0.5, 0.04, dist);

      float p1 = smoothstep(0.0, 0.50, vScroll);
      float p2 = smoothstep(0.50, 1.0, vScroll);

      // ---- M STATE (Royal Amethyst -> Electric Cyan vertical gradient) ----
      float normY = clamp((vPos.y + 1.35) / 2.7, 0.0, 1.0);
      vec3 cM = mix(vec3(0.75, 0.51, 0.99), vec3(0.22, 0.74, 0.98), normY);
      if (vSeed > 0.82) cM = mix(cM, vec3(1.0), 0.88);

      // ---- LOTUS STATE (Gold outline, Rose-Amber interior, White at tips) ----
      vec3 cLotus;
      if (vIsLotusOutline > 0.75) {
        // Petal Outline: Polished Gold -> Crystalline White at tip
        cLotus = mix(vec3(0.996, 0.749, 0.141), vec3(1.0, 1.0, 1.0), pow(vTipFactor, 1.4));
      } else if (vIsLotusOutline > 0.25) {
        // Spine Vein: Deep Rose -> Gold
        cLotus = mix(vec3(0.957, 0.247, 0.369), vec3(0.996, 0.749, 0.141), vTipFactor * 0.9);
      } else {
        // Core Stamen: Brilliant 24K Gold
        cLotus = mix(vec3(0.996, 0.878, 0.141), vec3(1.0, 1.0, 1.0), 0.6);
      }
      if (vSeed > 0.80) cLotus = mix(cLotus, vec3(1.0), 0.75);

      // ---- MOBIUS STATE (Cyan -> White accretion) ----
      vec3 cMob = mix(vec3(0.22, 0.74, 0.98), vec3(1.0), clamp((vPos.x + 2.2) / 4.4, 0.0, 1.0));
      if (vSeed > 0.55) cMob = vec3(1.0);

      vec3 color = mix(cM, cLotus, p1);
      color = mix(color, cMob, p2);

      if (vDist < 0.32) {
        float flare = 1.0 - vDist / 0.32;
        color = mix(color, vec3(1.0), flare * 0.9);
      }

      gl_FragColor = vec4(color, alpha * 0.96);
    }
  `,
};

function Starfield() {
  const ref = useRef<THREE.Points>(null);
  const { geo, mat } = useMemo(() => {
    const N = 1400;
    const pos = new Float32Array(N * 3);
    const seeds = new Float32Array(N);
    const sizes = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 18;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 16;
      pos[i * 3 + 2] = -2 - Math.random() * 7;
      seeds[i] = Math.random();
      sizes[i] = 1.1 + Math.random() * 2.2;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
    g.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    const m = new THREE.ShaderMaterial({
      vertexShader: StarfieldShader.vertexShader,
      fragmentShader: StarfieldShader.fragmentShader,
      uniforms: { uTime: { value: 0 } },
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    return { geo: g, mat: m };
  }, []);
  useFrame(s => { mat.uniforms.uTime.value = s.clock.elapsedTime; });
  return <points ref={ref} geometry={geo} material={mat} />;
}

interface ParticleProps {
  mousePos: { x: number; y: number };
  scroll: number;
}

function ParticleMesh({ mousePos, scroll }: ParticleProps) {
  const ref = useRef<THREE.Points>(null);

  const { geo, mat } = useMemo(() => {
    const COUNT = 7500;
    const mPos = new Float32Array(COUNT * 3);
    const lPos = new Float32Array(COUNT * 3);
    const mobPos = new Float32Array(COUNT * 3);
    const seeds = new Float32Array(COUNT);
    const sizes = new Float32Array(COUNT);
    const isOutline = new Float32Array(COUNT);
    const tipF = new Float32Array(COUNT);

    // ===================================================================
    // 1. M — 4 thick vector strokes (same as what already looked great)
    // ===================================================================
    for (let i = 0; i < COUNT; i++) {
      seeds[i] = Math.random();
      sizes[i] = 1.8 + Math.random() * 2.4;
      const seg = i % 4;
      const t = Math.random();
      const z = (Math.random() - 0.5) * 0.28;
      let x = 0, y = 0;
      if (seg === 0) { x = -1.18 + (Math.random() - 0.5) * 0.22; y = -1.3 + t * 2.6; }
      else if (seg === 1) { const A = new THREE.Vector3(-1.14, 1.22, z); const B = new THREE.Vector3(0, -0.35, z + 0.16); const v = A.lerp(B, t); x = v.x + (Math.random() - 0.5) * 0.13; y = v.y + (Math.random() - 0.5) * 0.13; }
      else if (seg === 2) { const A = new THREE.Vector3(0, -0.35, z + 0.16); const B = new THREE.Vector3(1.14, 1.22, z); const v = A.lerp(B, t); x = v.x + (Math.random() - 0.5) * 0.13; y = v.y + (Math.random() - 0.5) * 0.13; }
      else { x = 1.18 + (Math.random() - 0.5) * 0.22; y = -1.3 + t * 2.6; }
      mPos[i * 3] = x; mPos[i * 3 + 1] = y; mPos[i * 3 + 2] = z;
    }

    // ===================================================================
    // 2. SACRED LOTUS — 7 clean bold petal VECTOR STROKES only
    //    Each petal = left outline + right outline + center spine
    //    NO interior fill. NO scatter. Zero confetti.
    //
    //    Petal anatomy (frontal view, like a hand drawing):
    //      P0: Grand Central Flame (vertical, tallest, center)
    //      P1/P2: Inner Chalice Pair (cup the center, 50-degree angle)
    //      P3/P4: Lateral Wings (sweeping outward, 22-degree angle)
    //      P5/P6: Padmasana Throne Base (downward, 70-degree below horizontal)
    // ===================================================================

    type Petal = {
      ax: number; ay: number;  // petal base origin
      bx: number; by: number;  // petal tip target
      halfW: number;            // max half-width at widest point
      zLayer: number;           // depth layer
      count: number;            // particle budget for this petal
    };

    const PETALS: Petal[] = [
      // P0: Grand Central Flame (vertical axis, tallest)
      { ax: 0.00, ay: -0.05, bx: 0.00, by: 2.05, halfW: 0.38, zLayer: 0.02, count: 900 },

      // P1/P2: Inner Chalice Left & Right (angled at ~55° from vertical)
      { ax: 0.10, ay: 0.00, bx: 0.88, by: 1.72, halfW: 0.32, zLayer: -0.04, count: 680 },
      { ax: -0.10, ay: 0.00, bx: -0.88, by: 1.72, halfW: 0.32, zLayer: -0.04, count: 680 },

      // P3/P4: Lateral Wings Left & Right (wide spreading, ~25° from horizontal)
      { ax: 0.20, ay: -0.05, bx: 2.00, by: 0.82, halfW: 0.42, zLayer: -0.10, count: 820 },
      { ax: -0.20, ay: -0.05, bx: -2.00, by: 0.82, halfW: 0.42, zLayer: -0.10, count: 820 },

      // P5/P6: Padmasana Throne Base (angled downward ~30° from horizontal)
      { ax: 0.14, ay: -0.12, bx: 1.30, by: -1.08, halfW: 0.34, zLayer: -0.08, count: 600 },
      { ax: -0.14, ay: -0.12, bx: -1.30, by: -1.08, halfW: 0.34, zLayer: -0.08, count: 600 },
    ];

    // Dense Golden Core Stamen Ring
    const CORE_COUNT = 700;
    // Allocate remainder to petals proportionally
    const totalPetalBudget = COUNT - CORE_COUNT;
    const totalRaw = PETALS.reduce((s, p) => s + p.count, 0);
    PETALS.forEach(p => { p.count = Math.floor((p.count / totalRaw) * totalPetalBudget); });

    let gi = 0;

    // Build each petal with strictly only left outline, right outline, center spine
    for (const petal of PETALS) {
      const dx = petal.bx - petal.ax;
      const dy = petal.by - petal.ay;
      const len = Math.sqrt(dx * dx + dy * dy);
      const dirX = dx / len;
      const dirY = dy / len;
      const normX = -dirY; // perpendicular
      const normY = dirX;

      for (let k = 0; k < petal.count && gi < COUNT; k++, gi++) {
        const u = Math.random(); // along spine [0,1]
        tipF[gi] = u;

        // Teardrop width profile: 0 at base, max at ~50%, tapers to 0 at tip
        const w = petal.halfW * Math.pow(Math.sin(u * Math.PI), 0.82) * (1.0 - 0.18 * u);

        // Stroke type — cycling ensures equal density on all structural lines
        const strokeType = k % 3;
        let vOffset = 0.0;
        let outline = 0.0;
        if (strokeType === 0) { vOffset = w; outline = 1.0; }       // Left outline
        else if (strokeType === 1) { vOffset = -w; outline = 1.0; } // Right outline
        else { vOffset = 0.0; outline = 0.5; }                       // Center spine vein

        isOutline[gi] = outline;

        const spineX = petal.ax + dirX * u * len;
        const spineY = petal.ay + dirY * u * len;
        const finalX = spineX + normX * vOffset;
        const finalY = spineY + normY * vOffset;

        // Shallow 3D boat-hull concavity (visible when mouse tilts scene)
        const concave = -0.08 * (1.0 - (vOffset / (petal.halfW + 0.001)) ** 2) * Math.sin(u * Math.PI);

        lPos[gi * 3] = finalX;
        lPos[gi * 3 + 1] = finalY;
        lPos[gi * 3 + 2] = petal.zLayer + concave;
      }
    }

    // Core Stamen Ring (tight fibonacci spiral, glowing gold)
    const goldenAngle = 137.508 * (Math.PI / 180);
    for (let k = 0; k < CORE_COUNT && gi < COUNT; k++, gi++) {
      const rNorm = Math.sqrt(k / CORE_COUNT);
      const r = rNorm * 0.30;
      const theta = k * goldenAngle;
      const yOff = 0.12 + rNorm * 0.18;
      lPos[gi * 3] = Math.cos(theta) * r;
      lPos[gi * 3 + 1] = yOff;
      lPos[gi * 3 + 2] = 0.14 + r * 0.5;
      isOutline[gi] = 0.0;  // core gold
      tipF[gi] = 0.5;
    }

    // Fill any leftover particles (should be tiny) with core stamen
    while (gi < COUNT) {
      lPos[gi * 3] = (Math.random() - 0.5) * 0.15;
      lPos[gi * 3 + 1] = 0.14;
      lPos[gi * 3 + 2] = 0.10;
      isOutline[gi] = 0.0;
      tipF[gi] = 0.5;
      gi++;
    }

    // ===================================================================
    // 3. MOBIUS INFINITY — volumetric 3D twisted ribbon
    // ===================================================================
    for (let i = 0; i < COUNT; i++) {
      const s = Math.random() * Math.PI * 2;
      const denom = 1 + Math.sin(s) * Math.sin(s);
      const scale = 2.2;
      const x0 = (scale * Math.cos(s)) / denom;
      const y0 = (scale * Math.sin(s) * Math.cos(s)) / denom;
      const z0 = Math.sin(s * 2) * 0.30;
      const rw = (Math.random() - 0.5) * 0.38;
      const tw = s * 0.5;
      mobPos[i * 3] = x0 - rw * Math.sin(s) * Math.cos(tw);
      mobPos[i * 3 + 1] = y0 + rw * Math.cos(s) * Math.cos(tw);
      mobPos[i * 3 + 2] = z0 + rw * Math.sin(tw);
    }

    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(mPos, 3));
    g.setAttribute("aLotusPos", new THREE.BufferAttribute(lPos, 3));
    g.setAttribute("aMobiusPos", new THREE.BufferAttribute(mobPos, 3));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
    g.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    g.setAttribute("aIsLotusOutline", new THREE.BufferAttribute(isOutline, 1));
    g.setAttribute("aTipFactor", new THREE.BufferAttribute(tipF, 1));

    const m = new THREE.ShaderMaterial({
      vertexShader: MasterShader.vertexShader,
      fragmentShader: MasterShader.fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uMouse3D: { value: new THREE.Vector3(999, 999, 999) },
        uScrollProgress: { value: 0 },
        uRepulsion: { value: 0.32 },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    return { geo: g, mat: m };
  }, []);

  useFrame((state) => {
    mat.uniforms.uTime.value = state.clock.elapsedTime;
    mat.uniforms.uScrollProgress.value = scroll;

    const v = new THREE.Vector3(mousePos.x, mousePos.y, 0.5).unproject(state.camera);
    const dir = v.sub(state.camera.position).normalize();
    const dist = -state.camera.position.z / dir.z;
    mat.uniforms.uMouse3D.value.copy(state.camera.position.clone().add(dir.multiplyScalar(dist)));

    if (ref.current) {
      // === PER-STATE SAFE-AREA FIT ===
      // Camera frustum dimensions at z=0
      const cam = state.camera as THREE.PerspectiveCamera;
      const vFovRad = (cam.fov * Math.PI) / 180;
      const halfH = Math.tan(vFovRad / 2) * Math.abs(cam.position.z);
      const halfW = halfH * (state.size.width / state.size.height);

      // UI chrome fractions (top bar 64px, dock+margin 88px)
      const topFrac = 64 / state.size.height;
      const botFrac = 88 / state.size.height;

      // Safe area in world units
      const safeTopY    =  halfH * (1 - 2 * topFrac);
      const safeBotY    = -halfH * (1 - 2 * botFrac);
      const safeHalfH   = (safeTopY - safeBotY) / 2;
      const safeCenterY = (safeTopY + safeBotY) / 2;
      const safeHalfW   = halfW * 0.88;

      // ── Bounding boxes per state (model space, measured from geometry) ──
      // M: 4 calligraphic strokes. x: ±1.29  y: -1.3 → +1.22
      const M_HALF_H = 1.26;  const M_HALF_W = 1.36;  const M_CY = -0.04;
      // Lotus: 7 petals. x: ±2.21  y: -1.08 → +2.05
      const L_HALF_H = 1.565; const L_HALF_W = 2.21;  const L_CY =  0.485;
      // Nirakar (Möbius/∞): lemniscate. x: ±2.39  y: ±0.97
      const I_HALF_H = 0.97;  const I_HALF_W = 2.39;  const I_CY =  0.0;

      // Scroll → blend weights between states
      const p1 = Math.min(Math.max(scroll * 2, 0), 1);       // 0→1 during M→Lotus
      const p2 = Math.min(Math.max(scroll * 2 - 1, 0), 1);   // 0→1 during Lotus→Nirakar

      // Interpolated bounding box for current blend position
      const artHalfH = M_HALF_H + (L_HALF_H - M_HALF_H) * p1 + (I_HALF_H - L_HALF_H) * p2;
      const artHalfW = M_HALF_W + (L_HALF_W - M_HALF_W) * p1 + (I_HALF_W - L_HALF_W) * p2;
      const artCY    = M_CY     + (L_CY     - M_CY)     * p1 + (I_CY     - L_CY)     * p2;

      // Perfect fill: largest scale that doesn't clip either axis
      const targetScale = Math.min(safeHalfH / artHalfH, safeHalfW / artHalfW);

      // Center the blend in the safe visual zone
      const targetY = safeCenterY - artCY * targetScale;

      ref.current.scale.setScalar(THREE.MathUtils.lerp(ref.current.scale.x, targetScale, 0.08));
      ref.current.position.y = THREE.MathUtils.lerp(ref.current.position.y, targetY, 0.08);

      // Subtle mouse-driven parallax tilt
      ref.current.rotation.y = THREE.MathUtils.lerp(ref.current.rotation.y, mousePos.x * 0.055, 0.06);
      ref.current.rotation.x = THREE.MathUtils.lerp(ref.current.rotation.x, -mousePos.y * 0.055, 0.06);
    }
  });



  return <points ref={ref} geometry={geo} material={mat} position={[0, 0, 0]} />;
}

export default function HeroParticleM({ currentStage = 0 }: { currentStage?: number }) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const mm = (e: MouseEvent) => setMousePos({ x: (e.clientX / window.innerWidth) * 2 - 1, y: -(e.clientY / window.innerHeight) * 2 + 1 });
    const tm = (e: TouchEvent) => { if (e.touches[0]) setMousePos({ x: (e.touches[0].clientX / window.innerWidth) * 2 - 1, y: -(e.touches[0].clientY / window.innerHeight) * 2 + 1 }); };
    window.addEventListener("mousemove", mm);
    window.addEventListener("touchmove", tm, { passive: true });
    return () => { window.removeEventListener("mousemove", mm); window.removeEventListener("touchmove", tm); };
  }, []);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 0, backgroundColor: "#020204", pointerEvents: "none" }}>
      <Canvas camera={{ position: [0, 0, 4.5], fov: 54 }} gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }} dpr={[1, 2]}>
        <ambientLight intensity={1.0} />
        <Starfield />
        <Suspense fallback={null}>
          <ParticleMesh mousePos={mousePos} scroll={currentStage} />
        </Suspense>
      </Canvas>
    </div>
  );
}
