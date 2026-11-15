const fs = require('fs');

// ========================================================
// 1. UPDATE SpatialHUD.tsx (Mathematically Exact Center Audio Pill & No Fold 4 Collisions)
// ========================================================
let hud = fs.readFileSync('src/components/SpatialHUD.tsx', 'utf8');

const oldTopShield = hud.substring(
  hud.indexOf('      {/* 1. TOP UNIFIED GLASS SHIELD */}'),
  hud.indexOf('      {/* 2. BOTTOM CORNER ACCENTS')
);

const newTopShield = `      {/* 1. TOP UNIFIED GLASS SHIELD */}
      <header className="spatial-top-shield" style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "54px", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 clamp(0.75rem, 3vw, 2.5rem)", boxSizing: "border-box" }}>
        
        {/* Left Link */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", pointerEvents: "auto", zIndex: 5 }}>
          {isHome ? (
            <Link href="/about" className="spatial-hud-link">
              <span>PORTFOLIO</span>
            </Link>
          ) : (
            <Link href="/" className="spatial-hud-link">
              <span style={{ color: "#38bdf8" }}>←</span>
              <span>BATMOBILE</span>
            </Link>
          )}

          {isHome && (
            <span
              className="spatial-subtext"
              style={{
                fontSize: "0.60rem",
                fontFamily: "var(--font-mono)",
                color: "rgba(255, 255, 255, 0.30)",
                letterSpacing: "0.1em",
              }}
            >
              / 01
            </span>
          )}
        </div>

        {/* Center: Mathematically Exact Dead-Center Audio Status Pill */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            pointerEvents: "auto",
            zIndex: 10,
          }}
        >
          <button
            onClick={() => {
              audio.playClick();
              toggleMute();
            }}
            style={{
              background: isMuted
                ? "rgba(255, 255, 255, 0.06)"
                : "linear-gradient(135deg, rgba(48, 209, 88, 0.22) 0%, rgba(255, 255, 255, 0.08) 100%)",
              border: isMuted
                ? "1px solid rgba(255, 255, 255, 0.16)"
                : "1px solid rgba(48, 209, 88, 0.55)",
              borderRadius: "9999px",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.45rem",
              fontFamily: "var(--font-mono, monospace)",
              fontSize: "clamp(0.58rem, 0.90vw, 0.70rem)",
              letterSpacing: "0.12em",
              color: isMuted ? "rgba(255, 255, 255, 0.65)" : "#ffffff",
              textTransform: "uppercase",
              padding: "0.28rem 0.70rem",
              boxShadow: isMuted
                ? "0 4px 16px rgba(0, 0, 0, 0.4)"
                : "0 0 16px rgba(48, 209, 88, 0.35), 0 4px 16px rgba(0, 0, 0, 0.4)",
              transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
              whiteSpace: "nowrap",
            }}
          >
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                backgroundColor: isMuted ? "rgba(255,255,255,0.3)" : "#30d158",
                boxShadow: isMuted ? "none" : "0 0 8px #30d158",
                display: "inline-block",
                transition: "all 0.2s ease",
              }}
            />
            <span style={{ fontWeight: 650 }}>
              {isMuted ? "AUDIO: OFF" : "AUDIO: ON"}
              <span className="spatial-time-text"> · {timeStr}</span>
            </span>
          </button>
        </div>

        {/* Right Navigation */}
        <nav
          style={{
            display: "flex",
            alignItems: "center",
            gap: "clamp(0.5rem, 1.5vw, 1.4rem)",
            pointerEvents: "auto",
            zIndex: 5,
          }}
        >
          {isHome ? (
            <>
              <Link
                href="/about"
                className={\`spatial-hud-link spatial-nav-desktop \${isPortfolio ? "spatial-hud-active" : ""}\`}
              >
                <span>ABOUT</span>
              </Link>
              <Link
                href="/radio"
                className={\`spatial-hud-link \${isSoundroom ? "spatial-hud-active" : ""}\`}
              >
                <span>SOUNDROOM</span>
              </Link>
              <Link
                href="/card"
                className={\`spatial-hud-link spatial-nav-desktop \${isCard ? "spatial-hud-active" : ""}\`}
              >
                <span>CARD</span>
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/about"
                className={\`spatial-hud-link \${isPortfolio ? "spatial-hud-active" : ""}\`}
              >
                <span>ABOUT</span>
              </Link>
              <Link
                href="/radio"
                className={\`spatial-hud-link \${isSoundroom ? "spatial-hud-active" : ""}\`}
              >
                <span>SOUNDROOM</span>
              </Link>
              <Link
                href="/card"
                className={\`spatial-hud-link spatial-nav-desktop \${isCard ? "spatial-hud-active" : ""}\`}
              >
                <span>CARD</span>
              </Link>
            </>
          )}
        </nav>
      </header>`;

if (oldTopShield) {
  hud = hud.replace(oldTopShield, newTopShield);
}

// Add responsive rules for Fold 4
hud = hud.replace(
  /@media \(max-width: 480px\) \{[\s\S]*?\}/,
  `@media (max-width: 480px) {
          .spatial-time-text {
            display: none !important;
          }
          .spatial-subtext {
            display: none !important;
          }
          .spatial-nav-desktop {
            display: none !important;
          }
          .spatial-hud-link {
            font-size: 0.60rem !important;
            letter-spacing: 0.08em !important;
          }
        }`
);

