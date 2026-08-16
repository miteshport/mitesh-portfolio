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
      const numBars = 30;
      const width = canvas.width;
      const height = canvas.height;
      const barWidth = (width / numBars) * 0.65;
      const gap = (width - barWidth * numBars) / (numBars - 1);

      for (let i = 0; i < numBars; i++) {
        const value = isPlaying
          ? data[i * 2] || Math.sin(Date.now() * 0.005 + i * 0.3) * 25 + 35
          : 3;
        const barHeight = Math.max(2, (value / 255) * (height - 4));
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
      width={240}
      height={22}
      style={{
        width: "100%",
        maxWidth: "240px",
        height: "22px",
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
  const [vaultCategory, setVaultCategory] = useState<string>("all");
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

  // Concatenate all 112 tracks
  const allTracks = useMemo(() => {
    return channels.flatMap((c) => c.tracks);
  }, [channels]);

  // Filtered tracks for Vault view (All 112 + Search + Category Pills)
  const filteredVaultTracks = useMemo(() => {
    let list =
      vaultCategory === "all"
        ? allTracks
        : allTracks.filter((t) => t.channel === vaultCategory);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.artist.toLowerCase().includes(q) ||
          t.album.toLowerCase().includes(q)
      );
    }
    return list;
  }, [searchQuery, vaultCategory, allTracks]);

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Master Apple Liquid Glass 10/10 Style Constants
  const appleGlass10CardStyle: React.CSSProperties = {
    borderRadius: "30px",
    background:
      "linear-gradient(135deg, rgba(255, 255, 255, 0.24) 0%, rgba(255, 255, 255, 0.05) 45%, rgba(255, 255, 255, 0.12) 100%)",
    backdropFilter: "blur(44px) saturate(230%) brightness(115%) contrast(105%)",
    WebkitBackdropFilter:
      "blur(44px) saturate(230%) brightness(115%) contrast(105%)",
    border: "1px solid rgba(255, 255, 255, 0.24)",
    borderTop: "1px solid rgba(255, 255, 255, 0.50)",
    boxShadow:
      "inset 0 1.5px 2px 0 rgba(255, 255, 255, 0.50), inset 0 -1.5px 2px 0 rgba(255, 255, 255, 0.12), inset 1.5px 0 2px 0 rgba(255, 255, 255, 0.20), inset -1.5px 0 2px 0 rgba(255, 255, 255, 0.20), 0 36px 72px -16px rgba(0, 0, 0, 0.75)",
    position: "relative",
    overflow: "hidden",
  };

  return (
    <main
      style={{
        height: "100dvh",
        maxHeight: "100dvh",
        width: "100vw",
        backgroundColor: "#06040c",
        color: "#ffffff",
        position: "relative",
        overflow: "hidden",
        fontFamily: "var(--font-apple)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0.8rem 1rem",
        boxSizing: "border-box",
      }}
    >
      <CustomCursor />
      {/* Exact Three.js WebGL GPU Cosmic Galaxy Background (Preserved 100%) */}
      <GalaxyStarfield />

      {/* 1. TOP FLOATING APPLE DYNAMIC ISLAND HUD */}
      <header
        style={{
          width: "100%",
          maxWidth: "1200px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          zIndex: 50,
          flexShrink: 0,
          padding: "0.2rem 0.5rem",
        }}
      >
        <button
          onClick={toggleMute}
          className="apple-glass-pill"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.55rem",
            padding: "0.4rem 0.95rem",
            color: "#ffffff",
            fontSize: "0.72rem",
            fontWeight: 500,
            letterSpacing: "0.03em",
            cursor: "pointer",
            border: "none",
          }}
        >
          <span
            style={{
              width: "7px",
              height: "7px",
              borderRadius: "50%",
              backgroundColor: isMuted ? "rgba(255,255,255,0.3)" : "#30d158",
              boxShadow: isMuted ? "none" : "0 0 10px #30d158",
              display: "inline-block",
            }}
          />
          <span>
            {isMuted ? "AUDIO: MUTED" : `AUDIO: ACTIVE · ${timeStr || "LIVE"}`}
          </span>
        </button>

        <Link
          href="/"
          className="apple-glass-pill"
          style={{
            padding: "0.4rem 0.95rem",
            fontSize: "0.72rem",
            fontWeight: 600,
            letterSpacing: "0.04em",
            color: "#ffffff",
          }}
        >
          PORTFOLIO
        </Link>
      </header>

      {/* 2. CENTER STAGE (100% VIEWPORT FIT — ZERO COLLISION) */}
      <div
        style={{
          flex: 1,
          width: "100%",
          maxWidth: "520px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          zIndex: 10,
          minHeight: 0,
          padding: "0.2rem 0",
        }}
      >
        {/* TOP CHANNEL SELECTOR PILLS */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
            overflowX: "auto",
            maxWidth: "100%",
            padding: "0.2rem 0.1rem",
            marginBottom: "0.55rem",
            scrollbarWidth: "none",
            WebkitOverflowScrolling: "touch",
            flexShrink: 0,
          }}
        >
          {channels.map((ch) => {
            const isSelected = ch.id === currentChannel.id;
            return (
              <button
                key={ch.id}
                onClick={() => selectChannel(ch.id)}
                style={{
                  flexShrink: 0,
                  padding: "0.38rem 0.8rem",
                  borderRadius: "9999px",
                  fontSize: "0.72rem",
                  fontWeight: 550,
                  color: isSelected ? "#ffffff" : "rgba(255, 255, 255, 0.72)",
                  background: isSelected
                    ? "linear-gradient(135deg, rgba(255, 255, 255, 0.35) 0%, rgba(255, 255, 255, 0.16) 100%)"
                    : "linear-gradient(135deg, rgba(255, 255, 255, 0.14) 0%, rgba(255, 255, 255, 0.04) 100%)",
                  backdropFilter: "blur(24px) saturate(200%)",
                  WebkitBackdropFilter: "blur(24px) saturate(200%)",
                  border: isSelected
                    ? "1px solid rgba(255, 255, 255, 0.45)"
                    : "1px solid rgba(255, 255, 255, 0.18)",
                  borderTop: isSelected
                    ? "1px solid rgba(255, 255, 255, 0.65)"
                    : "1px solid rgba(255, 255, 255, 0.35)",
                  boxShadow: isSelected
                    ? "inset 0 1px 1.5px rgba(255, 255, 255, 0.6), 0 4px 12px rgba(0, 0, 0, 0.35)"
                    : "inset 0 1px 1px rgba(255, 255, 255, 0.35)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  transition: "all 0.18s ease",
                }}
              >
                <span
                  style={{
                    color: isSelected ? ch.themeColor : "rgba(255,255,255,0.4)",
                  }}
                >
                  ✦
                </span>
                <span>{ch.title}</span>
                <span style={{ fontSize: "0.6rem", opacity: 0.55 }}>
                  ({ch.tracks.length})
                </span>
              </button>
            );
          })}
        </div>

        {/* VIEW SWITCHER TABS */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "0.22rem",
            borderRadius: "9999px",
            background:
              "linear-gradient(135deg, rgba(255, 255, 255, 0.16) 0%, rgba(255, 255, 255, 0.06) 100%)",
            backdropFilter: "blur(28px) saturate(210%)",
            WebkitBackdropFilter: "blur(28px) saturate(210%)",
            border: "1px solid rgba(255, 255, 255, 0.22)",
            borderTop: "1px solid rgba(255, 255, 255, 0.45)",
            boxShadow:
              "inset 0 1px 1.5px rgba(255, 255, 255, 0.45), 0 6px 18px rgba(0, 0, 0, 0.35)",
            marginBottom: "0.7rem",
            gap: "0.2rem",
            flexShrink: 0,
          }}
        >
          <button
            onClick={() => setActiveTab("player")}
            style={{
              padding: "0.36rem 1.1rem",
              borderRadius: "9999px",
              fontSize: "0.75rem",
              fontWeight: 600,
              color: activeTab === "player" ? "#ffffff" : "rgba(255, 255, 255, 0.65)",
              background:
                activeTab === "player" ? "rgba(255, 255, 255, 0.25)" : "transparent",
              border:
                activeTab === "player"
                  ? "1px solid rgba(255, 255, 255, 0.35)"
                  : "none",
              borderTop:
                activeTab === "player"
                  ? "1px solid rgba(255, 255, 255, 0.60)"
                  : "none",
              boxShadow:
                activeTab === "player"
                  ? "inset 0 1px 1px rgba(255, 255, 255, 0.55), 0 4px 12px rgba(0, 0, 0, 0.3)"
                  : "none",
              cursor: "pointer",
              transition: "all 0.18s ease",
            }}
          >
            Now Playing
          </button>
          <button
            onClick={() => setActiveTab("vault")}
            style={{
              padding: "0.36rem 1.1rem",
              borderRadius: "9999px",
              fontSize: "0.75rem",
              fontWeight: 600,
              color: activeTab === "vault" ? "#ffffff" : "rgba(255, 255, 255, 0.65)",
              background:
                activeTab === "vault" ? "rgba(255, 255, 255, 0.25)" : "transparent",
              border:
                activeTab === "vault"
                  ? "1px solid rgba(255, 255, 255, 0.35)"
                  : "none",
              borderTop:
                activeTab === "vault"
                  ? "1px solid rgba(255, 255, 255, 0.60)"
                  : "none",
              boxShadow:
                activeTab === "vault"
                  ? "inset 0 1px 1px rgba(255, 255, 255, 0.55), 0 4px 12px rgba(0, 0, 0, 0.3)"
                  : "none",
              cursor: "pointer",
              transition: "all 0.18s ease",
            }}
          >
            Master Vault (112)
          </button>
        </div>

        {/* TAB 1: APPLE iOS 18 CONTROL CENTER MUSIC PLAYER */}
        {activeTab === "player" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            style={{
              ...appleGlass10CardStyle,
              width: "100%",
              maxWidth: "420px",
              padding: "1.25rem 1.4rem",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              flexShrink: 0,
            }}
          >
            {/* Dynamic Saturated Ambient Bloom */}
            <div
              style={{
                position: "absolute",
                top: "-30%",
                left: "50%",
                transform: "translateX(-50%)",
                width: "240px",
                height: "240px",
                borderRadius: "50%",
                filter: "blur(70px)",
                opacity: 0.48,
                pointerEvents: "none",
                zIndex: 0,
                backgroundColor: currentChannel.themeColor || "#38bdf8",
                transition: "background-color 0.8s ease",
              }}
            />

            {/* Album Artwork (Responsive 155px) */}
            <div
              style={{
                position: "relative",
                zIndex: 1,
                width: "min(20vh, 155px)",
                height: "min(20vh, 155px)",
                borderRadius: "20px",
                overflow: "hidden",
                boxShadow:
                  "0 16px 32px -8px rgba(0, 0, 0, 0.7), inset 0 1px 1px rgba(255, 255, 255, 0.3)",
                border: "1px solid rgba(255, 255, 255, 0.22)",
                borderTop: "1px solid rgba(255, 255, 255, 0.45)",
                marginBottom: "0.85rem",
                flexShrink: 0,
              }}
            >
              <img
                src={currentTrack.artwork}
                alt={currentTrack.title}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
              />
            </div>

            {/* Track Info */}
            <div
              style={{
                position: "relative",
                zIndex: 1,
                textAlign: "center",
                width: "100%",
                marginBottom: "0.6rem",
              }}
            >
              <h2
                style={{
                  fontSize: "1.15rem",
                  fontWeight: 700,
                  letterSpacing: "-0.025em",
                  color: "#ffffff",
                  marginBottom: "0.15rem",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {currentTrack.title}
              </h2>
              <p
                style={{
                  fontSize: "0.82rem",
                  fontWeight: 500,
                  color: "rgba(255, 255, 255, 0.72)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {currentTrack.artist}
              </p>
              <p
                style={{
                  fontSize: "0.68rem",
                  color: "rgba(255, 255, 255, 0.48)",
                  marginTop: "0.1rem",
                }}
              >
                {currentTrack.album}
              </p>
            </div>

            {/* Visualizer */}
            <div style={{ width: "100%", marginBottom: "0.6rem" }}>
              <SoundVisualizer />
            </div>

            {/* Scrubber Timeline */}
            <div
              style={{
                position: "relative",
                zIndex: 1,
                width: "100%",
                marginBottom: "0.85rem",
              }}
            >
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  height: "6px",
                  borderRadius: "9999px",
                  background: "rgba(255, 255, 255, 0.16)",
                  boxShadow: "inset 0 1px 2px rgba(0, 0, 0, 0.4)",
                  cursor: "pointer",
                }}
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const clickX = e.clientX - rect.left;
                  const ratio = Math.max(0, Math.min(1, clickX / rect.width));
                  seek(ratio * duration);
                }}
              >
                <div
                  style={{
                    height: "100%",
                    borderRadius: "9999px",
                    background: "#ffffff",
                    position: "relative",
                    boxShadow: "0 0 8px rgba(255, 255, 255, 0.6)",
                    width: `${progressPercent}%`,
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      right: "-5px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      width: "11px",
                      height: "11px",
                      borderRadius: "50%",
                      background: "#ffffff",
                      boxShadow: "0 2px 5px rgba(0, 0, 0, 0.5)",
                    }}
                  />
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "0.65rem",
                  fontWeight: 500,
                  color: "rgba(255, 255, 255, 0.48)",
                  marginTop: "0.3rem",
                }}
              >
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Apple Transport Controls */}
            <div
              style={{
                position: "relative",
                zIndex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "1.25rem",
                width: "100%",
                marginBottom: "0.85rem",
              }}
            >
              <button
                onClick={() => setIsShuffle(!isShuffle)}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: "0.4rem",
                  opacity: isShuffle ? 1 : 0.5,
                  color: isShuffle ? "#30d158" : "#ffffff",
                  display: "flex",
                  alignItems: "center",
                }}
                title="Shuffle"
              >
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M16 3h5v5" />
                  <path d="M4 20L21 3" />
                  <path d="M21 16v5h-5" />
                  <path d="M15 15l6 6" />
                  <path d="M4 4l5 5" />
                </svg>
              </button>

              <button
                onClick={prevTrack}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#ffffff",
                  cursor: "pointer",
                  padding: "0.4rem",
                  display: "flex",
                  alignItems: "center",
                }}
                title="Previous Track"
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
                    strokeWidth="2.5"
                  />
                </svg>
              </button>

              <button
                onClick={togglePlay}
                style={{
                  width: "50px",
                  height: "50px",
                  borderRadius: "50%",
                  background: "#ffffff",
                  color: "#06040c",
                  border: "none",
                  boxShadow:
                    "0 6px 20px rgba(0, 0, 0, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.8)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
                title={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? (
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <rect x="6" y="4" width="4" height="16" rx="1.5" />
                    <rect x="14" y="4" width="4" height="16" rx="1.5" />
                  </svg>
                ) : (
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    style={{ marginLeft: "2px" }}
                  >
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                )}
              </button>

              <button
                onClick={nextTrack}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#ffffff",
                  cursor: "pointer",
                  padding: "0.4rem",
                  display: "flex",
                  alignItems: "center",
                }}
                title="Next Track"
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
                    strokeWidth="2.5"
                  />
                </svg>
              </button>

              <button
                onClick={toggle432Hz}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: "0.4rem",
                  opacity: is432Hz ? 1 : 0.5,
                  color: is432Hz ? "#ffd60a" : "#ffffff",
                  fontSize: "0.68rem",
                  fontWeight: 700,
                }}
                title="432Hz Harmonic Mode"
              >
                432
              </button>
            </div>

            {/* Volume Capsule Slider */}
            <div
              style={{
                position: "relative",
                zIndex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
                padding: "0 0.4rem",
                gap: "0.8rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  flex: 1,
                }}
              >
                <button
                  onClick={toggleMute}
                  style={{
                    background: "none",
                    border: "none",
                    color: "rgba(255,255,255,0.7)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    padding: 0,
                  }}
                >
                  {isMuted || volume === 0 ? (
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                      <line
                        x1="23"
                        y1="9"
                        x2="17"
                        y2="15"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                      <line
                        x1="17"
                        y1="9"
                        x2="23"
                        y2="15"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                    </svg>
                  ) : (
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                      <path
                        d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                    </svg>
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  style={{
                    flex: 1,
                    height: "5px",
                    borderRadius: "9999px",
                    background: "rgba(255, 255, 255, 0.18)",
                    outline: "none",
                    WebkitAppearance: "none",
                    cursor: "pointer",
                  }}
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 2: MASTER VAULT (GUARANTEED LENIS-PREVENT SCROLL CONTAINER) */}
        {activeTab === "vault" && (
          <motion.div
            data-lenis-prevent="true"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            style={{
              ...appleGlass10CardStyle,
              width: "100%",
              maxWidth: "520px",
              height: "calc(100dvh - 210px)",
              maxHeight: "560px",
              padding: "1rem 1rem",
              display: "flex",
              flexDirection: "column",
              minHeight: 0,
            }}
          >
            {/* Search Input (Fixed Header) */}
            <input
              type="text"
              placeholder="Search 112 tracks by song, artist, film..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "0.65rem 1rem",
                borderRadius: "9999px",
                background: "rgba(255, 255, 255, 0.09)",
                border: "1px solid rgba(255, 255, 255, 0.22)",
                borderTop: "1px solid rgba(255, 255, 255, 0.40)",
                boxShadow: "inset 0 1px 2px rgba(0, 0, 0, 0.3)",
                color: "#ffffff",
                fontSize: "0.82rem",
                outline: "none",
                marginBottom: "0.65rem",
                flexShrink: 0,
              }}
            />

            {/* Category Filter Pills (Fixed Header) */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
                overflowX: "auto",
                paddingBottom: "0.65rem",
                width: "100%",
                scrollbarWidth: "none",
                WebkitOverflowScrolling: "touch",
                flexShrink: 0,
              }}
            >
              {[
                { id: "all", label: "✦ All 112" },
                { id: "user-vault", label: "Mitesh's (12)" },
                { id: "titans", label: "Titans (25)" },
                { id: "symphony", label: "Symphony (25)" },
                { id: "sessions", label: "Sessions (25)" },
                { id: "sufi", label: "Sufi (25)" },
              ].map((cat) => {
                const isSelected = vaultCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setVaultCategory(cat.id)}
                    style={{
                      flexShrink: 0,
                      padding: "0.32rem 0.7rem",
                      borderRadius: "9999px",
                      fontSize: "0.68rem",
                      fontWeight: 550,
                      background: isSelected
                        ? "rgba(255, 255, 255, 0.28)"
                        : "rgba(255, 255, 255, 0.08)",
                      border: isSelected
                        ? "1px solid rgba(255, 255, 255, 0.45)"
                        : "1px solid rgba(255, 255, 255, 0.16)",
                      borderTop: isSelected
                        ? "1px solid rgba(255, 255, 255, 0.65)"
                        : "1px solid rgba(255, 255, 255, 0.35)",
                      color: isSelected ? "#ffffff" : "rgba(255, 255, 255, 0.68)",
                      boxShadow: isSelected
                        ? "inset 0 1px 1px rgba(255, 255, 255, 0.5)"
                        : "none",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>

            {/* 112-Track Scroll Area (FLAWLESS NATIVE MOUSE & TRACKPAD SCROLLING) */}
            <div
              data-lenis-prevent="true"
              onWheel={(e) => e.stopPropagation()}
              style={{
                flex: 1,
                overflowY: "auto",
                overscrollBehavior: "contain",
                touchAction: "pan-y",
                WebkitOverflowScrolling: "touch",
                display: "flex",
                flexDirection: "column",
                gap: "0.3rem",
                paddingRight: "0.2rem",
                width: "100%",
                minHeight: 0,
              }}
            >
              <style jsx>{`
                div::-webkit-scrollbar {
                  width: 5px;
                }
                div::-webkit-scrollbar-track {
                  background: transparent;
                }
                div::-webkit-scrollbar-thumb {
                  background: rgba(255, 255, 255, 0.25);
                  border-radius: 9999px;
                }
              `}</style>
              {filteredVaultTracks.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "2rem",
                    color: "rgba(255,255,255,0.4)",
                    fontSize: "0.85rem",
                  }}
                >
                  No tracks found matching "{searchQuery}"
                </div>
              ) : (
                filteredVaultTracks.map((track, idx) => {
                  const isActive = track.id === currentTrack.id;
                  return (
                    <button
                      key={track.id}
                      onClick={() => playTrack(track)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "0.45rem 0.65rem",
                        borderRadius: "14px",
                        background: isActive
                          ? "rgba(255, 255, 255, 0.16)"
                          : "transparent",
                        border: isActive
                          ? "1px solid rgba(255, 255, 255, 0.28)"
                          : "1px solid transparent",
                        borderTop: isActive
                          ? "1px solid rgba(255, 255, 255, 0.50)"
                          : "1px solid transparent",
                        boxShadow: isActive
                          ? "inset 0 1px 1px rgba(255, 255, 255, 0.35)"
                          : "none",
                        width: "100%",
                        textAlign: "left",
                        cursor: "pointer",
                        transition: "background 0.15s ease",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.65rem",
                          minWidth: 0,
                          flex: 1,
                        }}
                      >
                        <span
                          style={{
                            fontSize: "0.65rem",
                            color: "rgba(255,255,255,0.38)",
                            width: "20px",
                            textAlign: "right",
                            fontVariantNumeric: "tabular-nums",
                            flexShrink: 0,
                          }}
                        >
                          {idx + 1}
                        </span>
                        <img
                          src={track.artwork}
                          alt=""
                          style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "8px",
                            objectFit: "cover",
                            flexShrink: 0,
                            boxShadow: "0 3px 6px rgba(0, 0, 0, 0.4)",
                          }}
                        />
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div
                            style={{
                              fontSize: "0.82rem",
                              fontWeight: 600,
                              color: isActive ? "#30d158" : "#ffffff",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {track.title}
                          </div>
                          <div
                            style={{
                              fontSize: "0.68rem",
                              color: "rgba(255,255,255,0.58)",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {track.artist} · {track.album}
                          </div>
                        </div>
                      </div>

                      <div
                        style={{
                          fontSize: "0.68rem",
                          color: "rgba(255,255,255,0.45)",
                          marginLeft: "0.5rem",
                          flexShrink: 0,
                        }}
                      >
                        {isActive && isPlaying ? (
                          <span style={{ color: "#30d158", fontWeight: 600 }}>
                            ● PLAYING
                          </span>
                        ) : (
                          formatTime(track.duration)
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </div>

      {/* 3. BOTTOM FLOATING APPLE LIQUID DOCK */}
      <div style={{ zIndex: 50, flexShrink: 0 }}>
        <AppleLiquidDock />
      </div>
    </main>
  );
}
