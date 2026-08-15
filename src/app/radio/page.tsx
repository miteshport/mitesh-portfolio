"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import CustomCursor from "@/components/CustomCursor";
import GalaxyStarfield from "@/components/GalaxyStarfield";
import AppleLiquidDock from "@/components/AppleLiquidDock";
import { useSoundroom } from "@/context/SoundroomContext";
import { audio as uiAudio } from "@/utils/audioSystem";
import { SoundTrack, SoundChannel } from "@/data/soundroomTracks";

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
      const numBars = 32;
      const width = canvas.width;
      const height = canvas.height;
      const barWidth = (width / numBars) * 0.65;
      const gap = (width - barWidth * numBars) / (numBars - 1);

      for (let i = 0; i < numBars; i++) {
        const value = isPlaying
          ? data[i * 2] || Math.sin(Date.now() * 0.005 + i * 0.3) * 30 + 40
          : 4;
        const barHeight = Math.max(3, (value / 255) * (height - 6));
        const x = i * (barWidth + gap);
        const y = (height - barHeight) / 2;

        const grad = ctx.createLinearGradient(0, y, 0, y + barHeight);
        grad.addColorStop(0, "rgba(255, 255, 255, 0.95)");
        grad.addColorStop(
          0.5,
          currentChannel.themeColor || "rgba(56, 189, 248, 0.8)"
        );
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
      width={280}
      height={36}
      style={{
        width: "100%",
        maxWidth: "280px",
        height: "36px",
        display: "block",
        margin: "0 auto",
      }}
    />
  );
}

