const fs = require('fs');

let code = fs.readFileSync('src/components/F1GameCanvas.tsx', 'utf8');

// Move carGroup declaration above holo setup
code = code.replace(
  '    // --- 10. 🦇 3D BATMOBILE TUMBLER (AUTHENTIC RIGGED STUDIO MODEL) ---\n    // --- 10B. 🎯 DIEGETIC IN-WORLD 3D ROOF HOLOGRAM & CHASSIS REACTOR NODES ---',
  `    // --- 10. 🦇 3D BATMOBILE TUMBLER (AUTHENTIC RIGGED STUDIO MODEL) ---
    const carGroup = new THREE.Group();
    scene.add(carGroup);

    // --- 10B. 🎯 DIEGETIC IN-WORLD 3D ROOF HOLOGRAM & CHASSIS REACTOR NODES ---`
);

// Remove the duplicate carGroup declaration
code = code.replace(
  '      holoTex.needsUpdate = true;\n    };\n    const carGroup = new THREE.Group();\n    scene.add(carGroup);',
  '      holoTex.needsUpdate = true;\n    };'
);

fs.writeFileSync('src/components/F1GameCanvas.tsx', code, 'utf8');
console.log('Fixed carGroup declaration ordering in F1GameCanvas.tsx');
