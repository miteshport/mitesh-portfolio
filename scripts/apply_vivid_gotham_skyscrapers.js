const fs = require('fs');

let canvas = fs.readFileSync('src/components/F1GameCanvas.tsx', 'utf8');

// Replace the Skyscraper Building Section with Vivid Glowing Gotham Monoliths
const oldSkyscrapers = canvas.substring(
  canvas.indexOf('    // --- 6. 🏙️ 24 FLANKING 3D GOTHAM MONOLITH SKYSCRAPERS'),
  canvas.indexOf('    // --- 7. 🛣️ UNIFIED 3-LANE ROCK-SOLID ASPHALT HIGHWAY')
);

const newSkyscrapers = `    // --- 6. 🏙️ 28 VIVID 3D GOTHAM MONOLITH SKYSCRAPERS (MAJESTIC ROAD FLANKING) ---
    const buildingGroup = new THREE.Group();
    scene.add(buildingGroup);
    const buildingList: THREE.Mesh[] = [];

    const bGeoList = [
      new THREE.BoxGeometry(6.5, 42, 10),
      new THREE.BoxGeometry(8.5, 62, 12),
      new THREE.BoxGeometry(5.5, 32, 9),
      new THREE.BoxGeometry(9.5, 78, 14),
      new THREE.BoxGeometry(7.0, 52, 11),
    ];

    // High-Contrast Vivid Glowing Window Texture Canvas
    const winCanvas = document.createElement("canvas");
    winCanvas.width = 512;
    winCanvas.height = 1024;
    const wCtx = winCanvas.getContext("2d");
    if (wCtx) {
      // Dark Gotham Obsidian Facade
      wCtx.fillStyle = "#030712";
      wCtx.fillRect(0, 0, 512, 1024);

      // Multi-Color Illuminated Office Windows Grid
      for (let wy = 16; wy < 1000; wy += 18) {
        for (let wx = 12; wx < 500; wx += 16) {
          const rand = Math.random();
          if (rand > 0.35) {
            if (rand > 0.85) {
              wCtx.fillStyle = "rgba(255, 235, 160, 0.95)"; // Warm Amber Penthouse
            } else if (rand > 0.55) {
              wCtx.fillStyle = "rgba(56, 189, 248, 0.95)"; // Wayne Cyan Tech Lab
            } else {
              wCtx.fillStyle = "rgba(240, 248, 255, 0.90)"; // Pure Cool White Office
            }
            wCtx.fillRect(wx, wy, 8, 11);
          }
        }
      }
    }
    const winTex = new THREE.CanvasTexture(winCanvas);
    winTex.wrapS = THREE.RepeatWrapping;
    winTex.wrapT = THREE.RepeatWrapping;
    winTex.repeat.set(1, 2.5);

    const bMat = new THREE.MeshStandardMaterial({
      color: 0x080f1e,
      map: winTex,
      emissive: 0xffffff,
      emissiveMap: winTex,
      emissiveIntensity: 1.25,
      roughness: 0.20,
      metalness: 0.85,
    });

    const beaconGeo = new THREE.SphereGeometry(0.45, 8, 8);
    const beaconMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });

    const numSkyscrapers = 28;
    for (let i = 0; i < numSkyscrapers; i++) {
      const geo = bGeoList[i % bGeoList.length];
      const mesh = new THREE.Mesh(geo, bMat);
      const isLeft = i % 2 === 0;

      // Positioned close to the highway curbs (±5.2m road width) so they tower majestically on mobile & desktop!
      const xPos = isLeft ? -9.5 - (i % 3) * 3.5 : 9.5 + (i % 3) * 3.5;
      const zPos = -10.0 - Math.floor(i / 2) * 22.0;
      const yPos = geo.parameters.height / 2 - 2.0;
      mesh.position.set(xPos, yPos, zPos);

      // Red Aviation Warning Beacon on Rooftop
      const beacon = new THREE.Mesh(beaconGeo, beaconMat);
      beacon.position.set(0, geo.parameters.height / 2 + 0.9, 0);
      mesh.add(beacon);

      buildingGroup.add(mesh);
      buildingList.push(mesh);
    }
`;

if (oldSkyscrapers) {
  canvas = canvas.replace(oldSkyscrapers, newSkyscrapers);
}

// Update the building recycle distance in tick()
canvas = canvas.replace(
  /b\.position\.z -= 26\.0 \* \(numSkyscrapers \/ 2\);/g,
  'b.position.z -= 22.0 * (numSkyscrapers / 2);'
);

fs.writeFileSync('src/components/F1GameCanvas.tsx', canvas, 'utf8');
console.log('✅ GOTHAM SKYSCRAPERS 100% UPGRADED WITH VIVID GLOWING NEON WINDOWS!');
