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
        // gamma: left-to-right tilt (-90 to 90), beta: front-to-back tilt (-180 to 180)
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

  return (
    <div className="card-page-container">
      {/* Global Sleek Awwwards Micro-Dot Cursor */}
      <CustomCursor />

      <style
        dangerouslySetInnerHTML={{
          __html: `
        * {
          box-sizing: border-box;
        }
        body {
          margin: 0;
          background: radial-gradient(ellipse at 65% 45%, #181033 0%, #06040c 100%);
          background-attachment: fixed;
          overflow: hidden;
        }
        .card-page-container {
          width: 100vw;
          height: 100vh;
          overflow: hidden;
          background: radial-gradient(ellipse at 65% 45%, #181033 0%, #06040c 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          perspective: 1200px;
          color: white;
          position: relative;
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
          background-color: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(10px);
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
        .card-face {
          position: absolute;
          inset: 0;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          display: flex;
          flex-direction: column;
          padding: 2.2rem;
          border-radius: 24px;
          background: rgba(15, 12, 30, 0.75);
          border: 1px solid rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(25px);
          -webkit-backdrop-filter: blur(25px);
          box-shadow: 0 30px 60px -12px rgba(0, 0, 0, 0.8), 0 0 30px rgba(168, 85, 247, 0.2);
          overflow: hidden;
        }
        .card-front {
          justify-content: space-between;
        }
        .card-back {
          transform: rotateY(180deg);
          justify-content: center;
          align-items: center;
          gap: 1.2rem;
        }
        .sys-online {
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: monospace;
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.7);
          transform: translateZ(30px);
          letter-spacing: 0.1em;
        }
        .dot {
          width: 8px;
          height: 8px;
          background: #22c55e;
          border-radius: 50%;
          box-shadow: 0 0 10px #22c55e;
          animation: blink 1.5s infinite alternate;
        }
        @keyframes blink {
          0% { opacity: 0.3; }
          100% { opacity: 1; box-shadow: 0 0 14px #22c55e; }
        }
        .identity {
          text-align: center;
          transform: translateZ(50px);
        }
        .name {
          font-family: "Georgia", serif;
          font-style: italic;
          font-size: 2.8rem;
          font-weight: 400;
          letter-spacing: -1px;
          line-height: 1.1;
          margin-bottom: 0.6rem;
          color: #ffffff;
        }
        .subtitle {
          font-family: monospace;
          font-size: 0.75rem;
          letter-spacing: 0.15em;
          color: rgba(255, 255, 255, 0.65);
          line-height: 1.6;
        }
        .barcode-container {
          display: flex;
          justify-content: center;
          align-items: center;
          transform: translateZ(20px);
          padding-bottom: 0.5rem;
        }
        .barcode {
          width: 80%;
          height: 38px;
          color: rgba(255, 255, 255, 0.4);
        }
        .brutalist-button {
          width: 100%;
          padding: 1.1rem;
          background: transparent;
          border: 1px solid rgba(255,255,255,0.2);
          color: white;
          font-family: monospace;
          font-size: 0.85rem;
          font-weight: bold;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.25, 1, 0.5, 1);
          border-radius: 8px;
          transform: translateZ(40px);
          text-decoration: none;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .brutalist-button:hover {
          background: white;
          color: #050505;
          border-color: white;
          transform: translateZ(50px) scale(1.02);
          box-shadow: 0 10px 20px rgba(0,0,0,0.4);
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
                  "linear-gradient(105deg, transparent 20%, rgba(56, 189, 248, 0.2) 25%, rgba(255, 255, 255, 0.18) 27%, transparent 30%)",
                backgroundSize: "200% 200%",
                backgroundPositionX: glareX,
                backgroundPositionY: glareY,
                mixBlendMode: "screen",
                pointerEvents: "none",
                zIndex: 10,
              }}
            />

            <div className="sys-online">
              <div className="dot"></div>
              SYS: OPTIMAL
            </div>

            <div className="identity">
              <h1 className="name">Mitesh Shah</h1>
              <div className="subtitle">
                I operate at the critical intersection of enterprise system architecture, major incident command, and creative storytelling. Built with precision, scale, and care.
              </div>
            </div>

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
                  "linear-gradient(105deg, transparent 20%, rgba(56, 189, 248, 0.2) 25%, rgba(255, 255, 255, 0.18) 27%, transparent 30%)",
                backgroundSize: "200% 200%",
                backgroundPositionX: glareX,
                backgroundPositionY: glareY,
                mixBlendMode: "screen",
                pointerEvents: "none",
                zIndex: 10,
                transform: "rotateY(180deg)",
              }}
            />

            <a
              href="https://www.linkedin.com/in/miteshbshah"
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
