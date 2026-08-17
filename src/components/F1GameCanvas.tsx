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
  worldZ: number;
  triggered: boolean;
}

interface LightMonolith {
  mesh: THREE.Group;
  worldZ: number;
  side: number;
}

interface KerbBlock {
  mesh: THREE.Mesh;
  worldZ: number;
  side: number;
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

    // --- 1. THREE.JS SCENE SETUP (NIGHT GP ATMOSPHERE) ---
    const scene = new THREE.Scene();
    // Deep Singapore GP Midnight Blue Gradient Fog
    scene.background = new THREE.Color(0x02050e);
    scene.fog = new THREE.FogExp2(0x02050e, 0.0075);

    // RESPONSIVE FULL-CHASSIS CHASE CAMERA (YUTA ABE GOLD STANDARD)
    const isInitMobile = typeof window !== "undefined" && window.innerWidth < 768;
    const initialFOV = isInitMobile ? 58 : 50;
    const initialCamZ = isInitMobile ? 4.9 : 3.6;
    const initialCamY = isInitMobile ? 1.15 : 0.95;

    const camera = new THREE.PerspectiveCamera(
      initialFOV,
      window.innerWidth / window.innerHeight,
      0.1,
      450
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

    // --- 2. HIGH-CONTRAST STUDIO LIGHTING & HORIZON BEACONS ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.95);
    scene.add(ambientLight);

    const rimLightLeft = new THREE.DirectionalLight(0xdbeafe, 4.5);
    rimLightLeft.position.set(-8, 14, 4);
    scene.add(rimLightLeft);

    const rimLightRight = new THREE.DirectionalLight(0xdbeafe, 4.5);
    rimLightRight.position.set(8, 14, 4);
    scene.add(rimLightRight);

    const topSpecularLight = new THREE.DirectionalLight(0xffffff, 3.5);
    topSpecularLight.position.set(0, 24, -6);
    scene.add(topSpecularLight);

    // Distant Stadium Floodlight Beacons (Eliminates the empty black void)
    const beaconGeo = new THREE.CylinderGeometry(0.3, 4.5, 90, 16, 1, true);
    beaconGeo.translate(0, 45, 0);
    const beaconMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.08,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    const beaconPositions = [
      { x: -55, z: -240 },
      { x: 55, z: -240 },
      { x: -95, z: -280 },
      { x: 95, z: -280 },
    ];

    beaconPositions.forEach((pos) => {
      const beaconMesh = new THREE.Mesh(beaconGeo, beaconMat);
      beaconMesh.position.set(pos.x, 0, pos.z);
      scene.add(beaconMesh);
    });

    // Forward Spotlights (Headlights)
    const leftHeadlight = new THREE.SpotLight(0x38bdf8, 55, 90, Math.PI / 5, 0.35, 1.2);
    leftHeadlight.position.set(-0.7, 0.45, 0);
    scene.add(leftHeadlight);

    const rightHeadlight = new THREE.SpotLight(0x38bdf8, 55, 90, Math.PI / 5, 0.35, 1.2);
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

    // --- 3. UNIFIED HIGHWAY SHADER (PERFECT 1:1 SPLINE EQUATION) ---
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

        // Map geometry pos.y (-140 to +140) to world distance from camera (0 to 280)
        float zDist = 140.0 - pos.y;
        vWorldZ = zDist;

        // Master Spatial Curvature Spline
        float curve = sin((zDist + uDistance) * 0.028) * uCurvature * (zDist * 0.014);
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
        float grain = rand(vUv * 600.0) * 0.04;

        // Rich Dark Obsidian Asphalt with Wet Shimmer
        vec3 asphaltColor = vec3(0.028, 0.030, 0.038) + grain;

        // 3-Lane Highway Dashed Centerlines (Warm Gold)
        float laneLeft = abs(vUv.x - 0.35);
        float laneRight = abs(vUv.x - 0.65);
        float dashPattern = step(0.40, fract(movingDist * 0.12));

        if ((laneLeft < 0.0075 || laneRight < 0.0075) && dashPattern > 0.5) {
          asphaltColor = vec3(0.96, 0.84, 0.20);
        }

        // Solid Outer Guard Lines (Pure White)
        if (vUv.x < 0.032 || vUv.x > 0.968) {
          asphaltColor = vec3(0.95, 0.95, 0.98);
        }

        // Anamorphic Wet Road Reflections
        float spec = pow(max(0.0, 1.0 - abs(vUv.x - 0.5) * 1.8), 4.0) * 0.32;
        asphaltColor += vec3(spec * 0.25, spec * 0.50, spec * 0.95);

        // Night Mode Headlight Illumination Mask
        if (uLightsOut > 0.01) {
          float headlightMask = smoothstep(130.0, 10.0, vDepth) * smoothstep(5.0, 0.0, abs(vWorldX));
          asphaltColor *= mix(0.10, 1.4, headlightMask);
        }

        // Depth Fog Fade into Singapore GP Midnight Horizon
        float fogFactor = smoothstep(80.0, 270.0, vDepth);
        vec3 finalColor = mix(asphaltColor, vec3(0.02, 0.03, 0.06), fogFactor);

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

    // --- 4. 3D ELEVATED RED & WHITE RUMBLE KERBS (CONTINUOUS FLOW) ---
    const kerbBlocks: KerbBlock[] = [];
    const kerbPairCount = 80;
    const kerbGap = 3.2;
    const totalKerbSpan = kerbPairCount * kerbGap;
    const kerbBoxGeo = new THREE.BoxGeometry(0.5, 0.12, 1.6);

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

    for (let i = 0; i < kerbPairCount; i++) {
      const isRed = i % 2 === 0;
      const mat = isRed ? redKerbMat : whiteKerbMat;
      const initZ = -i * kerbGap;

      const lKerb = new THREE.Mesh(kerbBoxGeo, mat);
      const rKerb = new THREE.Mesh(kerbBoxGeo, mat);

      scene.add(lKerb);
      scene.add(rKerb);

      kerbBlocks.push({ mesh: lKerb, worldZ: initZ, side: -1 });
      kerbBlocks.push({ mesh: rKerb, worldZ: initZ, side: 1 });
    }

    // --- 5. 🏛️ SLENDER TITANIUM LIGHT MONOLITHS (PERFECT SPLINE LOCK) ---
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
      const initZ = -i * monolithSpacing - 20.0;

      scene.add(group);

      monoliths.push({
        mesh: group,
        worldZ: initZ,
        side,
      });
    }

