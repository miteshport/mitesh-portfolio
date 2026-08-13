"use client";

import React, { useEffect, useRef } from "react";
import Matter from "matter-js";

interface PillData {
  id: string;
  label: string;
  color: string;
  width: number;
}

const PILL_CONFIG: PillData[] = [
  { id: "p1", label: "Incident Command Operations", color: "#ef4444", width: 195 },
  { id: "p2", label: "ServiceNow ITSM", color: "#22c55e", width: 145 },
  { id: "p3", label: "Flutter Native Apps", color: "#38bdf8", width: 155 },
  { id: "p4", label: "Three.js WebGL", color: "#f59e0b", width: 135 },
  { id: "p5", label: "IT Architecture", color: "#8b5cf6", width: 140 },
  { id: "p6", label: "Major Incident Command", color: "#14b8a6", width: 185 },
  { id: "p7", label: "Enterprise Scale", color: "#ec4899", width: 150 },
  { id: "p8", label: "GLSL Shaders", color: "#f43f5e", width: 130 },
  { id: "p9", label: "Active Directory", color: "#0891b2", width: 145 },
  { id: "p10", label: "Zero Downtime", color: "#c2410c", width: 140 },
];

export default function PhysicsPills() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pillRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth || 360;
    const height = containerRef.current.clientHeight || 280;

    // 1. Matter.js Engine & World
    const engine = Matter.Engine.create({
      gravity: { x: 0, y: 0.9, scale: 0.001 },
    });
    const world = engine.world;

    // 2. Invisible Renderer
    const render = Matter.Render.create({
      element: containerRef.current,
      canvas: canvasRef.current || undefined,
      engine: engine,
      options: {
        width,
        height,
        background: "transparent",
        wireframes: false,
      },
    });

    // 3. Impenetrable 500px Thick Walls
    const wallOpts = { isStatic: true, render: { fillStyle: "transparent" } };
    const wallThickness = 500;

    const floor = Matter.Bodies.rectangle(width / 2, height + wallThickness / 2, width * 3, wallThickness, wallOpts);
    const ceiling = Matter.Bodies.rectangle(width / 2, -wallThickness / 2, width * 3, wallThickness, wallOpts);
    const leftWall = Matter.Bodies.rectangle(-wallThickness / 2, height / 2, wallThickness, height * 3, wallOpts);
    const rightWall = Matter.Bodies.rectangle(width + wallThickness / 2, height / 2, wallThickness, height * 3, wallOpts);

    Matter.Composite.add(world, [floor, ceiling, leftWall, rightWall]);

    // 4. BUTTER-SMOOTH PHYSICS TUNING (Ultra-low friction, high restitution, low air resistance!)
    const bodyMap: { [key: string]: Matter.Body } = {};

    PILL_CONFIG.forEach((pill, idx) => {
      const startX = 40 + (idx % 2) * 160 + (Math.random() - 0.5) * 30;
      const startY = 30 + Math.floor(idx / 2) * 45;
      const initialAngle = (idx % 2 === 0 ? 0.3 : -0.3) + (Math.random() - 0.5) * 0.4;

      const body = Matter.Bodies.rectangle(startX, startY, pill.width, 32, {
        chamfer: { radius: 16 },
        restitution: 0.7,   // Bouncy fluid collisions
        frictionAir: 0.008, // Low air resistance for effortless tumbling
        friction: 0.005,    // Polished ice surface friction
        density: 0.002,
        angle: initialAngle,
      });

      bodyMap[pill.id] = body;
      Matter.Composite.add(world, body);
    });

    // 5. INSTANT RESPONSIVE MOUSE DRAG & THROW CONSTRAINT
    const mouse = Matter.Mouse.create(containerRef.current);
    const mouseConstraint = Matter.MouseConstraint.create(engine, {
      mouse: mouse,
      constraint: {
        stiffness: 0.8, // Instant responsive drag
        render: { visible: false },
      },
    });

    Matter.Composite.add(world, mouseConstraint);

    // 6. 60fps Sub-Pixel HTML DOM Transform Synchronization Loop
    const runner = Matter.Runner.create();

    Matter.Events.on(engine, "afterUpdate", () => {
      PILL_CONFIG.forEach((pill) => {
        const body = bodyMap[pill.id];
        const el = pillRefs.current[pill.id];
        if (body && el) {
          el.style.transform = `translate(-50%, -50%) translate3d(${body.position.x}px, ${body.position.y}px, 0px) rotate(${body.angle}rad)`;
        }
      });
    });

    Matter.Runner.run(runner, engine);

    return () => {
      Matter.Runner.stop(runner);
      Matter.Composite.clear(world, false);
      Matter.Engine.clear(engine);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        minHeight: "260px",
        position: "relative",
        overflow: "hidden",
        borderRadius: "14px",
        userSelect: "none",
      }}
    >
      {/* Invisible Canvas */}
      <canvas ref={canvasRef} style={{ display: "none" }} />

      {/* Crisp Hollow Neon HTML DOM Pills */}
      {PILL_CONFIG.map((pill, idx) => {
        const defaultX = 40 + (idx % 2) * 160;
        const defaultY = 30 + Math.floor(idx / 2) * 45;
        const defaultAngle = idx % 2 === 0 ? 0.3 : -0.3;

        return (
          <div
            key={pill.id}
            ref={(el) => {
              pillRefs.current[pill.id] = el;
            }}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              transform: `translate(-50%, -50%) translate3d(${defaultX}px, ${defaultY}px, 0px) rotate(${defaultAngle}rad)`,
              borderRadius: "9999px",
              padding: "6px 16px",
              fontSize: "13px",
              fontWeight: 500,
              display: "inline-flex",
              whiteSpace: "nowrap",
              backgroundColor: "rgba(0, 0, 0, 0.45)",
              border: `1.5px solid ${pill.color}`,
              color: pill.color,
              fontFamily: "'Inter', sans-serif",
              cursor: "grab",
              willChange: "transform",
              boxShadow: `0 4px 15px rgba(0,0,0,0.5), 0 0 12px ${pill.color}33`,
              zIndex: 10,
            }}
          >
            {pill.label}
          </div>
        );
      })}
    </div>
  );
}
