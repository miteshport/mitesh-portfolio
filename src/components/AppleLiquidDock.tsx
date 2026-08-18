"use client";

import React, { useState, useRef } from "react";
import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { audio } from "@/utils/audioSystem";
import { useSoundroom } from "@/context/SoundroomContext";

interface TextDockItemProps {
  mouseX: any;
  label: string;
  href?: string;
  onClick?: () => void;
  isActive?: boolean;
  isDot?: boolean;
  badge?: React.ReactNode;
}

function TextDockItem({
  mouseX,
  label,
  href,
  onClick,
  isActive,
  isDot,
  badge,
}: TextDockItemProps) {
  const itemRef = useRef<HTMLDivElement>(null);

  const distance = useTransform(mouseX, (val: number) => {
    const b = itemRef.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - b.x - b.width / 2;
  });

  // True Apple macOS Fish-Eye Proximity Magnification Curve
  const scaleSync = useTransform(distance, [-140, 0, 140], [0.88, 1.18, 0.88]);
  const scale = useSpring(scaleSync, { mass: 0.08, stiffness: 260, damping: 16 });

  const opacitySync = useTransform(distance, [-140, 0, 140], [0.45, 1.0, 0.45]);
  const opacity = useSpring(opacitySync, { mass: 0.08, stiffness: 260, damping: 16 });

  const inner = (
    <motion.div
      ref={itemRef}
      style={{
        scale,
        opacity: isActive ? 1 : opacity,
        position: "relative",
        display: "flex",
        alignItems: "center",
        gap: "0.28rem",
      }}
      onMouseEnter={() => {
        audio.playClick();
      }}
      onClick={onClick}
    >
      <motion.span
        style={{
          fontFamily: "monospace",
          fontSize: "clamp(0.58rem, 1.4vw, 0.7rem)",
          fontWeight: isActive ? 700 : 500,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: isActive ? "#ffffff" : "rgba(255, 255, 255, 0.55)",
          whiteSpace: "nowrap",
          cursor: "pointer",
          transition: "color 0.15s ease",
          userSelect: "none",
          display: "flex",
          alignItems: "center",
          gap: "0.3rem",
        }}
        whileHover={{ color: "#ffffff" }}
        whileTap={{ scale: 0.94 }}
      >
        {label}
        {badge}
      </motion.span>

      {/* Active green status dot */}
      {(isActive || isDot) && (
        <span
          style={{
            display: "inline-block",
            width: "4px",
            height: "4px",
            borderRadius: "50%",
            background: "#22c55e",
            boxShadow: "0 0 6px #22c55e",
            marginLeft: "2px",
            flexShrink: 0,
          }}
        />
      )}
    </motion.div>
  );

  if (href) {
    return href.startsWith("http") ? (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        style={{ textDecoration: "none" }}
      >
        {inner}
      </a>
    ) : (
      <Link href={href} style={{ textDecoration: "none" }}>
        {inner}
      </Link>
    );
  }
  return inner;
}

const DIVIDER = (
  <div
    style={{
      width: "1px",
      height: "14px",
      background: "rgba(255, 255, 255, 0.18)",
      margin: "0 0.2rem",
      flexShrink: 0,
    }}
  />
);

interface AppleLiquidDockProps {
  currentStage?: number;
  onSelectStage?: (stage: number) => void;
}

