"use client";

import { useEffect } from "react";
import HeroSection from "@/components/HeroSection";
import ITSection from "@/components/ITSection";
import ProjectsSection from "@/components/ProjectsSection";
import BookSection from "@/components/BookSection";
import Navigation from "@/components/Navigation";
import MagneticLink from "@/components/MagneticLink";
import Preloader from "@/components/Preloader";
import SystemClock from "@/components/SystemClock";
import SmoothScrolling from "@/components/SmoothScrolling";

export default function Home() {
  // The Dev Console Easter Egg
  useEffect(() => {
    console.log(
      "%c STATUS: OPTIMAL \n %cReady to coordinate P1/P2 incidents and build flawless digital experiences. \nConnect with the Architect: www.linkedin.com/in/miteshbshah",
      "color: #27c93f; font-size: 24px; font-weight: bold; font-family: monospace; text-shadow: 0 0 10px rgba(39, 201, 63, 0.5);",
      "color: #fff; font-size: 14px; font-family: monospace; line-height: 1.5;"
    );
  }, []);

  return (
    <SmoothScrolling>
      <main className="main-container" style={{ backgroundColor: "#000", minHeight: "100vh", position: "relative" }}>
        {/* Global Overlays */}
        <Preloader />
        <SystemClock />

        <div id="hero"><HeroSection /></div>
        <div id="it"><ITSection /></div>
        <div id="projects"><ProjectsSection /></div>
        <div id="book"><BookSection /></div>

        <div style={{ display: 'flex', justifyContent: 'center', padding: '10vh 0 20vh 0', backgroundColor: 'var(--bg-color)' }}>
          <MagneticLink href="https://www.instagram.com/mitesh.shah01?igsh=MWVsbHA2dnM5N2poMQ==">Follow on Instagram</MagneticLink>
        </div>

        <Navigation />
      </main>
    </SmoothScrolling>
  );
}