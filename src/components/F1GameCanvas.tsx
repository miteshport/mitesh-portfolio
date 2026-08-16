"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export interface TelemetryData {
  speed: number;
  gear: number;
  rpm: number;
  lapTime: number;
  isBoosting: boolean;
  isDrifting: boolean;
  isFlying: boolean;
  isLightsOut: boolean;
  onKerb: boolean;
}

interface F1GameCanvasProps {
  isLightsOut: boolean;
  onTelemetryUpdate?: (data: TelemetryData) => void;
}

export default function F1GameCanvas({
  isLightsOut,
  onTelemetryUpdate,
}: F1GameCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isLightsOutRef = useRef(isLightsOut);

  useEffect(() => {
    isLightsOutRef.current = isLightsOut;
  }, [isLightsOut]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // --- 1. PITCH OBSIDIAN SCENE & HIGH CONTRAST SETUP ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    scene.fog = new THREE.FogExp2(0x000000, 0.02);

    // ULTRA CLOSE-UP COCKPIT / REAR-WING IMAX CAMERA
    const isInitMobile = typeof window !== "undefined" && window.innerWidth < 768;
    const initialFOV = isInitMobile ? 58 : 50;
    const initialCamZ = isInitMobile ? 4.9 : 3.6;
    const initialCamY = isInitMobile ? 1.15 : 0.95;

    const camera = new THREE.PerspectiveCamera(
      initialFOV,
      window.innerWidth / window.innerHeight,
      0.1,
      280
    );
    camera.position.set(0, initialCamY, initialCamZ);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // --- 2. HIGH-CONTRAST STUDIO LIGHTING RIG ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    scene.add(ambientLight);

    // Dual Sharp Rim Lights for Mirror Specular Edge Reflections
    const rimLightLeft = new THREE.DirectionalLight(0xffffff, 4.2);
    rimLightLeft.position.set(-8, 12, 4);
    scene.add(rimLightLeft);

    const rimLightRight = new THREE.DirectionalLight(0xffffff, 4.2);
    rimLightRight.position.set(8, 12, 4);
    scene.add(rimLightRight);

    const topSpecularLight = new THREE.DirectionalLight(0xffffff, 3.2);
    topSpecularLight.position.set(0, 20, -6);
    scene.add(topSpecularLight);

    // Forward Spotlights (Headlights)
    const leftHeadlight = new THREE.SpotLight(0x38bdf8, 55, 75, Math.PI / 5, 0.35, 1.2);
    leftHeadlight.position.set(-0.7, 0.45, 0);
    scene.add(leftHeadlight);

    const rightHeadlight = new THREE.SpotLight(0x38bdf8, 55, 75, Math.PI / 5, 0.35, 1.2);
    rightHeadlight.position.set(0.7, 0.45, 0);
    scene.add(rightHeadlight);

    const headlightTarget = new THREE.Object3D();
    headlightTarget.position.set(0, 0.1, -40);
    scene.add(headlightTarget);
    leftHeadlight.target = headlightTarget;
    rightHeadlight.target = headlightTarget;

    // Volumetric 3D Headlight Cones (Hollywood Night Ray Effect)
    const coneGeo = new THREE.ConeGeometry(3.5, 30, 24, 1, true);
    coneGeo.rotateX(Math.PI / 2);
    coneGeo.translate(0, 0, -15);

    const coneMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    const leftVolCone = new THREE.Mesh(coneGeo, coneMat);
    scene.add(leftVolCone);

    const rightVolCone = new THREE.Mesh(coneGeo, coneMat);
    scene.add(rightVolCone);

    // Rear Rain Light (Red LED Pulse)
    const rearRainLight = new THREE.PointLight(0xff0033, 14, 12);
    scene.add(rearRainLight);

    // Luminous Rear Lens Flare Sprite
    const flareCanvas = document.createElement("canvas");
    flareCanvas.width = 64;
    flareCanvas.height = 64;
    const fCtx = flareCanvas.getContext("2d");
    if (fCtx) {
      const grad = fCtx.createRadialGradient(32, 32, 0, 32, 32, 32);
      grad.addColorStop(0, "rgba(255, 0, 50, 1)");
      grad.addColorStop(0.3, "rgba(255, 50, 50, 0.6)");
      grad.addColorStop(1, "rgba(0, 0, 0, 0)");
      fCtx.fillStyle = grad;
      fCtx.fillRect(0, 0, 64, 64);
    }
    const flareTex = new THREE.CanvasTexture(flareCanvas);
    const flareMat = new THREE.SpriteMaterial({
      map: flareTex,
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: 0.9,
    });
    const rainFlareSprite = new THREE.Sprite(flareMat);
    rainFlareSprite.scale.set(0.7, 0.7, 1);
    scene.add(rainFlareSprite);

    // --- 3. PROCEDURAL ENDLESS ASPHALT ROAD SHADER WITH HEAT HAZE ---
    const roadWidth = 9.8;
    const roadLength = 200.0;
    const roadSegments = 190;

    const roadVertexShader = `
      uniform float uTime;
      uniform float uCurvature;
      varying vec2 vUv;
      varying float vDepth;
      varying float vWorldX;

      void main() {
        vUv = uv;
        vec3 pos = position;

        float zDist = -pos.y;
        float curve = sin(zDist * 0.035 + uTime * 1.5) * uCurvature * (zDist * 0.015);
        pos.x += curve;
        vWorldX = pos.x;

        vec4 modelViewPosition = modelViewMatrix * vec4(pos, 1.0);
        vDepth = -modelViewPosition.z;
        gl_Position = projectionMatrix * modelViewPosition;
      }
    `;

    const roadFragmentShader = `
      uniform float uTime;
      uniform float uSpeed;
      uniform float uLightsOut;
      varying vec2 vUv;
      varying float vDepth;
      varying float vWorldX;

      void main() {
        float scrollY = vUv.y * 45.0 + uTime * uSpeed * 0.5;

        // 1. Wet Mirror Asphalt Base with Heat Mirage
        vec3 asphaltColor = vec3(0.018, 0.018, 0.024);
        
        // Heat haze wave displacement on distant road
        float heatHaze = sin(vUv.x * 60.0 + uTime * 8.0) * sin(vUv.y * 40.0 + uTime * 6.0) * smoothstep(60.0, 160.0, vDepth) * 0.02;
        asphaltColor += heatHaze;

        // Fine asphalt noise grain
        float grain = fract(sin(dot(vUv * 220.0, vec2(12.9898, 78.233))) * 43758.5453);
        asphaltColor += (grain - 0.5) * 0.012;

        // 2. White Boundary Lines
        float borderDist = abs(vUv.x - 0.5) * 2.0;
        float isBorderLine = smoothstep(0.92, 0.935, borderDist) - smoothstep(0.955, 0.97, borderDist);
        vec3 borderLineColor = vec3(1.0, 1.0, 1.0) * isBorderLine * 1.5;

        // 3. Central Dashed Yellow Divider
        float isCenter = smoothstep(0.022, 0.0, abs(vUv.x - 0.5));
        float dashPattern = step(0.45, fract(scrollY * 0.4));
        vec3 centerLineColor = vec3(1.0, 0.85, 0.1) * isCenter * dashPattern * 1.8;

        // Combine
        vec3 finalColor = asphaltColor + borderLineColor + centerLineColor;

        // Distance Fog (Pitch Obsidian Fade)
        float fogFactor = smoothstep(20.0, 170.0, vDepth);
        vec3 fogColor = vec3(0.0, 0.0, 0.0);

        gl_FragColor = vec4(mix(finalColor, fogColor, fogFactor), 1.0);
      }
    `;

    const roadUniforms = {
      uTime: { value: 0 },
      uCurvature: { value: 5.2 },
      uSpeed: { value: 22.0 },
      uLightsOut: { value: 0.0 },
    };

    const roadGeometry = new THREE.PlaneGeometry(
      roadWidth,
      roadLength,
      32,
      roadSegments
    );
    roadGeometry.rotateX(-Math.PI / 2);
    roadGeometry.translate(0, 0, -roadLength / 2 + 5);

    const roadMaterial = new THREE.ShaderMaterial({
      vertexShader: roadVertexShader,
      fragmentShader: roadFragmentShader,
      uniforms: roadUniforms,
      side: THREE.DoubleSide,
    });

    const roadMesh = new THREE.Mesh(roadGeometry, roadMaterial);
    roadMesh.receiveShadow = true;
    scene.add(roadMesh);

    // --- 4. REAL 3D ELEVATED RED & WHITE RUMBLE KERB BLOCKS ---
    const kerbBlockCount = 85;
    const kerbWidth = 0.55;
    const kerbHeight = 0.28;
    const kerbLength = 1.3;
    const kerbGap = 1.8;

    const kerbBoxGeo = new THREE.BoxGeometry(kerbWidth, kerbHeight, kerbLength);
    const redKerbMat = new THREE.MeshStandardMaterial({
      color: 0xee1111,
      roughness: 0.2,
      metalness: 0.15,
      emissive: 0x330000,
    });
    const whiteKerbMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.2,
      metalness: 0.15,
      emissive: 0x222222,
    });

    const leftKerbs: THREE.Mesh[] = [];
    const rightKerbs: THREE.Mesh[] = [];

    for (let i = 0; i < kerbBlockCount; i++) {
      const mat = i % 2 === 0 ? redKerbMat : whiteKerbMat;

      const leftBlock = new THREE.Mesh(kerbBoxGeo, mat);
      leftBlock.castShadow = true;
      leftBlock.receiveShadow = true;
      scene.add(leftBlock);
      leftKerbs.push(leftBlock);

      const rightBlock = new THREE.Mesh(kerbBoxGeo, mat);
      rightBlock.castShadow = true;
      rightBlock.receiveShadow = true;
      scene.add(rightBlock);
      rightKerbs.push(rightBlock);
    }

    // --- 5. GOLDEN LASER TRAJECTORY STREAKS UNDER WHEELS ---
    const streakCount = 220;
    const streakPositions = new Float32Array(streakCount * 6);
    const streakVelocities = new Float32Array(streakCount);

    for (let i = 0; i < streakCount; i++) {
      const isLeft = i % 2 === 0;
      const x = isLeft ? -0.95 + (Math.random() - 0.5) * 0.35 : 0.95 + (Math.random() - 0.5) * 0.35;
      const y = Math.random() * 0.15 + 0.05;
      const z = -Math.random() * roadLength;
      const len = Math.random() * 6.0 + 3.5;

      streakPositions[i * 6 + 0] = x;
      streakPositions[i * 6 + 1] = y;
      streakPositions[i * 6 + 2] = z;

      streakPositions[i * 6 + 3] = x;
      streakPositions[i * 6 + 4] = y;
      streakPositions[i * 6 + 5] = z + len;

      streakVelocities[i] = Math.random() * 60 + 100;
    }

    const streakGeo = new THREE.BufferGeometry();
    streakGeo.setAttribute(
      "position",
      new THREE.BufferAttribute(streakPositions, 3)
    );

    const streakMat = new THREE.LineBasicMaterial({
      color: 0xffd700,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      linewidth: 2,
    });

    const streakLines = new THREE.LineSegments(streakGeo, streakMat);
    scene.add(streakLines);

    // --- 6. DIFFUSER SPARKS PARTICLE SYSTEM ---
    const sparkCount = 160;
    const sparkPositions = new Float32Array(sparkCount * 3);
    const sparkVelocities: THREE.Vector3[] = [];
    const sparkLifetimes = new Float32Array(sparkCount);

    for (let i = 0; i < sparkCount; i++) {
      sparkPositions[i * 3 + 0] = 0;
      sparkPositions[i * 3 + 1] = 0;
      sparkPositions[i * 3 + 2] = 0;
      sparkVelocities.push(new THREE.Vector3());
      sparkLifetimes[i] = 0;
    }

    const sparkGeo = new THREE.BufferGeometry();
    sparkGeo.setAttribute(
      "position",
      new THREE.BufferAttribute(sparkPositions, 3)
    );

    const sparkMat = new THREE.PointsMaterial({
      color: 0xffaa00,
      size: 0.18,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
    });

    const sparkPoints = new THREE.Points(sparkGeo, sparkMat);
    scene.add(sparkPoints);

    // --- 7. 3D F1 CAR MODEL LOADING & RIGGING ---
    const carGroup = new THREE.Group();
    scene.add(carGroup);

    let isCarLoaded = false;
    const loader = new GLTFLoader();

    loader.load(
      "/models/f1_car.glb",
      (gltf) => {
        const model = gltf.scene;

        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());

        model.position.x = -center.x;
        model.position.y = -box.min.y;
        model.position.z = -center.z;

        const maxDim = Math.max(size.x, size.y, size.z);
        const targetScale = 3.8 / maxDim;
        model.scale.set(targetScale, targetScale, targetScale);

        // Apply High-Gloss Obsidian Chrome PBR Finish
        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.castShadow = true;
            mesh.receiveShadow = true;

            if (mesh.material) {
              const originalMat = mesh.material as THREE.MeshStandardMaterial;
              mesh.material = new THREE.MeshStandardMaterial({
                map: originalMat.map || null,
                normalMap: originalMat.normalMap || null,
                roughnessMap: originalMat.roughnessMap || null,
                color: originalMat.map ? 0xffffff : 0x111115,
                metalness: 0.96,
                roughness: 0.10,
                envMapIntensity: 2.6,
              });
            }
          }
        });

        const carPivot = new THREE.Group();
        carPivot.add(model);
        carPivot.rotation.y = -Math.PI / 2;

        carGroup.add(carPivot);
        isCarLoaded = true;
      },
      undefined,
      (err) => {
        console.error("Error loading F1 car GLB:", err);
      }
    );

    // --- 8. 6-AXIS RACING & AERODYNAMIC FLIGHT PHYSICS ENGINE ---
    let pointerX = 0;
    let pointerY = 0;
    let targetCarX = 0;
    let targetCarY = 0;
    let carX = 0;
    let carY = 0;
    let carSteerVelocity = 0;
    let baseSpeed = 190;
    let currentSpeed = baseSpeed;
    let isBoosting = false;
    let lapTime = 0;

    const handlePointerMove = (e: PointerEvent) => {
      pointerX = (e.clientX / window.innerWidth - 0.5) * 2.0;
      pointerY = (e.clientY / window.innerHeight - 0.5) * 2.0;
    };

    const handlePointerDown = () => {
      isBoosting = true;
    };

    const handlePointerUp = () => {
      isBoosting = false;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        pointerX = Math.max(-1.0, pointerX - 0.25);
      } else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        pointerX = Math.min(1.0, pointerX + 0.25);
      } else if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") {
        pointerY = Math.max(-1.0, pointerY - 0.25);
        isBoosting = true;
      } else if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") {
        pointerY = Math.min(1.0, pointerY + 0.25);
      } else if (e.key === " " || e.key === "Shift") {
        isBoosting = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp" || e.key === "w" || e.key === "W" || e.key === " " || e.key === "Shift") {
        isBoosting = false;
      }
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    // --- 9. RESIZE HANDLER ---
    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const isMob = w < 768;
      camera.aspect = w / h;
      camera.fov = isMob ? 58 : 50;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    // --- 10. 60FPS CINEMATIC RENDER LOOP ---
    let animFrameId: number;
    const clock = new THREE.Clock();

    const tick = () => {
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      // 1. Acceleration & Deceleration Curve
      const targetSpeed = isBoosting ? 365 : 190;
      currentSpeed += (targetSpeed - currentSpeed) * (isBoosting ? 0.08 : 0.045);
      lapTime += delta;

      // 2. Road Shader Uniforms
      roadUniforms.uTime.value = time;
      roadUniforms.uSpeed.value = currentSpeed * 0.085;

      const targetLightsOut = isLightsOutRef.current ? 1.0 : 0.0;
      roadUniforms.uLightsOut.value +=
        (targetLightsOut - roadUniforms.uLightsOut.value) * 0.1;

      // Volumetric Headlight Cones Opacity in Night Mode
      coneMat.opacity = roadUniforms.uLightsOut.value * (isBoosting ? 0.16 : 0.10);

      // 3. Update 3D Elevated Rumble Kerb Blocks
      const kerbScrollOffset = (time * currentSpeed * 0.085 * 3.5) % kerbGap;
      const trackHalfW = roadWidth / 2 - 0.2;

      for (let i = 0; i < kerbBlockCount; i++) {
        const zDist = i * kerbGap - kerbScrollOffset;
        const curveOffset =
          Math.sin(zDist * 0.035 + time * 1.5) *
          roadUniforms.uCurvature.value *
          (zDist * 0.015);

        leftKerbs[i].position.set(-trackHalfW + curveOffset, kerbHeight / 2, -zDist);
        leftKerbs[i].rotation.y = curveOffset * 0.02;

        rightKerbs[i].position.set(trackHalfW + curveOffset, kerbHeight / 2, -zDist);
        rightKerbs[i].rotation.y = curveOffset * 0.02;
      }

      // 4. Lateral Steering & Aerodynamic Flight Physics
      const maxTrackX = trackHalfW - 1.1;
      targetCarX = pointerX * maxTrackX;
      targetCarY = Math.max(0.0, pointerY * 0.85);

      const prevX = carX;
      carX += (targetCarX - carX) * 0.12;
      carY += (targetCarY - carY) * 0.09;
      carSteerVelocity = (carX - prevX) / (delta || 0.016);

      const rollAngle = -carSteerVelocity * 0.038;
      const yawAngle = carSteerVelocity * 0.028;
      const pitchAngle = (pointerY * 0.14) + (isBoosting ? -0.05 : 0.03);

      carGroup.position.x = carX;
      carGroup.position.y = 0.02 + carY;
      carGroup.position.z = 0;

      const isFlying = carY > 0.15;
      const onKerb = !isFlying && Math.abs(carX) > trackHalfW - 1.6;
      const highSpeedShake = !isFlying ? Math.sin(time * 80) * 0.006 * (currentSpeed / 190) : 0;
      const kerbVibration = onKerb ? Math.sin(time * 110) * 0.028 : 0;
      carGroup.position.y += Math.abs(highSpeedShake + kerbVibration);

      carGroup.rotation.z = THREE.MathUtils.lerp(carGroup.rotation.z, rollAngle, 0.18);
      carGroup.rotation.y = THREE.MathUtils.lerp(carGroup.rotation.y, yawAngle, 0.18);
      carGroup.rotation.x = THREE.MathUtils.lerp(carGroup.rotation.x, pitchAngle, 0.15);

      // Spotlight / Volumetric Cones tracking
      leftHeadlight.position.set(carX - 0.7, 0.45 + carY, -0.2);
      rightHeadlight.position.set(carX + 0.7, 0.45 + carY, -0.2);
      leftVolCone.position.set(carX - 0.7, 0.45 + carY, -0.2);
      rightVolCone.position.set(carX + 0.7, 0.45 + carY, -0.2);
      headlightTarget.position.set(carX + carSteerVelocity * 0.3, 0.1, -40);

      // Rear Rain LED & Lens Flare Pulse
      const rainPulse = 10.0 + Math.sin(time * 22) * 6.0;
      rearRainLight.position.set(carX, 0.38 + carY, 1.4);
      rearRainLight.intensity = rainPulse;

      rainFlareSprite.position.set(carX, 0.38 + carY, 1.42);
      rainFlareSprite.material.opacity = 0.6 + Math.sin(time * 22) * 0.35;
      const flareScale = 0.65 + Math.sin(time * 22) * 0.15;
      rainFlareSprite.scale.set(flareScale, flareScale, 1);

      // 5. Responsive Full-Chassis Chase Camera (Matches Yuta Abe's Full-Glory View)
      const isMobile = window.innerWidth < 768;
      const baseCamZ = isMobile ? 4.9 : 3.6;
      const baseCamY = isMobile ? 1.15 : 0.95;

      const camTargetX = carX * 0.32;
      const camTargetY = baseCamY + (carY * 0.45) + (isBoosting ? -0.08 : 0) + kerbVibration * 0.2;
      const camTargetZ = baseCamZ + (isBoosting ? 0.35 : 0);

      camera.position.x += (camTargetX - camera.position.x) * 0.11;
      camera.position.y += (camTargetY - camera.position.y) * 0.11;
      camera.position.z += (camTargetZ - camera.position.z) * 0.11;

      // Dynamic Speed Perspective Warp
      const baseFOV = isMobile ? 58 : 50;
      const targetFOV = isBoosting ? baseFOV + 16 : baseFOV;
      camera.fov += (targetFOV - camera.fov) * 0.08;
      camera.updateProjectionMatrix();

      camera.lookAt(carX * 0.15, 0.4 + (carY * 0.25), -14);

      // 6. Update Golden Laser Trajectory Streaks
      const streakPos = streakGeo.attributes.position.array as Float32Array;
      const speedMultiplier = (currentSpeed / 190) * 2.2;

      for (let i = 0; i < streakCount; i++) {
        streakPos[i * 6 + 2] += streakVelocities[i] * delta * speedMultiplier;
        streakPos[i * 6 + 5] += streakVelocities[i] * delta * speedMultiplier;

        if (streakPos[i * 6 + 2] > 5) {
          const zNew = -roadLength + Math.random() * 25;
          const isLeft = i % 2 === 0;
          const xNew = (isLeft ? -0.95 : 0.95) + (Math.random() - 0.5) * 0.5 + (carX * 0.85);
          const yNew = Math.random() * 0.14 + 0.04;
          const len = Math.random() * 6.5 + 4.0;

          streakPos[i * 6 + 0] = xNew;
          streakPos[i * 6 + 1] = yNew;
          streakPos[i * 6 + 2] = zNew;

          streakPos[i * 6 + 3] = xNew;
          streakPos[i * 6 + 4] = yNew;
          streakPos[i * 6 + 5] = zNew + len;
        }
      }
      streakGeo.attributes.position.needsUpdate = true;

      // 7. Spawn Diffuser Sparks during Boost / Hard Cornering / Kerb Contact
      const isSparksActive = (!isFlying && onKerb) || Math.abs(carSteerVelocity) > 3.6 || isBoosting;
      const sparkPosArray = sparkGeo.attributes.position.array as Float32Array;

      for (let i = 0; i < sparkCount; i++) {
        if (sparkLifetimes[i] <= 0 && isSparksActive && Math.random() < 0.35) {
          sparkPosArray[i * 3 + 0] = carX + (Math.random() - 0.5) * 0.4;
          sparkPosArray[i * 3 + 1] = 0.05 + carY;
          sparkPosArray[i * 3 + 2] = 1.1;

          sparkVelocities[i].set(
            (Math.random() - 0.5) * 5.0,
            Math.random() * 3.5 + 1.2,
            Math.random() * 18.0 + 25.0
          );
          sparkLifetimes[i] = Math.random() * 0.35 + 0.1;
        } else if (sparkLifetimes[i] > 0) {
          sparkLifetimes[i] -= delta;
          sparkVelocities[i].y -= 9.8 * delta;

          sparkPosArray[i * 3 + 0] += sparkVelocities[i].x * delta;
          sparkPosArray[i * 3 + 1] = Math.max(0.02, sparkPosArray[i * 3 + 1] + sparkVelocities[i].y * delta);
          sparkPosArray[i * 3 + 2] += sparkVelocities[i].z * delta;
        } else {
          sparkPosArray[i * 3 + 1] = -10;
        }
      }
      sparkGeo.attributes.position.needsUpdate = true;

      // 8. Telemetry Callback to Parent UI
      if (onTelemetryUpdate) {
        const gear =
          currentSpeed < 80
            ? 2
            : currentSpeed < 130
            ? 3
            : currentSpeed < 185
            ? 4
            : currentSpeed < 240
            ? 5
            : currentSpeed < 295
            ? 6
            : currentSpeed < 340
            ? 7
            : 8;
        const rpm = Math.floor(
          10500 + (currentSpeed % 50) * 110 + (isBoosting ? 2400 : 0)
        );

        onTelemetryUpdate({
          speed: Math.round(currentSpeed),
          gear,
          rpm,
          lapTime,
          isBoosting,
          isDrifting: Math.abs(carSteerVelocity) > 3.6,
          isFlying,
          isLightsOut: isLightsOutRef.current,
          onKerb,
        });
      }

      // 9. Render Scene
      renderer.render(scene, camera);
      animFrameId = requestAnimationFrame(tick);
    };

    animFrameId = requestAnimationFrame(tick);

    // --- 11. CLEANUP ON UNMOUNT ---
    return () => {
      cancelAnimationFrame(animFrameId);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("resize", handleResize);

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      roadGeometry.dispose();
      roadMaterial.dispose();
      kerbBoxGeo.dispose();
      redKerbMat.dispose();
      whiteKerbMat.dispose();
      streakGeo.dispose();
      streakMat.dispose();
      sparkGeo.dispose();
      sparkMat.dispose();
      coneGeo.dispose();
      coneMat.dispose();
      flareMat.dispose();
      flareTex.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100dvh",
        zIndex: 0,
        touchAction: "none",
        userSelect: "none",
        cursor: "grab",
      }}
    />
  );
}
