"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, useMotionValue, useTransform, useSpring, AnimatePresence } from "framer-motion";
import Link from "next/link";
import CustomCursor from "@/components/CustomCursor";
import GalaxyStarfield from "@/components/GalaxyStarfield";
import AppleLiquidDock from "@/components/AppleLiquidDock";
import { audio } from "@/utils/audioSystem";
import { useSoundroom } from "@/context/SoundroomContext";

const CONVERSATION_PATHWAYS = [
  {
    id: "technical-puzzle",
    title: "A Hard Technical Puzzle / System Challenge",
    subtitle: "Untangling complex architecture, incident triage, or infrastructure bottlenecks.",
  },
  {
    id: "product-idea",
    title: "A New Project or 0-to-1 Product Idea",
    subtitle: "Building native mobile apps, web systems, or creative literature.",
  },
  {
    id: "open-dialogue",
    title: "Open Dialogue & Strategic Collaboration",
    subtitle: "General advisory, creative ventures, or exploring mutual ideas.",
  },
];

export default function CardPage() {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isAudioActive, setIsAudioActive] = useState(true);
  const [isConversationModalOpen, setIsConversationModalOpen] = useState(false);
  const [timeStr, setTimeStr] = useState("");
  const { isMuted, toggleMute } = useSoundroom();

  // Live Digital Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        `${String(now.getHours()).padStart(2, "0")}:${String(
          now.getMinutes()
        ).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Form State
  const [selectedPathway, setSelectedPathway] = useState(CONVERSATION_PATHWAYS[0].id);
  const [senderName, setSenderName] = useState("");
  const [senderNote, setSenderNote] = useState("");

  const containerRef = useRef<HTMLDivElement>(null);

  // Motion values for tilt
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Smooth springs for fluid tilt
  const springX = useSpring(x, { stiffness: 300, damping: 30 });
  const springY = useSpring(y, { stiffness: 300, damping: 30 });

  // Map normalized coordinates to rotation degrees (-15deg to 15deg)
  const rotateX = useTransform(springY, [-0.5, 0.5], [15, -15]);
  const rotateY = useTransform(springX, [-0.5, 0.5], [-15, 15]);

  // Holographic sheen position
  const glareX = useTransform(springX, [-0.5, 0.5], ["0%", "100%"]);
  const glareY = useTransform(springY, [-0.5, 0.5], ["0%", "100%"]);

  // Holographic Watermark Opacity & Specular Glint based on tilt angle
  const watermarkGlint = useTransform(springX, [-0.5, 0, 0.5], [0.85, 0.25, 0.85]);

  useEffect(() => {
    // Request Gyroscope Permission on Mobile Touch (iOS 13+)
    const requestGyroPermission = async () => {
      if (
        typeof window !== "undefined" &&
        typeof (DeviceOrientationEvent as any).requestPermission === "function"
      ) {
        try {
          const response = await (DeviceOrientationEvent as any).requestPermission();
          if (response === "granted") {
            window.addEventListener("deviceorientation", handleDeviceOrientation, true);
          }
        } catch (err) {
          console.log("Gyroscope permission denied or not supported:", err);
        }
      } else if (typeof window !== "undefined" && window.DeviceOrientationEvent) {
        window.addEventListener("deviceorientation", handleDeviceOrientation, true);
      }
    };

    // Mobile Gyroscope DeviceOrientation Event Listener
    const handleDeviceOrientation = (e: DeviceOrientationEvent) => {
      if (e.gamma !== null && e.beta !== null) {
        const normX = Math.min(Math.max(e.gamma / 45, -0.5), 0.5);
        const normY = Math.min(Math.max(e.beta / 45, -0.5), 0.5);
        x.set(normX);
        y.set(normY);
      }
    };

    const handleFirstTouch = () => {
      requestGyroPermission();
      window.removeEventListener("touchstart", handleFirstTouch);
    };

    window.addEventListener("touchstart", handleFirstTouch, { passive: true });

    return () => {
      window.removeEventListener("touchstart", handleFirstTouch);
      if (typeof window !== "undefined" && window.DeviceOrientationEvent) {
        window.removeEventListener("deviceorientation", handleDeviceOrientation, true);
      }
    };
  }, [x, y]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;

    x.set(xPct);
    y.set(yPct);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!containerRef.current || e.touches.length === 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    const touchX = e.touches[0].clientX - rect.left;
    const touchY = e.touches[0].clientY - rect.top;

    const xPct = touchX / width - 0.5;
    const yPct = touchY / height - 0.5;

    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  // Instant vCard (.vcf) Address Book Download Handler + Zimmer Chime
  const downloadVCard = (e: React.MouseEvent) => {
    e.stopPropagation();
    audio.playZimmerChime();

    const vcardData = `BEGIN:VCARD
VERSION:3.0
FN:Mitesh Shah
TITLE:Enterprise IT Architecture · Major Incident Command · Senior Customer Operations Project Manager
EMAIL;TYPE=INTERNET,WORK:mitesh@miteshshah.xyz
TEL;TYPE=CELL,VOICE:+16395904445
URL:https://miteshshah.xyz
NOTE:Enterprise IT Architecture, Major Incident Command, and Senior Customer Operations Project Management.
END:VCARD`;

    const blob = new Blob([vcardData], { type: "text/vcard;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "Mitesh_Shah_Executive_Pass.vcf");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Transmit Formatted Brief via WhatsApp
  const handleTransmitWhatsApp = (e: React.FormEvent) => {
    e.preventDefault();
    audio.playZimmerChime();

    const selectedItem = CONVERSATION_PATHWAYS.find((p) => p.id === selectedPathway);
    const pathwayTitle = selectedItem ? selectedItem.title : "Open Architectural Dialogue";

    const formattedMessage = `Hi Mitesh, I came across your card.

• Topic: ${pathwayTitle}
• From: ${senderName.trim() || "Guest"}
${senderNote.trim() ? `• Note: ${senderNote.trim()}\n` : ""}
Looking forward to connecting!`;

    const whatsappUrl = `https://wa.me/16395904445?text=${encodeURIComponent(formattedMessage)}`;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    setIsConversationModalOpen(false);
  };

  return (
    <div className="card-page-container">
      {/* Unified Interstellar Galaxy Starfield */}
      <GalaxyStarfield />

      {/* Global Sleek Micro-Dot Cursor */}
      <CustomCursor />

      <style
        dangerouslySetInnerHTML={{
          __html: `
        * {
          box-sizing: border-box;
        }
        body {
          margin: 0;
          background: #020204;
          background-attachment: fixed;
          overflow: hidden;
        }
        .card-page-container {
          width: 100vw;
          height: 100vh;
          overflow: hidden;
          background: #020204;
          display: flex;
          align-items: center;
          justify-content: center;
          perspective: 1200px;
          color: white;
          position: relative;
        }

        .ambient-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(90px);
          opacity: 0.45;
          pointer-events: none;
          z-index: 1;
        }
        .orb-primary {
          width: clamp(280px, 45vw, 550px);
          height: clamp(280px, 45vw, 550px);
          background: radial-gradient(circle, rgba(168, 85, 247, 0.28) 0%, rgba(56, 189, 248, 0.12) 60%, transparent 80%);
          top: 15%;
          left: 20%;
          animation: floatOrb1 18s ease-in-out infinite alternate;
        }
        .orb-secondary {
          width: clamp(250px, 40vw, 480px);
          height: clamp(250px, 40vw, 480px);
          background: radial-gradient(circle, rgba(56, 189, 248, 0.25) 0%, rgba(168, 85, 247, 0.1) 60%, transparent 80%);
          bottom: 12%;
          right: 20%;
          animation: floatOrb2 22s ease-in-out infinite alternate;
        }
        .orb-tertiary {
          width: clamp(200px, 30vw, 360px);
          height: clamp(200px, 30vw, 360px);
          background: radial-gradient(circle, rgba(234, 179, 8, 0.15) 0%, transparent 70%);
          top: 40%;
          right: 35%;
          animation: floatOrb3 15s ease-in-out infinite alternate;
        }

        @keyframes floatOrb1 {
          0% { transform: translate(0, 0) scale(1); }
          100% { transform: translate(60px, -40px) scale(1.15); }
        }
        @keyframes floatOrb2 {
          0% { transform: translate(0, 0) scale(1.1); }
          100% { transform: translate(-50px, 50px) scale(0.95); }
        }
        @keyframes floatOrb3 {
          0% { transform: translate(0, 0) scale(0.9); }
          100% { transform: translate(30px, 40px) scale(1.2); }
        }

        /* TOP BAR — PURE FLOATING GRID */
        .card-top-nav {
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
        }
        .bar-center {
          justify-self: center;
          pointer-events: auto;
        }
        .bar-right {
          justify-self: end;
          pointer-events: auto;
          display: flex;
          align-items: center;
          gap: clamp(0.7rem, 2vw, 1.2rem);
        }

        /* Interactive Audio Toggle */
        .audio-toggle-btn {
          background: transparent;
          border: none;
          display: flex;
          align-items: center;
          gap: 0.45rem;
          cursor: pointer;
          padding: 0;
          outline: none;
          transition: opacity 0.2s ease;
        }
        .audio-toggle-btn:hover {
          opacity: 0.8;
        }
        .audio-toggle-label {
          font-family: monospace;
          font-size: clamp(0.6rem, 1.6vw, 0.7rem);
          color: #22c55e;
          font-weight: 600;
          letter-spacing: 0.1em;
          white-space: nowrap;
          transition: color 0.2s ease;
        }
        .audio-toggle-label.muted {
          color: rgba(255, 255, 255, 0.4);
        }
        .audio-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #22c55e;
          box-shadow: 0 0 6px #22c55e;
          flex-shrink: 0;
          transition: all 0.2s ease;
        }
        .audio-dot.muted {
          background: rgba(255, 255, 255, 0.3);
          box-shadow: none;
        }

        .card-center-title {
          font-family: Georgia, serif;
          font-style: italic;
          font-size: clamp(0.85rem, 2.2vw, 1.02rem);
          color: rgba(255, 255, 255, 0.88);
          letter-spacing: 0.02em;
          white-space: nowrap;
        }

        .port-link {
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
        .port-link:hover {
          color: #ffffff;
        }

        @media (max-width: 640px) {
          .bar-center {
            display: none;
          }
        }
        }
        .floating-audio-link:hover {
          background: rgba(34, 197, 94, 0.15);
          color: #22c55e;
          border-color: #22c55e;
        }

        /* TITANIUM RATIO EXECUTIVE CARD WRAPPER */
        .card-wrapper {
          width: min(88vw, 380px);
          aspect-ratio: 1 / 1.58;
          max-height: 84vh;
          cursor: pointer;
          transform-style: preserve-3d;
          position: relative;
          z-index: 20;
        }

        .holographic-card {
          width: 100%;
          height: 100%;
          position: relative;
          transform-style: preserve-3d;
          border-radius: 20px;
        }

        .card-face {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          border-radius: 20px;
          background: rgba(12, 10, 20, 0.88);
          border: 1px solid rgba(255, 255, 255, 0.14);
          backdrop-filter: blur(32px) saturate(180%);
          -webkit-backdrop-filter: blur(32px) saturate(180%);
          box-shadow: 0 30px 70px rgba(0, 0, 0, 0.85), inset 0 1px 0 rgba(255, 255, 255, 0.2);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: clamp(1.1rem, 3.2vh, 1.6rem) clamp(1.1rem, 3.8vw, 1.6rem);
          overflow: hidden;
        }

        .card-back {
          transform: rotateY(180deg);
        }

        /* GYROSCOPIC HOLOGRAPHIC LOTUS WATERMARK */
        .holographic-watermark {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
          z-index: 5;
          mix-blend-mode: color-dodge;
        }

        /* CARD HEADER */
        .sys-online {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          transform: translateZ(25px);
        }
        .sys-badge {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-family: monospace;
          font-size: clamp(0.58rem, 1.9vw, 0.68rem);
          letter-spacing: 0.12em;
          color: #22c55e;
          font-weight: 600;
          text-transform: uppercase;
        }
        .telemetry-header {
          font-family: monospace;
          font-size: clamp(0.55rem, 1.8vw, 0.64rem);
          letter-spacing: 0.1em;
          color: #38bdf8;
          opacity: 0.85;
          margin-top: 0.15rem;
          text-transform: uppercase;
        }
        .dot {
          width: 6px;
          height: 6px;
          background: #22c55e;
          border-radius: 50%;
          box-shadow: 0 0 8px #22c55e;
        }
        .nfc-chip {
          width: 32px;
          height: 24px;
          border-radius: 5px;
          background: linear-gradient(135deg, #d97706 0%, #fef08a 50%, #b45309 100%);
          border: 1px solid rgba(255, 255, 255, 0.3);
          box-shadow: inset 0 1px 2px rgba(255, 255, 255, 0.6), 0 2px 6px rgba(0, 0, 0, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* IDENTITY */
        .identity {
          text-align: center;
          transform: translateZ(40px);
          margin: auto 0;
        }
        .name {
          font-family: Georgia, 'Times New Roman', serif;
          font-style: italic;
          font-size: clamp(2rem, 7.5vw, 2.75rem);
          color: #ffffff;
          margin: 0 0 0.5rem 0;
          letter-spacing: 0.02em;
          text-shadow: 0 4px 20px rgba(0, 0, 0, 0.6);
          line-height: 1.1;
        }
        .executive-titles {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.25rem;
          width: 100%;
          padding: 0 0.2rem;
        }
        .role-tag {
          font-family: monospace;
          font-size: clamp(0.62rem, 2.1vw, 0.7rem);
          letter-spacing: 0.08em;
          color: rgba(255, 255, 255, 0.85);
          line-height: 1.35;
          text-align: center;
          text-transform: uppercase;
        }
        .role-sep {
          color: #38bdf8;
          font-size: 0.65rem;
          opacity: 0.6;
          line-height: 1;
        }
        .barcode-container {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          transform: translateZ(20px);
          gap: 0.35rem;
        }
        .barcode {
          width: 75%;
          height: 26px;
          color: rgba(255, 255, 255, 0.35);
        }
        .tap-flip-cue {
          font-family: monospace;
          font-size: clamp(0.55rem, 1.8vw, 0.62rem);
          letter-spacing: 0.16em;
          color: rgba(255, 255, 255, 0.45);
          text-transform: uppercase;
        }

        /* ACTIONS */
        .actions-primary {
          display: flex;
          flex-direction: column;
          gap: 0.45rem;
          width: 100%;
          transform: translateZ(35px);
        }
        .actions-secondary {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.4rem;
          width: 100%;
          transform: translateZ(35px);
        }
        .brutalist-button {
          width: 100%;
          padding: clamp(0.55rem, 1.4vh, 0.7rem) 0.4rem;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.18);
          color: white;
          font-family: monospace;
          font-size: clamp(0.6rem, 2vw, 0.68rem);
          font-weight: bold;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.25, 1, 0.5, 1);
          border-radius: 8px;
          text-decoration: none;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          white-space: normal;
          line-height: 1.25;
          box-sizing: border-box;
        }
        .brutalist-button:hover {
          background: white;
          color: #050505;
          border-color: white;
          transform: scale(1.02);
          box-shadow: 0 10px 20px rgba(0,0,0,0.4);
        }
        .save-vcard-btn {
          background: rgba(34, 197, 94, 0.12) !important;
          border: 1px solid #22c55e !important;
          color: #22c55e !important;
        }
        .save-vcard-btn:hover {
          background: #22c55e !important;
          color: #000000 !important;
        }
        .wallet-pass-btn {
          background: rgba(56, 189, 248, 0.12) !important;
          border: 1px solid #38bdf8 !important;
          color: #38bdf8 !important;
        }
        .wallet-pass-btn:hover {
          background: #38bdf8 !important;
          color: #000000 !important;
        }
        .conversation-btn {
          background: rgba(168, 85, 247, 0.15) !important;
          border: 1px solid #a855f7 !important;
          color: #d8b4fe !important;
        }
        .conversation-btn:hover {
          background: #a855f7 !important;
          color: #000000 !important;
        }

        /* MODAL STYLING */
        .dialogue-modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.85);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 999999;
          padding: 1.2rem;
        }
        .dialogue-modal-content {
          width: 100%;
          max-width: 540px;
          background: rgba(14, 11, 24, 0.96);
          border: 1px solid rgba(168, 85, 247, 0.4);
          border-radius: 18px;
          padding: 1.8rem;
          box-shadow: 0 30px 80px rgba(0, 0, 0, 0.9), 0 0 40px rgba(168, 85, 247, 0.25);
          font-family: monospace;
          max-height: 92vh;
          overflow-y: auto;
        }
        .pathway-card {
          padding: 0.8rem 1rem;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: rgba(255, 255, 255, 0.03);
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: left;
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
        }
        .pathway-card:hover {
          border-color: rgba(168, 85, 247, 0.6);
          background: rgba(168, 85, 247, 0.08);
        }
        .pathway-card.active {
          border-color: #38bdf8;
          background: rgba(56, 189, 248, 0.12);
          box-shadow: 0 0 15px rgba(56, 189, 248, 0.2);
        }
      `,
        }}
      />

      {/* TOP FLOATING NAV */}
      <header className="card-top-nav">
        <div className="bar-left">
          <button
            className="audio-toggle-btn"
            onClick={toggleMute}
            aria-label="Toggle Master Audio"
          >
            <div className={`audio-dot ${isMuted ? "muted" : ""}`} />
            <span className={`audio-toggle-label ${isMuted ? "muted" : ""}`}>
              {isMuted ? "AUDIO: MUTED" : "AUDIO: ACTIVE"} {timeStr && `· ${timeStr}`}
            </span>
          </button>
        </div>

        <div className="bar-center">
          <span className="card-center-title">Executive Pass</span>
        </div>

        <div className="bar-right">
          <Link href="/radio" className="port-link" onClick={() => audio.playClick()}>
            Soundroom
          </Link>
          <Link href="/about" className="port-link" onClick={() => audio.playClick()}>
            Portfolio
          </Link>
        </div>
      </header>

      {/* 3D HOLOGRAPHIC TITANIUM CARD */}
      <motion.div
        className="card-wrapper"
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleMouseLeave}
        onClick={() => {
          audio.playTitaniumFlip();
          setIsFlipped(!isFlipped);
        }}
        initial={{ y: 50, opacity: 0, scale: 0.9 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        style={{
          rotateX,
          rotateY,
        }}
      >
        <motion.div
          className="holographic-card"
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 75, damping: 18 }}
        >
          {/* FRONT FACE */}
          <div className="card-face card-front">
            {/* Holographic Sheen Overlay */}
            <motion.div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(105deg, transparent 20%, rgba(56, 189, 248, 0.2) 25%, rgba(255, 255, 255, 0.2) 27%, transparent 30%)",
                backgroundSize: "200% 200%",
                backgroundPositionX: glareX,
                backgroundPositionY: glareY,
                mixBlendMode: "screen",
                pointerEvents: "none",
                zIndex: 10,
              }}
            />

            {/* ARTIST'S MASTER SIGNATURE: GYROSCOPIC HOLOGRAPHIC LOTUS WATERMARK */}
            <motion.div
              className="holographic-watermark"
              style={{
                opacity: watermarkGlint,
              }}
            >
              <svg width="220" height="220" viewBox="0 0 200 200" fill="none" opacity="0.35">
                {/* 8-Petal Sacred Lotus Optical Watermark Pattern */}
                <circle cx="100" cy="100" r="75" stroke="#fbbf24" strokeWidth="0.75" strokeDasharray="3 3" opacity="0.6" />
                <circle cx="100" cy="100" r="50" stroke="#38bdf8" strokeWidth="0.75" opacity="0.5" />
                <path d="M100 25 C115 65 145 85 175 100 C145 115 115 135 100 175 C85 135 55 115 25 100 C55 85 85 65 100 25 Z" stroke="#fbbf24" strokeWidth="1" opacity="0.7" />
                <path d="M153 47 C145 85 160 120 153 153 C120 145 85 160 47 153 C55 120 40 85 47 47 C85 55 120 40 153 47 Z" stroke="#a855f7" strokeWidth="0.8" opacity="0.6" />
                <circle cx="100" cy="100" r="14" stroke="#ffffff" strokeWidth="1.2" opacity="0.8" />
              </svg>
            </motion.div>

            {/* Top Bar with Online Status, Telemetry & NFC Chip */}
            <div className="sys-online">
              <div>
                <div className="sys-badge">
                  <div className="dot" />
                  SYS: OPTIMAL // NFC ACTIVE
                </div>
                <div className="telemetry-header">
                  CLEARANCE: ARCH-P1 · ID: MS-8849
                </div>
              </div>
              <div className="nfc-chip" title="NFC Contact Chip">
                <svg width="16" height="14" viewBox="0 0 16 14" fill="none">
                  <path d="M1 4h14M1 7h14M1 10h14" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
                </svg>
              </div>
            </div>

            {/* Executive Identity */}
            <div className="identity">
              <h1 className="name">Mitesh Shah</h1>
              <div className="executive-titles">
                <span className="role-tag">Enterprise IT Architecture</span>
                <span className="role-sep">·</span>
                <span className="role-tag">Major Incident Command</span>
                <span className="role-sep">·</span>
                <span className="role-tag">Senior Customer Operations Project Manager</span>
              </div>
            </div>

            {/* Bottom Barcode, Live Node Status & Interactive Flip Cue */}
            <div className="barcode-container">
              <svg className="barcode" viewBox="0 0 200 35" preserveAspectRatio="none">
                <rect x="0" y="0" width="4" height="35" fill="currentColor" />
                <rect x="8" y="0" width="2" height="35" fill="currentColor" />
                <rect x="14" y="0" width="6" height="35" fill="currentColor" />
                <rect x="24" y="0" width="2" height="35" fill="currentColor" />
                <rect x="30" y="0" width="8" height="35" fill="currentColor" />
                <rect x="42" y="0" width="2" height="35" fill="currentColor" />
                <rect x="48" y="0" width="4" height="35" fill="currentColor" />
                <rect x="56" y="0" width="10" height="35" fill="currentColor" />
                <rect x="70" y="0" width="2" height="35" fill="currentColor" />
                <rect x="76" y="0" width="4" height="35" fill="currentColor" />
                <rect x="84" y="0" width="6" height="35" fill="currentColor" />
                <rect x="94" y="0" width="2" height="35" fill="currentColor" />
                <rect x="100" y="0" width="8" height="35" fill="currentColor" />
                <rect x="112" y="0" width="2" height="35" fill="currentColor" />
                <rect x="118" y="0" width="4" height="35" fill="currentColor" />
                <rect x="126" y="0" width="12" height="35" fill="currentColor" />
                <rect x="142" y="0" width="2" height="35" fill="currentColor" />
                <rect x="148" y="0" width="4" height="35" fill="currentColor" />
                <rect x="156" y="0" width="2" height="35" fill="currentColor" />
                <rect x="162" y="0" width="8" height="35" fill="currentColor" />
                <rect x="174" y="0" width="2" height="35" fill="currentColor" />
                <rect x="180" y="0" width="6" height="35" fill="currentColor" />
                <rect x="190" y="0" width="2" height="35" fill="currentColor" />
                <rect x="196" y="0" width="4" height="35" fill="currentColor" />
              </svg>
              <div className="tap-flip-cue">[ TAP CARD TO FLIP // ACTIONS ]</div>
            </div>
          </div>

          {/* BACK FACE */}
          <div className="card-face card-back">
            {/* Holographic Sheen Overlay */}
            <motion.div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(105deg, transparent 20%, rgba(56, 189, 248, 0.2) 25%, rgba(255, 255, 255, 0.2) 27%, transparent 30%)",
                backgroundSize: "200% 200%",
                backgroundPositionX: glareX,
                backgroundPositionY: glareY,
                mixBlendMode: "screen",
                pointerEvents: "none",
                zIndex: 10,
                transform: "rotateY(180deg)",
              }}
            />

            {/* Back Face Header */}
            <div style={{ textAlign: "center", transform: "translateZ(30px)", width: "100%" }}>
              <div style={{ fontFamily: "monospace", fontSize: "0.62rem", letterSpacing: "0.14em", color: "#38bdf8", textTransform: "uppercase" }}>
                EXECUTIVE CONTACT INTERFACE
              </div>
            </div>

            {/* Primary Action Tier */}
            <div className="actions-primary">
              <button className="brutalist-button save-vcard-btn" onClick={downloadVCard}>
                [ SAVE CONTACT PASS (.VCF) ]
              </button>
              <button
                className="brutalist-button conversation-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  audio.playClick();
                  setIsConversationModalOpen(true);
                }}
              >
                [ START A CONVERSATION ]
              </button>
            </div>

            {/* Secondary Direct Communication Grid */}
            <div className="actions-secondary">
              <a
                href="https://www.linkedin.com/in/mitesh-shah-6415777a/"
                target="_blank"
                rel="noopener noreferrer"
                className="brutalist-button"
                onClick={(e) => {
                  e.stopPropagation();
                  audio.playClick();
                }}
              >
                LINKEDIN
              </a>
              <a
                href="https://www.instagram.com/mitesh.shah01?igsh=MWVsbHA2dnM5N2poMQ=="
                target="_blank"
                rel="noopener noreferrer"
                className="brutalist-button"
                onClick={(e) => {
                  e.stopPropagation();
                  audio.playClick();
                }}
              >
                INSTAGRAM
              </a>
              <Link
                href="/"
                className="brutalist-button"
                onClick={(e) => {
                  e.stopPropagation();
                  audio.playClick();
                }}
              >
                PORTFOLIO
              </Link>
            </div>

            {/* Bottom Security Footer */}
            <div style={{ textAlign: "center", transform: "translateZ(25px)", width: "100%" }}>
              <div style={{ fontFamily: "monospace", fontSize: "0.55rem", letterSpacing: "0.12em", color: "rgba(255, 255, 255, 0.4)", textTransform: "uppercase" }}>
                SECURE END-TO-END // MITESHSHAH.XYZ
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* SIGNATURE 3-PATHWAY GROUNDED CONVERSATION MODAL */}
      <AnimatePresence>
        {isConversationModalOpen && (
          <motion.div
            className="dialogue-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              audio.playClick();
              setIsConversationModalOpen(false);
            }}
          >
            <motion.div
              className="dialogue-modal-content"
              initial={{ scale: 0.94, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.94, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem", borderBottom: "1px solid rgba(255, 255, 255, 0.1)", paddingBottom: "0.8rem" }}>
                <div>
                  <div style={{ fontSize: "0.68rem", color: "#38bdf8", letterSpacing: "0.14em", textTransform: "uppercase" }}>
                    DIRECT ARCHITECTURAL DIALOGUE
                  </div>
                  <h3 style={{ margin: "0.3rem 0 0 0", color: "#ffffff", fontSize: "1.25rem", fontFamily: "Georgia, serif" }}>
                    Start a Conversation
                  </h3>
                </div>
                <button
                  onClick={() => {
                    audio.playClick();
                    setIsConversationModalOpen(false);
                  }}
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.08)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    color: "#ffffff",
                    fontFamily: "monospace",
                    fontSize: "0.75rem",
                    padding: "0.3rem 0.7rem",
                    borderRadius: "6px",
                    cursor: "pointer",
                  }}
                >
                  [ ✕ CLOSE ]
                </button>
              </div>

              <form onSubmit={handleTransmitWhatsApp}>
                {/* 3 Pathway Cards */}
                <div style={{ marginBottom: "1.2rem" }}>
                  <label style={{ fontSize: "0.68rem", color: "rgba(255, 255, 255, 0.6)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: "0.5rem" }}>
                    1. What would you like to discuss?
                  </label>
                  <div style={{ display: "grid", gap: "0.5rem" }}>
                    {CONVERSATION_PATHWAYS.map((p) => {
                      const isActive = selectedPathway === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          className={`pathway-card ${isActive ? "active" : ""}`}
                          onClick={() => {
                            audio.playClick();
                            setSelectedPathway(p.id);
                          }}
                        >
                          <div style={{ fontSize: "0.78rem", fontWeight: "bold", color: isActive ? "#38bdf8" : "#ffffff" }}>
                            {p.title}
                          </div>
                          <div style={{ fontSize: "0.68rem", color: "rgba(255, 255, 255, 0.55)", lineHeight: 1.35 }}>
                            {p.subtitle}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Sender Name */}
                <div style={{ marginBottom: "1rem" }}>
                  <label style={{ fontSize: "0.68rem", color: "rgba(255, 255, 255, 0.6)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: "0.3rem" }}>
                    2. Your Name / Organization
                  </label>
                  <input
                    type="text"
                    required
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    placeholder="e.g. Alex Vance · Founder / CTO"
                    style={{
                      width: "100%",
                      padding: "0.65rem 0.8rem",
                      backgroundColor: "rgba(0, 0, 0, 0.45)",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      borderRadius: "6px",
                      color: "#ffffff",
                      fontFamily: "monospace",
                      fontSize: "0.78rem",
                      outline: "none",
                    }}
                  />
                </div>

                {/* Sender Note */}
                <div style={{ marginBottom: "1.4rem" }}>
                  <label style={{ fontSize: "0.68rem", color: "rgba(255, 255, 255, 0.6)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: "0.3rem" }}>
                    3. What's on your mind? (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={senderNote}
                    onChange={(e) => setSenderNote(e.target.value)}
                    placeholder="Briefly describe what you're working on, looking for, or trying to solve..."
                    style={{
                      width: "100%",
                      padding: "0.65rem 0.8rem",
                      backgroundColor: "rgba(0, 0, 0, 0.45)",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      borderRadius: "6px",
                      color: "#ffffff",
                      fontFamily: "monospace",
                      fontSize: "0.78rem",
                      outline: "none",
                      resize: "none",
                    }}
                  />
                </div>

                {/* Transmit Button */}
                <button
                  type="submit"
                  style={{
                    width: "100%",
                    padding: "0.8rem",
                    backgroundColor: "#22c55e",
                    color: "#000000",
                    border: "none",
                    borderRadius: "8px",
                    fontFamily: "monospace",
                    fontSize: "0.82rem",
                    fontWeight: "bold",
                    letterSpacing: "0.08em",
                    cursor: "pointer",
                    textTransform: "uppercase",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.5rem",
                  }}
                >
                  <span>[ ↗ TRANSMIT VIA WHATSAPP ]</span>
                </button>
                <div style={{ textAlign: "center", marginTop: "0.6rem", fontSize: "0.6rem", color: "rgba(255, 255, 255, 0.4)" }}>
                  DIRECT 1-ON-1 WITH MITESH SHAH // +1 639 590 4445
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Unified Apple Liquid Glass Dock */}
      <AppleLiquidDock />
    </div>
  );
}
