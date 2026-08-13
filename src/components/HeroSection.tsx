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
        .hero-cinema-container {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-end;
          padding-bottom: 5.5rem;
          pointer-events: none;
          z-index: 10;
        }

        .hero-scroll-indicator {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.6rem;
          opacity: 0.75;
          transition: opacity 0.3s ease;
        }

        .scroll-mouse-pill {
          width: 20px;
          height: 32px;
          border-radius: 12px;
          border: 1.5px solid rgba(255, 255, 255, 0.4);
          display: flex;
          justify-content: center;
          padding-top: 5px;
        }

        .scroll-dot {
          width: 3px;
          height: 6px;
          border-radius: 2px;
          background: #38bdf8;
          animation: scrollDown 2s infinite ease-in-out;
        }

        .scroll-label {
          font-family: monospace;
          font-size: 0.68rem;
          letter-spacing: 0.25em;
          color: rgba(255, 255, 255, 0.5);
          text-transform: uppercase;
        }

        @keyframes scrollDown {
          0% { transform: translateY(0); opacity: 1; }
          60% { transform: translateY(12px); opacity: 0; }
          100% { transform: translateY(0); opacity: 0; }
        }
      `,
        }}
      />

      {/* IMAX 70MM PURE CINEMATIC HERO */}
      <motion.div style={{ opacity }} className="hero-cinema-container">
        <div className="hero-scroll-indicator">
          <div className="scroll-mouse-pill">
            <div className="scroll-dot" />
          </div>
          <span className="scroll-label">SYSTEM READY</span>
        </div>
      </motion.div>
    </section>
  );
}