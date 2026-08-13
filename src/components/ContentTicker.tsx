"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const STREAMS = {
  PUBLISHING: [
    "Digital Publishing Wisdom & Literature Architecture",
    "Empowering Public Access via Modern EdTech Systems",
    "Knowledge Structuring for High-Scale Content Networks",
  ],
  SYSTEMS: [
    "Enterprise System Architecture & Fail-Safe Protocols",
    "Sub-Millisecond Data Pipelines & Cloud Infrastructure",
    "High-Availability Node Clusters & Load Distribution",
  ],
  ARCHITECTURE: [
    "Awwwards-Tier UI/UX System Mechanics & Kinetic Shader Design",
    "GPU-Accelerated WebGL Physics & 120fps Rendering",
    "Subtractive Luxury Design: Perfection via Elimination",
  ],
};

type StreamCategory = keyof typeof STREAMS;

export default function ContentTicker() {
  const [category, setCategory] = useState<StreamCategory>("PUBLISHING");
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % STREAMS[category].length);
    }, 3500);
    return () => clearInterval(timer);
  }, [category]);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: "transparent",
        borderRadius: "0px",
        border: "none",
        padding: "0.2rem 0",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        overflow: "hidden",
      }}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .ticker-tab-btn {
          font-family: monospace;
          font-size: 0.55rem;
          padding: 0.1rem 0.4rem;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        @media (max-width: 420px) {
          .ticker-tab-btn {
            font-size: 0.46rem !important;
            padding: 0.08rem 0.2rem !important;
          }
          .ticker-tabs-wrap {
            flex-wrap: wrap !important;
            gap: 0.2rem !important;
          }
        }
      `,
        }}
      />

      {/* Header & Monospace Interactive Category Tabs (ZERO EMOJIS) */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#22c55e", boxShadow: "0 0 8px #22c55e" }} />
          <span
            style={{
              fontFamily: "monospace",
              fontSize: "0.6rem",
              color: "rgba(255, 255, 255, 0.45)",
              letterSpacing: "0.08em",
            }}
          >
            FEED // PRATYAKSH_GYAN
          </span>
        </div>

        {/* Category Tabs */}
        <div className="ticker-tabs-wrap" style={{ display: "flex", gap: "0.3rem" }}>
          {(["PUBLISHING", "SYSTEMS", "ARCHITECTURE"] as StreamCategory[]).map((cat) => (
            <button
              key={cat}
              onClick={(e) => {
                e.stopPropagation();
                setCategory(cat);
                setIndex(0);
              }}
              className="ticker-tab-btn"
              style={{
                backgroundColor: category === cat ? "rgba(34, 197, 94, 0.15)" : "transparent",
                border: category === cat ? "1px solid #22c55e" : "1px solid rgba(255, 255, 255, 0.1)",
                color: category === cat ? "#22c55e" : "rgba(255, 255, 255, 0.4)",
              }}
            >
              [ {cat} ]
            </button>
          ))}
        </div>
      </div>

      {/* Pure High-Tech Monospace Typewriter Stream */}
      <div style={{ position: "relative", height: "45px", marginTop: "0.4rem", overflow: "hidden" }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={`${category}-${index}`}
            initial={{ y: 15, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -15, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: "absolute",
              width: "100%",
              color: "#22c55e",
              fontFamily: "monospace",
              fontSize: "0.75rem",
              lineHeight: 1.4,
              letterSpacing: "0.02em",
            }}
          >
            [✓] {STREAMS[category][index]}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
