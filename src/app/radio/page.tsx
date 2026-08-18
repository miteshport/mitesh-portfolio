"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import CustomCursor from "@/components/CustomCursor";
import GalaxyStarfield from "@/components/GalaxyStarfield";
import SpatialHUD from "@/components/SpatialHUD";
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
function SoundVisualizer({ color = "#38bdf8" }: { color?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { getFrequencyData, isPlaying } = useSoundroom();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const data = getFrequencyData();
      const numBars = 28;
      const width = canvas.width;
      const height = canvas.height;
      const barWidth = (width / numBars) * 0.65;
      const gap = (width - barWidth * numBars) / (numBars - 1);

      for (let i = 0; i < numBars; i++) {
        const value = isPlaying
          ? data[i * 2] || Math.sin(Date.now() * 0.005 + i * 0.3) * 25 + 35
          : 4;
        const barHeight = Math.max(3, (value / 255) * (height - 4));
        const x = i * (barWidth + gap);
        const y = (height - barHeight) / 2;

        const grad = ctx.createLinearGradient(0, y, 0, y + barHeight);
        grad.addColorStop(0, "rgba(255, 255, 255, 0.95)");
        grad.addColorStop(0.5, color);
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
  }, [getFrequencyData, isPlaying, color]);

  return (
    <canvas
      ref={canvasRef}
      width={220}
      height={20}
      style={{
        width: "100%",
        maxWidth: "220px",
        height: "20px",
        display: "block",
        margin: "0 auto",
      }}
    />
  );
}

