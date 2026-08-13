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
      {/* 50/50 2-COLUMN LUXURY GRID LAYOUT */}
      <motion.div
        style={{
          opacity,
          y,
          width: "100%",
          maxWidth: "1400px",
          padding: "0 4rem",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          alignItems: "center",
          gap: "2rem",
          zIndex: 10,
        }}
      >
        {/* LEFT COLUMN: Locked to 520px Max-Width (Zero Collision with Right 3D 'M') */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1.8rem",
            maxWidth: "520px",
          }}
        >
          {/* Main Title */}
          <h1
            ref={textRef}
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "clamp(3.5rem, 5.5vw, 6.8rem)",
              lineHeight: 0.95,
              color: "#ffffff",
              margin: 0,
              textTransform: "none",
              letterSpacing: "-0.03em",
              willChange: "font-weight, letter-spacing",
            }}
          >
            Mitesh Shah
          </h1>

          {/* Single Truth Tagline (Strictly Left-Aligned, Clean Boundaries) */}
          <p
            style={{
              fontFamily: "monospace",
              fontSize: "0.95rem",
              lineHeight: 1.7,
              color: "rgba(255, 255, 255, 0.65)",
              margin: 0,
            }}
          >
            Architecting enterprise IT infrastructure at scale. Engineering world-class websites, high-performance native apps, and mindful literature.
          </p>
        </div>

        {/* RIGHT COLUMN: Dedicated Space for Centered 3D 'M' Monogram */}
        <div style={{ width: "100%", height: "100%" }} />
      </motion.div>
    </section>
  );
}