    // --- 6. 🏆 THE 3 ARCHITECTURAL SECTOR TIMING GATES ---
    const sectorGates: SectorGate[] = [];
    const totalGateSpan = 360.0;
    const gateDefinitions = [
      { sectorIndex: 1, name: "SECTOR 1", code: "S1 // DRS SPEED TRAP", color: 0x38bdf8, worldZ: -70.0 },
      { sectorIndex: 2, name: "SECTOR 2", code: "S2 // HIGH APEX", color: 0xf59e0b, worldZ: -190.0 },
      { sectorIndex: 3, name: "SECTOR 3", code: "S3 // VELOCITY HORIZON", color: 0xa855f7, worldZ: -310.0 },
    ];

    const gateArchGeo = new THREE.TorusGeometry(4.2, 0.045, 16, 64);
    const gatePillarGeo = new THREE.BoxGeometry(0.25, 4.5, 0.25);
    const darkTitaniumMat = new THREE.MeshStandardMaterial({
      color: 0x121218,
      metalness: 0.98,
      roughness: 0.1,
    });

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

      const archMat = new THREE.MeshBasicMaterial({
        color: def.color,
        transparent: true,
        opacity: 0.95,
      });
      const archMesh = new THREE.Mesh(gateArchGeo, archMat);
      archMesh.position.y = 2.4;
      group.add(archMesh);

      const pL = new THREE.Mesh(gatePillarGeo, darkTitaniumMat);
      pL.position.set(-roadWidth / 2 - 0.2, 2.25, 0);
      const pR = new THREE.Mesh(gatePillarGeo, darkTitaniumMat);
      pR.position.set(roadWidth / 2 + 0.2, 2.25, 0);
      group.add(pL);
      group.add(pR);

      const signboard = createSectorSignboard(def.code, colorHexStr);
      group.add(signboard);

      scene.add(group);

