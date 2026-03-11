"use client";
import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function MagneticLink({ children, href }: { children: React.ReactNode, href: string }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

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
    setIsHovered(false);
  };

  const { x, y } = position;

  return (
    <>
      <motion.a
        ref={ref}
        onMouseMove={handleMouse}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={reset}
        animate={{ x, y }}
        transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="awwwards-magnetic-link"
      >
        {children}

        <AnimatePresence>
          {isHovered && (
            <motion.div 
              className="awwwards-hover-preview"
              initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3 }}
            >
              <div className="awwwards-preview-content">
                <span className="awwwards-insta-icon">IG</span>
                <p className="awwwards-latest-post-txt">Latest Post</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.a>
      <style dangerouslySetInnerHTML={{ __html: `
        .awwwards-magnetic-link { position: relative; display: inline-flex; align-items: center; justify-content: center; padding: 1rem 2rem; border-radius: 40px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #fff; font-family: monospace; text-transform: uppercase; letter-spacing: 0.05em; font-size: 0.9rem; cursor: pointer; will-change: transform; text-decoration: none; z-index: 50; }
        .awwwards-hover-preview { position: absolute; bottom: 150%; left: 50%; transform: translateX(-50%); width: 150px; height: 150px; background: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%); border-radius: 12px; pointer-events: none; display: flex; align-items: center; justify-content: center; z-index: 100; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5); filter: contrast(1.2) saturate(1.5); }
        .awwwards-preview-content { text-align: center; color: white; mix-blend-mode: overlay; }
        .awwwards-insta-icon { font-family: serif; font-size: 3rem; font-weight: 800; display: block; }
        .awwwards-latest-post-txt { font-size: 0.7rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; margin-top: 0.5rem; }
      `}} />
    </>
  );
}
