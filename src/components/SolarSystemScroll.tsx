"use client";

import { motion, useScroll, useTransform } from "framer-motion";

export default function SolarSystemScroll() {
  const { scrollYProgress } = useScroll();

  // Rotate planet as user scrolls
  const rotate = useTransform(scrollYProgress, [0, 1], [0, 360]);
  
  // Parallax the size slightly based on scroll
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.8, 1, 0.8]);

  return (
    <>
      <div className="solar-system-wrapper">
        <motion.div 
          className="awwwards-planet"
          style={{ rotate, scale }}
        >
          {/* Internal texture / lines of the planet */}
          <div className="planet-ring"></div>
          <div className="planet-texture"></div>
        </motion.div>
        <div className="planet-shadow"></div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .solar-system-wrapper {
          position: fixed;
          bottom: 2rem;
          right: 15vw; /* Positioned on the bottom right comfortably away from the absolute edge */
          width: 80px;
          height: 80px;
          z-index: 999;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
        }

        .awwwards-planet {
          position: relative;
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.2), rgba(0,0,0,0.8));
          box-shadow: inset -10px -10px 20px rgba(0,0,0,0.9),
                      0 0 20px rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.1);
        }

        .planet-texture {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 4px,
            rgba(255, 255, 255, 0.05) 5px,
            rgba(255, 255, 255, 0.05) 6px
          );
          opacity: 0.5;
        }

        .planet-ring {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 140%;
          height: 140%;
          transform: translate(-50%, -50%) rotate(70deg) scaleY(0.3);
          border-radius: 50%;
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-top: 1px solid rgba(255, 255, 255, 0.4);
          box-shadow: 0 0 10px rgba(255,255,255,0.1);
        }

        .planet-shadow {
          position: absolute;
          bottom: -10px;
          width: 40px;
          height: 10px;
          background: rgba(0,0,0,0.5);
          border-radius: 50%;
          filter: blur(5px);
        }

        @media (max-width: 768px) {
          .solar-system-wrapper {
            transform: scale(0.6);
            bottom: 1rem;
            right: 1rem; /* Adjust back to edge organically on mobile */
          }
        }
        `
      }} />
    </>
  );
}
