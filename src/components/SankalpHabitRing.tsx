"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";

export default function SankalpHabitRing() {
  const [streakCount, setStreakCount] = useState(28);
  const [activeRing, setActiveRing] = useState<number | null>(null);

  const habits = [
    { label: "MEDITATION", color: "#a855f7", radius: 36, stroke: 7, progress: 85 },
    { label: "DEEP WORK", color: "#38bdf8", radius: 26, stroke: 6, progress: 92 },
    { label: "PHYSICAL SLA", color: "#22c55e", radius: 17, stroke: 5, progress: 78 },
  ];

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: "transparent",
        borderRadius: "0px",
        padding: "0.2rem 0",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        border: "none",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span
          style={{
            fontFamily: "monospace",
            fontSize: "0.62rem",
            color: "#a855f7",
            letterSpacing: "0.1em",
            fontWeight: "bold",
          }}
        >
          SANKALP HABIT RINGS
        </span>
        <span
          style={{
            fontFamily: "monospace",
            fontSize: "0.6rem",
            color: "#22c55e",
            letterSpacing: "0.08em",
          }}
        >
          🔥 {streakCount} DAY STREAK
        </span>
      </div>

      {/* Concentric Habit Progress Rings */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-around",
          height: "80px",
          marginTop: "0.2rem",
        }}
      >
        <div style={{ position: "relative", width: "80px", height: "80px" }}>
          <svg width="80" height="80" viewBox="0 0 80 80">
            {habits.map((habit, idx) => {
              const circumference = 2 * Math.PI * habit.radius;
              const offset = circumference - (habit.progress / 100) * circumference;

              return (
                <g key={idx}>
                  {/* Track */}
                  <circle
                    cx="40"
                    cy="40"
                    r={habit.radius}
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.08)"
                    strokeWidth={habit.stroke}
                  />
                  {/* Progress Stroke */}
                  <motion.circle
                    cx="40"
                    cy="40"
                    r={habit.radius}
                    fill="none"
                    stroke={habit.color}
                    strokeWidth={habit.stroke}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    transform="rotate(-90 40 40)"
                    animate={{ strokeDashoffset: activeRing === idx ? 0 : offset }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    style={{ cursor: "pointer" }}
                    onMouseEnter={() => setActiveRing(idx)}
                    onMouseLeave={() => setActiveRing(null)}
                    onClick={() => setStreakCount((prev) => prev + 1)}
                  />
                </g>
              );
            })}
          </svg>
        </div>

        {/* Legend */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          {habits.map((h, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.58rem", fontFamily: "monospace" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: h.color }} />
              <span style={{ color: "rgba(255, 255, 255, 0.7)" }}>{h.label}</span>
              <span style={{ color: h.color, marginLeft: "auto", fontWeight: "bold" }}>{h.progress}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
