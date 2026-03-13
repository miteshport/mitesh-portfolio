"use client";

import React, { useState, useRef } from "react";
import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";
import Link from "next/link";
import NoiseOverlay from "@/components/NoiseOverlay";

export default function CardPage() {
  const [isFlipped, setIsFlipped] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Motion values for tilt
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Smooth out the motion values for the tilt
  const springX = useSpring(x, { stiffness: 300, damping: 30 });
  const springY = useSpring(y, { stiffness: 300, damping: 30 });

  // Map mouse position to rotation values
  const rotateX = useTransform(springY, [-0.5, 0.5], [15, -15]);
  const rotateY = useTransform(springX, [-0.5, 0.5], [-15, 15]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    // Normalize mouse position between -0.5 and 0.5
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const glareX = useTransform(springX, [-0.5, 0.5], ["0%", "100%"]);
  const glareY = useTransform(springY, [-0.5, 0.5], ["0%", "100%"]);

  return (
    <div className="card-page-container">
      <NoiseOverlay />
      <style dangerouslySetInnerHTML={{__html: `
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          background: #050505;
        }

        .card-page-container {
          width: 100vw;
          height: 100vh;
          overflow: hidden;
          background: #050505;
          display: flex;
          align-items: center;
          justify-content: center;
          perspective: 1200px;
          color: white;
        }

        .card-wrapper {
          width: 90vw;
          max-width: 400px;
          height: 70vh;
          max-height: 600px;
          min-height: 500px;
          position: relative;
          cursor: pointer;
          transform-style: preserve-3d;
        }

        .floating-link {
          position: absolute;
          top: 2rem;
          left: 2rem;
          z-index: 50;
          font-family: monospace;
          font-size: 0.7rem;
          letter-spacing: 2px;
          color: rgba(255, 255, 255, 0.5);
          text-decoration: none;
          transition: all 0.2s ease;
        }

        .floating-link:hover {
          opacity: 1;
          color: rgba(255, 255, 255, 1);
          text-shadow: 0 0 8px rgba(255,255,255,0.8);
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
          padding: 2rem;
          border-radius: 24px;
          background: rgba(20, 20, 20, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          overflow: hidden;
        }

        .card-front {
          justify-content: space-between;
        }

        .card-back {
          transform: rotateY(180deg);
          justify-content: center;
          align-items: center;
          gap: 1.5rem;
        }

        .sys-online {
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: monospace;
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.6);
          transform: translateZ(30px);
        }

        .dot {
          width: 8px;
          height: 8px;
          background: #00ff00;
          border-radius: 50%;
          box-shadow: 0 0 8px #00ff00;
          animation: blink 1.5s infinite alternate;
        }

        @keyframes blink {
          0% { opacity: 0.3; }
          100% { opacity: 1; box-shadow: 0 0 12px #00ff00; }
        }

        .identity {
          text-align: center;
          transform: translateZ(50px);
        }

        .name {
          font-family: "Georgia", serif;
          font-size: 3rem;
          font-weight: 400;
          letter-spacing: -1px;
          line-height: 1.1;
          margin-bottom: 0.5rem;
          text-transform: uppercase;
          text-shadow: 0 4px 12px rgba(0,0,0,0.5);
        }

        .subtitle {
          font-family: monospace;
          font-size: 0.75rem;
          letter-spacing: 2px;
          color: rgba(255, 255, 255, 0.5);
        }

        .barcode-container {
          display: flex;
          justify-content: center;
          align-items: center;
          transform: translateZ(20px);
          padding-bottom: 1rem;
        }

        .barcode {
          width: 80%;
          height: 40px;
          animation: barcode-pulse 4s ease-in-out infinite alternate;
          color: rgba(255, 255, 255, 0.3);
        }

        @keyframes barcode-pulse {
          0% { transform: scaleX(0.95) scaleY(0.95); opacity: 0.7; }
          100% { transform: scaleX(1.05) scaleY(1.05); opacity: 1; }
        }

        .brutalist-button {
          width: 100%;
          padding: 1.25rem;
          background: transparent;
          border: 1px solid rgba(255,255,255,0.2);
          color: white;
          font-family: monospace;
          font-size: 1rem;
          font-weight: bold;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.25, 1, 0.5, 1);
          border-radius: 8px;
          transform: translateZ(40px);
          position: relative;
          overflow: hidden;
          text-decoration: none;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .brutalist-button:hover, .brutalist-button:active {
          background: white;
          color: #050505;
          border-color: white;
          transform: translateZ(50px) scale(1.02);
          box-shadow: 0 10px 20px rgba(0,0,0,0.4);
        }

        .brutalist-button:active {
          transform: translateZ(30px) scale(0.98);
        }
      `}} />

      <Link href="/" className="floating-link">
        &larr; PORTFOLIO
      </Link>

      <motion.div
        className="card-wrapper"
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={() => setIsFlipped(!isFlipped)}
        initial={{ y: 50, opacity: 0, scale: 0.9 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 100, damping: 20, mass: 1 }}
        style={{
          rotateX,
          rotateY
        }}
      >
        <motion.div
          className="holographic-card"
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 60, damping: 15 }}
        >
          {/* Front Face */}
          <div className="card-face card-front">
            {/* Holographic Glare */}
            <motion.div
              style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(105deg, transparent 20%, rgba(0, 255, 255, 0.15) 25%, rgba(255, 255, 255, 0.1) 27%, transparent 30%)",
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
              SYS: ONLINE
            </div>
            
            <div className="identity">
              <h1 className="name">Mitesh Shah</h1>
              <div className="subtitle">THE ARCHITECT &bull; IT OPERATIONS & WEBGL</div>
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
            {/* Holographic Glare for Back */}
            <motion.div
              style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(105deg, transparent 20%, rgba(0, 255, 255, 0.15) 25%, rgba(255, 255, 255, 0.1) 27%, transparent 30%)",
                backgroundSize: "200% 200%",
                backgroundPositionX: glareX,
                backgroundPositionY: glareY,
                mixBlendMode: "screen",
                pointerEvents: "none",
                zIndex: 10,
                transform: "rotateY(180deg)" /* Reverse the gradient direction for the mirrored back */
              }}
            />

            <a href="https://wa.me/qr/Y4BDLWGVOJ7WO1" target="_blank" rel="noopener noreferrer" className="brutalist-button" onClick={(e) => e.stopPropagation()}>
              CONNECT VIA WHATSAPP
            </a>
            <a href="https://www.fiverr.com/s/KeQ86aV" target="_blank" rel="noopener noreferrer" className="brutalist-button" onClick={(e) => e.stopPropagation()}>
              HIRE ON FIVERR
            </a>
            <a href="https://www.instagram.com/mitesh.shah01?igsh=MWVsbHA2dnM5N2poMQ==" target="_blank" rel="noopener noreferrer" className="brutalist-button" onClick={(e) => e.stopPropagation()}>
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
