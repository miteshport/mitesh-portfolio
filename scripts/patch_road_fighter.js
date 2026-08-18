const fs = require('fs');

let canvasCode = fs.readFileSync('src/components/F1GameCanvas.tsx', 'utf8');

// 1. Upgrade High-Visibility Canvas Textures (512x512 with dual glowing neon rims)
const upgradedTextures = `    // Static Pre-rendered Canvas Texture Pool (512x512 High-Visibility Billboards)
    const STATIC_NUMBER_TEXTURES = new Map<number, THREE.CanvasTexture>();
    [2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048].forEach((val) => {
      const info = BLOCK_COLORS[val] || BLOCK_COLORS[2];
      const canvas = document.createElement("canvas");
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "rgba(4, 7, 14, 0.96)";
        ctx.beginPath();
        ctx.roundRect(20, 20, 472, 472, 80);
        ctx.fill();

        // Thick glowing neon border
        ctx.strokeStyle = info.hex;
        ctx.lineWidth = 28;
        ctx.shadowColor = info.hex;
        ctx.shadowBlur = 36;
        ctx.stroke();

        // Inner secondary hairline ring
        ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
        ctx.lineWidth = 6;
        ctx.shadowBlur = 0;
        ctx.stroke();

        // High-contrast bold number
        ctx.fillStyle = "#ffffff";
        ctx.shadowColor = info.hex;
        ctx.shadowBlur = 24;
        ctx.font = \`900 \${val >= 1000 ? "160px" : val >= 100 ? "195px" : "240px"} system-ui, -apple-system, sans-serif\`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(String(val), 256, 256);
      }
      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      STATIC_NUMBER_TEXTURES.set(val, tex);
    });

    const getNumberTexture = (val: number, hexColor: string) => {
      return STATIC_NUMBER_TEXTURES.get(val) || STATIC_NUMBER_TEXTURES.get(2)!;
    };`;

canvasCode = canvasCode.replace(
  /\/\/ Static Pre-rendered Canvas Texture Pool[\s\S]*?return STATIC_NUMBER_TEXTURES\.get\(val\) \|\| STATIC_NUMBER_TEXTURES\.get\(2\)!;\s*};/,
  upgradedTextures
);

// 2. Upgrade PowerBlockItem with Billboard Badge, Sky Laser Pillar, and Target Reticle
const powerBlockUpgrade = `    interface PowerBlockItem {
      group: THREE.Group;
      boxMesh: THREE.Mesh;
      billboardSprite: THREE.Sprite;
      skyBeam: THREE.Mesh;
      targetReticle: THREE.Mesh;
      light: THREE.PointLight;
      value: number;
      laneIndex: number;
      z: number;
      active: boolean;
    }

    const lanePositions = [-2.4, 0.0, 2.4];
    const powerBlockPool: PowerBlockItem[] = [];
    const blockCount = 8;

    const blockBoxGeo = new THREE.BoxGeometry(1.2, 0.70, 1.2);
    const skyBeamGeo = new THREE.CylinderGeometry(0.04, 0.18, 16, 8);
    const reticleGeo = new THREE.RingGeometry(0.9, 1.15, 32);

    for (let i = 0; i < blockCount; i++) {
      const group = new THREE.Group();

      // 3D Core Block
      const boxMat = new THREE.MeshStandardMaterial({
        color: 0x0c1220,
        metalness: 0.85,
        roughness: 0.20,
        emissive: 0x38bdf8,
        emissiveIntensity: 0.55,
      });
      const boxMesh = new THREE.Mesh(blockBoxGeo, boxMat);
      boxMesh.position.y = 0.35;
      group.add(boxMesh);

      // 🎯 1. CAMERA-FACING HOLOGRAPHIC BILLBOARD BADGE (Always upright & 100% visible)
      const initInfo = BLOCK_COLORS[2];
      const decalTex = getNumberTexture(2, initInfo.hex);
      const spriteMat = new THREE.SpriteMaterial({
        map: decalTex,
        transparent: true,
        depthWrite: false,
      });
      const billboardSprite = new THREE.Sprite(spriteMat);
      billboardSprite.position.set(0, 1.45, 0);
      billboardSprite.scale.set(1.55, 1.55, 1.0);
      group.add(billboardSprite);

      // 🗼 2. VERTICAL SKY LASER BEAM (Visible from 200m away in the Gotham skyline)
      const beamMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.35,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      const skyBeam = new THREE.Mesh(skyBeamGeo, beamMat);
      skyBeam.position.set(0, 8.5, 0);
      group.add(skyBeam);

      // 🎯 3. SMART TARGET RETICLE (Pulsing ring when block matches player's needed number)
      const reticleMat = new THREE.MeshBasicMaterial({
        color: 0xffd700,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
      });
      const targetReticle = new THREE.Mesh(reticleGeo, reticleMat);
      targetReticle.rotation.x = -Math.PI / 2;
      targetReticle.position.set(0, 0.08, 0);
      group.add(targetReticle);

      // Point Light
      const pLight = new THREE.PointLight(0x38bdf8, 2.2, 7.0);
      pLight.position.set(0, 0.9, 0);
      group.add(pLight);

      const initZ = -45 - i * 28;
      const initLane = i % 3;
      group.position.set(lanePositions[initLane], 0, initZ);

      scene.add(group);

      powerBlockPool.push({
        group,
        boxMesh,
        billboardSprite,
        skyBeam,
        targetReticle,
        light: pLight,
        value: 2,
        laneIndex: initLane,
        z: initZ,
        active: true,
      });
    }

    const updateBlockVisuals = (item: PowerBlockItem, val: number, isTarget = false) => {
      item.value = val;
      const info = BLOCK_COLORS[val] || BLOCK_COLORS[2];
      const tex = getNumberTexture(val, info.hex);

      const bMat = item.boxMesh.material as THREE.MeshStandardMaterial;
      bMat.emissive.setHex(info.color);

      (item.billboardSprite.material as THREE.SpriteMaterial).map = tex;
      (item.skyBeam.material as THREE.MeshBasicMaterial).color.setHex(info.color);
      item.light.color.setHex(info.color);

      // Target Highlight
      const retMat = item.targetReticle.material as THREE.MeshBasicMaterial;
      if (isTarget) {
        retMat.opacity = 0.85;
        retMat.color.setHex(info.color);
        item.billboardSprite.scale.set(1.85, 1.85, 1.0);
        (item.skyBeam.material as THREE.MeshBasicMaterial).opacity = 0.65;
      } else {
        retMat.opacity = 0.0;
        item.billboardSprite.scale.set(1.45, 1.45, 1.0);
        (item.skyBeam.material as THREE.MeshBasicMaterial).opacity = 0.28;
      }
    };`;

