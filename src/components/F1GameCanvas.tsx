"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three-stdlib";
import { playSlipstreamWhoosh, playKerbRumble } from "@/utils/f1EngineAudio";

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
  overtakes: number;
}

interface F1GameCanvasProps {
  isLightsOut?: boolean;
  onTelemetryUpdate?: (data: TelemetryData) => void;
}

interface TrafficCar {
  mesh: THREE.Group;
  type: "gt" | "hauler";
  lane: number;
  x: number;
  y: number;
  z: number;
  speed: number;
  targetLane: number;
  laneChangeTimer: number;
  overtaken: boolean;
}

export default function F1GameCanvas({
  isLightsOut = false,
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

    // --- 1. THREE.JS SCENE SETUP ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000002);
    scene.fog = new THREE.FogExp2(0x000002, 0.015);

    // RESPONSIVE FULL-CHASSIS CHASE CAMERA (YUTA ABE GOLD STANDARD)
    const isInitMobile = typeof window !== "undefined" && window.innerWidth < 768;
    const initialFOV = isInitMobile ? 58 : 50;
    const initialCamZ = isInitMobile ? 4.9 : 3.6;
    const initialCamY = isInitMobile ? 1.15 : 0.95;

    const camera = new THREE.PerspectiveCamera(
      initialFOV,
      window.innerWidth / window.innerHeight,
      0.1,
      350
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
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
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
    const leftHeadlight = new THREE.SpotLight(0x38bdf8, 55, 80, Math.PI / 5, 0.35, 1.2);
    leftHeadlight.position.set(-0.7, 0.45, 0);
    scene.add(leftHeadlight);

    const rightHeadlight = new THREE.SpotLight(0x38bdf8, 55, 80, Math.PI / 5, 0.35, 1.2);
    rightHeadlight.position.set(0.7, 0.45, 0);
    scene.add(rightHeadlight);

    const headlightTarget = new THREE.Object3D();
    headlightTarget.position.set(0, 0.1, -40);
    scene.add(headlightTarget);
    leftHeadlight.target = headlightTarget;
    rightHeadlight.target = headlightTarget;

    // Volumetric 3D Headlight Cones (Hollywood Night Ray Effect)
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

    // --- 3. PROCEDURAL HIGH-DENSITY ASPHALT HIGHWAY SHADER ---
    const roadWidth = 10.6;
    const roadLength = 240.0;
    const roadSegments = 200;

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

      float rand(vec2 n) {
        return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
      }

      void main() {
        float movingV = vUv.y * 42.0 - uSpeed * 0.7;
        float grain = rand(vUv * 600.0) * 0.05;

        // Rich Dark Obsidian Asphalt
        vec3 asphaltColor = vec3(0.035, 0.035, 0.042) + grain;

        // 3-Lane Highway Dashed Centerlines (Sleek Warm Gold)
        float laneLeft = abs(vUv.x - 0.35);
        float laneRight = abs(vUv.x - 0.65);
        float dashPattern = step(0.40, fract(movingV * 0.35));

        if ((laneLeft < 0.008 || laneRight < 0.008) && dashPattern > 0.5) {
          asphaltColor = vec3(0.95, 0.82, 0.22);
        }

        // Solid Outer Guard Lines
        if (vUv.x < 0.035 || vUv.x > 0.965) {
          asphaltColor = vec3(0.95, 0.95, 0.98);
        }

        // Anamorphic Wet Road Reflections
        float spec = pow(max(0.0, 1.0 - abs(vUv.x - 0.5) * 1.8), 4.0) * 0.24;
        asphaltColor += vec3(spec * 0.2, spec * 0.45, spec * 0.85);

        // Night Mode Headlight Illumination Mask
        if (uLightsOut > 0.01) {
          float headlightMask = smoothstep(130.0, 10.0, vDepth) * smoothstep(5.0, 0.0, abs(vWorldX));
          asphaltColor *= mix(0.10, 1.4, headlightMask);
        }

        // Depth Fog Fade into Infinite Horizon
        float fogFactor = smoothstep(70.0, 220.0, vDepth);
        vec3 finalColor = mix(asphaltColor, vec3(0.0, 0.0, 0.002), fogFactor);

        gl_FragColor = vec4(finalColor, 1.0);
      }
    `;

    const roadUniforms = {
      uTime: { value: 0 },
      uSpeed: { value: 0 },
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

    // --- 4. 3D ELEVATED RED & WHITE RUMBLE KERBS ---
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

    // --- 5. MONOLITH OVERHEAD HIGHWAY GANTRIES (CINEMATIC WORLD-BUILDING) ---
    const gantryGroup = new THREE.Group();
    const gantryPillarGeo = new THREE.BoxGeometry(0.6, 6.5, 0.6);
    const gantryBeamGeo = new THREE.BoxGeometry(roadWidth + 2.0, 0.8, 0.8);
    const gantryMat = new THREE.MeshStandardMaterial({
      color: 0x18181f,
      metalness: 0.9,
      roughness: 0.2,
    });
    const cyanLightMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const amberLightMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });

    const gantryInstances: THREE.Group[] = [];
    const gantryCount = 5;
    const gantrySpacing = 50.0;

    for (let i = 0; i < gantryCount; i++) {
      const gantry = new THREE.Group();
      const pL = new THREE.Mesh(gantryPillarGeo, gantryMat);
      pL.position.set(-roadWidth / 2 - 0.6, 3.2, 0);
      const pR = new THREE.Mesh(gantryPillarGeo, gantryMat);
      pR.position.set(roadWidth / 2 + 0.6, 3.2, 0);
      const beam = new THREE.Mesh(gantryBeamGeo, gantryMat);
      beam.position.set(0, 5.8, 0);

      // Electronic Guide Sign Lights
      const signLightL = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.12, 0.1), cyanLightMat);
      signLightL.position.set(-2.5, 5.5, 0.45);
      const signLightR = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.12, 0.1), amberLightMat);
      signLightR.position.set(2.5, 5.5, 0.45);

      gantry.add(pL);
      gantry.add(pR);
      gantry.add(beam);
      gantry.add(signLightL);
      gantry.add(signLightR);

      gantry.position.set(0, 0, -i * gantrySpacing - 30.0);
      scene.add(gantry);
      gantryInstances.push(gantry);
    }

    // --- 6. SCULPTED OBSIDIAN GT RACERS & STREAMLINED HAULERS ---
    const trafficPool: TrafficCar[] = [];
    const lanes = [-2.8, 0.0, 2.8];

    // Sculpted Aerodynamic Materials
    const obsidianMat = new THREE.MeshStandardMaterial({
      color: 0x111116,
      metalness: 0.98,
      roughness: 0.08,
      envMapIntensity: 2.5,
    });
    const titaniumMat = new THREE.MeshStandardMaterial({
      color: 0x22242c,
      metalness: 0.92,
      roughness: 0.15,
    });
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x050508,
      metalness: 0.95,
      roughness: 0.05,
    });
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0c, roughness: 0.85 });

    // Laser Lightbars
    const redLightbarMat = new THREE.MeshBasicMaterial({ color: 0xff0033 });
    const exhaustGlowMat = new THREE.MeshBasicMaterial({ color: 0xff4400 });

    const wheelGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.35, 18);
    wheelGeo.rotateZ(Math.PI / 2);

    function createCinematicCarMesh(type: "gt" | "hauler"): THREE.Group {
      const group = new THREE.Group();

      if (type === "gt") {
        // Tapered GT Supercar Body
        const bodyGeo = new THREE.BoxGeometry(1.85, 0.55, 4.0);
        const cabinGeo = new THREE.BoxGeometry(1.4, 0.45, 2.2);
        const diffuserGeo = new THREE.BoxGeometry(1.7, 0.15, 0.4);

        const body = new THREE.Mesh(bodyGeo, obsidianMat);
        body.position.y = 0.45;
        const cabin = new THREE.Mesh(cabinGeo, glassMat);
        cabin.position.set(0, 0.8, -0.2);
        const diffuser = new THREE.Mesh(diffuserGeo, obsidianMat);
        diffuser.position.set(0, 0.22, 1.9);

        // Continuous Razor-Thin OLED Laser Taillight Bar
        const lightbar = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.06, 0.05), redLightbarMat);
        lightbar.position.set(0, 0.55, 2.02);

        // Dual Glowing Exhaust Tips
        const exL = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.1, 8), exhaustGlowMat);
        exL.rotateX(Math.PI / 2);
        exL.position.set(-0.45, 0.25, 2.02);
        const exR = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.1, 8), exhaustGlowMat);
        exR.rotateX(Math.PI / 2);
        exR.position.set(0.45, 0.25, 2.02);

        group.add(body);
        group.add(cabin);
        group.add(diffuser);
        group.add(lightbar);
        group.add(exL);
        group.add(exR);
      } else {
        // Streamlined Titanium Hauler
        const haulerBodyGeo = new THREE.BoxGeometry(2.1, 1.5, 6.2);
        const body = new THREE.Mesh(haulerBodyGeo, titaniumMat);
        body.position.y = 0.95;

        const lightbar = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.08, 0.05), redLightbarMat);
        lightbar.position.set(0, 0.7, 3.12);

        group.add(body);
        group.add(lightbar);
      }

      // Wheels
      const wFL = new THREE.Mesh(wheelGeo, wheelMat);
      wFL.position.set(-0.95, 0.38, -1.3);
      const wFR = new THREE.Mesh(wheelGeo, wheelMat);
      wFR.position.set(0.95, 0.38, -1.3);
      const wRL = new THREE.Mesh(wheelGeo, wheelMat);
      wRL.position.set(-0.95, 0.38, 1.3);
      const wRR = new THREE.Mesh(wheelGeo, wheelMat);
      wRR.position.set(0.95, 0.38, 1.3);

      group.add(wFL);
      group.add(wFR);
      group.add(wRL);
      group.add(wRR);

      return group;
    }

    // Spawn 8 Cinematic Supercars
    const carTypes: ("gt" | "hauler")[] = ["gt", "gt", "hauler", "gt", "gt", "hauler", "gt", "gt"];

    for (let i = 0; i < carTypes.length; i++) {
      const type = carTypes[i];
      const mesh = createCinematicCarMesh(type);
      const laneIdx = (i % 3) - 1;
      const initialZ = -40.0 - i * 28.0;

      scene.add(mesh);
      trafficPool.push({
        mesh,
        type,
        lane: laneIdx,
        targetLane: laneIdx,
        x: lanes[laneIdx + 1],
        y: 0,
        z: initialZ,
        speed: type === "hauler" ? 110 : 165 + Math.random() * 20,
        laneChangeTimer: Math.random() * 5 + 3,
        overtaken: false,
      });
    }

    // --- 7. VELOCITY LASER STREAKS & SPARKS ---
    const streakCount = 40;
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
    let overtakesCount = 0;
    let cameraShake = 0;

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

      // 2. Road Shader Uniforms
      roadUniforms.uTime.value = time;
      roadUniforms.uSpeed.value = currentSpeed * 0.085;

      const targetLightsOut = isLightsOutRef.current ? 1.0 : 0.0;
      roadUniforms.uLightsOut.value +=
        (targetLightsOut - roadUniforms.uLightsOut.value) * 0.1;

      coneMat.opacity = roadUniforms.uLightsOut.value * (isBoosting ? 0.16 : 0.10);

      // 3. Update Rumble Kerbs
      const kerbScrollOffset = (time * currentSpeed * 0.085 * 3.5) % kerbGap;
      const trackHalfW = roadWidth / 2 - 0.2;

      for (let i = 0; i < kerbBlockCount; i++) {
        const zDist = i * kerbGap - kerbScrollOffset;
        const curveOffset =
          Math.sin(zDist * 0.035 + time * 1.5) *
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

      // 4. Update Overhead Gantries
      for (let i = 0; i < gantryInstances.length; i++) {
        const g = gantryInstances[i];
        g.position.z += currentSpeed * 0.085 * delta * 7.5;

        // Follow Road Curvature
        const gCurvature =
          Math.sin(-g.position.z * 0.035 + time * 1.5) *
          roadUniforms.uCurvature.value *
          (-g.position.z * 0.015);
        g.position.x = gCurvature;

        // Loop Gantries Ahead
        if (g.position.z > 15.0) {
          g.position.z = -gantryCount * gantrySpacing + 15.0;
        }
      }

      // 5. Update Traffic Supercars & Slipstream Trigger
      for (let i = 0; i < trafficPool.length; i++) {
        const t = trafficPool[i];
        const relSpeedDiff = (currentSpeed - t.speed) * 0.085 * delta * 8.0;
        t.z += relSpeedDiff;

        // Lane Changing Logic
        t.laneChangeTimer -= delta;
        if (t.laneChangeTimer <= 0) {
          t.laneChangeTimer = Math.random() * 6.0 + 4.0;
          t.targetLane = Math.floor(Math.random() * 3) - 1;
        }
        const targetX = lanes[t.targetLane + 1];
        t.x += (targetX - t.x) * delta * 1.8;

        // Respawn Ahead when Passed
        if (t.z > 12.0) {
          t.z = -190.0 - Math.random() * 45.0;
          t.lane = Math.floor(Math.random() * 3) - 1;
          t.targetLane = t.lane;
          t.x = lanes[t.lane + 1];
          t.overtaken = false;
        }

        // Road Curvature Follow
        const trafficCurve =
          Math.sin(-t.z * 0.035 + time * 1.5) *
          roadUniforms.uCurvature.value *
          (-t.z * 0.015);
        t.mesh.position.set(t.x + trafficCurve, 0.02, t.z);

        // Slipstream Proximity Check (Close High-Speed Overtake)
        const distZ = Math.abs(t.z - 0.0);
        const distX = Math.abs(carX - (t.x + trafficCurve));

        if (distZ < 4.5 && distX < 2.0 && !t.overtaken && currentSpeed > 240) {
          t.overtaken = true;
          overtakesCount += 1;
          cameraShake = 0.04;
          playSlipstreamWhoosh();
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
        playKerbRumble();
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

      // 7. Responsive Full-Chassis Chase Camera
      const isMobile = window.innerWidth < 768;
      const baseCamZ = isMobile ? 4.9 : 3.6;
      const baseCamY = isMobile ? 1.15 : 0.95;

      cameraShake *= 0.9;
      const shakeOffset = (Math.random() - 0.5) * cameraShake;

      const camTargetX = carX * 0.32 + shakeOffset;
      const camTargetY = baseCamY + (carY * 0.45) + (isBoosting ? -0.08 : 0) + kerbVibration * 0.2 + shakeOffset;
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
          overtakes: overtakesCount,
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
