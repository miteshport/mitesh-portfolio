const fs = require('fs');

let canvasCode = fs.readFileSync('src/components/F1GameCanvas.tsx', 'utf8');

// 1. UPDATE ROAD FRAGMENT SHADER TO 3 DISTINCT PAINTED LANES WITH 2 DASHED DIVIDERS & KERBS
const threeLaneRoadShader = `    const roadFragmentShader = \`
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

        // Wet Specular Asphalt Highway Sheen
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
    \`;`;

canvasCode = canvasCode.replace(
  /const roadFragmentShader = `[\s\S]*?gl_FragColor = vec4\(finalColor, 1\.0\);\s*\}\s*`;/,
  threeLaneRoadShader
);

// 2. UNIFIED 3-LANE ENTITY POOL & CHOREOGRAPHED WAVE SPAWNER
const unifiedLaneSystem = `    // --- 9. ⚡ UNIFIED 3-LANE ROAD FIGHTER SYSTEM (3 LANES: LEFT, CENTER, RIGHT) ---
    const lanePositions = [-2.6, 0.0, 2.6];
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
    const poolSize = 12;

    const coreGeo = new THREE.OctahedronGeometry(0.68, 2);
    const hazardGeo = new THREE.BoxGeometry(1.45, 0.75, 1.45);
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
      const isHazard = i % 3 === 0;

      const mesh = new THREE.Mesh(isHazard ? hazardGeo : coreGeo, isHazard ? hazardMat.clone() : coreMat.clone());
      mesh.position.y = 0.45;
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

      const initZ = -45 - Math.floor(i / 3) * 28;
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
      const col = isHazard ? 0xef4444 : 0x38bdf8;
      (item.mesh.material as THREE.MeshStandardMaterial).emissive.setHex(col);
      (item.skyBeam.material as THREE.MeshBasicMaterial).color.setHex(col);
      item.light.color.setHex(col);

      item.group.position.set(lanePositions[lane], 0, zPos);
    };

    // 🌊 CHOREOGRAPHED WAVE SPAWNER (Structured arcade formations)
    let waveCounter = 0;
    const spawnWaveFormation = (baseZ: number, entityIndices: number[]) => {
      waveCounter++;
      const waveType = waveCounter % 5;

      if (waveType === 0) {
        // FORMATION 1: THE GATEWAY (Thread the needle: Left Hazard + Right Hazard + Center Core)
        setEntityVisuals(entityPool[entityIndices[0]], baseZ, 0, true);  // Left Hazard
        setEntityVisuals(entityPool[entityIndices[1]], baseZ, 1, false); // Center Core
        setEntityVisuals(entityPool[entityIndices[2]], baseZ, 2, true);  // Right Hazard
      } else if (waveType === 1) {
        // FORMATION 2: SLALOM LEFT (Center Hazard + Left Core)
        setEntityVisuals(entityPool[entityIndices[0]], baseZ, 1, true);  // Center Hazard
        setEntityVisuals(entityPool[entityIndices[1]], baseZ, 0, false); // Left Core
        setEntityVisuals(entityPool[entityIndices[2]], baseZ - 12, 2, false); // Staggered Right Core
      } else if (waveType === 2) {
        // FORMATION 3: SLALOM RIGHT (Center Hazard + Right Core)
        setEntityVisuals(entityPool[entityIndices[0]], baseZ, 1, true);  // Center Hazard
        setEntityVisuals(entityPool[entityIndices[1]], baseZ, 2, false); // Right Core
        setEntityVisuals(entityPool[entityIndices[2]], baseZ - 12, 0, false); // Staggered Left Core
      } else if (waveType === 3) {
        // FORMATION 4: BONUS RUNWAY (3 Cores in a row down a single lane)
        const luckyLane = Math.floor(Math.random() * 3);
        setEntityVisuals(entityPool[entityIndices[0]], baseZ, luckyLane, false);
        setEntityVisuals(entityPool[entityIndices[1]], baseZ - 10, luckyLane, false);
        setEntityVisuals(entityPool[entityIndices[2]], baseZ - 20, luckyLane, false);
      } else {
        // FORMATION 5: PINCER SPLIT (Hazard Left + Core Right)
        setEntityVisuals(entityPool[entityIndices[0]], baseZ, 0, true);  // Left Hazard
        setEntityVisuals(entityPool[entityIndices[1]], baseZ, 2, false); // Right Core
        setEntityVisuals(entityPool[entityIndices[2]], baseZ - 14, 1, false); // Trailing Center Core
      }
    };`;

