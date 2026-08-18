const fs = require('fs');

let pageCode = fs.readFileSync('src/app/page.tsx', 'utf8');

// Add state for loading & deployment
pageCode = pageCode.replace(
  '  const [isLightsOut, setIsLightsOut] = useState(false);\n  const [showCinematicTitle, setShowCinematicTitle] = useState(true);\n  const [hasInteracted, setHasInteracted] = useState(false);',
  `  const [isLightsOut, setIsLightsOut] = useState(false);
  const [showCinematicTitle, setShowCinematicTitle] = useState(true);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasDeployed, setHasDeployed] = useState(false);`
);

// Connect onLoadProgress and onLoadComplete to F1GameCanvas in page.tsx
pageCode = pageCode.replace(
  '      <F1GameCanvas\n        isLightsOut={isLightsOut}\n        isMuted={isMuted}\n        onTelemetryUpdate={setTelemetry}\n      />',
  `      <F1GameCanvas
        isLightsOut={isLightsOut}
        isMuted={isMuted}
        onTelemetryUpdate={setTelemetry}
        onLoadProgress={(p) => {
          setLoadProgress(p);
          if (p >= 100) setIsLoaded(true);
        }}
        onLoadComplete={() => {
          setIsLoaded(true);
          setLoadProgress(100);
        }}
      />`
);

