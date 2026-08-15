"use client";

import React, { useState, useRef } from "react";
import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { audio } from "@/utils/audioSystem";

interface TextDockItemProps {
  mouseX: any;
  label: string;
  href?: string;
  onClick?: () => void;
  isActive?: boolean;
  isDot?: boolean;
}

function TextDockItem({ mouseX, label, href, onClick, isActive, isDot }: TextDockItemProps) {
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
        }}
        whileHover={{ color: "#ffffff" }}
        whileTap={{ scale: 0.94 }}
      >
        {label}
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

  const isHomePage = pathname === "/";
  const isPortfolioPage = pathname === "/about";
  const isCardPage = pathname === "/card";

  return (
    <div
      style={{
        position: "fixed",
        bottom: "clamp(0.8rem, 2.5vh, 1.6rem)",
        left: 0,
        width: "100vw",
        display: "flex",
        justifyContent: "center",
        pointerEvents: "none",
        zIndex: 99999,
      }}
    >
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
          gap: "clamp(0.55rem, 1.4vw, 0.9rem)",
          padding: "clamp(0.42rem, 1vh, 0.58rem) clamp(0.9rem, 2.2vw, 1.4rem)",
          background: "rgba(255, 255, 255, 0.04)",
          border: "1px solid rgba(255, 255, 255, 0.10)",
          borderTop: "1px solid rgba(255, 255, 255, 0.24)",
          backdropFilter: "blur(40px) saturate(160%)",
          WebkitBackdropFilter: "blur(40px) saturate(160%)",
          borderRadius: "100px",
          boxShadow:
            "0 18px 50px rgba(0, 0, 0, 0.82), inset 0 1px 0 rgba(255, 255, 255, 0.18)",
        }}
      >
        {/* If on 3D Home Page: Show Stage Switchers */}
        {isHomePage && onSelectStage && (
          <>
            <TextDockItem
              mouseX={mouseX}
              label="The M"
              isActive={currentStage === 0}
              onClick={() => {
                audio.playClick();
                onSelectStage(0);
              }}
            />
            <TextDockItem
              mouseX={mouseX}
              label="Lotus"
              isActive={currentStage === 1}
              onClick={() => {
                audio.playClick();
                onSelectStage(1);
              }}
            />
            <TextDockItem
              mouseX={mouseX}
              label="Nirakar"
              isActive={currentStage === 2}
              onClick={() => {
                audio.playClick();
                onSelectStage(2);
              }}
            />
            {DIVIDER}
          </>
        )}

        {/* If on subpages: allow 1-click jump back to 3D Art Engine */}
        {!isHomePage && (
          <>
            <TextDockItem
              mouseX={mouseX}
              label="3D Art Engine"
              href="/"
            />
            {DIVIDER}
          </>
        )}

        {/* Universal Navigation Links with live route active state */}
        <TextDockItem
          mouseX={mouseX}
          label="Portfolio"
          href="/about"
          isActive={isPortfolioPage}
          isDot={isPortfolioPage}
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
