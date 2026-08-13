"use client";

import React, { useState, useRef } from "react";
import { motion } from "framer-motion";

export default function BookParallax() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    setRotate({
      x: -y * 0.18,
      y: x * 0.18,
    });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotate({ x: 0, y: 0 });
  };

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        borderRadius: "0px",
        backgroundColor: "transparent",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        perspective: "1000px",
        overflow: "hidden",
        border: "none",
      }}
    >
      {/* Golden Aura Radial Glow */}
      <motion.div
        animate={{ scale: isHovered ? 1.5 : 1, opacity: isHovered ? 0.7 : 0.25 }}
        transition={{ duration: 0.3 }}
        style={{
          position: "absolute",
          width: "100px",
          height: "100px",
          borderRadius: "50%",
          background: "radial-gradient(circle, #f59e0b 0%, rgba(245, 158, 11, 0) 70%)",
          filter: "blur(18px)",
          pointerEvents: "none",
        }}
      />

      {/* Real Authentic 3D Divine Doodles Hardcover Book Mockup */}
      <motion.div
        animate={{ rotateX: rotate.x, rotateY: rotate.y }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        style={{
          width: "82px",
          height: "115px",
          borderRadius: "3px 8px 8px 3px",
          backgroundImage: "url('/book front.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          boxShadow: isHovered
            ? "15px 20px 30px rgba(0, 0, 0, 0.7), 0 0 25px rgba(245, 158, 11, 0.4)"
            : "10px 14px 20px rgba(0, 0, 0, 0.6)",
          transformStyle: "preserve-3d",
          cursor: "pointer",
          position: "relative",
        }}
      >
        {/* Real 3D Book Spine Shadow Effect */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "5px",
            height: "100%",
            background: "linear-gradient(to right, rgba(0,0,0,0.5), transparent)",
            borderRadius: "3px 0 0 3px",
          }}
        />
      </motion.div>
    </div>
  );
}
