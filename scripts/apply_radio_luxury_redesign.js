const fs = require('fs');

let content = fs.readFileSync('src/app/radio/page.tsx', 'utf8');

// 1. Remove the SoundVisualizer container from between album art and track info
const oldVisualizer = `              {/* Live Audio Visualizer */}
              <div style={{ width: "100%", position: "relative", zIndex: 1 }}>
                <SoundVisualizer color={currentChannel?.themeColor || "#38bdf8"} />
              </div>`;

content = content.replace(oldVisualizer, '');

// 2. Replace Transport Row with Clean 5-Button Samsung Music Row
const oldTransportSection = `              {/* Transport Controls Row */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "clamp(0.35rem, 2vw, 0.95rem)",
                  position: "relative",
                  zIndex: 1,
                }}
              >
                {/* Shuffle */}
                <button
                  onClick={toggleShuffle}
                  title={isShuffle ? "Shuffle is ON" : "Shuffle is OFF"}
                  style={{
                    background: isShuffle ? "rgba(56, 189, 248, 0.2)" : "none",
                    border: isShuffle ? "1px solid #38bdf8" : "1px solid transparent",
                    borderRadius: "8px",
                    padding: "0.2rem 0.4rem",
                    color: isShuffle ? "#38bdf8" : "rgba(255, 255, 255, 0.4)",
                    fontSize: "1.05rem",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  🔀
                </button>

                {/* Rewind 10s */}
                <button
                  onClick={handleRewind}
                  disabled={isLive}
                  title="Rewind 10s"
                  style={{
                    background: "none",
                    border: "none",
                    color: isLive ? "rgba(255, 255, 255, 0.2)" : "rgba(255, 255, 255, 0.75)",
                    fontSize: "1.05rem",
                    cursor: isLive ? "default" : "pointer",
                  }}
                >
                  ↺ 10s
                </button>

                {/* Previous */}
                <button
                  onClick={prevTrack}
                  title="Previous Song"
                  style={{
                    background: "none",
                    border: "none",
                    color: "#ffffff",
                    fontSize: "1.35rem",
                    cursor: "pointer",
                  }}
                >
                  ⏮
                </button>

                {/* Big Play / Pause */}
                <motion.button
                  onClick={togglePlay}
                  whileTap={{ scale: 0.90 }}
                  style={{
                    width: "54px",
                    height: "54px",
                    borderRadius: "50%",
                    backgroundColor: "#ffffff",
                    border: "none",
                    color: "#000000",
                    fontSize: "1.35rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    boxShadow: "0 8px 24px rgba(255, 255, 255, 0.35)",
                  }}
                >
                  {isPlaying ? "❚❚" : "▶"}
                </motion.button>

                {/* Next */}
                <button
                  onClick={nextTrack}
                  title="Next Song"
                  style={{
                    background: "none",
                    border: "none",
                    color: "#ffffff",
                    fontSize: "1.35rem",
                    cursor: "pointer",
                  }}
                >
                  ⏭
                </button>

                {/* Fast Forward 10s */}
                <button
                  onClick={handleFastForward}
                  disabled={isLive}
                  title="Fast Forward 10s"
                  style={{
                    background: "none",
                    border: "none",
                    color: isLive ? "rgba(255, 255, 255, 0.2)" : "rgba(255, 255, 255, 0.75)",
                    fontSize: "1.05rem",
                    cursor: isLive ? "default" : "pointer",
                  }}
                >
                  10s ↻
                </button>

                {/* 432Hz Mode */}
                <button
                  onClick={toggle432Hz}
                  title="432Hz Audiophile Tuning"
                  style={{
                    background: is432Hz ? "rgba(48, 209, 88, 0.2)" : "none",
                    border: is432Hz ? "1px solid #30d158" : "1px solid rgba(255, 255, 255, 0.15)",
                    borderRadius: "8px",
                    padding: "0.2rem 0.4rem",
                    color: is432Hz ? "#30d158" : "rgba(255, 255, 255, 0.4)",
                    fontSize: "0.68rem",
                    fontFamily: "var(--font-mono, monospace)",
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  432Hz
                </button>
              </div>`;

