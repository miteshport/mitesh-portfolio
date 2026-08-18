"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three-stdlib";
import { EffectComposer, RenderPass, UnrealBloomPass } from "three-stdlib";
import { playKerbRumble, updateF1Engine } from "@/utils/f1EngineAudio";

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

    // --- 1. THREE.JS SCENE SETUP ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020409);
    scene.fog = new THREE.FogExp2(0x020409, 0.0055);

    const isInitMobile = typeof window !== "undefined" && window.innerWidth < 768;
    const initialFOV = isInitMobile ? 58 : 50;
    const initialCamZ = isInitMobile ? 4.9 : 3.6;
    const initialCamY = isInitMobile ? 1.15 : 0.95;

    const camera = new THREE.PerspectiveCamera(
      initialFOV,
      window.innerWidth / window.innerHeight,
      0.1,
      500
    );
    camera.position.set(0, initialCamY, initialCamZ);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // --- 2. 🪞 PROCEDURAL STUDIO HDRI ENVIRONMENT MAP (PMREMGenerator) ---
    // Generates studio lighting strips for photorealistic metallic clearcoat reflections
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();

    const envScene = new THREE.Scene();
    envScene.background = new THREE.Color(0x04060c);

    // Softbox Light Strips around the vehicle reflection volume
    const createSoftbox = (w: number, h: number, col: number, pos: [number, number, number], rot: [number, number, number]) => {
      const geo = new THREE.PlaneGeometry(w, h);
      const mat = new THREE.MeshBasicMaterial({ color: col, side: THREE.DoubleSide });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(...pos);
      mesh.rotation.set(...rot);
      envScene.add(mesh);
    };

    // Overhead high-intensity white studio strip
    createSoftbox(16, 3, 0xffffff, [0, 8, 0], [Math.PI / 2, 0, 0]);
    // Lateral cyan/blue rim strips
    createSoftbox(20, 2, 0x88ccff, [-6, 3, 0], [0, Math.PI / 2, 0]);
    createSoftbox(20, 2, 0x88ccff, [6, 3, 0], [0, -Math.PI / 2, 0]);
    // Front and rear specular glints
    createSoftbox(8, 2, 0xddf0ff, [0, 2, -10], [0, 0, 0]);
    createSoftbox(8, 2, 0x334466, [0, 2, 10], [0, Math.PI, 0]);

    const studioEnvMap = pmremGenerator.fromScene(envScene, 0.04).texture;
    scene.environment = studioEnvMap;

    // --- 3. 💥 POST-PROCESSING & CINEMATIC BLOOM COMPOSER ---
    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      1.15, // strength
      0.40, // radius
      0.82  // threshold: only high-emissive headlights / bat-signal bleed
    );
    composer.addPass(bloomPass);

    // --- 4. LIGHTING RIG ---
    const ambientLight = new THREE.AmbientLight(0xddeeff, 0.65);
    scene.add(ambientLight);

    const keyRimLeft = new THREE.DirectionalLight(0xdbeafe, 3.8);
    keyRimLeft.position.set(-8, 12, 4);
    scene.add(keyRimLeft);

    const keyRimRight = new THREE.DirectionalLight(0xdbeafe, 3.8);
    keyRimRight.position.set(8, 12, 4);
    scene.add(keyRimRight);

    const topGlanceLight = new THREE.DirectionalLight(0xffffff, 2.5);
    topGlanceLight.position.set(0, 18, -4);
    scene.add(topGlanceLight);

    // Forward Tactical Spotlights
    const leftHeadlight = new THREE.SpotLight(0x7dd3fc, 65, 110, Math.PI / 5, 0.35, 1.2);
    leftHeadlight.position.set(-0.7, 0.45, 0);
    scene.add(leftHeadlight);

    const rightHeadlight = new THREE.SpotLight(0x7dd3fc, 65, 110, Math.PI / 5, 0.35, 1.2);
    rightHeadlight.position.set(0.7, 0.45, 0);
    scene.add(rightHeadlight);

    const headlightTarget = new THREE.Object3D();
    headlightTarget.position.set(0, 0.1, -40);
    scene.add(headlightTarget);
    leftHeadlight.target = headlightTarget;
    rightHeadlight.target = headlightTarget;

    // Volumetric Headlight Cones
    const coneGeo = new THREE.ConeGeometry(3.6, 34, 24, 1, true);
    coneGeo.rotateX(Math.PI / 2);
    coneGeo.translate(0, 0, -17);

    const coneMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.055,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    const leftVolCone = new THREE.Mesh(coneGeo, coneMat);
    scene.add(leftVolCone);
    const rightVolCone = new THREE.Mesh(coneGeo, coneMat);
    scene.add(rightVolCone);

    // Underbody Dark Navy AO Glow (No red)
    const batUnderbody = new THREE.PointLight(0x0e2444, 4.0, 6.0);
    scene.add(batUnderbody);

    // --- 5. 🦇 1024x1024 RAZOR-SHARP DC BAT-SIGNAL ---
    const batCanvas = document.createElement("canvas");
    batCanvas.width = 1024;
    batCanvas.height = 1024;
    const bCtx = batCanvas.getContext("2d");
    if (bCtx) {
      // 1. High-Contrast Cinematic Teal/White Spotlight
      const spotGrad = bCtx.createRadialGradient(512, 500, 10, 512, 500, 480);
      spotGrad.addColorStop(0.00, "rgba(255, 255, 255, 1.00)");
      spotGrad.addColorStop(0.20, "rgba(215, 250, 255, 0.98)");
      spotGrad.addColorStop(0.44, "rgba(90, 210, 240, 0.88)");
      spotGrad.addColorStop(0.70, "rgba(25, 125, 190, 0.45)");
      spotGrad.addColorStop(0.90, "rgba(8, 45, 100, 0.12)");
      spotGrad.addColorStop(1.00, "rgba(0, 0, 0, 0)");
      bCtx.fillStyle = spotGrad;
      bCtx.beginPath();
      bCtx.arc(512, 512, 480, 0, Math.PI * 2);
      bCtx.fill();

      // 2. Projector Lens Ring
      bCtx.strokeStyle = "rgba(45, 175, 225, 0.65)";
      bCtx.lineWidth = 8;
      bCtx.beginPath();
      bCtx.arc(512, 512, 468, 0, Math.PI * 2);
      bCtx.stroke();

      // 3. Bat Cutout (Scale 2.25 = perfectly framed inside the 480px spotlight circle with clean margins)
      bCtx.save();
      bCtx.translate(512, 515);
      bCtx.scale(2.25, 2.25);
      bCtx.globalCompositeOperation = "destination-out";
      bCtx.fillStyle = "rgba(0, 0, 0, 1)";

      bCtx.beginPath();
      bCtx.moveTo(0, 30);

      // RIGHT WING (Scalloped DC / BvS Profile)
      bCtx.bezierCurveTo(22, 30, 42, 22, 56, 10);
      bCtx.bezierCurveTo(66, 2, 76, 10, 86, 18);
      bCtx.bezierCurveTo(94, 24, 102, 8, 110, -2);
      bCtx.bezierCurveTo(118, -5, 126, 10, 134, 16);
      bCtx.bezierCurveTo(140, 20, 148, 4, 152, -12);
      bCtx.bezierCurveTo(157, -24, 161, -36, 164, -44);
      bCtx.bezierCurveTo(162, -35, 158, -22, 150, -14);
      bCtx.bezierCurveTo(140, -4, 126, -18, 112, -30);
      bCtx.bezierCurveTo(94, -42, 74, -48, 54, -52);
      bCtx.bezierCurveTo(42, -54, 30, -55, 22, -57);
      bCtx.bezierCurveTo(16, -58, 10, -58, 7, -55);
      bCtx.bezierCurveTo(4, -52, 1, -48, 0, -46);

      // LEFT WING (Exact Mirror)
      bCtx.bezierCurveTo(-1, -48, -4, -52, -7, -55);
      bCtx.bezierCurveTo(-10, -58, -16, -58, -22, -57);
      bCtx.bezierCurveTo(-30, -55, -42, -54, -54, -52);
      bCtx.bezierCurveTo(-74, -48, -94, -42, -112, -30);
      bCtx.bezierCurveTo(-126, -18, -140, -4, -150, -14);
      bCtx.bezierCurveTo(-158, -22, -162, -35, -164, -44);
      bCtx.bezierCurveTo(-161, -36, -157, -24, -152, -12);
      bCtx.bezierCurveTo(-148, 4, -140, 20, -134, 16);
      bCtx.bezierCurveTo(-126, 10, -118, -5, -110, -2);
      bCtx.bezierCurveTo(-102, 8, -94, 24, -86, 18);
      bCtx.bezierCurveTo(-76, 10, -66, 2, -56, 10);
      bCtx.bezierCurveTo(-42, 22, -22, 30, 0, 30);

      bCtx.closePath();
      bCtx.fill();
      bCtx.globalCompositeOperation = "source-over";
      bCtx.restore();
    }

    const batTex = new THREE.CanvasTexture(batCanvas);
    const batMat = new THREE.SpriteMaterial({
      map: batTex,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      fog: false,
      depthWrite: false,
    });
    const batSignalSprite = new THREE.Sprite(batMat);
    batSignalSprite.position.set(0, 32, -135);
    batSignalSprite.scale.set(30, 30, 1);
    scene.add(batSignalSprite);

    // --- 6. 🌆 GOTHAM CITY SKYLINE (BATMAN: TAS ART DECO SILHOUETTES WITH BASE FOG MIST) ---
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

        // Ambient Gotham Window Slits (Subtle warm amber & cyan pinpricks)
        for (let wy = 512 - b.h + 24; wy < 400; wy += 32) {
          for (let wx = b.x + 14; wx < b.x + b.w - 14; wx += 24) {
            if (Math.random() < 0.24) {
              const isAmber = Math.random() < 0.65;
              ctx.fillStyle = isAmber ? "rgba(220, 175, 75, 0.40)" : "rgba(80, 185, 235, 0.30)";
              ctx.fillRect(wx, wy, 3, 7);
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
      opacity: 0.85,
      side: THREE.DoubleSide,
      fog: true,
    });

    // Left and Right Skyline Flanks (deeper placement with seamless horizon blending)
    const skylineGeo = new THREE.PlaneGeometry(420, 52);
    const leftSkyline = new THREE.Mesh(skylineGeo, skylineMat);
    leftSkyline.position.set(-30, 16, -170);
    leftSkyline.rotation.y = Math.PI / 16;
    scene.add(leftSkyline);

    const rightSkyline = new THREE.Mesh(skylineGeo, skylineMat);
    rightSkyline.position.set(30, 16, -170);
    rightSkyline.rotation.y = -Math.PI / 16;
    scene.add(rightSkyline);

    // --- 7. 🌧️ HIGH-SPEED RAIN STREAKS ---
    const rainCount = 180;
    const rainGeo = new THREE.BufferGeometry();
    const rainPositions = new Float32Array(rainCount * 2 * 3);

    for (let i = 0; i < rainCount; i++) {
      const rx = (Math.random() - 0.5) * 22;
      const ry = Math.random() * 8 + 0.4;
      const rz = -Math.random() * 80;
      const len = Math.random() * 0.7 + 0.4;

      const idx = i * 6;
      rainPositions[idx] = rx;
      rainPositions[idx + 1] = ry;
      rainPositions[idx + 2] = rz;

      rainPositions[idx + 3] = rx;
      rainPositions[idx + 4] = ry - len;
      rainPositions[idx + 5] = rz - len * 0.5;
    }

    rainGeo.setAttribute("position", new THREE.BufferAttribute(rainPositions, 3));
    const rainMat = new THREE.LineBasicMaterial({
      color: 0x90d5ff,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
    });
    const rainLines = new THREE.LineSegments(rainGeo, rainMat);
    scene.add(rainLines);

    // --- 8. ENDLESS WET OBSIDIAN HIGHWAY SHADER ---
    const roadWidth = 10.4;
    const roadLength = 390.0;
    const roadCenterZ = -165.0;
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
        float worldZPos = pos.y + (${roadCenterZ.toFixed(1)});
        float zDist = -worldZPos;
        vWorldZ = zDist;

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
        float grain = rand(vUv * 600.0) * 0.028;

        vec3 asphaltColor = vec3(0.022, 0.024, 0.030) + grain;

        // Dashed Centerline
        float centerDist = abs(vUv.x - 0.5);
        float dashPattern = step(0.48, fract(movingDist * 0.08));
        if (centerDist < 0.0035 && dashPattern > 0.5) {
          asphaltColor = mix(asphaltColor, vec3(0.92, 0.78, 0.28), 0.75);
        }

        // Shoulder Lines
        float leftEdge = abs(vUv.x - 0.035);
        float rightEdge = abs(vUv.x - 0.965);
        if (leftEdge < 0.0028 || rightEdge < 0.0028) {
          asphaltColor = vec3(0.95, 0.95, 0.98);
        }

        // Wet Specular Asphalt Reflections
        float spec = pow(max(0.0, 1.0 - abs(vUv.x - 0.5) * 1.8), 3.5) * 0.32;
        asphaltColor += vec3(spec * 0.25, spec * 0.50, spec * 0.90);

        // Headlight Projection Mask
        if (uLightsOut > 0.01) {
          float headlightMask = smoothstep(130.0, 10.0, vDepth) * smoothstep(5.0, 0.0, abs(vWorldX));
          asphaltColor *= mix(0.10, 1.4, headlightMask);
        }

        // Depth Fog Fade
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

    // --- 9. TIRE VAPOR & GROUND CONTACT AO SHADOW ---
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

    const smokeParticleCount = 44;
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

    // High-Quality Diffuser Ground AO Shadow
    const shadowCanvas = document.createElement("canvas");
    shadowCanvas.width = 128;
    shadowCanvas.height = 128;
    const shCtx = shadowCanvas.getContext("2d");
    if (shCtx) {
      const grad = shCtx.createRadialGradient(64, 64, 0, 64, 64, 64);
      grad.addColorStop(0, "rgba(0, 0, 0, 0.98)");
      grad.addColorStop(0.55, "rgba(0, 0, 0, 0.60)");
      grad.addColorStop(1, "rgba(0, 0, 0, 0)");
      shCtx.fillStyle = grad;
      shCtx.fillRect(0, 0, 128, 128);
    }
    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      opacity: 0.90,
      depthWrite: false,
    });
    const groundShadow = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 4.4), shadowMat);
    groundShadow.rotation.x = -Math.PI / 2;
    groundShadow.position.y = 0.025;
    scene.add(groundShadow);

    // --- 10. 🦇 3D BATMOBILE TUMBLER (AUTHENTIC NOLAN STEALTH ARMOR) ---
    const carGroup = new THREE.Group();
    scene.add(carGroup);

    const loader = new GLTFLoader();
    loader.load(
      "/models/batmobile.glb",
      (gltf) => {
        const model = gltf.scene;
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());

        // Center on X and Z, place bottom of tires flush with road surface (Y = 0)
        model.position.x = -center.x;
        model.position.y = -box.min.y;
        model.position.z = -center.z;

        const maxDim = Math.max(size.x, size.y, size.z);
        const targetScale = 3.6 / maxDim;
        model.scale.set(targetScale, targetScale, targetScale);

        // Apply Nolan Military Stealth Armor & Rubber Shaders
        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.castShadow = true;
            mesh.receiveShadow = true;

            const cBox = new THREE.Box3().setFromObject(mesh);
            const cCenter = cBox.getCenter(new THREE.Vector3());
            const cSize = cBox.getSize(new THREE.Vector3());

            // Wheel detection by corner coordinates
            const isWheel =
              (Math.abs(cCenter.z) > 0.012 && Math.abs(cCenter.x) > 0.032 && cSize.x > 0.012) ||
              mesh.name.toLowerCase().includes("wheel") ||
              mesh.name.toLowerCase().includes("tire") ||
              mesh.name.toLowerCase().includes("tyre") ||
              mesh.name.toLowerCase().includes("rim");

            if (mesh.material) {
              const originalMat = mesh.material as THREE.MeshStandardMaterial;

              // Christopher Nolan Tumbler Military Stealth Armor Spec:
              // Non-reflective tactical carbon plates with crisp edge highlights from Studio HDRI
              mesh.material = new THREE.MeshPhysicalMaterial({
                map: originalMat.map || null,
                normalMap: originalMat.normalMap || null,
                roughnessMap: originalMat.roughnessMap || null,
                color: isWheel ? 0x111318 : 0x181a20,
                metalness: isWheel ? 0.10 : 0.45,
                roughness: isWheel ? 0.85 : 0.48,
                clearcoat: isWheel ? 0.0 : 0.35,
                clearcoatRoughness: 0.25,
                envMapIntensity: 1.8,
                reflectivity: 0.70,
              });
            }
          }
        });

        const carPivot = new THREE.Group();
        carPivot.add(model);
        // Aligns the front of the Tumbler facing down the highway into the horizon
        carPivot.rotation.y = -Math.PI / 2;

        carGroup.add(carPivot);
      },
      undefined,
      (err) => {
        console.error("Error loading Batmobile GLB:", err);
      }
    );

    // --- 11. CONTROLS & SPRING PHYSICS STATE ---
    let pointerX = 0;
    let targetCarX = 0;
    let carX = 0;
    let carSteerVelocity = 0;
    let steerInput = 0;
    let baseSpeed = 190;
    let currentSpeed = baseSpeed;
    let isBoosting = false;
    let lapTime = 0;
    let trackDistance = 0;

    // Rockstar Spring-Damper Camera State
    let camPosX = 0;
    let camVelX = 0;
    let camPosZ = initialCamZ;
    let camVelZ = 0;
    let camRoll = 0;

    const handlePointerMove = (e: PointerEvent) => {
      pointerX = (e.clientX / window.innerWidth - 0.5) * 2.0;
      steerInput = THREE.MathUtils.clamp(pointerX, -1, 1);
    };

    const handlePointerDown = () => {
      isBoosting = true;
    };

    const handlePointerUp = () => {
      isBoosting = false;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        steerInput = Math.max(-1.0, steerInput - 0.35);
      } else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        steerInput = Math.min(1.0, steerInput + 0.35);
      } else if (e.key === "ArrowUp" || e.key === "w" || e.key === "W" || e.key === " " || e.key === "Shift") {
        isBoosting = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        steerInput = 0;
      } else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        steerInput = 0;
      } else if (e.key === "ArrowUp" || e.key === "w" || e.key === "W" || e.key === " " || e.key === "Shift") {
        isBoosting = false;
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
      const isMob = w < 768;
      camera.aspect = w / h;
      camera.fov = isMob ? 58 : 50;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      composer.setSize(w, h);
      bloomPass.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    // --- 13. CINEMATIC 60FPS TICK LOOP ---
    let animFrameId: number;
    const clock = new THREE.Clock();

    const tick = () => {
      const delta = Math.min(clock.getDelta(), 0.08);
      const time = clock.getElapsedTime();

      // 1. Acceleration & Pacing
      const targetSpeed = isBoosting ? 365 : 190;
      currentSpeed += (targetSpeed - currentSpeed) * (isBoosting ? 0.08 : 0.045);
      lapTime += delta;

      const forwardDelta = currentSpeed * 0.20 * delta;
      trackDistance += forwardDelta;

      // Road Shader Uniforms
      roadUniforms.uDistance.value = trackDistance;
      const targetLightsOut = isLightsOutRef.current ? 1.0 : 0.0;
      roadUniforms.uLightsOut.value +=
        (targetLightsOut - roadUniforms.uLightsOut.value) * 0.1;

      coneMat.opacity = 0.055 + roadUniforms.uLightsOut.value * (isBoosting ? 0.12 : 0.06);

      // Bat-Signal Aura Pulse
      batSignalSprite.material.opacity = 0.90 + Math.sin(time * 1.5) * 0.06;

      // Parallax City Skyline Drift
      if (skylineTex) {
        skylineTex.offset.x = (trackDistance * 0.00045) % 1;
      }

      // 2. Ground-Locked Driving Physics
      const trackHalfW = roadWidth / 2 - 0.8;
      targetCarX = THREE.MathUtils.clamp(
        steerInput * (trackHalfW - 0.5),
        -trackHalfW + 0.2,
        trackHalfW - 0.2
      );

      const prevX = carX;
      const steerLag = 0.09 + Math.abs(steerInput) * 0.04;
      carX += (targetCarX - carX) * steerLag;
      carSteerVelocity = (carX - prevX) / Math.max(0.001, delta);

      const roadY = 0.02;
      const highSpeedShake = Math.sin(time * 90) * 0.003 * (currentSpeed / 200);

      carGroup.position.x = carX;
      carGroup.position.y = roadY + Math.abs(highSpeedShake);
      carGroup.position.z = 0;

      groundShadow.position.x = carX;
      groundShadow.position.z = 0;

      const onKerb = Math.abs(carX) > trackHalfW - 1.0;
      if (onKerb && Math.random() < 0.08) {
        playKerbRumble(isMutedRef.current);
      }

      // Suspension Roll & Ackermann Yaw
      const suspensionRoll = -carSteerVelocity * 0.028;
      carGroup.rotation.z = THREE.MathUtils.lerp(carGroup.rotation.z, suspensionRoll, 0.14);

      const ackermann = -carSteerVelocity * 0.012;
      carGroup.rotation.y = THREE.MathUtils.lerp(carGroup.rotation.y, ackermann, 0.12);
      carGroup.rotation.x = THREE.MathUtils.lerp(carGroup.rotation.x, 0, 0.18);

      // 3. Headlight & Underbody Tracking (Tumbler Wide Stance)
      leftHeadlight.position.set(carX - 0.85, 0.42, -0.2);
      rightHeadlight.position.set(carX + 0.85, 0.42, -0.2);
      leftVolCone.position.set(carX - 0.85, 0.42, -0.2);
      rightVolCone.position.set(carX + 0.85, 0.42, -0.2);
      headlightTarget.position.set(carX + steerInput * 3.5, 0.1, -40);

      batUnderbody.position.set(carX, 0.08, 0.6);

      // 4. High-Speed Rain Streaks Animation
      const posAttr = rainGeo.attributes.position as THREE.BufferAttribute;
      const rainArr = posAttr.array as Float32Array;
      const rainFallSpeed = (38 + currentSpeed * 0.15) * delta;

      for (let i = 0; i < rainCount; i++) {
        const idx = i * 6;
        rainArr[idx + 1] -= rainFallSpeed;
        rainArr[idx + 4] -= rainFallSpeed;
        rainArr[idx + 2] += (currentSpeed * 0.18) * delta;
        rainArr[idx + 5] += (currentSpeed * 0.18) * delta;

        if (rainArr[idx + 1] < 0 || rainArr[idx + 2] > 2.0) {
          const rx = carX + (Math.random() - 0.5) * 16;
          const ry = Math.random() * 6 + 1.2;
          const rz = -Math.random() * 70 - 5;
          const len = Math.random() * 0.8 + 0.5;

          rainArr[idx] = rx;
          rainArr[idx + 1] = ry;
          rainArr[idx + 2] = rz;
          rainArr[idx + 3] = rx;
          rainArr[idx + 4] = ry - len;
          rainArr[idx + 5] = rz - len * 0.5;
        }
      }
      posAttr.needsUpdate = true;

      // 5. Tire Mist Particles (Continuous Ambient Spray + Hard Turn Blast)
      const isSmokeActive = onKerb || Math.abs(carSteerVelocity) > 2.2 || isBoosting || Math.random() < 0.18;

      for (let i = 0; i < smokeParticleCount; i++) {
        const p = smokePool[i];
        const sp = smokeSprites[i];

        if (p.life <= 0 && isSmokeActive && Math.random() < 0.45) {
          const isLeft = Math.random() > 0.5;
          const spawnX = isLeft ? carX - 0.88 : carX + 0.88;
          p.pos.set(spawnX + (Math.random() - 0.5) * 0.15, 0.14, 1.25);
          p.vel.set(
            (Math.random() - 0.5) * 0.6 - carSteerVelocity * 0.15,
            Math.random() * 0.35 + 0.12,
            currentSpeed * 0.04 + Math.random() * 2.0
          );
          p.scale = 0.35;
          p.maxScale = Math.random() * 1.4 + 1.1;
          p.life = Math.random() * 0.25 + 0.55;
          p.maxLife = p.life;
          p.opacity = 0.28;
        } else if (p.life > 0) {
          p.life -= delta;
          const progress = 1.0 - p.life / p.maxLife;
          p.pos.addScaledVector(p.vel, delta);
          p.scale = THREE.MathUtils.lerp(0.35, p.maxScale, progress);
          p.opacity = (1.0 - progress) * 0.28;

          sp.position.copy(p.pos);
          sp.scale.set(p.scale, p.scale, 1);
          sp.material.opacity = p.opacity;
        } else {
          sp.material.opacity = 0;
        }
      }

      // 6. 📷 ROCKSTAR SPRING-DAMPER CAMERA PHYSICS
      const isMobile = window.innerWidth < 768;
      const baseCamZ = isMobile ? 4.9 : 3.6;
      const baseCamY = isMobile ? 1.15 : 0.95;

      const targetCamX = carX * 0.35;
      const targetCamZ = baseCamZ + (isBoosting ? 0.42 : 0);

      // Spring-damper force integration on X
      const springK = 18.0;
      const damping = Math.exp(-6.5 * delta);
      const forceX = (targetCamX - camPosX) * springK;
      camVelX = (camVelX + forceX * delta) * damping;
      camPosX += camVelX * delta;

      // Spring-damper force integration on Z
      const forceZ = (targetCamZ - camPosZ) * springK;
      camVelZ = (camVelZ + forceZ * delta) * damping;
      camPosZ += camVelZ * delta;

      camera.position.x = camPosX;
      camera.position.y = baseCamY + (isBoosting ? -0.06 : 0);
      camera.position.z = camPosZ;

      // Dutch Tilt (Camera banks subtly on hard turns)
      const targetDutchTilt = -carSteerVelocity * 0.024;
      camRoll += (targetDutchTilt - camRoll) * 0.12;
      camera.rotation.z = camRoll;

      // Dynamic Speed Perspective FOV Warp
      const baseFOV = isMobile ? 58 : 50;
      const targetFOV = isBoosting ? baseFOV + 14 : baseFOV;
      camera.fov += (targetFOV - camera.fov) * 0.08;
      camera.updateProjectionMatrix();

      // Look-Ahead (Anticipates road curves ahead of car)
      camera.lookAt(carX * 0.35 + steerInput * 1.5, 0.40, -16);

      // 7. Telemetry & Audio Engine Update
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

      updateF1Engine(rpm, currentSpeed, isBoosting, isMutedRef.current, gear);

      if (onTelemetryUpdate) {
        onTelemetryUpdate({
          speed: Math.round(currentSpeed),
          gear,
          rpm,
          lapTime,
          isBoosting,
          isDrifting: Math.abs(carSteerVelocity) > 3.6,
          isFlying: false,
          isLightsOut: isLightsOutRef.current,
          onKerb,
          currentSector: sectorCycle,
          sectorsCrossed: Math.floor(lapTime / 30),
        });
      }

      // 8. Render Scene with Post-Processing Bloom
      composer.render();
      animFrameId = requestAnimationFrame(tick);
    };

    animFrameId = requestAnimationFrame(tick);

    // --- 14. CLEANUP ON UNMOUNT ---
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
      coneGeo.dispose();
      coneMat.dispose();
      skylineGeo.dispose();
      skylineMat.dispose();
      skylineTex.dispose();
      rainGeo.dispose();
      rainMat.dispose();
      smokeTex.dispose();
      smokeMat.dispose();
      shadowTex.dispose();
      shadowMat.dispose();
      batTex.dispose();
      batMat.dispose();
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
