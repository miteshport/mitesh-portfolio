"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import CustomCursor from "@/components/CustomCursor";
import ITSection from "@/components/ITSection";
import ProjectsSection from "@/components/ProjectsSection";
import SmoothScrolling from "@/components/SmoothScrolling";
import SystemCore from "@/components/SystemCore";
import GalaxyStarfield from "@/components/GalaxyStarfield";
import AppleLiquidDock from "@/components/AppleLiquidDock";
import { audio } from "@/utils/audioSystem";

export default function PortfolioPage() {
  const [timeStr, setTimeStr] = useState("");

  useEffect(() => {
    window.scrollTo(0, 0);
    const tick = () => {
      const now = new Date();
      setTimeStr(
        `${String(now.getHours()).padStart(2, "0")}:${String(
          now.getMinutes()
        ).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <SmoothScrolling>
      <main
        style={{
          minHeight: "100vh",
          backgroundColor: "#020204",
          color: "#ffffff",
          position: "relative",
          overflowX: "hidden",
          paddingBottom: "11rem", // Generous room to ensure no overlap with dock
        }}
      >
        <CustomCursor />
        {/* Unified Interstellar Galaxy Starfield */}
        <GalaxyStarfield />

        <style
          dangerouslySetInnerHTML={{
            __html: `
          /* TOP BAR — PURE FLOATING GRID (NO PILL BOXES) */
          .port-nav {
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

          .port-center-title {
            font-family: Georgia, serif;
            font-style: italic;
            font-size: clamp(0.85rem, 2.2vw, 1.02rem);
            color: rgba(255, 255, 255, 0.88);
            letter-spacing: 0.02em;
            white-space: nowrap;
          }

          .home-link {
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
          .home-link:hover {
            color: #ffffff;
          }

          /* PORTFOLIO HERO */
          .port-hero {
            padding-top: clamp(5.5rem, 14vh, 8.5rem);
            padding-bottom: 2rem;
            text-align: center;
            max-width: 860px;
            margin: 0 auto;
            padding-left: 1.5rem;
            padding-right: 1.5rem;
            position: relative;
            z-index: 2;
          }
          .port-eyebrow {
            font-family: monospace;
            font-size: clamp(0.62rem, 1.8vw, 0.76rem);
            letter-spacing: 0.16em;
            color: #38bdf8;
            text-transform: uppercase;
            margin-bottom: 0.9rem;
          }
          .port-name {
            font-family: Georgia, 'Times New Roman', serif;
            font-style: italic;
            font-size: clamp(2.6rem, 7.5vw, 4.6rem);
            color: #ffffff;
            margin: 0 0 0.85rem 0;
            letter-spacing: -0.01em;
            line-height: 1.05;
          }
          .port-desc {
            font-family: monospace;
            font-size: clamp(0.75rem, 2vw, 0.88rem);
            color: rgba(255, 255, 255, 0.55);
            line-height: 1.65;
            max-width: 620px;
            margin: 0 auto;
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
        <header className="port-nav">
          <div className="bar-left">
            <div className="sys-dot" />
            <span className="sys-label">
              SYS: OPTIMAL {timeStr && `· ${timeStr}`}
            </span>
          </div>

          <div className="bar-center">
            <span className="port-center-title">Portfolio Dossier</span>
          </div>

          <div className="bar-right">
            <Link
              href="/"
              className="home-link"
              onClick={() => audio.playClick()}
            >
              3D Art Engine
            </Link>
          </div>
        </header>

        {/* IDENTITY HERO */}
        <section className="port-hero">
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
          >
            <div className="port-eyebrow">
              Executive IT Architecture · Major Incident Command
            </div>
            <h1 className="port-name">Mitesh Shah</h1>
            <p className="port-desc">
              Engineering high-concurrency systems, orchestrating zero-downtime
              P1 incident triage, and crafting digital products from 0-to-1.
            </p>
          </motion.div>
        </section>

        {/* Section 1: P1 Incident Command Triage Terminal */}
        <div id="it" style={{ position: "relative", zIndex: 2 }}>
          <ITSection />
        </div>

        {/* Section 2: Showroom Bento Grid & Architecture Deep-Dives */}
        <div id="projects" style={{ position: "relative", zIndex: 2 }}>
          <ProjectsSection />
        </div>

        {/* Solar System — scroll-driven orbital orrery + shooting star */}
        <SystemCore />

        {/* Unified Apple Liquid Glass Dock */}
        <AppleLiquidDock />
      </main>
    </SmoothScrolling>
  );
}