export default function SoundroomPage() {
  const [timeStr, setTimeStr] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFolder, setSelectedFolder] = useState<string>("user-vault");
  const [showNowPlayingModal, setShowNowPlayingModal] = useState<boolean>(false);
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

  // Concatenate all tracks across all channels
  const allTracks = useMemo(() => {
    return channels.flatMap((c) => c.tracks);
  }, [channels]);

  // Current Active Playlist based on Selected Folder
  const activePlaylist = useMemo(() => {
    if (selectedFolder === "all") {
      return {
        id: "all",
        title: "All Songs (Full Vault)",
        subtitle: "Complete 112 Master Soundtracks",
        description: "Every handpicked masterpiece across all genres and eras.",
        themeColor: "#38bdf8",
        tracks: allTracks,
      };
    }
    const found = channels.find((c) => c.id === selectedFolder);
    return found || channels[0];
  }, [selectedFolder, channels, allTracks]);

  // Filtered tracks based on search query
  const displayedTracks = useMemo(() => {
    if (!searchQuery.trim()) return activePlaylist.tracks;
    const q = searchQuery.toLowerCase();
    return activePlaylist.tracks.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.artist.toLowerCase().includes(q) ||
        t.album.toLowerCase().includes(q)
    );
  }, [activePlaylist, searchQuery]);

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Apple Liquid Frosted Glass Style
  const appleGlassStyle: React.CSSProperties = {
    borderRadius: "28px",
    background:
      "linear-gradient(135deg, rgba(255, 255, 255, 0.20) 0%, rgba(255, 255, 255, 0.05) 50%, rgba(255, 255, 255, 0.10) 100%)",
    backdropFilter: "blur(40px) saturate(220%) brightness(110%)",
    WebkitBackdropFilter: "blur(40px) saturate(220%) brightness(110%)",
    border: "1px solid rgba(255, 255, 255, 0.22)",
    borderTop: "1px solid rgba(255, 255, 255, 0.50)",
    boxShadow:
      "inset 0 1.5px 2px 0 rgba(255, 255, 255, 0.45), 0 30px 60px -15px rgba(0, 0, 0, 0.8)",
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
      <GalaxyStarfield />
      <SpatialHUD />

      {/* CENTER IPAD / APPLE MUSIC CONTAINER */}
      <div
        style={{
          flex: 1,
          width: "100%",
          maxWidth: "680px",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          zIndex: 10,
          minHeight: 0,
          padding: "0.5rem 0",
        }}
      >
        {/* 1. IPAD FOLDER / PLAYLIST SELECTOR BAR */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.45rem",
            overflowX: "auto",
            maxWidth: "100%",
            padding: "0.3rem 0.2rem",
            marginBottom: "0.65rem",
            scrollbarWidth: "none",
            WebkitOverflowScrolling: "touch",
            flexShrink: 0,
          }}
        >
          {channels.map((ch) => {
            const isSelected = selectedFolder === ch.id;
            return (
              <button
                key={ch.id}
                onClick={() => {
                  uiAudio.playClick();
                  setSelectedFolder(ch.id);
                }}
                style={{
                  flexShrink: 0,
                  padding: "0.45rem 0.95rem",
                  borderRadius: "9999px",
                  fontSize: "0.74rem",
                  fontWeight: 600,
                  color: isSelected ? "#ffffff" : "rgba(255, 255, 255, 0.70)",
                  background: isSelected
                    ? "linear-gradient(135deg, rgba(255, 255, 255, 0.35) 0%, rgba(255, 255, 255, 0.16) 100%)"
                    : "rgba(255, 255, 255, 0.08)",
                  backdropFilter: "blur(20px)",
                  WebkitBackdropFilter: "blur(20px)",
                  border: isSelected
                    ? `1px solid ${ch.themeColor || "rgba(255, 255, 255, 0.5)"}`
                    : "1px solid rgba(255, 255, 255, 0.15)",
                  boxShadow: isSelected
                    ? `0 0 16px ${ch.themeColor ? `${ch.themeColor}55` : "rgba(255,255,255,0.25)"}`
                    : "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
              >
                <span style={{ color: isSelected ? ch.themeColor : "rgba(255,255,255,0.4)" }}>
                  ●
                </span>
                <span>{ch.title}</span>
                <span style={{ fontSize: "0.64rem", opacity: 0.6 }}>
                  ({ch.tracks.length})
                </span>
              </button>
            );
          })}

          {/* ALL SONGS FOLDER */}
          <button
            onClick={() => {
              uiAudio.playClick();
              setSelectedFolder("all");
            }}
            style={{
              flexShrink: 0,
              padding: "0.45rem 0.95rem",
              borderRadius: "9999px",
              fontSize: "0.74rem",
              fontWeight: 600,
              color: selectedFolder === "all" ? "#ffffff" : "rgba(255, 255, 255, 0.70)",
              background: selectedFolder === "all"
                ? "linear-gradient(135deg, rgba(56, 189, 248, 0.35) 0%, rgba(56, 189, 248, 0.16) 100%)"
                : "rgba(255, 255, 255, 0.08)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: selectedFolder === "all"
                ? "1px solid #38bdf8"
                : "1px solid rgba(255, 255, 255, 0.15)",
              boxShadow: selectedFolder === "all" ? "0 0 16px rgba(56, 189, 248, 0.35)" : "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              transition: "all 0.2s ease",
            }}
          >
            <span>All Songs</span>
            <span style={{ fontSize: "0.64rem", opacity: 0.6 }}>({allTracks.length})</span>
          </button>
        </div>

        {/* 2. MAIN TRACKLIST VIEW (APPLE MUSIC PLAYLIST BROWSER) */}
        <div
          style={{
            ...appleGlassStyle,
            flex: 1,
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
            overflow: "hidden",
            padding: "1rem 1.2rem",
          }}
        >
          {/* Playlist Info Header & Search Bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "0.8rem",
              paddingBottom: "0.8rem",
              borderBottom: "1px solid rgba(255, 255, 255, 0.12)",
              flexShrink: 0,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "1.05rem",
                  fontWeight: 750,
                  color: "#ffffff",
                  letterSpacing: "-0.02em",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <span>{activePlaylist.title}</span>
                <span
                  style={{
                    fontSize: "0.68rem",
                    padding: "0.15rem 0.5rem",
                    borderRadius: "9999px",
                    background: "rgba(255, 255, 255, 0.14)",
                    color: activePlaylist.themeColor || "#38bdf8",
                  }}
                >
                  {displayedTracks.length} Songs
                </span>
              </div>
              <div
                style={{
                  fontSize: "0.68rem",
                  color: "rgba(255, 255, 255, 0.55)",
                  marginTop: "0.15rem",
                }}
              >
                {activePlaylist.subtitle}
              </div>
            </div>

            {/* Live Search Input */}
            <div style={{ position: "relative", minWidth: "160px", maxWidth: "220px" }}>
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.4rem 0.8rem",
                  paddingLeft: "1.8rem",
                  borderRadius: "9999px",
                  background: "rgba(255, 255, 255, 0.10)",
                  border: "1px solid rgba(255, 255, 255, 0.20)",
                  color: "#ffffff",
                  fontSize: "0.72rem",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
              <span
                style={{
                  position: "absolute",
                  left: "0.6rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  fontSize: "0.7rem",
                  opacity: 0.5,
                  pointerEvents: "none",
                }}
              >
                🔍
              </span>
            </div>
          </div>

          {/* Scrollable Song List */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              paddingTop: "0.6rem",
              paddingRight: "0.2rem",
              minHeight: 0,
            }}
          >
            {displayedTracks.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "3rem 1rem",
                  color: "rgba(255, 255, 255, 0.45)",
                  fontSize: "0.8rem",
                }}
              >
                No matching tracks found in this playlist.
              </div>
            ) : (
              displayedTracks.map((track, idx) => {
                const isCurrent = currentTrack?.id === track.id;
                return (
                  <motion.div
                    key={track.id}
                    onClick={() => {
                      playTrack(track);
                    }}
                    whileHover={{ scale: 1.01, backgroundColor: "rgba(255, 255, 255, 0.14)" }}
                    whileTap={{ scale: 0.99 }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.85rem",
                      padding: "0.55rem 0.75rem",
                      borderRadius: "14px",
                      background: isCurrent
                        ? "linear-gradient(90deg, rgba(255, 255, 255, 0.22) 0%, rgba(255, 255, 255, 0.08) 100%)"
                        : "transparent",
                      border: isCurrent
                        ? "1px solid rgba(255, 255, 255, 0.35)"
                        : "1px solid transparent",
                      cursor: "pointer",
                      marginBottom: "0.3rem",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {/* Index or Playing Icon */}
                    <div
                      style={{
                        width: "22px",
                        textAlign: "center",
                        fontSize: "0.72rem",
                        fontWeight: 600,
                        color: isCurrent ? "#38bdf8" : "rgba(255, 255, 255, 0.4)",
                      }}
                    >
                      {isCurrent && isPlaying ? "▶" : idx + 1}
                    </div>

                    {/* Artwork Thumbnail */}
                    <img
                      src={track.artwork}
                      alt={track.title}
                      style={{
                        width: "38px",
                        height: "38px",
                        borderRadius: "8px",
                        objectFit: "cover",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
                      }}
                    />

                    {/* Title & Artist */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: "0.82rem",
                          fontWeight: isCurrent ? 700 : 550,
                          color: isCurrent ? "#ffffff" : "rgba(255, 255, 255, 0.90)",
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
                          color: "rgba(255, 255, 255, 0.50)",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          marginTop: "0.1rem",
                        }}
                      >
                        {track.artist} · {track.album}
                      </div>
                    </div>

                    {/* Duration */}
                    <div
                      style={{
                        fontSize: "0.7rem",
                        fontFamily: "var(--font-mono, monospace)",
                        color: isCurrent ? "#38bdf8" : "rgba(255, 255, 255, 0.45)",
                        flexShrink: 0,
                      }}
                    >
                      {formatTime(track.duration)}
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>

          {/* 3. APPLE MUSIC DOCKED MINI-PLAYER (BOTTOM OF TRACKLIST) */}
          {currentTrack && (
            <motion.div
              onClick={() => {
                uiAudio.playClick();
                setShowNowPlayingModal(true);
              }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              style={{
                marginTop: "0.6rem",
                padding: "0.65rem 0.95rem",
                borderRadius: "18px",
                background: "rgba(255, 255, 255, 0.18)",
                backdropFilter: "blur(30px)",
                WebkitBackdropFilter: "blur(30px)",
                border: "1px solid rgba(255, 255, 255, 0.35)",
                boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5)",
                display: "flex",
                alignItems: "center",
                gap: "0.85rem",
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              <img
                src={currentTrack.artwork}
                alt={currentTrack.title}
                style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "10px",
                  objectFit: "cover",
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    color: "#ffffff",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {currentTrack.title}
                </div>
                <div
                  style={{
                    fontSize: "0.68rem",
                    color: "rgba(255, 255, 255, 0.60)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {currentTrack.artist}
                </div>
              </div>

              {/* Mini Controls */}
              <div
                style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={togglePlay}
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    border: "none",
                    background: "#ffffff",
                    color: "#000000",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.95rem",
                    cursor: "pointer",
                    boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
                  }}
                >
                  {isPlaying ? "❚❚" : "▶"}
                </button>
                <button
                  onClick={nextTrack}
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    border: "none",
                    background: "rgba(255, 255, 255, 0.15)",
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.85rem",
                    cursor: "pointer",
                  }}
                >
                  ⏭
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* 4. APPLE MUSIC EXPANDED FULL-SCREEN "NOW PLAYING" MODAL */}
      <AnimatePresence>
        {showNowPlayingModal && currentTrack && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 120, scale: 0.95 }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100dvh",
              zIndex: 100,
              backgroundColor: "rgba(6, 4, 12, 0.85)",
              backdropFilter: "blur(50px) saturate(220%)",
              WebkitBackdropFilter: "blur(50px) saturate(220%)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "1.5rem",
              boxSizing: "border-box",
            }}
          >
            <div
              style={{
                ...appleGlassStyle,
                width: "100%",
                maxWidth: "440px",
                padding: "1.6rem",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                position: "relative",
              }}
            >
              {/* Close / Collapse Handle */}
              <button
                onClick={() => {
                  uiAudio.playClick();
                  setShowNowPlayingModal(false);
                }}
                style={{
                  position: "absolute",
                  top: "1.2rem",
                  right: "1.2rem",
                  background: "rgba(255, 255, 255, 0.15)",
                  border: "none",
                  borderRadius: "50%",
                  width: "32px",
                  height: "32px",
                  color: "#ffffff",
                  fontSize: "1.1rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                ✕
              </button>

              {/* Dynamic Colored Ambient Back-Glow */}
              <div
                style={{
                  position: "absolute",
                  top: "-20%",
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: "280px",
                  height: "280px",
                  borderRadius: "50%",
                  filter: "blur(80px)",
                  opacity: 0.55,
                  pointerEvents: "none",
                  zIndex: 0,
                  backgroundColor: currentChannel?.themeColor || "#38bdf8",
                  transition: "background-color 0.6s ease",
                }}
              />

              {/* Large Album Artwork */}
              <motion.div
                animate={{ scale: isPlaying ? 1.02 : 0.98 }}
                transition={{ duration: 0.4 }}
                style={{
                  position: "relative",
                  zIndex: 1,
                  width: "190px",
                  height: "190px",
                  borderRadius: "22px",
                  overflow: "hidden",
                  boxShadow: "0 20px 50px -10px rgba(0, 0, 0, 0.85)",
                  marginBottom: "1.2rem",
                }}
              >
                <img
                  src={currentTrack.artwork}
                  alt={currentTrack.title}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </motion.div>

              {/* Live Audio Visualizer */}
              <div style={{ width: "100%", marginBottom: "1rem", position: "relative", zIndex: 1 }}>
                <SoundVisualizer color={currentChannel?.themeColor || "#38bdf8"} />
              </div>

              {/* Track Info */}
              <div style={{ textAlign: "center", width: "100%", marginBottom: "1.2rem", position: "relative", zIndex: 1 }}>
                <div
                  style={{
                    fontSize: "1.2rem",
                    fontWeight: 800,
                    color: "#ffffff",
                    letterSpacing: "-0.02em",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {currentTrack.title}
                </div>
                <div
                  style={{
                    fontSize: "0.85rem",
                    color: "rgba(255, 255, 255, 0.65)",
                    marginTop: "0.2rem",
                  }}
                >
                  {currentTrack.artist}
                </div>
                <div
                  style={{
                    fontSize: "0.72rem",
                    color: currentChannel?.themeColor || "#38bdf8",
                    marginTop: "0.2rem",
                    fontWeight: 600,
                  }}
                >
                  {currentChannel?.title}
                </div>
              </div>

              {/* Apple Music Scrubber Bar */}
              <div style={{ width: "100%", marginBottom: "1.2rem", position: "relative", zIndex: 1 }}>
                <div
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const clickX = e.clientX - rect.left;
                    const percent = clickX / rect.width;
                    seek(percent * duration);
                  }}
                  style={{
                    width: "100%",
                    height: "6px",
                    borderRadius: "9999px",
                    backgroundColor: "rgba(255, 255, 255, 0.20)",
                    cursor: "pointer",
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${progressPercent}%`,
                      borderRadius: "9999px",
                      backgroundColor: "#ffffff",
                      boxShadow: "0 0 10px rgba(255, 255, 255, 0.8)",
                    }}
                  />
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "0.68rem",
                    fontFamily: "var(--font-mono, monospace)",
                    color: "rgba(255, 255, 255, 0.45)",
                    marginTop: "0.4rem",
                  }}
                >
                  <span>{formatTime(currentTime)}</span>
                  <span>-{formatTime(Math.max(0, duration - currentTime))}</span>
                </div>
              </div>

              {/* Transport Controls */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "1.5rem",
                  marginBottom: "1.2rem",
                  position: "relative",
                  zIndex: 1,
                }}
              >
                <button
                  onClick={() => setIsShuffle((prev) => !prev)}
                  style={{
                    background: "none",
                    border: "none",
                    color: isShuffle ? "#38bdf8" : "rgba(255, 255, 255, 0.4)",
                    fontSize: "1.1rem",
                    cursor: "pointer",
                  }}
                >
                  🔀
                </button>

                <button
                  onClick={prevTrack}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#ffffff",
                    fontSize: "1.4rem",
                    cursor: "pointer",
                  }}
                >
                  ⏮
                </button>

                <motion.button
                  onClick={togglePlay}
                  whileTap={{ scale: 0.90 }}
                  style={{
                    width: "56px",
                    height: "56px",
                    borderRadius: "50%",
                    backgroundColor: "#ffffff",
                    border: "none",
                    color: "#000000",
                    fontSize: "1.4rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    boxShadow: "0 10px 25px rgba(255, 255, 255, 0.35)",
                  }}
                >
                  {isPlaying ? "❚❚" : "▶"}
                </motion.button>

                <button
                  onClick={nextTrack}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#ffffff",
                    fontSize: "1.4rem",
                    cursor: "pointer",
                  }}
                >
                  ⏭
                </button>

                <button
                  onClick={toggle432Hz}
                  style={{
                    background: is432Hz ? "rgba(56, 189, 248, 0.25)" : "none",
                    border: is432Hz ? "1px solid #38bdf8" : "1px solid transparent",
                    borderRadius: "8px",
                    padding: "0.2rem 0.4rem",
                    color: is432Hz ? "#38bdf8" : "rgba(255, 255, 255, 0.4)",
                    fontSize: "0.68rem",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  432Hz
                </button>
              </div>

              {/* Volume Slider */}
              <div
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  position: "relative",
                  zIndex: 1,
                }}
              >
                <span
                  onClick={toggleMute}
                  style={{ cursor: "pointer", fontSize: "0.85rem", opacity: 0.7 }}
                >
                  {isMuted || volume === 0 ? "🔇" : "🔊"}
                </span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  style={{
                    flex: 1,
                    accentColor: "#ffffff",
                    height: "4px",
                    cursor: "pointer",
                  }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
