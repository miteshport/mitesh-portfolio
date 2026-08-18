const fs = require('fs');

let canvasCode = fs.readFileSync('src/components/F1GameCanvas.tsx', 'utf8');

// 1. Crystal-Clear High-Contrast Number Textures (Deep obsidian core with thick crisp font & stroke)
const clearNumberTextures = `    // Static Pre-rendered Canvas Texture Pool (Crystal-Clear High-Contrast Badges)
    const STATIC_NUMBER_TEXTURES = new Map<number, THREE.CanvasTexture>();
    [2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048].forEach((val) => {
      const info = BLOCK_COLORS[val] || BLOCK_COLORS[2];
      const canvas = document.createElement("canvas");
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        // Deep obsidian solid plate
        ctx.fillStyle = "rgba(4, 7, 14, 0.98)";
        ctx.beginPath();
        ctx.roundRect(24, 24, 464, 464, 88);
        ctx.fill();

        // Thick glowing neon border
        ctx.strokeStyle = info.hex;
        ctx.lineWidth = 32;
        ctx.shadowColor = info.hex;
        ctx.shadowBlur = 30;
        ctx.stroke();

        // Secondary inner hairline ring
        ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
        ctx.lineWidth = 6;
        ctx.shadowBlur = 0;
        ctx.stroke();

        // Bold stroke around number to prevent bloom bleed
        ctx.font = \`900 \${val >= 1000 ? "160px" : val >= 100 ? "190px" : "240px"} system-ui, -apple-system, sans-serif\`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        ctx.lineWidth = 22;
        ctx.strokeStyle = "#04070e";
        ctx.strokeText(String(val), 256, 256);

        ctx.fillStyle = "#ffffff";
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
  clearNumberTextures
);

// 2. Add Diegetic 3D Roof Hologram, Chassis Reactor Nodes, and Road Laser Projection
const diegeticHudSetup = `    // --- 10B. 🎯 DIEGETIC IN-WORLD 3D ROOF HOLOGRAM & CHASSIS REACTOR NODES ---
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

    // 4 Chassis Reactor Pods on Batmobile Rear
    const podGeo = new THREE.SphereGeometry(0.08, 12, 12);
    const podMaterials: THREE.MeshBasicMaterial[] = [];
    const podMeshes: THREE.Mesh[] = [];
    const podXOffsets = [-0.45, -0.15, 0.15, 0.45];

    for (let p = 0; p < 4; p++) {
      const pMat = new THREE.MeshBasicMaterial({ color: 0x1e293b });
      const pMesh = new THREE.Mesh(podGeo, pMat);
      pMesh.position.set(podXOffsets[p], 0.48, 1.15);
      carGroup.add(pMesh);
      podMaterials.push(pMat);
      podMeshes.push(pMesh);
    }

    // Projected Target Emblem on Road Ahead (10m in front of Tumbler)
    const roadTargetGeo = new THREE.RingGeometry(0.7, 0.95, 32);
    const roadTargetMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide,
    });
    const roadTargetDecal = new THREE.Mesh(roadTargetGeo, roadTargetMat);
    roadTargetDecal.rotation.x = -Math.PI / 2;
    roadTargetDecal.position.set(0, 0.03, -12);
    scene.add(roadTargetDecal);

    // Dynamic Roof Hologram Renderer
    const updateRoofHologram = (stack: number[], multiplier: number, isOverload: boolean, isHyper: boolean) => {
      if (!hCtx) return;
      hCtx.clearRect(0, 0, 512, 140);

      // Frosted Glass Holographic Pill
      hCtx.fillStyle = "rgba(4, 8, 16, 0.88)";
      hCtx.beginPath();
      hCtx.roundRect(8, 8, 496, 124, 32);
      hCtx.fill();

      const topVal = stack.length > 0 ? stack[stack.length - 1] : null;
      const topHex = topVal ? (BLOCK_COLORS[topVal]?.hex || "#38bdf8") : "#38bdf8";

      hCtx.strokeStyle = isOverload ? "#ef4444" : isHyper ? "#38bdf8" : topHex;
      hCtx.lineWidth = 8;
      hCtx.shadowColor = hCtx.strokeStyle;
      hCtx.shadowBlur = 18;
      hCtx.stroke();

      hCtx.shadowBlur = 0;
      hCtx.font = "900 32px system-ui, -apple-system, sans-serif";
      hCtx.textAlign = "center";
      hCtx.textBaseline = "middle";

      if (isHyper) {
        hCtx.fillStyle = "#38bdf8";
        hCtx.fillText("⚡ HYPER AFTERBURNER ⚡", 256, 70);
      } else if (isOverload) {
        hCtx.fillStyle = "#ef4444";
        hCtx.fillText("⚠️ OVERLOAD // EJECTING ⚠️", 256, 70);
      } else if (!topVal) {
        hCtx.fillStyle = "#ffffff";
        hCtx.fillText("🎯 RAM [ 2 ] OR [ 4 ]", 256, 70);
      } else {
        // Active Core + Target to Hunt
        hCtx.fillStyle = "rgba(255, 255, 255, 0.65)";
        hCtx.font = "800 24px system-ui, sans-serif";
        hCtx.fillText("HUNT ➔", 210, 70);

        hCtx.fillStyle = topHex;
        hCtx.font = "900 48px system-ui, sans-serif";
        hCtx.fillText(\`[\${topVal}]\`, 330, 70);

        if (multiplier > 1) {
          hCtx.fillStyle = "#38bdf8";
          hCtx.font = "800 22px system-ui, sans-serif";
          hCtx.fillText(\`x\${multiplier}\`, 80, 70);
        }
      }

      holoTex.needsUpdate = true;
    };`;

canvasCode = canvasCode.replace(
  '    // --- 10. 🦇 3D BATMOBILE TUMBLER (AUTHENTIC RIGGED STUDIO MODEL) ---',
  `    // --- 10. 🦇 3D BATMOBILE TUMBLER (AUTHENTIC RIGGED STUDIO MODEL) ---\n${diegeticHudSetup}`
);

// 3. Update tick loop to refresh Roof Hologram and Chassis LEDs
const tickDiegeticUpdate = `      // 2B. 🎯 REFRESH IN-WORLD ROOF HOLOGRAM & CHASSIS PODS
      updateRoofHologram(cargoStack, comboMultiplier, isOverloaded, isHyperCharged);

      // Update 4 Chassis LEDs
      for (let p = 0; p < 4; p++) {
        if (p < cargoStack.length) {
          if (isOverloaded) {
            podMaterials[p].color.setHex(0xef4444); // Amber-Red Overload
          } else {
            const v = cargoStack[p];
            podMaterials[p].color.setHex(BLOCK_COLORS[v]?.color || 0x38bdf8);
          }
        } else {
          podMaterials[p].color.setHex(0x0f172a); // Dim Inactive
        }
      }

      // Projected Road Target Decal (Ahead of Tumbler)
      roadTargetDecal.position.x = carX;
      if (targetMatchVal) {
        roadTargetMat.color.setHex(BLOCK_COLORS[targetMatchVal]?.color || 0x38bdf8);
        roadTargetMat.opacity = 0.45 + Math.sin(time * 6.0) * 0.20;
      } else {
        roadTargetMat.opacity = 0.20;
      }`;

canvasCode = canvasCode.replace(
  '      // 3. Headlight & Underbody Tracking (Normalized Batmobile Width)',
  `${tickDiegeticUpdate}\n\n      // 3. Headlight & Underbody Tracking (Normalized Batmobile Width)`
);

fs.writeFileSync('src/components/F1GameCanvas.tsx', canvasCode, 'utf8');
console.log('F1GameCanvas.tsx updated with Diegetic Roof Hologram, Chassis LEDs, and Road Projection');
