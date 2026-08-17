"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three-stdlib";
import { playKerbRumble } from "@/utils/f1EngineAudio";

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
  currentSector: number; // 1, 2, or 3
  sectorsCrossed: number;
}

interface F1GameCanvasProps {
  isLightsOut?: boolean;
  isMuted?: boolean;
  onTelemetryUpdate?: (data: TelemetryData) => void;
}

interface SmokeParticle {
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  scale: number;
  maxScale: number;
  life: number;
  maxLife: number;
  opacity: number;
}

export default function F1GameCanvas({
  isLightsOut = false,
  isMuted = false,
  onTelemetryUpdate,
}: F1GameCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isLightsOutRef = useRef(isLightsOut);
  const isMutedRef = useRef(isMuted);

  useEffect(() => {
    isLightsOutRef.current = isLightsOut;
  }, [isLightsOut]);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // --- 1. THREE.JS SCENE SETUP (70MM GOTHAM MIDNIGHT ATMOSPHERE) ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020409);
    scene.fog = new THREE.FogExp2(0x020409, 0.0065);

    // RESPONSIVE FULL-CHASSIS CHASE CAMERA (YUTA ABE GOLD STANDARD)
    const isInitMobile = typeof window !== "undefined" && window.innerWidth < 768;
    const initialFOV = isInitMobile ? 58 : 50;
    const initialCamZ = isInitMobile ? 4.9 : 3.6;
    const initialCamY = isInitMobile ? 1.15 : 0.95;

    const camera = new THREE.PerspectiveCamera(
      initialFOV,
      window.innerWidth / window.innerHeight,
      0.1,
      480
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

    // --- 2. HIGH-CONTRAST PRACTICAL STUDIO LIGHTING ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.90);
    scene.add(ambientLight);

    const rimLightLeft = new THREE.DirectionalLight(0xdbeafe, 4.2);
    rimLightLeft.position.set(-8, 14, 4);
    scene.add(rimLightLeft);

    const rimLightRight = new THREE.DirectionalLight(0xdbeafe, 4.2);
    rimLightRight.position.set(8, 14, 4);
    scene.add(rimLightRight);

    const topSpecularLight = new THREE.DirectionalLight(0xffffff, 3.2);
    topSpecularLight.position.set(0, 24, -6);
    scene.add(topSpecularLight);

    // --- 3. 🦇 70MM NOLAN BAT-SIGNAL IN THE MIDNIGHT SKY ---
    // Procedural High-Res Bat-Signal Spotlight Canvas
    const batCanvas = document.createElement("canvas");
    batCanvas.width = 512;
    batCanvas.height = 512;
    const bCtx = batCanvas.getContext("2d");
    if (bCtx) {
      // 1. Soft Volumetric Spotlight Cloud Disk
      const spotGrad = bCtx.createRadialGradient(256, 256, 20, 256, 256, 240);
      spotGrad.addColorStop(0.0, "rgba(235, 245, 255, 0.98)");
      spotGrad.addColorStop(0.3, "rgba(200, 225, 255, 0.85)");
      spotGrad.addColorStop(0.65, "rgba(140, 185, 240, 0.45)");
      spotGrad.addColorStop(0.9, "rgba(70, 120, 200, 0.12)");
      spotGrad.addColorStop(1.0, "rgba(0, 0, 0, 0)");
      bCtx.fillStyle = spotGrad;
      bCtx.beginPath();
      bCtx.arc(256, 256, 250, 0, Math.PI * 2);
      bCtx.fill();

      // 2. Iconic Nolan Bat Silhouette (Precise Vector Geometry)
      bCtx.save();
      bCtx.translate(256, 256);
      bCtx.scale(1.45, 1.45);
      bCtx.fillStyle = "rgba(4, 8, 18, 0.98)";

      bCtx.beginPath();
      // Head and Ears
      bCtx.moveTo(-6, -42);
      bCtx.lineTo(-14, -62); // Left Ear Tip
      bCtx.lineTo(-24, -42);
      // Left Upper Wing Arc
      bCtx.bezierCurveTo(-55, -45, -95, -28, -125, 8);
      // Left Wing Serrations
      bCtx.bezierCurveTo(-110, 25, -90, 42, -75, 42);
      bCtx.bezierCurveTo(-60, 42, -45, 28, -38, 22);
      bCtx.bezierCurveTo(-30, 38, -18, 52, 0, 56); // Tail Tip
      bCtx.bezierCurveTo(18, 52, 30, 38, 38, 22);
      bCtx.bezierCurveTo(45, 28, 60, 42, 75, 42);
      bCtx.bezierCurveTo(90, 42, 110, 25, 125, 8);
      // Right Upper Wing Arc
      bCtx.bezierCurveTo(95, -28, 55, -45, 24, -42);
      bCtx.lineTo(14, -62); // Right Ear Tip
      bCtx.lineTo(6, -42);
      bCtx.closePath();
      bCtx.fill();
      bCtx.restore();
    }

    const batTex = new THREE.CanvasTexture(batCanvas);
    const batMat = new THREE.SpriteMaterial({
      map: batTex,
      transparent: true,
      opacity: 0.92,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const batSignalSprite = new THREE.Sprite(batMat);
    batSignalSprite.position.set(0, 52, -330);
    batSignalSprite.scale.set(42, 42, 1);
    scene.add(batSignalSprite);

    // Volumetric Searchlight Cone from City Rooftops to Sky
    const beamGeo = new THREE.CylinderGeometry(0.8, 32, 210, 24, 1, true);
    beamGeo.rotateX(Math.PI / 2);
    beamGeo.translate(0, 0, -105);

    const beamMat = new THREE.MeshBasicMaterial({
      color: 0x93c5fd,
      transparent: true,
      opacity: 0.065,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const searchlightBeam = new THREE.Mesh(beamGeo, beamMat);
    searchlightBeam.position.set(0, 2, -140);
    searchlightBeam.lookAt(0, 52, -330);
    scene.add(searchlightBeam);

    // Forward Spotlights (Batmobile Tactical LED Headlights)
    const leftHeadlight = new THREE.SpotLight(0xdbeafe, 60, 95, Math.PI / 5, 0.35, 1.2);
    leftHeadlight.position.set(-0.7, 0.45, 0);
    scene.add(leftHeadlight);

    const rightHeadlight = new THREE.SpotLight(0xdbeafe, 60, 95, Math.PI / 5, 0.35, 1.2);
    rightHeadlight.position.set(0.7, 0.45, 0);
    scene.add(rightHeadlight);

    const headlightTarget = new THREE.Object3D();
    headlightTarget.position.set(0, 0.1, -40);
    scene.add(headlightTarget);
    leftHeadlight.target = headlightTarget;
    rightHeadlight.target = headlightTarget;

    // Volumetric Headlight Cones
    const coneGeo = new THREE.ConeGeometry(3.5, 32, 24, 1, true);
    coneGeo.rotateX(Math.PI / 2);
    coneGeo.translate(0, 0, -16);

    const coneMat = new THREE.MeshBasicMaterial({
      color: 0xdbeafe,
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

    // Rear Jet Turbine Exhaust Light & Rain LED
    const rearRainLight = new THREE.PointLight(0xff0033, 14, 12);
    scene.add(rearRainLight);

    const turbineExhaustLight = new THREE.PointLight(0x38bdf8, 0, 14);
    scene.add(turbineExhaustLight);

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

    // Supersonic Afterburner Flame Cone (Turbine Boost Jet)
    const flameGeo = new THREE.ConeGeometry(0.35, 2.4, 16);
    flameGeo.rotateX(-Math.PI / 2);
    flameGeo.translate(0, 0, 1.2);
    const flameMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const afterburnerFlame = new THREE.Mesh(flameGeo, flameMat);
    scene.add(afterburnerFlame);

    // --- 4. ENDLESS WET OBSIDIAN HIGHWAY (PURE MINIMALIST MASTERY) ---
    const roadWidth = 10.4;
    const roadLength = 390.0; // Spans from Z = +30m behind camera to Z = -360m at horizon
    const roadCenterZ = -165.0; // (30 - 360) / 2 = -165
    const roadSegments = 260;

    const roadVertexShader = `
      uniform float uDistance;
      uniform float uCurvature;
      varying vec2 vUv;
      varying float vDepth;
      varying float vWorldX;
      varying float vWorldZ;

      void main() {
        vUv = uv;
        vec3 pos = position;

        // pos.y in local plane geometry: from -195 to +195
        float worldZPos = pos.y + (${roadCenterZ.toFixed(1)});
        float zDist = -worldZPos;
        vWorldZ = zDist;

        // Gentle, majestic cinematic curve
        float curve = sin((zDist + uDistance) * 0.022) * uCurvature * (zDist * 0.010);
        pos.x += curve;
        vWorldX = pos.x;

        vec4 modelViewPosition = modelViewMatrix * vec4(pos, 1.0);
        vDepth = -modelViewPosition.z;
        gl_Position = projectionMatrix * modelViewPosition;
      }
    `;

    const roadFragmentShader = `
      uniform float uDistance;
      uniform float uLightsOut;
      varying vec2 vUv;
      varying float vDepth;
      varying float vWorldX;
      varying float vWorldZ;

      float rand(vec2 n) {
        return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
      }

      void main() {
        float movingDist = vWorldZ + uDistance;
        float grain = rand(vUv * 600.0) * 0.03;

        // Pristine Dark Obsidian Asphalt
        vec3 asphaltColor = vec3(0.024, 0.026, 0.032) + grain;

        // 1. Delicate Pearl-Gold Dashed Centerline
        float centerDist = abs(vUv.x - 0.5);
        float dashPattern = step(0.48, fract(movingDist * 0.08));

        if (centerDist < 0.0035 && dashPattern > 0.5) {
          asphaltColor = mix(asphaltColor, vec3(0.92, 0.78, 0.28), 0.75);
        }

        // 2. Razor-Thin Crisp White Shoulder Lines
        float leftEdge = abs(vUv.x - 0.035);
        float rightEdge = abs(vUv.x - 0.965);

        if (leftEdge < 0.0028 || rightEdge < 0.0028) {
          asphaltColor = vec3(0.95, 0.95, 0.98);
        }

        // 3. 70mm Anamorphic Wet Asphalt Specular Reflections
        float spec = pow(max(0.0, 1.0 - abs(vUv.x - 0.5) * 1.8), 3.5) * 0.28;
        asphaltColor += vec3(spec * 0.22, spec * 0.45, spec * 0.85);

        // Night Mode Headlight Illumination Mask
        if (uLightsOut > 0.01) {
          float headlightMask = smoothstep(130.0, 10.0, vDepth) * smoothstep(5.0, 0.0, abs(vWorldX));
          asphaltColor *= mix(0.10, 1.4, headlightMask);
        }

        // Depth Fog Fade into Infinite Midnight Sky
        float fogFactor = smoothstep(90.0, 320.0, vDepth);
        vec3 finalColor = mix(asphaltColor, vec3(0.02, 0.04, 0.09), fogFactor);

        gl_FragColor = vec4(finalColor, 1.0);
      }
    `;

    const roadUniforms = {
      uDistance: { value: 0 },
      uCurvature: { value: 0.80 },
      uLightsOut: { value: 0.0 },
    };

    const roadGeometry = new THREE.PlaneGeometry(roadWidth, roadLength, 32, roadSegments);
    const roadMaterial = new THREE.ShaderMaterial({
      vertexShader: roadVertexShader,
      fragmentShader: roadFragmentShader,
      uniforms: roadUniforms,
      side: THREE.DoubleSide,
    });

    const roadMesh = new THREE.Mesh(roadGeometry, roadMaterial);
    roadMesh.rotation.x = -Math.PI / 2;
    roadMesh.position.set(0, 0, roadCenterZ);
    scene.add(roadMesh);

    // --- 5. VOLUMETRIC GAUSSIAN TIRE VAPOR & REAR WING VORTEX TRAILS ---
    const smokeCanvas = document.createElement("canvas");
    smokeCanvas.width = 128;
    smokeCanvas.height = 128;
    const smCtx = smokeCanvas.getContext("2d");
    if (smCtx) {
      const grad = smCtx.createRadialGradient(64, 64, 0, 64, 64, 64);
      grad.addColorStop(0, "rgba(220, 230, 255, 0.35)");
      grad.addColorStop(0.4, "rgba(200, 215, 245, 0.18)");
      grad.addColorStop(0.75, "rgba(180, 200, 235, 0.04)");
      grad.addColorStop(1, "rgba(0, 0, 0, 0)");
      smCtx.fillStyle = grad;
      smCtx.fillRect(0, 0, 128, 128);
    }
    const smokeTex = new THREE.CanvasTexture(smokeCanvas);

    const smokeParticleCount = 40;
    const smokeSprites: THREE.Sprite[] = [];
    const smokePool: SmokeParticle[] = [];

    const smokeMat = new THREE.SpriteMaterial({
      map: smokeTex,
      transparent: true,
      opacity: 0,
      blending: THREE.NormalBlending,
      depthWrite: false,
    });

    for (let i = 0; i < smokeParticleCount; i++) {
      const sprite = new THREE.Sprite(smokeMat.clone());
      sprite.scale.set(0, 0, 1);
      scene.add(sprite);
      smokeSprites.push(sprite);

      smokePool.push({
        pos: new THREE.Vector3(0, -10, 0),
        vel: new THREE.Vector3(),
        scale: 0.3,
        maxScale: 2.0,
        life: 0,
        maxLife: 0.7,
        opacity: 0,
      });
    }

    // Diffuser Ground-Effect Contact Shadow
    const shadowCanvas = document.createElement("canvas");
    shadowCanvas.width = 128;
    shadowCanvas.height = 128;
    const shCtx = shadowCanvas.getContext("2d");
    if (shCtx) {
      const grad = shCtx.createRadialGradient(64, 64, 0, 64, 64, 64);
      grad.addColorStop(0, "rgba(0, 0, 0, 0.95)");
      grad.addColorStop(0.5, "rgba(0, 0, 0, 0.65)");
      grad.addColorStop(1, "rgba(0, 0, 0, 0)");
      shCtx.fillStyle = grad;
      shCtx.fillRect(0, 0, 128, 128);
    }
    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
    });
    const groundShadow = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 4.2), shadowMat);
    groundShadow.rotation.x = -Math.PI / 2;
    groundShadow.position.y = 0.025;
    scene.add(groundShadow);

    // --- 6. 🦇 WAYNE ENTERPRISES MATTE STEALTH BATMOBILE 3D MODEL ---
    const carGroup = new THREE.Group();
    scene.add(carGroup);

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

        // Apply Wayne Enterprises Tactical Stealth Armor Finish
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
                // Tactical Military Matte Stealth Armor Plate
                color: originalMat.map ? 0xcccccc : 0x08080b,
                metalness: 0.35,
                roughness: 0.68,
                envMapIntensity: 1.8,
              });
            }
          }
        });

        const carPivot = new THREE.Group();
        carPivot.add(model);
        carPivot.rotation.y = -Math.PI / 2;

        carGroup.add(carPivot);
      },
      undefined,
      (err) => console.error("Error loading Batmobile GLB:", err)
    );

    // --- 7. INTERACTION CONTROLS ---
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
    let trackDistance = 0;

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
      } else if (e.key === "ArrowUp" || e.key === "w" || e.key === "W" || e.key === " " || e.key === "Shift") {
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

    // --- 8. RESIZE HANDLER ---
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

    // --- 9. 60FPS CINEMATIC RENDER LOOP ---
    let animFrameId: number;
    const clock = new THREE.Clock();

    const tick = () => {
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      // 1. Smooth Acceleration Curve
      const targetSpeed = isBoosting ? 365 : 190;
      currentSpeed += (targetSpeed - currentSpeed) * (isBoosting ? 0.08 : 0.045);
      lapTime += delta;

      // 2. WEIGHTED CINEMATIC VELOCITY (PORSCHE / APPLE PACING)
      const forwardDelta = currentSpeed * 0.20 * delta;
      trackDistance += forwardDelta;

      // Road Shader Uniforms
      roadUniforms.uDistance.value = trackDistance;

      const targetLightsOut = isLightsOutRef.current ? 1.0 : 0.0;
      roadUniforms.uLightsOut.value +=
        (targetLightsOut - roadUniforms.uLightsOut.value) * 0.1;

      coneMat.opacity = roadUniforms.uLightsOut.value * (isBoosting ? 0.16 : 0.10);

      // Atmospheric Cloud Pulse on Bat-Signal
      batSignalSprite.material.opacity = 0.88 + Math.sin(time * 1.8) * 0.08;

      // 3. 6-Axis Physics & Flight Aerodynamics
      const trackHalfW = roadWidth / 2 - 0.8;
      const targetSteerX = pointerX * (trackHalfW - 0.6);
      targetCarX = THREE.MathUtils.clamp(targetSteerX, -trackHalfW + 0.2, trackHalfW - 0.2);
      targetCarY = Math.max(0.0, pointerY * 0.85);

      const prevX = carX;
      carX += (targetCarX - carX) * 0.12;
      carY += (targetCarY - carY) * 0.10;
      carSteerVelocity = (carX - prevX) / Math.max(0.001, delta);

      const rollAngle = -carSteerVelocity * 0.038;
      const yawAngle = -carSteerVelocity * 0.022;
      const pitchAngle = pointerY * 0.14;

      carGroup.position.x = carX;
      carGroup.position.y = 0.02 + carY;
      carGroup.position.z = 0;

      // Ground Contact Shadow Follows Car
      groundShadow.position.x = carX;
      groundShadow.position.z = 0;
      groundShadow.material.opacity = Math.max(0.0, 0.85 - carY * 0.8);

      const isFlying = carY > 0.15;
      const onKerb = !isFlying && Math.abs(carX) > trackHalfW - 1.0;
      if (onKerb && Math.random() < 0.08) {
        playKerbRumble(isMutedRef.current);
      }

      const highSpeedShake = !isFlying ? Math.sin(time * 80) * 0.004 * (currentSpeed / 190) : 0;
      carGroup.position.y += Math.abs(highSpeedShake);

      carGroup.rotation.z = THREE.MathUtils.lerp(carGroup.rotation.z, rollAngle, 0.18);
      carGroup.rotation.y = THREE.MathUtils.lerp(carGroup.rotation.y, yawAngle, 0.18);
      carGroup.rotation.x = THREE.MathUtils.lerp(carGroup.rotation.x, pitchAngle, 0.15);

      // Headlight Tracking
      leftHeadlight.position.set(carX - 0.7, 0.45 + carY, -0.2);
      rightHeadlight.position.set(carX + 0.7, 0.45 + carY, -0.2);
      leftVolCone.position.set(carX - 0.7, 0.45 + carY, -0.2);
      rightVolCone.position.set(carX + 0.7, 0.45 + carY, -0.2);
      headlightTarget.position.set(carX + carSteerVelocity * 0.3, 0.1, -40);

      // Rear Rain LED & Lens Flare
      const rainPulse = 10.0 + Math.sin(time * 22) * 6.0;
      rearRainLight.position.set(carX, 0.38 + carY, 1.4);
      rearRainLight.intensity = rainPulse;

      rainFlareSprite.position.set(carX, 0.38 + carY, 1.42);
      rainFlareSprite.material.opacity = 0.6 + Math.sin(time * 22) * 0.35;
      const flareScale = 0.65 + Math.sin(time * 22) * 0.15;
      rainFlareSprite.scale.set(flareScale, flareScale, 1);

      // 4. Supersonic Afterburner Turbine Boost Jet Flame
      afterburnerFlame.position.set(carX, 0.36 + carY, 1.35);
      const targetFlameOpacity = isBoosting ? 0.90 + Math.sin(time * 45) * 0.10 : 0.0;
      flameMat.opacity += (targetFlameOpacity - flameMat.opacity) * 0.2;
      const targetFlameLength = isBoosting ? 1.0 + Math.sin(time * 30) * 0.25 : 0.1;
      afterburnerFlame.scale.set(1, 1, targetFlameLength);

      turbineExhaustLight.position.set(carX, 0.36 + carY, 2.0);
      turbineExhaustLight.intensity = isBoosting ? 16 + Math.sin(time * 40) * 4 : 0;

      // 5. Volumetric Gaussian Tire Mist / Smoke Updates
      const isSmokeActive = (!isFlying && onKerb) || Math.abs(carSteerVelocity) > 2.8 || isBoosting;

      for (let i = 0; i < smokeParticleCount; i++) {
        const p = smokePool[i];
        const sp = smokeSprites[i];

        if (p.life <= 0 && isSmokeActive && Math.random() < 0.4) {
          const isLeft = Math.random() > 0.5;
          const spawnX = isLeft ? carX - 0.88 : carX + 0.88;
          p.pos.set(spawnX + (Math.random() - 0.5) * 0.15, 0.14 + carY, 1.25);
          p.vel.set(
            (Math.random() - 0.5) * 0.6 - carSteerVelocity * 0.15,
            Math.random() * 0.4 + 0.15,
            currentSpeed * 0.04 + Math.random() * 2.0
          );
          p.scale = 0.35;
          p.maxScale = Math.random() * 1.4 + 1.2;
          p.life = Math.random() * 0.25 + 0.55;
          p.maxLife = p.life;
          p.opacity = 0.30;
        } else if (p.life > 0) {
          p.life -= delta;
          const progress = 1.0 - p.life / p.maxLife;

          p.pos.addScaledVector(p.vel, delta);
          p.scale = THREE.MathUtils.lerp(0.35, p.maxScale, progress);
          p.opacity = (1.0 - progress) * 0.30;

          sp.position.copy(p.pos);
          sp.scale.set(p.scale, p.scale, 1);
          sp.material.opacity = p.opacity;
        } else {
          sp.material.opacity = 0;
        }
      }

      // 6. Responsive Full-Chassis Chase Camera (Yuta Abe Gold Standard)
      const isMobile = window.innerWidth < 768;
      const baseCamZ = isMobile ? 4.9 : 3.6;
      const baseCamY = isMobile ? 1.15 : 0.95;

      const camTargetX = carX * 0.32;
      const camTargetY = baseCamY + (carY * 0.45) + (isBoosting ? -0.08 : 0);
      const camTargetZ = baseCamZ + (isBoosting ? 0.35 : 0);

      camera.position.x += (camTargetX - camera.position.x) * 0.11;
      camera.position.y += (camTargetY - camera.position.y) * 0.11;
      camera.position.z += (camTargetZ - camera.position.z) * 0.11;

      // Dynamic Speed Perspective Warp
      const baseFOV = isMobile ? 58 : 50;
      const targetFOV = isBoosting ? baseFOV + 12 : baseFOV;
      camera.fov += (targetFOV - camera.fov) * 0.08;
      camera.updateProjectionMatrix();

      camera.lookAt(carX * 0.15, 0.4 + (carY * 0.25), -14);

      // 7. Telemetry Callback
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
        const sectorCycle = Math.floor((lapTime % 90) / 30) + 1;

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
          currentSector: sectorCycle,
          sectorsCrossed: Math.floor(lapTime / 30),
        });
      }

      // 8. Render Scene
      renderer.render(scene, camera);
      animFrameId = requestAnimationFrame(tick);
    };

    animFrameId = requestAnimationFrame(tick);

    // --- 9. CLEANUP ON UNMOUNT ---
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
      coneGeo.dispose();
      coneMat.dispose();
      flareMat.dispose();
      flareTex.dispose();
      smokeTex.dispose();
      smokeMat.dispose();
      shadowTex.dispose();
      shadowMat.dispose();
      batTex.dispose();
      batMat.dispose();
      beamGeo.dispose();
      beamMat.dispose();
      flameGeo.dispose();
      flameMat.dispose();
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
