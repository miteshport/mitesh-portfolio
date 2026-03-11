"use client";

import { useRef, useEffect, useState } from "react";
import { useScroll, motion, useTransform } from "framer-motion";

export default function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLHeadingElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0]);
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!textRef.current) return;
      const { clientX, clientY } = e;
      const xPos = clientX / window.innerWidth;
      const yPos = clientY / window.innerHeight;

      setMousePos({ x: clientX, y: clientY });

      // Calculate font weight based on X pos
      const weight = Math.floor(xPos * 800) + 100; // 100 to 900

      // Calculate letter spacing based on Y pos
      const tracking = (yPos * 0.05) - 0.025; // -0.025em to 0.025em

      // Calculate skew based on X pos
      const skew = (xPos - 0.5) * -15;

      textRef.current.style.fontWeight = `${Math.min(Math.max(weight, 100), 900)}`;
      textRef.current.style.letterSpacing = `${tracking}em`;
      textRef.current.style.transform = `skewX(${skew}deg)`;
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <section
      ref={containerRef}
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        backgroundColor: '#000',
        overflow: 'hidden',
        zIndex: 10
      }}
    >
      {/* Subtle IT/Terminal Background Noise */}
      <div className="awwwards-terminal-bg" style={{
        position: 'absolute',
        inset: 0,
        opacity: 0.03,
        fontFamily: 'monospace',
        fontSize: '0.8rem',
        color: '#fff',
        pointerEvents: 'none',
        whiteSpace: 'pre',
        overflow: 'hidden',
        zIndex: 0
      }}>
        {Array.from({ length: 50 }).map((_, i) => (
          <div key={i}>
            [root@sys ~]# init sequence {Math.random().toString(36).substring(7)} | STATUS: OK | {new Date().toISOString()}
          </div>
        ))}
      </div>

      <motion.div
        style={{
          opacity,
          y,
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          gap: '3rem',
          zIndex: 1,
          padding: '0 2rem'
        }}
      >
        <h1
          ref={textRef}
          className="awwwards-hero-title"
        >
          The Architect.<br />
          The Author.<br />
          The Alchemist.
        </h1>

        <div className="awwwards-hero-sub">
          <p>
            I’m Mitesh Shah. By day, I engineer order out of chaos in enterprise IT. By night, I write children's books.
            My mission is to build digital experiences that perform flawlessly and craft stories, like my book Divine Doodles,
            that nurture young minds with imagination and divine knowledge.
          </p>
        </div>
      </motion.div>

      {/* Custom Cursor Tracker */}
      <div
        className="awwwards-cursor"
        style={{
          left: mousePos.x,
          top: mousePos.y,
        }}
      />

      <style dangerouslySetInnerHTML={{
        __html: `
        .awwwards-hero-title {
          font-family: 'Inter', sans-serif; /* Use a variable font here if possible */
          font-size: clamp(4rem, 10vw, 12rem);
          line-height: 0.85;
          text-transform: uppercase;
          color: #fff;
          margin: 0;
          transition: font-weight 0.1s ease-out, letter-spacing 0.1s ease-out, transform 0.1s ease-out;
          will-change: font-weight, letter-spacing, transform;
          cursor: crosshair;
        }
        .awwwards-hero-sub {
          font-family: monospace;
          font-size: 1rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: rgba(255, 255, 255, 0.5);
          max-width: 800px;
          margin: 0 auto;
          line-height: 1.8;
        }
        .awwwards-cursor {
          position: fixed;
          width: 20px;
          height: 20px;
          border: 1px solid rgba(255,255,255,0.5);
          border-radius: 50%;
          pointer-events: none;
          transform: translate(-50%, -50%);
          z-index: 9999;
          transition: width 0.2s, height 0.2s, background-color 0.2s;
          mix-blend-mode: difference;
        }
        .awwwards-hero-title:hover ~ .awwwards-cursor {
          width: 80px;
          height: 80px;
          background-color: #fff;
        }
        /* Matrix Scroll Animation for IT background */
        @keyframes scrollUp {
          from { transform: translateY(0); }
          to { transform: translateY(-50%); }
        }
        .awwwards-terminal-bg {
          animation: scrollUp 60s linear infinite;
        }
        @media (hover: none) and (pointer: coarse), (max-width: 768px) {
          .awwwards-cursor { display: none !important; }
        }
      `}} />
    </section>
  );
}