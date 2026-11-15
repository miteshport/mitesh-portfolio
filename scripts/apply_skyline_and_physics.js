const fs = require('fs');

let canvas = fs.readFileSync('src/components/F1GameCanvas.tsx', 'utf8');

// --- 1. INSERT GOTHAM CITY PROCEDURAL SKYLINE HORIZON ---
if (!canvas.includes('skylineMesh')) {
  const skylineCode = `    // --- 7. 🏙️ PROCEDURAL GOTHAM CITY SKYLINE HORIZON ---
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

      const numBuildings = 44;
      for (let i = 0; i < numBuildings; i++) {
        const bx = (i / numBuildings) * 1024;
        const bw = 18 + Math.random() * 24;
        const bh = 140 + Math.random() * 260;
        const by = 512 - bh;

        sCtx.fillStyle = "#03060f";
        sCtx.fillRect(bx, by, bw, bh);

        // Aviation Beacons
        if (Math.random() > 0.35) {
          sCtx.strokeStyle = "#08142a";
          sCtx.lineWidth = 2;
          sCtx.beginPath();
          sCtx.moveTo(bx + bw / 2, by);
          sCtx.lineTo(bx + bw / 2, by - 35);
          sCtx.stroke();

          sCtx.fillStyle = "rgba(239, 68, 68, 0.95)";
          sCtx.beginPath();
          sCtx.arc(bx + bw / 2, by - 35, 2.5, 0, Math.PI * 2);
          sCtx.fill();
        }

        // Office Windows
        for (let wy = by + 20; wy < 512 - 20; wy += 14) {
          for (let wx = bx + 4; wx < bx + bw - 4; wx += 6) {
            if (Math.random() > 0.65) {
              sCtx.fillStyle = Math.random() > 0.3 ? "rgba(240, 245, 255, 0.70)" : "rgba(56, 189, 248, 0.60)";
              sCtx.fillRect(wx, wy, 2.5, 4);
            }
          }
        }
      }
    }
    const skylineTex = new THREE.CanvasTexture(skylineCanvas);
    skylineTex.wrapS = THREE.RepeatWrapping;
    skylineTex.repeat.set(2, 1);
    const skylineGeo = new THREE.CylinderGeometry(220, 220, 95, 32, 1, true);
    const skylineMat = new THREE.MeshBasicMaterial({
      map: skylineTex,
      side: THREE.BackSide,
      fog: true,
      depthWrite: false,
    });
    const skylineMesh = new THREE.Mesh(skylineGeo, skylineMat);
    skylineMesh.position.set(0, 35, -50);
    scene.add(skylineMesh);`;

  canvas = canvas.replace('// --- 8. ⚡ ROAD FIGHTER', skylineCode + '\n\n    // --- 8. ⚡ ROAD FIGHTER');
}

// --- 2. UPGRADE AAA ARCADE INPUT ENGINE ---
canvas = canvas.replace(
  /\/\/ --- 11\. 🎮[\s\S]*?window\.addEventListener\("resize", handleResize\);/,
  `// --- 11. 🎮 AAA ARCADE INPUT ENGINE (INSTANT TAP, SWIPE FLICK & MOUSE BOOST) ---
    let touchStartX = 0;
    let swipeTriggered = false;

    const handlePointerDown = (e: PointerEvent) => {
      if (currentGameState !== "PLAYING") return;
      touchStartX = e.clientX;
      swipeTriggered = false;

      // 📱 MOBILE TOUCH: Instant 1-Frame Tap Response (Left Half / Right Half)
      if (e.pointerType === "touch" || window.innerWidth < 768) {
        if (e.clientX < window.innerWidth * 0.5) {
          currentLane = Math.max(0, currentLane - 1);
        } else {
          currentLane = Math.min(2, currentLane + 1);
        }
        targetCarX = lanePositions[currentLane];
      }

      // 🖱️ DESKTOP MOUSE: Hold Left-Click for Afterburner Boost
      if (e.pointerType === "mouse" || e.button === 0) {
        isBoosting = true;
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (currentGameState !== "PLAYING") return;

      // 📱 MOBILE SWIPE FLICK GESTURE
      if (e.pointerType === "touch" || window.innerWidth < 768) {
        const deltaX = e.clientX - touchStartX;
        if (!swipeTriggered && Math.abs(deltaX) > 28) {
          swipeTriggered = true;
          if (deltaX > 28) currentLane = Math.min(2, currentLane + 1);
          else if (deltaX < -28) currentLane = Math.max(0, currentLane - 1);
          targetCarX = lanePositions[currentLane];
        }
        return;
      }

      // 🖱️ DESKTOP MOUSE: Analog Glide with 15% Deadzone
      const normX = (e.clientX / window.innerWidth) * 2 - 1;
      if (normX < -0.22) currentLane = 0;
      else if (normX > 0.22) currentLane = 2;
      else currentLane = 1;
      targetCarX = lanePositions[currentLane];
    };

    const handlePointerUp = (e: PointerEvent) => {
      swipeTriggered = false;
      if (e.pointerType === "mouse" || e.button === 0) isBoosting = false;
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    // --- 12. RESIZE HANDLER ---
    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const aspect = w / h;
      const isMob = w < 768 || aspect < 0.65;
      camera.aspect = aspect;
      camera.fov = isMob ? 72 : 64;
      camera.position.set(0, isMob ? 3.4 : 2.85, isMob ? (aspect < 0.55 ? 8.6 : 7.8) : 6.2);
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      composer.setSize(w, h);
      bloomPass.setSize(w / 2, h / 2);

      lanePitch = getLanePitch();
      lanePositions = [-lanePitch, 0.0, lanePitch];
      targetCarX = lanePositions[currentLane];
    };
    window.addEventListener("resize", handleResize);`
);

