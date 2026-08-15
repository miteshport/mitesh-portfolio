"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { audio } from "@/utils/audioSystem";

export default function SystemClock() {
  const [timeStr, setTimeStr] = useState<string>("");
  const [isAudioActive, setIsAudioActive] = useState<boolean>(true);
  const [pingMs, setPingMs] = useState<number>(2);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hrs = String(now.getHours()).padStart(2, "0");
      const mins = String(now.getMinutes()).padStart(2, "0");
      const secs = String(now.getSeconds()).padStart(2, "0");
      setTimeStr(`${hrs}:${mins}:${secs}`);
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);

    // Dynamic Micro-Ping fluctuation (2ms - 4ms)
    const pingTimer = setInterval(() => {
      setPingMs(Math.floor(2 + Math.random() * 3));
    }, 4000);

    return () => {
      clearInterval(timer);
      clearInterval(pingTimer);
    };
  }, []);

  const handleAudioToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newState = audio.toggleMute();
    setIsAudioActive(newState);
    if (newState) {
      audio.playClick();
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: "1.1rem",
        left: "2rem",
        zIndex: 9999,
        pointerEvents: "auto",
        display: "flex",
        alignItems: "center",
        gap: "0.6rem",
      }}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media (max-width: 768px) {
          .system-clock-container {
            top: 0.8rem !important;
            left: 50% !important;
            transform: translateX(-50%) !important;
            gap: 0.4rem !important;
          }
          .system-clock-pill {
            padding: 0.25rem 0.6rem !important;
          }
          .system-clock-text {
            font-size: 0.58rem !important;
          }
          .edge-telemetry-badge {
            display: none !important;
          }
        }
      `,
        }}
      />

      <div className="system-clock-container" style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
        {/* Main Status & Clock Pill */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="system-clock-pill"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.6rem",
            backgroundColor: "rgba(10, 8, 22, 0.82)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            borderRadius: "9999px",
            padding: "0.35rem 0.85rem",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            boxShadow: "0 10px 25px rgba(0, 0, 0, 0.4)",
          }}
        >
          <span
            style={{
              width: "7px",
              height: "7px",
              borderRadius: "50%",
              backgroundColor: "#22c55e",
              boxShadow: "0 0 8px #22c55e",
              display: "inline-block",
            }}
          />
          <span
            className="system-clock-text"
            style={{
              fontFamily: "monospace",
              fontSize: "0.68rem",
              letterSpacing: "0.12em",
              color: "rgba(255, 255, 255, 0.85)",
              textTransform: "uppercase",
              fontWeight: 600,
            }}
          >
            SYS: OPTIMAL
          </span>
          <span
            className="system-clock-text"
            style={{
              fontFamily: "monospace",
              fontSize: "0.68rem",
              color: "#22c55e",
              letterSpacing: "0.08em",
            }}
          >
            {timeStr}
          </span>
        </motion.div>

        {/* Live Global Edge Latency Telemetry */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="edge-telemetry-badge"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
            backgroundColor: "rgba(10, 8, 22, 0.75)",
            border: "1px solid rgba(56, 189, 248, 0.2)",
            borderRadius: "9999px",
            padding: "0.35rem 0.75rem",
            backdropFilter: "blur(16px)",
            fontFamily: "monospace",
            fontSize: "0.65rem",
            letterSpacing: "0.08em",
            color: "rgba(255, 255, 255, 0.75)",
          }}
        >
          <span>EDGE: IAD1</span>
          <span style={{ color: "#38bdf8" }}>{pingMs}ms</span>
        </motion.div>

        {/* Soundscape Control Button */}
        <motion.button
          onClick={handleAudioToggle}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.35rem",
            backgroundColor: isAudioActive ? "rgba(34, 197, 94, 0.12)" : "rgba(255, 255, 255, 0.05)",
            border: isAudioActive ? "1px solid rgba(34, 197, 94, 0.4)" : "1px solid rgba(255, 255, 255, 0.15)",
            borderRadius: "9999px",
            padding: "0.35rem 0.65rem",
            backdropFilter: "blur(16px)",
            color: isAudioActive ? "#22c55e" : "rgba(255, 255, 255, 0.4)",
            fontFamily: "monospace",
            fontSize: "0.62rem",
            letterSpacing: "0.08em",
            cursor: "pointer",
            textTransform: "uppercase",
          }}
        >
          <span>[ AUDIO: {isAudioActive ? "ON" : "OFF"} ]</span>
        </motion.button>
      </div>
    </div>
  );
}
