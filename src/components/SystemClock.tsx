"use client";

import { useState, useEffect } from "react";

export default function SystemClock() {
  const [time, setTime] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const updateClock = () => {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      const ss = String(now.getSeconds()).padStart(2, '0');
      setTime(`${hh}:${mm}:${ss}`);
    };
    
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!mounted) return null;

  return (
    <>
      <div className="awwwards-sys-clock">
        <div className="sys-status-indicator"></div>
        <div className="sys-text">SYS: OPTIMAL</div>
        <div className="sys-time">{time}</div>
      </div>
      <style dangerouslySetInnerHTML={{
        __html: `
        .awwwards-sys-clock {
          position: fixed;
          top: 2rem;
          right: 2rem;
          z-index: 1000;
          background: rgba(10, 10, 10, 0.7);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 100px;
          padding: 0.5rem 1rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-family: monospace;
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        }
        .sys-status-indicator {
          width: 8px;
          height: 8px;
          background-color: #27c93f;
          border-radius: 50%;
          box-shadow: 0 0 10px #27c93f;
          animation: sys-pulse 2s infinite;
        }
        .sys-text {
          color: rgba(255, 255, 255, 0.9);
          font-weight: bold;
        }
        .sys-time {
          color: #27c93f;
        }
        @keyframes sys-pulse {
          0% { opacity: 1; }
          50% { opacity: 0.4; }
          100% { opacity: 1; }
        }
        @media (max-width: 768px) {
          .awwwards-sys-clock {
            top: 1rem;
            right: 1rem;
            padding: 0.4rem 0.8rem;
            font-size: 0.65rem;
          }
        }
        `
      }} />
    </>
  );
}
