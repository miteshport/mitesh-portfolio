"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
            data-magnetic="true"
            onClick={() => scrollTo("hero")}
            className={`awwwards-nav-btn ${activeSection === "hero" ? "active" : ""}`}
          >
            01. Origin
          </button>
          <button
            data-magnetic="true"
            onClick={() => scrollTo("it")}
            className={`awwwards-nav-btn ${activeSection === "it" ? "active" : ""}`}
          >
            02. Engine
          </button>
          <button
            data-magnetic="true"
            onClick={() => scrollTo("projects")}
            className={`awwwards-nav-btn ${activeSection === "projects" ? "active" : ""}`}
          >
            03. Proof
          </button>
          <button
            data-magnetic="true"
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
          <div data-magnetic="true" style={{ display: 'flex', alignItems: 'center' }}>
            <Link href="/card" style={{ textDecoration: 'none', color: 'inherit' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                ID CARD
                <span style={{ width: '4px', height: '4px', backgroundColor: '#27c93f', borderRadius: '50%', boxShadow: '0 0 5px #27c93f' }}></span>
              </span>
            </Link>
          </div>
        </div>
      </nav>

      <style dangerouslySetInnerHTML={{
        __html: `
        .awwwards-bottom-nav {
          position: fixed;
          bottom: 2rem;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(10, 10, 10, 0.6);
          backdrop-filter: blur(15px);
          -webkit-backdrop-filter: blur(15px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 50px;
          padding: 0.5rem 1.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 2rem;
          z-index: 1000;
          box-shadow: 0 20px 40px rgba(0,0,0,0.6);
        }
        .awwwards-nav-controls {
          display: flex;
          gap: 1.5rem;
        }
        .awwwards-nav-btn {
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.4);
          font-family: monospace;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          transition: color 0.3s cubic-bezier(0.16, 1, 0.3, 1), transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          padding: 0;
          outline: none;
        }
        .awwwards-nav-btn:hover {
          color: rgba(255, 255, 255, 0.9);
          transform: translateY(-2px);
        }
        .awwwards-nav-btn.active {
          color: #fff;
          font-weight: bold;
        }
        .awwwards-nav-center {
          display: none;
        }
        .awwwards-nav-right {
          display: flex;
          align-items: center;
          font-size: 10px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.7);
        }
        .awwwards-nav-right:hover {
          color: #fff;
        }
        
        @media (max-width: 768px) {
          .awwwards-bottom-nav { 
            padding: 0.5rem 1rem; 
            border-radius: 40px; 
            bottom: 1rem;
            width: max-content;
            gap: 1rem;
          }
          .awwwards-nav-controls {
            gap: 0.75rem;
          }
          .awwwards-nav-btn {
            font-size: 8px;
          }
        }
      `}} />
    </>
  );
}