const fs = require('fs');

// Read existing F1GameCanvas.tsx
let code = fs.readFileSync('src/components/F1GameCanvas.tsx', 'utf8');

// 1. Add audio import
if (!code.includes('import { audio }')) {
  code = code.replace(
    'import { playKerbRumble, updateF1Engine } from "@/utils/f1EngineAudio";',
    'import { playKerbRumble, updateF1Engine } from "@/utils/f1EngineAudio";\nimport { audio } from "@/utils/audioSystem";'
  );
}

// 2. Extend TelemetryData interface
code = code.replace(
  'export interface TelemetryData {\n  speed: number;\n  gear: number;\n  rpm: number;\n  lapTime: number;\n  isBoosting: boolean;\n  isDrifting: boolean;\n  isFlying: boolean;\n  isLightsOut: boolean;\n  onKerb: boolean;\n  currentSector: number;\n  sectorsCrossed: number;\n}',
  `export interface TelemetryData {
  speed: number;
  gear: number;
  rpm: number;
  lapTime: number;
  isBoosting: boolean;
  isDrifting: boolean;
  isFlying: boolean;
  isLightsOut: boolean;
  onKerb: boolean;
  currentSector: number;
  sectorsCrossed: number;
  cargoStack: number[];
  score: number;
  multiplier: number;
  lastMergeVal: number;
  isOverloaded: boolean;
  isHyperCharged: boolean;
  targetMatch: number | null;
}`
);

// 3. Inject Curved World in Road Vertex Shader
code = code.replace(
  '        float curve = sin((zDist + uDistance) * 0.022) * uCurvature * (zDist * 0.010);\n        pos.x += curve;\n        vWorldX = pos.x;\n\n        vec4 modelViewPosition = modelViewMatrix * vec4(pos, 1.0);',
  `        float curve = sin((zDist + uDistance) * 0.022) * uCurvature * (zDist * 0.010);
        pos.x += curve;
        vWorldX = pos.x;

        // 🌐 CURVED WORLD VERTEX SHADER (Bends road into Gotham horizon)
        float horizonDist = max(0.0, zDist - 12.0);
        pos.z -= horizonDist * horizonDist * 0.0013;

        vec4 modelViewPosition = modelViewMatrix * vec4(pos, 1.0);`
);

console.log('Base changes applied to F1GameCanvas.tsx');
fs.writeFileSync('src/components/F1GameCanvas.tsx', code, 'utf8');
