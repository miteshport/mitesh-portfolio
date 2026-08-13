"use client";

import { useRef, useEffect } from "react";
import { useScroll, motion, useTransform } from "framer-motion";

export default function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLHeadingElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!textRef.current) return;
      const { clientX, clientY } = e;
      const xPos = clientX / window.innerWidth;
      const yPos = clientY / window.innerHeight;

      // Dynamic typography weight & letter tracking
      const weight = Math.floor(xPos * 600) + 300; // 300 to 900
      const tracking = yPos * 0.04 - 0.02; // -0.02em to 0.02em

      textRef.current.style.fontWeight = `${Math.min(Math.max(weight, 300), 900)}`;
      textRef.current.style.letterSpacing = `${tracking}em`;
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <section
      ref={containerRef}
      style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        backgroundColor: "transparent",
        overflow: "hidden",
        zIndex: 10,
      }}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .hero-editorial-layout {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          width: 90%;
          max-width: 860px;
          margin: 0 auto;
          gap: 1.2rem;
          z-index: 10;
          pointer-events: auto;
        }

        .hero-title {
          font-family: 'Inter', sans-serif;
          font-size: clamp(2.4rem, 5.5vw, 4.4rem);
          font-weight: 700;
          line-height: 1.05;
          color: #ffffff;
          margin: 0;
          letter-spacing: -0.02em;
          text-shadow: 0 4px 28px rgba(0, 0, 0, 0.95), 0 0 50px rgba(0, 0, 0, 0.85);
          user-select: none;
        }

        .hero-pill-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.6rem;
          padding: 0.65rem 1.5rem;
          border-radius: 9999px;
          background: rgba(6, 4, 12, 0.55) !important;
          border: 1px solid rgba(255, 255, 255, 0.16) !important;
          backdrop-filter: blur(24px) saturate(160%) !important;
          -webkit-backdrop-filter: blur(24px) saturate(160%) !important;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.7), inset 0 1px 1px rgba(255, 255, 255, 0.2);
          max-width: 100%;
        }

        .hero-pill-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #22c55e;
          box-shadow: 0 0 8px #22c55e;
          flex-shrink: 0;
        }

        .hero-tagline {
          font-family: monospace;
          font-size: clamp(0.68rem, 1.4vw, 0.82rem);
          letter-spacing: 0.12em;
          color: rgba(255, 255, 255, 0.88);
          margin: 0;
          text-transform: uppercase;
          line-height: 1.4;
          white-space: normal;
        }

        @media (max-width: 640px) {
          .hero-editorial-layout {
            gap: 0.9rem;
            padding: 0 0.8rem;
          }
          .hero-title {
            font-size: clamp(2.1rem, 9vw, 2.9rem) !important;
          }
          .hero-pill-badge {
            padding: 0.5rem 1rem;
            border-radius: 9999px;
            gap: 0.45rem;
          }
          .hero-tagline {
            font-size: 0.68rem !important;
            letter-spacing: 0.08em;
          }
        }
      `,
        }}
      />

      {/* REFINED ARCHITECTURAL HERO CENTERPIECE */}
      <motion.div style={{ opacity, y }} className="hero-editorial-layout">
        {/* Main Monogram Authority Name */}
        <h1 ref={textRef} className="hero-title">
          Mitesh Shah
        </h1>

        {/* High-Legibility Liquid Glass Pillar Badge */}
        <div className="hero-pill-badge">
          <div className="hero-pill-dot" />
          <p className="hero-tagline">
            Enterprise IT Architecture · Incident Command · Scaled Systems
          </p>
        </div>
      </motion.div>
    </section>
  );
}