const fs = require('fs');

let code = fs.readFileSync('src/components/F1GameCanvas.tsx', 'utf8');

// Replace tick loop start with 2048 mechanics
const tickUpdate = `      const delta = Math.min(clock.getDelta(), 0.08);
      const time = clock.getElapsedTime();

      // 0. ⚡ 2048 TUMBLER CASCADE GAME TICKS
      const isOverloaded = cargoStack.length >= 4;
      const isHyperCharged = hyperChargeTime > 0;
      if (hyperChargeTime > 0) {
        hyperChargeTime -= delta;
      }

      // Shockwave Ring Animation
      if (shockwaveLife > 0) {
        shockwaveLife -= delta * 3.2;
        shockwaveMesh.scale.addScalar(delta * 18.0);
        (shockwaveMesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, shockwaveLife);
      } else {
        (shockwaveMesh.material as THREE.MeshBasicMaterial).opacity = 0;
      }

      // Heavy Input Inertia (Sluggish resistance if reactor is overloaded)
      const steerInertia = isOverloaded ? 0.038 : 0.075;
      steerInput = THREE.MathUtils.lerp(steerInput, targetSteerInput, steerInertia);

      // 1. Acceleration & Pacing
      const boostActive = isBoosting || isHyperCharged;
      const targetSpeed = boostActive ? 365 : (isOverloaded ? 170 : 190);
      currentSpeed += (targetSpeed - currentSpeed) * (boostActive ? 0.08 : 0.045);
      lapTime += delta;

      const forwardDelta = currentSpeed * 0.20 * delta;
      trackDistance += forwardDelta;`;

code = code.replace(
  '      const delta = Math.min(clock.getDelta(), 0.08);\n      const time = clock.getElapsedTime();\n\n      // 0. Heavy Input Inertia (Progressive steering resistance)\n      steerInput = THREE.MathUtils.lerp(steerInput, targetSteerInput, 0.075);\n\n      // 1. Acceleration & Pacing\n      const targetSpeed = isBoosting ? 365 : 190;\n      currentSpeed += (targetSpeed - currentSpeed) * (isBoosting ? 0.08 : 0.045);\n      lapTime += delta;\n\n      const forwardDelta = currentSpeed * 0.20 * delta;\n      trackDistance += forwardDelta;',
  tickUpdate
);