// Add Rockstar-level Tactical Briefing Modal
const briefingModal = `      {/* --- 🦇 ROCKSTAR-TIER GOTHAM 2048 BRIEFING MODAL --- */}
      <AnimatePresence>
        {!hasDeployed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100vh",
              zIndex: 1200,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(2, 4, 10, 0.88)",
              backdropFilter: "blur(32px) saturate(180%)",
              WebkitBackdropFilter: "blur(32px) saturate(180%)",
              padding: "1.2rem",
              boxSizing: "border-box",
              pointerEvents: "auto",
            }}
          >
            <div
              style={{
                width: "100%",
                maxWidth: "620px",
                background: "linear-gradient(135deg, rgba(14, 20, 32, 0.95) 0%, rgba(6, 10, 18, 0.98) 100%)",
                border: "1px solid rgba(255, 255, 255, 0.18)",
                borderTop: "1px solid rgba(56, 189, 248, 0.45)",
                borderRadius: "24px",
                padding: "clamp(1.5rem, 4vw, 2.2rem)",
                boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.9), inset 0 1px 1px rgba(255, 255, 255, 0.3)",
                color: "#ffffff",
                fontFamily: "var(--font-mono, monospace)",
                boxSizing: "border-box",
              }}
            >
              {/* Header: Clean & Catchy */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.4rem" }}>
                <div>
                  <div style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.22em", color: "#38bdf8", textTransform: "uppercase" }}>
                    WAYNE ENTERPRISES
                  </div>
                  <div style={{ fontSize: "clamp(1.5rem, 3.5vw, 2.0rem)", fontWeight: 850, letterSpacing: "-0.03em", textTransform: "uppercase", marginTop: "0.15rem" }}>
                    GOTHAM 2048
                  </div>
                </div>
                <div style={{ padding: "0.3rem 0.75rem", borderRadius: "9999px", background: "rgba(56, 189, 248, 0.12)", border: "1px solid rgba(56, 189, 248, 0.3)", fontSize: "0.68rem", fontWeight: 700, color: "#38bdf8", letterSpacing: "0.12em" }}>
                  HIGHWAY PURSUIT
                </div>
              </div>

              {/* 3 Precision Rockstar Columns */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                  gap: "0.9rem",
                  marginBottom: "1.6rem",
                }}
              >
                {/* 01: STEER */}
                <div
                  style={{
                    background: "rgba(255, 255, 255, 0.04)",
                    border: "1px solid rgba(255, 255, 255, 0.10)",
                    borderRadius: "14px",
                    padding: "0.95rem 0.9rem",
                  }}
                >
                  <div style={{ fontSize: "0.66rem", fontWeight: 750, color: "#38bdf8", letterSpacing: "0.12em" }}>
                    [ 01 // STEER ]
                  </div>
                  <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#ffffff", marginTop: "0.35rem" }}>
                    Lane Navigation
                  </div>
                  <div style={{ fontSize: "0.68rem", color: "rgba(255, 255, 255, 0.65)", marginTop: "0.35rem", lineHeight: 1.45 }}>
                    Slide cursor or swipe touch to glide between highway lanes.
                  </div>
                </div>

                {/* 02: MERGE */}
                <div
                  style={{
                    background: "rgba(255, 255, 255, 0.04)",
                    border: "1px solid rgba(255, 255, 255, 0.10)",
                    borderRadius: "14px",
                    padding: "0.95rem 0.9rem",
                  }}
                >
                  <div style={{ fontSize: "0.66rem", fontWeight: 750, color: "#38bdf8", letterSpacing: "0.12em" }}>
                    [ 02 // MERGE ]
                  </div>
                  <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#ffffff", marginTop: "0.35rem" }}>
                    Number Cascade
                  </div>
                  <div style={{ fontSize: "0.68rem", color: "rgba(255, 255, 255, 0.65)", marginTop: "0.35rem", lineHeight: 1.45 }}>
                    Ram matching blocks to double values (2 + 2 ➔ 4).
                  </div>
                </div>

                {/* 03: CAUTION */}
                <div
                  style={{
                    background: "rgba(255, 255, 255, 0.04)",
                    border: "1px solid rgba(255, 255, 255, 0.10)",
                    borderRadius: "14px",
                    padding: "0.95rem 0.9rem",
                  }}
                >
                  <div style={{ fontSize: "0.66rem", fontWeight: 750, color: "#ef4444", letterSpacing: "0.12em" }}>
                    [ 03 // CAUTION ]
                  </div>
                  <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#ffffff", marginTop: "0.35rem" }}>
                    Stack Overload
                  </div>
                  <div style={{ fontSize: "0.68rem", color: "rgba(255, 255, 255, 0.65)", marginTop: "0.35rem", lineHeight: 1.45 }}>
                    Holding 4+ unmatched blocks causes heavy steering drag.
                  </div>
                </div>
              </div>

              {/* Progress Bar & Deployment */}
              <div style={{ marginBottom: "1.2rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.65rem", color: "rgba(255, 255, 255, 0.55)", marginBottom: "0.45rem", letterSpacing: "0.10em" }}>
                  <span>SYSTEM STATUS: {isLoaded ? "HARDWARE READY" : "CALIBRATING CORE"}</span>
                  <span style={{ color: isLoaded ? "#38bdf8" : "#ffffff", fontWeight: 750 }}>
                    {isLoaded ? "100% READY" : \`\${loadProgress}%\`}
                  </span>
                </div>
                <div style={{ width: "100%", height: "4px", background: "rgba(255, 255, 255, 0.10)", borderRadius: "9999px", overflow: "hidden" }}>
                  <div
                    style={{
                      height: "100%",
                      width: \`\${loadProgress}%\`,
                      background: "linear-gradient(90deg, #0284c7 0%, #38bdf8 100%)",
                      borderRadius: "9999px",
                      boxShadow: "0 0 12px rgba(56, 189, 248, 0.8)",
                      transition: "width 0.25s ease",
                    }}
                  />
                </div>
              </div>

              {/* High-End Tactile Action Button */}
              <button
                onClick={() => {
                  handleUserGesture();
                  setHasDeployed(true);
                }}
                disabled={!isLoaded && loadProgress < 90}
                style={{
                  width: "100%",
                  padding: "0.85rem",
                  borderRadius: "14px",
                  background: isLoaded || loadProgress >= 90
                    ? "linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)"
                    : "rgba(255, 255, 255, 0.08)",
                  border: "none",
                  color: isLoaded || loadProgress >= 90 ? "#000000" : "rgba(255, 255, 255, 0.4)",
                  fontSize: "0.82rem",
                  fontWeight: 800,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  cursor: isLoaded || loadProgress >= 90 ? "pointer" : "default",
                  boxShadow: isLoaded || loadProgress >= 90 ? "0 8px 24px rgba(56, 189, 248, 0.45)" : "none",
                  transition: "all 0.2s ease",
                  fontFamily: "var(--font-mono, monospace)",
                }}
              >
                {isLoaded || loadProgress >= 90 ? "DEPLOY TUMBLER  ➔" : "CALIBRATING..."}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>`;

pageCode = pageCode.replace(
  '      {/* 4-CORNER SPATIAL HUD */}',
  `${briefingModal}\n\n      {/* 4-CORNER SPATIAL HUD */}`
);

fs.writeFileSync('src/app/page.tsx', pageCode, 'utf8');
console.log('src/app/page.tsx updated with Rockstar Gotham 2048 briefing modal');
