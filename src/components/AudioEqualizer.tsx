"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";

export default function AudioEqualizer() {
  const barCount = 18;
  const [isLive, setIsLive] = useState(true);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const [barHeights, setBarHeights] = useState<number[]>(Array(barCount).fill(30));

  // 60fps Harmonic DSP Sine Waveform Engine (Zero Random Noise!)
  useEffect(() => {
    let animationFrameId: number;
    let startTime = Date.now();

    const animate = () => {
      if (isLive) {
        const elapsed = (Date.now() - startTime) * 0.003;
        const newHeights = Array.from({ length: barCount }, (_, i) => {
          // Overlapping Harmonic Wave Equations
          const wave1 = Math.sin(elapsed * 1.8 + i * 0.45) * 30;
          const wave2 = Math.cos(elapsed * 1.1 + i * 0.25) * 20;
          const base = 35 + wave1 + wave2;

          // If hovered, boost local DJ frequency fader band
          if (hoveredIdx !== null) {
            const dist = Math.abs(i - hoveredIdx);
            if (dist < 3) {
              const boost = (3 - dist) * 18;
              return Math.min(Math.max(base + boost, 15), 98);
            }
          }

          return Math.min(Math.max(base, 12), 92);
        });

        setBarHeights(newHeights);
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isLive, hoveredIdx]);

  return (
    <div
      ref={containerRef}
      onMouseLeave={() => setHoveredIdx(null)}
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: "transparent",
        borderRadius: "0px",
        padding: "0.2rem 0",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        border: "none",
        overflow: "hidden",
      }}
    >
      {/* Header & Controls (ZERO EMOJIS) */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <motion.span
            animate={{ opacity: isLive ? [0.3, 1, 0.3] : 0.3 }}
            transition={{ duration: 1.2, repeat: Infinity }}
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              backgroundColor: isLive ? "#f59e0b" : "rgba(255, 255, 255, 0.3)",
              boxShadow: isLive ? "0 0 8px #f59e0b" : "none",
            }}
          />
          <span
            style={{
              fontFamily: "monospace",
              fontSize: "0.6rem",
              color: isLive ? "#f59e0b" : "rgba(255, 255, 255, 0.4)",
              letterSpacing: "0.1em",
              fontWeight: "bold",
            }}
          >
            {isLive ? "LIVE STREAM // 4K ULTRA HD" : "STREAM // PAUSED"}
          </span>
        </div>

        {/* Live / Pause Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsLive((prev) => !prev);
          }}
          style={{
            backgroundColor: "rgba(245, 158, 11, 0.15)",
            border: "1px solid #f59e0b",
            color: "#f59e0b",
            fontFamily: "monospace",
            fontSize: "0.55rem",
            padding: "0.1rem 0.4rem",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          {isLive ? "[ PAUSE ]" : "[ PLAY ]"}
        </button>
      </div>

      {/* Harmonic DSP Audio Spectrum Bars */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          height: "60px",
          gap: "3px",
          marginTop: "0.4rem",
        }}
      >
        {barHeights.map((h, idx) => {
          const isHovered = hoveredIdx === idx;
          const isViolet = idx % 2 === 0;

          return (
            <motion.div
              key={idx}
              onMouseEnter={() => setHoveredIdx(idx)}
              style={{
                flex: 1,
                height: `${h}%`,
                backgroundColor: isHovered ? "#22c55e" : isViolet ? "#a855f7" : "#f59e0b",
                borderRadius: "3px 3px 0 0",
                boxShadow: isHovered
                  ? "0 0 14px #22c55e"
                  : isViolet
                  ? "0 0 8px rgba(168, 85, 247, 0.4)"
                  : "0 0 8px rgba(245, 158, 11, 0.4)",
                cursor: "pointer",
                transition: "background-color 0.15s ease, box-shadow 0.15s ease",
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
