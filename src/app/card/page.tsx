"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";
import Link from "next/link";
import CustomCursor from "@/components/CustomCursor";

export default function CardPage() {
  const [isFlipped, setIsFlipped] = useState(false);
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

  // Instant vCard (.vcf) Address Book Download Handler
  const downloadVCard = (e: React.MouseEvent) => {
    e.stopPropagation();
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

  return (
    <div className="card-page-container">
      {/* Global Sleek Micro-Dot Cursor */}
      <CustomCursor />

      {/* Ambient Lighting Orbs for Apple Liquid Glass Refraction */}
      <div className="ambient-orb orb-primary" />
      <div className="ambient-orb orb-secondary" />
      <div className="ambient-orb orb-tertiary" />

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

        /* Ambient Refraction Glows behind the card */
        .ambient-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(90px);
          opacity: 0.45;
          pointer-events: none;
          z-index: 1;
        }
        .orb-primary {
          width: 380px;
          height: 380px;
          background: radial-gradient(circle, rgba(168, 85, 247, 0.45) 0%, rgba(99, 102, 241, 0.15) 60%, transparent 80%);
          top: 25%;
          left: 55%;
          animation: floatOrb 12s ease-in-out infinite alternate;
        }
        .orb-secondary {
          width: 420px;
          height: 420px;
          background: radial-gradient(circle, rgba(56, 189, 248, 0.4) 0%, rgba(14, 165, 233, 0.1) 60%, transparent 80%);
          bottom: 20%;
          right: 55%;
          animation: floatOrb2 16s ease-in-out infinite alternate;
        }
        .orb-tertiary {
          width: 260px;
          height: 260px;
          background: radial-gradient(circle, rgba(234, 179, 8, 0.25) 0%, transparent 70%);
          top: 35%;
          right: 35%;
        }

        @keyframes floatOrb {
          0% { transform: translate(0, 0) scale(1); }
          100% { transform: translate(-40px, 30px) scale(1.15); }
        }
        @keyframes floatOrb2 {
          0% { transform: translate(0, 0) scale(1); }
          100% { transform: translate(30px, -40px) scale(1.1); }
        }

        .card-wrapper {
          width: 90vw;
          max-width: 420px;
          height: 72vh;
          max-height: 620px;
          min-height: 520px;
          position: relative;
          cursor: pointer;
          transform-style: preserve-3d;
          z-index: 10;
        }
        .floating-escape-link {
          position: absolute;
          top: 2.5rem;
          left: 3rem;
          z-index: 50;
          font-family: monospace;
          font-size: 0.85rem;
          letter-spacing: 0.15em;
          color: #38bdf8;
          text-decoration: none;
          padding: 0.6rem 1.4rem;
          border-radius: 50px;
          background-color: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(16px);
          transition: all 0.3s ease;
          text-transform: uppercase;
        }
        .floating-escape-link:hover {
          background: #ffffff;
          color: #000000;
          box-shadow: 0 0 20px rgba(255, 255, 255, 0.4);
        }
        .holographic-card {
          width: 100%;
          height: 100%;
          position: absolute;
          transform-style: preserve-3d;
        }

        /* APPLE VISION PRO LIQUID GLASS SPECULAR CARD FACE */
        .card-face {
          position: absolute;
          inset: 0;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          display: flex;
          flex-direction: column;
          padding: 2.4rem 2.2rem;
          border-radius: 24px;
          background: linear-gradient(145deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.015) 100%) !important;
          border: 1px solid rgba(255, 255, 255, 0.16) !important;
          backdrop-filter: blur(32px) saturate(180%) !important;
          -webkit-backdrop-filter: blur(32px) saturate(180%) !important;
          box-shadow: 0 30px 60px -10px rgba(0, 0, 0, 0.9), inset 0 1px 1px rgba(255, 255, 255, 0.35), 0 0 35px rgba(168, 85, 247, 0.15);
          overflow: hidden;
        }
        .card-front {
          justify-content: space-between;
        }
        .card-back {
          transform: rotateY(180deg);
          justify-content: center;
          align-items: center;
          gap: 0.9rem;
        }
        .sys-online {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          transform: translateZ(30px);
        }
        .sys-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: monospace;
          font-size: 0.72rem;
          color: rgba(255, 255, 255, 0.75);
          letter-spacing: 0.12em;
        }
        .dot {
          width: 7px;
          height: 7px;
          background: #22c55e;
          border-radius: 50%;
          box-shadow: 0 0 8px #22c55e;
          animation: blink 1.5s infinite alternate;
        }
        @keyframes blink {
          0% { opacity: 0.3; }
          100% { opacity: 1; box-shadow: 0 0 14px #22c55e; }
        }

        /* Metallic Gold NFC Chip Graphic */
        .nfc-chip {
          width: 34px;
          height: 25px;
          border-radius: 4px;
          background: linear-gradient(135deg, #fbbf24 0%, #d97706 50%, #92400e 100%);
          border: 1px solid rgba(255, 255, 255, 0.5);
          position: relative;
          box-shadow: 0 0 12px rgba(245, 158, 11, 0.45);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .identity {
          text-align: center;
          transform: translateZ(50px);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.85rem;
        }
        .name {
          font-family: "Georgia", serif;
          font-style: italic;
          font-size: 2.85rem;
          font-weight: 400;
          letter-spacing: -0.5px;
          line-height: 1.1;
          margin: 0;
          color: #ffffff;
          text-shadow: 0 4px 24px rgba(255, 255, 255, 0.2);
        }
        .executive-titles {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.35rem;
          width: 100%;
          padding: 0 0.5rem;
        }
        .role-tag {
          font-family: monospace;
          font-size: 0.76rem;
          letter-spacing: 0.1em;
          color: rgba(255, 255, 255, 0.85);
          line-height: 1.4;
          text-align: center;
          text-transform: uppercase;
        }
        .role-sep {
          color: #38bdf8;
          font-size: 0.75rem;
          opacity: 0.6;
          line-height: 1;
        }
        .barcode-container {
          display: flex;
          justify-content: center;
          align-items: center;
          transform: translateZ(20px);
          padding-bottom: 0.2rem;
        }
        .barcode {
          width: 80%;
          height: 34px;
          color: rgba(255, 255, 255, 0.35);
        }
        .brutalist-button {
          width: 100%;
          padding: 0.9rem 1.1rem;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.18);
          color: white;
          font-family: monospace;
          font-size: 0.78rem;
          font-weight: bold;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.25, 1, 0.5, 1);
          border-radius: 8px;
          transform: translateZ(40px);
          text-decoration: none;
          display: flex;
          align-items: center;
          justify-content: center;
          white-space: nowrap;
        }
        .brutalist-button:hover {
          background: white;
          color: #050505;
          border-color: white;
          transform: translateZ(50px) scale(1.02);
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
      `,
        }}
      />

      {/* Clear ESC Escape Button */}
      <Link href="/" className="floating-escape-link">
        [ ESC ] Return to System
      </Link>

      <motion.div
        className="card-wrapper"
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleMouseLeave}
        onClick={() => setIsFlipped(!isFlipped)}
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
          transition={{ type: "spring", stiffness: 60, damping: 15 }}
        >
          {/* Front Face */}
          <div className="card-face card-front">
            {/* Holographic Sheen Reflection Overlay */}
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

            {/* Top Bar with Online Status & Metallic Gold NFC Chip */}
            <div className="sys-online">
              <div className="sys-badge">
                <div className="dot" />
                SYS: OPTIMAL // NFC ACTIVE
              </div>
              <div className="nfc-chip" title="NFC Contact Chip">
                <svg width="16" height="14" viewBox="0 0 16 14" fill="none">
                  <path d="M1 4h14M1 7h14M1 10h14" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
                </svg>
              </div>
            </div>

            {/* Executive Identity - Pure Pillars, No Clutter */}
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

            {/* Bottom Barcode */}
            <div className="barcode-container">
              <svg className="barcode" viewBox="0 0 200 40" preserveAspectRatio="none">
                <rect x="0" y="0" width="4" height="40" fill="currentColor" />
                <rect x="8" y="0" width="2" height="40" fill="currentColor" />
                <rect x="14" y="0" width="6" height="40" fill="currentColor" />
                <rect x="24" y="0" width="2" height="40" fill="currentColor" />
                <rect x="30" y="0" width="8" height="40" fill="currentColor" />
                <rect x="42" y="0" width="2" height="40" fill="currentColor" />
                <rect x="48" y="0" width="4" height="40" fill="currentColor" />
                <rect x="56" y="0" width="10" height="40" fill="currentColor" />
                <rect x="70" y="0" width="2" height="40" fill="currentColor" />
                <rect x="76" y="0" width="4" height="40" fill="currentColor" />
                <rect x="84" y="0" width="6" height="40" fill="currentColor" />
                <rect x="94" y="0" width="2" height="40" fill="currentColor" />
                <rect x="100" y="0" width="8" height="40" fill="currentColor" />
                <rect x="112" y="0" width="2" height="40" fill="currentColor" />
                <rect x="118" y="0" width="4" height="40" fill="currentColor" />
                <rect x="126" y="0" width="12" height="40" fill="currentColor" />
                <rect x="142" y="0" width="2" height="40" fill="currentColor" />
                <rect x="148" y="0" width="4" height="40" fill="currentColor" />
                <rect x="156" y="0" width="2" height="40" fill="currentColor" />
                <rect x="162" y="0" width="8" height="40" fill="currentColor" />
                <rect x="174" y="0" width="2" height="40" fill="currentColor" />
                <rect x="180" y="0" width="6" height="40" fill="currentColor" />
                <rect x="190" y="0" width="2" height="40" fill="currentColor" />
                <rect x="196" y="0" width="4" height="40" fill="currentColor" />
              </svg>
            </div>
          </div>

          {/* Back Face */}
          <div className="card-face card-back">
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

            {/* Instant vCard Saver Button (Zero Emoji) */}
            <button className="brutalist-button save-vcard-btn" onClick={downloadVCard}>
              [ SAVE CONTACT TO ADDRESS BOOK (.VCF) ]
            </button>

            <a
              href="https://www.linkedin.com/in/mitesh-shah-6415777a/"
              target="_blank"
              rel="noopener noreferrer"
              className="brutalist-button"
              onClick={(e) => e.stopPropagation()}
            >
              CONNECT ON LINKEDIN
            </a>
            <a
              href="https://wa.me/qr/Y4BDLWGVOJ7WO1"
              target="_blank"
              rel="noopener noreferrer"
              className="brutalist-button"
              onClick={(e) => e.stopPropagation()}
            >
              CONNECT VIA WHATSAPP
            </a>
            <a
              href="https://www.instagram.com/mitesh.shah01?igsh=MWVsbHA2dnM5N2poMQ=="
              target="_blank"
              rel="noopener noreferrer"
              className="brutalist-button"
              onClick={(e) => e.stopPropagation()}
            >
              VIEW INSTAGRAM
            </a>
            <Link href="/" className="brutalist-button" onClick={(e) => e.stopPropagation()}>
              ENTER SYSTEM PORTFOLIO
            </Link>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