canvasCode = canvasCode.replace(
  /\/\/ --- 9\. ⚡ ROAD FIGHTER GOTHAM ENTITIES[\s\S]*?const resetEntity =[\s\S]*?};\s*};/g,
  unifiedLaneSystem
);

// 3. FIXED KEYBOARD & TOUCH CONTROLS (TRUE LANE LOCK - ZERO RUBBERBAND DRIFT)
const unifiedLaneControls = `    // --- 11. 🎮 UNIFIED 3-LANE CONTROLS (TRUE LANE LOCK) ---
    const handlePointerMove = (e: PointerEvent) => {
      const normX = (e.clientX / window.innerWidth) * 2 - 1;
      // Map pointer to 3 discrete lanes with smooth transition
      if (normX < -0.33) {
        currentLane = 0; // Left
      } else if (normX > 0.33) {
        currentLane = 2; // Right
      } else {
        currentLane = 1; // Center
      }
      targetCarX = lanePositions[currentLane];
    };

    const handlePointerDown = (e: PointerEvent) => {
      isBoosting = true;
    };

    const handlePointerUp = () => {
      isBoosting = false;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
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
      // NOTE: Keyup NEVER resets currentLane or targetCarX! The car remains firmly locked in its lane!
      if (e.key === "ArrowUp" || e.key === "w" || e.key === "W" || e.key === " " || e.key === "Shift") {
        isBoosting = false;
      } else if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") {
        isBraking = false;
      }
    };`;

canvasCode = canvasCode.replace(
  /\/\/ --- 11\. 🎮 ROCKSTAR VEHICLE CONTROLS[\s\S]*?window\.addEventListener\("keyup", handleKeyUp\);/,
  `${unifiedLaneControls}\n\n    window.addEventListener("pointermove", handlePointerMove);\n    window.addEventListener("pointerdown", handlePointerDown);\n    window.addEventListener("pointerup", handlePointerUp);\n    window.addEventListener("keydown", handleKeyDown);\n    window.addEventListener("keyup", handleKeyUp);`
);

