"use client";

import { useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useVelocity,
} from "framer-motion";

export default function ProjectsSection() {
  const targetRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: targetRef,
  });

  const scrollVelocity = useVelocity(scrollYProgress);
  const smoothVelocity = useSpring(scrollVelocity, {
    damping: 50,
    stiffness: 400,
  });

  const velocitySkew = useTransform(smoothVelocity, [-1, 1], [5, -5]);
  const skewX = useSpring(velocitySkew, { damping: 20, stiffness: 100 });

  const x = useTransform(scrollYProgress, [0, 1], ["0%", "-50%"]);
  const bgX1 = useTransform(scrollYProgress, [0, 1], ["-10%", "10%"]);
  const bgX2 = useTransform(scrollYProgress, [0, 1], ["-15%", "5%"]);

  return (
    <section
      ref={targetRef}
      style={{ position: 'relative', height: '250vh', background: '#000', zIndex: 20 }}
    >
      <div style={{ position: 'sticky', top: 0, height: '100vh', display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
        <motion.div style={{ x, display: 'flex', gap: '6vw', padding: '0 10vw', width: '250vw' }}>

          {/* Card 1: Coffee & Donut TV */}
          <motion.a
            style={{ skewX }}
            href="https://www.coffeedonuttv.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="awwwards-project-card"
          >
            <motion.div
              style={{ x: bgX1, backgroundImage: "url(/coffeedonuttv.png)" }}
              className="awwwards-bg"
            />
            <div className="awwwards-content">
              <h2>Coffee & Donut TV</h2>
              <div className="awwwards-meta">
                <span className="awwwards-tag">Role: Developer</span>
                <span className="awwwards-tag">Tech: SaaS, Streaming</span>
              </div>
            </div>
            <div className="awwwards-view">View Project <span>→</span></div>
          </motion.a>

          {/* Card 2: Pratyaksh Gyan */}
          <motion.a
            style={{ skewX }}
            href="https://pratyakshgyan.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="awwwards-project-card"
          >
            <motion.div
              style={{ x: bgX2, backgroundImage: "url(/pratyakshgyan.png)" }}
              className="awwwards-bg"
            />
            <div className="awwwards-content">
              <h2>Pratyaksh Gyan</h2>
              <div className="awwwards-meta">
                <span className="awwwards-tag">Role: Developer</span>
                <span className="awwwards-tag">Tech: WebGL, Agent-Driven</span>
              </div>
            </div>
            <div className="awwwards-view">View Project <span>→</span></div>
          </motion.a>

        </motion.div>
      </div>

      {/* Bulletproof CSS Injection */}
      <style dangerouslySetInnerHTML={{
        __html: `
        .awwwards-project-card {
          width: 80vw;
          height: 75vh;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          padding: 4rem;
          border-radius: 12px;
          cursor: pointer;
          transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
          overflow: hidden;
          position: relative;
          background: #111;
          border: 1px solid rgba(255, 255, 255, 0.05);
          text-decoration: none;
          transform-origin: bottom center;
        }
        .awwwards-project-card:hover {
          transform: scale(0.97);
        }
        .awwwards-bg {
          position: absolute;
          top: -10%;
          left: -10%;
          width: 120%;
          height: 120%;
          background-size: cover;
          background-position: center;
          opacity: 0.15;
          filter: grayscale(100%);
          transition: filter 0.8s ease, opacity 0.8s ease;
          z-index: 0;
        }
        .awwwards-project-card:hover .awwwards-bg {
          opacity: 0.6;
          filter: grayscale(0%);
        }
        .awwwards-content {
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          gap: 1.5rem;
          position: relative;
          z-index: 1;
        }
        .awwwards-project-card h2 {
          font-family: serif;
          font-size: clamp(3rem, 6vw, 7rem);
          line-height: 1;
          color: #fff;
          margin: 0;
          transform: translateY(20px);
          transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .awwwards-project-card:hover h2 {
          transform: translateY(0);
        }
        .awwwards-meta {
          display: flex;
          gap: 1.5rem;
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 0.4s ease, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .awwwards-project-card:hover .awwwards-meta {
          opacity: 1;
          transform: translateY(0);
          transition-delay: 0.1s;
        }
        .awwwards-tag {
          font-family: monospace;
          font-size: 1rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #fff;
          padding: 0.5rem 1rem;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(5px);
          border-radius: 4px;
        }
        .awwwards-view {
          position: absolute;
          top: 3rem;
          right: 3rem;
          width: 100px;
          height: 100px;
          background: #fff;
          color: #000;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 0.9rem;
          text-transform: uppercase;
          opacity: 0;
          transform: scale(0.5);
          transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
          z-index: 2;
        }
        .awwwards-project-card:hover .awwwards-view {
          opacity: 1;
          transform: scale(1);
        }
        .awwwards-view span {
          margin-left: 0.3rem;
          transition: transform 0.3s ease;
        }
        .awwwards-project-card:hover .awwwards-view:hover span {
          transform: translateX(5px);
        }

        @media (max-width: 768px) {
          .awwwards-project-card {
            width: 85vw;
            padding: 2rem;
            height: 65vh;
          }
          .awwwards-project-card h2 {
            font-size: clamp(2rem, 8vw, 4rem);
            transform: translateY(0);
          }
          .awwwards-meta {
            opacity: 1;
            transform: translateY(0);
            flex-wrap: wrap;
            gap: 0.5rem;
          }
          .awwwards-view {
            opacity: 1;
            transform: scale(0.85);
            top: 1rem;
            right: 1rem;
            width: 80px;
            height: 80px;
          }
          .awwwards-bg {
             opacity: 0.3;
             filter: grayscale(50%);
          }
        }

        @media (hover: none) and (pointer: coarse) {
          .awwwards-project-card h2, .awwwards-meta {
            transform: translateY(0);
            opacity: 1;
          }
          .awwwards-view {
            opacity: 1;
            transform: scale(0.85);
          }
          .awwwards-bg {
             opacity: 0.4;
             filter: grayscale(50%);
          }
        }
      `}} />
    </section>
  );
}