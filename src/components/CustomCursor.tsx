"use client";

import React, { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export default function CustomCursor() {
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Mouse absolute position
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth springs for the outer trailing circle
  const springConfig = { stiffness: 300, damping: 24, mass: 0.5 };
  const cursorX = useSpring(mouseX, springConfig);
  const cursorY = useSpring(mouseY, springConfig);

  useEffect(() => {
    // Force visibility to true immediately to test if it's a hook issue
    setIsVisible(true);

    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };

    const handleMouseOver = (e: MouseEvent) => {
      let target = e.target as HTMLElement;
      
      while (target && target !== document.body) {
        if (
          target.tagName.toLowerCase() === "a" ||
          target.tagName.toLowerCase() === "button" ||
          target.hasAttribute("data-magnetic") ||
          window.getComputedStyle(target).cursor === "pointer"
        ) {
          setIsHovered(true);
          return;
        }
        target = target.parentElement as HTMLElement;
      }
      
      setIsHovered(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseover", handleMouseOver);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseover", handleMouseOver);
    };
  }, [mouseX, mouseY]);

  if (!isVisible) return null;

  return (
    <>
      {/* The Outer Spring Trailing Circle */}
      <motion.div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: 40,
          height: 40,
          border: "1px solid #ffffff",
          backgroundColor: isHovered ? "#ffffff" : "transparent",
          borderRadius: "50%",
          pointerEvents: "none",
          zIndex: 99999,
          transform: "translate(-50%, -50%)",
          x: cursorX,
          y: cursorY,
        }}
        animate={{
          scale: isHovered ? 1.5 : 1,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}
      />
      
      {/* The Immediate Inner Dot */}
      <motion.div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: 6,
          height: 6,
          backgroundColor: "#ffffff",
          borderRadius: "50%",
          pointerEvents: "none",
          zIndex: 100000,
          transform: "translate(-50%, -50%)",
          x: mouseX,
          y: mouseY,
        }}
        animate={{
          opacity: isHovered ? 0 : 1, // Hides the inner dot when scaled
          scale: isHovered ? 0 : 1
        }}
        transition={{ duration: 0.15 }}
      />
    </>
  );
}
