"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { RevealText, RevealBlock } from "./Reveal";

export default function BookSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  // Calculate dims and rotation based on scroll position
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0.1, 1, 1, 0.1]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.8, 1.1, 0.8]);
  // Spins the book completely around to show the back cover
  const rotateY = useTransform(scrollYProgress, [0, 1], [40, -220]);
  const rotateX = useTransform(scrollYProgress, [0, 1], [20, -5]);

  // Lighting overlay that gets darker as we scroll deep into the book section
  const overlayOpacity = useTransform(scrollYProgress, [0, 0.3, 0.6, 1], [0, 0.8, 0.8, 0]);

  return (
    <section
      ref={containerRef}
      style={{
        width: '100vw',
        minHeight: '150vh',
        position: 'relative',
        backgroundColor: '#000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10
      }}
    >
      <motion.div
        style={{
          opacity: overlayOpacity,
          position: 'absolute',
          inset: 0,
          background: '#000',
          pointerEvents: 'none',
          zIndex: 1
        }}
      />

      <div className="awwwards-book-container">
        <div className="awwwards-book-text">
          <RevealText>
            <h2 className="awwwards-heading">Divine Doodles</h2>
          </RevealText>
          <RevealBlock delay={0.1}>
            <h3 className="awwwards-subheading">Nurturing Young Souls</h3>
          </RevealBlock>
          <RevealBlock delay={0.2}>
            <p className="awwwards-copy">
              Developed in collaboration with child development specialists, this is more than a coloring book—it is an interactive gateway to early holistic growth. We present Hindu Gods and Goddesses through an approachable lens, sparking instant recognition and cultural curiosity. Bedtime transitions into a dreamy adventure with carefully crafted rhymes that elevate vocabulary and foster empathy. A mindful journey of imagination, love, and divine knowledge.
            </p>
            <motion.a
              href="https://www.amazon.com/Divine-Doodles-Toddler-Indian-Goddesses/dp/B0CFZGWJNB?ref_=ast_author_dp_rw&th=1&psc=1&dib=eyJ2IjoiMSJ9.aeTHMO6PQkdxe-TpIGnHdw.qWGqL0MqCuEC_OvVR2EYITYYJTI45lU6-V5_D1loFYc&dib_tag=AUTHOR"
              target="_blank"
              rel="noopener noreferrer"
              className="awwwards-amazon-btn"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Buy on Amazon
            </motion.a>
          </RevealBlock>
        </div>

        <motion.div
          style={{
            flex: 1,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            transformStyle: 'preserve-3d',
            opacity,
            scale,
            rotateX,
            rotateY,
            perspective: 1200
          }}
        >
          <div className="awwwards-book-mockup">
            <div className="awwwards-book-face awwwards-book-front" />
            <div className="awwwards-book-face awwwards-book-back" />
            <div className="awwwards-book-face awwwards-book-spine" />
            <div className="awwwards-book-face awwwards-book-pages-right" />
            <div className="awwwards-book-face awwwards-book-pages-top" />
            <div className="awwwards-book-face awwwards-book-pages-bottom" />
          </div>
        </motion.div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .awwwards-book-container {
          position: sticky;
          top: 0;
          height: 100vh;
          width: 100%;
          max-width: 1400px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 5vw;
          padding-bottom: 150px;
          box-sizing: border-box;
          z-index: 2;
        }
        .awwwards-book-text {
          flex: 1;
          color: white;
          z-index: 10;
        }
        @media (max-width: 992px) {
          .awwwards-book-container {
            flex-direction: column;
            justify-content: center;
            gap: 2rem;
            padding-top: 100px;
          }
          .awwwards-book-text {
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .awwwards-book-mockup {
            transform: scale(0.8);
          }
        }
        @media (max-width: 480px) {
           .awwwards-book-mockup {
              transform: scale(0.65);
           }
           .awwwards-heading {
             font-size: 2.5rem !important;
           }
           .awwwards-copy {
             font-size: 1rem !important;
           }
        }
        .awwwards-heading {
          font-family: serif;
          font-size: clamp(3rem, 5vw, 6rem);
          line-height: 1;
          color: #fff;
          margin-bottom: 0.5rem;
        }
        .awwwards-subheading {
          font-family: monospace;
          font-size: 1.2rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: rgba(255, 255, 255, 0.6);
          margin-bottom: 2.5rem;
        }
        .awwwards-copy {
          font-size: 1.25rem;
          line-height: 1.8;
          color: #ccc;
          max-width: 500px;
          margin-bottom: 3rem;
        }
        .awwwards-amazon-btn {
          display: inline-block;
          padding: 1rem 2rem;
          background: #fff;
          color: #000;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          border-radius: 4px;
          box-shadow: 0 10px 30px rgba(255, 255, 255, 0.1);
          text-decoration: none;
        }
        .awwwards-book-mockup {
          width: 300px;
          height: 450px;
          position: relative;
          transform-style: preserve-3d;
          box-shadow: 30px 40px 50px rgba(0,0,0,0.6);
          border-radius: 4px 16px 16px 4px;
        }
        .awwwards-book-face {
          position: absolute;
          backface-visibility: hidden;
          border-radius: 2px;
        }
        .awwwards-book-front {
          width: 300px;
          height: 450px;
          background-image: url('/book front.jpg');
          background-size: cover;
          background-position: center;
          transform: translateZ(20px);
          border-radius: 4px 16px 16px 4px;
          box-shadow: inset 4px 0 10px rgba(0,0,0,0.3);
        }
        .awwwards-book-back {
          width: 300px;
          height: 450px;
          background-image: url('/book back.jpg');
          background-size: cover;
          background-position: center;
          transform: rotateY(180deg) translateZ(20px);
          border-radius: 16px 4px 4px 16px;
          box-shadow: inset -4px 0 10px rgba(0,0,0,0.3);
        }
        .awwwards-book-spine {
          width: 40px;
          height: 450px;
          left: 130px; 
          background: #111; 
          transform: rotateY(-90deg) translateZ(150px);
        }
        .awwwards-book-pages-right {
          width: 40px;
          height: 440px;
          top: 5px;
          left: 130px;
          background: #fdfdfd;
          transform: rotateY(90deg) translateZ(148px);
          box-shadow: inset 0 0 10px rgba(0,0,0,0.1);
          background-image: repeating-linear-gradient(90deg, #fdfdfd, #fdfdfd 2px, #e0e0e0 4px);
        }
        .awwwards-book-pages-top {
          width: 290px;
          height: 40px;
          top: 205px;
          left: 5px;
          background: #fdfdfd;
          transform: rotateX(90deg) translateZ(223px);
          background-image: repeating-linear-gradient(0deg, #fdfdfd, #fdfdfd 2px, #e0e0e0 4px);
        }
        .awwwards-book-pages-bottom {
          width: 290px;
          height: 40px;
          top: 205px;
          left: 5px;
          background: #fdfdfd;
          transform: rotateX(-90deg) translateZ(223px);
          background-image: repeating-linear-gradient(0deg, #fdfdfd, #fdfdfd 2px, #e0e0e0 4px);
        }
      `}} />
    </section>
  );
}