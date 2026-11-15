const fs = require('fs');

let canvas = fs.readFileSync('src/components/F1GameCanvas.tsx', 'utf8');

// Replace the skyline section with the EXACT Image 2 working code
const oldSkylineSection = canvas.substring(
  canvas.indexOf('    // --- 6. 🌆 CINEMATIC GOTHAM HORIZON SKYLINE'),
  canvas.indexOf('    // --- 7. 🛣️ UNIFIED 3-LANE ROCK-SOLID ASPHALT HIGHWAY')
);

const newSkylineSection = `    // --- 6. 🌆 GOTHAM CITY PARALLAX SKYLINE (EXACT NOLAN CINEMATIC HORIZON) ---
    const buildSkylineTexture = () => {
      const c = document.createElement("canvas");
      c.width = 1024;
      c.height = 512;
      const ctx = c.getContext("2d");
      if (!ctx) return new THREE.CanvasTexture(c);

      ctx.fillStyle = "rgba(0,0,0,0)";
      ctx.fillRect(0, 0, 1024, 512);

      // Dark Art Deco Monoliths
      const buildings = [
        { x: 0, w: 110, h: 360, spires: [30, 50] },
        { x: 120, w: 140, h: 440, spires: [40, 90] },
        { x: 270, w: 90, h: 280, spires: [20, 40] },
        { x: 370, w: 160, h: 480, spires: [50, 110] },
        { x: 540, w: 120, h: 340, spires: [30, 60] },
        { x: 670, w: 150, h: 420, spires: [45, 80] },
        { x: 830, w: 100, h: 310, spires: [25, 45] },
        { x: 940, w: 84, h: 390, spires: [20, 70] },
      ];

      buildings.forEach((b) => {
        // Main tower body (Deep Midnight Obsidian)
        ctx.fillStyle = "rgba(3, 5, 10, 0.98)";
        ctx.fillRect(b.x, 512 - b.h, b.w, b.h);

        // Stepped Art Deco Setbacks
        ctx.fillStyle = "rgba(5, 8, 16, 0.98)";
        ctx.fillRect(b.x + 14, 512 - b.h - b.spires[0], b.w - 28, b.spires[0]);

        // Needle Spire
        ctx.fillStyle = "rgba(7, 12, 22, 1.0)";
        ctx.fillRect(b.x + b.w / 2 - 3, 512 - b.h - b.spires[0] - b.spires[1], 6, b.spires[1]);

        // Red Aviation Warning Light on Spire Tip
        ctx.fillStyle = "rgba(239, 68, 68, 0.95)";
        ctx.beginPath();
        ctx.arc(b.x + b.w / 2, 512 - b.h - b.spires[0] - b.spires[1], 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Ambient Gotham Window Slits (Subtle warm amber & cyan pinpricks)
        for (let wy = 512 - b.h + 24; wy < 420; wy += 28) {
          for (let wx = b.x + 12; wx < b.x + b.w - 12; wx += 20) {
            if (Math.random() < 0.35) {
              const isAmber = Math.random() < 0.65;
              ctx.fillStyle = isAmber ? "rgba(240, 195, 95, 0.65)" : "rgba(80, 185, 235, 0.55)";
              ctx.fillRect(wx, wy, 3, 6);
            }
          }
        }
      });

      // Bottom Soft-Fade Mist Gradient (dissolves the bottom of buildings smoothly into the asphalt fog)
      ctx.save();
      ctx.globalCompositeOperation = "destination-out";
      const mistGrad = ctx.createLinearGradient(0, 360, 0, 512);
      mistGrad.addColorStop(0.0, "rgba(0, 0, 0, 0.0)");
      mistGrad.addColorStop(0.5, "rgba(0, 0, 0, 0.45)");
      mistGrad.addColorStop(1.0, "rgba(0, 0, 0, 1.0)");
      ctx.fillStyle = mistGrad;
      ctx.fillRect(0, 360, 1024, 152);
      ctx.restore();

      const tex = new THREE.CanvasTexture(c);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      tex.repeat.set(3, 1);
      return tex;
    };

    const skylineTex = buildSkylineTexture();
    const skylineMat = new THREE.MeshBasicMaterial({
      map: skylineTex,
      transparent: true,
      opacity: 0.90,
      side: THREE.DoubleSide,
      fog: false,
    });

    // Left and Right Skyline Flanks (deeper placement with seamless horizon blending)
    const skylineGeo = new THREE.PlaneGeometry(420, 56);
    const leftSkyline = new THREE.Mesh(skylineGeo, skylineMat);
    leftSkyline.position.set(-28, 16, -160);
    leftSkyline.rotation.y = Math.PI / 16;
    scene.add(leftSkyline);

    const rightSkyline = new THREE.Mesh(skylineGeo, skylineMat);
    rightSkyline.position.set(28, 16, -160);
    rightSkyline.rotation.y = -Math.PI / 16;
    scene.add(rightSkyline);
`;

if (oldSkylineSection) {
  canvas = canvas.replace(oldSkylineSection, newSkylineSection);
}

// Update parallax scroll in tick()
canvas = canvas.replace(
  /skylineTex\.offset\.x = \(trackDistance \* 0\.0002\) % 1;/,
  'skylineTex.offset.x = (trackDistance * 0.00015) % 1;'
);

// Update cleanup in useEffect return
canvas = canvas.replace(
  /skylineGeo\.dispose\(\);/g,
  'skylineGeo.dispose();\n      skylineMat.dispose();\n      skylineTex.dispose();'
);

fs.writeFileSync('src/components/F1GameCanvas.tsx', canvas, 'utf8');
console.log('✅ RESTORED EXACT ORIGINAL GOTHAM SKYLINE FROM COMMIT a21deed!');
