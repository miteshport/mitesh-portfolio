"use client";

import React, { useRef, useState, useEffect, useMemo, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

/**
 * 1. SUBTRACTIVE GLSL AURORA SOLAR WAVE SHADER
 * Quiet, deep, ambient violet waves drifting subtly across the bottom of space
 */
const AuroraWaveShader = {
  uniforms: {
    uTime: { value: 0 },
    uColorBase: { value: new THREE.Color("#06040c") },  // Matte Obsidian Space
    uColorViolet: { value: new THREE.Color("#120824") },// Subtle Deep Violet
    uColorCyan: { value: new THREE.Color("#0c1b2d") },  // Soft Solar Cyan Highlight
  },
  vertexShader: `
    varying vec2 vUv;
    varying float vElevation;
    uniform float uTime;

    float noise(vec2 p) {
      return sin(p.x * 2.0 + uTime * 0.25) * cos(p.y * 1.5 + uTime * 0.2) * 0.5 + 0.5;
    }

    void main() {
      vUv = uv;
      vec3 pos = position;
      
      float n1 = noise(uv * 2.5 + vec2(uTime * 0.08, uTime * 0.1));
      vElevation = n1;
      pos.z += vElevation * 0.3;

      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
  fragmentShader: `
    uniform vec3 uColorBase;
    uniform vec3 uColorViolet;
    uniform vec3 uColorCyan;

    varying vec2 vUv;
    varying float vElevation;

    void main() {
      // Quiet aurora mask confined to lower 35% of space
      float auroraMask = smoothstep(0.0, 0.7, 1.0 - vUv.y);
      vec3 color = mix(uColorBase, uColorViolet, vElevation * auroraMask * 0.55);
      color = mix(color, uColorCyan, pow(vElevation, 2.0) * auroraMask * 0.2);

      gl_FragColor = vec4(color, 1.0);
    }
  `,
};

/**
 * 2. SUBTRACTIVE TWINKLING MICRO-STARFIELD GLSL SHADER
 * 1,200 delicate, ultra-fine micro-stars with soft, slow sin(uTime) twinkling
 */
const TwinklingStarfieldShader = {
  uniforms: {
    uTime: { value: 0 },
  },
  vertexShader: `
    uniform float uTime;
    attribute float aSeed;
    attribute float aSize;

    varying float vAlpha;
    varying float vSeed;

    void main() {
      vSeed = aSeed;
      vec3 pos = position;

      // Subtle, slow orbital drift
      pos.x += sin(uTime * 0.12 + aSeed * 6.28) * 0.05;
      pos.y += cos(uTime * 0.15 + aSeed * 3.14) * 0.05;

      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      gl_Position = projectionMatrix * mvPosition;

      // Slow, organic sin(uTime) twinkling
      float twinkle = sin(uTime * (0.8 + aSeed * 1.5) + aSeed * 6.28) * 0.5 + 0.5;
      vAlpha = mix(0.15, 0.75, twinkle);

      // Fine, delicate star scaling
      gl_PointSize = clamp(aSize * (360.0 / -mvPosition.z), 1.2, 4.5);
    }
  `,
  fragmentShader: `
    varying float vAlpha;
    varying float vSeed;

    void main() {
      vec2 coord = gl_PointCoord - vec2(0.5);
      float dist = length(coord);
      if (dist > 0.5) discard;

      // Ultra-soft radial blur disc
      float alpha = smoothstep(0.5, 0.0, dist) * vAlpha;

      vec3 starColor = vec3(1.0, 1.0, 1.0);
      if (vSeed > 0.7) {
        starColor = vec3(0.85, 0.8, 1.0); // Soft Lavender Tint
      } else if (vSeed < 0.25) {
        starColor = vec3(0.75, 0.9, 1.0); // Soft Cyan Tint
      }

      gl_FragColor = vec4(starColor, alpha);
    }
  `,
};

/**
 * 3. GLSL SHADER MATERIAL FOR 3-STATE MORPHING WEBGL CORE
 */
const ParticleMShader = {
  uniforms: {
    uTime: { value: 0 },
    uMouse3D: { value: new THREE.Vector3(999, 999, 999) },
    uScrollProgress: { value: 0 },
    uRepulsionRadius: { value: 0.28 },
    uSpringDamping: { value: 4.2 },
    uVioletColor: { value: new THREE.Color("#a855f7") },
    uCyanColor: { value: new THREE.Color("#38bdf8") },
    uAmberColor: { value: new THREE.Color("#f59e0b") },
    uTopColor: { value: new THREE.Color("#ffffff") },
  },
  vertexShader: `
    uniform float uTime;
    uniform vec3 uMouse3D;
    uniform float uScrollProgress;
    uniform float uRepulsionRadius;
    uniform float uSpringDamping;

    attribute vec3 aGeodesicCorePosition;
    attribute vec3 aCosmicPlanetPosition;
    attribute float aRandomSeed;
    attribute float aParticleSize;

    varying float vDistanceToMouse;
    varying float vDisplacement;
    varying float vHeightRatio;
    varying float vRandom;
    varying float vScrollState;

    void main() {
      vRandom = aRandomSeed;
      vScrollState = uScrollProgress;

      vec3 currentPos;
      if (uScrollProgress < 0.5) {
        float t = smoothstep(0.02, 0.44, uScrollProgress);
        currentPos = mix(position, aGeodesicCorePosition, t);
      } else {
        float t = smoothstep(0.52, 0.94, uScrollProgress);
        currentPos = mix(aGeodesicCorePosition, aCosmicPlanetPosition, t);
      }

      // Harmonic celestial breathing
      currentPos.y += sin(uTime * 1.4 + aRandomSeed * 6.28) * 0.022;
      currentPos.x += cos(uTime * 1.1 + aRandomSeed * 3.14) * 0.018;

      vHeightRatio = clamp((currentPos.y + 1.4) / 2.8, 0.0, 1.0);

      vec4 worldPos = modelMatrix * vec4(currentPos, 1.0);
      vec3 particleWorldPos = worldPos.xyz;

      vec3 dirToMouse = particleWorldPos - uMouse3D;
      float distToMouse = length(dirToMouse);
      vDistanceToMouse = distToMouse;

      vec3 displacedPos = currentPos;
      float displacement = 0.0;

      if (distToMouse < uRepulsionRadius) {
        float factor = 1.0 - (distToMouse / uRepulsionRadius);
        // Velvet Fluid Displacement (Hooke's Law Quadratic Decay matching Location Box)
        displacement = pow(factor, 2.0) * 0.28;

        vec3 pushDir = normalize(dirToMouse);
        pushDir.z = factor * 0.1;
        displacedPos += normalize(pushDir) * displacement;
      }

      vDisplacement = displacement;

      vec4 mvPosition = modelViewMatrix * vec4(displacedPos, 1.0);
      gl_Position = projectionMatrix * mvPosition;

      // Refined starlight sizing with zero pixel explosion
      float sizeBoost = 1.0 + (displacement * 0.65);
      gl_PointSize = clamp(aParticleSize * sizeBoost * (480.0 / -mvPosition.z), 3.2, 8.0);
    }
  `,
  fragmentShader: `
    uniform float uTime;
    uniform vec3 uVioletColor;
    uniform vec3 uCyanColor;
    uniform vec3 uAmberColor;
    uniform vec3 uTopColor;

    varying float vDistanceToMouse;
    varying float vDisplacement;
    varying float vHeightRatio;
    varying float vRandom;
    varying float vScrollState;

    void main() {
      vec2 coord = gl_PointCoord - vec2(0.5);
      float dist = length(coord);
      if (dist > 0.5) discard;

      float alpha = smoothstep(0.5, 0.15, dist);

      vec3 baseGradient = mix(uVioletColor, uCyanColor, vHeightRatio);
      
      if (vScrollState > 0.35 && vScrollState < 0.65) {
        float amberMix = sin((vScrollState - 0.35) * 3.14159 * 3.33);
        baseGradient = mix(baseGradient, uAmberColor, clamp(amberMix, 0.0, 0.8));
      }

      vec3 color = mix(baseGradient, uTopColor, vHeightRatio * 0.4);

      // Soft Velvet Luminescence on cursor contact (Smooth transition, zero noise)
      if (vDisplacement > 0.01) {
        vec3 glowColor = mix(uCyanColor, vec3(1.0, 1.0, 1.0), 0.5);
        color = mix(color, glowColor, clamp(vDisplacement * 3.2, 0.0, 0.85));
        alpha = min(alpha * 1.25, 1.0);
      }

      gl_FragColor = vec4(color, alpha * 0.95);
    }
  `,
};

function generateMParticleData(totalParticles = 5000) {
  const positions = new Float32Array(totalParticles * 3);
  const geodesicCorePositions = new Float32Array(totalParticles * 3);
  const cosmicPlanetPositions = new Float32Array(totalParticles * 3);
  const seeds = new Float32Array(totalParticles);
  const sizes = new Float32Array(totalParticles);

  let count = 0;

  // True Bilateral Symmetry ($x \leftrightarrow -x$) Volumetric Generator
  const addSymmetricPair = (x: number, y: number, z: number, jitter = 0.04) => {
    if (count >= totalParticles - 1) return;

    const jx = (Math.random() - 0.5) * jitter;
    const jy = (Math.random() - 0.5) * jitter;
    const jz = (Math.random() - 0.5) * jitter;

    // --- State 1: Letter M Points ---
    const leftX = -Math.abs(x) + jx;
    const leftY = y + jy;
    const leftZ = z + jz;

    positions[count * 3] = leftX;
    positions[count * 3 + 1] = leftY;
    positions[count * 3 + 2] = leftZ;

    // --- State 2: Sacred Torus Energy Singularity Vortex ($R=1.45, r=0.55$) ---
    const u1 = (count / totalParticles) * Math.PI * 2;
    const v1 = u1 * 3.5 + Math.random() * 0.4;
    const R = 1.42;
    const r = 0.52 + (Math.random() - 0.5) * 0.12;
    
    geodesicCorePositions[count * 3] = (R + r * Math.cos(v1)) * Math.cos(u1);
    geodesicCorePositions[count * 3 + 1] = ((R + r * Math.cos(v1)) * Math.sin(u1)) * 0.78;
    geodesicCorePositions[count * 3 + 2] = r * Math.sin(v1);

    // --- State 3: Nirakar / Pure 3D Mobius Infinity Ribbon ($\infty$) ---
    const t1 = (count / totalParticles) * Math.PI * 2;
    const denom1 = 1 + Math.sin(t1) * Math.sin(t1);
    const infScale = 2.15;
    const ribbonWidth = (Math.random() - 0.5) * 0.18;
    const ribbonDepth = (Math.random() - 0.5) * 0.16;

    cosmicPlanetPositions[count * 3] = (infScale * Math.cos(t1)) / denom1 + ribbonWidth;
    cosmicPlanetPositions[count * 3 + 1] = ((infScale * Math.sin(t1) * Math.cos(t1)) / denom1) * 1.25 + ribbonWidth * 0.5;
    cosmicPlanetPositions[count * 3 + 2] = Math.sin(t1 * 2.0) * 0.42 + ribbonDepth;

    seeds[count] = Math.random();
    sizes[count] = Math.random() * 0.016 + 0.034;
    count++;

    // Right Mirrored Twin
    const rightX = Math.abs(x) - jx;
    const rightY = leftY;
    const rightZ = leftZ;

    positions[count * 3] = rightX;
    positions[count * 3 + 1] = rightY;
    positions[count * 3 + 2] = rightZ;

    // Torus Twin Point
    const u2 = u1 + Math.PI;
    const v2 = v1;
    geodesicCorePositions[count * 3] = (R + r * Math.cos(v2)) * Math.cos(u2);
    geodesicCorePositions[count * 3 + 1] = ((R + r * Math.cos(v2)) * Math.sin(u2)) * 0.78;
    geodesicCorePositions[count * 3 + 2] = -r * Math.sin(v2);

    // Mobius Ribbon Twin Point
    const t2 = t1 + Math.PI;
    const denom2 = 1 + Math.sin(t2) * Math.sin(t2);
    cosmicPlanetPositions[count * 3] = (infScale * Math.cos(t2)) / denom2 - ribbonWidth;
    cosmicPlanetPositions[count * 3 + 1] = ((infScale * Math.sin(t2) * Math.cos(t2)) / denom2) * 1.25 - ribbonWidth * 0.5;
    cosmicPlanetPositions[count * 3 + 2] = Math.sin(t2 * 2.0) * 0.42 - ribbonDepth;

    seeds[count] = Math.random();
    sizes[count] = sizes[count - 1];
    count++;
  };

  const totalPairs = Math.floor(totalParticles / 2);
  const stemPairs = Math.floor(totalPairs * 0.52);
  const diagPairs = totalPairs - stemPairs;

  const stemThickness = 0.22;
  const diagThickness = 0.20;
  const depthSpread = 0.16;

  // 1. Solid Volumetric Outer Stems (Thick Architectural Pillars with filled body)
  for (let i = 0; i < stemPairs; i++) {
    const t = i / stemPairs;
    const y = -1.30 + t * 2.60;
    const xOffset = (Math.random() - 0.5) * stemThickness;
    const zOffset = (Math.random() - 0.5) * depthSpread;
    addSymmetricPair(1.20 + xOffset, y, zOffset, 0.035);
  }

  // 2. Solid Volumetric Diagonals (Thick Beveled Beams meeting in center vertex)
  for (let i = 0; i < diagPairs; i++) {
    const t = i / diagPairs;
    const startX = 1.20;
    const startY = 1.30;
    const endX = 0.00;
    const endY = -0.32;

    const baseX = startX * (1 - t) + endX * t;
    const baseY = startY * (1 - t) + endY * t;

    // Perpendicular vector for diagonal beam thickness
    const dx = endX - startX;
    const dy = endY - startY;
    const len = Math.sqrt(dx * dx + dy * dy);
    const px = -dy / len;
    const py = dx / len;

    const offset = (Math.random() - 0.5) * diagThickness;
    const zOffset = (Math.random() - 0.5) * depthSpread;

    addSymmetricPair(baseX + px * offset, baseY + py * offset, zOffset, 0.035);
  }

  return { positions, geodesicCorePositions, cosmicPlanetPositions, seeds, sizes };
}

/**
 * Subtractive Ricardo Chance Aurora Wave Mesh Component
 */
function AuroraWaveMesh() {
  const meshRef = useRef<THREE.Mesh>(null!);
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: AuroraWaveShader.vertexShader,
      fragmentShader: AuroraWaveShader.fragmentShader,
      uniforms: THREE.UniformsUtils.clone(AuroraWaveShader.uniforms),
      side: THREE.DoubleSide,
      depthWrite: false,
    });
  }, []);

  useFrame((state) => {
    if (material) {
      material.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0, -5]} scale={[25, 16, 1]}>
      <planeGeometry args={[1, 1, 64, 64]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}

/**
 * Subtractive Ricardo Chance Twinkling Micro-Starfield Component
 */
function TwinklingStarfield() {
  const pointsRef = useRef<THREE.Points>(null!);

  const { geometry, shaderMaterial } = useMemo(() => {
    const starCount = 1200;
    const positions = new Float32Array(starCount * 3);
    const seeds = new Float32Array(starCount);
    const sizes = new Float32Array(starCount);

    for (let i = 0; i < starCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 22;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 16;
      positions[i * 3 + 2] = -2 - Math.random() * 8;

      seeds[i] = Math.random();
      sizes[i] = Math.random() * 0.035 + 0.015;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
    geo.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));

    const mat = new THREE.ShaderMaterial({
      vertexShader: TwinklingStarfieldShader.vertexShader,
      fragmentShader: TwinklingStarfieldShader.fragmentShader,
      uniforms: THREE.UniformsUtils.clone(TwinklingStarfieldShader.uniforms),
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    return { geometry: geo, shaderMaterial: mat };
  }, []);

  useFrame((state) => {
    if (shaderMaterial) {
      shaderMaterial.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  return <points ref={pointsRef} geometry={geometry} material={shaderMaterial} />;
}

/**
 * 3-State Morphing 3D Particle 'M' WebGL Core Component
 */
function MParticleMesh({ mousePos, globalScroll }: { mousePos: { x: number; y: number }; globalScroll: number }) {
  const pointsRef = useRef<THREE.Points>(null!);
  const { camera, size } = useThree();

  const { geometry, shaderMaterial } = useMemo(() => {
    const data = generateMParticleData(5000);

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(data.positions, 3));
    geo.setAttribute("aGeodesicCorePosition", new THREE.BufferAttribute(data.geodesicCorePositions, 3));
    geo.setAttribute("aCosmicPlanetPosition", new THREE.BufferAttribute(data.cosmicPlanetPositions, 3));
    geo.setAttribute("aRandomSeed", new THREE.BufferAttribute(data.seeds, 1));
    geo.setAttribute("aParticleSize", new THREE.BufferAttribute(data.sizes, 1));

    const mat = new THREE.ShaderMaterial({
      vertexShader: ParticleMShader.vertexShader,
      fragmentShader: ParticleMShader.fragmentShader,
      uniforms: THREE.UniformsUtils.clone(ParticleMShader.uniforms),
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    return { geometry: geo, shaderMaterial: mat };
  }, []);

  useFrame((state) => {
    if (!shaderMaterial) return;

    shaderMaterial.uniforms.uTime.value = state.clock.elapsedTime;
    shaderMaterial.uniforms.uScrollProgress.value = globalScroll;

    const vector = new THREE.Vector3(mousePos.x, mousePos.y, 0.5);
    vector.unproject(camera);
    const dir = vector.sub(camera.position).normalize();
    const distance = -camera.position.z / dir.z;
    const mouse3D = camera.position.clone().add(dir.multiplyScalar(distance));

    shaderMaterial.uniforms.uMouse3D.value.copy(mouse3D);

    if (pointsRef.current) {
      const aspect = size.width / size.height;
      const scrollRotationMultiplier = globalScroll > 0.05 ? (globalScroll - 0.05) * Math.PI * 4 : 0;
      const targetRotationY = scrollRotationMultiplier;
      const targetRotationX = Math.sin(globalScroll * Math.PI) * 0.25;

      pointsRef.current.rotation.y = THREE.MathUtils.lerp(pointsRef.current.rotation.y, targetRotationY, 0.1);
      pointsRef.current.rotation.x = THREE.MathUtils.lerp(pointsRef.current.rotation.x, targetRotationX, 0.1);

      // Centered Monumental Archway Positioning
      const targetX = 0.0;
      const targetY = 0.0;

      // Mathematical IMAX 70mm Dynamic Aspect-Ratio Auto-Fitting
      // Galaxy Z Fold cover screen (aspect ~0.43 - 0.6) auto-fits with zero cropping
      // Tablets / Foldables open (aspect 0.65 - 1.15) scale to 1.15
      // Widescreen PC Monitors (aspect > 1.15) command screen at 1.35
      let heroBaseScale = 1.35;
      if (aspect < 0.55) {
        heroBaseScale = Math.max(aspect * 1.55, 0.65);
      } else if (aspect < 0.85) {
        heroBaseScale = Math.max(aspect * 1.35, 0.80);
      } else if (aspect < 1.2) {
        heroBaseScale = 1.15;
      } else {
        heroBaseScale = 1.35;
      }

      const targetScale = globalScroll < 0.25 ? heroBaseScale : heroBaseScale * 0.72;

      pointsRef.current.position.x = THREE.MathUtils.lerp(pointsRef.current.position.x, targetX, 0.08);
      pointsRef.current.position.y = THREE.MathUtils.lerp(pointsRef.current.position.y, targetY, 0.08);
      pointsRef.current.scale.setScalar(THREE.MathUtils.lerp(pointsRef.current.scale.x, targetScale, 0.1));
    }
  });

  return <points ref={pointsRef} geometry={geometry} material={shaderMaterial} position={[0, 0, 0]} />;
}

/**
 * Global Viewport-Pinned 3D Canvas Background Component
 */
export default function HeroParticleM() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [globalScrollProgress, setGlobalScrollProgress] = useState(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = -(e.clientY / window.innerHeight) * 2 + 1;
      setMousePos({ x, y });
    };

    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = totalHeight > 0 ? Math.min(Math.max(window.scrollY / totalHeight, 0), 1) : 0;
      setGlobalScrollProgress(progress);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        pointerEvents: "none",
        zIndex: 0,
        backgroundColor: "#06040c",
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 4.5], fov: 45 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      >
        <ambientLight intensity={1.0} />
        {/* Subtractive Ricardo Chance 1: Organic Aurora Solar Waves */}
        <AuroraWaveMesh />
        {/* Subtractive Ricardo Chance 2: 1,200 Twinkling Micro-Starfield */}
        <TwinklingStarfield />
        {/* 3D Particle 'M' Monogram */}
        <Suspense fallback={null}>
          <MParticleMesh mousePos={mousePos} globalScroll={globalScrollProgress} />
        </Suspense>
      </Canvas>
    </div>
  );
}
