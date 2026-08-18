const fs = require('fs');

// Read existing F1GameCanvas.tsx
let canvasCode = fs.readFileSync('src/components/F1GameCanvas.tsx', 'utf8');

// 1. Update TelemetryData Interface for Road Fighter
canvasCode = canvasCode.replace(
  /export interface TelemetryData \{[\s\S]*?\}/,
  `export interface TelemetryData {
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
  turboBoost: number;
  isMachTurbo: boolean;
  nearMissCount: number;
}`
);

// 2. Remove Snaking Road Curvature in Shader (Keep asphalt rock-solid under car)
canvasCode = canvasCode.replace(
  '        float curve = sin((zDist + uDistance) * 0.022) * uCurvature * (zDist * 0.010);\n        pos.x += curve;\n        vWorldX = pos.x;',
  '        vWorldX = pos.x;'
);

// 3. Replace Old 2048 Power Block Pool with Road Fighter Energy Cores & Rogue Hazards
const roadFighterEntities = `    // --- 9. ⚡ ROAD FIGHTER GOTHAM ENTITIES (ENERGY CORES & HAZARDS) ---
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

    const lanePositions = [-2.5, 0.0, 2.5];
    const entityPool: RoadFighterEntity[] = [];
    const poolSize = 10;

    const coreGeo = new THREE.OctahedronGeometry(0.65, 2);
    const hazardGeo = new THREE.BoxGeometry(1.4, 0.75, 1.4);
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
      const isHazard = i % 3 === 0; // 1 out of 3 is a hazard to dodge, 2 are energy cores!

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

      const initZ = -45 - i * 26;
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

    const resetEntity = (item: RoadFighterEntity, zPos: number, lane: number, isHazard: boolean) => {
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
    };`;

canvasCode = canvasCode.replace(
  /\/\/ Static Pre-rendered Canvas Texture Pool[\s\S]*?const updateBlockVisuals =[\s\S]*?};\s*};/g,
  roadFighterEntities
);

// 4. Update Game State Variables
const roadFighterState = `    // --- 11B. ⚡ ROAD FIGHTER GOTHAM ARCADE STATE ---
    let gameScore = 0;
    let comboMultiplier = 1;
    let turboCharge = 0; // 0 to 100%
    let machTurboTimer = 0; // Duration of Mach 1 Afterburner
    let nearMissCount = 0;
    let fishtailTimer = 0;`;

canvasCode = canvasCode.replace(
  /\/\/ --- 11B\. ⚡ 2048 TUMBLER CASCADE LIFO STACK STATE ---[\s\S]*?let consecutiveMerges = 0;/,
  roadFighterState
);

// 5. Update In-World Roof Hologram for Road Fighter Turbo
const roadFighterHolo = `    // Dynamic Roof Hologram Renderer (Road Fighter Turbo & Streak)
    const updateRoofHologram = (score: number, turbo: number, isMach: boolean, streak: number) => {
      if (!hCtx) return;
      hCtx.clearRect(0, 0, 512, 140);

      // Frosted Obsidian Pill
      hCtx.fillStyle = "rgba(4, 8, 16, 0.90)";
      hCtx.beginPath();
      hCtx.roundRect(8, 8, 496, 124, 32);
      hCtx.fill();

      hCtx.strokeStyle = isMach ? "#38bdf8" : "#0284c7";
      hCtx.lineWidth = 6;
      hCtx.stroke();

      hCtx.font = "900 28px system-ui, -apple-system, sans-serif";
      hCtx.textAlign = "center";
      hCtx.textBaseline = "middle";

      if (isMach) {
        hCtx.fillStyle = "#38bdf8";
        hCtx.fillText("⚡ MACH 1 AFTERBURNER ⚡", 256, 70);
      } else {
        // Turbo Progress Bar Inside Hologram
        const filledBars = Math.floor(turbo / 20); // 0 to 5
        let barStr = "";
        for (let b = 0; b < 5; b++) {
          barStr += b < filledBars ? "■ " : "□ ";
        }

        hCtx.fillStyle = "#ffffff";
        hCtx.font = "800 22px system-ui, sans-serif";
        hCtx.fillText(\`TURBO: \${barStr}\`, 230, 70);

        if (streak > 1) {
          hCtx.fillStyle = "#38bdf8";
          hCtx.font = "900 24px system-ui, sans-serif";
          hCtx.fillText(\`x\${streak}\`, 420, 70);
        }
      }

      holoTex.needsUpdate = true;
    };`;

