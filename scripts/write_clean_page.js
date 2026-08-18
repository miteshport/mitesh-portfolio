const fs = require('fs');

const pageCode = `"use client";

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
  return \`\${String(mins).padStart(2, "0")}:\${String(secs).padStart(
    2,
    "0"
  )}.\${String(ms).padStart(2, "0")}\`;
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
    gameState: "BRIEFING",
    nearMissCount: 0,
  });

  const { isMuted } = useSoundroom();

  // Initialize Procedural Web Audio Engine on first gesture
  const handleUserGesture = useCallback(() => {
    if (!hasInteracted) {
      setHasInteracted(true);
      initF1Engine();
    }
  }, [hasInteracted]);

  useEffect(() => {
    window.addEventListener("pointerdown", handleUserGesture, { once: true });
    window.addEventListener("keydown", handleUserGesture, { once: true });
    return () => {
      window.removeEventListener("pointerdown", handleUserGesture);
      window.removeEventListener("keydown", handleUserGesture);
      stopF1Engine();
    };
  }, [handleUserGesture]);

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

  // Auto-hide Cinematic Title after 4s or on interaction
  useEffect(() => {
    if (
      telemetry.isBoosting ||
      telemetry.isFlying ||
      Math.abs(telemetry.speed - 190) > 10
    ) {
      setShowCinematicTitle(false);
    }
    const timer = setTimeout(() => {
      setShowCinematicTitle(false);
    }, 4000);
    return () => clearTimeout(timer);
  }, [telemetry.isBoosting, telemetry.isFlying, telemetry.speed]);

  const restartPatrol = () => {
    setGameResetKey((k) => k + 1);
  };

  return (
    <main
      onClick={handleUserGesture}
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

      {/* Grounded 3-Lane Road Fighter Canvas */}
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

      {/* HOLLYWOOD OPENING TITLE (Fades out gracefully) */}
      <AnimatePresence>
        {showCinematicTitle && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{
              opacity: 0,
              y: -20,
              transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
            }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            style={{
              position: "fixed",
              top: "24%",
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

      {/* --- 🦇 WAYNETECH 5-LIGHT TACTICAL LAUNCH GANTRY (YUTA ABE SPATIAL MINIMALISM) --- */}
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
              GOTHAM PATROL <span style={{ color: "#38bdf8" }}>· 1000M MISSION</span>
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

            {/* Bottom Center: Interactive Launch Prompt */}
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
                STEER: A / D / ARROWS  ·  DODGE: RED TRAFFIC  ·  HUNT: CYAN FUEL CORES
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
              <div style={{ color: "#38bdf8" }}>1000M PATROL</div>
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
`;

fs.writeFileSync('src/app/page.tsx', pageCode, 'utf8');
console.log('src/app/page.tsx updated with 1000m Road Fighter Round, Win/Loss Overlays, and Clean Reset!');