      sectorGates.push({
        sectorIndex: def.sectorIndex,
        name: def.name,
        code: def.code,
        color: def.color,
        mesh: group,
        worldZ: def.worldZ,
        triggered: false,
      });
    });

    // --- 7. VOLUMETRIC GAUSSIAN TIRE VAPOR & REAR WING VORTEX TRAILS ---
    // High-Resolution Soft Gaussian Smoke Texture (Nolan 70mm Standard)
    const smokeCanvas = document.createElement("canvas");
    smokeCanvas.width = 128;
    smokeCanvas.height = 128;
    const smCtx = smokeCanvas.getContext("2d");
    if (smCtx) {
      const grad = smCtx.createRadialGradient(64, 64, 0, 64, 64, 64);
      grad.addColorStop(0, "rgba(220, 230, 255, 0.40)");
      grad.addColorStop(0.35, "rgba(200, 215, 245, 0.22)");
      grad.addColorStop(0.7, "rgba(180, 200, 235, 0.06)");
      grad.addColorStop(1, "rgba(0, 0, 0, 0)");
      smCtx.fillStyle = grad;
      smCtx.fillRect(0, 0, 128, 128);
    }
    const smokeTex = new THREE.CanvasTexture(smokeCanvas);

    const smokeParticleCount = 45;
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
        maxScale: 2.2,
        life: 0,
        maxLife: 0.7,
        opacity: 0,
      });
    }

    // Rear Wing Tip Condensation Vortex Line Trails
    const vortexLength = 16;
    const leftVortexGeo = new THREE.BufferGeometry();
    const rightVortexGeo = new THREE.BufferGeometry();
    const leftVortexPos = new Float32Array(vortexLength * 3);
    const rightVortexPos = new Float32Array(vortexLength * 3);

    leftVortexGeo.setAttribute("position", new THREE.BufferAttribute(leftVortexPos, 3));
    rightVortexGeo.setAttribute("position", new THREE.BufferAttribute(rightVortexPos, 3));

    const vortexMat = new THREE.LineBasicMaterial({
      color: 0x93c5fd,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
    });

    const leftVortexLine = new THREE.Line(leftVortexGeo, vortexMat);
    const rightVortexLine = new THREE.Line(rightVortexGeo, vortexMat);
    scene.add(leftVortexLine);
    scene.add(rightVortexLine);

    // --- 8. DIFFUSER GROUND-EFFECT CONTACT SHADOW ---
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

    // --- 9. 3D F1 CAR MODEL LOADING ---
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

    // --- 10. INTERACTION CONTROLS ---
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
    let trackDistance = 0; // Unified Master World Coordinate
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

    // --- 11. RESIZE HANDLER ---
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

    // --- 12. 60FPS CINEMATIC RENDER LOOP ---
    let animFrameId: number;
    const clock = new THREE.Clock();

    const tick = () => {
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      // 1. Smooth Acceleration Curve
      const targetSpeed = isBoosting ? 365 : 190;
      currentSpeed += (targetSpeed - currentSpeed) * (isBoosting ? 0.08 : 0.045);
      lapTime += delta;

      // 2. WEIGHTED CINEMATIC VELOCITY (LUXURY PACING)
      const forwardDelta = currentSpeed * 0.22 * delta;
      trackDistance += forwardDelta;

      // Road Shader Uniforms
      roadUniforms.uDistance.value = trackDistance;

      const targetLightsOut = isLightsOutRef.current ? 1.0 : 0.0;
      roadUniforms.uLightsOut.value +=
        (targetLightsOut - roadUniforms.uLightsOut.value) * 0.1;

      coneMat.opacity = roadUniforms.uLightsOut.value * (isBoosting ? 0.16 : 0.10);

      // 3. Update Rumble Kerbs (Smooth Continuous World Flow)
      const trackHalfW = roadWidth / 2 - 0.2;

      for (let i = 0; i < kerbBlocks.length; i++) {
        const kb = kerbBlocks[i];
        kb.worldZ += forwardDelta;

        if (kb.worldZ > 8.0) {
          kb.worldZ -= totalKerbSpan;
        }

        const zDist = -kb.worldZ;
        const curve =
          Math.sin((zDist + trackDistance) * 0.028) *
          roadUniforms.uCurvature.value *
          (zDist * 0.014);

        kb.mesh.position.set(kb.side * trackHalfW + curve, 0.06, kb.worldZ);
        kb.mesh.rotation.y = curve * 0.04;
      }

      // 4. Update Slender Titanium Monoliths (100% Locked to Road Spline)
      for (let i = 0; i < monoliths.length; i++) {
        const m = monoliths[i];
        m.worldZ += forwardDelta;

        if (m.worldZ > 15.0) {
          m.worldZ -= totalMonolithSpan;
        }

        const zDist = -m.worldZ;
        const curve =
          Math.sin((zDist + trackDistance) * 0.028) *
          roadUniforms.uCurvature.value *
          (zDist * 0.014);

        const baseSideX = m.side * (roadWidth / 2 + 0.4);
        m.mesh.position.set(baseSideX + curve, 0, m.worldZ);
      }

      // 5. Update The 3 Sector Timing Gates (100% Locked to Road Spline)
      for (let i = 0; i < sectorGates.length; i++) {
        const gate = sectorGates[i];
        gate.worldZ += forwardDelta;

        if (gate.worldZ > 18.0) {
          gate.worldZ -= totalGateSpan;
          gate.triggered = false;
        }

        const zDist = -gate.worldZ;
        const curve =
          Math.sin((zDist + trackDistance) * 0.028) *
          roadUniforms.uCurvature.value *
          (zDist * 0.014);

        gate.mesh.position.set(curve, 0, gate.worldZ);

        // Slicing Check (Crossing Sector Timing Gate)
        if (Math.abs(gate.worldZ - 0.0) < 3.0 && !gate.triggered) {
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

      // Ground Contact Shadow Follows Car
      groundShadow.position.x = carX;
      groundShadow.position.z = 0;
      groundShadow.material.opacity = Math.max(0.0, 0.85 - carY * 0.8);

      const isFlying = carY > 0.15;
      const onKerb = !isFlying && Math.abs(carX) > trackHalfW - 1.6;
      if (onKerb && Math.random() < 0.08) {
        playKerbRumble(isMutedRef.current);
      }

      const highSpeedShake = !isFlying ? Math.sin(time * 80) * 0.005 * (currentSpeed / 190) : 0;
      const kerbVibration = onKerb ? Math.sin(time * 110) * 0.024 : 0;
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

      // 7. Volumetric Gaussian Tire Mist / Smoke Updates
      const isSmokeActive = (!isFlying && onKerb) || Math.abs(carSteerVelocity) > 2.8 || isBoosting;

      for (let i = 0; i < smokeParticleCount; i++) {
        const p = smokePool[i];
        const sp = smokeSprites[i];

        if (p.life <= 0 && isSmokeActive && Math.random() < 0.4) {
          // Spawn at left or right rear tire
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
          p.opacity = 0.32;
        } else if (p.life > 0) {
          p.life -= delta;
          const progress = 1.0 - p.life / p.maxLife;

          p.pos.addScaledVector(p.vel, delta);
          p.scale = THREE.MathUtils.lerp(0.35, p.maxScale, progress);
          p.opacity = (1.0 - progress) * 0.32;

          sp.position.copy(p.pos);
          sp.scale.set(p.scale, p.scale, 1);
          sp.material.opacity = p.opacity;
        } else {
          sp.material.opacity = 0;
        }
      }

      // 8. Rear Wing Vortex Condensation Ribbons
      const isVortexActive = currentSpeed > 240;
      vortexMat.opacity = THREE.MathUtils.lerp(vortexMat.opacity, isVortexActive ? 0.65 : 0.0, 0.1);

      const lArr = leftVortexGeo.attributes.position.array as Float32Array;
      const rArr = rightVortexGeo.attributes.position.array as Float32Array;

      // Shift trailing segments
      for (let k = vortexLength - 1; k > 0; k--) {
        lArr[k * 3 + 0] = lArr[(k - 1) * 3 + 0];
        lArr[k * 3 + 1] = lArr[(k - 1) * 3 + 1];
        lArr[k * 3 + 2] = lArr[(k - 1) * 3 + 2] + forwardDelta * 0.85;

        rArr[k * 3 + 0] = rArr[(k - 1) * 3 + 0];
        rArr[k * 3 + 1] = rArr[(k - 1) * 3 + 1];
        rArr[k * 3 + 2] = rArr[(k - 1) * 3 + 2] + forwardDelta * 0.85;
      }

      // Lead tip attached to rear wing endplates
      lArr[0] = carX - 0.82;
      lArr[1] = 0.82 + carY;
      lArr[2] = 1.35;

      rArr[0] = carX + 0.82;
      rArr[1] = 0.82 + carY;
      rArr[2] = 1.35;

      leftVortexGeo.attributes.position.needsUpdate = true;
      rightVortexGeo.attributes.position.needsUpdate = true;

      // 9. Responsive Full-Chassis Chase Camera (Yuta Abe Gold Standard)
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
      const targetFOV = isBoosting ? baseFOV + 14 : baseFOV;
      camera.fov += (targetFOV - camera.fov) * 0.08;
      camera.updateProjectionMatrix();

      camera.lookAt(carX * 0.15, 0.4 + (carY * 0.25), -14);

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

    // --- 13. CLEANUP ON UNMOUNT ---
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
      coneGeo.dispose();
      coneMat.dispose();
      flareMat.dispose();
      flareTex.dispose();
      smokeTex.dispose();
      smokeMat.dispose();
      shadowTex.dispose();
      shadowMat.dispose();
      leftVortexGeo.dispose();
      rightVortexGeo.dispose();
      vortexMat.dispose();
      beaconGeo.dispose();
      beaconMat.dispose();
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