canvasCode = canvasCode.replace(
  /\/\/ Dynamic Roof Hologram Renderer[\s\S]*?holoTex\.needsUpdate = true;\s*\};/,
  roadFighterHolo
);

// 6. Update Tick Loop with 1:1 Crisp Steering & Road Fighter Collision Mechanics
const roadFighterTick = `      // 0. ⚡ ROAD FIGHTER GOTHAM ARCADE TICKS
      const isMach = machTurboTimer > 0;
      if (machTurboTimer > 0) {
        machTurboTimer -= delta;
      }
      if (fishtailTimer > 0) {
        fishtailTimer -= delta;
      }

      // Shockwave Ring Animation
      if (shockwaveLife > 0) {
        shockwaveLife -= delta * 3.2;
        shockwaveMesh.scale.addScalar(delta * 18.0);
        (shockwaveMesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, shockwaveLife);
      } else {
        (shockwaveMesh.material as THREE.MeshBasicMaterial).opacity = 0;
      }

      // 1:1 Crisp Responsive Steering (Buttery-smooth, zero phantom drift)
      steerInput = THREE.MathUtils.lerp(steerInput, targetSteerInput, 0.16);

      // 1. Acceleration & Pacing
      const boostActive = isBoosting || isMach;
      const targetSpeed = isMach ? 385 : isBoosting ? 320 : 200;
      currentSpeed += (targetSpeed - currentSpeed) * (isMach ? 0.12 : 0.06);
      lapTime += delta;

      const forwardDelta = currentSpeed * 0.20 * delta;
      trackDistance += forwardDelta;

      // Road Dash Shader Scrolling
      roadUniforms.uDistance.value = trackDistance;

      // 1B. ⚡ ROAD FIGHTER ENTITY MOVEMENTS & COLLISIONS
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
            audio.playSuccess();
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
              // Mach Afterburner smashes through hazards!
              audio.playSuccess();
              gameScore += 500 * comboMultiplier;
              shockwaveMesh.position.set(carX, 0.15, 0);
              shockwaveMesh.scale.set(1, 1, 1);
              (shockwaveMesh.material as THREE.MeshBasicMaterial).color.setHex(0xffd700);
              (shockwaveMesh.material as THREE.MeshBasicMaterial).opacity = 1.0;
              shockwaveLife = 1.2;
            } else {
              // Road Fighter Fishtail Shake
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

        // Reset Entity Ahead
        if (item.z > 8.0) {
          const minZ = Math.min(...entityPool.map((e) => e.z));
          const newZ = minZ - 26 - Math.random() * 8;
          const newLane = (i + Math.floor(trackDistance / 60)) % 3;
          const newIsHazard = (i + Math.floor(trackDistance / 40)) % 3 === 0;

          resetEntity(item, newZ, newLane, newIsHazard);
        }
      }`;

canvasCode = canvasCode.replace(
  /\/\/ 0\. ⚡ 2048 TUMBLER CASCADE GAME TICKS[\s\S]*?\/\/ Reset Block Ahead when passed[\s\S]*?item\.group\.position\.z = item\.z;\s*\}\s*\}/,
  roadFighterTick
);

