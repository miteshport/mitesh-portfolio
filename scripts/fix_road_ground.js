const fs = require('fs');

let code = fs.readFileSync('src/components/F1GameCanvas.tsx', 'utf8');

// 1. Remove downward Y bending from roadVertexShader
code = code.replace(
  '        // 🌐 CURVED WORLD VERTEX SHADER (Bends road into Gotham horizon)\n        float horizonDist = max(0.0, zDist - 12.0);\n        pos.z -= horizonDist * horizonDist * 0.0013;\n\n        vec4 modelViewPosition = modelViewMatrix * vec4(pos, 1.0);',
  '        vec4 modelViewPosition = modelViewMatrix * vec4(pos, 1.0);'
);

// 2. Remove applyCurvedWorldShader calls on blocks
code = code.replace(/applyCurvedWorldShader\(.*?\);\n/g, '');

// Also remove the applyCurvedWorldShader helper function if still present
code = code.replace(
  /\/\/ Curved World Shader Injector for Three\.js Materials[\s\S]*?};\s*};/g,
  ''
);

// 3. Make sure power blocks float at normal height (0.42 above road surface)
code = code.replace(
  'item.group.position.y = 0.42 + Math.sin(time * 3.6 + i * 1.2) * 0.12;',
  'item.group.position.y = 0.45 + Math.sin(time * 3.6 + i * 1.2) * 0.08;'
);

fs.writeFileSync('src/components/F1GameCanvas.tsx', code, 'utf8');
console.log('Road vertex shader and blocks restored flush with road surface (Y = 0)!');
