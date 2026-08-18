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
      const numBars = 32;
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
  const [activeView, setActiveView] = useState<"player" | "tracklist">("player");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFolder, setSelectedFolder] = useState<string>("all");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customUrl, setCustomUrl] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const [cacheStatus, setCacheStatus] = useState<string>("");
  const [isCaching, setIsCaching] = useState(false);

  const {
    currentTrack,
    currentChannel,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    is432Hz,
    isShuffle,
    channels,
    togglePlay,
    playTrack,
    playCustomUrl,
    nextTrack,
    prevTrack,
    seek,
    setVolume,
    toggleMute,
    toggle432Hz,
    toggleShuffle,
  } = useSoundroom();

  // Register PWA Service Worker for Offline Commute Playback
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then(() => {
          console.log("[PWA] Soundroom Offline Cache Service Worker Registered.");
        })
        .catch((err) => {
          console.warn("[PWA] Service Worker registration failed:", err);
        });
    }
  }, []);

  // All 118 Tracks (112 Master Soundtracks + 6 Live 24/7 Radio Streams)
  const allVaultTracks = useMemo(() => {
    return channels.flatMap((c) => c.tracks);
  }, [channels]);

  // Current Active Playlist based on Selected Folder
  const activePlaylist = useMemo(() => {
    if (selectedFolder === "all") {
      return {
        id: "all",
        title: "All Songs (Master Vault)",
        subtitle: `Complete Library (${allVaultTracks.length} Tracks & Live Radio)`,
        description: "All Hindi, Sufi, Punjabi, Symphony, Hans Zimmer tracks & 24/7 Live Radio.",
        maestros: ["A.R. Rahman", "Sonu Nigam", "Lucky Ali", "Nusrat", "Hans Zimmer", "Live DJs"],
        themeColor: "#38bdf8",
        tracks: allVaultTracks,
      };
    }
    const found = channels.find((c) => c.id === selectedFolder);
    return found || channels[0];
  }, [selectedFolder, channels, allVaultTracks]);

  // Filtered tracks by search query
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

  const isLive = currentTrack?.isLiveStream;
  const progressPercent = duration > 0 && !isLive ? (currentTime / duration) * 100 : 0;

  // Fast forward / Rewind 10s
  const handleFastForward = () => {
    uiAudio.playClick();
    if (!isLive) seek(Math.min(duration, currentTime + 10));
  };

  const handleRewind = () => {
    uiAudio.playClick();
    if (!isLive) seek(Math.max(0, currentTime - 10));
  };

  // Flip Toggle
  const handleFlipCard = () => {
    uiAudio.playClick();
    setActiveView((prev) => (prev === "player" ? "tracklist" : "player"));
  };

  // One-Tap Cache Playlist for Commute Dead-Zones (Hwy 10 / Arthur)
  const handleCachePlaylist = async () => {
    if (isCaching) return;
    uiAudio.playClick();
    setIsCaching(true);
    setCacheStatus("Caching 112 Songs...");

    try {
      if ("caches" in window) {
        const cache = await caches.open("soundroom-audio-v1");
        const tracksToCache = activePlaylist.tracks.filter((t) => !t.isLiveStream);
        let count = 0;

        for (const track of tracksToCache) {
          const url = `/audio/${track.id}.m4a`;
          try {
            const res = await fetch(url);
            if (res.status === 200) {
              await cache.put(url, res);
              count++;
              setCacheStatus(`Cached ${count}/${tracksToCache.length}`);
            }
          } catch (e) {
            console.warn("Track cache skip:", track.title, e);
          }
        }
        setCacheStatus("✅ Offline Ready for Commute");
      } else {
        setCacheStatus("⚠️ Cache not supported");
      }
    } catch {
      setCacheStatus("⚠️ Caching error");
    } finally {
      setIsCaching(false);
      setTimeout(() => setCacheStatus(""), 4000);
    }
  };

  // Custom YouTube / Stream Ingestion Handler
  const handlePlayCustomStream = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrl.trim()) return;
    playCustomUrl(customUrl.trim(), customTitle.trim() || "YouTube / Custom Audio", "Live Stream Link");
    setCustomUrl("");
    setCustomTitle("");
    setShowCustomInput(false);
  };

  // Apple Liquid Glass Style
  const glassCardStyle: React.CSSProperties = {
    borderRadius: "28px",
    background:
      "linear-gradient(135deg, rgba(255, 255, 255, 0.20) 0%, rgba(255, 255, 255, 0.05) 50%, rgba(255, 255, 255, 0.12) 100%)",
    backdropFilter: "blur(40px) saturate(220%) brightness(110%)",
    WebkitBackdropFilter: "blur(40px) saturate(220%) brightness(110%)",
    border: "1px solid rgba(255, 255, 255, 0.22)",
    borderTop: "1px solid rgba(255, 255, 255, 0.50)",
    boxShadow:
      "inset 0 1.5px 2px 0 rgba(255, 255, 255, 0.45), 0 30px 60px -15px rgba(0, 0, 0, 0.85)",
  };

  return (
    <main
      data-lenis-prevent="true"
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
        justifyContent: "center",
        padding: "1rem",
        boxSizing: "border-box",
      }}
    >
      <CustomCursor />
      <GalaxyStarfield />
      <SpatialHUD />

      {/* SLEEK GLASS SCROLLBAR CSS */}
      <style jsx global>{`
        .custom-apple-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 255, 255, 0.3) transparent;
        }
        .custom-apple-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-apple-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.04);
          border-radius: 9999px;
        }
        .custom-apple-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 9999px;
        }
        .custom-apple-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.55);
        }
      `}</style>

      {/* 1-CARD CONTAINER (RESPONSIVE SINGLE DECK ON ALL SCREENS) */}
      <div
        data-lenis-prevent="true"
        style={{
          width: "100%",
          maxWidth: "415px", height: "min(92dvh, 660px)", minHeight: "460px",
          position: "relative",
          zIndex: 10,
          marginTop: "2.5rem",
        }}
      >
        <AnimatePresence mode="wait">
          {/* ================================================================= */}
          {/* FACE 1: FRONT (NOW PLAYING HERO DECK)                             */}
          {/* ================================================================= */}
          {activeView === "player" ? (
            <motion.div
              key="player-deck"
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -15 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              style={{
                ...glassCardStyle,
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "clamp(0.85rem, 2.5vw, 1.35rem)",
                boxSizing: "border-box",
                overflow: "hidden",
                position: "relative",
              }}
            >
              {/* Dynamic Saturated Ambient Bloom */}
              <div
                style={{
                  position: "absolute",
                  top: "-25%",
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: "280px",
                  height: "280px",
                  borderRadius: "50%",
                  filter: "blur(85px)",
                  opacity: 0.55,
                  pointerEvents: "none",
                  zIndex: 0,
                  backgroundColor: currentChannel?.themeColor || "#38bdf8",
                  transition: "background-color 0.8s ease",
                }}
              />

              {/* Top Bar on Card: Commute Mode & Action Buttons */}
              <div
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  position: "relative",
                  zIndex: 1,
                }}
              >
                <div
                  style={{
                    fontSize: "0.68rem",
                    fontFamily: "var(--font-mono, monospace)",
                    letterSpacing: "0.12em",
                    color: "rgba(255, 255, 255, 0.65)",
                    textTransform: "uppercase",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem",
                  }}
                >
                  {isLive ? (
                    <span style={{ color: "#ef4444", fontWeight: 700 }}>● 24/7 LIVE RADIO</span>
                  ) : (
                    <span style={{ fontWeight: 700, color: "#38bdf8" }}>COMMUTE VAULT</span>
                  )}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  {/* YouTube / Link Ingest Button */}
                  <button
                    onClick={() => setShowCustomInput((prev) => !prev)}
                    title="Paste YouTube link or stream URL"
                    style={{
                      background: showCustomInput ? "rgba(56, 189, 248, 0.3)" : "rgba(255, 255, 255, 0.12)",
                      border: "1px solid rgba(255, 255, 255, 0.22)",
                      borderRadius: "9999px",
                      padding: "0.26rem 0.65rem",
                      fontSize: "0.68rem",
                      fontWeight: 600,
                      color: "#ffffff",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.3rem",
                    }}
                  >
                    <span>📺</span>
                    <span>YouTube / Link</span>
                  </button>

                  {/* Tracklist Flip Button */}
                  <button
                    onClick={handleFlipCard}
                    style={{
                      background: "rgba(255, 255, 255, 0.14)",
                      border: "1px solid rgba(255, 255, 255, 0.25)",
                      borderRadius: "9999px",
                      padding: "0.26rem 0.7rem",
                      fontSize: "0.68rem",
                      fontWeight: 600,
                      color: "#ffffff",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.35rem",
                    }}
                  >
                    <span>🗂️</span>
                    <span>Folders</span>
                  </button>
                </div>
              </div>

              {/* YouTube / Custom Stream Input Modal Popover */}
              {showCustomInput && (
                <form
                  onSubmit={handlePlayCustomStream}
                  style={{
                    width: "100%",
                    background: "rgba(10, 10, 18, 0.94)",
                    border: "1px solid rgba(56, 189, 248, 0.4)",
                    borderRadius: "16px",
                    padding: "0.75rem",
                    boxSizing: "border-box",
                    position: "relative",
                    zIndex: 10,
                    margin: "0.2rem 0",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.45rem",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.8)",
                  }}
                >
                  <div style={{ fontSize: "0.70rem", color: "#38bdf8", fontWeight: 700 }}>
                    ▶ Paste any YouTube URL (e.g. Arijit DJ set, song) or Audio Stream:
                  </div>
                  <input
                    type="text"
                    placeholder="https://www.youtube.com/watch?v=... or youtu.be/..."
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    required
                    style={{
                      width: "100%",
                      padding: "0.38rem 0.65rem",
                      borderRadius: "8px",
                      background: "rgba(255, 255, 255, 0.1)",
                      border: "1px solid rgba(255, 255, 255, 0.2)",
                      color: "#ffffff",
                      fontSize: "0.72rem",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                  <div style={{ display: "flex", gap: "0.4rem" }}>
                    <input
                      type="text"
                      placeholder="Title (Optional)"
                      value={customTitle}
                      onChange={(e) => setCustomTitle(e.target.value)}
                      style={{
                        flex: 1,
                        padding: "0.3rem 0.6rem",
                        borderRadius: "8px",
                        background: "rgba(255, 255, 255, 0.1)",
                        border: "1px solid rgba(255, 255, 255, 0.2)",
                        color: "#ffffff",
                        fontSize: "0.70rem",
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                    <button
                      type="submit"
                      style={{
                        padding: "0.32rem 0.9rem",
                        borderRadius: "8px",
                        background: "#38bdf8",
                        color: "#000000",
                        fontWeight: 750,
                        border: "none",
                        fontSize: "0.72rem",
                        cursor: "pointer",
                      }}
                    >
                      Stream Now
                    </button>
                  </div>
                </form>
              )}

              {/* Large Album Artwork */}
              <div
                style={{
                  position: "relative",
                  zIndex: 1,
                  width: "clamp(140px, 28vh, 210px)", height: "clamp(140px, 28vh, 210px)",
                  borderRadius: "20px",
                  overflow: "hidden",
                  boxShadow: "0 20px 45px -8px rgba(0, 0, 0, 0.85)",
                  border: "1px solid rgba(255, 255, 255, 0.25)",
                  flexShrink: 0,
                  margin: "0.3rem 0",
                }}
              >
                <img
                  src={currentTrack?.artwork}
                  alt={currentTrack?.title}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>



              {/* Track Info */}
              <div
                style={{
                  position: "relative",
                  zIndex: 1,
                  textAlign: "center",
                  width: "100%",
                }}
              >
                <div
                  style={{
                    fontSize: "1.16rem",
                    fontWeight: 750,
                    color: "#ffffff",
                    letterSpacing: "-0.02em",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {currentTrack?.title}
                </div>
                <div
                  style={{
                    fontSize: "0.82rem",
                    color: "rgba(255, 255, 255, 0.70)",
                    marginTop: "0.15rem",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {currentTrack?.artist}
                </div>
                <div
                  style={{
                    fontSize: "0.68rem",
                    color: currentChannel?.themeColor || "#38bdf8",
                    marginTop: "0.15rem",
                    fontWeight: 600,
                  }}
                >
                  {currentChannel?.title} · {currentTrack?.album}
                </div>
              </div>

              {/* Timeline Scrubber Bar or Live Stream Pulse */}
              <div style={{ width: "100%", position: "relative", zIndex: 1 }}>
                {isLive ? (
                  <div
                    style={{
                      width: "100%",
                      padding: "0.4rem",
                      borderRadius: "10px",
                      background: "rgba(239, 68, 68, 0.15)",
                      border: "1px solid rgba(239, 68, 68, 0.35)",
                      textAlign: "center",
                      fontSize: "0.68rem",
                      fontFamily: "var(--font-mono, monospace)",
                      color: "#ef4444",
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.4rem",
                    }}
                  >
                    <span style={{ fontSize: "0.6rem" }}>🔴</span>
                    <span>24/7 LIVE STREAM // UNINTERRUPTED COMMUTE</span>
                  </div>
                ) : (
                  <>
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
                        color: "rgba(255, 255, 255, 0.50)",
                        marginTop: "0.35rem",
                      }}
                    >
                      <span>{formatTime(currentTime)}</span>
                      <span>-{formatTime(Math.max(0, duration - currentTime))}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Transport Controls Row */}
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

                {/* 432Hz Tuning */}
                <button
                  onClick={toggle432Hz}
                  title="432Hz Harmonic Tuning"
                  style={{
                    background: is432Hz ? "rgba(56, 189, 248, 0.25)" : "none",
                    border: is432Hz ? "1px solid #38bdf8" : "1px solid rgba(255, 255, 255, 0.2)",
                    borderRadius: "8px",
                    padding: "0.2rem 0.4rem",
                    color: is432Hz ? "#38bdf8" : "rgba(255, 255, 255, 0.5)",
                    fontSize: "0.68rem",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  432Hz
                </button>
              </div>

              {/* Volume Control Bar */}
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
                  style={{ cursor: "pointer", fontSize: "0.85rem", opacity: 0.75 }}
                  title={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted || volume === 0 ? "🔇" : "🔉"}
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
                <span style={{ fontSize: "0.85rem", opacity: 0.75 }}>🔊</span>
              </div>

              {/* Bottom Flip Button */}
              <button
                onClick={handleFlipCard}
                style={{
                  width: "100%",
                  padding: "0.55rem",
                  borderRadius: "14px",
                  background: "rgba(255, 255, 255, 0.08)",
                  border: "1px solid rgba(255, 255, 255, 0.16)",
                  color: "#ffffff",
                  fontSize: "0.76rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.45rem",
                  position: "relative",
                  zIndex: 1,
                  transition: "all 0.15s ease",
                }}
              >
                <span>🗂️</span>
                <span>Select Folder / 24/7 Live Radio ({activePlaylist.tracks.length} Tracks)</span>
                <span style={{ opacity: 0.5, fontSize: "0.7rem" }}>➔</span>
              </button>
            </motion.div>
          ) : (
            /* ================================================================= */
            /* FACE 2: BACK (TRACKLIST & FOLDERS LIBRARY DECK)                   */
            /* ================================================================= */
            <motion.div
              key="tracklist-deck"
              data-lenis-prevent="true"
              initial={{ opacity: 0, scale: 0.95, y: -15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              style={{
                ...glassCardStyle,
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                padding: "1.2rem 1.4rem",
                boxSizing: "border-box",
                overflow: "hidden",
                position: "relative",
              }}
            >
              {/* Top Back Header: Active Folder & Flip Close Button */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingBottom: "0.60rem",
                  borderBottom: "1px solid rgba(255, 255, 255, 0.12)",
                  flexShrink: 0,
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: "1.02rem",
                      fontWeight: 750,
                      color: "#ffffff",
                      letterSpacing: "-0.02em",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.45rem",
                    }}
                  >
                    <span>{activePlaylist.title}</span>
                    <span
                      style={{
                        fontSize: "0.66rem",
                        padding: "0.15rem 0.5rem",
                        borderRadius: "9999px",
                        background: "rgba(255, 255, 255, 0.15)",
                        color: activePlaylist.themeColor || "#38bdf8",
                      }}
                    >
                      {displayedTracks.length} Tracks
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: "0.66rem",
                      color: "rgba(255, 255, 255, 0.55)",
                      marginTop: "0.1rem",
                    }}
                  >
                    {activePlaylist.subtitle}
                  </div>
                </div>

                {/* Close Button to Flip Back to Player */}
                <button
                  onClick={handleFlipCard}
                  title="Return to Player"
                  style={{
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
              </div>

              {/* Folder Selector Pills (All 112 Songs Vault + 24/7 Live Radio + Subfolders) */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  overflowX: "auto",
                  maxWidth: "100%",
                  padding: "0.55rem 0.1rem 0.4rem 0.1rem",
                  scrollbarWidth: "none",
                  WebkitOverflowScrolling: "touch",
                  flexShrink: 0,
                }}
              >
                {/* 1. All Songs Vault Pill (112 Tracks) */}
                <button
                  onClick={() => {
                    uiAudio.playClick();
                    setSelectedFolder("all");
                  }}
                  style={{
                    flexShrink: 0,
                    padding: "0.32rem 0.75rem",
                    borderRadius: "9999px",
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    color: selectedFolder === "all" ? "#ffffff" : "rgba(255, 255, 255, 0.75)",
                    background: selectedFolder === "all"
                      ? "linear-gradient(135deg, rgba(56, 189, 248, 0.40) 0%, rgba(56, 189, 248, 0.18) 100%)"
                      : "rgba(255, 255, 255, 0.08)",
                    border: selectedFolder === "all"
                      ? "1px solid #38bdf8"
                      : "1px solid rgba(255, 255, 255, 0.15)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.35rem",
                    transition: "all 0.15s ease",
                  }}
                >
                  <span>🎧 All Vault</span>
                  <span style={{ fontSize: "0.62rem", opacity: 0.75 }}>({allVaultTracks.length})</span>
                </button>

                {/* 2. 24/7 Live Radio Station Pill */}
                <button
                  onClick={() => {
                    uiAudio.playClick();
                    setSelectedFolder("live-radio");
                  }}
                  style={{
                    flexShrink: 0,
                    padding: "0.32rem 0.75rem",
                    borderRadius: "9999px",
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    color: selectedFolder === "live-radio" ? "#ffffff" : "#ef4444",
                    background: selectedFolder === "live-radio"
                      ? "linear-gradient(135deg, rgba(239, 68, 68, 0.45) 0%, rgba(239, 68, 68, 0.20) 100%)"
                      : "rgba(239, 68, 68, 0.12)",
                    border: selectedFolder === "live-radio"
                      ? "1px solid #ef4444"
                      : "1px solid rgba(239, 68, 68, 0.35)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.35rem",
                    transition: "all 0.15s ease",
                  }}
                >
                  <span>🔴 24/7 Live Radio</span>
                  <span style={{ fontSize: "0.62rem", opacity: 0.75 }}>({channels.find(c => c.id === 'live-radio')?.tracks.length || 5})</span>
                </button>

                {/* 3. Subfolder Category Pills */}
                {channels
                  .filter((c) => c.id !== "live-radio")
                  .map((ch) => {
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
                          padding: "0.32rem 0.75rem",
                          borderRadius: "9999px",
                          fontSize: "0.7rem",
                          fontWeight: 600,
                          color: isSelected ? "#ffffff" : "rgba(255, 255, 255, 0.70)",
                          background: isSelected
                            ? "linear-gradient(135deg, rgba(255, 255, 255, 0.35) 0%, rgba(255, 255, 255, 0.16) 100%)"
                            : "rgba(255, 255, 255, 0.08)",
                          border: isSelected
                            ? `1px solid ${ch.themeColor || "rgba(255, 255, 255, 0.5)"}`
                            : "1px solid rgba(255, 255, 255, 0.15)",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.35rem",
                          transition: "all 0.15s ease",
                        }}
                      >
                        <span style={{ color: isSelected ? ch.themeColor : "rgba(255,255,255,0.4)" }}>
                          ●
                        </span>
                        <span>{ch.title}</span>
                        <span style={{ fontSize: "0.6rem", opacity: 0.6 }}>({ch.tracks.length})</span>
                      </button>
                    );
                  })}
              </div>

              {/* Search & Offline Pre-Cache Row */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  margin: "0.3rem 0 0.45rem 0",
                  flexShrink: 0,
                }}
              >
                <div style={{ position: "relative", flex: 1 }}>
                  <input
                    type="text"
                    placeholder="Search all songs, artists..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.35rem 0.7rem",
                      paddingLeft: "1.7rem",
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
                      left: "0.55rem",
                      top: "50%",
                      transform: "translateY(-50%)",
                      fontSize: "0.68rem",
                      opacity: 0.5,
                      pointerEvents: "none",
                    }}
                  >
                    🔍
                  </span>
                </div>

                {/* Pre-Cache Button for Dead-Zones */}
                {selectedFolder !== "live-radio" && (
                  <button
                    onClick={handleCachePlaylist}
                    disabled={isCaching}
                    title="Pre-cache playlist for rural dead-zones"
                    style={{
                      flexShrink: 0,
                      padding: "0.35rem 0.65rem",
                      borderRadius: "9999px",
                      background: cacheStatus.includes("✅")
                        ? "rgba(16, 185, 129, 0.35)"
                        : "rgba(255, 255, 255, 0.12)",
                      border: cacheStatus.includes("✅")
                        ? "1px solid #10b981"
                        : "1px solid rgba(255, 255, 255, 0.22)",
                      color: cacheStatus.includes("✅") ? "#10b981" : "#ffffff",
                      fontSize: "0.66rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.3rem",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <span>💾</span>
                    <span>{cacheStatus || "Save Offline"}</span>
                  </button>
                )}
              </div>

              {/* Smooth Trackpad 2-Finger Scrollable Tracklist with data-lenis-prevent */}
              <div
                data-lenis-prevent="true"
                className="custom-apple-scrollbar"
                onWheel={(e) => e.stopPropagation()}
                style={{
                  flex: 1,
                  overflowY: "auto",
                  paddingRight: "0.25rem",
                  minHeight: 0,
                  overscrollBehavior: "contain",
                  touchAction: "pan-y",
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
                    No matching tracks found.
                  </div>
                ) : (
                  displayedTracks.map((track, idx) => {
                    const isCurrent = currentTrack?.id === track.id;
                    return (
                      <div
                        key={track.id}
                        onClick={() => {
                          playTrack(track);
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.75rem",
                          padding: "0.48rem 0.65rem",
                          borderRadius: "12px",
                          background: isCurrent
                            ? "linear-gradient(90deg, rgba(255, 255, 255, 0.24) 0%, rgba(255, 255, 255, 0.08) 100%)"
                            : "transparent",
                          border: isCurrent
                            ? "1px solid rgba(255, 255, 255, 0.35)"
                            : "1px solid transparent",
                          cursor: "pointer",
                          marginBottom: "0.25rem",
                          transition: "all 0.15s ease",
                        }}
                      >
                        {/* Index or Playing Icon */}
                        <div
                          style={{
                            width: "20px",
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
                            width: "36px",
                            height: "36px",
                            borderRadius: "8px",
                            objectFit: "cover",
                            boxShadow: "0 2px 6px rgba(0,0,0,0.4)",
                          }}
                        />

                        {/* Title & Artist */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: "0.80rem",
                              fontWeight: isCurrent ? 750 : 550,
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
                              fontSize: "0.66rem",
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

                        {/* Duration or Live Badge */}
                        <div
                          style={{
                            fontSize: "0.68rem",
                            fontFamily: "var(--font-mono, monospace)",
                            color: track.isLiveStream ? "#ef4444" : isCurrent ? "#38bdf8" : "rgba(255, 255, 255, 0.45)",
                            flexShrink: 0,
                            fontWeight: track.isLiveStream ? 700 : 400,
                          }}
                        >
                          {track.isLiveStream ? "LIVE" : formatTime(track.duration)}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Bottom Return Button */}
              <button
                onClick={handleFlipCard}
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  borderRadius: "12px",
                  background: "rgba(255, 255, 255, 0.12)",
                  border: "1px solid rgba(255, 255, 255, 0.22)",
                  color: "#ffffff",
                  fontSize: "0.74rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.4rem",
                  marginTop: "0.5rem",
                  flexShrink: 0,
                }}
              >
                <span>◀</span>
                <span>Return to Player Deck</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
