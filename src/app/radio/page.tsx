"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import CustomCursor from "@/components/CustomCursor";
import GalaxyStarfield from "@/components/GalaxyStarfield";
import AppleLiquidDock from "@/components/AppleLiquidDock";
import { useSoundroom } from "@/context/SoundroomContext";
import { audio as uiAudio } from "@/utils/audioSystem";

function formatTime(seconds: number) {
  if (isNaN(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

// Live Canvas Audio Visualizer
function SoundVisualizer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { getFrequencyData, isPlaying, currentChannel } = useSoundroom();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const data = getFrequencyData();
      const numBars = 36;
      const width = canvas.width;
      const height = canvas.height;
      const barWidth = (width / numBars) * 0.65;
      const gap = (width - barWidth * numBars) / (numBars - 1);

      for (let i = 0; i < numBars; i++) {
        const value = isPlaying ? (data[i * 2] || (Math.sin(Date.now() * 0.005 + i * 0.3) * 30 + 40)) : 4;
        const barHeight = Math.max(3, (value / 255) * (height - 6));
        const x = i * (barWidth + gap);
        const y = (height - barHeight) / 2;

        const grad = ctx.createLinearGradient(0, y, 0, y + barHeight);
        grad.addColorStop(0, "rgba(255, 255, 255, 0.95)");
        grad.addColorStop(0.5, currentChannel.themeColor || "rgba(56, 189, 248, 0.8)");
        grad.addColorStop(1, "rgba(255, 255, 255, 0.2)");

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 2);
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [getFrequencyData, isPlaying, currentChannel]);

  return (
    <canvas
      ref={canvasRef}
      width={320}
      height={48}
      style={{
        width: "100%",
        maxWidth: "340px",
        height: "48px",
        display: "block",
        margin: "0 auto",
      }}
    />
  );
}

export default function SoundroomPage() {
  const [timeStr, setTimeStr] = useState("");
  const {
    currentTrack,
    currentChannel,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    is432Hz,
    channels,
    togglePlay,
    playTrack,
    nextTrack,
    prevTrack,
    selectChannel,
    seek,
    setVolume,
    toggleMute,
    toggle432Hz,
  } = useSoundroom();

  useEffect(() => {
    window.scrollTo(0, 0);
    const tick = () => {
      const now = new Date();
      setTimeStr(
        `${String(now.getHours()).padStart(2, "0")}:${String(
          now.getMinutes()
        ).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <main
      style={{
        minHeight: "100dvh",
        backgroundColor: "#020204",
        color: "#ffffff",
        position: "relative",
        overflowX: "hidden",
        paddingBottom: "10rem",
      }}
    >
      <CustomCursor />
      {/* Exact Three.js WebGL GPU Starfield */}
      <GalaxyStarfield />

      <style
        dangerouslySetInnerHTML={{
          __html: `
        /* TOP BAR — PURE FLOATING GRID */
        .soundroom-nav {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          padding: clamp(1rem, 2.8vh, 1.6rem) clamp(1.2rem, 3.5vw, 2.8rem);
          z-index: 1000;
          pointer-events: none;
        }

        .bar-left {
          justify-self: start;
          pointer-events: auto;
          display: flex;
          align-items: center;
        }
        .bar-center {
          justify-self: center;
          pointer-events: auto;
        }
        .bar-right {
          justify-self: end;
          pointer-events: auto;
          display: flex;
          align-items: center;
          gap: 0.8rem;
        }

        /* Interactive Audio Toggle */
        .audio-toggle-btn {
          background: transparent;
          border: none;
          display: flex;
          align-items: center;
          gap: 0.45rem;
          cursor: pointer;
          padding: 0;
          outline: none;
          transition: opacity 0.2s ease;
        }
        .audio-toggle-btn:hover {
          opacity: 0.8;
        }
        .audio-toggle-label {
          font-family: monospace;
          font-size: clamp(0.6rem, 1.6vw, 0.7rem);
          color: #22c55e;
          font-weight: 600;
          letter-spacing: 0.1em;
          white-space: nowrap;
          transition: color 0.2s ease;
        }
        .audio-toggle-label.muted {
          color: rgba(255, 255, 255, 0.4);
        }
        .audio-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #22c55e;
          box-shadow: 0 0 6px #22c55e;
          flex-shrink: 0;
          transition: all 0.2s ease;
        }
        .audio-dot.muted {
          background: rgba(255, 255, 255, 0.3);
          box-shadow: none;
        }

        .soundroom-title {
          font-family: Georgia, serif;
          font-style: italic;
          font-size: clamp(0.85rem, 2.2vw, 1.02rem);
          color: rgba(255, 255, 255, 0.88);
          letter-spacing: 0.02em;
          white-space: nowrap;
        }

        .nav-link {
          font-family: monospace;
          font-size: clamp(0.6rem, 1.6vw, 0.7rem);
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.55);
          text-decoration: none;
          transition: color 0.18s ease;
          white-space: nowrap;
        }
        .nav-link:hover {
          color: #ffffff;
        }

        /* SOUNDROOM CONTAINER */
        .soundroom-hero {
          padding-top: clamp(5.2rem, 13vh, 7.5rem);
          padding-bottom: 2rem;
          max-width: 1080px;
          margin: 0 auto;
          padding-left: clamp(1rem, 4vw, 2rem);
          padding-right: clamp(1rem, 4vw, 2rem);
          position: relative;
          z-index: 2;
        }

        /* HARDWARE CONSOLE CHASSIS */
        .hardware-console {
          background: rgba(14, 12, 24, 0.65);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-top: 1px solid rgba(255, 255, 255, 0.22);
          backdrop-filter: blur(40px) saturate(180%);
          -webkit-backdrop-filter: blur(40px) saturate(180%);
          border-radius: 28px;
          padding: clamp(1.2rem, 3.5vw, 2.4rem);
          box-shadow: 0 30px 80px rgba(0, 0, 0, 0.85), inset 0 1px 0 rgba(255, 255, 255, 0.15);
        }

        /* CHANNEL SELECTOR TABS */
        .channel-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 0.75rem;
          margin-bottom: 2rem;
        }

        .channel-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 0.9rem 1rem;
          cursor: pointer;
          transition: all 0.25s ease;
          text-align: left;
          position: relative;
        }
        .channel-card:hover {
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(255, 255, 255, 0.2);
        }
        .channel-card.active {
          background: rgba(255, 255, 255, 0.09);
          border-color: rgba(255, 255, 255, 0.35);
          box-shadow: 0 0 25px rgba(255, 255, 255, 0.06);
        }

        /* PLAYER MAIN STAGE */
        .player-stage {
          display: grid;
          grid-template-columns: minmax(260px, 320px) 1fr;
          gap: clamp(1.5rem, 4vw, 2.5rem);
          align-items: center;
        }

        .album-art-box {
          position: relative;
          aspect-ratio: 1 / 1;
          border-radius: 20px;
          overflow: hidden;
          background: #0a0a0f;
          border: 1px solid rgba(255, 255, 255, 0.12);
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.8);
        }
        .album-art-box img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        /* SCRUBBER */
        .scrub-bar-wrapper {
          position: relative;
          width: 100%;
          height: 6px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          cursor: pointer;
          margin: 1.4rem 0 0.8rem 0;
        }
        .scrub-fill {
          height: 100%;
          border-radius: 6px;
          background: #ffffff;
          box-shadow: 0 0 10px #ffffff;
          position: relative;
        }
        .scrub-thumb {
          position: absolute;
          right: -5px;
          top: -4px;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #ffffff;
          box-shadow: 0 0 12px rgba(255, 255, 255, 0.9);
        }

        /* CONTROLS ROW */
        .controls-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: clamp(1rem, 3vw, 1.8rem);
          margin-top: 1.5rem;
        }

        .tactile-btn {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 50%;
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .tactile-btn:hover {
          background: rgba(255, 255, 255, 0.12);
          transform: scale(1.06);
        }
        .tactile-btn:active {
          transform: scale(0.95);
        }

        .play-master-btn {
          width: 68px;
          height: 68px;
          background: #ffffff;
          color: #000000;
          border-radius: 50%;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 0 25px rgba(255, 255, 255, 0.4);
          transition: all 0.2s ease;
        }
        .play-master-btn:hover {
          transform: scale(1.06);
          box-shadow: 0 0 35px rgba(255, 255, 255, 0.7);
        }

        .tuning-pill {
          font-family: monospace;
          font-size: 0.68rem;
          padding: 0.35rem 0.8rem;
          border-radius: 50px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: rgba(255, 255, 255, 0.6);
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .tuning-pill.active {
          background: rgba(234, 179, 8, 0.15);
          border-color: #eab308;
          color: #eab308;
          box-shadow: 0 0 15px rgba(234, 179, 8, 0.25);
        }

        /* TRACK QUEUE */
        .queue-box {
          margin-top: 2rem;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          padding-top: 1.5rem;
        }

        .queue-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem 1rem;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.15s ease;
          background: transparent;
        }
        .queue-item:hover {
          background: rgba(255, 255, 255, 0.04);
        }
        .queue-item.active {
          background: rgba(255, 255, 255, 0.08);
          border-left: 3px solid #38bdf8;
        }

        @media (max-width: 768px) {
          .player-stage {
            grid-template-columns: 1fr;
            text-align: center;
          }
          .album-art-box {
            max-width: 260px;
            margin: 0 auto;
          }
          .bar-center {
            display: none;
          }
        }
      `,
        }}
      />

      {/* TOP FLOATING NAV */}
      <header className="soundroom-nav">
        <div className="bar-left">
          <button
            className="audio-toggle-btn"
            onClick={toggleMute}
            aria-label="Toggle Master Audio"
          >
            <div className={`audio-dot ${isMuted ? "muted" : ""}`} />
            <span className={`audio-toggle-label ${isMuted ? "muted" : ""}`}>
              {isMuted ? "AUDIO: MUTED" : "AUDIO: ACTIVE"} {timeStr && `· ${timeStr}`}
            </span>
          </button>
        </div>

        <div className="bar-center">
          <span className="soundroom-title">The Soundroom · Frequencies of Mastery</span>
        </div>

        <div className="bar-right">
          <Link href="/about" className="nav-link" onClick={() => uiAudio.playClick()}>
            Portfolio
          </Link>
          <Link href="/" className="nav-link" onClick={() => uiAudio.playClick()}>
            3D Art Engine
          </Link>
        </div>
      </header>

      {/* MAIN HARDWARE CONSOLE */}
      <section className="soundroom-hero">
        <motion.div
          className="hardware-console"
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* 4 Mood Dimensions Selector */}
          <div className="channel-grid">
            {channels.map((ch) => {
              const isSelected = ch.id === currentChannel.id;
              return (
                <button
                  key={ch.id}
                  className={`channel-card ${isSelected ? "active" : ""}`}
                  onClick={() => selectChannel(ch.id)}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem" }}>
                    <span style={{ fontSize: "0.62rem", fontFamily: "monospace", color: isSelected ? ch.themeColor : "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                      Channel {ch.id === "titans" ? "01" : ch.id === "symphony" ? "02" : ch.id === "sessions" ? "03" : "04"}
                    </span>
                    {isSelected && isPlaying && (
                      <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: ch.themeColor, boxShadow: `0 0 8px ${ch.themeColor}` }} />
                    )}
                  </div>
                  <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "#ffffff", marginBottom: "0.15rem" }}>
                    {ch.title}
                  </div>
                  <div style={{ fontSize: "0.66rem", color: "rgba(255,255,255,0.45)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {ch.maestros.join(" · ")}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Player Deck */}
          <div className="player-stage">
            {/* Album Artwork with Holographic Depth */}
            <div className="album-art-box">
              <img src={currentTrack.artwork} alt={currentTrack.title} />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 50%)",
                }}
              />
              <div style={{ position: "absolute", bottom: "1rem", left: "1rem", right: "1rem" }}>
                <span style={{ fontSize: "0.6rem", fontFamily: "monospace", color: currentChannel.themeColor, letterSpacing: "0.12em", textTransform: "uppercase" }}>
                  {currentChannel.title}
                </span>
                <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#ffffff" }}>
                  {currentTrack.title}
                </div>
              </div>
            </div>

            {/* Playback Controls & Waveform */}
            <div>
              <div style={{ marginBottom: "0.4rem" }}>
                <span style={{ fontSize: "0.68rem", fontFamily: "monospace", color: "#38bdf8", letterSpacing: "0.12em", textTransform: "uppercase" }}>
                  NOW TRANSMITTING // {currentChannel.subtitle}
                </span>
              </div>
              <h1 style={{ fontSize: "clamp(1.6rem, 4vw, 2.4rem)", margin: "0 0 0.2rem 0", fontFamily: "Georgia, serif", fontStyle: "italic", lineHeight: 1.1 }}>
                {currentTrack.title}
              </h1>
              <div style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.65)", marginBottom: "1rem", fontFamily: "monospace" }}>
                {currentTrack.artist} — <span style={{ color: "rgba(255,255,255,0.4)" }}>{currentTrack.album}</span>
              </div>

              {/* Dynamic Audio Visualizer */}
              <SoundVisualizer />

              {/* Interactive Scrubber */}
              <div
                className="scrub-bar-wrapper"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const clickX = e.clientX - rect.left;
                  const newTime = (clickX / rect.width) * duration;
                  seek(newTime);
                }}
              >
                <div className="scrub-fill" style={{ width: `${progressPercent}%` }}>
                  <div className="scrub-thumb" />
                </div>
              </div>

              {/* Duration labels */}
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.66rem", fontFamily: "monospace", color: "rgba(255,255,255,0.4)" }}>
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>

              {/* Controls Bar */}
              <div className="controls-row">
                <button className={`tuning-pill ${is432Hz ? "active" : ""}`} onClick={toggle432Hz}>
                  432Hz {is432Hz ? "ON" : "OFF"}
                </button>

                <button className="tactile-btn" onClick={prevTrack} aria-label="Previous Track">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="19 20 9 12 19 4 19 20" />
                    <line x1="5" y1="19" x2="5" y2="5" stroke="currentColor" strokeWidth="2" />
                  </svg>
                </button>

                <button className="play-master-btn" onClick={togglePlay} aria-label={isPlaying ? "Pause" : "Play"}>
                  {isPlaying ? (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <rect x="6" y="4" width="4" height="16" />
                      <rect x="14" y="4" width="4" height="16" />
                    </svg>
                  ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: "3px" }}>
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                  )}
                </button>

                <button className="tactile-btn" onClick={nextTrack} aria-label="Next Track">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5 4 15 12 5 20 5 4" />
                    <line x1="19" y1="5" x2="19" y2="19" stroke="currentColor" strokeWidth="2" />
                  </svg>
                </button>

                <button className="tactile-btn" onClick={toggleMute} aria-label="Toggle Mute">
                  {isMuted || volume === 0 ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="1" y1="1" x2="23" y2="23" />
                      <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" />
                      <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Current Channel Queue List */}
          <div className="queue-box">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.8rem" }}>
              <span style={{ fontSize: "0.68rem", fontFamily: "monospace", color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                Channel Transmission Queue ({currentChannel.tracks.length} Master Recordings)
              </span>
              <span style={{ fontSize: "0.62rem", fontFamily: "monospace", color: "#22c55e" }}>
                ● 100% AD-FREE & LOSSLESS
              </span>
            </div>

            <div style={{ display: "grid", gap: "0.35rem" }}>
              {currentChannel.tracks.map((track, idx) => {
                const isActive = track.id === currentTrack.id;
                return (
                  <div
                    key={track.id}
                    className={`queue-item ${isActive ? "active" : ""}`}
                    onClick={() => playTrack(track)}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
                      <span style={{ fontSize: "0.72rem", fontFamily: "monospace", color: isActive ? "#38bdf8" : "rgba(255,255,255,0.35)", width: "18px" }}>
                        {idx + 1 < 10 ? `0${idx + 1}` : idx + 1}
                      </span>
                      <div>
                        <div style={{ fontSize: "0.85rem", fontWeight: isActive ? 700 : 500, color: isActive ? "#ffffff" : "rgba(255,255,255,0.85)" }}>
                          {track.title}
                        </div>
                        <div style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.45)" }}>
                          {track.artist}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
                      {isActive && isPlaying && (
                        <span style={{ fontSize: "0.62rem", fontFamily: "monospace", color: "#38bdf8", background: "rgba(56, 189, 248, 0.15)", padding: "0.15rem 0.5rem", borderRadius: "4px" }}>
                          PLAYING
                        </span>
                      )}
                      <span style={{ fontSize: "0.7rem", fontFamily: "monospace", color: "rgba(255,255,255,0.4)" }}>
                        {formatTime(track.duration)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </section>

      {/* Unified Apple Liquid Glass Dock */}
      <AppleLiquidDock />
    </main>
  );
}
