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
        .hero-grid-layout {
          display: grid;
          grid-template-columns: 1fr 1fr;
          align-items: center;
          gap: 2rem;
          width: 100%;
          max-width: 1400px;
          padding: 0 4rem;
          z-index: 10;
        }

        .hero-title {
          font-family: 'Inter', sans-serif;
          font-size: clamp(3.5rem, 5.5vw, 6.8rem);
          line-height: 0.95;
          color: #ffffff;
          margin: 0;
          letter-spacing: -0.03em;
        }

        .hero-tagline {
          font-family: monospace;
          font-size: 0.95rem;
          line-height: 1.7;
          color: rgba(255, 255, 255, 0.65);
          margin: 0;
        }

        @media (max-width: 768px) {
          .hero-grid-layout {
            grid-template-columns: 1fr;
            padding: 0 1.5rem;
            gap: 1rem;
            text-align: left;
          }
          .hero-title {
            font-size: clamp(2.4rem, 8vw, 3.8rem) !important;
          }
          .hero-tagline {
            font-size: 0.85rem !important;
            line-height: 1.5 !important;
          }
        }
      `,
        }}
      />

      {/* 50/50 2-COLUMN LUXURY GRID LAYOUT */}
      <motion.div style={{ opacity, y }} className="hero-grid-layout">
        {/* LEFT COLUMN: Locked to 520px Max-Width */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1.2rem",
            maxWidth: "520px",
          }}
        >
          {/* Main Title */}
          <h1 ref={textRef} className="hero-title">
            Mitesh Shah
          </h1>

          {/* Single Truth Tagline */}
          <p className="hero-tagline">
            Architecting enterprise IT infrastructure at scale. Engineering world-class websites, high-performance native apps, and mindful literature.
          </p>
        </div>

        {/* RIGHT COLUMN: Dedicated Space for Centered 3D 'M' Monogram */}
        <div style={{ width: "100%", height: "100%" }} />
      </motion.div>
    </section>
  );
}