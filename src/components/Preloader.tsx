"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Preloader({ onComplete }: { onComplete?: () => void }) {
  const [phase, setPhase] = useState<"silent" | "pixelWipe" | "complete">("silent");

  useEffect(() => {
    // Phase 1: Apple Silent Boot for 1.6 seconds
    const timer1 = setTimeout(() => {
      setPhase("pixelWipe");
    }, 1600);

    // Phase 2: Yuta Abe 8-Bit Pixel Wipe for 600ms
    const timer2 = setTimeout(() => {
      setPhase("complete");
      if (onComplete) onComplete();
    }, 2200);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [onComplete]);

  if (phase === "complete") return null;

  return (
    <AnimatePresence>
      <motion.div
        key="preloader"
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "#06040c",
          zIndex: 99999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        <style
          dangerouslySetInnerHTML={{
            __html: `
          @keyframes silentPulse {
            0%, 100% {
              transform: scale(0.96);
              opacity: 0.7;
            }
            50% {
              transform: scale(1.04);
              opacity: 1;
            }
          }
        `,
          }}
        />

        {/* PHASE 1: APPLE-TIER SILENT MONOGRAM BOOT */}
        {phase === "silent" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              animation: "silentPulse 1.6s ease-in-out infinite",
            }}
          >
            {/* Minimalist Monogram Vector 'M' Logo */}
            <svg width="64" height="64" viewBox="0 0 100 100" fill="none">
              <path
                d="M 20,80 L 20,20 L 50,60 L 80,20 L 80,80"
                stroke="#ffffff"
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="50" cy="60" r="4" fill="#a855f7" />
            </svg>
          </motion.div>
        )}

        {/* PHASE 2: YUTA ABE 8-BIT COSMIC PIXEL WIPE */}
        {phase === "pixelWipe" && (
          <motion.div
            initial={{ scale: 0, opacity: 0.8 }}
            animate={{ scale: 120, opacity: 1 }}
            transition={{ duration: 0.6, ease: [0.7, 0, 0.84, 0] }}
            style={{
              position: "absolute",
              width: "40px",
              height: "40px",
              backgroundColor: "#8b5cf6",
              boxShadow: "0 0 50px #8b5cf6",
              borderRadius: "0px",
              imageRendering: "pixelated",
              transformOrigin: "center center",
            }}
          >
            {/* 8-Bit Pixel Grid Details */}
            <svg
              width="100%"
              height="100%"
              viewBox="0 0 20 20"
              style={{ shapeRendering: "crispEdges" }}
            >
              <rect x="0" y="0" width="10" height="10" fill="#a855f7" />
              <rect x="10" y="10" width="10" height="10" fill="#6366f1" />
              <rect x="5" y="5" width="10" height="10" fill="#38bdf8" />
            </svg>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
