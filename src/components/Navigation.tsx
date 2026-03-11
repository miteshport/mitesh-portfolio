"use client";

import { useEffect, useState } from "react";
import MagneticLink from "./MagneticLink";

export default function Navigation() {
  const [activeSection, setActiveSection] = useState("hero");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      const currentScroll = window.scrollY;
      const scrollProgress = (currentScroll / totalScroll) * 100;
      setProgress(scrollProgress);

      // Section tracking logic
      if (scrollProgress < 15) setActiveSection("hero");
      else if (scrollProgress < 40) setActiveSection("it");
      else if (scrollProgress < 75) setActiveSection("projects");
      else setActiveSection("book");
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      window.scrollTo({
        top: el.offsetTop,
        behavior: "smooth"
      });
    }
  };

  return (
    <>
      <nav className="awwwards-bottom-nav">

        <div className="awwwards-nav-controls">
          <button
            onClick={() => scrollTo("hero")}
            className={`awwwards-nav-btn ${activeSection === "hero" ? "active" : ""}`}
          >
            01. Origin
          </button>
          <button
            onClick={() => scrollTo("it")}
            className={`awwwards-nav-btn ${activeSection === "it" ? "active" : ""}`}
          >
            02. Engine
          </button>
          <button
            onClick={() => scrollTo("projects")}
            className={`awwwards-nav-btn ${activeSection === "projects" ? "active" : ""}`}
          >
            03. Proof
          </button>
          <button
            onClick={() => scrollTo("book")}
            className={`awwwards-nav-btn ${activeSection === "book" ? "active" : ""}`}
          >
            04. Narrative
          </button>
        </div>

        <div className="awwwards-nav-center">
          {/* Timeline Progress Bar */}
          <div className="awwwards-timeline-track">
            <div
              className="awwwards-timeline-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="awwwards-nav-right">
          {/* LINKEDIN URL INJECTED HERE */}
          <MagneticLink href="https://www.linkedin.com/in/miteshbshah">
            Connect
          </MagneticLink>
        </div>
      </nav>

      <style dangerouslySetInnerHTML={{
        __html: `
        .awwwards-bottom-nav {
          position: fixed;
          bottom: 2rem;
          left: 50%;
          transform: translateX(-50%);
          width: 90vw;
          max-width: 1200px;
          background: rgba(10, 10, 10, 0.7);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 100px;
          padding: 0.5rem 1rem 0.5rem 2.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          z-index: 1000;
          box-shadow: 0 20px 40px rgba(0,0,0,0.6);
        }
        .awwwards-nav-controls {
          display: flex;
          gap: 2rem;
        }
        .awwwards-nav-btn {
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.4);
          font-family: monospace;
          font-size: 0.85rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          cursor: pointer;
          transition: color 0.3s cubic-bezier(0.16, 1, 0.3, 1), transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          padding: 0;
        }
        .awwwards-nav-btn:hover {
          color: rgba(255, 255, 255, 0.8);
          transform: translateY(-2px);
        }
        .awwwards-nav-btn.active {
          color: #fff;
          font-weight: bold;
        }
        .awwwards-nav-center {
          flex: 1;
          margin: 0 4rem;
          display: flex;
          align-items: center;
        }
        .awwwards-timeline-track {
          width: 100%;
          height: 2px;
          background: rgba(255,255,255,0.1);
          border-radius: 2px;
          overflow: hidden;
          position: relative;
        }
        .awwwards-timeline-fill {
          height: 100%;
          background: #fff;
          transition: width 0.1s linear;
          box-shadow: 0 0 10px rgba(255,255,255,0.5);
        }
        .awwwards-nav-right {
          display: flex;
          align-items: center;
        }
        
        @media (max-width: 768px) {
          .awwwards-bottom-nav { 
            padding: 0.25rem 0.5rem; 
            border-radius: 40px; 
            width: 95vw;
            bottom: 1rem;
          }
          .awwwards-nav-controls {
            display: flex;
            gap: 0.75rem;
          }
          .awwwards-nav-btn {
            font-size: 0.65rem;
          }
          .awwwards-nav-center { 
            display: none;
          }
          .awwwards-nav-right {
             transform: scale(0.85);
          }
        }
      `}} />
    </>
  );
}