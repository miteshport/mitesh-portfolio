const fs = require('fs');

let code = fs.readFileSync('src/components/F1GameCanvas.tsx', 'utf8');

// Insert Block Colors, Curved Shader Injector, and Power Block Pool before smoke setup
const powerBlockSetup = `    // --- 8B. ⚡ WAYNETECH 2048 TUMBLER CASCADE POWER BLOCKS ---
    const BLOCK_COLORS: Record<number, { color: number; hex: string }> = {
      2: { color: 0x38bdf8, hex: "#38bdf8" },   // Ice Blue
      4: { color: 0x3b82f6, hex: "#3b82f6" },   // Cobalt
      8: { color: 0x8b5cf6, hex: "#8b5cf6" },   // Amethyst
      16: { color: 0xec4899, hex: "#ec4899" },  // Fuchsia
      32: { color: 0xf59e0b, hex: "#f59e0b" },  // Amber Gold
      64: { color: 0x10b981, hex: "#10b981" },  // Emerald
      128: { color: 0xef4444, hex: "#ef4444" }, // Crimson
      256: { color: 0x06b6d4, hex: "#06b6d4" }, // Cyan Plasma
      512: { color: 0xa855f7, hex: "#a855f7" }, // Violet Ultra
      1024: { color: 0xffffff, hex: "#ffffff" },// Diamond White
      2048: { color: 0xffd700, hex: "#ffd700" },// Hyper-Core Gold
    };

    // Curved World Shader Injector for Three.js Materials
    const applyCurvedWorldShader = (material: THREE.Material) => {
      material.onBeforeCompile = (shader) => {
        shader.vertexShader = shader.vertexShader.replace(
          "#include <begin_vertex>",
          \`#include <begin_vertex>
           vec4 worldPos = modelMatrix * vec4(transformed, 1.0);
           float distZ = max(0.0, -worldPos.z - 8.0);
           transformed.y -= (distZ * distZ) * 0.0013;
          \`
        );
      };
    };

    // Canvas Texture Cache for Dynamic Number Decals
    const numberTextureCache = new Map<number, THREE.CanvasTexture>();
    const getNumberTexture = (val: number, hexColor: string) => {
      if (numberTextureCache.has(val)) return numberTextureCache.get(val)!;
      const canvas = document.createElement("canvas");
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        // Dark futuristic WayneTech plate
        ctx.fillStyle = "rgba(6, 9, 16, 0.95)";
        ctx.beginPath();
        ctx.roundRect(8, 8, 240, 240, 36);
        ctx.fill();

        // Neon glowing rim
        ctx.strokeStyle = hexColor;
        ctx.lineWidth = 14;
        ctx.shadowColor = hexColor;
        ctx.shadowBlur = 18;
        ctx.stroke();

        // Glowing center number
        ctx.fillStyle = "#ffffff";
        ctx.font = \`900 \${val >= 1000 ? "68px" : val >= 100 ? "82px" : "106px"} system-ui, sans-serif\`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(String(val), 128, 128);
      }
      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      numberTextureCache.set(val, tex);
      return tex;
    };

    interface PowerBlockItem {
      group: THREE.Group;
      boxMesh: THREE.Mesh;
      frontDecal: THREE.Mesh;
      backDecal: THREE.Mesh;
      topDecal: THREE.Mesh;
      light: THREE.PointLight;
      value: number;
      laneIndex: number;
      z: number;
      active: boolean;
    }

    const lanePositions = [-2.4, 0.0, 2.4];
    const powerBlockPool: PowerBlockItem[] = [];
    const blockCount = 8;

    const blockBoxGeo = new THREE.BoxGeometry(1.15, 0.65, 1.15);
    const decalGeo = new THREE.PlaneGeometry(0.85, 0.85);

    for (let i = 0; i < blockCount; i++) {
      const group = new THREE.Group();

      const boxMat = new THREE.MeshStandardMaterial({
        color: 0x0c1220,
        metalness: 0.85,
        roughness: 0.20,
        emissive: 0x38bdf8,
        emissiveIntensity: 0.45,
      });
      applyCurvedWorldShader(boxMat);

      const boxMesh = new THREE.Mesh(blockBoxGeo, boxMat);
      boxMesh.position.y = 0.35;
      group.add(boxMesh);

      // Decal Material
      const initInfo = BLOCK_COLORS[2];
      const decalTex = getNumberTexture(2, initInfo.hex);
      const decalMat = new THREE.MeshBasicMaterial({
        map: decalTex,
        transparent: true,
        side: THREE.DoubleSide,
      });
      applyCurvedWorldShader(decalMat);

      const frontDecal = new THREE.Mesh(decalGeo, decalMat);
      frontDecal.position.set(0, 0.35, 0.58);
      group.add(frontDecal);

      const backDecal = new THREE.Mesh(decalGeo, decalMat.clone());
      backDecal.position.set(0, 0.35, -0.58);
      backDecal.rotation.y = Math.PI;
      group.add(backDecal);

      const topDecal = new THREE.Mesh(decalGeo, decalMat.clone());
      topDecal.position.set(0, 0.68, 0);
      topDecal.rotation.x = -Math.PI / 2;
      group.add(topDecal);

      const pLight = new THREE.PointLight(0x38bdf8, 1.5, 6.0);
      pLight.position.set(0, 0.8, 0);
      group.add(pLight);

      const initZ = -45 - i * 28;
      const initLane = i % 3;
      group.position.set(lanePositions[initLane], 0, initZ);

      scene.add(group);

      powerBlockPool.push({
        group,
        boxMesh,
        frontDecal,
        backDecal,
        topDecal,
        light: pLight,
        value: 2,
        laneIndex: initLane,
        z: initZ,
        active: true,
      });
    }

    const updateBlockVisuals = (item: PowerBlockItem, val: number) => {
      item.value = val;
      const info = BLOCK_COLORS[val] || BLOCK_COLORS[2];
      const tex = getNumberTexture(val, info.hex);

      const bMat = item.boxMesh.material as THREE.MeshStandardMaterial;
      bMat.emissive.setHex(info.color);

      (item.frontDecal.material as THREE.MeshBasicMaterial).map = tex;
      (item.backDecal.material as THREE.MeshBasicMaterial).map = tex;
      (item.topDecal.material as THREE.MeshBasicMaterial).map = tex;
      item.light.color.setHex(info.color);
    };

    // Merge Shockwave Ring Particle Effect
    const shockwaveGeo = new THREE.RingGeometry(0.2, 0.45, 32);
    const shockwaveMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
    });
    const shockwaveMesh = new THREE.Mesh(shockwaveGeo, shockwaveMat);
    shockwaveMesh.rotation.x = -Math.PI / 2;
    shockwaveMesh.position.y = 0.15;
    scene.add(shockwaveMesh);
    let shockwaveLife = 0;
`;

code = code.replace(
  '    // --- 9. TIRE VAPOR & GROUND CONTACT AO SHADOW ---',
  `${powerBlockSetup}\n    // --- 9. TIRE VAPOR & GROUND CONTACT AO SHADOW ---`
);

// State variables for 2048 Game Engine
const gameVariables = `    // --- 11B. ⚡ 2048 TUMBLER CASCADE LIFO STACK STATE ---
    let cargoStack: number[] = [];
    let gameScore = 0;
    let comboMultiplier = 1;
    let lastMergeValue = 0;
    let hyperChargeTime = 0;
    let consecutiveMerges = 0;`;

code = code.replace(
  '    // --- 11. CONTROLS & SPRING PHYSICS STATE ---',
  `${gameVariables}\n    // --- 11. CONTROLS & SPRING PHYSICS STATE ---`
);

fs.writeFileSync('src/components/F1GameCanvas.tsx', code, 'utf8');
console.log('Power block pool and game variables added to F1GameCanvas.tsx');
