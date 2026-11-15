const fs = require('fs');

let canvas = fs.readFileSync('src/components/F1GameCanvas.tsx', 'utf8');

// --- 1. ADD 24 MONOLITHIC 3D GOTHAM SKYSCRAPERS FLANKING BOTH SIDES ---
const oldSkyscraperSection = `    // --- 6. 🌆 GOTHAM CITY PARALLAX SKYLINE ---
    const skylineCanvas = document.createElement("canvas");
    skylineCanvas.width = 2048;
    skylineCanvas.height = 512;
    const sCtx = skylineCanvas.getContext("2d");
    if (sCtx) {
      sCtx.fillStyle = "rgba(0, 0, 0, 0)";
      sCtx.fillRect(0, 0, 2048, 512);

      let curX = 0;
      while (curX < 2048) {
        const bWidth = 28 + Math.random() * 55;
        const bHeight = 120 + Math.random() * 320;
        const bY = 512 - bHeight;

        sCtx.fillStyle = "rgba(4, 10, 22, 0.98)";
        sCtx.fillRect(curX, bY, bWidth, bHeight);

        sCtx.fillStyle = "rgba(56, 189, 248, 0.45)";
        for (let wy = bY + 12; wy < 500; wy += 14) {
          for (let wx = curX + 6; wx < curX + bWidth - 6; wx += 10) {
            if (Math.random() > 0.42) {
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
    const skylineGeo = new THREE.CylinderGeometry(260, 260, 120, 48, 1, true, -Math.PI / 2, Math.PI);
    const skylineMat = new THREE.MeshBasicMaterial({
      map: skylineTex,
      transparent: true,
      opacity: 0.70,
      side: THREE.BackSide,
      depthWrite: false,
    });
    const skylineMesh = new THREE.Mesh(skylineGeo, skylineMat);
    skylineMesh.position.set(0, 40, -110);
    scene.add(skylineMesh);`;

const newSkyscraperSection = `    // --- 6. 🏙️ 24 FLANKING 3D GOTHAM MONOLITH SKYSCRAPERS & SKYLINE ---
    const skylineCanvas = document.createElement("canvas");
    skylineCanvas.width = 1024;
    skylineCanvas.height = 512;
    const sCtx = skylineCanvas.getContext("2d");
    if (sCtx) {
      const skyGrad = sCtx.createLinearGradient(0, 0, 0, 512);
      skyGrad.addColorStop(0.0, "#010206");
      skyGrad.addColorStop(0.5, "#040916");
      skyGrad.addColorStop(1.0, "#071224");
      sCtx.fillStyle = skyGrad;
      sCtx.fillRect(0, 0, 1024, 512);
    }
    const skylineTex = new THREE.CanvasTexture(skylineCanvas);
    const skylineGeo = new THREE.CylinderGeometry(260, 260, 120, 32, 1, true, -Math.PI / 2, Math.PI);
    const skylineMat = new THREE.MeshBasicMaterial({
      map: skylineTex,
      side: THREE.BackSide,
      depthWrite: false,
    });
    const skylineMesh = new THREE.Mesh(skylineGeo, skylineMat);
    skylineMesh.position.set(0, 40, -110);
    scene.add(skylineMesh);

    // 24 3D Monolithic Skyscrapers Lining Highway Left & Right
    const buildingGroup = new THREE.Group();
    scene.add(buildingGroup);
    const buildingList: THREE.Mesh[] = [];
    const bGeoList = [
      new THREE.BoxGeometry(8, 48, 14),
      new THREE.BoxGeometry(10, 68, 16),
      new THREE.BoxGeometry(7, 36, 12),
      new THREE.BoxGeometry(12, 85, 18),
    ];

    // High-Res Illuminated Windows Canvas
    const winCanvas = document.createElement("canvas");
    winCanvas.width = 256;
    winCanvas.height = 512;
    const wCtx = winCanvas.getContext("2d");
    if (wCtx) {
      wCtx.fillStyle = "#03060f";
      wCtx.fillRect(0, 0, 256, 512);
      for (let wy = 12; wy < 500; wy += 14) {
        for (let wx = 8; wx < 248; wx += 10) {
          if (Math.random() > 0.40) {
            wCtx.fillStyle = Math.random() > 0.28 ? "rgba(225, 240, 255, 0.88)" : "rgba(56, 189, 248, 0.75)";
            wCtx.fillRect(wx, wy, 4, 7);
          }
        }
      }
    }
    const winTex = new THREE.CanvasTexture(winCanvas);
    winTex.wrapS = THREE.RepeatWrapping;
    winTex.wrapT = THREE.RepeatWrapping;
    winTex.repeat.set(1, 3);

    const bMat = new THREE.MeshStandardMaterial({
      color: 0x050914,
      map: winTex,
      emissive: 0x0a1628,
      emissiveMap: winTex,
      emissiveIntensity: 0.75,
      roughness: 0.25,
      metalness: 0.85,
    });

    const numSkyscrapers = 24;
    for (let i = 0; i < numSkyscrapers; i++) {
      const geo = bGeoList[i % bGeoList.length];
      const mesh = new THREE.Mesh(geo, bMat);
      const isLeft = i % 2 === 0;
      const xPos = isLeft ? -19.0 - Math.random() * 8.0 : 19.0 + Math.random() * 8.0;
      const zPos = -15.0 - Math.floor(i / 2) * 26.0;
      const yPos = geo.parameters.height / 2;
      mesh.position.set(xPos, yPos, zPos);

      // Red Aviation Warning Beacon on Rooftop
      const beaconGeo = new THREE.SphereGeometry(0.35, 8, 8);
      const beaconMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
      const beacon = new THREE.Mesh(beaconGeo, beaconMat);
      beacon.position.set(0, geo.parameters.height / 2 + 0.8, 0);
      mesh.add(beacon);

      buildingGroup.add(mesh);
      buildingList.push(mesh);
    }`;

