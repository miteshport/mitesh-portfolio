"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import CustomCursor from "@/components/CustomCursor";
import HeroParticleM from "@/components/HeroParticleM";
import AppleLiquidDock from "@/components/AppleLiquidDock";
import { audio } from "@/utils/audioSystem";

const STAGE_LABELS = [
  { numeral: "I", title: "THE ARCHITECT", subtitle: "Form · Structure" },
  { numeral: "II", title: "SACRED LOTUS", subtitle: "Awakening · Radial Harmony" },
  { numeral: "III", title: "MOBIUS INFINITY", subtitle: "Nirakar · Pure Continuous Light" },
];

export default function Home() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [currentStageIdx, setCurrentStageIdx] = useState(0);
  const [isAudioActive, setIsAudioActive] = useState(true);
  const [timeStr, setTimeStr] = useState("");

  // Live Digital Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hrs = String(now.getHours()).padStart(2, "0");
      const mins = String(now.getMinutes()).padStart(2, "0");
      const secs = String(now.getSeconds()).padStart(2, "0");
      setTimeStr(`${hrs}:${mins}:${secs}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Continuous Scroll Listener (Smooth 60fps Morphing)
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = totalHeight > 0 ? Math.min(Math.max(window.scrollY / totalHeight, 0), 1) : 0;
      setScrollProgress(progress);

      if (progress < 0.35) {
        setCurrentStageIdx(0);
      } else if (progress < 0.7) {
        setCurrentStageIdx(1);
      } else {
        setCurrentStageIdx(2);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Direct Jump from Dock
  const handleStageSelect = (stageIdx: number) => {
    audio.playClick();
    const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
    const targetY = stageIdx === 0 ? 0 : stageIdx === 1 ? totalHeight * 0.5 : totalHeight;
    window.scrollTo({ top: targetY, behavior: "smooth" });
  };

  const handleAudioToggle = () => {
    const newState = audio.toggleMute();
    setIsAudioActive(newState);
    if (newState) audio.playClick();
  };

  const currentStage = STAGE_LABELS[currentStageIdx];

  return (
    <div style={{ backgroundColor: "#020204", minHeight: "300vh", position: "relative" }}>
      <CustomCursor />

      {/* Global 70mm Volumetric Particle Canvas */}
      <HeroParticleM currentStage={scrollProgress} />

      <style
        dangerouslySetInnerHTML={{
          __html: `
        /* TOP BAR — PURE FLOATING GRID */
        .master-top-bar {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          padding: clamp(1rem, 2.8vh, 1.6rem) clamp(1.2rem, 3.5vw, 2.8rem);
          z-index: 1000;
          pointer-events: none;
        }

        .bar-left {
          justify-self: start;
          pointer-events: auto;
          display: flex;
          align-items: center;
          gap: 0.45rem;
        }
        .bar-center {
          justify-self: center;
          pointer-events: auto;
        }
        .bar-right {
          justify-self: end;
          pointer-events: auto;
        }

        /* SYS text — clean floating monospace, no pill */
        .sys-label {
          font-family: monospace;
          font-size: clamp(0.6rem, 1.6vw, 0.7rem);
          color: #22c55e;
          font-weight: 600;
          letter-spacing: 0.1em;
          white-space: nowrap;
        }
        .sys-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #22c55e;
          box-shadow: 0 0 6px #22c55e;
          flex-shrink: 0;
        }

        /* Stage HUD — no pill, slim serif italic */
        .stage-label-num {
          font-family: monospace;
          font-size: clamp(0.58rem, 1.5vw, 0.66rem);
          color: rgba(255, 255, 255, 0.38);
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }
        .stage-label-name {
          font-family: Georgia, serif;
          font-style: italic;
          font-size: clamp(0.82rem, 2vw, 0.96rem);
          color: rgba(255, 255, 255, 0.88);
          letter-spacing: 0.01em;
          margin-left: 0.4rem;
        }

        /* Portfolio link — clean monospace text */
        .portfolio-link {
          font-family: monospace;
          font-size: clamp(0.6rem, 1.6vw, 0.7rem);
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.55);
          text-decoration: none;
          transition: color 0.18s ease;
          white-space: nowrap;
        }
        .portfolio-link:hover {
          color: #ffffff;
        }

        @media (max-width: 640px) {
          .bar-center {
            display: none;
          }
        }
      `,
        }}
      />

      {/* TOP BAR */}
      <header className="master-top-bar">
        {/* Left: SYS status */}
        <div className="bar-left">
          <div className="sys-dot" />
          <span className="sys-label">SYS: OPTIMAL {timeStr && `· ${timeStr}`}</span>
        </div>

        {/* Center: Stage name — perfectly centered */}
        <div className="bar-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStageIdx}
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              transition={{ duration: 0.22 }}
              style={{ display: "flex", alignItems: "baseline" }}
            >
              <span className="stage-label-num">Stage {currentStage.numeral} //</span>
              <span className="stage-label-name">{currentStage.title}</span>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Right: Portfolio link */}
        <div className="bar-right">
          <Link href="/about" className="portfolio-link" onClick={() => audio.playClick()}>
            Portfolio
          </Link>
        </div>
      </header>

      {/* DOCK */}
      <AppleLiquidDock currentStage={currentStageIdx} onSelectStage={handleStageSelect} />
    </div>
  );
}