// Add Power Block Motion & Collision Detection in tick
const blockTick = `      // 1B. ⚡ POWER BLOCKS TICK & LIFO CASCADE COLLISIONS
      for (let i = 0; i < powerBlockPool.length; i++) {
        const item = powerBlockPool[i];
        item.z += forwardDelta;
        item.group.position.z = item.z;
        item.group.position.x = lanePositions[item.laneIndex];
        item.group.position.y = 0.42 + Math.sin(time * 3.6 + i * 1.2) * 0.12;
        item.group.rotation.y += 0.022;

        // Collision Check with Batmobile Tumbler
        if (
          item.active &&
          Math.abs(item.z - 0) < 1.65 &&
          Math.abs(carX - lanePositions[item.laneIndex]) < 1.35
        ) {
          item.active = false;
          item.group.visible = false;
          cargoStack.push(item.value);

          // 🔄 LIFO Cascade Stack Resolver
          let cascades = 0;
          let lastMerged = 0;
          while (cargoStack.length >= 2) {
            const top = cargoStack[cargoStack.length - 1];
            const second = cargoStack[cargoStack.length - 2];
            if (top === second) {
              cargoStack.pop();
              const merged = top * 2;
              cargoStack[cargoStack.length - 1] = merged;
              cascades++;
              lastMerged = merged;
              audio.playMergeChime(merged, cascades);
            } else {
              break;
            }
          }

          if (cascades > 0) {
            consecutiveMerges += cascades;
            comboMultiplier = Math.min(8, 1 + Math.floor(consecutiveMerges / 2));
            lastMergeValue = lastMerged;
            shockwaveMesh.position.set(carX, 0.15, 0);
            shockwaveMesh.scale.set(1, 1, 1);
            const mCol = BLOCK_COLORS[lastMerged]?.color || 0x38bdf8;
            (shockwaveMesh.material as THREE.MeshBasicMaterial).color.setHex(mCol);
            (shockwaveMesh.material as THREE.MeshBasicMaterial).opacity = 0.95;
            shockwaveLife = 1.0;
          } else {
            audio.playClick();
            consecutiveMerges = Math.max(0, consecutiveMerges - 1);
            comboMultiplier = Math.max(1, comboMultiplier - 1);
          }

          gameScore += item.value * 10 * (1 + cascades * 2) * comboMultiplier;

          // 2048 Hyper-Core Supercharge Check
          if (cargoStack.includes(2048) || lastMerged >= 2048) {
            cargoStack = cargoStack.filter((v) => v < 2048);
            gameScore += 10000;
            hyperChargeTime = 10.0;
            audio.playSuperchargePurge();
          }

          // Reactor Overload Warning / Safety Purge
          if (cargoStack.length >= 6) {
            cargoStack.shift(); // Eject bottom block on critical overflow
            audio.playOverloadAlarm();
          } else if (cargoStack.length >= 4 && cascades === 0) {
            audio.playOverloadAlarm();
          }
        }

        // Reset Block Ahead when passed
        if (item.z > 8.0) {
          const minZ = Math.min(...powerBlockPool.map((b) => b.z));
          item.z = minZ - 26 - Math.random() * 8;
          item.laneIndex = Math.floor(Math.random() * 3);

          // Intelligent Spawn Weighting (35% chance to spawn needed stack top match)
          let spawnVal = 2;
          const topVal = cargoStack.length > 0 ? cargoStack[cargoStack.length - 1] : null;
          const rand = Math.random();

          if (topVal && rand < 0.35 && topVal <= 512) {
            spawnVal = topVal;
          } else if (rand < 0.60) {
            spawnVal = 2;
          } else if (rand < 0.85) {
            spawnVal = 4;
          } else if (rand < 0.95) {
            spawnVal = 8;
          } else {
            spawnVal = 16;
          }

          updateBlockVisuals(item, spawnVal);
          item.active = true;
          item.group.visible = true;
          item.group.position.x = lanePositions[item.laneIndex];
          item.group.position.z = item.z;
        }
      }`;

code = code.replace(
  '      // Bat-Signal Aura Pulse\n      batSignalSprite.material.opacity = 0.90 + Math.sin(time * 1.5) * 0.06;',
  `      // Bat-Signal Aura Pulse\n      batSignalSprite.material.opacity = 0.90 + Math.sin(time * 1.5) * 0.06;\n\n${blockTick}`
);

// Update steering speed for overload
code = code.replace(
  '      const steerSpeed = 5.4;',
  '      const steerSpeed = isOverloaded ? 3.2 : 5.4;'
);

// Update telemetry dispatch
const telemetryDispatch = `        onTelemetryUpdate({
          speed: Math.round(currentSpeed),
          gear,
          rpm,
          lapTime,
          isBoosting: boostActive,
          isDrifting: Math.abs(carSteerVelocity) > 3.6,
          isFlying: false,
          isLightsOut: isLightsOutRef.current,
          onKerb,
          currentSector: sectorCycle,
          sectorsCrossed: Math.floor(lapTime / 30),
          cargoStack: [...cargoStack],
          score: gameScore,
          multiplier: comboMultiplier,
          lastMergeVal: lastMergeValue,
          isOverloaded,
          isHyperCharged,
          targetMatch: cargoStack.length > 0 ? cargoStack[cargoStack.length - 1] : null,
        });`;

code = code.replace(
  /onTelemetryUpdate\(\{[\s\S]*?sectorsCrossed: Math\.floor\(lapTime \/ 30\),[\s\S]*?\}\);/,
  telemetryDispatch
);

fs.writeFileSync('src/components/F1GameCanvas.tsx', code, 'utf8');
console.log('Successfully updated F1GameCanvas.tsx with 2048 Tumbler Cascade mechanics!');
