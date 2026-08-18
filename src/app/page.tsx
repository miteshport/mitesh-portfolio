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

  const [telemetry, setTelemetry] = useState<TelemetryData>({
    speed: 190,
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
    cargoStack: [],
    score: 0,
    multiplier: 1,
    lastMergeVal: 0,
    isOverloaded: false,
    isHyperCharged: false,
    targetMatch: null,
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

  const sectorName =
    telemetry.currentSector === 1
      ? "GOTHAM SECTOR 1 // TURBINE CRUISE"
      : telemetry.currentSector === 2
      ? "GOTHAM SECTOR 2 // STEALTH PURSUIT"
      : "GOTHAM SECTOR 3 // AFTERBURNER ENGAGED";

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

      {/* 10/10 Gold-Standard 3D WebGL F1 Racing Canvas */}
      <F1GameCanvas
        isLightsOut={isLightsOut}
        isMuted={isMuted}
        onTelemetryUpdate={setTelemetry}
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
              GOTHAM CITY · 365 KM/H · TURBINE AFTERBURNER
            </div>
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
                {telemetry.isBoosting ? "AFTERBURNER" : `GEAR ${telemetry.gear}`}
              </span>
            </div>
            <div
              style={{
                fontSize: "0.62rem",
                color: "rgba(255, 255, 255, 0.45)",
              }}
            >
              {sectorName} · PATROL {formatLapTime(telemetry.lapTime)}
            </div>
          </div>
        }
        bottomRightExtra={
          <div
            style={{
              fontFamily: "var(--font-mono, monospace)",
              fontSize: "clamp(0.65rem, 1.1vw, 0.75rem)",
              letterSpacing: "0.10em",
              color: "rgba(255, 255, 255, 0.9)",
              textTransform: "uppercase",
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              gap: "0.35rem",
              background: "rgba(6, 10, 18, 0.82)",
              backdropFilter: "blur(24px) saturate(180%)",
              WebkitBackdropFilter: "blur(24px) saturate(180%)",
              border: telemetry.isOverloaded
                ? "1px solid rgba(239, 68, 68, 0.6)"
                : telemetry.isHyperCharged
                ? "1px solid rgba(56, 189, 248, 0.8)"
                : "1px solid rgba(255, 255, 255, 0.14)",
              borderRadius: "16px",
              padding: "0.6rem 0.85rem",
              boxShadow: telemetry.isOverloaded
                ? "0 0 20px rgba(239, 68, 68, 0.4)"
                : "0 10px 30px rgba(0,0,0,0.6)",
              minWidth: "160px",
              pointerEvents: "auto",
            }}
          >
            {/* Header: Score & Multiplier */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
                gap: "0.8rem",
              }}
            >
              <span style={{ fontSize: "0.62rem", color: "rgba(255, 255, 255, 0.5)" }}>
                WAYNETECH 2048
              </span>
              <span
                style={{
                  fontSize: "0.65rem",
                  fontWeight: 700,
                  color: telemetry.multiplier > 1 ? "#38bdf8" : "rgba(255,255,255,0.6)",
                  background: telemetry.multiplier > 1 ? "rgba(56, 189, 248, 0.18)" : "transparent",
                  padding: "0.1rem 0.35rem",
                  borderRadius: "4px",
                }}
              >
                {telemetry.multiplier > 1 ? `x${telemetry.multiplier} COMBO` : "x1"}
              </span>
            </div>

            {/* Score */}
            <div
              style={{
                fontSize: "1.15rem",
                fontWeight: 800,
                color: "#ffffff",
                letterSpacing: "-0.02em",
              }}
            >
              {telemetry.score.toLocaleString()}{" "}
              <span style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.4)" }}>PTS</span>
            </div>

            {/* Overload / Supercharge Alert Bar */}
            {telemetry.isOverloaded && (
              <div style={{ fontSize: "0.58rem", color: "#ef4444", fontWeight: 750, letterSpacing: "0.06em" }}>
                ⚠️ REACTOR OVERLOAD (HEAVY DRAG)
              </div>
            )}
            {telemetry.isHyperCharged && (
              <div style={{ fontSize: "0.58rem", color: "#38bdf8", fontWeight: 750, letterSpacing: "0.06em" }}>
                ⚡ HYPER-CORE AFTERBURNER
              </div>
            )}

            {/* Vertical LIFO Stack Container */}
            <div
              style={{
                display: "flex",
                flexDirection: "column-reverse",
                gap: "0.25rem",
                width: "100%",
                marginTop: "0.2rem",
                borderTop: "1px solid rgba(255, 255, 255, 0.1)",
                paddingTop: "0.35rem",
              }}
            >
              {telemetry.cargoStack.length === 0 ? (
                <div
                  style={{
                    fontSize: "0.60rem",
                    color: "rgba(255,255,255,0.35)",
                    textAlign: "center",
                    padding: "0.2rem 0",
                  }}
                >
                  STACK EMPTY · RAM [2] / [4]
                </div>
              ) : (
                telemetry.cargoStack.map((val, idx) => {
                  const isTop = idx === telemetry.cargoStack.length - 1;
                  const colorMap: Record<number, string> = {
                    2: "#38bdf8",
                    4: "#3b82f6",
                    8: "#8b5cf6",
                    16: "#ec4899",
                    32: "#f59e0b",
                    64: "#10b981",
                    128: "#ef4444",
                    256: "#06b6d4",
                    512: "#a855f7",
                    1024: "#ffffff",
                    2048: "#ffd700",
                  };
                  const hex = colorMap[val] || "#38bdf8";

                  return (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "0.22rem 0.55rem",
                        borderRadius: "8px",
                        background: isTop ? "rgba(255, 255, 255, 0.15)" : "rgba(255, 255, 255, 0.05)",
                        border: isTop ? `1px solid ${hex}` : "1px solid rgba(255, 255, 255, 0.1)",
                        boxShadow: isTop ? `0 0 10px ${hex}55` : "none",
                        transition: "all 0.2s ease",
                      }}
                    >
                      <span style={{ fontSize: "0.62rem", color: isTop ? "#ffffff" : "rgba(255,255,255,0.5)" }}>
                        {isTop ? "🎯 TARGET" : `SLOT ${idx + 1}`}
                      </span>
                      <span
                        style={{
                          fontSize: "0.78rem",
                          fontWeight: 850,
                          color: hex,
                          fontFamily: "var(--font-mono, monospace)",
                        }}
                      >
                        [{val}]
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        }
      />
    </main>
  );
}