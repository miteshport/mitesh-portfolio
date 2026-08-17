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

    // --- 3. 🦇 MODERN DC BAT-SIGNAL IN THE GOTHAM CLOUDS ---
    const batCanvas = document.createElement("canvas");
    batCanvas.width = 512;
    batCanvas.height = 512;
    const bCtx = batCanvas.getContext("2d");
    if (bCtx) {
      // 1. Bright Teal/Cyan Spotlight Disk (matches BvS / DC style)
      const spotGrad = bCtx.createRadialGradient(256, 250, 6, 256, 250, 240);
      spotGrad.addColorStop(0.00, "rgba(245, 255, 255, 1.00)");  // pure white hot center
      spotGrad.addColorStop(0.18, "rgba(185, 245, 250, 0.98)");  // bright teal
      spotGrad.addColorStop(0.42, "rgba(80, 200, 225, 0.80)");   // mid cyan
      spotGrad.addColorStop(0.68, "rgba(30, 120, 180, 0.40)");   // deeper blue
      spotGrad.addColorStop(0.88, "rgba(10, 50, 100, 0.12)");    // dark edge
      spotGrad.addColorStop(1.00, "rgba(0, 0, 0, 0)");           // fade out
      bCtx.fillStyle = spotGrad;
      bCtx.beginPath();
      bCtx.arc(256, 256, 240, 0, Math.PI * 2);
      bCtx.fill();

      // 2. Thin circular border ring (like a real bat-signal lens)
      bCtx.strokeStyle = "rgba(40, 160, 200, 0.50)";
      bCtx.lineWidth = 4;
      bCtx.beginPath();
      bCtx.arc(256, 256, 234, 0, Math.PI * 2);
      bCtx.stroke();

      // 3. Modern DC / BvS Bat Silhouette — wide swept wings, angular scallops
      bCtx.save();
      bCtx.translate(256, 272); // slightly below center in spotlight
      bCtx.scale(1.35, 1.35);
      bCtx.fillStyle = "rgba(4, 7, 18, 0.97)";
      bCtx.beginPath();

      // Bottom center
      bCtx.moveTo(0, 36);

      // === RIGHT SIDE ===
      // Inner body curve up and right
      bCtx.bezierCurveTo(20, 36, 44, 26, 60, 10);
      // First bottom wing scallop notch
      bCtx.bezierCurveTo(70, 2, 80, -4, 94, -10);
      bCtx.bezierCurveTo(103, -15, 112, -10, 122, -4);
      // Second scallop notch
      bCtx.bezierCurveTo(132, 2, 138, -7, 148, -20);
      // Sweep out to wingtip
      bCtx.bezierCurveTo(156, -30, 162, -40, 170, -46);
      // Wingtip outer point
      bCtx.bezierCurveTo(172, -38, 168, -28, 164, -20);
      // Inner sweep of wingtip back toward body
      bCtx.bezierCurveTo(156, -10, 144, -2, 136, -14);
      // Wing top edge arcing inward to ear zone
      bCtx.bezierCurveTo(122, -26, 104, -38, 84, -47);
      bCtx.bezierCurveTo(66, -54, 46, -58, 32, -61);
      // Right ear hump
      bCtx.bezierCurveTo(26, -63, 21, -64, 18, -62);
      // Inner ear slope to center notch
      bCtx.bezierCurveTo(14, -59, 10, -54, 6, -50);
      // Center top peak
      bCtx.bezierCurveTo(3, -56, 0, -58, 0, -58);

      // === LEFT SIDE (mirror) ===
      bCtx.bezierCurveTo(0, -58, -3, -56, -6, -50);
      bCtx.bezierCurveTo(-10, -54, -14, -59, -18, -62);
      // Left ear hump
      bCtx.bezierCurveTo(-21, -64, -26, -63, -32, -61);
      bCtx.bezierCurveTo(-46, -58, -66, -54, -84, -47);
      bCtx.bezierCurveTo(-104, -38, -122, -26, -136, -14);
      // Left inner wingtip
      bCtx.bezierCurveTo(-144, -2, -156, -10, -164, -20);
      // Left wingtip outer
      bCtx.bezierCurveTo(-168, -28, -172, -38, -170, -46);
      bCtx.bezierCurveTo(-162, -40, -156, -30, -148, -20);
      // Left second scallop
      bCtx.bezierCurveTo(-138, -7, -132, 2, -122, -4);
      bCtx.bezierCurveTo(-112, -10, -103, -15, -94, -10);
      // Left first scallop
      bCtx.bezierCurveTo(-80, -4, -70, 2, -60, 10);
      // Left body back to bottom center
      bCtx.bezierCurveTo(-44, 26, -20, 36, 0, 36);

      bCtx.closePath();
      bCtx.fill();
      bCtx.restore();
    }

    const batTex = new THREE.CanvasTexture(batCanvas);
    const batMat = new THREE.SpriteMaterial({
      map: batTex,
      transparent: true,
      opacity: 0.94,
      blending: THREE.AdditiveBlending, // black bat = transparent = dark sky shows through = silhouette
      fog: false,
      depthWrite: false,
    });
    const batSignalSprite = new THREE.Sprite(batMat);
    batSignalSprite.position.set(0, 30, -128);
    batSignalSprite.scale.set(28, 28, 1);
    scene.add(batSignalSprite);

    // Forward Spotlights (Tactical LED Projectors)
    const leftHeadlight = new THREE.SpotLight(0x38bdf8, 55, 95, Math.PI / 5, 0.35, 1.2);
    leftHeadlight.position.set(-0.7, 0.45, 0);
    scene.add(leftHeadlight);

    const rightHeadlight = new THREE.SpotLight(0x38bdf8, 55, 95, Math.PI / 5, 0.35, 1.2);
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
      opacity: 0.055, // Always-on base — visible in normal driving (was 0.0 bug)
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    const leftVolCone = new THREE.Mesh(coneGeo, coneMat);
    scene.add(leftVolCone);
    const rightVolCone = new THREE.Mesh(coneGeo, coneMat);
    scene.add(rightVolCone);

    // 🦇 Batman aesthetic: no red. Replaced with a very faint deep-blue underbody glow.
    const batUnderbody = new THREE.PointLight(0x0a1a3a, 3.5, 6);
    scene.add(batUnderbody);

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

    // --- 5. VOLUMETRIC GAUSSIAN TIRE VAPOR & CONTACT SHADOW ---
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

    // --- 6. 3D CAR MODEL LOADING (ORIGINAL HIGH-GLOSS RACING FINISH) ---
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

        // Apply High-Gloss Obsidian Chrome Finish preserving original textures
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
      (err) => console.error("Error loading car GLB:", err)
    );

    // --- 7. INTERACTION CONTROLS ---
    let pointerX = 0;
    // pointerY intentionally not used for car position — car stays flat on road always
    let targetCarX = 0;
    let carX = 0;
    let carSteerVelocity = 0;
    let steerInput = 0; // -1 (full left) to +1 (full right)
    let baseSpeed = 190;
    let currentSpeed = baseSpeed;
    let isBoosting = false;
    let lapTime = 0;
    let trackDistance = 0;

    const handlePointerMove = (e: PointerEvent) => {
      // Only horizontal input for steering — vertical mouse is ignored
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

      coneMat.opacity = 0.055 + roadUniforms.uLightsOut.value * (isBoosting ? 0.11 : 0.06);

      // Gentle Atmospheric Pulse on the Bat-Signal
      batSignalSprite.material.opacity = 0.88 + Math.sin(time * 1.5) * 0.08;

      // 3. GROUND-LOCKED DRIVING PHYSICS (Real car — stays flat on road always)
      const trackHalfW = roadWidth / 2 - 0.8;

      // Horizontal steering only — no vertical axis
      targetCarX = THREE.MathUtils.clamp(
        steerInput * (trackHalfW - 0.5),
        -trackHalfW + 0.2,
        trackHalfW - 0.2
      );

      const prevX = carX;
      // Weighted steering inertia (real tyre slip feel)
      const steerLag = 0.09 + Math.abs(steerInput) * 0.04;
      carX += (targetCarX - carX) * steerLag;
      carSteerVelocity = (carX - prevX) / Math.max(0.001, delta);

      // Car ALWAYS locked flat on the road surface — Y is constant
      const roadY = 0.02;

      // High-speed micro road vibration (chassis chatter on asphalt)
      const highSpeedShake = Math.sin(time * 90) * 0.003 * (currentSpeed / 200);

      carGroup.position.x = carX;
      carGroup.position.y = roadY + Math.abs(highSpeedShake);
      carGroup.position.z = 0;

      // Ground Contact Shadow Follows Car (always visible — car never flies)
      groundShadow.position.x = carX;
      groundShadow.position.z = 0;
      groundShadow.material.opacity = 0.85;

      const isFlying = false; // Car never flies — ground locked
      const onKerb = Math.abs(carX) > trackHalfW - 1.0;
      if (onKerb && Math.random() < 0.08) {
        playKerbRumble(isMutedRef.current);
      }

      // Suspension Body Roll (weight transfer physics — car leans INTO the corner)
      // Positive steer right → weight shifts left → car leans left (negative Z)
      const suspensionRoll = -carSteerVelocity * 0.028;
      carGroup.rotation.z = THREE.MathUtils.lerp(carGroup.rotation.z, suspensionRoll, 0.14);

      // Subtle Ackermann Yaw — rear of car follows the steering arc naturally
      const ackermann = -carSteerVelocity * 0.012;
      carGroup.rotation.y = THREE.MathUtils.lerp(carGroup.rotation.y, ackermann, 0.12);

      // No pitch — car stays perfectly flat, nose does not lift or dip
      carGroup.rotation.x = THREE.MathUtils.lerp(carGroup.rotation.x, 0, 0.18);

      // Headlight Tracking (fixed Y since car is always on the road)
      leftHeadlight.position.set(carX - 0.7, 0.45, -0.2);
      rightHeadlight.position.set(carX + 0.7, 0.45, -0.2);
      leftVolCone.position.set(carX - 0.7, 0.45, -0.2);
      rightVolCone.position.set(carX + 0.7, 0.45, -0.2);
      // Headlights steer slightly with the car (like real projector headlights)
      headlightTarget.position.set(carX + steerInput * 3.5, 0.1, -40);

      // 🦇 Subtle deep-blue underbody glow follows car (no red)
      batUnderbody.position.set(carX, 0.08, 0.8);

      // 4. Volumetric Gaussian Tire Mist / Smoke Updates
      const isSmokeActive = onKerb || Math.abs(carSteerVelocity) > 2.8 || isBoosting;

      for (let i = 0; i < smokeParticleCount; i++) {
        const p = smokePool[i];
        const sp = smokeSprites[i];

        if (p.life <= 0 && isSmokeActive && Math.random() < 0.4) {
          const isLeft = Math.random() > 0.5;
          const spawnX = isLeft ? carX - 0.88 : carX + 0.88;
          p.pos.set(spawnX + (Math.random() - 0.5) * 0.15, 0.14, 1.25);
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

      // 5. Responsive Full-Chassis Chase Camera (Yuta Abe Gold Standard)
      const isMobile = window.innerWidth < 768;
      const baseCamZ = isMobile ? 4.9 : 3.6;
      const baseCamY = isMobile ? 1.15 : 0.95;

      const camTargetX = carX * 0.32;
      // Camera stays at fixed height — car never leaves the ground
      const camTargetY = baseCamY + (isBoosting ? -0.06 : 0);
      const camTargetZ = baseCamZ + (isBoosting ? 0.35 : 0);

      camera.position.x += (camTargetX - camera.position.x) * 0.11;
      camera.position.y += (camTargetY - camera.position.y) * 0.11;
      camera.position.z += (camTargetZ - camera.position.z) * 0.11;

      // Dynamic Speed Perspective Warp
      const baseFOV = isMobile ? 58 : 50;
      const targetFOV = isBoosting ? baseFOV + 12 : baseFOV;
      camera.fov += (targetFOV - camera.fov) * 0.08;
      camera.updateProjectionMatrix();

      // LookAt follows car laterally but fixed height
      camera.lookAt(carX * 0.15, 0.38, -14);

      // 6. Telemetry Callback
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

      // 7. Render Scene
      renderer.render(scene, camera);
      animFrameId = requestAnimationFrame(tick);
    };

    animFrameId = requestAnimationFrame(tick);

    // --- 8. CLEANUP ON UNMOUNT ---
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