canvas = canvas.replace(oldSkyscraperSection, newSkyscraperSection);

// --- 2. ADD RED AFTERBURNER TURBINE & SKYSCRAPER MOTION TO GAME LOOP ---
const oldBuildingLoop = `      // Road texture scroll
      roadUniforms.uDistance.value = trackDistance;`;

const newBuildingLoop = `      // 🏙️ Move 3D Skyscraper Canyon with Road Speed
      for (let i = 0; i < buildingList.length; i++) {
        const b = buildingList[i];
        if (isDriving) {
          b.position.z += forwardDelta;
          if (b.position.z > 25.0) {
            b.position.z -= 26.0 * (numSkyscrapers / 2);
          }
        }
      }

      // 🔴 RED AFTERBURNER JET TURBINE OVERDRIVE MODE
      if (isBoosting && isDriving) {
        afterburnerFlame.material.opacity = 0.95 + Math.sin(time * 60) * 0.05;
        afterburnerFlame.scale.set(0.95, 2.6 + Math.sin(time * 80) * 0.6, 1);
        underglowLight.color.setHex(0xef4444); // Red Overdrive Underglow
        underglowLight.intensity = 8.5;
      } else {
        afterburnerFlame.material.opacity = Math.max(0, afterburnerFlame.material.opacity - delta * 5.0);
        underglowLight.color.setHex(0x38bdf8); // Stealth Cyan Underglow
        underglowLight.intensity = 4.5;
      }

      // Road texture scroll
      roadUniforms.uDistance.value = trackDistance;`;

canvas = canvas.replace(oldBuildingLoop, newBuildingLoop);

// Add cleanup for buildings
canvas = canvas.replace(
  /batMat\.dispose\(\);/g,
  'batMat.dispose();\n      winTex.dispose();\n      bMat.dispose();'
);

fs.writeFileSync('src/components/F1GameCanvas.tsx', canvas, 'utf8');
console.log('Complete Gotham Skyscraper Canyon and Red Afterburner Overdrive Mode Deployed!');