// 7. Update Steering Response & Physics (Zero Phantom Drift)
const crispCarPhysics = `      // 2. 🎮 ROAD FIGHTER 1:1 CRISP STEERING (Rock-Solid Centered Alignment)
      const maxSafeOffset = 2.85;
      const targetCarX = THREE.MathUtils.clamp(steerInput * maxSafeOffset, -maxSafeOffset, maxSafeOffset);
      
      // Fast, responsive, crisp steering glide (No sluggish lag)
      const prevX = carX;
      carX = THREE.MathUtils.lerp(carX, targetCarX, 0.18);
      carSteerVelocity = (carX - prevX) / Math.max(0.001, delta);

      // Fishtail wobble on crash
      const fishtailOffset = fishtailTimer > 0 ? Math.sin(time * 35) * 0.18 * fishtailTimer : 0;

      carGroup.position.x = carX + fishtailOffset;
      carGroup.position.y = 0.02;
      carGroup.position.z = 0;

      groundShadow.position.x = carX + fishtailOffset;
      groundShadow.position.z = 0;

      const onKerb = Math.abs(carX) > maxSafeOffset - 0.4;
      if (onKerb && Math.random() < 0.08) {
        playKerbRumble(isMutedRef.current);
      }

      // Subtle dynamic chassis lean on turns
      carGroup.rotation.z = -carSteerVelocity * 0.018;
      carGroup.rotation.y = -carSteerVelocity * 0.014;
      carGroup.rotation.x = isMach ? -0.035 : 0;`;

canvasCode = canvasCode.replace(
  /\/\/ 2\. 🎮 ROCKSTAR AAA VEHICLE WEIGHT & DRIVING DYNAMICS[\s\S]*?carGroup\.rotation\.y = THREE\.MathUtils\.lerp\(carGroup\.rotation\.y, ackermannYaw, 0\.14\);/,
  crispCarPhysics
);

// 8. Update In-World Roof Hologram & Chassis LEDs
const updateInWorldHud = `      // 2B. 🎯 REFRESH IN-WORLD ROOF HOLOGRAM & CHASSIS PODS
      updateRoofHologram(gameScore, turboCharge, isMach, comboMultiplier);

      // Update 4 Chassis LEDs (Show Turbo Energy Bar!)
      const numActivePods = Math.floor(turboCharge / 25);
      for (let p = 0; p < 4; p++) {
        if (p < numActivePods || isMach) {
          podMaterials[p].color.setHex(isMach ? 0xffd700 : 0x38bdf8);
        } else {
          podMaterials[p].color.setHex(0x0f172a); // Dim Inactive
        }
      }

      // Road Target Decal (Projected Ahead)
      roadTargetDecal.position.x = carX;
      roadTargetMat.color.setHex(isMach ? 0xffd700 : 0x38bdf8);
      roadTargetMat.opacity = isMach ? 0.80 : 0.35;`;

canvasCode = canvasCode.replace(
  /\/\/ 2B\. 🎯 REFRESH IN-WORLD ROOF HOLOGRAM & CHASSIS PODS[\s\S]*?roadTargetMat\.opacity = 0\.20;\s*\}/,
  updateInWorldHud
);

// 9. Update Telemetry Dispatch
const roadFighterTelemetry = `        onTelemetryUpdate({
          speed: Math.round(currentSpeed),
          gear,
          rpm,
          lapTime,
          isBoosting: boostActive,
          isDrifting: Math.abs(carSteerVelocity) > 3.2 || fishtailTimer > 0,
          isFlying: false,
          isLightsOut: isLightsOutRef.current,
          onKerb,
          currentSector: sectorCycle,
          sectorsCrossed: Math.floor(lapTime / 30),
          score: gameScore,
          multiplier: comboMultiplier,
          turboBoost: turboCharge,
          isMachTurbo: isMach,
          nearMissCount,
        });`;

canvasCode = canvasCode.replace(
  /onTelemetryUpdate\(\{[\s\S]*?targetMatch:[\s\S]*?\}\);/,
  roadFighterTelemetry
);

fs.writeFileSync('src/components/F1GameCanvas.tsx', canvasCode, 'utf8');
console.log('Successfully upgraded F1GameCanvas.tsx with Pure Road Fighter Mechanics & 1:1 Crisp Steering!');
