const fs = require('fs');

let code = fs.readFileSync('src/components/F1GameCanvas.tsx', 'utf8');

// Replace everything from `// 0. ⚡ 2048 TUMBLER CASCADE GAME TICKS` up to `// 2. 🎮 ROAD FIGHTER 1:1 CRISP STEERING`
const duplicateStart = '// 0. ⚡ 2048 TUMBLER CASCADE GAME TICKS';
const duplicateEnd = '// 2. 🎮 ROAD FIGHTER 1:1 CRISP STEERING';

const startIndex = code.indexOf(duplicateStart);
const endIndex = code.indexOf(duplicateEnd);

if (startIndex !== -1 && endIndex !== -1) {
  const roadFighterCleanTick = `// 0. ⚡ ROAD FIGHTER GOTHAM ARCADE TICKS
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
      const targetLightsOut = isLightsOutRef.current ? 1.0 : 0.0;
      roadUniforms.uLightsOut.value +=
        (targetLightsOut - roadUniforms.uLightsOut.value) * 0.1;

      coneMat.opacity = 0.055 + roadUniforms.uLightsOut.value * (isBoosting ? 0.12 : 0.06);

      // Bat-Signal Aura Pulse
      batSignalSprite.material.opacity = 0.90 + Math.sin(time * 1.5) * 0.06;

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
              audio.playSuccess();
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

        // Reset Entity Ahead
        if (item.z > 8.0) {
          const minZ = Math.min(...entityPool.map((e) => e.z));
          const newZ = minZ - 26 - Math.random() * 8;
          const newLane = (i + Math.floor(trackDistance / 60)) % 3;
          const newIsHazard = (i + Math.floor(trackDistance / 40)) % 3 === 0;

          resetEntity(item, newZ, newLane, newIsHazard);
        }
      }

      `;

  code = code.substring(0, startIndex) + roadFighterCleanTick + code.substring(endIndex);
  fs.writeFileSync('src/components/F1GameCanvas.tsx', code, 'utf8');
  console.log('Cleaned duplicate tick block in F1GameCanvas.tsx');
} else {
  console.log('Markers not found, checking content');
}
