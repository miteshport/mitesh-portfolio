"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three-stdlib";
import { playSonicPulse, playKerbRumble } from "@/utils/f1EngineAudio";

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

interface SectorGate {
  sectorIndex: number;
  name: string;
  code: string;
  color: number;
  mesh: THREE.Group;
  baseZ: number;
  triggered: boolean;
}

interface LightMonolith {
  mesh: THREE.Group;
  baseZ: number;
  side: number; // -1: Left, +1: Right
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

    // --- 1. THREE.JS SCENE SETUP ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000002);
    scene.fog = new THREE.FogExp2(0x000002, 0.010);

    // RESPONSIVE FULL-CHASSIS CHASE CAMERA (YUTA ABE GOLD STANDARD)
    const isInitMobile = typeof window !== "undefined" && window.innerWidth < 768;
    const initialFOV = isInitMobile ? 58 : 50;
    const initialCamZ = isInitMobile ? 4.9 : 3.6;
    const initialCamY = isInitMobile ? 1.15 : 0.95;

    const camera = new THREE.PerspectiveCamera(
      initialFOV,
      window.innerWidth / window.innerHeight,
      0.1,
      420
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
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const rimLightLeft = new THREE.DirectionalLight(0xffffff, 4.5);
    rimLightLeft.position.set(-8, 14, 4);
    scene.add(rimLightLeft);

    const rimLightRight = new THREE.DirectionalLight(0xffffff, 4.5);
    rimLightRight.position.set(8, 14, 4);
    scene.add(rimLightRight);

    const topSpecularLight = new THREE.DirectionalLight(0xffffff, 3.5);
    topSpecularLight.position.set(0, 24, -6);
    scene.add(topSpecularLight);

    // Forward Spotlights (Headlights)
    const leftHeadlight = new THREE.SpotLight(0x38bdf8, 55, 85, Math.PI / 5, 0.35, 1.2);
    leftHeadlight.position.set(-0.7, 0.45, 0);
    scene.add(leftHeadlight);

    const rightHeadlight = new THREE.SpotLight(0x38bdf8, 55, 85, Math.PI / 5, 0.35, 1.2);
    rightHeadlight.position.set(0.7, 0.45, 0);
    scene.add(rightHeadlight);

    const headlightTarget = new THREE.Object3D();
    headlightTarget.position.set(0, 0.1, -40);
    scene.add(headlightTarget);
    leftHeadlight.target = headlightTarget;
    rightHeadlight.target = headlightTarget;

    // Volumetric 3D Headlight Cones
    const coneGeo = new THREE.ConeGeometry(3.5, 32, 24, 1, true);
    coneGeo.rotateX(Math.PI / 2);
    coneGeo.translate(0, 0, -16);

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

    // --- 3. UNIFIED PROCEDURAL HIGHWAY SHADER (100% ZERO-SLIPPAGE SYNCHRONIZATION) ---
    const roadWidth = 10.6;
    const roadLength = 280.0;
    const roadSegments = 220;

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

        float zDist = -pos.y;
        vWorldZ = zDist;

        // Unified Spatial Curvature Equation
        float curve = sin((zDist + uDistance) * 0.035) * uCurvature * (zDist * 0.015);
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
        // Master Unified Texture Coordinate (Matched 100% to World Distance)
        float movingDist = vWorldZ + uDistance;
        float grain = rand(vUv * 600.0) * 0.05;

        // Rich Dark Obsidian Asphalt
        vec3 asphaltColor = vec3(0.030, 0.030, 0.036) + grain;

        // 3-Lane Highway Dashed Centerlines (Warm Gold) - Locked to uDistance
        float laneLeft = abs(vUv.x - 0.35);
        float laneRight = abs(vUv.x - 0.65);
        float dashPattern = step(0.42, fract(movingDist * 0.18));

        if ((laneLeft < 0.0075 || laneRight < 0.0075) && dashPattern > 0.5) {
          asphaltColor = vec3(0.95, 0.82, 0.22);
        }

        // Solid Outer Guard Lines (Pure White)
        if (vUv.x < 0.032 || vUv.x > 0.968) {
          asphaltColor = vec3(0.95, 0.95, 0.98);
        }

        // Anamorphic Wet Road Reflections
        float spec = pow(max(0.0, 1.0 - abs(vUv.x - 0.5) * 1.8), 4.0) * 0.25;
        asphaltColor += vec3(spec * 0.2, spec * 0.45, spec * 0.85);

        // Night Mode Headlight Illumination Mask
        if (uLightsOut > 0.01) {
          float headlightMask = smoothstep(130.0, 10.0, vDepth) * smoothstep(5.0, 0.0, abs(vWorldX));
          asphaltColor *= mix(0.10, 1.4, headlightMask);
        }

        // Depth Fog Fade into Infinite Horizon
        float fogFactor = smoothstep(80.0, 260.0, vDepth);
        vec3 finalColor = mix(asphaltColor, vec3(0.0, 0.0, 0.002), fogFactor);

        gl_FragColor = vec4(finalColor, 1.0);
      }
    `;

    const roadUniforms = {
      uDistance: { value: 0 },
      uCurvature: { value: 0.85 },
      uLightsOut: { value: 0.0 },
    };

    const roadGeometry = new THREE.PlaneGeometry(roadWidth, roadLength, 48, roadSegments);
    const roadMaterial = new THREE.ShaderMaterial({
      vertexShader: roadVertexShader,
      fragmentShader: roadFragmentShader,
      uniforms: roadUniforms,
      side: THREE.DoubleSide,
    });

    const roadMesh = new THREE.Mesh(roadGeometry, roadMaterial);
    roadMesh.rotation.x = -Math.PI / 2;
    roadMesh.position.set(0, 0, -roadLength / 2);
    scene.add(roadMesh);

    // --- 4. 3D ELEVATED RED & WHITE RUMBLE KERBS (LOCKED TO UNIFIED DISTANCE) ---
    const kerbBlockCount = 90;
    const kerbLength = 1.4;
    const kerbGap = 2.4;
    const kerbBoxGeo = new THREE.BoxGeometry(0.5, 0.12, kerbLength);

    const redKerbMat = new THREE.MeshStandardMaterial({
      color: 0xdd1122,
      roughness: 0.35,
      metalness: 0.1,
    });
    const whiteKerbMat = new THREE.MeshStandardMaterial({
      color: 0xeeeeee,
      roughness: 0.35,
      metalness: 0.1,
    });

    const leftKerbs: THREE.Mesh[] = [];
    const rightKerbs: THREE.Mesh[] = [];

    for (let i = 0; i < kerbBlockCount; i++) {
      const isRed = i % 2 === 0;
      const mat = isRed ? redKerbMat : whiteKerbMat;

      const lKerb = new THREE.Mesh(kerbBoxGeo, mat);
      const rKerb = new THREE.Mesh(kerbBoxGeo, mat);

      lKerb.castShadow = true;
      rKerb.castShadow = true;

      scene.add(lKerb);
      scene.add(rKerb);

      leftKerbs.push(lKerb);
      rightKerbs.push(rKerb);
    }

    // --- 5. 🏛️ SLENDER TITANIUM LIGHT MONOLITHS (LOCKED TO UNIFIED WORLD POSITION) ---
    const monoliths: LightMonolith[] = [];
    const monolithCount = 12;
    const monolithSpacing = 36.0;
    const totalMonolithSpan = monolithCount * monolithSpacing;

    const monolithBodyGeo = new THREE.BoxGeometry(0.14, 5.2, 0.45);
    const monolithMat = new THREE.MeshStandardMaterial({
      color: 0x0c0c10,
      metalness: 0.98,
      roughness: 0.06,
    });
    const laserCoreMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.9,
    });

    for (let i = 0; i < monolithCount; i++) {
      const group = new THREE.Group();
      const body = new THREE.Mesh(monolithBodyGeo, monolithMat);
      body.position.y = 2.6;

      const laserLine = new THREE.Mesh(
        new THREE.BoxGeometry(0.03, 4.8, 0.03),
        laserCoreMat
      );
      laserLine.position.set(0, 2.6, 0.23);

      group.add(body);
      group.add(laserLine);

      const side = i % 2 === 0 ? -1 : 1;
      const zPos = -i * monolithSpacing - 20.0;

      group.position.set(side * (roadWidth / 2 + 0.4), 0, zPos);
      scene.add(group);

      monoliths.push({
        mesh: group,
        baseZ: zPos,
        side,
      });
    }

    // --- 6. 🏆 THE 3 ARCHITECTURAL SECTOR TIMING GATES (LOCKED TO UNIFIED WORLD POSITION) ---
    const sectorGates: SectorGate[] = [];
    const totalGateSpan = 360.0;
    const gateDefinitions = [
      { sectorIndex: 1, name: "SECTOR 1", code: "S1 // DRS SPEED TRAP", color: 0x38bdf8, baseZ: -70.0 },
      { sectorIndex: 2, name: "SECTOR 2", code: "S2 // HIGH APEX", color: 0xf59e0b, baseZ: -190.0 },
      { sectorIndex: 3, name: "SECTOR 3", code: "S3 // VELOCITY HORIZON", color: 0xa855f7, baseZ: -310.0 },
    ];

    const gateArchGeo = new THREE.TorusGeometry(4.2, 0.045, 16, 64);
    const gatePillarGeo = new THREE.BoxGeometry(0.25, 4.5, 0.25);
    const darkTitaniumMat = new THREE.MeshStandardMaterial({
      color: 0x121218,
      metalness: 0.98,
      roughness: 0.1,
    });

    // Helper: Create Telemetry Text Signboard Canvas
    function createSectorSignboard(code: string, colorHex: string): THREE.Mesh {
      const sCanvas = document.createElement("canvas");
      sCanvas.width = 512;
      sCanvas.height = 128;
      const ctx = sCanvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "rgba(10, 10, 15, 0.85)";
        ctx.fillRect(0, 0, 512, 128);
        ctx.strokeStyle = colorHex;
        ctx.lineWidth = 4;
        ctx.strokeRect(4, 4, 504, 120);

        ctx.font = "bold 34px monospace";
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(code, 256, 64);
      }
      const tex = new THREE.CanvasTexture(sCanvas);
      const mat = new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        opacity: 0.92,
      });
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 0.8), mat);
      mesh.position.set(0, 4.5, 0);
      return mesh;
    }

    gateDefinitions.forEach((def) => {
      const group = new THREE.Group();
      const colorHexStr = def.color === 0x38bdf8 ? "#38bdf8" : def.color === 0xf59e0b ? "#f59e0b" : "#a855f7";

      // 1. Luminous Laser Arch
      const archMat = new THREE.MeshBasicMaterial({
        color: def.color,
        transparent: true,
        opacity: 0.95,
      });
      const archMesh = new THREE.Mesh(gateArchGeo, archMat);
      archMesh.position.y = 2.4;
      group.add(archMesh);

      // 2. Dual Side Pillars
      const pL = new THREE.Mesh(gatePillarGeo, darkTitaniumMat);
      pL.position.set(-roadWidth / 2 - 0.2, 2.25, 0);
      const pR = new THREE.Mesh(gatePillarGeo, darkTitaniumMat);
      pR.position.set(roadWidth / 2 + 0.2, 2.25, 0);
      group.add(pL);
      group.add(pR);

      // 3. Overhead Laser Telemetry Signboard
      const signboard = createSectorSignboard(def.code, colorHexStr);
      group.add(signboard);

      group.position.set(0, 0, def.baseZ);
      scene.add(group);

      sectorGates.push({
        sectorIndex: def.sectorIndex,
        name: def.name,
        code: def.code,
        color: def.color,
        mesh: group,
        baseZ: def.baseZ,
        triggered: false,
      });
    });

    // --- 7. VELOCITY LASER STREAKS & DIFFUSER SPARKS ---
    const streakCount = 36;
    const streakPositions = new Float32Array(streakCount * 6);
    const streakVelocities = new Float32Array(streakCount);

    for (let i = 0; i < streakCount; i++) {
      const isLeft = Math.random() > 0.5;
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
    streakGeo.setAttribute("position", new THREE.BufferAttribute(streakPositions, 3));
    const streakMat = new THREE.LineBasicMaterial({
      color: 0xffd700,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    });
    const streakLines = new THREE.LineSegments(streakGeo, streakMat);
    scene.add(streakLines);

    // Diffuser Sparks
    const sparkCount = 150;
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
    sparkGeo.setAttribute("position", new THREE.BufferAttribute(sparkPositions, 3));
    const sparkMat = new THREE.PointsMaterial({
      color: 0xffaa00,
      size: 0.18,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
    });
    const sparkPoints = new THREE.Points(sparkGeo, sparkMat);
    scene.add(sparkPoints);

    // --- 8. 3D F1 CAR MODEL LOADING ---
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

        // Apply High-Gloss Obsidian Chrome Finish
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
      },
      undefined,
      (err) => console.error("Error loading F1 car GLB:", err)
    );

    // --- 9. INTERACTION CONTROLS ---
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
    let trackDistance = 0; // Master World Spatial Coordinate
    let sectorsCrossedCount = 0;
    let activeSector = 1;
    let portalFlashOpacity = 0;

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

    // --- 10. RESIZE HANDLER ---
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

    // --- 11. 60FPS CINEMATIC RENDER LOOP ---
    let animFrameId: number;
    const clock = new THREE.Clock();

    const tick = () => {
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      // 1. Smooth Acceleration Curve
      const targetSpeed = isBoosting ? 365 : 190;
      currentSpeed += (targetSpeed - currentSpeed) * (isBoosting ? 0.08 : 0.045);
      lapTime += delta;

      // 2. UNIFIED WORLD FORWARD ADVANCE (Zero Slippage Standard)
      const forwardDelta = currentSpeed * 0.45 * delta;
      trackDistance += forwardDelta;

      // Road Shader Uniforms
      roadUniforms.uDistance.value = trackDistance;

      const targetLightsOut = isLightsOutRef.current ? 1.0 : 0.0;
      roadUniforms.uLightsOut.value +=
        (targetLightsOut - roadUniforms.uLightsOut.value) * 0.1;

      coneMat.opacity = roadUniforms.uLightsOut.value * (isBoosting ? 0.16 : 0.10);

      // 3. Update Rumble Kerbs (100% Locked to Unified Curvature Anchor)
      const kerbScrollOffset = trackDistance % kerbGap;
      const trackHalfW = roadWidth / 2 - 0.2;

      for (let i = 0; i < kerbBlockCount; i++) {
        const zDist = i * kerbGap - kerbScrollOffset;
        const curveOffset =
          Math.sin((zDist + trackDistance) * 0.035) *
          roadUniforms.uCurvature.value *
          (zDist * 0.015);

        const lKerb = leftKerbs[i];
        const rKerb = rightKerbs[i];

        lKerb.position.set(-trackHalfW + curveOffset, 0.06, -zDist);
        rKerb.position.set(trackHalfW + curveOffset, 0.06, -zDist);

        const distScale = Math.min(1.0, zDist * 0.04);
        lKerb.rotation.y = curveOffset * 0.05 * distScale;
        rKerb.rotation.y = curveOffset * 0.05 * distScale;
      }

      // 4. Update Slender Titanium Monoliths (100% Locked to Unified Curvature Anchor)
      for (let i = 0; i < monoliths.length; i++) {
        const m = monoliths[i];
        m.baseZ += forwardDelta;

        if (m.baseZ > 15.0) {
          m.baseZ -= totalMonolithSpan;
        }

        const zDist = -m.baseZ;
        const curveOffset =
          Math.sin((zDist + trackDistance) * 0.035) *
          roadUniforms.uCurvature.value *
          (zDist * 0.015);

        const baseSideX = m.side * (roadWidth / 2 + 0.4);
        m.mesh.position.set(baseSideX + curveOffset, 0, m.baseZ);
      }

      // 5. Update The 3 Sector Timing Gates (100% Locked to Unified Curvature Anchor)
      for (let i = 0; i < sectorGates.length; i++) {
        const gate = sectorGates[i];
        gate.baseZ += forwardDelta;

        if (gate.baseZ > 18.0) {
          gate.baseZ -= totalGateSpan;
          gate.triggered = false;
        }

        const zDist = -gate.baseZ;
        const curveOffset =
          Math.sin((zDist + trackDistance) * 0.035) *
          roadUniforms.uCurvature.value *
          (zDist * 0.015);

        gate.mesh.position.set(curveOffset, 0, gate.baseZ);

        // Slicing Check (Crossing Sector Timing Gate)
        if (Math.abs(gate.baseZ - 0.0) < 3.0 && !gate.triggered) {
          const distX = Math.abs(carX - gate.mesh.position.x);

          if (distX < 4.8) {
            gate.triggered = true;
            sectorsCrossedCount += 1;
            activeSector = gate.sectorIndex;
            portalFlashOpacity = 0.9;
            playSonicPulse(isMutedRef.current);
          }
        }
      }

      // 6. 6-Axis Physics & Flight Aerodynamics
      const targetSteerX = pointerX * (trackHalfW - 1.2);
      targetCarX = THREE.MathUtils.clamp(targetSteerX, -trackHalfW + 0.6, trackHalfW - 0.6);
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

      const isFlying = carY > 0.15;
      const onKerb = !isFlying && Math.abs(carX) > trackHalfW - 1.6;
      if (onKerb && Math.random() < 0.08) {
        playKerbRumble(isMutedRef.current);
      }

      const highSpeedShake = !isFlying ? Math.sin(time * 80) * 0.006 * (currentSpeed / 190) : 0;
      const kerbVibration = onKerb ? Math.sin(time * 110) * 0.028 : 0;
      carGroup.position.y += Math.abs(highSpeedShake + kerbVibration);

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

      // 7. Responsive Full-Chassis Chase Camera (Yuta Abe Gold Standard)
      const isMobile = window.innerWidth < 768;
      const baseCamZ = isMobile ? 4.9 : 3.6;
      const baseCamY = isMobile ? 1.15 : 0.95;

      portalFlashOpacity *= 0.88;
      const flashBloom = portalFlashOpacity * 0.05;

      const camTargetX = carX * 0.32;
      const camTargetY = baseCamY + (carY * 0.45) + (isBoosting ? -0.08 : 0) + kerbVibration * 0.2;
      const camTargetZ = baseCamZ + (isBoosting ? 0.35 : 0) - flashBloom;

      camera.position.x += (camTargetX - camera.position.x) * 0.11;
      camera.position.y += (camTargetY - camera.position.y) * 0.11;
      camera.position.z += (camTargetZ - camera.position.z) * 0.11;

      // Dynamic Speed Perspective Warp
      const baseFOV = isMobile ? 58 : 50;
      const targetFOV = isBoosting ? baseFOV + 16 : baseFOV;
      camera.fov += (targetFOV - camera.fov) * 0.08;
      camera.updateProjectionMatrix();

      camera.lookAt(carX * 0.15, 0.4 + (carY * 0.25), -14);

      // 8. Velocity Laser Streaks
      const streakPos = streakGeo.attributes.position.array as Float32Array;
      const speedMultiplier = (currentSpeed / 190) * 2.2;

      for (let i = 0; i < streakCount; i++) {
        streakPos[i * 6 + 2] += streakVelocities[i] * delta * speedMultiplier;
        streakPos[i * 6 + 5] += streakVelocities[i] * delta * speedMultiplier;

        if (streakPos[i * 6 + 2] > 5) {
          const isLeft = Math.random() > 0.5;
          const xNew = isLeft ? carX - 0.95 + (Math.random() - 0.5) * 0.4 : carX + 0.95 + (Math.random() - 0.5) * 0.4;
          const yNew = Math.random() * 0.15 + 0.05 + carY;
          const zNew = -roadLength * 0.7;
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

      // 9. Diffuser Sparks
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

      // 10. Telemetry Callback
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
          currentSector: activeSector,
          sectorsCrossed: sectorsCrossedCount,
        });
      }

      // 11. Render Scene
      renderer.render(scene, camera);
      animFrameId = requestAnimationFrame(tick);
    };

    animFrameId = requestAnimationFrame(tick);

    // --- 12. CLEANUP ON UNMOUNT ---
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
      monolithBodyGeo.dispose();
      monolithMat.dispose();
      laserCoreMat.dispose();
      gateArchGeo.dispose();
      gatePillarGeo.dispose();
      darkTitaniumMat.dispose();
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