export default function AppleLiquidDock({
  currentStage = 0,
  onSelectStage,
}: AppleLiquidDockProps) {
  const mouseX = useMotionValue(Infinity);
  const pathname = usePathname();
  const { isPlaying, currentTrack, togglePlay } = useSoundroom();

  const isHomePage = pathname === "/";
  const isPortfolioPage = pathname === "/about";
  const isCardPage = pathname === "/card";
  const isRadioPage = pathname === "/radio";
  const isGamePage = pathname === "/game";

  return (
    <div
      style={{
        position: "fixed",
        bottom: "clamp(0.8rem, 2.5vh, 1.6rem)",
        left: 0,
        width: "100vw",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "0.5rem",
        pointerEvents: "none",
        zIndex: 99999,
      }}
    >
      {/* Floating Mini Player Pill (visible across all routes when playing or hovered) */}
      {isPlaying && !isRadioPage && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            pointerEvents: "auto",
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
            background: "rgba(10, 8, 20, 0.85)",
            border: "1px solid rgba(56, 189, 248, 0.3)",
            backdropFilter: "blur(24px)",
            borderRadius: "50px",
            padding: "0.25rem 0.85rem",
            boxShadow: "0 8px 25px rgba(0, 0, 0, 0.6)",
          }}
        >
          <span style={{ fontSize: "0.6rem", fontFamily: "monospace", color: "#38bdf8", letterSpacing: "0.08em" }}>
            TRANSMITTING:
          </span>
          <span style={{ fontSize: "0.68rem", fontFamily: "Georgia, serif", fontStyle: "italic", color: "#ffffff", maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {currentTrack.title} — {currentTrack.artist}
          </span>
          <button
            onClick={togglePlay}
            style={{
              background: "transparent",
              border: "none",
              color: "#38bdf8",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              padding: "0 0.2rem",
            }}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
          </button>
        </motion.div>
      )}

      {/* Main Glass Shelf Dock */}
      <motion.div
        onMouseMove={(e) => mouseX.set(e.pageX)}
        onMouseLeave={() => mouseX.set(Infinity)}
        initial={{ y: 48, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 90, damping: 18 }}
        style={{
          pointerEvents: "auto",
          display: "flex",
          alignItems: "center",
          gap: "clamp(0.45rem, 1.2vw, 0.85rem)",
          padding: "clamp(0.42rem, 1vh, 0.58rem) clamp(0.85rem, 2vw, 1.4rem)",
          background:
            "linear-gradient(135deg, rgba(255, 255, 255, 0.22) 0%, rgba(255, 255, 255, 0.05) 50%, rgba(255, 255, 255, 0.12) 100%)",
          border: "1px solid rgba(255, 255, 255, 0.24)",
          borderTop: "1px solid rgba(255, 255, 255, 0.50)",
          backdropFilter: "blur(40px) saturate(230%) brightness(115%) contrast(105%)",
          WebkitBackdropFilter: "blur(40px) saturate(230%) brightness(115%) contrast(105%)",
          borderRadius: "9999px",
          boxShadow:
            "inset 0 1.5px 2px 0 rgba(255, 255, 255, 0.50), inset 0 -1.5px 2px 0 rgba(255, 255, 255, 0.12), inset 1.5px 0 2px 0 rgba(255, 255, 255, 0.20), inset -1.5px 0 2px 0 rgba(255, 255, 255, 0.20), 0 28px 56px -12px rgba(0, 0, 0, 0.75)",
          maxWidth: "calc(100vw - 1.2rem)",
          overflowX: "auto",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {/* Universal Navigation Links with live route active state */}
        <TextDockItem
          mouseX={mouseX}
          label="Batmobile"
          href="/"
          isActive={isHomePage}
          isDot={isHomePage}
        />
        <TextDockItem
          mouseX={mouseX}
          label="Portfolio"
          href="/about"
          isActive={isPortfolioPage}
          isDot={isPortfolioPage}
        />
        <TextDockItem
          mouseX={mouseX}
          label="Soundroom"
          href="/radio"
          isActive={isRadioPage}
          isDot={isRadioPage}
          badge={
            isPlaying ? (
              <span
                style={{
                  display: "inline-block",
                  width: "5px",
                  height: "5px",
                  borderRadius: "50%",
                  background: "#38bdf8",
                  boxShadow: "0 0 6px #38bdf8",
                }}
              />
            ) : null
          }
        />
        <TextDockItem
          mouseX={mouseX}
          label="Executive Card"
          href="/card"
          isActive={isCardPage}
          isDot={isCardPage}
        />
        <TextDockItem
          mouseX={mouseX}
          label="WhatsApp"
          href="https://wa.me/16395904445?text=Hi%20Mitesh%2C%20I%20came%20across%20your%20portfolio."
        />
        <TextDockItem
          mouseX={mouseX}
          label="LinkedIn"
          href="https://www.linkedin.com/in/mitesh-shah-6415777a/"
        />
      </motion.div>
    </div>
  );
}
