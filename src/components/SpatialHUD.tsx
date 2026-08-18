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
  const { isMuted, toggleMute, isPlaying } = useSoundroom();
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
          height: 64px;
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 clamp(1.2rem, 3.5vw, 2.8rem);
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
          font-size: clamp(0.68rem, 1.2vw, 0.78rem);
          font-weight: 550;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          text-decoration: none;
          transition: color 0.25s ease, opacity 0.25s ease;
          padding: 0.35rem 0;
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          pointer-events: auto;
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
      `}</style>

      {/* 1. TOP UNIFIED GLASS SHIELD (ZERO OVERLAP WITH SCROLLING CONTENT) */}
      <header className="spatial-top-shield">
        {/* Left Link */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", pointerEvents: "auto" }}>
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
                fontSize: "0.65rem",
                fontFamily: "var(--font-mono)",
                color: "rgba(255, 255, 255, 0.35)",
                letterSpacing: "0.1em",
              }}
            >
              / 01
            </span>
          )}
        </div>

        {/* Center: Audio Status & Time */}
        <div style={{ pointerEvents: "auto" }}>
          <button
            onClick={() => {
              audio.playClick();
              toggleMute();
            }}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              fontFamily: "var(--font-mono, monospace)",
              fontSize: "clamp(0.62rem, 1vw, 0.72rem)",
              letterSpacing: "0.15em",
              color: "rgba(255, 255, 255, 0.75)",
              textTransform: "uppercase",
              padding: "0.3rem 0.6rem",
            }}
          >
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                backgroundColor: isMuted ? "rgba(255,255,255,0.25)" : "#30d158",
                boxShadow: isMuted ? "none" : "0 0 8px #30d158",
                display: "inline-block",
              }}
            />
            <span>{isMuted ? "AUDIO: OFF" : `AUDIO: ON · ${timeStr}`}</span>
          </button>
        </div>

        {/* Right Links */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "clamp(1rem, 2.5vw, 2rem)",
            pointerEvents: "auto",
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
              <span>SOUNDROOM</span>
              {isPlaying && (
                <span
                  style={{
                    width: "5px",
                    height: "5px",
                    borderRadius: "50%",
                    backgroundColor: "#38bdf8",
                    boxShadow: "0 0 6px #38bdf8",
                  }}
                />
              )}
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

      {/* 2. BOTTOM-LEFT CORNER: TELEMETRY (HOMEPAGE ONLY) */}
      {bottomLeftExtra && (
        <div
          style={{
            position: "fixed",
            bottom: "clamp(1.2rem, 3vh, 2rem)",
            left: "clamp(1.2rem, 3.5vw, 2.5rem)",
            zIndex: 90,
            pointerEvents: "none",
          }}
        >
          {bottomLeftExtra}
        </div>
      )}

      {/* 3. BOTTOM-RIGHT CORNER: LIGHTS OUT TOGGLE */}
      <div
        style={{
          position: "fixed",
          bottom: "clamp(1.2rem, 3vh, 2rem)",
          right: "clamp(1.2rem, 3.5vw, 2.5rem)",
          zIndex: 90,
          pointerEvents: "auto",
        }}
      >
        {bottomRightExtra ? (
          bottomRightExtra
        ) : onToggleLightsOut ? (
          <button
            onClick={() => {
              audio.playClick();
              onToggleLightsOut();
            }}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.6rem",
              fontFamily: "var(--font-mono, monospace)",
              fontSize: "clamp(0.62rem, 1vw, 0.72rem)",
              letterSpacing: "0.16em",
              color: isLightsOut ? "#38bdf8" : "rgba(255, 255, 255, 0.7)",
              textTransform: "uppercase",
              padding: "0.3rem 0",
            }}
          >
            <span
              style={{
                width: "24px",
                height: "12px",
                borderRadius: "999px",
                border: isLightsOut ? "1px solid #38bdf8" : "1px solid rgba(255, 255, 255, 0.4)",
                position: "relative",
                display: "inline-block",
                transition: "all 0.2s ease",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  top: "2px",
                  left: isLightsOut ? "13px" : "2px",
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  backgroundColor: isLightsOut ? "#38bdf8" : "rgba(255, 255, 255, 0.8)",
                  boxShadow: isLightsOut ? "0 0 6px #38bdf8" : "none",
                  transition: "left 0.2s ease, background-color 0.2s ease",
                }}
              />
            </span>
            <span>LIGHTS OUT</span>
          </button>
        ) : null}
      </div>
    </>
  );
}
