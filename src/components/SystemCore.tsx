"use client";

import React, { useState, useEffect } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";

export default function SolarSystemScroll() {
  const { scrollYProgress } = useScroll();
  const [progress, setProgress] = useState(0);

  // Heavy spring physics for that mechanical, gravity-driven feel
  const smoothProgress = useSpring(scrollYProgress, {
    damping: 30,
    stiffness: 80,
    mass: 1,
  });

  // Mathematically accurate relative orbital speeds
  // Inner planets orbit extremely fast, outer planets are slow and heavy
  const mercuryRotate = useTransform(smoothProgress, [0, 1], [0, 360 * 12]); // 12 orbits
  const venusRotate = useTransform(smoothProgress, [0, 1], [0, 360 * 8]);    // 8 orbits
  const earthRotate = useTransform(smoothProgress, [0, 1], [0, 360 * 5]);    // 5 orbits
  const marsRotate = useTransform(smoothProgress, [0, 1], [0, 360 * 3]);     // 3 orbits
  const jupiterRotate = useTransform(smoothProgress, [0, 1], [0, 360 * 1.5]);  // 1.5 orbits
  const saturnRotate = useTransform(smoothProgress, [0, 1], [0, 360 * 0.8]);   // 0.8 orbits

  // Single Comet / Shooting Star Logic
  // Visible across a wider range (30% to 70% of page scroll) to ensure it's easily spotted
  const cometOpacity = useTransform(smoothProgress, [0.35, 0.45, 0.55, 0.65], [0, 1, 1, 0]);
  // Flies diagonally across the solar system
  const cometX = useTransform(smoothProgress, [0.35, 0.65], ["-150px", "150px"]);
  const cometY = useTransform(smoothProgress, [0.35, 0.65], ["-150px", "150px"]);

  // Core sun glow intensifies as you reach the bottom of the page
  const sunGlow = useTransform(smoothProgress, [0, 1], [0.5, 1.2]);

  useEffect(() => {
    return smoothProgress.onChange((latest) => {
      setProgress(Math.round(latest * 100));
    });
  }, [smoothProgress]);

  return (
    <div className="solar-system-wrapper">
      <style dangerouslySetInnerHTML={{
        __html: `
          .solar-system-wrapper {
            position: fixed;
            bottom: 2rem;
            right: 4rem; /* Moved securely into the true bottom-right corner, just outside standard margin */
            z-index: 9999;
            width: 200px;
            height: 200px;
            display: flex;
            align-items: center;
            justify-content: center;
            pointer-events: none; /* Let clicks pass through */
          }

          /* The Center Star */
          .the-sun {
            position: absolute;
            width: 14px;
            height: 14px;
            background: #FFD700;
            border-radius: 50%;
            box-shadow: 0 0 20px #FFD700, 0 0 40px #FF8C00;
            z-index: 10;
          }

          /* General Orbit Rings */
          .orbit {
            position: absolute;
            border: 1px solid rgba(255, 255, 255, 0.08); /* Faint holographic rings */
            border-radius: 50%;
            display: flex;
            justify-content: center;
          }

          /* General Planet Structure */
          .planet {
            position: absolute;
            border-radius: 50%;
          }

          /* Planetary Distances & Sizes */
          .mercury-orbit { width: 35px; height: 35px; }
          .mercury { width: 3px; height: 3px; background: #A8A8A8; top: -1.5px; }

          .venus-orbit { width: 60px; height: 60px; }
          .venus { width: 5px; height: 5px; background: #E4C08D; top: -2.5px; }

          .earth-orbit { width: 90px; height: 90px; }
          .earth { width: 6px; height: 6px; background: #6B93D6; top: -3px; box-shadow: 0 0 8px #6B93D6; }

          .mars-orbit { width: 120px; height: 120px; }
          .mars { width: 4.5px; height: 4.5px; background: #C1440E; top: -2.25px; }

          .jupiter-orbit { width: 160px; height: 160px; border: 1px dashed rgba(255, 255, 255, 0.05); }
          .jupiter { width: 9px; height: 9px; background: #C88B3A; top: -4.5px; }

          .saturn-orbit { width: 200px; height: 200px; }
          .saturn { 
            width: 8px; height: 8px; background: #EADD9E; top: -4px; 
            display: flex; align-items: center; justify-content: center;
          }
          /* Saturn's Iconic Ring */
          .saturn::after {
            content: '';
            position: absolute;
            width: 16px;
            height: 2px;
            background: rgba(234, 221, 158, 0.8);
            border-radius: 50%;
            transform: rotate(20deg);
            box-shadow: 0 0 4px rgba(234, 221, 158, 0.5);
          }

          /* Digital Readout Base */
          .system-readout {
            position: absolute;
            bottom: -30px;
            font-family: ui-monospace, SFMono-Regular, monospace;
            font-size: 0.75rem;
            color: rgba(255, 255, 255, 0.5);
            letter-spacing: 0.1em;
            text-align: center;
          }
          .system-readout span {
            color: #ffffff;
            font-weight: bold;
            text-shadow: 0 0 5px rgba(255, 255, 255, 0.8);
          }

          /* Single Shooting Star */
          .comet-container {
            position: absolute;
            top: 50%;
            left: 50%;
            z-index: 20;
            pointer-events: none;
            /* Applying filter here guarantees the tail glows as well without weird CSS blending */
            filter: drop-shadow(0 0 10px #ffffff) drop-shadow(0 0 20px rgba(255, 255, 255, 0.8));
          }

          .comet {
            position: absolute;
            width: 8px;
            height: 8px;
            background-color: #ffffff;
            border-radius: 50%;
            /* Rotate to face the direction of the vector (bottom-right = 45deg) */
            transform: translate(-50%, -50%) rotate(45deg);
          }

          /* The Comet's Tail */
          .comet::after {
            content: '';
            position: absolute;
            top: 50%;
            right: 4px; /* Attach exactly to the center of the 8px head */
            width: 180px;
            height: 3px;
            border-radius: 3px;
            /* Explicit pure white fading into right side */
            background: linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(255,255,255,1) 100%);
            transform: translateY(-50%);
          }

          /* Mobile Adjustments */
          @media (max-width: 768px) {
            .solar-system-wrapper {
              right: 1rem;
              bottom: 4rem;
              transform: scale(0.6);
            }
          }
        `
      }} />

      {/* Single Shooting Star mapped to 50% scroll */}
      <motion.div
        className="comet-container"
        style={{
          opacity: cometOpacity,
          x: cometX,
          y: cometY,
        }}
      >
        <div className="comet" />
      </motion.div>

      {/* The Sun */}
      <motion.div className="the-sun" style={{ opacity: sunGlow, scale: sunGlow }} />

      {/* Mercury */}
      <motion.div className="orbit mercury-orbit" style={{ rotate: mercuryRotate }}>
        <div className="planet mercury" />
      </motion.div>

      {/* Venus */}
      <motion.div className="orbit venus-orbit" style={{ rotate: venusRotate }}>
        <div className="planet venus" />
      </motion.div>

      {/* Earth */}
      <motion.div className="orbit earth-orbit" style={{ rotate: earthRotate }}>
        <div className="planet earth" />
      </motion.div>

      {/* Mars */}
      <motion.div className="orbit mars-orbit" style={{ rotate: marsRotate }}>
        <div className="planet mars" />
      </motion.div>

      {/* Jupiter */}
      <motion.div className="orbit jupiter-orbit" style={{ rotate: jupiterRotate }}>
        <div className="planet jupiter" />
      </motion.div>

      {/* Saturn */}
      <motion.div className="orbit saturn-orbit" style={{ rotate: saturnRotate }}>
        <div className="planet saturn" />
      </motion.div>

      {/* The Scroll Readout */}
      <div className="system-readout">
        SCROLL <span>{progress}%</span>
      </div>

    </div>
  );
}