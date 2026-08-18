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

    // RESPONSIVE 3RD-PERSON CHASE CAMERA (ELEVATED 3/4 BATMOBILE PERSPECTIVE)
    const isInitMobile = typeof window !== "undefined" && window.innerWidth < 768;
    const initialFOV = isInitMobile ? 70 : 65;
    const initialCamZ = isInitMobile ? 7.0 : 6.2;
    const initialCamY = isInitMobile ? 3.2 : 2.8;

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

    // --- 2B. 🛞 PROCEDURAL ROLLING TIRE TREAD TEXTURE ---
    const tireCanvas = document.createElement("canvas");
    tireCanvas.width = 256;
    tireCanvas.height = 256;
    const tCtx = tireCanvas.getContext("2d");
    if (tCtx) {
      tCtx.fillStyle = "#14161c";
      tCtx.fillRect(0, 0, 256, 256);

      for (let y = 0; y < 256; y += 32) {
        tCtx.fillStyle = "#040508";
        tCtx.fillRect(0, y, 256, 8);

        tCtx.fillStyle = "#222630";
        tCtx.fillRect(12, y + 8, 96, 20);
        tCtx.fillRect(148, y + 8, 96, 20);

        tCtx.fillStyle = "#0a0c10";
        tCtx.fillRect(45, y + 14, 35, 4);
        tCtx.fillRect(180, y + 14, 35, 4);
      }
    }
    const tireTreadTex = new THREE.CanvasTexture(tireCanvas);
    tireTreadTex.wrapS = THREE.RepeatWrapping;
    tireTreadTex.wrapT = THREE.RepeatWrapping;
    tireTreadTex.repeat.set(2, 4);

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

    // --- 5. 🦇 1024x1024 ICONIC DC / NOLAN BAT-SIGNAL ---
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

      // 3. Iconic Bat Cutout (Exact Christopher Nolan The Dark Knight Geometric Vector)
      bCtx.save();
      bCtx.translate(512, 512);
      bCtx.scale(2.7, 2.7);
      bCtx.globalCompositeOperation = "destination-out";
      bCtx.fillStyle = "rgba(0, 0, 0, 1)";

      bCtx.beginPath();
      // Center Head Notch
      bCtx.moveTo(0, -38);
      // Right Ear
      bCtx.lineTo(9, -56);
      bCtx.lineTo(19, -38);
      // Right Top Wing Angular Ridge
      bCtx.lineTo(58, -38);
      bCtx.lineTo(135, -20);
      // Right Wing Tip
      bCtx.lineTo(138, 5);
      // Right Outer Wing Scallop (Angular Facet)
      bCtx.lineTo(105, 12);
      bCtx.lineTo(82, 34);
      // Right Inner Wing Scallop (Angular Facet)
      bCtx.lineTo(54, 20);
      bCtx.lineTo(24, 48);
      // Bottom Tail
      bCtx.lineTo(0, 58);
      // Left Inner Wing Scallop (Mirror)
      bCtx.lineTo(-24, 48);
      bCtx.lineTo(-54, 20);
      // Left Outer Wing Scallop
      bCtx.lineTo(-82, 34);
      bCtx.lineTo(-105, 12);
      // Left Wing Tip
      bCtx.lineTo(-138, 5);
      // Left Top Wing Angular Ridge
      bCtx.lineTo(-135, -20);
      bCtx.lineTo(-58, -38);
      // Left Ear
      bCtx.lineTo(-19, -38);
      bCtx.lineTo(-9, -56);
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

    // --- 6. 🌆 GOTHAM CITY SKYLINE (CLEAN ART DECO SILHOUETTES WITH BASE FOG MIST) ---
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

    // --- 7. (RAIN PERMANENTLY REMOVED: CRYSTAL-CLEAR DARK KNIGHT GOTHAM NIGHT) ---

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
      opacity: 0.92,
      depthWrite: false,
    });
    const groundShadow = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 5.2), shadowMat);
    groundShadow.rotation.x = -Math.PI / 2;
    groundShadow.position.y = 0.025;
    scene.add(groundShadow);

    // --- 10. 🦇 3D BATMOBILE TUMBLER (AUTHENTIC RIGGED STUDIO MODEL) ---
    const carGroup = new THREE.Group();
    scene.add(carGroup);

    // 🔥 JET AFTERBURNER FLAME (CYAN-HOT CORE + AMBER EXHAUST PLUME)
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

    const afterburnerLight = new THREE.PointLight(0xff6600, 0, 9);
    afterburnerLight.position.set(0, 0.46, 1.5);
    carGroup.add(afterburnerLight);

    let wheelFL: THREE.Object3D | null = null;
    let wheelFR: THREE.Object3D | null = null;
    let wheelRL: THREE.Object3D | null = null;
    let wheelRR: THREE.Object3D | null = null;
    const leftFlaps: THREE.Object3D[] = [];
    const rightFlaps: THREE.Object3D[] = [];
    const suspensionSprings: THREE.Object3D[] = [];
    const jetNozzlePetals: THREE.Object3D[] = [];

    const loader = new GLTFLoader();
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

              // Translucent tinted glass for cockpit
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

        console.log("🎯 CONFIRMED AXLES BOUND:", { wheelFL: wheelFL?.name, wheelFR: wheelFR?.name, wheelRL: wheelRL?.name, wheelRR: wheelRR?.name });

        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());

        // Center on X and Z, place bottom of tires flush with road surface (Y = 0)
        model.position.x = -center.x;
        model.position.y = -box.min.y;
        model.position.z = -center.z;

        // Cinematic Scaling: Tumbler width scaled to 2.60 units (+18% larger for authentic heavy presence)
        const targetScale = 2.60 / size.z;
        model.scale.set(targetScale, targetScale, targetScale);

        const carPivot = new THREE.Group();
        carPivot.add(model);
        // Aligns front (+X in model space) facing down the highway into the horizon (-Z)
        carPivot.rotation.y = Math.PI / 2;

        carGroup.add(carPivot);
      },
      undefined,
      (err) => {
        console.error("Error loading Batmobile GLB:", err);
      }
    );

    // --- 11. CONTROLS & SPRING PHYSICS STATE ---
    let pointerX = 0;
    let targetSteerInput = 0;
    let steerInput = 0;
    let targetCarX = 0;
    let carX = 0;
    let carSteerVelocity = 0;
    let isBoosting = false;
    let baseSpeed = 190;
    let currentSpeed = baseSpeed;
    let lapTime = 0;
    let trackDistance = 0;

    let camPosX = 0;
    let camPosZ = 6.2;
    let camVelX = 0;
    let camVelZ = 0;
    let camRoll = 0;

    let isBraking = false;

    const handlePointerMove = (e: PointerEvent) => {
      pointerX = (e.clientX / window.innerWidth - 0.5) * 2.0;
      targetSteerInput = THREE.MathUtils.clamp(pointerX, -1, 1);
    };

    const handlePointerDown = () => {
      isBoosting = true;
    };

    const handlePointerUp = () => {
      isBoosting = false;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        targetSteerInput = Math.max(-1.0, targetSteerInput - 0.4);
      } else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        targetSteerInput = Math.min(1.0, targetSteerInput + 0.4);
      } else if (e.key === "ArrowUp" || e.key === "w" || e.key === "W" || e.key === " " || e.key === "Shift") {
        isBoosting = true;
      } else if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") {
        isBraking = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        targetSteerInput = 0;
      } else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        targetSteerInput = 0;
      } else if (e.key === "ArrowUp" || e.key === "w" || e.key === "W" || e.key === " " || e.key === "Shift") {
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
      const isMob = w < 768;
      camera.aspect = w / h;
      camera.fov = isMob ? 70 : 65;
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

      // 0. Heavy Input Inertia (Progressive steering resistance)
      steerInput = THREE.MathUtils.lerp(steerInput, targetSteerInput, 0.075);

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

      // 2. 🎮 ROCKSTAR AAA VEHICLE WEIGHT & DRIVING DYNAMICS
      // Strict Lane Envelope: 2.75 units locks wide 2.2m Tumbler track completely within lane markings
      const maxSafeAsphaltOffset = 2.75;
      targetCarX = THREE.MathUtils.clamp(
        steerInput * maxSafeAsphaltOffset,
        -maxSafeAsphaltOffset,
        maxSafeAsphaltOffset
      );

      // Heavy vehicle inertia with progressive steering resistance
      const steerSpeed = 5.4;
      const prevX = carX;
      carX += (targetCarX - carX) * (steerSpeed * delta);
      carSteerVelocity = (carX - prevX) / Math.max(0.001, delta);

      // Suspension road vibration
      const roadY = 0.02;
      const suspensionChatter = Math.sin(time * 70) * 0.002 * (currentSpeed / 200);

      carGroup.position.x = carX;
      carGroup.position.y = roadY + suspensionChatter;
      carGroup.position.z = 0;

      groundShadow.position.x = carX;
      groundShadow.position.z = 0;

      const onKerb = Math.abs(carX) > maxSafeAsphaltOffset - 0.4;
      if (onKerb && Math.random() < 0.08) {
        playKerbRumble(isMutedRef.current);
      }

      // Dynamic Weight Transfer (Pitch & Squat):
      // Acceleration -> nose lifts slightly; Deceleration -> nose dips
      const accelPitch = isBoosting ? -0.045 : (currentSpeed < 185 ? 0.025 : -0.008);
      carGroup.rotation.x = THREE.MathUtils.lerp(carGroup.rotation.x, accelPitch, 0.09);

      // Centrifugal Suspension Body Roll (heavy Tumbler leans out into corner)
      const suspensionRoll = -carSteerVelocity * 0.038;
      carGroup.rotation.z = THREE.MathUtils.lerp(carGroup.rotation.z, suspensionRoll, 0.12);

      // Ackermann Steering Yaw (nose leads turn with calculated slip angle)
      const ackermannYaw = -carSteerVelocity * 0.024 + steerInput * 0.045;
      carGroup.rotation.y = THREE.MathUtils.lerp(carGroup.rotation.y, ackermannYaw, 0.14);

      // 3. Headlight & Underbody Tracking (Normalized Batmobile Width)
      leftHeadlight.position.set(carX - 0.65, 0.38, -0.2);
      rightHeadlight.position.set(carX + 0.65, 0.38, -0.2);
      leftVolCone.position.set(carX - 0.65, 0.38, -0.2);
      rightVolCone.position.set(carX + 0.65, 0.38, -0.2);
      headlightTarget.position.set(carX + steerInput * 3.5, 0.1, -40);

      batUnderbody.position.set(carX, 0.08, 0.6);

      // 4. 🌆 Parallax City Skyline Drift
      if (skylineTex) {
        skylineTex.offset.x = (trackDistance * 0.00045) % 1;
      }

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

      // 5B. 🔥 GLOWING JET AFTERBURNER FLAME ON BOOST
      if (isBoosting) {
        const flickerScaleY = 1.9 + Math.random() * 0.5;
        const flickerScaleX = 0.70 + Math.random() * 0.18;
        afterburnerFlame.scale.set(flickerScaleX, flickerScaleY, 1);
        afterburnerFlame.material.opacity = THREE.MathUtils.lerp(
          afterburnerFlame.material.opacity,
          0.96,
          0.4
        );
        afterburnerLight.intensity = THREE.MathUtils.lerp(
          afterburnerLight.intensity,
          4.2 + Math.random() * 1.5,
          0.45
        );
      } else {
        afterburnerFlame.scale.set(0.1, 0.1, 1);
        afterburnerFlame.material.opacity = THREE.MathUtils.lerp(
          afterburnerFlame.material.opacity,
          0.0,
          0.25
        );
        afterburnerLight.intensity = THREE.MathUtils.lerp(
          afterburnerLight.intensity,
          0.0,
          0.25
        );
      }

      // 5C. 🔄 1:1 PHYSICAL 4-WHEEL AXLE ROTATION & STEERING SYNC
      const tireRadius = 0.38;
      const angularDelta = forwardDelta / tireRadius;

      // Left vs Right directional axle spin (avoids reverse spinning)
      if (wheelFL) {
        wheelFL.rotation.y += angularDelta;
        wheelFL.rotation.z = THREE.MathUtils.lerp(wheelFL.rotation.z, -steerInput * 0.45, 0.25);
      }
      if (wheelFR) {
        wheelFR.rotation.y -= angularDelta;
        wheelFR.rotation.z = THREE.MathUtils.lerp(wheelFR.rotation.z, -steerInput * 0.45, 0.25);
      }
      if (wheelRL) {
        wheelRL.rotation.y += angularDelta;
      }
      if (wheelRR) {
        wheelRR.rotation.y -= angularDelta;
      }

      // 5D. 🦇 ACTIVE AERO AIR-BRAKE HYDRAULIC FLAPS (THE DARK KNIGHT DYNAMICS)
      const leftCornerForce = Math.max(0, -carSteerVelocity * 0.12);
      const rightCornerForce = Math.max(0, carSteerVelocity * 0.12);
      const baseAeroBrake = isBraking ? 0.50 : (currentSpeed < 140 ? 0.20 : 0.0);

      const targetLeftFlap = Math.min(0.55, baseAeroBrake + leftCornerForce * 0.35);
      const targetRightFlap = Math.min(0.55, baseAeroBrake + rightCornerForce * 0.35);

      leftFlaps.forEach((f) => {
        f.rotation.z = THREE.MathUtils.lerp(f.rotation.z, targetLeftFlap, 0.15);
      });
      rightFlaps.forEach((f) => {
        f.rotation.z = THREE.MathUtils.lerp(f.rotation.z, -targetRightFlap, 0.15);
      });

      // 5E. 🚀 ATTACK MODE & JET NOZZLE EXPANSION ON BOOST
      const targetPetalSpread = isBoosting ? 1.25 : 1.0;
      jetNozzlePetals.forEach((p) => {
        p.scale.setScalar(THREE.MathUtils.lerp(p.scale.x, targetPetalSpread, 0.14));
      });

      // 5F. 🏎️ SUSPENSION SPRING COMPRESSION (ROAD ROUGHNESS & KERB CHATTER)
      const kerbRoughness = (onKerb ? Math.sin(time * 75) * 0.016 : Math.sin(time * 28) * 0.003) * (currentSpeed / 200);
      suspensionSprings.forEach((s) => {
        s.position.y = THREE.MathUtils.lerp(s.position.y, kerbRoughness, 0.25);
      });

      // 6. 📷 ROCKSTAR SPRING-DAMPER CAMERA PHYSICS (ELEVATED 3/4 CHASE VIEW)
      const isMobile = window.innerWidth < 768;
      const baseCamZ = isMobile ? 7.0 : 6.2;
      const baseCamY = isMobile ? 3.2 : 2.8;

      const targetCamX = carX * 0.30;
      const targetCamZ = baseCamZ + (isBoosting ? 0.55 : 0);

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
      camera.position.y = baseCamY + (isBoosting ? -0.10 : 0);
      camera.position.z = camPosZ;

      // Dutch Tilt (Camera banks subtly on hard turns)
      const targetDutchTilt = -carSteerVelocity * 0.024;
      camRoll += (targetDutchTilt - camRoll) * 0.12;
      camera.rotation.z = camRoll;

      // Dynamic Speed Perspective FOV Warp
      const baseFOV = isMobile ? 70 : 65;
      const targetFOV = isBoosting ? baseFOV + 12 : baseFOV;
      camera.fov += (targetFOV - camera.fov) * 0.08;
      camera.updateProjectionMatrix();

      // Look-Ahead (Aimed downward past the hood along the road horizon)
      camera.lookAt(carX * 0.28 + steerInput * 1.2, 0.45, -12);

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
      tireTreadTex.dispose();
      roadGeometry.dispose();
      roadMaterial.dispose();
      coneGeo.dispose();
      skylineGeo.dispose();
      skylineMat.dispose();
      skylineTex.dispose();
      smokeTex.dispose();
      smokeMat.dispose();
      shadowTex.dispose();
      shadowMat.dispose();
      batTex.dispose();
      batMat.dispose();
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
