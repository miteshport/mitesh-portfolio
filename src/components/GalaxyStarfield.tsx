"use client";

import React, { useRef, useMemo, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * EXACT WebGL GLSL STARFIELD SHADER (Identical to Main Page)
 * Pin-sharp 1.0 - 3.5px sub-pixel starlight with true GPU AdditiveBlending
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

function StarfieldPoints() {
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
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    return { geo: g, mat: m };
  }, []);

  useFrame((state) => {
    mat.uniforms.uTime.value = state.clock.elapsedTime;
  });

  return <points ref={ref} geometry={geo} material={mat} />;
}

export default function GalaxyStarfield() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        backgroundColor: "#020204",
        pointerEvents: "none",
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 4.5], fov: 54 }}
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
        dpr={[1, 2]}
      >
        <ambientLight intensity={1.0} />
        <Suspense fallback={null}>
          <StarfieldPoints />
        </Suspense>
      </Canvas>
    </div>
  );
}
