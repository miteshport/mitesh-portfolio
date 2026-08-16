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
import SpatialHUD from "@/components/SpatialHUD";

export default function PortfolioPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
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
          paddingBottom: "8rem",
        }}
      >
        <CustomCursor />
        {/* Unified Interstellar Galaxy Starfield */}
        <GalaxyStarfield />

        {/* 4-CORNER SPATIAL HUD */}
        <SpatialHUD />

        <style
          dangerouslySetInnerHTML={{
            __html: `
          /* IDENTITY HERO */
          .port-hero {
            padding: clamp(6.5rem, 16vh, 10rem) clamp(1.2rem, 5vw, 4rem) 2.5rem;
            max-width: 1200px;
            margin: 0 auto;
            position: relative;
            z-index: 2;
          }

          .port-eyebrow {
            font-family: var(--font-mono, monospace);
            font-size: clamp(0.68rem, 1.2vw, 0.82rem);
            color: #38bdf8;
            letter-spacing: 0.18em;
            text-transform: uppercase;
            margin-bottom: 0.8rem;
            display: flex;
            align-items: center;
            gap: 0.6rem;
          }

          .port-name {
            font-size: clamp(2.6rem, 7.5vw, 5.8rem);
            font-weight: 850;
            line-height: 0.95;
            letter-spacing: -0.04em;
            margin: 0 0 1.2rem;
            background: linear-gradient(180deg, #ffffff 40%, rgba(255, 255, 255, 0.55) 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }

          .port-desc {
            font-size: clamp(0.95rem, 2vw, 1.3rem);
            line-height: 1.55;
            color: rgba(255, 255, 255, 0.72);
            max-width: 680px;
            font-weight: 350;
            letter-spacing: -0.01em;
          }

          /* CONTACT FOOTER */
          .port-footer {
            max-width: 1200px;
            margin: 5rem auto 0;
            padding: 3rem clamp(1.2rem, 5vw, 4rem) 4rem;
            border-top: 1px solid rgba(255, 255, 255, 0.12);
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 1.5rem;
            position: relative;
            z-index: 50;
          }

          .footer-social-link {
            font-family: var(--font-mono, monospace);
            font-size: 0.78rem;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            color: rgba(255, 255, 255, 0.75);
            text-decoration: none;
            transition: color 0.2s ease;
          }

          .footer-social-link:hover {
            color: #38bdf8;
          }
        `,
          }}
        />

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

        {/* CONTACT FOOTER WITH SOCIAL LINKS */}
        <footer className="port-footer">
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "rgba(255, 255, 255, 0.45)", letterSpacing: "0.1em" }}>
            MITESH SHAH · SYSTEM OPERATING SYSTEM · 2026
          </div>
          <div style={{ display: "flex", gap: "2rem" }}>
            <a
              href="https://wa.me/16395904445?text=Hi%20Mitesh%2C%20I%20came%20across%20your%20portfolio."
              target="_blank"
              rel="noopener noreferrer"
              className="footer-social-link"
            >
              WhatsApp ↗
            </a>
            <a
              href="https://www.linkedin.com/in/mitesh-shah-6415777a/"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-social-link"
            >
              LinkedIn ↗
            </a>
          </div>
        </footer>
      </main>
    </SmoothScrolling>
  );
}
