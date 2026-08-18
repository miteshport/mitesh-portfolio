const fs = require('fs');

let code = fs.readFileSync('src/components/F1GameCanvas.tsx', 'utf8');

// 1. Cap DPR to 1.5 in initial setup
code = code.replace(
  'renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));',
  'renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));'
);

// 2. Half-resolution Bloom Pass
code = code.replace(
  'const bloomPass = new UnrealBloomPass(\n      new THREE.Vector2(window.innerWidth, window.innerHeight),\n      1.15, // strength\n      0.40, // radius\n      0.82  // threshold: only high-emissive headlights / bat-signal bleed\n    );',
  `const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth / 2, window.innerHeight / 2),
      0.95, // strength: cinematic soft aura
      0.38, // radius
      0.82  // threshold
    );`
);

// 3. Half-resolution Bloom Pass on resize
code = code.replace(
  'bloomPass.setSize(w, h);',
  'bloomPass.setSize(w / 2, h / 2);'
);

// 4. Also cap DPR on resize
code = code.replace(
  'renderer.setSize(w, h);',
  'renderer.setSize(w, h);\n      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));'
);

fs.writeFileSync('src/components/F1GameCanvas.tsx', code, 'utf8');
console.log('Renderer and Bloom optimizations applied to F1GameCanvas.tsx');
