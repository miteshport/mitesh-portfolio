const fs = require('fs');

let pageCode = fs.readFileSync('src/app/page.tsx', 'utf8');

// Replace the entire briefing modal with the Yuta Abe 5-Light Launch Gantry
const yutaAbeGantry = `      {/* --- 🦇 WAYNETECH 5-LIGHT TACTICAL LAUNCH GANTRY (YUTA ABE SPATIAL MINIMALISM) --- */}
      <AnimatePresence>
        {!hasDeployed && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{
              opacity: 0,
              scale: 1.04,
              transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] },
            }}
            onClick={() => {
              handleUserGesture();
              setHasDeployed(true);
            }}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100dvh",
              zIndex: 1200,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              background: "#000000",
              color: "#ffffff",
              fontFamily: "var(--font-mono, monospace)",
              cursor: "pointer",
              userSelect: "none",
              padding: "clamp(1.5rem, 4vw, 3rem)",
              boxSizing: "border-box",
            }}
          >
            {/* Top Left: Portfolio Identity */}
            <div
              style={{
                position: "absolute",
                top: "clamp(1.5rem, 3vw, 2.5rem)",
                left: "clamp(1.5rem, 3vw, 2.5rem)",
                fontSize: "clamp(0.68rem, 1.1vw, 0.78rem)",
                letterSpacing: "0.24em",
                textTransform: "uppercase",
                color: "#ffffff",
                opacity: 0.85,
              }}
            >
              PORTFOLIO <span style={{ color: "#38bdf8", opacity: 0.9 }}>/ MITESH SHAH</span>
            </div>

            {/* Top Right: Track / Mode */}
            <div
              style={{
                position: "absolute",
                top: "clamp(1.5rem, 3vw, 2.5rem)",
                right: "clamp(1.5rem, 3vw, 2.5rem)",
                fontSize: "clamp(0.68rem, 1.1vw, 0.78rem)",
                letterSpacing: "0.24em",
                textTransform: "uppercase",
                color: "rgba(255, 255, 255, 0.65)",
              }}
            >
              GOTHAM HIGHWAY <span style={{ color: "#38bdf8" }}>· 2048</span>
            </div>

            {/* CENTER: 5 GIANT GLOWING RED LAUNCH LIGHTS (● ● ● ● ●) */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "clamp(1.2rem, 3.5vw, 3.2rem)",
                margin: "auto 0",
              }}
            >
              {[1, 2, 3, 4, 5].map((lightNum) => {
                const isLit = loadProgress >= lightNum * 18 || isLoaded;
                return (
                  <div
                    key={lightNum}
                    style={{
                      width: "clamp(54px, 11vw, 110px)",
                      height: "clamp(54px, 11vw, 110px)",
                      borderRadius: "50%",
                      background: isLit
                        ? "radial-gradient(circle at 35% 35%, #ff6b6b 0%, #ef4444 50%, #b91c1c 100%)"
                        : "radial-gradient(circle at 50% 50%, #1c1917 0%, #0c0a09 100%)",
                      border: isLit
                        ? "2px solid rgba(255, 120, 120, 0.85)"
                        : "2px solid rgba(255, 255, 255, 0.08)",
                      boxShadow: isLit
                        ? "0 0 45px rgba(239, 68, 68, 0.95), 0 0 90px rgba(239, 68, 68, 0.55), inset 0 0 15px rgba(255, 255, 255, 0.6)"
                        : "inset 0 2px 8px rgba(0, 0, 0, 0.8)",
                      transition: "all 0.28s cubic-bezier(0.16, 1, 0.3, 1)",
                      position: "relative",
                    }}
                  >
                    {/* Inner filament glint */}
                    {isLit && (
                      <div
                        style={{
                          position: "absolute",
                          top: "18%",
                          left: "22%",
                          width: "28%",
                          height: "28%",
                          borderRadius: "50%",
                          background: "rgba(255, 255, 255, 0.65)",
                          filter: "blur(2px)",
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Bottom Left: Gotham Live Telemetry */}
            <div
              style={{
                position: "absolute",
                bottom: "clamp(1.5rem, 3vw, 2.5rem)",
                left: "clamp(1.5rem, 3vw, 2.5rem)",
                fontSize: "clamp(0.65rem, 1.0vw, 0.72rem)",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "rgba(255, 255, 255, 0.55)",
                lineHeight: 1.6,
              }}
            >
              <div>9:15 PM GOTHAM</div>
              <div style={{ color: "rgba(255, 255, 255, 0.35)" }}>CLEAR · 0% RAIN</div>
            </div>

            {/* Bottom Center: Interactive Lights Out Launch Prompt */}
            <div
              style={{
                position: "absolute",
                bottom: "clamp(1.8rem, 4vw, 3.2rem)",
                left: 0,
                right: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                pointerEvents: "none",
              }}
            >
              <motion.div
                animate={{
                  opacity: [0.75, 1, 0.75],
                  y: [0, -2, 0],
                }}
                transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
                style={{
                  fontSize: "clamp(0.78rem, 1.3vw, 0.95rem)",
                  fontWeight: 800,
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  color: isLoaded || loadProgress >= 90 ? "#38bdf8" : "#ffffff",
                  textShadow: isLoaded || loadProgress >= 90 ? "0 0 20px rgba(56, 189, 248, 0.8)" : "none",
                }}
              >
                {isLoaded || loadProgress >= 90
                  ? "LIGHTS OUT, CLICK OR PRESS SPACE TO LAUNCH!"
                  : \`CALIBRATING TUMBLER TURBINES: \${loadProgress}%\`}
              </motion.div>

              <div
                style={{
                  fontSize: "0.62rem",
                  letterSpacing: "0.15em",
                  color: "rgba(255, 255, 255, 0.4)",
                  textTransform: "uppercase",
                  marginTop: "0.45rem",
                }}
              >
                STEER: MOUSE / TOUCH · MERGE: MATCH NUMBERS · GOAL: 2048 BOOST
              </div>
            </div>

            {/* Bottom Right: Engine Spec */}
            <div
              style={{
                position: "absolute",
                bottom: "clamp(1.5rem, 3vw, 2.5rem)",
                right: "clamp(1.5rem, 3vw, 2.5rem)",
                fontSize: "clamp(0.65rem, 1.0vw, 0.72rem)",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "rgba(255, 255, 255, 0.55)",
                textAlign: "right",
                lineHeight: 1.6,
              }}
            >
              <div>AFTERBURNER V8</div>
              <div style={{ color: "#38bdf8" }}>365 KM/H PURSUIT</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>`;

// Replace existing briefing modal
pageCode = pageCode.replace(
  /\{\/\* --- 🦇 ROCKSTAR-TIER GOTHAM 2048 BRIEFING MODAL --- \*\/\}[\s\S]*?<\/AnimatePresence>/,
  yutaAbeGantry
);

fs.writeFileSync('src/app/page.tsx', pageCode, 'utf8');
console.log('src/app/page.tsx updated with Yuta Abe 5-Light Launch Gantry');
