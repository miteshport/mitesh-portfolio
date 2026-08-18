const fs = require('fs');

let content = fs.readFileSync('src/components/F1GameCanvas.tsx', 'utf8');

// 1. Replace Cylinder Cones with Twin Xenon Flares & Flat Road Beam Decal
const oldConeSection = `    const coneGeo = new THREE.CylinderGeometry(0.06, 2.8, 28, 36, 1, true);
    coneGeo.rotateX(-Math.PI / 2);
    coneGeo.translate(0, 0, -14);
    const coneMat = new THREE.MeshBasicMaterial({
      color: 0xbae6fd,
      transparent: true,
      opacity: 0.055,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const leftVolCone = new THREE.Mesh(coneGeo, coneMat);
    const rightVolCone = new THREE.Mesh(coneGeo, coneMat);
    leftVolCone.position.set(-0.65, 0.38, -0.2);
    rightVolCone.position.set(0.65, 0.38, -0.2);
    scene.add(leftVolCone);
    scene.add(rightVolCone);`;

const newArkhamSection = `    // 💡 1. TWIN XENON HEADLAMP FLARES (Mounted directly on Tumbler front armor)
    const flareCanvas = document.createElement("canvas");
    flareCanvas.width = 128;
    flareCanvas.height = 128;
    const flCtx = flareCanvas.getContext("2d");
    if (flCtx) {
      const flGrad = flCtx.createRadialGradient(64, 64, 4, 64, 64, 60);
      flGrad.addColorStop(0.0, "rgba(255, 255, 255, 1.0)");
      flGrad.addColorStop(0.2, "rgba(186, 230, 253, 0.90)");
      flGrad.addColorStop(0.5, "rgba(56, 189, 248, 0.40)");
      flGrad.addColorStop(1.0, "rgba(0, 0, 0, 0.0)");
      flCtx.fillStyle = flGrad;
      flCtx.fillRect(0, 0, 128, 128);
    }
    const flareTex = new THREE.CanvasTexture(flareCanvas);
    const flareMat = new THREE.SpriteMaterial({
      map: flareTex,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const leftHeadlampFlare = new THREE.Sprite(flareMat);
    leftHeadlampFlare.scale.set(0.85, 0.85, 1.0);
    leftHeadlampFlare.position.set(-0.62, 0.38, -0.35);
    const rightHeadlampFlare = new THREE.Sprite(flareMat);
    rightHeadlampFlare.scale.set(0.85, 0.85, 1.0);
    rightHeadlampFlare.position.set(0.62, 0.38, -0.35);
    carGroup.add(leftHeadlampFlare);
    carGroup.add(rightHeadlampFlare);

    // 🛣️ 2. SOFT ASPHALT PROJECTED FORWARD ROAD BEAM (Flat on ground, zero sky clutter)
    const beamCanvas = document.createElement("canvas");
    beamCanvas.width = 512;
    beamCanvas.height = 512;
    const bmCtx = beamCanvas.getContext("2d");
    if (bmCtx) {
      const bmGrad = bmCtx.createRadialGradient(256, 80, 10, 256, 220, 250);
      bmGrad.addColorStop(0.0, "rgba(220, 245, 255, 0.75)");
      bmGrad.addColorStop(0.35, "rgba(186, 230, 253, 0.45)");
      bmGrad.addColorStop(0.70, "rgba(56, 189, 248, 0.15)");
      bmGrad.addColorStop(1.0, "rgba(0, 0, 0, 0.0)");
      bmCtx.fillStyle = bmGrad;
      bmCtx.fillRect(0, 0, 512, 512);
    }
    const beamTex = new THREE.CanvasTexture(beamCanvas);
    const beamMat = new THREE.MeshBasicMaterial({
      map: beamTex,
      transparent: true,
      opacity: 0.80,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const roadBeamDecal = new THREE.Mesh(new THREE.PlaneGeometry(8.5, 34.0), beamMat);
    roadBeamDecal.rotation.x = -Math.PI / 2;
    roadBeamDecal.position.set(0, 0.03, -16.0);
    scene.add(roadBeamDecal);`;

content = content.replace(oldConeSection, newArkhamSection);

// Update tick loop tracking
content = content.replace(
  /coneMat\.opacity = 0\.055 \+ roadUniforms\.uLightsOut\.value \* 0\.08;/g,
  'beamMat.opacity = 0.80 + roadUniforms.uLightsOut.value * 0.15;'
);

const oldHeadlightTracking = `      // Headlight Tracking
      leftHeadlight.position.set(carX - 0.65, 0.38, -0.2);
      rightHeadlight.position.set(carX + 0.65, 0.38, -0.2);
      leftVolCone.position.set(carX - 0.65, 0.38, -0.2);
      rightVolCone.position.set(carX + 0.65, 0.38, -0.2);
      headlightTarget.position.set(carX, 0.1, -40);`;

const newHeadlightTracking = `      // Headlight & Ground Beam Tracking
      leftHeadlight.position.set(carX - 0.62, 0.38, -0.2);
      rightHeadlight.position.set(carX + 0.62, 0.38, -0.2);
      headlightTarget.position.set(carX, 0.05, -35.0);
      roadBeamDecal.position.x = carX;`;

content = content.replace(oldHeadlightTracking, newHeadlightTracking);

// Update cleanup
content = content.replace(/coneGeo\.dispose\(\);\s*roadMaterial\.dispose\(\);/g, 'roadMaterial.dispose();');
content = content.replace(/shadowMat\.dispose\(\);/g, 'shadowMat.dispose();\n      flareTex.dispose();\n      flareMat.dispose();\n      beamTex.dispose();\n      beamMat.dispose();');

fs.writeFileSync('src/components/F1GameCanvas.tsx', content, 'utf8');
console.log('Arkham Knight Asphalt Lighting and Dual Xenon Bumper Flares Applied!');
