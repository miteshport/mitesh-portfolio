"use client";
import { useRef, useState } from "react";
import { motion } from "framer-motion";

export default function MagneticLink({ children, href }: { children: React.ReactNode; href: string }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouse = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    const { clientX, clientY } = e;
    if (!ref.current) return;
    const { height, width, left, top } = ref.current.getBoundingClientRect();
    const middleX = clientX - (left + width / 2);
    const middleY = clientY - (top + height / 2);
    setPosition({ x: middleX * 0.4, y: middleY * 0.4 });
  };

  const reset = () => {
    setPosition({ x: 0, y: 0 });
  };

  const { x, y } = position;

  return (
    <>
      <motion.a
        ref={ref}
        onMouseMove={handleMouse}
        onMouseLeave={reset}
        animate={{ x, y }}
        transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}
        href={href}
        target={href.startsWith("http") ? "_blank" : "_self"}
        rel="noopener noreferrer"
        className="awwwards-magnetic-link"
      >
        {children}
      </motion.a>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .awwwards-magnetic-link {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0.75rem 1.6rem;
          border-radius: 40px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.12);
          color: #ffffff;
          font-family: monospace;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          font-size: 0.8rem;
          cursor: pointer;
          will-change: transform;
          text-decoration: none;
          z-index: 50;
          transition: all 0.3s ease;
        }
        .awwwards-magnetic-link:hover {
          background: rgba(255, 255, 255, 0.15);
          border-color: #38bdf8;
          color: #ffffff;
          box-shadow: 0 0 20px rgba(56, 189, 248, 0.3);
        }
      `,
        }}
      />
    </>
  );
}
