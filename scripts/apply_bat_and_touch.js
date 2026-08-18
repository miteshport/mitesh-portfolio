const fs = require('fs');

// --- 1. Update F1GameCanvas.tsx ---
let canvasContent = fs.readFileSync('src/components/F1GameCanvas.tsx', 'utf8');

// Replace Bat-Signal Canvas Drawing in F1GameCanvas
const oldCanvasBat = `      bCtx.fillStyle = "#020408";
      bCtx.beginPath();
      bCtx.moveTo(128, 98);
      bCtx.lineTo(133, 86);
      bCtx.lineTo(137, 95);
      bCtx.bezierCurveTo(160, 82, 188, 86, 218, 116);
      bCtx.bezierCurveTo(200, 126, 174, 122, 162, 140);
      bCtx.bezierCurveTo(170, 154, 190, 162, 222, 168);
      bCtx.bezierCurveTo(190, 180, 152, 174, 130, 154);
      bCtx.bezierCurveTo(126, 168, 122, 180, 128, 194);
      bCtx.bezierCurveTo(124, 180, 120, 168, 116, 154);
      bCtx.bezierCurveTo(94, 174, 56, 180, 24, 168);
      bCtx.bezierCurveTo(56, 162, 76, 154, 84, 140);
      bCtx.bezierCurveTo(72, 122, 46, 126, 28, 116);
      bCtx.bezierCurveTo(58, 86, 86, 82, 109, 95);
      bCtx.lineTo(113, 86);
      bCtx.lineTo(118, 98);
      bCtx.closePath();
      bCtx.fill();`;

const newCanvasBat = `      // 2. Exact Nolan Bat-Signal Vector Silhouette
      bCtx.save();
      bCtx.translate(128, 128);
      bCtx.scale(0.82, 0.82);
      bCtx.fillStyle = "rgba(4, 8, 18, 0.98)";

      bCtx.beginPath();
      bCtx.moveTo(-6, -42);
      bCtx.lineTo(-14, -62); // Left Ear Tip
      bCtx.lineTo(-24, -42);
      bCtx.bezierCurveTo(-55, -45, -95, -28, -125, 8); // Left Upper Wing
      bCtx.bezierCurveTo(-110, 25, -90, 42, -75, 42); // Left Outer Scallop
      bCtx.bezierCurveTo(-60, 42, -45, 28, -38, 22); // Left Mid Scallop
      bCtx.bezierCurveTo(-30, 38, -18, 52, 0, 56); // Tail Tip
      bCtx.bezierCurveTo(18, 52, 30, 38, 38, 22); // Right Inner Scallop
      bCtx.bezierCurveTo(45, 28, 60, 42, 75, 42); // Right Mid Scallop
      bCtx.bezierCurveTo(90, 42, 110, 25, 125, 8); // Right Wing Tip
      bCtx.bezierCurveTo(95, -28, 55, -45, 24, -42); // Right Upper Wing
      bCtx.lineTo(14, -62); // Right Ear Tip
      bCtx.lineTo(6, -42);
      bCtx.closePath();
      bCtx.fill();
      bCtx.restore();`;

canvasContent = canvasContent.replace(oldCanvasBat, newCanvasBat);

// Replace Pointer / Mouse / Touch listeners with Butter-Smooth Precision Control
const oldPointerCode = `    // --- 11. 🎮 UNIFIED 3-LANE CONTROLS (TRUE LANE LOCK) ---
    const handlePointerMove = (e: PointerEvent) => {
      if (currentGameState !== "PLAYING") return;
      const normX = (e.clientX / window.innerWidth) * 2 - 1;
      if (normX < -0.30) {
        currentLane = 0; // Left
      } else if (normX > 0.30) {
        currentLane = 2; // Right
      } else {
        currentLane = 1; // Center
      }
      targetCarX = lanePositions[currentLane];
    };

    const handlePointerDown = () => {
      isBoosting = true;
    };

    const handlePointerUp = () => {
      isBoosting = false;
    };`;

const newPointerCode = `    // --- 11. 🎮 UNIFIED 3-LANE CONTROLS (PRECISION MOUSE & TOUCH) ---
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

canvasContent = canvasContent.replace(oldPointerCode, newPointerCode);
fs.writeFileSync('src/components/F1GameCanvas.tsx', canvasContent, 'utf8');

// --- 2. Update page.tsx with Exact Nolan Bat SVG ---
let pageContent = fs.readFileSync('src/app/page.tsx', 'utf8');

const oldBatSvgInPage = /<svg width="56" height="32" viewBox="0 0 800 350" fill="#38bdf8">[\s\S]*?<\/svg>/;

const newBatSvgInPage = `<svg width="74" height="38" viewBox="-140 -70 280 140" fill="#38bdf8" style={{ filter: "drop-shadow(0 0 14px rgba(56,189,248,0.7))" }}>
                  <path d="M -6 -42 L -14 -62 L -24 -42 C -55 -45 -95 -28 -125 8 C -110 25 -90 42 -75 42 C -60 42 -45 28 -38 22 C -30 38 -18 52 0 56 C 18 52 30 38 38 22 C 45 28 60 42 75 42 C 90 42 110 25 125 8 C 95 -28 55 -45 24 -42 L 14 -62 L 6 -42 Z" />
                </svg>`;

pageContent = pageContent.replace(oldBatSvgInPage, newBatSvgInPage);
fs.writeFileSync('src/app/page.tsx', pageContent, 'utf8');

console.log('Exact Nolan Bat-Symbol and Butter-Smooth Mouse/Touch Controls Deployed!');
