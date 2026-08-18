const fs = require('fs');

// --- 1. Update F1GameCanvas.tsx ---
let canvasContent = fs.readFileSync('src/components/F1GameCanvas.tsx', 'utf8');

// Update coneGeo segments to 36 for silky smooth light
canvasContent = canvasContent.replace(
  /new THREE\.CylinderGeometry\(0\.06, 2\.8, 28, 16, 1, true\)/g,
  'new THREE.CylinderGeometry(0.06, 2.8, 28, 36, 1, true)'
);

// Update Bat-Signal in Canvas with sharp Nolan Silhouette
const oldBatDraw = `      bCtx.fillStyle = "#020408";
      bCtx.beginPath();
      bCtx.moveTo(128, 92);
      bCtx.bezierCurveTo(116, 78, 96, 74, 68, 88);
      bCtx.bezierCurveTo(56, 110, 64, 135, 84, 142);
      bCtx.bezierCurveTo(98, 132, 112, 136, 120, 154);
      bCtx.bezierCurveTo(124, 160, 132, 160, 136, 154);
      bCtx.bezierCurveTo(144, 136, 158, 132, 172, 142);
      bCtx.bezierCurveTo(192, 135, 200, 110, 188, 88);
      bCtx.bezierCurveTo(160, 74, 140, 78, 128, 92);
      bCtx.fill();`;

const newBatDraw = `      bCtx.fillStyle = "#020408";
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

canvasContent = canvasContent.replace(oldBatDraw, newBatDraw);
fs.writeFileSync('src/components/F1GameCanvas.tsx', canvasContent, 'utf8');

// --- 2. Update page.tsx with sharp Nolan Bat SVG ---
let pageContent = fs.readFileSync('src/app/page.tsx', 'utf8');

const oldBatSvg = `<svg width="48" height="48" viewBox="0 0 24 24" fill="#38bdf8">
                  <path d="M12 4C10.8 2.8 8.5 2.2 5.5 3.5C4.2 6 5.1 9.2 7 10C8.5 9 9.8 9.5 10.5 11.2C10.8 11.8 11.4 11.8 11.8 11.2C12.5 9.5 13.8 9 15.3 10C17.2 9.2 18.1 6 16.8 3.5C13.8 2.2 11.5 2.8 12 4Z" />
                </svg>`;

const newBatSvg = `<svg width="56" height="32" viewBox="0 0 800 350" fill="#38bdf8">
                  <path d="M 400 0 C 418 36, 442 48, 470 54 C 540 10, 680 20, 780 120 C 720 150, 640 135, 590 190 C 620 240, 690 270, 800 290 C 690 320, 560 300, 480 230 C 460 270, 420 310, 400 350 C 380 310, 340 270, 320 230 C 240 300, 110 320, 0 290 C 110 270, 180 240, 210 190 C 160 135, 80 150, 20 120 C 120 20, 260 10, 330 54 C 358 48, 382 36, 400 0 Z" />
                </svg>`;

pageContent = pageContent.replace(oldBatSvg, newBatSvg);
fs.writeFileSync('src/app/page.tsx', pageContent, 'utf8');

console.log('Sharp Christopher Nolan Bat-Symbol applied across Splash and Canvas!');