// --- 3. UPGRADE 3 HEAVY TUMBLER MECHANISMS & SUSPENSION PHYSICS ---
canvas = canvas.replace(
  /\/\/ 5\. 1:1 CRISP 3-LANE GLIDE[\s\S]*?groundShadow\.position\.z = 0;/,
  `// 5. 🏎️ 3 HEAVY TUMBLER MECHANICAL RIGS & SUSPENSION DYNAMICS
      const steerDiff = targetCarX - carX;
      carSteerVelocity = steerDiff * 14.0;
      carX += steerDiff * Math.min(1.0, delta * 13.5);

      const skidWobble = skidTimer > 0 ? Math.sin(time * 40) * 0.14 * skidTimer : 0;

      carGroup.position.x = carX + skidWobble;
      carGroup.position.y = 0.02;
      carGroup.position.z = 0;

      groundShadow.position.x = carX + skidWobble;
      groundShadow.position.z = 0;

      // 🛞 RIG 1: 4-Wheel Monster Tread Axle Rotation
      if (carGroup.children[2]) {
        carGroup.children[2].traverse((child: any) => {
          if (child.isMesh && (child.name.toLowerCase().includes("wheel") || child.name.toLowerCase().includes("tire") || child.name.toLowerCase().includes("rim"))) {
            child.rotation.x += forwardDelta * 1.8;
          }
        });
      }

      // 🪽 RIG 2: Active Aero Air-Brake Flaps (Winglets)
      const targetFlapAngle = (Math.abs(steerDiff) > 0.35 || isBraking) ? 0.45 : (isBoosting ? -0.15 : 0.0);
      if (carGroup.children[2]) {
        carGroup.children[2].traverse((child: any) => {
          if (child.isMesh && (child.name.toLowerCase().includes("wing") || child.name.toLowerCase().includes("flap") || child.name.toLowerCase().includes("aero") || child.name.toLowerCase().includes("spoiler"))) {
            child.rotation.x += (targetFlapAngle - child.rotation.x) * 0.18;
          }
        });
      }

      // 🏋️ RIG 3: Heavy 2.5-Ton Suspension (6-8° Body Roll, Yaw Counter-Steer, Boost Squat)
      if (carGroup.children[2]) {
        const carPivot = carGroup.children[2];
        carPivot.rotation.z = -steerDiff * 0.14; // Heavy Body Roll into corner
        carPivot.rotation.y = Math.PI / 2 + steerDiff * 0.08; // Yaw drift
        carPivot.rotation.x = isBoosting ? 0.035 : (isBraking ? -0.025 : 0.0); // Squat / Dive
      }`
);

fs.writeFileSync('src/components/F1GameCanvas.tsx', canvas, 'utf8');
console.log('F1GameCanvas.tsx successfully upgraded with Skyline & 3 Heavy Tumbler Rigs!');
