const fs = require('fs');

// --- 1. Update F1GameCanvas.tsx for Dynamic Fold 4 / Narrow Mobile Camera & Lane Pitch ---
let canvasContent = fs.readFileSync('src/components/F1GameCanvas.tsx', 'utf8');

// Replace Initial Camera Setup
const oldCameraSetup = `    const isMobInit = window.innerWidth < 768;
    const camera = new THREE.PerspectiveCamera(
      isMobInit ? 68 : 64,
      window.innerWidth / window.innerHeight,
      0.1,
      600
    );
    // Elevated 3/4 chase camera: stable, cinematic, zero spring wobble
    camera.position.set(0, 2.85, 6.2);`;

const newCameraSetup = `    const wInit = window.innerWidth;
    const hInit = window.innerHeight;
    const aspectInit = wInit / hInit;
    const isNarrowFold = wInit < 500 || aspectInit < 0.65;
    const camera = new THREE.PerspectiveCamera(
      isNarrowFold ? 72 : 64,
      aspectInit,
      0.1,
      600
    );
    // Dynamic Camera Pull-Back: Guarantees 100% full view of highway on Fold 4 closed screen
    camera.position.set(0, isNarrowFold ? 3.4 : 2.85, isNarrowFold ? 8.4 : 6.2);`;

canvasContent = canvasContent.replace(oldCameraSetup, newCameraSetup);

// Replace Lane Positions declaration with Dynamic Responsive Pitch
const oldLanePositions = `    const lanePositions = [-2.6, 0.0, 2.6];
    let currentLane = 1; // 0 = Left, 1 = Center, 2 = Right
    let targetCarX = lanePositions[currentLane];`;

const newLanePositions = `    const getLanePitch = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const aspect = w / h;
      if (w < 440 || aspect < 0.55) return 1.75; // Galaxy Z Fold 4 Narrow Cover Screen
      if (w < 768 || aspect < 0.65) return 2.15; // Standard Phone
      return 2.60; // Desktop / Wide
    };
    let lanePitch = getLanePitch();
    let lanePositions = [-lanePitch, 0.0, lanePitch];
    let currentLane = 1; // 0 = Left, 1 = Center, 2 = Right
    let targetCarX = lanePositions[currentLane];`;

canvasContent = canvasContent.replace(oldLanePositions, newLanePositions);

// Replace Resize Handler
const oldResizeHandler = `    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const isMob = w < 768;
      camera.aspect = w / h;
      camera.fov = isMob ? 68 : 64;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      composer.setSize(w, h);
      bloomPass.setSize(w / 2, h / 2);
    };`;

const newResizeHandler = `    const handleResize = () => {
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

      // Re-calculate responsive lane pitch and lock car inside viewport
      lanePitch = getLanePitch();
      lanePositions = [-lanePitch, 0.0, lanePitch];
      targetCarX = lanePositions[currentLane];
    };`;

canvasContent = canvasContent.replace(oldResizeHandler, newResizeHandler);

fs.writeFileSync('src/components/F1GameCanvas.tsx', canvasContent, 'utf8');

// --- 2. Update SpatialHUD.tsx for clean Fold 4 non-overlapping header ---
let hudContent = fs.readFileSync('src/components/SpatialHUD.tsx', 'utf8');

// Update top shield styling
hudContent = hudContent.replace(
  /padding: 0 clamp\(0\.75rem, 3vw, 2\.5rem\);/g,
  'padding: 0 clamp(0.45rem, 2vw, 2.0rem);'
);

// Replace left brand section to avoid duplicated "PORTFOLIO"
const oldLeftBrand = `        {/* Left: Interactive Live Mode Indicator / Home Breadcrumb */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            pointerEvents: "auto",
            flexShrink: 0,
          }}
        >
          <Link
            href="/"
            className="spatial-hud-link"
            style={{ fontWeight: 700, letterSpacing: "0.14em" }}
          >
            PORTFOLIO
          </Link>

          {isHome && (
            <span
              style={{
                fontSize: "0.62rem",
                fontFamily: "var(--font-mono)",
                color: "rgba(255, 255, 255, 0.35)",
                letterSpacing: "0.1em",
              }}
            >
              / 01
            </span>
          )}
        </div>`;

const newLeftBrand = `        {/* Left: Brand Identity */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
            pointerEvents: "auto",
            flexShrink: 0,
          }}
        >
          <Link
            href="/"
            className="spatial-hud-link"
            style={{ fontWeight: 800, letterSpacing: "0.14em", color: "#ffffff" }}
          >
            MITESH
          </Link>
          <span
            className="spatial-brand-sub"
            style={{
              fontSize: "0.60rem",
              fontFamily: "var(--font-mono)",
              color: "rgba(255, 255, 255, 0.35)",
              letterSpacing: "0.1em",
            }}
          >
            / GOTHAM
          </span>
        </div>`;

hudContent = hudContent.replace(oldLeftBrand, newLeftBrand);

// Add CSS media query for narrow screens
hudContent = hudContent.replace(
  /\.spatial-hud-link:hover \{/g,
  `@media (max-width: 460px) {
    .spatial-brand-sub { display: none !important; }
    .spatial-hud-link { font-size: 0.60rem !important; gap: 0.15rem !important; }
  }
  .spatial-hud-link:hover {`
);

fs.writeFileSync('src/components/SpatialHUD.tsx', hudContent, 'utf8');

console.log('Fold 4 Camera Math and Non-Overlapping SpatialHUD Applied Successfully!');
