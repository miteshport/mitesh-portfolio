const fs = require('fs');

let canvasCode = fs.readFileSync('src/components/F1GameCanvas.tsx', 'utf8');

// 1. Update Props
canvasCode = canvasCode.replace(
  'interface F1GameCanvasProps {\n  isLightsOut?: boolean;\n  isMuted?: boolean;\n  onTelemetryUpdate?: (data: TelemetryData) => void;\n}',
  `interface F1GameCanvasProps {
  isLightsOut?: boolean;
  isMuted?: boolean;
  onTelemetryUpdate?: (data: TelemetryData) => void;
  onLoadProgress?: (progress: number) => void;
  onLoadComplete?: () => void;
}`
);

canvasCode = canvasCode.replace(
  'export default function F1GameCanvas({\n  isLightsOut = false,\n  isMuted = false,\n  onTelemetryUpdate,\n}: F1GameCanvasProps) {',
  `export default function F1GameCanvas({
  isLightsOut = false,
  isMuted = false,
  onTelemetryUpdate,
  onLoadProgress,
  onLoadComplete,
}: F1GameCanvasProps) {`
);

// 2. Pre-render Static Canvas Texture Pool
const staticTextureCode = `    // Static Pre-rendered Canvas Texture Pool (Zero allocations during gameplay)
    const STATIC_NUMBER_TEXTURES = new Map<number, THREE.CanvasTexture>();
    [2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048].forEach((val) => {
      const info = BLOCK_COLORS[val] || BLOCK_COLORS[2];
      const canvas = document.createElement("canvas");
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "rgba(6, 9, 16, 0.95)";
        ctx.beginPath();
        ctx.roundRect(8, 8, 240, 240, 36);
        ctx.fill();

        ctx.strokeStyle = info.hex;
        ctx.lineWidth = 14;
        ctx.shadowColor = info.hex;
        ctx.shadowBlur = 18;
        ctx.stroke();

        ctx.fillStyle = "#ffffff";
        ctx.font = \`900 \${val >= 1000 ? "68px" : val >= 100 ? "82px" : "106px"} system-ui, sans-serif\`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(String(val), 128, 128);
      }
      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      STATIC_NUMBER_TEXTURES.set(val, tex);
    });

    const getNumberTexture = (val: number, hexColor: string) => {
      return STATIC_NUMBER_TEXTURES.get(val) || STATIC_NUMBER_TEXTURES.get(2)!;
    };`;

canvasCode = canvasCode.replace(
  /\/\/ Canvas Texture Cache for Dynamic Number Decals[\s\S]*?return tex;\s*};/,
  staticTextureCode
);

// 3. Attach LoadingManager with Shader Pre-Warming
canvasCode = canvasCode.replace(
  '    const loader = new GLTFLoader();',
  `    const loadingManager = new THREE.LoadingManager();
    loadingManager.onProgress = (_url, itemsLoaded, itemsTotal) => {
      const progress = Math.min(100, Math.round((itemsLoaded / Math.max(1, itemsTotal)) * 100));
      if (onLoadProgress) onLoadProgress(progress);
    };
    loadingManager.onLoad = () => {
      // 🚀 Pre-warm all shaders on GPU before gameplay to eliminate frame drops
      renderer.compile(scene, camera);
      if (onLoadProgress) onLoadProgress(100);
      if (onLoadComplete) onLoadComplete();
    };

    const loader = new GLTFLoader(loadingManager);`
);

fs.writeFileSync('src/components/F1GameCanvas.tsx', canvasCode, 'utf8');
console.log('F1GameCanvas.tsx updated with Static Texture Pool & LoadingManager shader pre-warming');
