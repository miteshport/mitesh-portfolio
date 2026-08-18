"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSoundroom } from "@/context/SoundroomContext";
import { audio } from "@/utils/audioSystem";

interface SpatialHUDProps {
  isLightsOut?: boolean;
  onToggleLightsOut?: () => void;
  bottomLeftExtra?: React.ReactNode;
  bottomRightExtra?: React.ReactNode;
}

export default function SpatialHUD({
  isLightsOut = false,
  onToggleLightsOut,
  bottomLeftExtra,
  bottomRightExtra,
}: SpatialHUDProps) {
  const pathname = usePathname();
  const { isMuted, toggleMute } = useSoundroom();
  const [timeStr, setTimeStr] = useState("");

  const isHome = pathname === "/" || pathname === "/game";
  const isPortfolio = pathname === "/about";
  const isSoundroom = pathname === "/radio";
  const isCard = pathname === "/card";

  // Live Digital Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hrs = String(now.getHours()).padStart(2, "0");
      const mins = String(now.getMinutes()).padStart(2, "0");
      setTimeStr(`${hrs}:${mins}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <style jsx global>{`
        /* SPATIAL HUD TOP GLASS SHIELD */
        .spatial-top-shield {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 60px;
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 clamp(0.45rem, 2vw, 2.0rem);
          background: linear-gradient(
            180deg,
            rgba(2, 2, 4, 0.95) 0%,
            rgba(2, 2, 4, 0.78) 70%,
            rgba(2, 2, 4, 0) 100%
          );
          backdrop-filter: blur(28px) saturate(200%);
          -webkit-backdrop-filter: blur(28px) saturate(200%);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          pointer-events: none;
          box-sizing: border-box;
        }

        .spatial-hud-link {
          position: relative;
          color: rgba(255, 255, 255, 0.75);
          font-family: var(--font-mono, monospace);
          font-size: clamp(0.64rem, 1.1vw, 0.76rem);
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          text-decoration: none;
          transition: color 0.25s ease, opacity 0.25s ease;
          padding: 0.35rem 0;
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          pointer-events: auto;
          white-space: nowrap;
        }

        @media (max-width: 460px) {
    .spatial-brand-sub { display: none !important; }
    .spatial-hud-link { font-size: 0.60rem !important; gap: 0.15rem !important; }
  }
  .spatial-hud-link:hover {
          color: #ffffff;
        }

        .spatial-hud-link::after {
          content: "";
          position: absolute;
          left: 0;
          bottom: 0;
          width: 100%;
          height: 1px;
          background: #38bdf8;
          transform: scaleX(0);
          transform-origin: right center;
          transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .spatial-hud-link:hover::after {
          transform: scaleX(1);
          transform-origin: left center;
        }

        .spatial-hud-active {
          color: #ffffff !important;
        }

        .spatial-hud-active::after {
          transform: scaleX(1) !important;
          background: #ffffff !important;
        }

        /* Responsive Audio Pill on Narrow Fold 4 Screens */
        .spatial-time-text {
          display: inline;
        }
        @media (max-width: 480px) {
          .spatial-time-text {
            display: none;
          }
          .spatial-hud-link {
            font-size: 0.62rem;
            letter-spacing: 0.08em;
          }
        }
      `}</style>

      {/* 1. TOP UNIFIED GLASS SHIELD */}
      <header className="spatial-top-shield">
        {/* Left Link */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", pointerEvents: "auto", flexShrink: 0 }}>
          {isHome ? (
            <Link href="/about" className="spatial-hud-link">
              <span>PORTFOLIO</span>
            </Link>
          ) : (
            <Link href="/" className="spatial-hud-link">
              <span style={{ color: "#38bdf8" }}>←</span>
              <span>BATMOBILE</span>
            </Link>
          )}

          {isHome && (
            <span
              style={{
                fontSize: "0.62rem",
                fontFamily: "var(--font-mono)",
                color: "rgba(255, 255, 255, 0.35)",
                letterSpacing: "0.1em",
              }}
            >
              / 01
            </span>
          )}
        </div>

        {/* Center: Audio Status Pill (Responsive Flex Spacing) */}
        <div
          style={{
            pointerEvents: "auto",
            display: "flex",
            justifyContent: "center",
            flexShrink: 0,
            margin: "0 0.4rem",
          }}
        >
          <button
            onClick={() => {
              audio.playClick();
              toggleMute();
            }}
            style={{
              background: isMuted
                ? "rgba(255, 255, 255, 0.06)"
                : "linear-gradient(135deg, rgba(48, 209, 88, 0.22) 0%, rgba(255, 255, 255, 0.08) 100%)",
              border: isMuted
                ? "1px solid rgba(255, 255, 255, 0.16)"
                : "1px solid rgba(48, 209, 88, 0.55)",
              borderRadius: "9999px",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.45rem",
              fontFamily: "var(--font-mono, monospace)",
              fontSize: "clamp(0.60rem, 0.95vw, 0.72rem)",
              letterSpacing: "0.12em",
              color: isMuted ? "rgba(255, 255, 255, 0.65)" : "#ffffff",
              textTransform: "uppercase",
              padding: "0.32rem 0.75rem",
              boxShadow: isMuted
                ? "0 4px 16px rgba(0, 0, 0, 0.4)"
                : "0 0 16px rgba(48, 209, 88, 0.35), 0 4px 16px rgba(0, 0, 0, 0.4)",
              transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
              whiteSpace: "nowrap",
            }}
          >
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                backgroundColor: isMuted ? "rgba(255,255,255,0.3)" : "#30d158",
                boxShadow: isMuted ? "none" : "0 0 8px #30d158",
                display: "inline-block",
                transition: "all 0.2s ease",
              }}
            />
            <span style={{ fontWeight: 650 }}>
              {isMuted ? "AUDIO: OFF" : "AUDIO: ON"}
              <span className="spatial-time-text"> · {timeStr}</span>
            </span>
          </button>
        </div>

        {/* Right Links */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "clamp(0.6rem, 2vw, 1.6rem)",
            pointerEvents: "auto",
            flexShrink: 0,
          }}
        >
          {!isPortfolio && (
            <Link
              href="/about"
              className={`spatial-hud-link ${isPortfolio ? "spatial-hud-active" : ""}`}
            >
              PORTFOLIO
            </Link>
          )}

          {!isSoundroom && (
            <Link
              href="/radio"
              className={`spatial-hud-link ${isSoundroom ? "spatial-hud-active" : ""}`}
            >
              SOUNDROOM
            </Link>
          )}

          {!isCard && (
            <Link
              href="/card"
              className={`spatial-hud-link ${isCard ? "spatial-hud-active" : ""}`}
            >
              CARD
            </Link>
          )}
        </div>
      </header>

      {/* 2. BOTTOM CORNER TELEMETRY OVERLAYS */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          width: "100vw",
          padding: "clamp(0.75rem, 2.5vw, 1.8rem)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          zIndex: 40,
          pointerEvents: "none",
          boxSizing: "border-box",
        }}
      >
        {/* Bottom-Left Component */}
        <div style={{ pointerEvents: "auto" }}>{bottomLeftExtra}</div>

        {/* Bottom-Right Component */}
        <div style={{ pointerEvents: "auto" }}>{bottomRightExtra}</div>
      </div>
    </>
  );
}
