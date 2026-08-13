"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";

export default function AimScopeSimulator() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [target, setTarget] = useState({ x: 120, y: 70 });
  const [scopePos, setScopePos] = useState({ x: 120, y: 70 });
  const [isLocked, setIsLocked] = useState(false);

  // Smooth Interpolation for Crosshair Movement
  useEffect(() => {
    let animationFrameId: number;

    const updatePosition = () => {
      setScopePos((prev) => {
        const dx = target.x - prev.x;
        const dy = target.y - prev.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 4) {
          setIsLocked(true);
        } else {
          setIsLocked(false);
        }

        return {
          x: prev.x + dx * 0.12,
          y: prev.y + dy * 0.12,
        };
      });

      animationFrameId = requestAnimationFrame(updatePosition);
    };

    updatePosition();
    return () => cancelAnimationFrame(animationFrameId);
  }, [target]);

  // Mouse / Touch Interaction inside Scope Canvas
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setTarget({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: "transparent",
        borderRadius: "0px",
        position: "relative",
        overflow: "hidden",
        border: "none",
        cursor: "crosshair",
        padding: "0.2rem 0",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      {/* Tactical HUD Grid Overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(56, 189, 248, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(56, 189, 248, 0.08) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
          pointerEvents: "none",
        }}
      />

      {/* Target Red Point */}
      <motion.div
        animate={{ scale: isLocked ? [1, 1.4, 1] : 1 }}
        transition={{ repeat: Infinity, duration: 0.8 }}
        style={{
          position: "absolute",
          left: `${target.x}px`,
          top: `${target.y}px`,
          width: "8px",
          height: "8px",
          borderRadius: "50%",
          backgroundColor: "#ef4444",
          boxShadow: "0 0 10px #ef4444",
          transform: "translate(-50%, -50%)",
          pointerEvents: "none",
        }}
      />

      {/* Crosshair Scope */}
      <div
        style={{
          position: "absolute",
          left: `${scopePos.x}px`,
          top: `${scopePos.y}px`,
          width: "36px",
          height: "36px",
          borderRadius: "50%",
          border: isLocked ? "1.5px solid #22c55e" : "1.5px solid #38bdf8",
          transform: "translate(-50%, -50%)",
          pointerEvents: "none",
          boxShadow: isLocked ? "0 0 14px rgba(34, 197, 94, 0.6)" : "0 0 12px rgba(56, 189, 248, 0.4)",
          transition: "border-color 0.2s ease, box-shadow 0.2s ease",
        }}
      >
        {/* Reticle Lines */}
        <div style={{ position: "absolute", top: "50%", left: "-6px", width: "6px", height: "1px", backgroundColor: isLocked ? "#22c55e" : "#38bdf8" }} />
        <div style={{ position: "absolute", top: "50%", right: "-6px", width: "6px", height: "1px", backgroundColor: isLocked ? "#22c55e" : "#38bdf8" }} />
        <div style={{ position: "absolute", left: "50%", top: "-6px", width: "1px", height: "6px", backgroundColor: isLocked ? "#22c55e" : "#38bdf8" }} />
        <div style={{ position: "absolute", left: "50%", bottom: "-6px", width: "1px", height: "6px", backgroundColor: isLocked ? "#22c55e" : "#38bdf8" }} />
      </div>

      {/* Top Status */}
      <div style={{ position: "relative", zIndex: 5, display: "flex", justifyContent: "space-between", fontSize: "0.6rem", fontFamily: "monospace" }}>
        <span style={{ color: "#38bdf8", letterSpacing: "0.1em" }}>ZERØ AIM CROSSHAIR</span>
        <span style={{ color: isLocked ? "#22c55e" : "rgba(255,255,255,0.5)" }}>
          {isLocked ? "LOCK: ON" : "LOCK: SEARCHING"}
        </span>
      </div>

      {/* Bottom HUD Coordinates */}
      <div
        style={{
          position: "relative",
          zIndex: 5,
          fontFamily: "monospace",
          fontSize: "0.62rem",
          color: isLocked ? "#22c55e" : "#38bdf8",
          letterSpacing: "0.08em",
          lineHeight: 1,
        }}
      >
        [ TARGET_ACQUIRED: {Math.round(scopePos.x)}X {Math.round(scopePos.y)}Y ]
      </div>
    </div>
  );
}
