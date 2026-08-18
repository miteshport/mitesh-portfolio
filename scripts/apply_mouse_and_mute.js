const fs = require('fs');

let content = fs.readFileSync('src/components/F1GameCanvas.tsx', 'utf8');

// --- 1. Re-enable Mouse Click Boost and Touch Steering ---
const oldPointerHandlers = `    // --- 11. 🎮 UNIFIED 3-LANE CONTROLS (PRECISION MOUSE & TOUCH) ---
    let touchStartX = 0;
    let isTouching = false;

    const handlePointerMove = (e: PointerEvent) => {
      if (currentGameState !== "PLAYING") return;
      // Continuous smooth mouse glide across the 3 lanes
      const normX = (e.clientX / window.innerWidth) * 2 - 1;
      const rawTargetX = THREE.MathUtils.clamp(normX * 3.2, -2.6, 2.6);

      // Intelligent Lane Snap: auto-locks cleanly into lane centers
      if (rawTargetX < -1.4) {
        currentLane = 0; // Left Lane (-2.6)
      } else if (rawTargetX > 1.4) {
        currentLane = 2; // Right Lane (+2.6)
      } else {
        currentLane = 1; // Center Lane (0.0)
      }
      targetCarX = lanePositions[currentLane];
    };

    const handlePointerDown = (e: PointerEvent) => {
      if (currentGameState !== "PLAYING") return;
      touchStartX = e.clientX;
      isTouching = true;
      const normX = (e.clientX / window.innerWidth) * 2 - 1;
      // Direct tap to switch lanes
      if (normX < -0.25) {
        currentLane = Math.max(0, currentLane - 1);
      } else if (normX > 0.25) {
        currentLane = Math.min(2, currentLane + 1);
      } else {
        currentLane = 1;
      }
      targetCarX = lanePositions[currentLane];
    };

    const handlePointerUp = () => {
      isTouching = false;
    };`;

const newPointerHandlers = `    // --- 11. 🎮 UNIFIED 3-LANE CONTROLS (PRECISION MOUSE BOOST & TOUCH STEERING) ---
    const handlePointerMove = (e: PointerEvent) => {
      if (currentGameState !== "PLAYING") return;
      // Continuous smooth mouse glide across the 3 lanes
      const normX = (e.clientX / window.innerWidth) * 2 - 1;
      const rawTargetX = THREE.MathUtils.clamp(normX * 3.2, -2.6, 2.6);

      // Intelligent Lane Snap: auto-locks cleanly into lane centers
      if (rawTargetX < -1.4) {
        currentLane = 0; // Left Lane (-2.6)
      } else if (rawTargetX > 1.4) {
        currentLane = 2; // Right Lane (+2.6)
      } else {
        currentLane = 1; // Center Lane (0.0)
      }
      targetCarX = lanePositions[currentLane];
    };

    const handlePointerDown = (e: PointerEvent) => {
      if (currentGameState !== "PLAYING") return;
      // 🖱️ Mouse Left Click = Engage Roaring Afterburner Boost!
      if (e.pointerType === "mouse" || e.button === 0) {
        isBoosting = true;
      }

      // 📱 Mobile Touch: Tap left/right third to switch lanes
      if (e.pointerType === "touch") {
        const normX = (e.clientX / window.innerWidth) * 2 - 1;
        if (normX < -0.25) {
          currentLane = Math.max(0, currentLane - 1);
        } else if (normX > 0.25) {
          currentLane = Math.min(2, currentLane + 1);
        } else {
          currentLane = 1;
        }
        targetCarX = lanePositions[currentLane];
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (e.pointerType === "mouse" || e.button === 0) {
        isBoosting = false;
      }
    };`;

content = content.replace(oldPointerHandlers, newPointerHandlers);

// --- 2. Wrap all SFX Audio Calls in !isMutedRef.current ---
content = content.replace(/audio\.playVictoryChime\(\);/g, 'if (!isMutedRef.current) audio.playVictoryChime();');
content = content.replace(/audio\.playOverloadAlarm\(\);/g, 'if (!isMutedRef.current) audio.playOverloadAlarm();');
content = content.replace(/audio\.playMergeChime\(8,\s*1\);/g, 'if (!isMutedRef.current) audio.playMergeChime(8, 1);');
content = content.replace(/audio\.playClick\(\);/g, 'if (!isMutedRef.current) audio.playClick();');

fs.writeFileSync('src/components/F1GameCanvas.tsx', content, 'utf8');
console.log('src/components/F1GameCanvas.tsx updated with Mouse Boost and strict Sound Mute checks!');