const newTransportSection = `              {/* Clean 5-Button Samsung Music Transport Row */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0 clamp(0.3rem, 2.5vw, 1.2rem)",
                  position: "relative",
                  zIndex: 1,
                  width: "100%",
                  boxSizing: "border-box",
                }}
              >
                {/* 1. Shuffle */}
                <button
                  onClick={toggleShuffle}
                  title={isShuffle ? "Shuffle is ON" : "Shuffle is OFF"}
                  style={{
                    background: isShuffle ? "rgba(56, 189, 248, 0.25)" : "rgba(255, 255, 255, 0.06)",
                    border: isShuffle ? "1px solid #38bdf8" : "1px solid rgba(255, 255, 255, 0.12)",
                    borderRadius: "50%",
                    width: "40px",
                    height: "40px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: isShuffle ? "#38bdf8" : "rgba(255, 255, 255, 0.6)",
                    fontSize: "1.05rem",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  🔀
                </button>

                {/* 2. Previous */}
                <button
                  onClick={prevTrack}
                  title="Previous Song"
                  style={{
                    background: "none",
                    border: "none",
                    color: "#ffffff",
                    fontSize: "1.45rem",
                    cursor: "pointer",
                    padding: "6px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  ⏮
                </button>

                {/* 3. Big Hero Play / Pause */}
                <motion.button
                  onClick={togglePlay}
                  whileTap={{ scale: 0.92 }}
                  style={{
                    width: "58px",
                    height: "58px",
                    borderRadius: "50%",
                    backgroundColor: "#ffffff",
                    border: "none",
                    color: "#000000",
                    fontSize: "1.45rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    boxShadow: "0 0 28px rgba(255, 255, 255, 0.45), 0 6px 20px rgba(0, 0, 0, 0.4)",
                  }}
                >
                  {isPlaying ? "❚❚" : "▶"}
                </motion.button>

                {/* 4. Next */}
                <button
                  onClick={nextTrack}
                  title="Next Song"
                  style={{
                    background: "none",
                    border: "none",
                    color: "#ffffff",
                    fontSize: "1.45rem",
                    cursor: "pointer",
                    padding: "6px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  ⏭
                </button>

                {/* 5. 432Hz Mode */}
                <button
                  onClick={toggle432Hz}
                  title="432Hz Audiophile Tuning"
                  style={{
                    background: is432Hz ? "rgba(56, 189, 248, 0.25)" : "rgba(255, 255, 255, 0.06)",
                    border: is432Hz ? "1px solid #38bdf8" : "1px solid rgba(255, 255, 255, 0.12)",
                    borderRadius: "50%",
                    width: "40px",
                    height: "40px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: is432Hz ? "#38bdf8" : "rgba(255, 255, 255, 0.6)",
                    fontSize: "0.68rem",
                    fontFamily: "var(--font-mono, monospace)",
                    fontWeight: 800,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  432
                </button>
              </div>`;

content = content.replace(oldTransportSection, newTransportSection);

// 3. Upgrade Album Art Size & Glass Styling
content = content.replace(
  /width: "clamp\(120px, 22vh, 175px\)", height: "clamp\(120px, 22vh, 175px\)",/g,
  'width: "clamp(140px, 28vh, 210px)", height: "clamp(140px, 28vh, 210px)",'
);

// 4. Upgrade Header Branding
content = content.replace(
  '<span>SOUNDROOM // COMMUTE VAULT</span>',
  '<span style={{ fontWeight: 700, color: "#38bdf8" }}>COMMUTE VAULT</span>'
);

// 5. Update Card Dimensions
content = content.replace(
  /maxWidth: "430px", height: "min\(84dvh, 640px\)", minHeight: "480px",/g,
  'maxWidth: "415px", height: "min(92dvh, 660px)", minHeight: "460px",'
);

fs.writeFileSync('src/app/radio/page.tsx', content, 'utf8');
console.log('src/app/radio/page.tsx successfully redesigned with Samsung Music Luxury Layout!');
