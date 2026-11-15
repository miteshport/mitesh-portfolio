const fs = require('fs');

let canvas = fs.readFileSync('src/components/F1GameCanvas.tsx', 'utf8');

// 1. UPDATE GAME STATE & DISCRETE LANE ENGINE RIGS
const oldStateRig = canvas.substring(
  canvas.indexOf('    // --- 10. GAME STATE & ECONOMY'),
  canvas.indexOf('    // --- 12. RESIZE HANDLER ---')
);

const newStateRig = `    // --- 10. GAME STATE & ECONOMY (1000m ROAD FIGHTER MISSION) ---
    let gameScore = 0;
    let comboMultiplier = 1;
    let energyLevel = 100.0;
    let distanceRemaining = 1000;
    let currentGameState: "BRIEFING" | "PLAYING" | "WON" | "LOST" = "PLAYING";
    let nearMissCount = 0;
    let skidTimer = 0;

    // 🏎️ TRUE DISCRETE 3-LANE STATE ENGINE VARIABLES
    let currentLane = 1; // Discrete Slot: 0 = Left, 1 = Center, 2 = Right
    let fromX = lanePositions[currentLane];
    let targetCarX = lanePositions[currentLane];
    let carX = lanePositions[currentLane];
    let laneTransitionTime = 0.18; // Frame-exact 180ms AAA arcade Hermite curve
    let laneTransitionElapsed = 0.18; // When >= laneTransitionTime, 100% locked
    let steerDirection = 0;

    let steerInput = 0;
    let carSteerVelocity = 0;
    let isBoosting = false;
    let isBraking = false;
    let lapTime = 0;
    let trackDistance = 0;

    // Discrete Lane Shift Execution (Deterministic AAA Transition)
    const shiftLane = (direction: -1 | 1) => {
      if (currentGameState !== "PLAYING") return;
      const newLane = THREE.MathUtils.clamp(currentLane + direction, 0, 2);
      if (newLane === currentLane) return;

      fromX = carX; // Start from current exact coordinates (instant responsive double-taps)
      currentLane = newLane;
      targetCarX = lanePositions[currentLane];
      laneTransitionElapsed = 0;
      steerDirection = direction;
      if (!isMutedRef.current) audio.playClick();
    };

    const setTargetLane = (targetLaneIndex: number) => {
      if (currentGameState !== "PLAYING") return;
      const validLane = THREE.MathUtils.clamp(targetLaneIndex, 0, 2);
      if (validLane === currentLane) return;

      fromX = carX;
      currentLane = validLane;
      targetCarX = lanePositions[currentLane];
      laneTransitionElapsed = 0;
      steerDirection = targetCarX > fromX ? 1 : -1;
      if (!isMutedRef.current) audio.playClick();
    };

    // Reset Round Handler
    const resetGameRound = () => {
      gameScore = 0;
      comboMultiplier = 1;
      energyLevel = 100.0;
      distanceRemaining = 1000;
      currentGameState = "PLAYING";
      nearMissCount = 0;
      skidTimer = 0;
      trackDistance = 0;
      lapTime = 0;
      currentLane = 1;
      targetCarX = lanePositions[currentLane];
      fromX = targetCarX;
      carX = targetCarX;
      laneTransitionElapsed = laneTransitionTime;

      // Re-initialize entities
      for (let i = 0; i < poolSize; i++) {
        const item = entityPool[i];
        const isHazard = i % 4 !== 0;
        const initZ = -50 - Math.floor(i / 3) * 35;
        const initLane = i % 3;
        setEntityVisuals(item, initZ, initLane, isHazard);
      }
    };
    resetTriggerRef.current = resetGameRound;

    // --- 11. 🎮 AAA DISCRETE INPUT ENGINE (INSTANT TAP, SWIPE FLICK & 3-SECTOR MOUSE) ---
    let touchStartX = 0;
    let swipeTriggered = false;

    const handlePointerDown = (e: PointerEvent) => {
      if (currentGameState !== "PLAYING") return;
      touchStartX = e.clientX;
      swipeTriggered = false;

      // 📱 MOBILE TOUCH: Instant 1-Frame Discrete Tap
      if (e.pointerType === "touch" || window.innerWidth < 768) {
        if (e.clientX < window.innerWidth * 0.5) {
          shiftLane(-1);
        } else {
          shiftLane(1);
        }
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
        if (!swipeTriggered && Math.abs(deltaX) > 26) {
          swipeTriggered = true;
          shiftLane(deltaX > 0 ? 1 : -1);
        }
        return;
      }

      // 🖱️ DESKTOP MOUSE: Discrete 3-Sector Lane Snap
      const normX = (e.clientX / window.innerWidth) * 2 - 1;
      if (normX < -0.22) setTargetLane(0);
      else if (normX > 0.22) setTargetLane(2);
      else setTargetLane(1);
    };

    const handlePointerUp = (e: PointerEvent) => {
      swipeTriggered = false;
      if (e.pointerType === "mouse" || e.button === 0) isBoosting = false;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (currentGameState !== "PLAYING") return;
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        shiftLane(-1);
      } else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        shiftLane(1);
      } else if (e.key === "ArrowUp" || e.key === "w" || e.key === "W" || e.key === " " || e.key === "Shift") {
        isBoosting = true;
      } else if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") {
        isBraking = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp" || e.key === "w" || e.key === "W" || e.key === " " || e.key === "Shift") {
        isBoosting = false;
      } else if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") {
        isBraking = false;
      }
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);`;