canvasCode = canvasCode.replace(
  /interface PowerBlockItem {[\s\S]*?item\.light\.color\.setHex\(info\.color\);\s*};/,
  powerBlockUpgrade
);

// 3. Update Wave Choreography & Target Reticle Animation in tick loop
const blockTickUpgrade = `      // 1B. ⚡ ROAD FIGHTER CHOREOGRAPHED BLOCKS & TARGET RETICLES
      const targetMatchVal = cargoStack.length > 0 ? cargoStack[cargoStack.length - 1] : null;

      for (let i = 0; i < powerBlockPool.length; i++) {
        const item = powerBlockPool[i];
        item.z += forwardDelta;
        item.group.position.z = item.z;
        item.group.position.x = lanePositions[item.laneIndex];
        item.group.position.y = 0.45 + Math.sin(time * 3.6 + i * 1.2) * 0.08;
        item.boxMesh.rotation.y += 0.022;

        // Target Reticle Spin & Pulse
        const isTarget = targetMatchVal !== null && item.value === targetMatchVal;
        const retMat = item.targetReticle.material as THREE.MeshBasicMaterial;
        if (isTarget) {
          retMat.opacity = 0.65 + Math.sin(time * 8.0) * 0.25;
          item.targetReticle.rotation.z += 0.04;
        } else {
          retMat.opacity = 0;
        }

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

        // 🛣️ ROAD FIGHTER WAVE SPAWNING CHOREOGRAPHY
        if (item.z > 8.0) {
          const minZ = Math.min(...powerBlockPool.map((b) => b.z));
          item.z = minZ - 26 - Math.random() * 8;

          // Wave formation: Slalom rhythm (0 -> 1 -> 2 -> 1)
          item.laneIndex = (i + Math.floor(trackDistance / 80)) % 3;

          // Intelligent Road Fighter Target Match Spawning (45% chance to spawn needed target)
          let spawnVal = 2;
          const currentTop = cargoStack.length > 0 ? cargoStack[cargoStack.length - 1] : null;
          const rand = Math.random();

          if (currentTop && rand < 0.45 && currentTop <= 512) {
            spawnVal = currentTop;
          } else if (rand < 0.60) {
            spawnVal = 2;
          } else if (rand < 0.85) {
            spawnVal = 4;
          } else if (rand < 0.95) {
            spawnVal = 8;
          } else {
            spawnVal = 16;
          }

          const willBeTarget = currentTop !== null && spawnVal === currentTop;
          updateBlockVisuals(item, spawnVal, willBeTarget);
          item.active = true;
          item.group.visible = true;
          item.group.position.x = lanePositions[item.laneIndex];
          item.group.position.z = item.z;
        }
      }`;

canvasCode = canvasCode.replace(
  /\/\/ 1B\. ⚡ POWER BLOCKS TICK & LIFO CASCADE COLLISIONS[\s\S]*?item\.group\.position\.z = item\.z;\s*\}\s*\}/,
  blockTickUpgrade
);

fs.writeFileSync('src/components/F1GameCanvas.tsx', canvasCode, 'utf8');
console.log('F1GameCanvas.tsx updated with Road Fighter holographic billboard beacons and target reticles');
