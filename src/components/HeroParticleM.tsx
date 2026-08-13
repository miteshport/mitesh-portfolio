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
    uRepulsionRadius: { value: 1.1 },
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
        float t = clamp(uScrollProgress * 2.0, 0.0, 1.0);
        currentPos = mix(position, aGeodesicCorePosition, t);
      } else {
        float t = clamp((uScrollProgress - 0.5) * 2.0, 0.0, 1.0);
        currentPos = mix(aGeodesicCorePosition, aCosmicPlanetPosition, t);
      }

      currentPos.y += sin(uTime * 1.5 + aRandomSeed * 6.28) * 0.035;
      currentPos.x += cos(uTime * 1.2 + aRandomSeed * 3.14) * 0.025;

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
        float springWobble = sin(factor * 16.0 - uTime * 10.0) * exp(-factor * uSpringDamping);
        displacement = (pow(factor, 2.5) * 0.42) + (springWobble * 0.1);

        vec3 pushDir = normalize(dirToMouse);
        pushDir.z += (aRandomSeed - 0.5) * 0.25;
        displacedPos += pushDir * displacement;
      }

      vDisplacement = displacement;

      vec4 mvPosition = modelViewMatrix * vec4(displacedPos, 1.0);
      gl_Position = projectionMatrix * mvPosition;

      float sizeBoost = 1.0 + (displacement * 2.2);
      gl_PointSize = clamp(aParticleSize * sizeBoost * (480.0 / -mvPosition.z), 4.0, 12.0);
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

      if (vDisplacement > 0.04) {
        color = mix(color, vec3(1.0, 1.0, 1.0), clamp(vDisplacement * 2.2, 0.0, 1.0));
        alpha = min(alpha * 1.3, 1.0);
      }

      gl_FragColor = vec4(color, alpha * 0.95);
    }
  `,
};

function generateMParticleData(totalParticles = 4200) {
  const positions = new Float32Array(totalParticles * 3);
  const geodesicCorePositions = new Float32Array(totalParticles * 3);
  const cosmicPlanetPositions = new Float32Array(totalParticles * 3);
  const seeds = new Float32Array(totalParticles);
  const sizes = new Float32Array(totalParticles);

  let count = 0;

  const addPoint = (x: number, y: number, z: number) => {
    if (count >= totalParticles) return;
    positions[count * 3] = x + (Math.random() - 0.5) * 0.09;
    positions[count * 3 + 1] = y + (Math.random() - 0.5) * 0.09;
    positions[count * 3 + 2] = z + (Math.random() - 0.5) * 0.14;

    const phi = Math.acos(-1 + (2 * count) / totalParticles);
    const theta = Math.sqrt(totalParticles * Math.PI) * phi;
    const coreRadius = 1.3 + (Math.random() - 0.5) * 0.18;
    geodesicCorePositions[count * 3] = Math.cos(theta) * Math.sin(phi) * coreRadius;
    geodesicCorePositions[count * 3 + 1] = Math.sin(theta) * Math.sin(phi) * coreRadius;
    geodesicCorePositions[count * 3 + 2] = Math.cos(phi) * coreRadius;

    const planetAngle = (count / totalParticles) * Math.PI * 2;
    const planetRadius = 1.8 + (Math.random() - 0.5) * 0.5;
    cosmicPlanetPositions[count * 3] = Math.cos(planetAngle) * planetRadius;
    cosmicPlanetPositions[count * 3 + 1] = Math.sin(planetAngle * 2.0) * 0.5;
    cosmicPlanetPositions[count * 3 + 2] = Math.sin(planetAngle) * planetRadius;

    seeds[count] = Math.random();
    sizes[count] = Math.random() * 0.025 + 0.035;
    count++;
  };

  const stemPoints = Math.floor(totalParticles * 0.28);
  for (let i = 0; i < stemPoints; i++) {
    addPoint(-1.05 + (Math.random() - 0.5) * 0.28, (Math.random() - 0.5) * 2.7, (Math.random() - 0.5) * 0.28);
  }

  const diagPoints1 = Math.floor(totalParticles * 0.22);
  for (let i = 0; i < diagPoints1; i++) {
    const t = Math.random();
    addPoint(-1.05 * (1 - t) + 0.0 * t, 1.35 * (1 - t) + (-0.3) * t, (Math.random() - 0.5) * 0.28);
  }

  const diagPoints2 = Math.floor(totalParticles * 0.22);
  for (let i = 0; i < diagPoints2; i++) {
    const t = Math.random();
    addPoint(0.0 * (1 - t) + 1.05 * t, (-0.3) * (1 - t) + 1.35 * t, (Math.random() - 0.5) * 0.28);
  }

  while (count < totalParticles) {
    addPoint(1.05 + (Math.random() - 0.5) * 0.28, (Math.random() - 0.5) * 2.7, (Math.random() - 0.5) * 0.28);
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
 * Subtractive Ricardo Chance Twinkling Micro-Starfield (1,200 Fine Micro-Stars)
 */
function TwinklingStarfield() {
  const pointsRef = useRef<THREE.Points>(null!);

  const [geometry, material] = useMemo(() => {
    const totalStars = 1200; // Subtractive Refinement: 1,200 fine stars (Zero Clutter!)
    const positions = new Float32Array(totalStars * 3);
    const seeds = new Float32Array(totalStars);
    const sizes = new Float32Array(totalStars);

    for (let i = 0; i < totalStars; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 22;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 15;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 12 - 1;

      seeds[i] = Math.random();
      sizes[i] = Math.random() * 0.02 + 0.012;
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

    return [geo, mat];
  }, []);

  useFrame((state) => {
    if (material) {
      material.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  return <points ref={pointsRef} geometry={geometry} material={material} />;
}

/**
 * 3D Particle Mesh Component supporting 3 Scroll Morph States
 */
function MParticleMesh({ mousePos, globalScroll }: { mousePos: { x: number; y: number }; globalScroll: number }) {
  const pointsRef = useRef<THREE.Points>(null!);
  const { camera } = useThree();

  const particleData = useMemo(() => generateMParticleData(4200), []);

  const shaderMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: ParticleMShader.vertexShader,
      fragmentShader: ParticleMShader.fragmentShader,
      uniforms: THREE.UniformsUtils.clone(ParticleMShader.uniforms),
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }, []);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(particleData.positions, 3));
    geo.setAttribute("aGeodesicCorePosition", new THREE.BufferAttribute(particleData.geodesicCorePositions, 3));
    geo.setAttribute("aCosmicPlanetPosition", new THREE.BufferAttribute(particleData.cosmicPlanetPositions, 3));
    geo.setAttribute("aRandomSeed", new THREE.BufferAttribute(particleData.seeds, 1));
    geo.setAttribute("aParticleSize", new THREE.BufferAttribute(particleData.sizes, 1));
    geo.center();
    return geo;
  }, [particleData]);

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
      const isMobile = window.innerWidth < 768;
      const scrollRotationMultiplier = globalScroll > 0.05 ? (globalScroll - 0.05) * Math.PI * 4 : 0;
      const targetRotationY = scrollRotationMultiplier;
      const targetRotationX = Math.sin(globalScroll * Math.PI) * 0.25;

      pointsRef.current.rotation.y = THREE.MathUtils.lerp(pointsRef.current.rotation.y, targetRotationY, 0.1);
      pointsRef.current.rotation.x = THREE.MathUtils.lerp(pointsRef.current.rotation.x, targetRotationX, 0.1);

      // On narrow mobile screens, center X position to 0; on desktop shift to right half (1.0)
      const targetX = globalScroll < 0.25 ? (isMobile ? 0.0 : 1.0) : 0.0;
      pointsRef.current.position.x = THREE.MathUtils.lerp(pointsRef.current.position.x, targetX, 0.08);

      // Dynamically scale down 'M' particle group on narrow mobile screens (0.65) so it fits 100% with zero clipping!
      const targetScale = isMobile ? 0.65 : 1.0;
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
