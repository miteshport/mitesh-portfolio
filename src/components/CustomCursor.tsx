"use client";

import React, { useEffect, useRef, useState } from "react";

export default function CustomCursor() {
  const [isPointer, setIsPointer] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const mousePos = useRef({ x: -100, y: -100 });
  const lerpPos = useRef({ x: -100, y: -100 });
  const dotRef = useRef<HTMLDivElement>(null);
  const auraRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
      if (!isVisible) setIsVisible(true);

      const target = e.target as HTMLElement;
      if (target) {
        const isClickable =
          target.tagName === "BUTTON" ||
          target.tagName === "A" ||
          target.closest("a") !== null ||
          target.closest("button") !== null ||
          target.onclick !== null ||
          window.getComputedStyle(target).cursor === "pointer";

        setIsPointer(isClickable);
      }
    };

    const handleMouseLeave = () => setIsVisible(false);

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    document.body.addEventListener("mouseleave", handleMouseLeave);

    // 60fps Lerp Loop for Ambient Trailing Aura Ring
    let animationFrameId: number;

    const render = () => {
      // 1. Center Micro-Dot: Instant tracking (0 lag)
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${mousePos.current.x}px, ${mousePos.current.y}px, 0) translate(-50%, -50%)`;
      }

      // 2. Outer Trailing Aura Ring: Smooth Lerp Interpolation
      const ease = 0.16;
      lerpPos.current.x += (mousePos.current.x - lerpPos.current.x) * ease;
      lerpPos.current.y += (mousePos.current.y - lerpPos.current.y) * ease;

      if (auraRef.current) {
        auraRef.current.style.transform = `translate3d(${lerpPos.current.x}px, ${lerpPos.current.y}px, 0) translate(-50%, -50%)`;
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.body.removeEventListener("mouseleave", handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <>
      {/* 1. Precision Center Micro-Dot (0 Lag, Instant Tracking) */}
      <div
        ref={dotRef}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "6px",
          height: "6px",
          backgroundColor: "#ffffff",
          borderRadius: "50%",
          pointerEvents: "none",
          zIndex: 999999,
          boxShadow: "0 0 10px #ffffff, 0 0 20px #ffffff",
          willChange: "transform",
        }}
      />

      {/* 2. Delicate Trailing Ambient Aura Ring (60fps Lerp Drag) */}
      <div
        ref={auraRef}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: isPointer ? "42px" : "28px",
          height: isPointer ? "42px" : "28px",
          backgroundColor: isPointer ? "rgba(34, 197, 94, 0.08)" : "transparent",
          border: isPointer ? "1.5px solid rgba(34, 197, 94, 0.85)" : "1px solid rgba(255, 255, 255, 0.25)",
          borderRadius: "50%",
          pointerEvents: "none",
          zIndex: 999998,
          transition: "width 0.22s ease-out, height 0.22s ease-out, background-color 0.22s ease-out, border-color 0.22s ease-out",
          boxShadow: isPointer ? "0 0 20px rgba(34, 197, 94, 0.35)" : "none",
          willChange: "transform",
        }}
      />
    </>
  );
}
