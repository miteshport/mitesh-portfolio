"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";

export default function CardLotusBackground() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    camera.position.set(0, 0.2, 3.8);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // 8-Petal Sacred Lotus Particle Geometry
    const totalParticles = 4000;
    const positions = new Float32Array(totalParticles * 3);
    const seeds = new Float32Array(totalParticles);
    const sizes = new Float32Array(totalParticles);

    for (let i = 0; i < totalParticles; i++) {
      const thetaLotus = (i / totalParticles) * Math.PI * 2;
      const tier = i % 3; // 0: Outer Petals, 1: Mid Petals, 2: Inner Core

      let lotusX = 0;
      let lotusY = 0;
      let lotusZ = 0;

      if (tier === 0) {
        // Outer 8 Petals: Wide, majestic opening
        const petalWave = Math.pow(Math.abs(Math.cos(4 * thetaLotus)), 0.85);
        const rad = (0.5 + 1.25 * petalWave) * (0.35 + 0.65 * Math.random());
        lotusX = rad * Math.cos(thetaLotus);
        lotusZ = rad * Math.sin(thetaLotus);
        lotusY = -0.45 + Math.pow(rad / 1.7, 1.6) * 0.95;
      } else if (tier === 1) {
        // Mid 8 Petals: Offset by 22.5 deg, steeper upward reach
        const thetaOffset = thetaLotus + Math.PI / 8;
        const petalWave = Math.pow(Math.abs(Math.cos(4 * thetaOffset)), 0.9);
        const rad = (0.38 + 0.95 * petalWave) * (0.35 + 0.65 * Math.random());
        lotusX = rad * Math.cos(thetaOffset);
        lotusZ = rad * Math.sin(thetaOffset);
        lotusY = -0.40 + Math.pow(rad / 1.3, 1.4) * 0.85;
      } else {
        // Inner Luminous Core / Stamen
        const rad = Math.random() * 0.45;
        const phi = Math.random() * Math.PI * 2;
        lotusX = rad * Math.cos(phi);
        lotusZ = rad * Math.sin(phi);
        lotusY = -0.42 + Math.random() * 0.4;
      }

      positions[i * 3] = lotusX * 1.35;
      positions[i * 3 + 1] = (lotusY + 0.1) * 1.35;
      positions[i * 3 + 2] = lotusZ * 1.35;

      seeds[i] = Math.random();
      sizes[i] = Math.random() * 0.018 + 0.032;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("aRandomSeed", new THREE.BufferAttribute(seeds, 1));
    geometry.setAttribute("aParticleSize", new THREE.BufferAttribute(sizes, 1));

    // Custom Shader Material for Velvet Specular Starlight Refraction
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uVioletColor: { value: new THREE.Color("#a855f7") },
        uCyanColor: { value: new THREE.Color("#38bdf8") },
        uAmberColor: { value: new THREE.Color("#fbbf24") },
        uTopColor: { value: new THREE.Color("#ffffff") },
      },
      vertexShader: `
        uniform float uTime;
        attribute float aRandomSeed;
        attribute float aParticleSize;

        varying float vHeightRatio;
        varying float vRandom;

        void main() {
          vRandom = aRandomSeed;
          vec3 pos = position;

          // Harmonic breathing oscillation
          pos.y += sin(uTime * 1.2 + aRandomSeed * 6.28) * 0.035;
          pos.x += cos(uTime * 0.9 + aRandomSeed * 3.14) * 0.025;
          pos.z += sin(uTime * 1.1 + aRandomSeed * 4.71) * 0.025;

          vHeightRatio = clamp((pos.y + 0.7) / 1.5, 0.0, 1.0);

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          gl_PointSize = clamp(aParticleSize * (460.0 / -mvPosition.z), 2.5, 7.5);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uVioletColor;
        uniform vec3 uCyanColor;
        uniform vec3 uAmberColor;
        uniform vec3 uTopColor;

        varying float vHeightRatio;
        varying float vRandom;

        void main() {
          vec2 coord = gl_PointCoord - vec2(0.5);
          float dist = length(coord);
          if (dist > 0.5) discard;

          float alpha = smoothstep(0.5, 0.12, dist);

          vec3 baseColor = mix(uVioletColor, uCyanColor, vHeightRatio);
          float amberGlow = sin(uTime * 0.8 + vRandom * 3.14) * 0.5 + 0.5;
          baseColor = mix(baseColor, uAmberColor, amberGlow * 0.25);
          vec3 color = mix(baseColor, uTopColor, vHeightRatio * 0.35);

          gl_FragColor = vec4(color, alpha * 0.82);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    // Animation Loop with Slow Cinematic Orbital Rotation
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      const elapsedTime = clock.getElapsedTime();
      material.uniforms.uTime.value = elapsedTime;

      // Slow orbital rotation
      particles.rotation.y = elapsedTime * 0.08;
      particles.rotation.x = Math.sin(elapsedTime * 0.15) * 0.06 + 0.12;

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 0,
        overflow: "hidden",
      }}
    />
  );
}