// 4. UPDATE TICK LOOP FOR WAVE BATCHES & CRISP 3-LANE GLIDE
const unifiedTickLoop = `      // 1B. ⚡ ROAD FIGHTER ENTITY MOVEMENTS & COLLISIONS
      const passedIndices: number[] = [];

      for (let i = 0; i < entityPool.length; i++) {
        const item = entityPool[i];
        item.z += forwardDelta;
        item.group.position.z = item.z;
        item.group.position.x = lanePositions[item.laneIndex];

        if (!item.isHazard) {
          item.mesh.rotation.y += 0.035;
          item.group.position.y = 0.45 + Math.sin(time * 4.0 + i) * 0.10;
        } else {
          item.group.position.y = 0.38;
        }

        // Collision Check with Batmobile Tumbler
        const distZ = Math.abs(item.z - 0);
        const distX = Math.abs(carX - lanePositions[item.laneIndex]);

        if (item.active && distZ < 1.65 && distX < 1.35) {
          item.active = false;
          item.group.visible = false;

          if (!item.isHazard) {
            // ⚡ COLLECTED ENERGY CORE!
            audio.playMergeChime(8, 1);
            gameScore += 250 * comboMultiplier;
            turboCharge = Math.min(100, turboCharge + 20);

            shockwaveMesh.position.set(carX, 0.15, 0);
            shockwaveMesh.scale.set(1, 1, 1);
            (shockwaveMesh.material as THREE.MeshBasicMaterial).color.setHex(0x38bdf8);
            (shockwaveMesh.material as THREE.MeshBasicMaterial).opacity = 0.95;
            shockwaveLife = 1.0;

            // Trigger Mach 1 Afterburner when turbo gauge reaches 100%
            if (turboCharge >= 100) {
              turboCharge = 0;
              machTurboTimer = 6.0; // 6 seconds of supersonic boost!
              audio.playSuperchargePurge();
            }
          } else {
            // ⚠️ HIT A HAZARD
            if (isMach) {
              audio.playMergeChime(16, 2);
              gameScore += 500 * comboMultiplier;
              shockwaveMesh.position.set(carX, 0.15, 0);
              shockwaveMesh.scale.set(1, 1, 1);
              (shockwaveMesh.material as THREE.MeshBasicMaterial).color.setHex(0xffd700);
              (shockwaveMesh.material as THREE.MeshBasicMaterial).opacity = 1.0;
              shockwaveLife = 1.2;
            } else {
              audio.playOverloadAlarm();
              fishtailTimer = 0.6;
              comboMultiplier = 1;
              turboCharge = Math.max(0, turboCharge - 20);
            }
          }
        }

        // 🌟 "NEAR-MISS" SLIPSTREAM BONUS (Road Fighter Signature Thrill!)
        if (item.active && item.isHazard && !item.nearMissed && distZ < 2.8 && distX >= 1.35 && distX < 2.2) {
          item.nearMissed = true;
          audio.playClick();
          gameScore += 150 * comboMultiplier;
          comboMultiplier = Math.min(8, comboMultiplier + 1);
          nearMissCount++;
        }

        // Collect entities that have passed behind the camera
        if (item.z > 8.0) {
          passedIndices.push(i);
        }
      }

      // 🌊 CHOREOGRAPHED WAVE SPAWN (When 3 entities have passed behind)
      if (passedIndices.length >= 3) {
        const minZ = Math.min(...entityPool.map((e) => e.z));
        const newWaveZ = minZ - 32;
        spawnWaveFormation(newWaveZ, passedIndices.slice(0, 3));
      }

      // 2. 🎮 ROAD FIGHTER 1:1 CRISP 3-LANE GLIDE (Zero Sluggish Lag, Rock-Solid Centered)
      const prevX = carX;
      carX = THREE.MathUtils.lerp(carX, targetCarX, 0.20);
      carSteerVelocity = (carX - prevX) / Math.max(0.001, delta);

      // Fishtail wobble on crash
      const fishtailOffset = fishtailTimer > 0 ? Math.sin(time * 35) * 0.18 * fishtailTimer : 0;

      carGroup.position.x = carX + fishtailOffset;
      carGroup.position.y = 0.02;
      carGroup.position.z = 0;

      groundShadow.position.x = carX + fishtailOffset;
      groundShadow.position.z = 0;

      const onKerb = Math.abs(carX) > 2.85;
      if (onKerb && Math.random() < 0.08) {
        playKerbRumble(isMutedRef.current);
      }

      // Subtle dynamic chassis lean on turns
      carGroup.rotation.z = -carSteerVelocity * 0.018;
      carGroup.rotation.y = -carSteerVelocity * 0.014;
      carGroup.rotation.x = isMach ? -0.035 : 0;`;

canvasCode = canvasCode.replace(
  /\/\/ 1B\. ⚡ ROAD FIGHTER ENTITY MOVEMENTS[\s\S]*?carGroup\.rotation\.x = isMach \? -0\.035 : 0;/,
  unifiedTickLoop
);

fs.writeFileSync('src/components/F1GameCanvas.tsx', canvasCode, 'utf8');
console.log('F1GameCanvas.tsx updated with 3-Lane Road Shader, True Lane Lock, and Choreographed Wave Formations!');