fs.writeFileSync('src/components/SpatialHUD.tsx', hud, 'utf8');
console.log('✅ SpatialHUD.tsx updated with dead-center Audio Pill & responsive Fold 4 spacing!');

// ========================================================
// 2. UPDATE F1GameCanvas.tsx (Restore Elegant Distant Skyline & Remove Giant Side Blocks)
// ========================================================
let canvas = fs.readFileSync('src/components/F1GameCanvas.tsx', 'utf8');

const oldSkyscraperBlock = canvas.substring(
  canvas.indexOf('    // --- 6. 🏙️ 28 VIVID 3D GOTHAM MONOLITH SKYSCRAPERS'),
  canvas.indexOf('    // --- 7. 🛣️ UNIFIED 3-LANE ROCK-SOLID ASPHALT HIGHWAY')
);

const newSkyscraperBlock = `    // --- 6. 🌆 CINEMATIC GOTHAM HORIZON SKYLINE (IMAGE 2 STYLE) ---
    const skylineCanvas = document.createElement("canvas");
    skylineCanvas.width = 2048;
    skylineCanvas.height = 512;
    const sCtx = skylineCanvas.getContext("2d");
    if (sCtx) {
      sCtx.fillStyle = "rgba(0, 0, 0, 0)";
      sCtx.fillRect(0, 0, 2048, 512);

      let curX = 0;
      while (curX < 2048) {
        const bWidth = 24 + Math.random() * 48;
        const bHeight = 100 + Math.random() * 260;
        const bY = 512 - bHeight;

        // Dark Gotham Silhouette Tower
        sCtx.fillStyle = "rgba(4, 9, 20, 0.96)";
        sCtx.fillRect(curX, bY, bWidth, bHeight);

        // Rooftop Antenna Spire + Red Aviation Warning Beacon
        if (Math.random() > 0.35) {
          sCtx.strokeStyle = "#08142a";
          sCtx.lineWidth = 1.5;
          sCtx.beginPath();
          sCtx.moveTo(curX + bWidth / 2, bY);
          sCtx.lineTo(curX + bWidth / 2, bY - 24);
          sCtx.stroke();

          sCtx.fillStyle = "rgba(239, 68, 68, 0.95)";
          sCtx.beginPath();
          sCtx.arc(curX + bWidth / 2, bY - 24, 2.0, 0, Math.PI * 2);
          sCtx.fill();
        }

        // Scattered Elegant Pin-Light Windows (Warm Gold & Cyan)
        for (let wy = bY + 14; wy < 500; wy += 12) {
          for (let wx = curX + 5; wx < curX + bWidth - 5; wx += 8) {
            const rand = Math.random();
            if (rand > 0.60) {
              if (rand > 0.90) {
                sCtx.fillStyle = "rgba(255, 220, 140, 0.85)"; // Warm Gold Penthouse
              } else if (rand > 0.75) {
                sCtx.fillStyle = "rgba(56, 189, 248, 0.80)"; // Wayne Cyan
              } else {
                sCtx.fillStyle = "rgba(220, 235, 255, 0.65)"; // Cool White
              }
              sCtx.fillRect(wx, wy, 2.5, 4.0);
            }
          }
        }
        curX += bWidth + 4;
      }
    }

    const skylineTex = new THREE.CanvasTexture(skylineCanvas);
    skylineTex.wrapS = THREE.RepeatWrapping;
    skylineTex.wrapT = THREE.ClampToEdgeWrapping;
    const skylineGeo = new THREE.CylinderGeometry(260, 260, 120, 48, 1, true, -Math.PI / 2, Math.PI);
    const skylineMat = new THREE.MeshBasicMaterial({
      map: skylineTex,
      transparent: true,
      opacity: 0.88,
      side: THREE.BackSide,
      depthWrite: false,
    });
    const skylineMesh = new THREE.Mesh(skylineGeo, skylineMat);
    skylineMesh.position.set(0, 42, -115);
    scene.add(skylineMesh);
`;

if (oldSkyscraperBlock) {
  canvas = canvas.replace(oldSkyscraperBlock, newSkyscraperBlock);
}

// Clean up buildingList reference from game loop in tick()
canvas = canvas.replace(
  /\/\/ 🏙️ Move 3D Skyscraper Canyon with Road Speed[\s\S]*?\/\/ 🔴 RED AFTERBURNER/,
  '// 🔴 RED AFTERBURNER'
);

// Add parallax scroll back to skylineTex in tick()
canvas = canvas.replace(
  /roadUniforms\.uDistance\.value = trackDistance;/,
  `roadUniforms.uDistance.value = trackDistance;
      if (skylineTex && isDriving) {
        skylineTex.offset.x = (trackDistance * 0.0002) % 1;
      }`
);

// Add cleanup for skyline
canvas = canvas.replace(
  /batMat\.dispose\(\);/g,
  'batMat.dispose();\n      skylineTex.dispose();\n      skylineMat.dispose();\n      skylineGeo.dispose();'
);

fs.writeFileSync('src/components/F1GameCanvas.tsx', canvas, 'utf8');
console.log('✅ F1GameCanvas.tsx updated with cinematic distant Gotham skyline!');
