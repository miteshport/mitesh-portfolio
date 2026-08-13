"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

export default function SystemClock() {
  const [timeStr, setTimeStr] = useState<string>("");

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
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        top: "1.1rem",
        left: "2rem",
        zIndex: 9999,
        pointerEvents: "auto",
      }}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media (max-width: 768px) {
          .system-clock-pill {
            top: 0.8rem !important;
            left: 50% !important;
            transform: translateX(-50%) !important;
            padding: 0.25rem 0.6rem !important;
          }
          .system-clock-text {
            font-size: 0.6rem !important;
          }
        }
      `,
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="system-clock-pill"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.6rem",
          backgroundColor: "rgba(10, 8, 22, 0.75)",
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
    </div>
  );
}
