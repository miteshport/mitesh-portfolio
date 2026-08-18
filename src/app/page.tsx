"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CustomCursor from "@/components/CustomCursor";
import SpatialHUD from "@/components/SpatialHUD";
import F1GameCanvas, { TelemetryData } from "@/components/F1GameCanvas";
import { useSoundroom } from "@/context/SoundroomContext";
import {
  initF1Engine,
  updateF1Engine,
  stopF1Engine,
} from "@/utils/f1EngineAudio";

function formatLapTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(
    2,
    "0"
  )}.${String(ms).padStart(2, "0")}`;
}

export default function Home() {
  const [isLightsOut, setIsLightsOut] = useState(false);
  const [showCinematicTitle, setShowCinematicTitle] = useState(true);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasDeployed, setHasDeployed] = useState(false);
  const [gameResetKey, setGameResetKey] = useState(0);

  const [telemetry, setTelemetry] = useState<TelemetryData>({
    speed: 115,
    gear: 5,
    rpm: 10500,
    lapTime: 0,
    isBoosting: false,
    isDrifting: false,
    isFlying: false,
    isLightsOut: false,
    onKerb: false,
    currentSector: 1,
    sectorsCrossed: 0,
    score: 0,
    multiplier: 1,
    energy: 100,
    distanceRemaining: 1000,
    gameState: "PLAYING",
    nearMissCount: 0,
  });

  const { isMuted } = useSoundroom();

  // Initialize Web Audio Engine
  const triggerAudioInit = useCallback(() => {
    if (!hasInteracted) {
      setHasInteracted(true);
      initF1Engine();
    }
  }, [hasInteracted]);

  useEffect(() => {
    window.addEventListener("pointerdown", triggerAudioInit, { once: true });
    window.addEventListener("keydown", triggerAudioInit, { once: true });
    return () => {
      window.removeEventListener("pointerdown", triggerAudioInit);
      window.removeEventListener("keydown", triggerAudioInit);
      stopF1Engine();
    };
  }, [triggerAudioInit]);

  // 🍏 APPLE-GRADE AUTOMATIC LAUNCH (ZERO CLICKS REQUIRED)
  useEffect(() => {
    if (isLoaded || loadProgress >= 100) {
      const autoLaunchTimer = setTimeout(() => {
        setHasDeployed(true);
        triggerAudioInit();
      }, 500);
      return () => clearTimeout(autoLaunchTimer);
    }
  }, [isLoaded, loadProgress, triggerAudioInit]);

  // Update Procedural Engine Sound in real-time
  useEffect(() => {
    if (hasInteracted) {
      updateF1Engine(
        telemetry.rpm,
        telemetry.speed,
        telemetry.isBoosting,
        isMuted
      );
    }
  }, [
    telemetry.rpm,
    telemetry.speed,
    telemetry.isBoosting,
    isMuted,
    hasInteracted,
  ]);

  // Auto-hide Cinematic Title after 3.5s
  useEffect(() => {
    if (hasDeployed) {
      const timer = setTimeout(() => {
        setShowCinematicTitle(false);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [hasDeployed]);

  const restartPatrol = () => {
    setGameResetKey((k) => k + 1);
  };

  return (
    <main
      onClick={triggerAudioInit}
      style={{
        width: "100vw",
        height: "100dvh",
        backgroundColor: "#000000",
        color: "#ffffff",
        position: "relative",
        overflow: "hidden",
        fontFamily: "var(--font-apple)",
        userSelect: "none",
      }}
    >
      <CustomCursor />

      {/* 3D WebGL Batmobile Road Fighter Canvas */}
      <F1GameCanvas
        isLightsOut={isLightsOut}
        isMuted={isMuted}
        gameResetKey={gameResetKey}
        onTelemetryUpdate={setTelemetry}
        onLoadProgress={(p) => {
          setLoadProgress(p);
          if (p >= 100) setIsLoaded(true);
        }}
        onLoadComplete={() => {
          setIsLoaded(true);
          setLoadProgress(100);
        }}
      />

      {/* 🍏 APPLE-GRADE LUXURY AUTO-SPLASH (SEAMLESS DISSOLVE, ZERO CLICKS) */}
      <AnimatePresence>
        {!hasDeployed && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{
              opacity: 0,
              scale: 1.05,
              filter: "blur(8px)",
              transition: { duration: 0.85, ease: [0.16, 1, 0.3, 1] },
            }}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100dvh",
              zIndex: 1400,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              background: "#020408",
              color: "#ffffff",
              fontFamily: "var(--font-mono, monospace)",
              userSelect: "none",
              padding: "clamp(1.5rem, 4vw, 3rem)",
              boxSizing: "border-box",
            }}
          >
            {/* Top Identity */}
            <div
              style={{
                position: "absolute",
                top: "clamp(2rem, 4vw, 3rem)",
                fontSize: "clamp(0.70rem, 1.2vw, 0.82rem)",
                letterSpacing: "0.32em",
                textTransform: "uppercase",
                color: "#ffffff",
                opacity: 0.9,
              }}
            >
              PORTFOLIO <span style={{ color: "#38bdf8" }}>/ MITESH SHAH</span>
            </div>

            {/* Center: Glowing Gotham Bat-Signal Vector */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "1.8rem",
              }}
            >
              <motion.div
                animate={{
                  scale: [0.96, 1.04, 0.96],
                  opacity: [0.85, 1, 0.85],
                }}
                transition={{ repeat: Infinity, duration: 2.4, ease: "easeInOut" }}
                style={{
                  width: "90px",
                  height: "90px",
                  borderRadius: "50%",
                  background: "radial-gradient(circle, rgba(56,189,248,0.18) 0%, rgba(2,4,8,0) 70%)",
                  border: "1px solid rgba(56, 189, 248, 0.35)",
                  boxShadow: "0 0 35px rgba(56, 189, 248, 0.4)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg width="56" height="32" viewBox="0 0 800 350" fill="#38bdf8">
                  <path d="M 400 0 C 418 36, 442 48, 470 54 C 540 10, 680 20, 780 120 C 720 150, 640 135, 590 190 C 620 240, 690 270, 800 290 C 690 320, 560 300, 480 230 C 460 270, 420 310, 400 350 C 380 310, 340 270, 320 230 C 240 300, 110 320, 0 290 C 110 270, 180 240, 210 190 C 160 135, 80 150, 20 120 C 120 20, 260 10, 330 54 C 358 48, 382 36, 400 0 Z" />
                </svg>
              </motion.div>

              {/* Hairline Apple Loading Bar */}
              <div
                style={{
                  width: "clamp(200px, 40vw, 320px)",
                  height: "2px",
                  background: "rgba(255, 255, 255, 0.10)",
                  borderRadius: "999px",
                  overflow: "hidden",
                  position: "relative",
                }}
              >
                <motion.div
                  style={{
                    height: "100%",
                    background: "linear-gradient(90deg, #0284c7, #38bdf8, #ffffff)",
                    boxShadow: "0 0 12px rgba(56, 189, 248, 0.8)",
                    borderRadius: "999px",
                  }}
                  animate={{ width: `${loadProgress}%` }}
                  transition={{ ease: "easeOut", duration: 0.2 }}
                />
              </div>

              <div
                style={{
                  fontSize: "0.68rem",
                  letterSpacing: "0.24em",
                  color: "#38bdf8",
                  textTransform: "uppercase",
                }}
              >
                {loadProgress >= 100 ? "DEPLOYING TUMBLER..." : `INITIALIZING TURBINES: ${loadProgress}%`}
              </div>
            </div>

            {/* Bottom Subtitle */}
            <div
              style={{
                position: "absolute",
                bottom: "clamp(2rem, 4vw, 3rem)",
                fontSize: "0.65rem",
                letterSpacing: "0.20em",
                color: "rgba(255, 255, 255, 0.45)",
                textTransform: "uppercase",
              }}
            >
              WAYNETECH 1000M PATROL · ROAD FIGHTER
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HOLLYWOOD OPENING TITLE (Fades out after 3.5s) */}
      <AnimatePresence>
        {hasDeployed && showCinematicTitle && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{
              opacity: 0,
              y: -20,
              transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
            }}
            transition={{ duration: 1.0, ease: "easeOut" }}
            style={{
              position: "fixed",
              top: "22%",
              left: 0,
              right: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none",
              zIndex: 35,
              textAlign: "center",
              padding: "0 1.5rem",
            }}
          >
            <div
              style={{
                fontSize: "0.68rem",
                fontWeight: 750,
                letterSpacing: "0.38em",
                color: "#38bdf8",
                textTransform: "uppercase",
                marginBottom: "0.65rem",
                textShadow: "0 0 16px rgba(56, 189, 248, 0.6)",
              }}
            >
              WAYNE ENTERPRISES · BATMOBILE TUMBLER
            </div>
            <h1
              style={{
                fontSize: "clamp(2.2rem, 6vw, 4.5rem)",
                fontWeight: 850,
                letterSpacing: "-0.035em",
                lineHeight: 0.95,
                color: "#ffffff",
                textTransform: "uppercase",
                margin: 0,
                textShadow: "0 10px 40px rgba(0, 0, 0, 0.9)",
              }}
            >
              Mitesh Shah
            </h1>
            <div
              style={{
                marginTop: "0.75rem",
                fontSize: "0.72rem",
                fontWeight: 500,
                letterSpacing: "0.18em",
                color: "rgba(255, 255, 255, 0.55)",
                textTransform: "uppercase",
              }}
            >
              GOTHAM CITY · 1000M PATROL · ROAD FIGHTER
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- 🏁 VICTORY MODAL (PATROL COMPLETE // GOTHAM SECURED) --- */}
      <AnimatePresence>
        {telemetry.gameState === "WON" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100dvh",
              zIndex: 1300,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(0, 0, 0, 0.88)",
              backdropFilter: "blur(20px)",
              fontFamily: "var(--font-mono, monospace)",
              padding: "2rem",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: "0.75rem",
                letterSpacing: "0.3em",
                color: "#38bdf8",
                textTransform: "uppercase",
                marginBottom: "0.6rem",
              }}
            >
              WAYNETECH MISSION REPORT
            </div>
            <h2
              style={{
                fontSize: "clamp(1.8rem, 4vw, 3rem)",
                fontWeight: 900,
                color: "#ffffff",
                letterSpacing: "-0.02em",
                textTransform: "uppercase",
                margin: "0 0 1.5rem 0",
              }}
            >
              PATROL COMPLETE · GOTHAM SECURED
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "1.5rem",
                marginBottom: "2.5rem",
                maxWidth: "600px",
                width: "100%",
              }}
            >
              <div style={{ border: "1px solid rgba(255,255,255,0.15)", borderRadius: "12px", padding: "1rem" }}>
                <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.5)", textTransform: "uppercase" }}>FINAL SCORE</div>
                <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#ffffff", marginTop: "0.3rem" }}>{telemetry.score.toLocaleString()}</div>
              </div>
              <div style={{ border: "1px solid rgba(255,255,255,0.15)", borderRadius: "12px", padding: "1rem" }}>
                <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.5)", textTransform: "uppercase" }}>NEAR-MISSES</div>
                <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#38bdf8", marginTop: "0.3rem" }}>{telemetry.nearMissCount}</div>
              </div>
              <div style={{ border: "1px solid rgba(255,255,255,0.15)", borderRadius: "12px", padding: "1rem" }}>
                <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.5)", textTransform: "uppercase" }}>BATTERY LEFT</div>
                <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#10b981", marginTop: "0.3rem" }}>{telemetry.energy}%</div>
              </div>
            </div>

            <button
              onClick={restartPatrol}
              style={{
                padding: "0.9rem 2.2rem",
                borderRadius: "999px",
                background: "#38bdf8",
                color: "#020408",
                border: "none",
                fontWeight: 800,
                fontSize: "0.82rem",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                cursor: "pointer",
                boxShadow: "0 0 25px rgba(56, 189, 248, 0.6)",
                transition: "all 0.2s ease",
              }}
            >
              PATROL AGAIN
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- ⚠️ DEFEAT MODAL (BATTERY DEPLETED) --- */}
      <AnimatePresence>
        {telemetry.gameState === "LOST" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100dvh",
              zIndex: 1300,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(0, 0, 0, 0.88)",
              backdropFilter: "blur(20px)",
              fontFamily: "var(--font-mono, monospace)",
              padding: "2rem",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: "0.75rem",
                letterSpacing: "0.3em",
                color: "#ef4444",
                textTransform: "uppercase",
                marginBottom: "0.6rem",
              }}
            >
              WARNING // TURBINE STALL
            </div>
            <h2
              style={{
                fontSize: "clamp(1.8rem, 4vw, 3rem)",
                fontWeight: 900,
                color: "#ffffff",
                letterSpacing: "-0.02em",
                textTransform: "uppercase",
                margin: "0 0 1.5rem 0",
              }}
            >
              BATTERY DEPLETED · PATROL FAILED
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: "1.5rem",
                marginBottom: "2.5rem",
                maxWidth: "400px",
                width: "100%",
              }}
            >
              <div style={{ border: "1px solid rgba(255,255,255,0.15)", borderRadius: "12px", padding: "1rem" }}>
                <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.5)", textTransform: "uppercase" }}>DISTANCE REACHED</div>
                <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#ef4444", marginTop: "0.3rem" }}>{1000 - telemetry.distanceRemaining}m / 1000m</div>
              </div>
              <div style={{ border: "1px solid rgba(255,255,255,0.15)", borderRadius: "12px", padding: "1rem" }}>
                <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.5)", textTransform: "uppercase" }}>SCORE</div>
                <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#ffffff", marginTop: "0.3rem" }}>{telemetry.score.toLocaleString()}</div>
              </div>
            </div>

            <button
              onClick={restartPatrol}
              style={{
                padding: "0.9rem 2.2rem",
                borderRadius: "999px",
                background: "#ef4444",
                color: "#ffffff",
                border: "none",
                fontWeight: 800,
                fontSize: "0.82rem",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                cursor: "pointer",
                boxShadow: "0 0 25px rgba(239, 68, 68, 0.6)",
                transition: "all 0.2s ease",
              }}
            >
              RETRY PATROL
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4-CORNER SPATIAL HUD */}
      <SpatialHUD
        isLightsOut={isLightsOut}
        onToggleLightsOut={() => setIsLightsOut((prev) => !prev)}
        bottomLeftExtra={
          <div
            style={{
              fontFamily: "var(--font-mono, monospace)",
              fontSize: "clamp(0.65rem, 1.1vw, 0.75rem)",
              letterSpacing: "0.12em",
              color: "rgba(255, 255, 255, 0.8)",
              textTransform: "uppercase",
              lineHeight: 1.6,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: "0.6rem",
              }}
            >
              <span
                style={{
                  fontSize: "1.4rem",
                  fontWeight: 800,
                  color: telemetry.isBoosting ? "#38bdf8" : "#ffffff",
                  letterSpacing: "-0.02em",
                }}
              >
                {telemetry.speed}
              </span>
              <span
                style={{
                  fontSize: "0.65rem",
                  color: "rgba(255,255,255,0.45)",
                }}
              >
                KM/H
              </span>
              <span
                style={{
                  marginLeft: "0.4rem",
                  color: telemetry.isBoosting ? "#38bdf8" : "rgba(255,255,255,0.6)",
                  fontWeight: telemetry.isBoosting ? 700 : 500,
                }}
              >
                {telemetry.distanceRemaining}M TO BATCAVE
              </span>
            </div>
            <div
              style={{
                fontSize: "0.62rem",
                color: "rgba(255, 255, 255, 0.45)",
              }}
            >
              GOTHAM SECTOR 1 · PATROL {formatLapTime(telemetry.lapTime)}
            </div>
          </div>
        }
        bottomRightExtra={
          <div
            style={{
              fontFamily: "var(--font-mono, monospace)",
              display: "flex",
              alignItems: "baseline",
              gap: "0.85rem",
              fontSize: "clamp(0.68rem, 1.1vw, 0.78rem)",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "#ffffff",
              pointerEvents: "none",
            }}
          >
            <div>
              <span style={{ color: telemetry.energy < 25 ? "#ef4444" : "rgba(255, 255, 255, 0.45)", fontSize: "0.62rem" }}>
                BATTERY {telemetry.energy}% ·{" "}
              </span>
              <span style={{ color: "rgba(255, 255, 255, 0.45)", fontSize: "0.62rem" }}>SCORE </span>
              <span style={{ fontSize: "1.3rem", fontWeight: 850, letterSpacing: "-0.02em", color: "#ffffff" }}>
                {telemetry.score.toLocaleString()}
              </span>
            </div>
            {telemetry.multiplier > 1 && (
              <div
                style={{
                  padding: "0.15rem 0.5rem",
                  borderRadius: "6px",
                  background: "rgba(56, 189, 248, 0.16)",
                  border: "1px solid rgba(56, 189, 248, 0.4)",
                  color: "#38bdf8",
                  fontWeight: 750,
                  fontSize: "0.68rem",
                }}
              >
                x{telemetry.multiplier} STREAK
              </div>
            )}
          </div>
        }
      />
    </main>
  );
}