if (oldStateRig) {
  canvas = canvas.replace(oldStateRig, newStateRig);
}

// 2. UPDATE GAME LOOP: HERMITE S-CURVE TRANSITION & EXACT LANE COLLISIONS
const oldPhysicsLoop = canvas.substring(
  canvas.indexOf('      // 5. 🏎️ VELVETY SMOOTH CRITICALLY-DAMPED SPRING PHYSICS'),
  canvas.indexOf('      const onKerb = Math.abs(carX) > 2.85;')
);

const newPhysicsLoop = `      // 5. 🏎️ TRUE DISCRETE 3-LANE HERMITE S-CURVE EXECUTION & SUSPENSION DYNAMICS
      if (laneTransitionElapsed < laneTransitionTime) {
        laneTransitionElapsed += delta;
        const t = Math.min(1.0, laneTransitionElapsed / laneTransitionTime);
        // Cubic Hermite S-Curve: smooth acceleration, peak velocity, cushioned settle
        const easeT = t * t * (3.0 - 2.0 * t);
        carX = THREE.MathUtils.lerp(fromX, targetCarX, easeT);
        carSteerVelocity = (1.0 - t) * steerDirection * 8.5;
      } else {
        carX = targetCarX; // 100% mathematically locked in lane center!
        carSteerVelocity = 0;
        steerDirection = 0;
      }

      const steerDiff = targetCarX - carX;
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
      const targetFlapAngle = (Math.abs(carSteerVelocity) > 0.8 || isBraking) ? 0.45 : (isBoosting ? -0.15 : 0.0);
      if (carGroup.children[2]) {
        carGroup.children[2].traverse((child: any) => {
          if (child.isMesh && (child.name.toLowerCase().includes("wing") || child.name.toLowerCase().includes("flap") || child.name.toLowerCase().includes("aero") || child.name.toLowerCase().includes("spoiler"))) {
            child.rotation.x += (targetFlapAngle - child.rotation.x) * 0.20;
          }
        });
      }

      // 🏋️ RIG 3: Heavy 2.5-Ton Suspension (6-8° Body Roll, Yaw Counter-Steer, Boost Squat)
      if (carGroup.children[2]) {
        const carPivot = carGroup.children[2];
        carPivot.rotation.z = -carSteerVelocity * 0.055; // Body roll 6-8°
        carPivot.rotation.y = Math.PI / 2 + carSteerVelocity * 0.025; // Yaw Drift
        carPivot.rotation.x = isBoosting ? 0.035 : (isBraking ? -0.025 : 0.0); // Squat / Dive
      }`;

if (oldPhysicsLoop) {
  canvas = canvas.replace(oldPhysicsLoop, newPhysicsLoop);
}

// 3. UPDATE EXACT DISCRETE LANE COLLISION CHECKING
canvas = canvas.replace(
  /if \(isDriving && item\.active && distZ < 1\.55 && distX < 1\.25\) \{/g,
  'const sameLane = currentLane === item.laneIndex;\n        if (isDriving && item.active && distZ < 1.45 && sameLane) {'
);

fs.writeFileSync('src/components/F1GameCanvas.tsx', canvas, 'utf8');
console.log('✅ TRUE DISCRETE 3-LANE STATE ENGINE DEPLOYED!');
