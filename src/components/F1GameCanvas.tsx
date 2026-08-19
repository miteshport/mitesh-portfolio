"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three-stdlib";
import { EffectComposer, RenderPass, UnrealBloomPass } from "three-stdlib";
import { playKerbRumble, updateF1Engine } from "@/utils/f1EngineAudio";
import { audio } from "@/utils/audioSystem";

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
  currentSector: number;
  sectorsCrossed: number;
  score: number;
  multiplier: number;
  energy: number; // 0 to 100%
  distanceRemaining: number; // 1000m to 0m
  gameState: "BRIEFING" | "PLAYING" | "WON" | "LOST";
  nearMissCount: number;
}

interface F1GameCanvasProps {
  isLightsOut?: boolean;
  isMuted?: boolean;
  gameResetKey?: number;
  onTelemetryUpdate?: (data: TelemetryData) => void;
  onLoadProgress?: (progress: number) => void;
  onLoadComplete?: () => void;
}

export default function F1GameCanvas({
  isLightsOut = false,
  isMuted = false,
  gameResetKey = 0,
  onTelemetryUpdate,
  onLoadProgress,
  onLoadComplete,
}: F1GameCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isLightsOutRef = useRef(isLightsOut);
  const isMutedRef = useRef(isMuted);
  const resetTriggerRef = useRef<() => void>(() => {});

  useEffect(() => {
    isLightsOutRef.current = isLightsOut;
  }, [isLightsOut]);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  useEffect(() => {
    if (gameResetKey > 0) {
      resetTriggerRef.current();
    }
  }, [gameResetKey]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // --- 1. THREE.JS SCENE SETUP ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020409);
    scene.fog = new THREE.FogExp2(0x020409, 0.0055);

    const wInit = window.innerWidth;
    const hInit = window.innerHeight;
    const aspectInit = wInit / hInit;
    const isNarrowFold = wInit < 500 || aspectInit < 0.65;
    const camera = new THREE.PerspectiveCamera(
      isNarrowFold ? 72 : 64,
      aspectInit,
      0.1,
      600
    );
    // Dynamic Camera Pull-Back: Guarantees 100% full view of highway on Fold 4 closed screen
    camera.position.set(0, isNarrowFold ? 3.4 : 2.85, isNarrowFold ? 8.4 : 6.2);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
      stencil: false,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.10;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    // --- 2. POST-PROCESSING BLOOM ---
    const renderScene = new RenderPass(scene, camera);
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth / 2, window.innerHeight / 2),
      0.70,
      0.40,
      0.82
    );
    const composer = new EffectComposer(renderer);
    composer.addPass(renderScene);
    composer.addPass(bloomPass);

    // --- 3. STUDIO LIGHTING RIG ---
    const ambientLight = new THREE.AmbientLight(0x182438, 1.8);
    scene.add(ambientLight);

    const moonKeyLight = new THREE.DirectionalLight(0xa5c9eb, 2.8);
    moonKeyLight.position.set(20, 45, 25);
    scene.add(moonKeyLight);

    const gothamCyanRim = new THREE.DirectionalLight(0x0284c7, 3.5);
    gothamCyanRim.position.set(-30, 15, -40);
    scene.add(gothamCyanRim);

    const batUnderbody = new THREE.PointLight(0x0284c7, 4.0, 8.0);
    batUnderbody.position.set(0, 0.08, 0.6);
    scene.add(batUnderbody);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();
    const studioEnvScene = new THREE.Scene();
    studioEnvScene.background = new THREE.Color(0x030712);
    const studioEnvMap = pmremGenerator.fromScene(studioEnvScene).texture;
    scene.environment = studioEnvMap;

    // --- 4. 🦇 VOLUMETRIC HEADLIGHT CONES ---
    const createHeadlight = (xOffset: number) => {
      const spot = new THREE.SpotLight(0xe0f2fe, 14.0, 80, Math.PI / 7, 0.35, 1.2);
      spot.position.set(xOffset, 0.38, -0.2);
      scene.add(spot);
      return spot;
    };
    const leftHeadlight = createHeadlight(-0.65);
    const rightHeadlight = createHeadlight(0.65);

    const headlightTarget = new THREE.Object3D();
    headlightTarget.position.set(0, 0.1, -40);
    scene.add(headlightTarget);
    leftHeadlight.target = headlightTarget;
    rightHeadlight.target = headlightTarget;

    // 💡 1. TWIN XENON HEADLAMP FLARES (Mounted directly on Tumbler front armor)
    const flareCanvas = document.createElement("canvas");
    flareCanvas.width = 128;
    flareCanvas.height = 128;
    const flCtx = flareCanvas.getContext("2d");
    if (flCtx) {
      const flGrad = flCtx.createRadialGradient(64, 64, 4, 64, 64, 60);
      flGrad.addColorStop(0.0, "rgba(255, 255, 255, 1.0)");
      flGrad.addColorStop(0.2, "rgba(186, 230, 253, 0.90)");
      flGrad.addColorStop(0.5, "rgba(56, 189, 248, 0.40)");
      flGrad.addColorStop(1.0, "rgba(0, 0, 0, 0.0)");
      flCtx.fillStyle = flGrad;
      flCtx.fillRect(0, 0, 128, 128);
    }
    const flareTex = new THREE.CanvasTexture(flareCanvas);
    const flareMat = new THREE.SpriteMaterial({
      map: flareTex,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const leftHeadlampFlare = new THREE.Sprite(flareMat);
    leftHeadlampFlare.scale.set(0.85, 0.85, 1.0);
    leftHeadlampFlare.position.set(-0.62, 0.38, -0.35);
    const rightHeadlampFlare = new THREE.Sprite(flareMat);
    rightHeadlampFlare.scale.set(0.85, 0.85, 1.0);
    rightHeadlampFlare.position.set(0.62, 0.38, -0.35);

    // 🛣️ 2. SOFT ASPHALT PROJECTED FORWARD ROAD BEAM (Flat on ground, zero sky clutter)
    const beamCanvas = document.createElement("canvas");
    beamCanvas.width = 512;
    beamCanvas.height = 512;
    const bmCtx = beamCanvas.getContext("2d");
    if (bmCtx) {
      const bmGrad = bmCtx.createRadialGradient(256, 80, 10, 256, 220, 250);
      bmGrad.addColorStop(0.0, "rgba(220, 245, 255, 0.75)");
      bmGrad.addColorStop(0.35, "rgba(186, 230, 253, 0.45)");
      bmGrad.addColorStop(0.70, "rgba(56, 189, 248, 0.15)");
      bmGrad.addColorStop(1.0, "rgba(0, 0, 0, 0.0)");
      bmCtx.fillStyle = bmGrad;
      bmCtx.fillRect(0, 0, 512, 512);
    }
    const beamTex = new THREE.CanvasTexture(beamCanvas);
    const beamMat = new THREE.MeshBasicMaterial({
      map: beamTex,
      transparent: true,
      opacity: 0.80,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const roadBeamDecal = new THREE.Mesh(new THREE.PlaneGeometry(8.5, 34.0), beamMat);
    roadBeamDecal.rotation.x = -Math.PI / 2;
    roadBeamDecal.position.set(0, 0.03, -16.0);
    scene.add(roadBeamDecal);

    // --- 5. 🦇 GOTHAM BAT-SIGNAL ---
    const batCanvas = document.createElement("canvas");
    batCanvas.width = 256;
    batCanvas.height = 256;
    const bCtx = batCanvas.getContext("2d");
    if (bCtx) {
      const bGrad = bCtx.createRadialGradient(128, 128, 10, 128, 128, 128);
      bGrad.addColorStop(0.0, "rgba(220, 245, 255, 0.95)");
      bGrad.addColorStop(0.35, "rgba(56, 189, 248, 0.75)");
      bGrad.addColorStop(0.70, "rgba(2, 132, 199, 0.30)");
      bGrad.addColorStop(1.0, "rgba(0, 0, 0, 0.0)");
      bCtx.fillStyle = bGrad;
      bCtx.fillRect(0, 0, 256, 256);

      // 2. Exact Nolan Bat-Signal Vector Silhouette
      bCtx.save();
      bCtx.translate(128, 128);
      bCtx.scale(0.82, 0.82);
      bCtx.fillStyle = "rgba(4, 8, 18, 0.98)";

      bCtx.beginPath();
      bCtx.moveTo(-6, -42);
      bCtx.lineTo(-14, -62); // Left Ear Tip
      bCtx.lineTo(-24, -42);
      bCtx.bezierCurveTo(-55, -45, -95, -28, -125, 8); // Left Upper Wing
      bCtx.bezierCurveTo(-110, 25, -90, 42, -75, 42); // Left Outer Scallop
      bCtx.bezierCurveTo(-60, 42, -45, 28, -38, 22); // Left Mid Scallop
      bCtx.bezierCurveTo(-30, 38, -18, 52, 0, 56); // Tail Tip
      bCtx.bezierCurveTo(18, 52, 30, 38, 38, 22); // Right Inner Scallop
      bCtx.bezierCurveTo(45, 28, 60, 42, 75, 42); // Right Mid Scallop
      bCtx.bezierCurveTo(90, 42, 110, 25, 125, 8); // Right Wing Tip
      bCtx.bezierCurveTo(95, -28, 55, -45, 24, -42); // Right Upper Wing
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
    batSignalSprite.position.set(0, 18.0, -110);
    batSignalSprite.scale.set(22, 22, 1);
    scene.add(batSignalSprite);

    // --- 6. 🌆 GOTHAM CITY PARALLAX SKYLINE (EXACT NOLAN CINEMATIC HORIZON) ---
    const buildSkylineTexture = () => {
      const c = document.createElement("canvas");
      c.width = 1024;
      c.height = 512;
      const ctx = c.getContext("2d");
      if (!ctx) return new THREE.CanvasTexture(c);

      ctx.fillStyle = "rgba(0,0,0,0)";
      ctx.fillRect(0, 0, 1024, 512);

      // Dark Art Deco Monoliths
      const buildings = [
        { x: 0, w: 110, h: 360, spires: [30, 50] },
        { x: 120, w: 140, h: 440, spires: [40, 90] },
        { x: 270, w: 90, h: 280, spires: [20, 40] },
        { x: 370, w: 160, h: 480, spires: [50, 110] },
        { x: 540, w: 120, h: 340, spires: [30, 60] },
        { x: 670, w: 150, h: 420, spires: [45, 80] },
        { x: 830, w: 100, h: 310, spires: [25, 45] },
        { x: 940, w: 84, h: 390, spires: [20, 70] },
      ];

      buildings.forEach((b) => {
        // Main tower body (Deep Midnight Obsidian)
        ctx.fillStyle = "rgba(3, 5, 10, 0.98)";
        ctx.fillRect(b.x, 512 - b.h, b.w, b.h);

        // Stepped Art Deco Setbacks
        ctx.fillStyle = "rgba(5, 8, 16, 0.98)";
        ctx.fillRect(b.x + 14, 512 - b.h - b.spires[0], b.w - 28, b.spires[0]);

        // Needle Spire
        ctx.fillStyle = "rgba(7, 12, 22, 1.0)";
        ctx.fillRect(b.x + b.w / 2 - 3, 512 - b.h - b.spires[0] - b.spires[1], 6, b.spires[1]);

        // Red Aviation Warning Light on Spire Tip
        ctx.fillStyle = "rgba(239, 68, 68, 0.95)";
        ctx.beginPath();
        ctx.arc(b.x + b.w / 2, 512 - b.h - b.spires[0] - b.spires[1], 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Ambient Gotham Window Slits (Subtle warm amber & cyan pinpricks)
        for (let wy = 512 - b.h + 24; wy < 420; wy += 28) {
          for (let wx = b.x + 12; wx < b.x + b.w - 12; wx += 20) {
            if (Math.random() < 0.35) {
              const isAmber = Math.random() < 0.65;
              ctx.fillStyle = isAmber ? "rgba(240, 195, 95, 0.65)" : "rgba(80, 185, 235, 0.55)";
              ctx.fillRect(wx, wy, 3, 6);
            }
          }
        }
      });

      // Bottom Soft-Fade Mist Gradient (dissolves the bottom of buildings smoothly into the asphalt fog)
      ctx.save();
      ctx.globalCompositeOperation = "destination-out";
      const mistGrad = ctx.createLinearGradient(0, 360, 0, 512);
      mistGrad.addColorStop(0.0, "rgba(0, 0, 0, 0.0)");
      mistGrad.addColorStop(0.5, "rgba(0, 0, 0, 0.45)");
      mistGrad.addColorStop(1.0, "rgba(0, 0, 0, 1.0)");
      ctx.fillStyle = mistGrad;
      ctx.fillRect(0, 360, 1024, 152);
      ctx.restore();

      const tex = new THREE.CanvasTexture(c);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      tex.repeat.set(3, 1);
      return tex;
    };

    const skylineTex = buildSkylineTexture();
    const skylineMat = new THREE.MeshBasicMaterial({
      map: skylineTex,
      transparent: true,
      opacity: 0.90,
      side: THREE.DoubleSide,
      fog: false,
    });

    // Left and Right Skyline Flanks (deeper placement with seamless horizon blending)
    const skylineGeo = new THREE.PlaneGeometry(420, 56);
    const leftSkyline = new THREE.Mesh(skylineGeo, skylineMat);
    leftSkyline.position.set(-28, 16, -160);
    leftSkyline.rotation.y = Math.PI / 16;
    scene.add(leftSkyline);

    const rightSkyline = new THREE.Mesh(skylineGeo, skylineMat);
    rightSkyline.position.set(28, 16, -160);
    rightSkyline.rotation.y = -Math.PI / 16;
    scene.add(rightSkyline);
    // --- 7. 🛣️ UNIFIED 3-LANE ROCK-SOLID ASPHALT HIGHWAY ---
    const roadWidth = 10.4;
    const roadLength = 390.0;
    const roadCenterZ = -165.0;

    const roadVertexShader = `
      uniform float uDistance;
      varying vec2 vUv;
      varying float vDepth;
      varying float vWorldX;
      varying float vWorldZ;

      void main() {
        vUv = uv;
        vec3 pos = position;
        float worldZPos = pos.y + (${roadCenterZ.toFixed(1)});
        vWorldZ = -worldZPos;
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
        float grain = rand(vUv * 600.0) * 0.024;

        vec3 asphaltColor = vec3(0.024, 0.026, 0.032) + grain;

        // 🛣️ 2 DASHED WHITE LANE DIVIDERS (Visually separates road into 3 equal lanes)
        float dashPattern = step(0.46, fract(movingDist * 0.08));
        float divider1 = abs(vUv.x - 0.355);
        float divider2 = abs(vUv.x - 0.645);
        if ((divider1 < 0.0035 || divider2 < 0.0035) && dashPattern > 0.5) {
          asphaltColor = vec3(0.95, 0.95, 0.98);
        }

        // 🏁 RED & WHITE RACING RUMBLE KERBS (Shoulders)
        float leftKerb = step(vUv.x, 0.055);
        float rightKerb = step(0.945, vUv.x);
        if (leftKerb > 0.5 || rightKerb > 0.5) {
          float kerbPattern = step(0.5, fract(movingDist * 0.14));
          vec3 kerbColor = mix(vec3(0.90, 0.12, 0.12), vec3(0.96, 0.96, 0.96), kerbPattern);
          asphaltColor = kerbColor;
        }

        // Solid White Shoulder Edge Lines
        float leftEdge = abs(vUv.x - 0.055);
        float rightEdge = abs(vUv.x - 0.945);
        if (leftEdge < 0.0030 || rightEdge < 0.0030) {
          asphaltColor = vec3(1.0, 1.0, 1.0);
        }

        // Wet Specular Asphalt Sheen
        float spec = pow(max(0.0, 1.0 - abs(vUv.x - 0.5) * 1.8), 3.5) * 0.30;
        asphaltColor += vec3(spec * 0.25, spec * 0.50, spec * 0.88);

        // Headlight Projection Mask
        if (uLightsOut > 0.01) {
          float headlightMask = smoothstep(130.0, 10.0, vDepth) * smoothstep(5.0, 0.0, abs(vWorldX));
          asphaltColor *= mix(0.10, 1.4, headlightMask);
        }

        // Depth Atmospheric Fog Fade
        float fogFactor = smoothstep(90.0, 320.0, vDepth);
        vec3 finalColor = mix(asphaltColor, vec3(0.02, 0.04, 0.09), fogFactor);

        gl_FragColor = vec4(finalColor, 1.0);
      }
    `;

    const roadUniforms = {
      uDistance: { value: 0 },
      uLightsOut: { value: 0.0 },
    };

    const roadGeometry = new THREE.PlaneGeometry(roadWidth, roadLength, 1, 120);
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

    // --- 8. ⚡ ROAD FIGHTER 3-LANE ENTITIES (TRAFFIC & RARE FUEL CORES) ---
    const getLanePitch = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const aspect = w / h;
      if (w < 440 || aspect < 0.55) return 1.75; // Galaxy Z Fold 4 Narrow Cover Screen
      if (w < 768 || aspect < 0.65) return 2.15; // Standard Phone
      return 2.60; // Desktop / Wide
    };
    let lanePitch = getLanePitch();
    let lanePositions = [-lanePitch, 0.0, lanePitch];
    let currentLane = 1; // 0 = Left, 1 = Center, 2 = Right
    let targetCarX = lanePositions[currentLane];

    interface RoadFighterEntity {
      group: THREE.Group;
      mesh: THREE.Mesh;
      skyBeam: THREE.Mesh;
      light: THREE.PointLight;
      isHazard: boolean;
      laneIndex: number;
      z: number;
      active: boolean;
      nearMissed: boolean;
    }

    const entityPool: RoadFighterEntity[] = [];
    const poolSize = 9;

    const coreGeo = new THREE.OctahedronGeometry(0.68, 2);
    const hazardGeo = new THREE.BoxGeometry(1.45, 0.70, 1.45);
    const skyBeamGeo = new THREE.CylinderGeometry(0.04, 0.16, 16, 8);

    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x0c1e30,
      emissive: 0x38bdf8,
      emissiveIntensity: 0.95,
      metalness: 0.85,
      roughness: 0.15,
    });

    const hazardMat = new THREE.MeshStandardMaterial({
      color: 0x200a0a,
      emissive: 0xef4444,
      emissiveIntensity: 0.90,
      metalness: 0.85,
      roughness: 0.20,
    });

    for (let i = 0; i < poolSize; i++) {
      const group = new THREE.Group();
      const isHazard = i % 4 !== 0; // 75% traffic hazards, 25% rare fuel cores!

      const mesh = new THREE.Mesh(isHazard ? hazardGeo : coreGeo, isHazard ? hazardMat.clone() : coreMat.clone());
      mesh.position.y = isHazard ? 0.35 : 0.45; // Locked solid on ground
      group.add(mesh);

      // Sky Laser Pillar
      const beamMat = new THREE.MeshBasicMaterial({
        color: isHazard ? 0xef4444 : 0x38bdf8,
        transparent: true,
        opacity: isHazard ? 0.20 : 0.40,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      const skyBeam = new THREE.Mesh(skyBeamGeo, beamMat);
      skyBeam.position.set(0, 8.5, 0);
      group.add(skyBeam);

      const pLight = new THREE.PointLight(isHazard ? 0xef4444 : 0x38bdf8, 2.0, 7.0);
      pLight.position.set(0, 0.8, 0);
      group.add(pLight);

      const initZ = -50 - Math.floor(i / 3) * 35;
      const initLane = i % 3;
      group.position.set(lanePositions[initLane], 0, initZ);

      scene.add(group);

      entityPool.push({
        group,
        mesh,
        skyBeam,
        light: pLight,
        isHazard,
        laneIndex: initLane,
        z: initZ,
        active: true,
        nearMissed: false,
      });
    }

    const setEntityVisuals = (item: RoadFighterEntity, zPos: number, lane: number, isHazard: boolean) => {
      item.z = zPos;
      item.laneIndex = lane;
      item.isHazard = isHazard;
      item.active = true;
      item.nearMissed = false;
      item.group.visible = true;

      item.mesh.geometry = isHazard ? hazardGeo : coreGeo;
      item.mesh.position.y = isHazard ? 0.35 : 0.45;
      const col = isHazard ? 0xef4444 : 0x38bdf8;
      (item.mesh.material as THREE.MeshStandardMaterial).emissive.setHex(col);
      (item.skyBeam.material as THREE.MeshBasicMaterial).color.setHex(col);
      item.light.color.setHex(col);

      item.group.position.set(lanePositions[lane], 0, zPos);
    };

    // 🌊 CHOREOGRAPHED ROAD FIGHTER STRATEGIC WAVE SPAWNER
    let waveCounter = 0;
    const spawnWaveFormation = (baseZ: number, entityIndices: number[]) => {
      waveCounter++;
      const waveType = waveCounter % 4;

      if (waveType === 0) {
        // FORMATION 1: THE GATEWAY (Left Hazard + Right Hazard + Rare Center Core)
        setEntityVisuals(entityPool[entityIndices[0]], baseZ, 0, true);  // Left Traffic
        setEntityVisuals(entityPool[entityIndices[1]], baseZ, 1, false); // Center Fuel Core
        setEntityVisuals(entityPool[entityIndices[2]], baseZ, 2, true);  // Right Traffic
      } else if (waveType === 1) {
        // FORMATION 2: SLALOM WEAVE (Center Traffic + Left Traffic, Right Open)
        setEntityVisuals(entityPool[entityIndices[0]], baseZ, 1, true);  // Center Traffic
        setEntityVisuals(entityPool[entityIndices[1]], baseZ, 0, true);  // Left Traffic
        setEntityVisuals(entityPool[entityIndices[2]], baseZ - 18, 2, false); // Distant Right Fuel Core
      } else if (waveType === 2) {
        // FORMATION 3: DUAL FLANK (Left Traffic + Right Traffic, Center Open)
        setEntityVisuals(entityPool[entityIndices[0]], baseZ, 0, true);  // Left Traffic
        setEntityVisuals(entityPool[entityIndices[1]], baseZ, 2, true);  // Right Traffic
        setEntityVisuals(entityPool[entityIndices[2]], baseZ - 20, 1, true); // Staggered Center Traffic
      } else {
        // FORMATION 4: THE CHASE (Center Traffic + Right Traffic + Left Fuel Core)
        setEntityVisuals(entityPool[entityIndices[0]], baseZ, 1, true);  // Center Traffic
        setEntityVisuals(entityPool[entityIndices[1]], baseZ, 2, true);  // Right Traffic
        setEntityVisuals(entityPool[entityIndices[2]], baseZ, 0, false); // Left Fuel Core
      }
    };

    // Shockwave Ring on Pickup / Crash
    const shockwaveGeo = new THREE.RingGeometry(0.2, 0.45, 32);
    const shockwaveMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
    });
    const shockwaveMesh = new THREE.Mesh(shockwaveGeo, shockwaveMat);
    shockwaveMesh.rotation.x = -Math.PI / 2;
    shockwaveMesh.position.y = 0.05;
    scene.add(shockwaveMesh);
    let shockwaveLife = 0;

    // Contact AO Ground Shadow
    const shadowCanvas = document.createElement("canvas");
    shadowCanvas.width = 256;
    shadowCanvas.height = 256;
    const shCtx = shadowCanvas.getContext("2d");
    if (shCtx) {
      const shGrad = shCtx.createRadialGradient(128, 128, 20, 128, 128, 128);
      shGrad.addColorStop(0, "rgba(0, 0, 0, 0.95)");
      shGrad.addColorStop(0.5, "rgba(0, 0, 0, 0.70)");
      shGrad.addColorStop(0.85, "rgba(0, 0, 0, 0.20)");
      shGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
      shCtx.fillStyle = shGrad;
      shCtx.fillRect(0, 0, 256, 256);
    }
    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      opacity: 0.92,
      depthWrite: false,
    });
    const groundShadow = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 5.2), shadowMat);
    groundShadow.rotation.x = -Math.PI / 2;
    groundShadow.position.y = 0.025;
    scene.add(groundShadow);

    // --- 9. 🦇 3D BATMOBILE TUMBLER (AUTHENTIC RIGGED STUDIO MODEL) ---
    const carGroup = new THREE.Group();
    scene.add(carGroup);
    carGroup.add(leftHeadlampFlare);
    carGroup.add(rightHeadlampFlare);

    // Dynamic Diegetic In-World Roof HUD
    const holoCanvas = document.createElement("canvas");
    holoCanvas.width = 512;
    holoCanvas.height = 140;
    const hCtx = holoCanvas.getContext("2d");
    const holoTex = new THREE.CanvasTexture(holoCanvas);
    holoTex.colorSpace = THREE.SRGBColorSpace;

    const holoMat = new THREE.SpriteMaterial({
      map: holoTex,
      transparent: true,
      depthWrite: false,
    });
    const roofHoloSprite = new THREE.Sprite(holoMat);
    roofHoloSprite.position.set(0, 1.85, 0.1);
    roofHoloSprite.scale.set(2.4, 0.65, 1.0);
    carGroup.add(roofHoloSprite);

    const updateRoofHologram = (energy: number, distLeft: number, streak: number) => {
      if (!hCtx) return;
      hCtx.clearRect(0, 0, 512, 140);

      // Frosted Obsidian Plate
      hCtx.fillStyle = "rgba(4, 8, 16, 0.90)";
      hCtx.beginPath();
      hCtx.roundRect(8, 8, 496, 124, 32);
      hCtx.fill();

      hCtx.strokeStyle = energy < 25 ? "#ef4444" : "#0284c7";
      hCtx.lineWidth = 6;
      hCtx.stroke();

      hCtx.font = "900 26px system-ui, -apple-system, sans-serif";
      hCtx.textAlign = "center";
      hCtx.textBaseline = "middle";

      const filledBars = Math.floor(energy / 20);
      let barStr = "";
      for (let b = 0; b < 5; b++) {
        barStr += b < filledBars ? "■ " : "□ ";
      }

      hCtx.fillStyle = energy < 25 ? "#ef4444" : "#38bdf8";
      hCtx.fillText(`BATTERY: ${barStr}`, 200, 70);

      hCtx.fillStyle = "#ffffff";
      hCtx.font = "800 22px system-ui, sans-serif";
      hCtx.fillText(`${distLeft}m`, 420, 70);

      holoTex.needsUpdate = true;
    };

    // Jet Turbine Exhaust Flame
    const flameCanvas = document.createElement("canvas");
    flameCanvas.width = 128;
    flameCanvas.height = 256;
    const fCtx = flameCanvas.getContext("2d");
    if (fCtx) {
      const fGrad = fCtx.createLinearGradient(64, 0, 64, 256);
      fGrad.addColorStop(0.00, "rgba(255, 255, 255, 1.0)");
      fGrad.addColorStop(0.12, "rgba(100, 240, 255, 0.98)");
      fGrad.addColorStop(0.35, "rgba(0, 150, 255, 0.85)");
      fGrad.addColorStop(0.65, "rgba(255, 110, 0, 0.70)");
      fGrad.addColorStop(0.90, "rgba(255, 40, 0, 0.35)");
      fGrad.addColorStop(1.00, "rgba(0, 0, 0, 0)");
      fCtx.fillStyle = fGrad;
      fCtx.beginPath();
      fCtx.moveTo(64, 0);
      fCtx.bezierCurveTo(90, 40, 110, 140, 64, 256);
      fCtx.bezierCurveTo(18, 140, 38, 40, 64, 0);
      fCtx.fill();
    }
    const flameTex = new THREE.CanvasTexture(flameCanvas);
    const flameMat = new THREE.SpriteMaterial({
      map: flameTex,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const afterburnerFlame = new THREE.Sprite(flameMat);
    afterburnerFlame.position.set(0, 0.46, 1.75);
    afterburnerFlame.scale.set(0.65, 1.8, 1);
    carGroup.add(afterburnerFlame);

    const underglowLight = new THREE.PointLight(0x38bdf8, 4.5, 6.0);
    underglowLight.position.set(0, 0.20, 0);
    carGroup.add(underglowLight);

    let wheelFL: THREE.Object3D | null = null;
    let wheelFR: THREE.Object3D | null = null;
    let wheelRL: THREE.Object3D | null = null;
    let wheelRR: THREE.Object3D | null = null;
    const leftFlaps: THREE.Object3D[] = [];
    const rightFlaps: THREE.Object3D[] = [];
    const suspensionSprings: THREE.Object3D[] = [];
    const jetNozzlePetals: THREE.Object3D[] = [];

    const loadingManager = new THREE.LoadingManager();
    loadingManager.onProgress = (_url, itemsLoaded, itemsTotal) => {
      const progress = Math.min(100, Math.round((itemsLoaded / Math.max(1, itemsTotal)) * 100));
      if (onLoadProgress) onLoadProgress(progress);
    };
    loadingManager.onLoad = () => {
      renderer.compile(scene, camera);
      if (onLoadProgress) onLoadProgress(100);
      if (onLoadComplete) onLoadComplete();
    };

    const loader = new GLTFLoader(loadingManager);
    loader.load(
      "/models/batmobile.glb",
      (gltf) => {
        const model = gltf.scene;

        model.traverse((child) => {
          if (child.name === "Wheel_Front_Left_0117" || child.name === "bone_left_front_wheel_rot_01_064") {
            wheelFL = child;
          }
          if (child.name === "Wheel_Front_Right_0116" || child.name === "bone_right_front_wheel_rot_01_085") {
            wheelFR = child;
          }
          if (child.name === "Wheel_Rear_Left_0118" || child.name === "bone_rear_left_wheel_013") {
            wheelRL = child;
          }
          if (child.name === "Wheel_Rear_Right_0119" || child.name === "bone_rear_right_wheel_012") {
            wheelRR = child;
          }

          // Active Aero Air-Brake Flaps
          if (child.name.startsWith("FLAP_bone_left")) {
            leftFlaps.push(child);
          }
          if (child.name.startsWith("FLAP_bone_right")) {
            rightFlaps.push(child);
          }

          // Front Suspension Springs
          if (child.name.includes("front_upper_spring")) {
            suspensionSprings.push(child);
          }

          // Jet Turbine Nozzle Iris Petals
          if (child.name.startsWith("bone_rear_jet_")) {
            jetNozzlePetals.push(child);
          }

          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.castShadow = true;
            mesh.receiveShadow = true;

            if (mesh.material) {
              const mat = mesh.material as THREE.MeshStandardMaterial;
              mat.envMapIntensity = 1.6;
              mat.needsUpdate = true;

              if (
                mesh.name.toLowerCase().includes("glass") ||
                (mat.name && mat.name.toLowerCase().includes("glass"))
              ) {
                mat.transparent = true;
                mat.opacity = 0.55;
                mat.roughness = 0.12;
                mat.metalness = 0.85;
              }
            }
          }
        });

        // 🎯 EXACT BATMOBILE GROUNDING & FORWARD ORIENTATION RIG
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());

        // Center on X and Z, place bottom of tires flush with road surface (Y = 0)
        model.position.x = -center.x;
        model.position.y = -box.min.y;
        model.position.z = -center.z;

        // Cinematic Scaling: Tumbler width scaled to 2.60 units
        const targetScale = 2.60 / size.z;
        model.scale.set(targetScale, targetScale, targetScale);

        const carPivot = new THREE.Group();
        carPivot.add(model);
        // Aligns front (+X in model space) facing down the highway into the horizon (-Z)
        carPivot.rotation.y = Math.PI / 2;

        carGroup.add(carPivot);
      }
    );

    // --- 10. GAME STATE & ECONOMY (1000m ROAD FIGHTER MISSION) ---
    let gameScore = 0;
    let comboMultiplier = 1;
    let energyLevel = 100.0;
    let distanceRemaining = 1000;
    let currentGameState: "BRIEFING" | "PLAYING" | "WON" | "LOST" = "PLAYING";
    let nearMissCount = 0;
    let skidTimer = 0;

    let carX = 0;
    let steerInput = 0;
    let carSteerVelocity = 0;
    let isBoosting = false;
    let isBraking = false;
    let lapTime = 0;
    let trackDistance = 0;

    // Reset Round Handler
    const resetGameRound = () => {
      gameScore = 0;
      comboMultiplier = 1;
      energyLevel = 100.0;
      distanceRemaining = 1000;
      currentGameState = "PLAYING";
      nearMissCount = 0;
      skidTimer = 0;
      trackDistance = 0;
      lapTime = 0;
      currentLane = 1;
      targetCarX = lanePositions[currentLane];
      carX = 0;

      // Re-initialize entities
      for (let i = 0; i < poolSize; i++) {
        const item = entityPool[i];
        const isHazard = i % 4 !== 0;
        const initZ = -50 - Math.floor(i / 3) * 35;
        const initLane = i % 3;
        setEntityVisuals(item, initZ, initLane, isHazard);
      }
    };
    resetTriggerRef.current = resetGameRound;

    // --- 11. 🎮 AAA ARCADE INPUT ENGINE (INSTANT TAP, SWIPE FLICK & MOUSE BOOST) ---
    let touchStartX = 0;
    let swipeTriggered = false;

    const handlePointerDown = (e: PointerEvent) => {
      if (currentGameState !== "PLAYING") return;
      touchStartX = e.clientX;
      swipeTriggered = false;

      // 📱 MOBILE TOUCH: Instant 1-Frame Tap Response (Left Half / Right Half)
      if (e.pointerType === "touch" || window.innerWidth < 768) {
        if (e.clientX < window.innerWidth * 0.5) {
          currentLane = Math.max(0, currentLane - 1);
        } else {
          currentLane = Math.min(2, currentLane + 1);
        }
        targetCarX = lanePositions[currentLane];
      }

      // 🖱️ DESKTOP MOUSE: Hold Left-Click for Afterburner Boost
      if (e.pointerType === "mouse" || e.button === 0) {
        isBoosting = true;
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (currentGameState !== "PLAYING") return;

      // 📱 MOBILE SWIPE FLICK GESTURE
      if (e.pointerType === "touch" || window.innerWidth < 768) {
        const deltaX = e.clientX - touchStartX;
        if (!swipeTriggered && Math.abs(deltaX) > 28) {
          swipeTriggered = true;
          if (deltaX > 28) currentLane = Math.min(2, currentLane + 1);
          else if (deltaX < -28) currentLane = Math.max(0, currentLane - 1);
          targetCarX = lanePositions[currentLane];
        }
        return;
      }

      // 🖱️ DESKTOP MOUSE: Analog Glide with 15% Deadzone
      const normX = (e.clientX / window.innerWidth) * 2 - 1;
      if (normX < -0.22) currentLane = 0;
      else if (normX > 0.22) currentLane = 2;
      else currentLane = 1;
      targetCarX = lanePositions[currentLane];
    };

    const handlePointerUp = (e: PointerEvent) => {
      swipeTriggered = false;
      if (e.pointerType === "mouse" || e.button === 0) isBoosting = false;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (currentGameState !== "PLAYING") return;
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        currentLane = Math.max(0, currentLane - 1);
        targetCarX = lanePositions[currentLane];
      } else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        currentLane = Math.min(2, currentLane + 1);
        targetCarX = lanePositions[currentLane];
      } else if (e.key === "ArrowUp" || e.key === "w" || e.key === "W" || e.key === " " || e.key === "Shift") {
        isBoosting = true;
      } else if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") {
        isBraking = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp" || e.key === "w" || e.key === "W" || e.key === " " || e.key === "Shift") {
        isBoosting = false;
      } else if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") {
        isBraking = false;
      }
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    // --- 12. RESIZE HANDLER ---
    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const aspect = w / h;
      const isMob = w < 768 || aspect < 0.65;
      camera.aspect = aspect;
      camera.fov = isMob ? 72 : 64;
      camera.position.set(0, isMob ? 3.4 : 2.85, isMob ? (aspect < 0.55 ? 8.6 : 7.8) : 6.2);
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      composer.setSize(w, h);
      bloomPass.setSize(w / 2, h / 2);

      lanePitch = getLanePitch();
      lanePositions = [-lanePitch, 0.0, lanePitch];
      targetCarX = lanePositions[currentLane];
    };
    window.addEventListener("resize", handleResize);

    // --- 13. CALM, GROUNDED 60FPS GAME LOOP ---
    let animFrameId: number;
    const clock = new THREE.Clock();

    const tick = () => {
      const delta = Math.min(clock.getDelta(), 0.08);
      const time = clock.getElapsedTime();

      if (currentGameState === "PLAYING") {
        // 1. Fuel / Battery Drain (1.8% per sec)
        energyLevel = Math.max(0, energyLevel - delta * 1.8);

        // 2. Distance Count-down (1000m to 0m)
        distanceRemaining = Math.max(0, 1000 - Math.floor(trackDistance * 1.8));

        // Check Victory & Defeat Conditions
        if (distanceRemaining <= 0 && energyLevel > 0) {
          currentGameState = "WON";
          if (!isMutedRef.current) audio.playVictoryChime();
        } else if (energyLevel <= 0) {
          currentGameState = "LOST";
          if (!isMutedRef.current) audio.playOverloadAlarm();
        }
      }

      if (skidTimer > 0) {
        skidTimer -= delta;
      }

      // Shockwave Ring Decay
      if (shockwaveLife > 0) {
        shockwaveLife -= delta * 3.0;
        shockwaveMesh.scale.addScalar(delta * 14.0);
        (shockwaveMesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, shockwaveLife);
      } else {
        (shockwaveMesh.material as THREE.MeshBasicMaterial).opacity = 0;
      }

      // 3. CALM, HUMAN PACING (Cruising speed: 115 km/h)
      const isDriving = currentGameState === "PLAYING";
      const targetSpeed = !isDriving ? 0 : skidTimer > 0 ? 55 : isBoosting ? 145 : 115;
      const currentSpeed = targetSpeed;
      lapTime += isDriving ? delta : 0;

      const forwardDelta = isDriving ? (currentSpeed * 0.16 * delta) : 0;
      trackDistance += forwardDelta;

      // 🔴 RED AFTERBURNER JET TURBINE OVERDRIVE MODE
      if (isBoosting && isDriving) {
        afterburnerFlame.material.opacity = 0.95 + Math.sin(time * 60) * 0.05;
        afterburnerFlame.scale.set(0.95, 2.6 + Math.sin(time * 80) * 0.6, 1);
        underglowLight.color.setHex(0xef4444); // Red Overdrive Underglow
        underglowLight.intensity = 8.5;
      } else {
        afterburnerFlame.material.opacity = Math.max(0, afterburnerFlame.material.opacity - delta * 5.0);
        underglowLight.color.setHex(0x38bdf8); // Stealth Cyan Underglow
        underglowLight.intensity = 4.5;
      }

      // Road texture scroll
      roadUniforms.uDistance.value = trackDistance;
      if (skylineTex && isDriving) {
        skylineTex.offset.x = (trackDistance * 0.00015) % 1;
      }
      const targetLightsOut = isLightsOutRef.current ? 1.0 : 0.0;
      roadUniforms.uLightsOut.value += (targetLightsOut - roadUniforms.uLightsOut.value) * 0.1;
      beamMat.opacity = 0.80 + roadUniforms.uLightsOut.value * 0.15;

      // 4. ENTITY MOVEMENTS & 3-LANE COLLISIONS
      const passedIndices: number[] = [];

      for (let i = 0; i < entityPool.length; i++) {
        const item = entityPool[i];
        if (isDriving) {
          item.z += forwardDelta;
        }
        item.group.position.z = item.z;
        item.group.position.x = lanePositions[item.laneIndex];

        if (!item.isHazard) {
          item.mesh.rotation.y += 0.035;
        }

        // Collision Check with Batmobile Tumbler (Lane-Aligned)
        const distZ = Math.abs(item.z - 0);
        const distX = Math.abs(carX - lanePositions[item.laneIndex]);

        if (isDriving && item.active && distZ < 1.55 && distX < 1.25) {
          item.active = false;
          item.group.visible = false;

          if (!item.isHazard) {
            // ⚡ COLLECTED RARE FUEL CORE!
            if (!isMutedRef.current) audio.playMergeChime(8, 1);
            gameScore += 500 * comboMultiplier;
            energyLevel = Math.min(100, energyLevel + 20.0);

            shockwaveMesh.position.set(carX, 0.05, 0);
            shockwaveMesh.scale.set(1, 1, 1);
            (shockwaveMesh.material as THREE.MeshBasicMaterial).color.setHex(0x38bdf8);
            (shockwaveMesh.material as THREE.MeshBasicMaterial).opacity = 0.95;
            shockwaveLife = 1.0;
          } else {
            // ⚠️ HIT A TRAFFIC HAZARD (Tire skid, -15% energy, reset combo)
            if (!isMutedRef.current) audio.playOverloadAlarm();
            skidTimer = 0.45;
            comboMultiplier = 1;
            energyLevel = Math.max(0, energyLevel - 15.0);

            shockwaveMesh.position.set(carX, 0.05, 0);
            shockwaveMesh.scale.set(1, 1, 1);
            (shockwaveMesh.material as THREE.MeshBasicMaterial).color.setHex(0xef4444);
            (shockwaveMesh.material as THREE.MeshBasicMaterial).opacity = 0.95;
            shockwaveLife = 1.0;
          }
        }

        // 🌟 "NEAR-MISS" SLIPSTREAM BONUS
        if (isDriving && item.active && item.isHazard && !item.nearMissed && distZ < 2.5 && distX >= 1.25 && distX < 2.2) {
          item.nearMissed = true;
          if (!isMutedRef.current) audio.playClick();
          gameScore += 200 * comboMultiplier;
          comboMultiplier = Math.min(8, comboMultiplier + 1);
          nearMissCount++;
        }

        // Check if entity has passed behind the camera
        if (item.z > 8.0) {
          passedIndices.push(i);
        }
      }

      // 🌊 CHOREOGRAPHED WAVE SPAWN (When 3 entities pass behind)
      if (passedIndices.length >= 3) {
        const minZ = Math.min(...entityPool.map((e) => e.z));
        const newWaveZ = minZ - 35;
        spawnWaveFormation(newWaveZ, passedIndices.slice(0, 3));
      }

      // 5. 🏎️ VELVETY SMOOTH CRITICALLY-DAMPED SPRING PHYSICS & BODY ROLL
      const springConstant = 88.0; // Crisp arcade responsiveness
      const dampingFactor = 16.8; // Critical damping (buttery smooth settle, zero jumpiness)
      const force = (targetCarX - carX) * springConstant - carSteerVelocity * dampingFactor;
      carSteerVelocity += force * delta;
      carX += carSteerVelocity * delta;

      if (Math.abs(targetCarX - carX) < 0.005 && Math.abs(carSteerVelocity) < 0.05) {
        carX = targetCarX;
        carSteerVelocity = 0;
      }

      const steerDiff = targetCarX - carX;
      const skidWobble = skidTimer > 0 ? Math.sin(time * 40) * 0.14 * skidTimer : 0;

      carGroup.position.x = carX + skidWobble;
      carGroup.position.y = 0.02;
      carGroup.position.z = 0;

      groundShadow.position.x = carX + skidWobble;
      groundShadow.position.z = 0;

      // 🛞 RIG 1: 4-Wheel Monster Tread Axle Rotation
      if (carGroup.children[2]) {
        carGroup.children[2].traverse((child: any) => {
          if (child.isMesh && (child.name.toLowerCase().includes("wheel") || child.name.toLowerCase().includes("tire") || child.name.toLowerCase().includes("rim"))) {
            child.rotation.x += forwardDelta * 1.8;
          }
        });
      }

      // 🪽 RIG 2: Active Aero Air-Brake Flaps (Winglets)
      const targetFlapAngle = (Math.abs(carSteerVelocity) > 1.2 || isBraking) ? 0.45 : (isBoosting ? -0.15 : 0.0);
      if (carGroup.children[2]) {
        carGroup.children[2].traverse((child: any) => {
          if (child.isMesh && (child.name.toLowerCase().includes("wing") || child.name.toLowerCase().includes("flap") || child.name.toLowerCase().includes("aero") || child.name.toLowerCase().includes("spoiler"))) {
            child.rotation.x += (targetFlapAngle - child.rotation.x) * 0.18;
          }
        });
      }

      // 🏋️ RIG 3: Heavy 2.5-Ton Suspension (6-8° Body Roll, Yaw Counter-Steer, Boost Squat)
      if (carGroup.children[2]) {
        const carPivot = carGroup.children[2];
        carPivot.rotation.z = -carSteerVelocity * 0.065; // Proportional smooth body roll
        carPivot.rotation.y = Math.PI / 2 + carSteerVelocity * 0.035; // Gentle yaw counter-steer
        carPivot.rotation.x = isBoosting ? 0.035 : (isBraking ? -0.025 : 0.0); // Squat / Dive
      }

      const onKerb = Math.abs(carX) > 2.85;
      if (onKerb && isDriving && Math.random() < 0.08) {
        playKerbRumble(isMutedRef.current);
      }

      // Subtle realistic steering yaw
      carGroup.rotation.z = -carSteerVelocity * 0.015;
      carGroup.rotation.y = -carSteerVelocity * 0.012;
      carGroup.rotation.x = 0;

      // In-World Roof HUD Update
      updateRoofHologram(Math.round(energyLevel), distanceRemaining, comboMultiplier);

      // Headlight & Ground Beam Tracking
      leftHeadlight.position.set(carX - 0.62, 0.38, -0.2);
      rightHeadlight.position.set(carX + 0.62, 0.38, -0.2);
      headlightTarget.position.set(carX, 0.05, -35.0);
      roadBeamDecal.position.x = carX;

      batUnderbody.position.set(carX, 0.08, 0.6);


      // Jet Afterburner Flame
      if (isBoosting && isDriving) {
        afterburnerFlame.material.opacity = 0.95;
        afterburnerFlame.scale.set(0.65 + Math.random() * 0.12, 1.8 + Math.random() * 0.3, 1);
      } else {
        afterburnerFlame.material.opacity = 0;
      }

      // 1:1 Physical 4-Wheel Axle Spin & Steering Sync
      const tireRadius = 0.38;
      const angularDelta = forwardDelta / tireRadius;

      if (wheelFL) {
        wheelFL.rotation.y += angularDelta;
        wheelFL.rotation.z = THREE.MathUtils.lerp(wheelFL.rotation.z, -steerInput * 0.45, 0.25);
      }
      if (wheelFR) {
        wheelFR.rotation.y -= angularDelta;
        wheelFR.rotation.z = THREE.MathUtils.lerp(wheelFR.rotation.z, -steerInput * 0.45, 0.25);
      }
      if (wheelRL) wheelRL.rotation.y += angularDelta;
      if (wheelRR) wheelRR.rotation.y -= angularDelta;

      // Active Aero Air-Brake Flaps
      const leftCornerForce = Math.max(0, -carSteerVelocity * 0.12);
      const rightCornerForce = Math.max(0, carSteerVelocity * 0.12);
      const baseAeroBrake = isBraking ? 0.50 : 0.0;

      const targetLeftFlap = Math.min(0.55, baseAeroBrake + leftCornerForce * 0.35);
      const targetRightFlap = Math.min(0.55, baseAeroBrake + rightCornerForce * 0.35);

      leftFlaps.forEach((f) => {
        f.rotation.z = THREE.MathUtils.lerp(f.rotation.z, targetLeftFlap, 0.15);
      });
      rightFlaps.forEach((f) => {
        f.rotation.z = THREE.MathUtils.lerp(f.rotation.z, -targetRightFlap, 0.15);
      });

      // 6. ROCK-SOLID ELEVATED CHASE CAMERA (Zero Bouncing, Zero Spring Wobble)
      camera.position.set(carX * 0.28, 2.85, 6.2);
      camera.lookAt(carX * 0.28, 0.45, -20.0);

      // Audio Engine
      const rpm = Math.floor(10500 + (currentSpeed % 40) * 80 + (isBoosting ? 2000 : 0));
      updateF1Engine(rpm, currentSpeed, isBoosting, isMutedRef.current, 5);

      if (onTelemetryUpdate) {
        onTelemetryUpdate({
          speed: Math.round(currentSpeed),
          gear: 5,
          rpm,
          lapTime,
          isBoosting,
          isDrifting: Math.abs(carSteerVelocity) > 2.5 || skidTimer > 0,
          isFlying: false,
          isLightsOut: isLightsOutRef.current,
          onKerb,
          currentSector: 1,
          sectorsCrossed: Math.floor(lapTime / 30),
          score: gameScore,
          multiplier: comboMultiplier,
          energy: Math.round(energyLevel),
          distanceRemaining,
          gameState: currentGameState,
          nearMissCount,
        });
      }

      composer.render();
      animFrameId = requestAnimationFrame(tick);
    };

    animFrameId = requestAnimationFrame(tick);

    // --- 14. CLEANUP ---
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
      pmremGenerator.dispose();
      studioEnvMap.dispose();
      roadGeometry.dispose();
      roadMaterial.dispose();
      shadowTex.dispose();
      shadowMat.dispose();
      flareTex.dispose();
      flareMat.dispose();
      beamTex.dispose();
      beamMat.dispose();
      batTex.dispose();
      batMat.dispose();
      skylineTex.dispose();
      skylineMat.dispose();
      skylineGeo.dispose();
      skylineMat.dispose();
      skylineTex.dispose();
      flameTex.dispose();
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