export default function SoundroomPage() {
  const [timeStr, setTimeStr] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"player" | "vault">("player");
  const [isShuffle, setIsShuffle] = useState(false);

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

  // Live Digital Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hrs = String(now.getHours()).padStart(2, "0");
      const mins = String(now.getMinutes()).padStart(2, "0");
      const secs = String(now.getSeconds()).padStart(2, "0");
      setTimeStr(`${hrs}:${mins}:${secs}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Filtered tracks for search in Vault view
  const allTracks = useMemo(() => {
    return channels.flatMap((c) => c.tracks);
  }, [channels]);

  const filteredTracks = useMemo(() => {
    if (!searchQuery.trim()) return currentChannel.tracks;
    const q = searchQuery.toLowerCase();
    return allTracks.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.artist.toLowerCase().includes(q) ||
        t.album.toLowerCase().includes(q)
    );
  }, [searchQuery, currentChannel, allTracks]);

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <main
      style={{
        minHeight: "100dvh",
        backgroundColor: "#020204",
        color: "#ffffff",
        position: "relative",
        overflowX: "hidden",
        paddingBottom: "8rem",
      }}
    >
      <CustomCursor />
      {/* Exact Three.js WebGL GPU Starfield */}
      <GalaxyStarfield />

      <style
        dangerouslySetInnerHTML={{
          __html: `
        /* TOP BAR — ZERO COLLISION GRID */
        .soundroom-nav {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: clamp(0.9rem, 2vh, 1.4rem) clamp(1rem, 3.5vw, 2.5rem);
          z-index: 1000;
          pointer-events: none;
        }

        .bar-left, .bar-right {
          pointer-events: auto;
          display: flex;
          align-items: center;
        }

        /* Interactive Audio Toggle */
        .audio-toggle-btn {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(16px);
          border-radius: 100px;
          display: flex;
          align-items: center;
          gap: 0.45rem;
          cursor: pointer;
          padding: 0.35rem 0.75rem;
          outline: none;
          transition: all 0.2s ease;
        }
        .audio-toggle-btn:hover {
          background: rgba(255, 255, 255, 0.08);
        }
        .audio-toggle-label {
          font-family: monospace;
          font-size: clamp(0.58rem, 1.5vw, 0.68rem);
          color: #22c55e;
          font-weight: 600;
          letter-spacing: 0.08em;
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
        }
        .audio-dot.muted {
          background: rgba(255, 255, 255, 0.3);
          box-shadow: none;
        }

        .exit-link {
          font-family: monospace;
          font-size: clamp(0.6rem, 1.6vw, 0.7rem);
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.6);
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(16px);
          padding: 0.35rem 0.85rem;
          border-radius: 100px;
          text-decoration: none;
          transition: all 0.18s ease;
          white-space: nowrap;
        }
        .exit-link:hover {
          color: #ffffff;
          background: rgba(255, 255, 255, 0.1);
        }

        /* MAIN CONTAINER (APPLE MUSIC FULL SCREEN LAYOUT) */
        .soundroom-stage {
          max-width: 680px;
          margin: 0 auto;
          padding-top: clamp(4.5rem, 10vh, 6rem);
          padding-left: clamp(1rem, 3.5vw, 1.5rem);
          padding-right: clamp(1rem, 3.5vw, 1.5rem);
          position: relative;
          z-index: 2;
        }

        /* HORIZONTAL 1-ROW CHANNEL PILL RIBBON */
        .channel-ribbon {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          overflow-x: auto;
          scrollbar-width: none;
          padding-bottom: 0.4rem;
          margin-bottom: clamp(1.2rem, 2.5vh, 2rem);
        }
        .channel-ribbon::-webkit-scrollbar {
          display: none;
        }

        .channel-pill {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 100px;
          padding: 0.42rem 0.95rem;
          color: rgba(255, 255, 255, 0.65);
          font-family: monospace;
          font-size: clamp(0.64rem, 1.6vw, 0.72rem);
          font-weight: 600;
          letter-spacing: 0.06em;
          white-space: nowrap;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 0.4rem;
          flex-shrink: 0;
        }
        .channel-pill.active {
          background: rgba(255, 255, 255, 0.14);
          border-color: rgba(255, 255, 255, 0.35);
          color: #ffffff;
          box-shadow: 0 0 15px rgba(255, 255, 255, 0.1);
        }

        /* VIEW TOGGLE PILLS */
        .view-switch {
          display: flex;
          justify-content: center;
          gap: 0.5rem;
          margin-bottom: 1.2rem;
        }
        .view-switch-btn {
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.45);
          font-family: monospace;
          font-size: 0.68rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 0.3rem 0.8rem;
          cursor: pointer;
          border-bottom: 2px solid transparent;
          transition: all 0.2s ease;
        }
        .view-switch-btn.active {
          color: #ffffff;
          border-bottom-color: #38bdf8;
        }

        /* FULL GLASS NOW PLAYING HERO */
        .now-playing-card {
          background: rgba(255, 255, 255, 0.025);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-top: 1px solid rgba(255, 255, 255, 0.18);
          backdrop-filter: blur(40px) saturate(160%);
          border-radius: 28px;
          padding: clamp(1.4rem, 3.5vh, 2.2rem) clamp(1.2rem, 3.5vw, 2rem);
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.7);
          text-align: center;
          position: relative;
        }

        /* Ambient glow backdrop */
        .ambient-glow {
          position: absolute;
          top: 15%;
          left: 50%;
          transform: translateX(-50%);
          width: 260px;
          height: 260px;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.28;
          pointer-events: none;
          transition: background 0.5s ease;
        }

        .artwork-wrapper {
          position: relative;
          width: clamp(180px, 45vw, 240px);
          height: clamp(180px, 45vw, 240px);
          margin: 0 auto clamp(1.2rem, 2.5vh, 1.8rem);
          border-radius: 22px;
          overflow: hidden;
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.75), inset 0 1px 0 rgba(255, 255, 255, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.15);
        }

        .artwork-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transition: transform 0.4s ease;
        }
        .artwork-img.playing {
          transform: scale(1.03);
        }

        .track-title {
          font-family: Georgia, 'Times New Roman', serif;
          font-style: italic;
          font-size: clamp(1.35rem, 4vw, 1.85rem);
          color: #ffffff;
          margin-bottom: 0.35rem;
          letter-spacing: -0.01em;
          line-height: 1.15;
        }
        .track-artist {
          font-family: monospace;
          font-size: clamp(0.72rem, 1.8vw, 0.82rem);
          color: rgba(255, 255, 255, 0.7);
          margin-bottom: 0.25rem;
        }
        .track-album {
          font-family: monospace;
          font-size: clamp(0.62rem, 1.5vw, 0.68rem);
          color: rgba(255, 255, 255, 0.4);
          letter-spacing: 0.05em;
          margin-bottom: 1.2rem;
        }

        /* APPLE MUSIC SCRUBBER */
        .scrubber-container {
          margin-top: 1rem;
          margin-bottom: 1.4rem;
        }
        .scrubber-bar {
          width: 100%;
          height: 5px;
          background: rgba(255, 255, 255, 0.12);
          border-radius: 10px;
          position: relative;
          cursor: pointer;
        }
        .scrubber-fill {
          height: 100%;
          border-radius: 10px;
          background: #ffffff;
          position: relative;
        }
        .scrubber-handle {
          position: absolute;
          right: -5px;
          top: -4px;
          width: 13px;
          height: 13px;
          border-radius: 50%;
          background: #ffffff;
          box-shadow: 0 0 8px rgba(0,0,0,0.6);
        }
        .time-row {
          display: flex;
          justify-content: space-between;
          font-family: monospace;
          font-size: 0.66rem;
          color: rgba(255, 255, 255, 0.45);
          margin-top: 0.45rem;
        }

        /* APPLE MUSIC TRANSPORT BUTTONS */
        .controls-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: clamp(1rem, 3.5vw, 1.8rem);
          margin-bottom: 1.2rem;
        }
        .ctrl-btn {
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.7);
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s ease;
        }
        .ctrl-btn:hover {
          color: #ffffff;
          background: rgba(255, 255, 255, 0.08);
        }
        .play-btn-large {
          width: 58px;
          height: 58px;
          border-radius: 50%;
          background: #ffffff;
          color: #020204;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 8px 25px rgba(255, 255, 255, 0.25);
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .play-btn-large:hover {
          transform: scale(1.05);
          box-shadow: 0 10px 30px rgba(255, 255, 255, 0.4);
        }

        /* 432HZ & AUX PILLS */
        .aux-row {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 0.8rem;
        }
        .tuning-btn {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: rgba(255, 255, 255, 0.6);
          font-family: monospace;
          font-size: 0.64rem;
          letter-spacing: 0.08em;
          padding: 0.35rem 0.85rem;
          border-radius: 100px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .tuning-btn.active {
          background: rgba(234, 179, 8, 0.15);
          border-color: #eab308;
          color: #eab308;
          box-shadow: 0 0 12px rgba(234, 179, 8, 0.25);
        }

        /* 100-TRACK VAULT DRAWER / LIST */
        .vault-container {
          background: rgba(255, 255, 255, 0.025);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-top: 1px solid rgba(255, 255, 255, 0.18);
          backdrop-filter: blur(40px);
          border-radius: 28px;
          padding: 1.5rem;
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.7);
        }
        .search-box {
          width: 100%;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 12px;
          padding: 0.6rem 1rem;
          color: #ffffff;
          font-family: monospace;
          font-size: 0.76rem;
          outline: none;
          margin-bottom: 1rem;
        }
        .search-box::placeholder {
          color: rgba(255, 255, 255, 0.35);
        }
        .track-list {
          max-height: 480px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
          padding-right: 0.3rem;
        }
        .track-list-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.65rem 0.85rem;
          border-radius: 12px;
          cursor: pointer;
          background: transparent;
          border: none;
          width: 100%;
          text-align: left;
          transition: all 0.15s ease;
        }
        .track-list-item:hover {
          background: rgba(255, 255, 255, 0.04);
        }
        .track-list-item.active {
          background: rgba(255, 255, 255, 0.08);
          border-left: 3px solid #38bdf8;
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
              {isMuted ? "AUDIO: MUTED" : "AUDIO: ACTIVE"}{" "}
              {timeStr && `· ${timeStr}`}
            </span>
          </button>
        </div>

        <div className="bar-right">
          <Link
            href="/about"
            className="exit-link"
            onClick={() => uiAudio.playClick()}
          >
            Portfolio
          </Link>
        </div>
      </header>

      {/* MAIN STAGE */}
      <div className="soundroom-stage">
        {/* 1-ROW HORIZONTAL CHANNEL RIBBON */}
        <div className="channel-ribbon">
          {channels.map((ch) => {
            const isSelected = ch.id === currentChannel.id;
            return (
              <button
                key={ch.id}
                className={`channel-pill ${isSelected ? "active" : ""}`}
                onClick={() => selectChannel(ch.id)}
              >
                <span
                  style={{
                    color: isSelected ? ch.themeColor : "rgba(255,255,255,0.4)",
                  }}
                >
                  ✦
                </span>
                <span>{ch.title}</span>
                <span
                  style={{
                    fontSize: "0.58rem",
                    opacity: 0.5,
                    marginLeft: "2px",
                  }}
                >
                  ({ch.tracks.length})
                </span>
              </button>
            );
          })}
        </div>

        {/* VIEW SWITCHER TABS */}
        <div className="view-switch">
          <button
            className={`view-switch-btn ${
              activeTab === "player" ? "active" : ""
            }`}
            onClick={() => setActiveTab("player")}
          >
            Now Playing
          </button>
          <button
            className={`view-switch-btn ${
              activeTab === "vault" ? "active" : ""
            }`}
            onClick={() => setActiveTab("vault")}
          >
            100-Track Vault ({allTracks.length})
          </button>
        </div>

        {/* TAB 1: APPLE MUSIC / SPOTIFY GLASS PLAYER */}
        {activeTab === "player" ? (
          <motion.div
            className="now-playing-card"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div
              className="ambient-glow"
              style={{ background: currentChannel.themeColor }}
            />

            {/* Rounded High-Res Glass Artwork */}
            <div className="artwork-wrapper">
              <img
                src={currentTrack.artwork}
                alt={currentTrack.title}
                className={`artwork-img ${isPlaying ? "playing" : ""}`}
              />
            </div>

            {/* Track Metadata */}
            <div className="track-title">{currentTrack.title}</div>
            <div className="track-artist">{currentTrack.artist}</div>
            <div className="track-album">{currentTrack.album}</div>

            {/* Live Frequency Visualizer */}
            <SoundVisualizer />

            {/* Tactile Scrubber */}
            <div className="scrubber-container">
              <div
                className="scrubber-bar"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const pct = (e.clientX - rect.left) / rect.width;
                  seek(pct * duration);
                }}
              >
                <div
                  className="scrubber-fill"
                  style={{
                    width: `${progressPercent}%`,
                    background: currentChannel.themeColor,
                  }}
                >
                  <div className="scrubber-handle" />
                </div>
              </div>
              <div className="time-row">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Transport Buttons (Apple Music standard) */}
            <div className="controls-row">
              <button
                className="ctrl-btn"
                onClick={() => setIsShuffle((prev) => !prev)}
                title="Shuffle"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={isShuffle ? "#38bdf8" : "currentColor"}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="16 3 21 3 21 8" />
                  <line x1="4" y1="20" x2="21" y2="3" />
                  <polyline points="21 16 21 21 16 21" />
                  <line x1="15" y1="15" x2="21" y2="21" />
                  <line x1="4" y1="4" x2="9" y2="9" />
                </svg>
              </button>

              <button
                className="ctrl-btn"
                onClick={prevTrack}
                aria-label="Previous Track"
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <polygon points="19 20 9 12 19 4 19 20" />
                  <line
                    x1="5"
                    y1="19"
                    x2="5"
                    y2="5"
                    stroke="currentColor"
                    strokeWidth="3"
                  />
                </svg>
              </button>

              <button
                className="play-btn-large"
                onClick={togglePlay}
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? (
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <rect x="6" y="4" width="4" height="16" rx="1" />
                    <rect x="14" y="4" width="4" height="16" rx="1" />
                  </svg>
                ) : (
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    style={{ marginLeft: "3px" }}
                  >
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                )}
              </button>

              <button
                className="ctrl-btn"
                onClick={nextTrack}
                aria-label="Next Track"
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <polygon points="5 4 15 12 5 20 5 4" />
                  <line
                    x1="19"
                    y1="5"
                    x2="19"
                    y2="19"
                    stroke="currentColor"
                    strokeWidth="3"
                  />
                </svg>
              </button>

              <button
                className="ctrl-btn"
                onClick={() => setActiveTab("vault")}
                title="View 100-Track Vault"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="8" y1="6" x2="21" y2="6" />
                  <line x1="8" y1="12" x2="21" y2="12" />
                  <line x1="8" y1="18" x2="21" y2="18" />
                  <line x1="3" y1="6" x2="3.01" y2="6" />
                  <line x1="3" y1="12" x2="3.01" y2="12" />
                  <line x1="3" y1="18" x2="3.01" y2="18" />
                </svg>
              </button>
            </div>

            {/* Harmonic 432Hz Mode */}
            <div className="aux-row">
              <button
                className={`tuning-btn ${is432Hz ? "active" : ""}`}
                onClick={toggle432Hz}
              >
                {is432Hz ? "✦ 432Hz HARMONIC: ON" : "STANDARD 440Hz"}
              </button>
            </div>
          </motion.div>
        ) : (
          /* TAB 2: 100-TRACK MASTER VAULT */
          <motion.div
            className="vault-container"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <input
              type="text"
              className="search-box"
              placeholder="Search 100 songs, maestros, or films..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            <div className="track-list">
              {filteredTracks.map((t, idx) => {
                const isSelected = t.id === currentTrack.id;
                return (
                  <button
                    key={t.id}
                    className={`track-list-item ${
                      isSelected ? "active" : ""
                    }`}
                    onClick={() => playTrack(t)}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.75rem",
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "monospace",
                          fontSize: "0.66rem",
                          color: isSelected
                            ? "#38bdf8"
                            : "rgba(255,255,255,0.3)",
                          width: "18px",
                        }}
                      >
                        {isSelected && isPlaying ? "▶" : `${idx + 1}`}
                      </span>
                      <div>
                        <div
                          style={{
                            fontSize: "0.82rem",
                            fontWeight: isSelected ? 600 : 400,
                            color: isSelected ? "#ffffff" : "rgba(255,255,255,0.85)",
                          }}
                        >
                          {t.title}
                        </div>
                        <div
                          style={{
                            fontSize: "0.66rem",
                            fontFamily: "monospace",
                            color: "rgba(255,255,255,0.45)",
                          }}
                        >
                          {t.artist} · {t.album}
                        </div>
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: "0.66rem",
                        fontFamily: "monospace",
                        color: "rgba(255,255,255,0.4)",
                      }}
                    >
                      {formatTime(t.duration)}
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>

      {/* DOCK */}
      <AppleLiquidDock />
    </main>
  );
}
