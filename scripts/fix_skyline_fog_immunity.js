const fs = require('fs');

let canvas = fs.readFileSync('src/components/F1GameCanvas.tsx', 'utf8');

const oldSkylineSection = canvas.substring(
  canvas.indexOf('    // --- 6. 🌆 CINEMATIC GOTHAM HORIZON SKYLINE'),
  canvas.indexOf('    // --- 7. 🛣️ UNIFIED 3-LANE ROCK-SOLID ASPHALT HIGHWAY')
);

const newSkylineSection = `    // --- 6. 🌆 CINEMATIC GOTHAM HORIZON SKYLINE (IMAGE 2 STYLE - FOG FREE) ---
    const skylineCanvas = document.createElement("canvas");
    skylineCanvas.width = 2048;
    skylineCanvas.height = 512;
    const sCtx = skylineCanvas.getContext("2d");
    if (sCtx) {
      // Midnight Horizon Gradient
      const skyGrad = sCtx.createLinearGradient(0, 0, 0, 512);
      skyGrad.addColorStop(0.0, "rgba(2, 4, 10, 0.0)");
      skyGrad.addColorStop(0.5, "rgba(4, 14, 32, 0.75)");
      skyGrad.addColorStop(1.0, "rgba(8, 22, 44, 0.98)");
      sCtx.fillStyle = skyGrad;
      sCtx.fillRect(0, 0, 2048, 512);

      let curX = 0;
      while (curX < 2048) {
        const bWidth = 28 + Math.random() * 52;
        const bHeight = 140 + Math.random() * 280;
        const bY = 512 - bHeight;

        // Dark Gotham Obsidian Monolith
        sCtx.fillStyle = "rgba(4, 10, 24, 0.98)";
        sCtx.fillRect(curX, bY, bWidth, bHeight);

        // Rooftop Antenna Spire + Red Aviation Beacon
        if (Math.random() > 0.35) {
          sCtx.strokeStyle = "#0d2244";
          sCtx.lineWidth = 2.0;
          sCtx.beginPath();
          sCtx.moveTo(curX + bWidth / 2, bY);
          sCtx.lineTo(curX + bWidth / 2, bY - 30);
          sCtx.stroke();

          sCtx.fillStyle = "rgba(239, 68, 68, 1.0)";
          sCtx.beginPath();
          sCtx.arc(curX + bWidth / 2, bY - 30, 3.0, 0, Math.PI * 2);
          sCtx.fill();
        }

        // Scattered Glowing Pin-Light Windows (Warm Amber Penthouse, Wayne Cyan, Cool White)
        for (let wy = bY + 14; wy < 500; wy += 14) {
          for (let wx = curX + 6; wx < curX + bWidth - 6; wx += 9) {
            const rand = Math.random();
            if (rand > 0.50) {
              if (rand > 0.85) {
                sCtx.fillStyle = "rgba(255, 230, 150, 0.95)"; // Warm Gold Penthouse
              } else if (rand > 0.65) {
                sCtx.fillStyle = "rgba(56, 189, 248, 0.95)"; // Wayne Cyan
              } else {
                sCtx.fillStyle = "rgba(235, 245, 255, 0.90)"; // Pure Cool White
              }
              sCtx.fillRect(wx, wy, 3.5, 5.5);
            }
          }
        }
        curX += bWidth + 3;
      }
    }

    const skylineTex = new THREE.CanvasTexture(skylineCanvas);
    skylineTex.wrapS = THREE.RepeatWrapping;
    skylineTex.wrapT = THREE.ClampToEdgeWrapping;
    const skylineGeo = new THREE.CylinderGeometry(200, 200, 110, 48, 1, true, -Math.PI / 2, Math.PI);
    const skylineMat = new THREE.MeshBasicMaterial({
      map: skylineTex,
      transparent: true,
      opacity: 0.96,
      side: THREE.BackSide,
      fog: false, // ⚡ IMMUNE TO FOG: Guarantees 100% crystal clear visibility!
      depthWrite: false,
    });
    const skylineMesh = new THREE.Mesh(skylineGeo, skylineMat);
    skylineMesh.position.set(0, 32, -90);
    scene.add(skylineMesh);
`;

if (oldSkylineSection) {
  canvas = canvas.replace(oldSkylineSection, newSkylineSection);
}

fs.writeFileSync('src/components/F1GameCanvas.tsx', canvas, 'utf8');
console.log('✅ GOTHAM HORIZON SKYLINE IS NOW 100% FOG-IMMUNE AND CRYSTAL CLEAR!');
