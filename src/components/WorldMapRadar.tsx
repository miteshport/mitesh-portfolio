"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Dot {
  baseX: number;
  baseY: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  phase: number;
}

export default function WorldMapRadar() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [isBeaconHovered, setIsBeaconHovered] = useState(false);

  const mouseRef = useRef({ x: -999, y: -999, speed: 0 });
  const dotsRef = useRef<Dot[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Handle High-DPI Canvas Sizing
    const width = canvas.offsetWidth || 400;
    const height = canvas.offsetHeight || 250;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // REFINED ACCURATE WORLD CONTINENT MATRIX (20 rows x 50 cols)
    // Accurate geography of Americas, Europe, Africa, Asia, India, and Oceania
    const mapMatrix: number[][] = [
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,1,1,1,1,1,1,0,0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0,0,0,1,1,1,1,1,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0],
      [0,1,1,1,1,1,1,1,1,1,0,0,0,0,0,1,1,1,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
      [0,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
      [0,0,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
      [0,0,0,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
      [0,0,0,0,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0],
      [0,0,0,0,0,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0],
      [0,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0],
      [0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,1,1,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,1,1,1,1,1,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0,0,1,1,1,1,1,1,1,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0,0,0,1,1,1,1,1,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0,1,1,1,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0],
    ];

    const matrixRows = mapMatrix.length;
    const matrixCols = mapMatrix[0].length;

    const cellWidth = width / matrixCols;
    const cellHeight = height / matrixRows;

    const dots: Dot[] = [];

    for (let r = 0; r < matrixRows; r++) {
      for (let c = 0; c < matrixCols; c++) {
        if (mapMatrix[r][c] === 1) {
          const x = c * cellWidth + cellWidth / 2;
          const y = r * cellHeight + cellHeight / 2;
          dots.push({
            baseX: x,
            baseY: y,
            x: x,
            y: y,
            vx: 0,
            vy: 0,
            size: 1.5,
            phase: Math.random() * Math.PI * 2,
          });
        }
      }
    }

    dotsRef.current = dots;

    // 60fps Whisper-Quiet "Lucid Magic" Physics Loop
    let animationFrameId: number;

    const render = (time: number) => {
      ctx.clearRect(0, 0, width, height);

      const mouse = mouseRef.current;
      const repulsionRadius = 80;
      const damping = 0.92; // Velvet Silk Damping (Zero Jitter)
      const springStiffness = 0.04; // Buttery Soft Return Inertia
      const t = time * 0.001;

      dotsRef.current.forEach((dot, idx) => {
        // 1. Soft Whisper-Quiet Vector Repulsion
        const dx = dot.x - mouse.x;
        const dy = dot.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < repulsionRadius && dist > 0) {
          const factor = 1.0 - dist / repulsionRadius;
          const pushForce = Math.pow(factor, 2) * (1.2 + Math.min(mouse.speed * 0.08, 2.5));

          const normX = dx / dist;
          const normY = dy / dist;

          dot.vx += normX * pushForce;
          dot.vy += normY * pushForce;
        }

        // 2. Velvet Spring Return Force (Hooke's Law)
        const springX = (dot.baseX - dot.x) * springStiffness;
        const springY = (dot.baseY - dot.y) * springStiffness;

        dot.vx = (dot.vx + springX) * damping;
        dot.vy = (dot.vy + springY) * damping;

        dot.x += dot.vx;
        dot.y += dot.vy;

        // 3. Harmonic Musical Breathing Wave (sin(t))
        const breathWave = Math.sin(t * 0.8 + idx * 0.04) * 0.2;

        // 4. Visual Size & Alpha
        const displacement = Math.sqrt(
          (dot.x - dot.baseX) * (dot.x - dot.baseX) + (dot.y - dot.baseY) * (dot.y - dot.baseY)
        );

        const currentDist = Math.sqrt((dot.x - mouse.x) * (dot.x - mouse.x) + (dot.y - mouse.y) * (dot.y - mouse.y));
        const isHoveredNear = currentDist < repulsionRadius;

        const dynamicSize = isHoveredNear
          ? dot.size + (1.0 - currentDist / repulsionRadius) * 1.4 + breathWave
          : dot.size + Math.min(displacement * 0.08, 1.0) + breathWave;

        const alpha = isHoveredNear
          ? Math.min(0.45 + (1.0 - currentDist / repulsionRadius) * 0.45, 0.9)
          : Math.min(0.35 + breathWave * 0.08, 0.65);

        // Draw Dot
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, Math.max(dynamicSize, 0.8), 0, Math.PI * 2);

        if (isHoveredNear || displacement > 1.2) {
          ctx.fillStyle = `rgba(168, 85, 247, ${alpha})`; // Violet Glow
          ctx.shadowColor = "#a855f7";
          ctx.shadowBlur = isHoveredNear ? 6 : 2;
        } else {
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
          ctx.shadowBlur = 0;
        }

        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const currX = e.clientX - rect.left;
    const currY = e.clientY - rect.top;

    const prevX = mouseRef.current.x;
    const prevY = mouseRef.current.y;
    const dx = currX - prevX;
    const dy = currY - prevY;
    const speed = Math.sqrt(dx * dx + dy * dy);

    mouseRef.current = {
      x: currX,
      y: currY,
      speed,
    };
  };

  const handleMouseLeave = () => {
    mouseRef.current = { x: -999, y: -999, speed: 0 };
    setIsBeaconHovered(false);
  };

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          width: "100%",
          maxWidth: "480px",
          aspectRatio: "16 / 9",
          position: "relative",
          backgroundColor: "transparent",
          borderRadius: "0px",
          overflow: "hidden",
          border: "none",
        }}
      >
        <style
          dangerouslySetInnerHTML={{
            __html: `
          @keyframes sonarPing {
            0% {
              transform: scale(0.5);
              opacity: 1;
            }
            100% {
              transform: scale(3.5);
              opacity: 0;
            }
          }
        `,
          }}
        />

        {/* 60fps HTML5 Canvas Lucid World Map Engine */}
        <canvas
          ref={canvasRef}
          style={{
            width: "100%",
            height: "100%",
            display: "block",
          }}
        />

        {/* Multi-Ring Pulsing Canada Radar Sonar Beacon */}
        <div
          onMouseEnter={() => setIsBeaconHovered(true)}
          onMouseLeave={() => setIsBeaconHovered(false)}
          style={{
            position: "absolute",
            left: "17%",
            top: "24%",
            transform: "translate(-50%, -50%)",
            cursor: "pointer",
            zIndex: 25,
            padding: "14px",
          }}
        >
        {/* Outer Sonar Ring 1 */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            border: "1.5px solid #a855f7",
            animation: "sonarPing 2.2s infinite cubic-bezier(0, 0.2, 0.8, 1)",
            pointerEvents: "none",
          }}
        />

        {/* Outer Sonar Ring 2 (Delayed) */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            border: "1.5px solid #38bdf8",
            animation: "sonarPing 2.2s infinite cubic-bezier(0, 0.2, 0.8, 1)",
            animationDelay: "0.7s",
            pointerEvents: "none",
          }}
        />

        {/* Solid Beacon Core Dot */}
        <div
          style={{
            width: "12px",
            height: "12px",
            borderRadius: "50%",
            backgroundColor: "#a855f7",
            boxShadow: "0 0 16px #a855f7, 0 0 28px #38bdf8",
            position: "relative",
            zIndex: 10,
          }}
        />
      </div>

      {/* Executive Glassmorphic Popover Tooltip */}
      <AnimatePresence>
        {isBeaconHovered && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.94 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: "absolute",
              left: "21.5%",
              top: "44%",
              transform: "translateX(-50%)",
              backgroundColor: "rgba(15, 12, 30, 0.92)",
              border: "1px solid rgba(168, 85, 247, 0.4)",
              borderRadius: "12px",
              padding: "0.9rem 1.2rem",
              width: "230px",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.8), 0 0 30px rgba(168, 85, 247, 0.25)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              zIndex: 35,
              pointerEvents: "none",
            }}
          >
            <div
              style={{
                fontFamily: "monospace",
                fontSize: "0.6rem",
                letterSpacing: "0.15em",
                color: "#a855f7",
                fontWeight: "bold",
                marginBottom: "0.2rem",
              }}
            >
              CANADA // 45.4215° N, 75.6972° W
            </div>
            <div
              style={{
                fontFamily: "Georgia, serif",
                fontSize: "1rem",
                color: "#ffffff",
                fontWeight: 400,
                marginBottom: "0.3rem",
              }}
            >
              Based in Canada
            </div>
            <div
              style={{
                fontFamily: "monospace",
                fontSize: "0.68rem",
                color: "rgba(255, 255, 255, 0.65)",
                lineHeight: 1.4,
              }}
            >
              Operating globally for enterprise IT & infrastructure.
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
}
