"use client";

import { useState, useRef } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import AimScopeSimulator from "@/components/AimScopeSimulator";
import SankalpHabitRing from "@/components/SankalpHabitRing";
import PhysicsPills from "@/components/PhysicsPills";
import BookParallax from "@/components/BookParallax";
import WorldMapRadar from "@/components/WorldMapRadar";
import ContentTicker from "@/components/ContentTicker";
import AudioEqualizer from "@/components/AudioEqualizer";
import { audio } from "@/utils/audioSystem";

interface Project {
  id: string;
  title: string;
  category: string;
  url?: string;
  architectureDetails?: {
    nodes: string;
    sla: string;
    protocol: string;
    summary: string;
  };
}

const PROJECTS: Project[] = [
  {
    id: "zero-sankalp",
    title: "ZERØ & SANKALP",
    category: "Native Android Flagships",
    url: "https://play.google.com/store/apps/details?id=com.zeroapps.zero_crosshair",
    architectureDetails: {
      nodes: "Kotlin Core · Native C++ Render Pipeline · GPU Overlay Engine",
      sla: "60fps Sub-Millisecond Frame Latency",
      protocol: "Android SurfaceFlinger / Native Canvas API",
      summary: "Dual production mobile flagships with over 50,000+ active sessions and zero crash telemetry.",
    },
  },
  {
    id: "skills-arsenal",
    title: "SKILLS & TECHNICAL STACK",
    category: "Interactive 2D Physics",
    architectureDetails: {
      nodes: "Matter.js Rigid Body Physics · HTML5 2D Canvas · Verlet Integration",
      sla: "60fps Velocity Solver",
      protocol: "Continuous Collision Detection (CCD)",
      summary: "Dynamic interactive physics engine modeling real-world gravity, inertia, and restitution.",
    },
  },
  {
    id: "divine-doodles",
    title: "DIVINE DOODLES",
    category: "Literature & Illustration",
    url: "https://www.amazon.com/Divine-Doodles-Toddler-Indian-Goddesses/dp/B0CFZGWJNB?ref_=ast_author_dp_rw&th=1&psc=1&dib=eyJ2IjoiMSJ9.aeTHMO6PQkdxe-TpIGnHdw.qWGqL0MqCuEC_OvVR2EYITYYJTI45lU6-V5_D1loFYc&dib_tag=AUTHOR",
  },
  {
    id: "canada-base",
    title: "BASED IN CANADA",
    category: "Global Operations",
    architectureDetails: {
      nodes: "Cloudflare Edge · Global Anycast CDN · Ottawa Hub",
      sla: "99.999% Availability",
      protocol: "BGP Anycast Routing",
      summary: "Enterprise IT infrastructure operating globally with 24/7 incident command coverage.",
    },
  },
  {
    id: "pratyaksh-gyan",
    title: "PRATYAKSH GYAN",
    category: "Educational Publishing",
    url: "https://pratyakshgyan.com",
  },
  {
    id: "coffee-donut-tv",
    title: "COFFEE DONUT TV",
    category: "Creative Media Hub",
    url: "https://www.coffeedonuttv.com/",
  },
];

export default function ProjectsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: false, amount: 0.2 });

  // 3D Flip State for Card 1 (ZERØ Front vs Sankalp Back)
  const [isCard1Flipped, setIsCard1Flipped] = useState(false);
  const [activeModalProject, setActiveModalProject] = useState<Project | null>(null);

  return (
    <section
      ref={sectionRef}
      id="projects"
      style={{
        width: "100vw",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        backgroundColor: "transparent",
        padding: "3.2rem 2rem 5.5rem 2rem",
        zIndex: 10,
      }}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .bento-grid-container {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          grid-template-rows: repeat(2, 1fr);
          gap: clamp(1rem, 1.8vw, 1.8rem);
          width: 100%;
          height: min(84vh, 760px);
          min-height: 540px;
          max-width: min(92vw, 1720px);
        }

        /* APPLE LIQUID GLASS CARD STYLING (iOS 18 Refraction + Specular Glint) */
        .bento-card-item {
          position: relative;
          border-radius: 24px;
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.18) 0%,
            rgba(255, 255, 255, 0.05) 45%,
            rgba(255, 255, 255, 0.10) 100%
          ) !important;
          border: 1px solid rgba(255, 255, 255, 0.20) !important;
          backdrop-filter: blur(36px) saturate(210%) brightness(112%) !important;
          -webkit-backdrop-filter: blur(36px) saturate(210%) brightness(112%) !important;
          padding: 1.2rem 1.4rem;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          overflow: hidden;
          box-shadow:
            inset 0 1.5px 1.5px 0 rgba(255, 255, 255, 0.38),
            inset 0 -1px 1px 0 rgba(255, 255, 255, 0.08),
            0 24px 48px -12px rgba(0, 0, 0, 0.6) !important;
          transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);
        }

        .bento-card-item:hover {
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.26) 0%,
            rgba(255, 255, 255, 0.09) 50%,
            rgba(255, 255, 255, 0.16) 100%
          ) !important;
          border-color: rgba(255, 255, 255, 0.38) !important;
          box-shadow:
            inset 0 2px 2px 0 rgba(255, 255, 255, 0.55),
            0 32px 64px -10px rgba(0, 0, 0, 0.75) !important;
          transform: translateY(-2px);
        }

        @media (max-width: 1024px) {
          .bento-grid-container {
            grid-template-columns: repeat(2, 1fr) !important;
            grid-template-rows: auto !important;
            height: auto !important;
          }
          .bento-card-item {
            min-height: 280px !important;
          }
        }

        @media (max-width: 768px) {
          .bento-grid-container {
            grid-template-columns: 1fr !important;
            grid-template-rows: auto !important;
            height: auto !important;
            gap: 1.5rem !important;
          }
          .bento-card-item {
            grid-column: span 1 !important;
            min-height: 340px !important;
            height: 340px !important;
          }
        }
      `,
        }}
      />

      {/* Section Header */}
      <div style={{ textAlign: "center", marginBottom: "0.8rem" }}>
        <h2
          style={{
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontStyle: "italic",
            fontSize: "clamp(1.8rem, 3.2vw, 3rem)",
            color: "#ffffff",
            margin: 0,
          }}
        >
          Showroom
        </h2>
      </div>

      {/* Multi-Device Responsive Lego Bento Grid */}
      <div className="bento-grid-container">
        {PROJECTS.map((project, idx) => {
          // Special 3D Dual-Sided Flip Card for Card 1
          if (project.id === "zero-sankalp") {
            return (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                transition={{ duration: 0.5, delay: idx * 0.08, ease: [0.16, 1, 0.3, 1] }}
                className="bento-card-item"
                style={{
                  perspective: "1000px",
                  padding: 0,
                  border: "none",
                  backgroundColor: "transparent",
                }}
              >
                <motion.div
                  animate={{ rotateY: isCard1Flipped ? 180 : 0 }}
                  transition={{ type: "spring", stiffness: 70, damping: 14 }}
                  style={{
                    width: "100%",
                    height: "100%",
                    position: "relative",
                    transformStyle: "preserve-3d",
                  }}
                >
                  {/* FRONT FACE: ZERØ CROSSHAIR APP */}
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      backfaceVisibility: "hidden",
                      WebkitBackfaceVisibility: "hidden",
                      borderRadius: "16px",
                      backgroundColor: "rgba(255, 255, 255, 0.03)",
                      border: "1px solid rgba(255, 255, 255, 0.12)",
                      backdropFilter: "blur(24px) saturate(160%)",
                      WebkitBackdropFilter: "blur(24px) saturate(160%)",
                      padding: "1.1rem 1.3rem",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      boxShadow: "0 20px 40px rgba(0, 0, 0, 0.4)",
                    }}
                  >
                    {/* Top Bar */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontFamily: "monospace", fontSize: "11px", letterSpacing: "0.15em", color: "rgba(255, 255, 255, 0.45)", fontWeight: 600 }}>
                        ZERØ CROSSHAIR
                      </span>
                      <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            audio.playClick();
                            setIsCard1Flipped(true);
                          }}
                          style={{
                            backgroundColor: "rgba(168, 85, 247, 0.15)",
                            border: "1px solid #a855f7",
                            color: "#a855f7",
                            fontFamily: "monospace",
                            fontSize: "10px",
                            padding: "0.15rem 0.5rem",
                            borderRadius: "12px",
                            cursor: "pointer",
                          }}
                        >
                          [ FLIP: SANKALP ]
                        </button>
                        <a
                          href="https://play.google.com/store/apps/details?id=com.zeroapps.zero_crosshair"
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => audio.playClick()}
                          style={{ fontFamily: "monospace", fontSize: "12px", color: "#38bdf8", textDecoration: "none" }}
                        >
                          [ ↗ ]
                        </a>
                      </div>
                    </div>

                    {/* Scope Engine */}
                    <div style={{ flex: 1, marginTop: "0.4rem", borderRadius: "8px", overflow: "hidden" }}>
                      <AimScopeSimulator />
                    </div>
                  </div>

                  {/* BACK FACE: SANKALP HABIT RINGS APP */}
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      transform: "rotateY(180deg)",
                      backfaceVisibility: "hidden",
                      WebkitBackfaceVisibility: "hidden",
                      borderRadius: "16px",
                      backgroundColor: "rgba(255, 255, 255, 0.04)",
                      border: "1px solid rgba(168, 85, 247, 0.3)",
                      backdropFilter: "blur(24px) saturate(160%)",
                      WebkitBackdropFilter: "blur(24px) saturate(160%)",
                      padding: "1.1rem 1.3rem",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      boxShadow: "0 20px 40px rgba(0, 0, 0, 0.4)",
                    }}
                  >
                    {/* Top Bar */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontFamily: "monospace", fontSize: "11px", letterSpacing: "0.15em", color: "rgba(255, 255, 255, 0.45)", fontWeight: 600 }}>
                        SANKALP HABITS
                      </span>
                      <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            audio.playClick();
                            setIsCard1Flipped(false);
                          }}
                          style={{
                            backgroundColor: "rgba(56, 189, 248, 0.15)",
                            border: "1px solid #38bdf8",
                            color: "#38bdf8",
                            fontFamily: "monospace",
                            fontSize: "10px",
                            padding: "0.15rem 0.5rem",
                            borderRadius: "12px",
                            cursor: "pointer",
                          }}
                        >
                          [ FLIP: ZERØ ]
                        </button>
                        <a
                          href="https://play.google.com/store/apps/details?id=com.zeroapps.sankalp"
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => audio.playClick()}
                          style={{ fontFamily: "monospace", fontSize: "12px", color: "#a855f7", textDecoration: "none" }}
                        >
                          [ ↗ ]
                        </a>
                      </div>
                    </div>

                    {/* Sankalp Engine */}
                    <div style={{ flex: 1, marginTop: "0.4rem", borderRadius: "8px", overflow: "hidden" }}>
                      <SankalpHabitRing />
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            );
          }

          return (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ duration: 0.5, delay: idx * 0.08, ease: [0.16, 1, 0.3, 1] }}
              onClick={() => {
                if (project.url) {
                  window.open(project.url, "_blank", "noopener,noreferrer");
                }
              }}
              className="bento-card-item"
              style={{
                cursor: project.url ? "pointer" : "default",
              }}
            >
              {/* Top Bar: Micro-Label (Left) & Zero-Height Arrow Badge (Right) */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  position: "relative",
                  zIndex: 10,
                  pointerEvents: "none",
                }}
              >
                <span
                  style={{
                    fontFamily: "monospace",
                    fontSize: "11px",
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    color: "rgba(255, 255, 255, 0.45)",
                    fontWeight: 600,
                  }}
                >
                  {project.title}
                </span>

              {/* Sleek Top-Right Arrow & Inspector Badge */}
              <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                {project.architectureDetails && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      audio.playClick();
                      setActiveModalProject(project);
                    }}
                    style={{
                      backgroundColor: "rgba(56, 189, 248, 0.12)",
                      border: "1px solid rgba(56, 189, 248, 0.35)",
                      color: "#38bdf8",
                      fontFamily: "monospace",
                      fontSize: "9px",
                      padding: "0.12rem 0.45rem",
                      borderRadius: "10px",
                      cursor: "pointer",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    [ ARCHITECTURE ]
                  </button>
                )}

                {project.url && (
                  <span
                    style={{
                      fontFamily: "monospace",
                      fontSize: "12px",
                      color: "rgba(255, 255, 255, 0.6)",
                      transition: "color 0.2s ease, transform 0.2s ease",
                    }}
                  >
                    [ ↗ ]
                  </span>
                )}
              </div>
            </div>

            {/* CARD 2: Matter.js 2D Interactive Physics Pills */}
            {project.id === "skills-arsenal" && (
              <div style={{ height: "100%", width: "100%", position: "absolute", inset: 0, zIndex: 1 }}>
                <PhysicsPills />
              </div>
            )}

            {/* CARD 3: 3D Parallax Book + Golden Aura */}
            {project.id === "divine-doodles" && (
              <div style={{ height: "100%", width: "100%", marginTop: "0.2rem", display: "flex", justifyContent: "center", alignItems: "center" }}>
                <BookParallax />
              </div>
            )}

            {/* CARD 4: Direct SVG Continent Path Dot Matrix Map */}
            {project.id === "canada-base" && (
              <div style={{ height: "100%", width: "100%", position: "absolute", inset: 0, zIndex: 1 }}>
                <WorldMapRadar />
              </div>
            )}

            {/* CARD 5: Glassmorphic Live Content Ticker */}
            {project.id === "pratyaksh-gyan" && (
              <div style={{ height: "130px", marginTop: "0.3rem", overflow: "hidden", borderRadius: "8px" }}>
                <ContentTicker />
              </div>
            )}

            {/* CARD 6: Ambient Audio Spectrum Visualizer */}
            {project.id === "coffee-donut-tv" && (
              <div style={{ height: "125px", marginTop: "0.3rem", overflow: "hidden", borderRadius: "8px" }}>
                <AudioEqualizer />
              </div>
            )}
          </motion.div>
        );
      })}
      </div>

      {/* ARCHITECTURE DEEP DIVE MODAL (APPLE LIQUID GLASS) */}
      <AnimatePresence>
        {activeModalProject && activeModalProject.architectureDetails && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              audio.playClick();
              setActiveModalProject(null);
            }}
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(0, 0, 0, 0.82)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 999999,
              padding: "1.5rem",
            }}
          >
            <motion.div
              initial={{ scale: 0.94, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.94, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "100%",
                maxWidth: "600px",
                backgroundColor: "rgba(18, 14, 34, 0.94)",
                border: "1px solid rgba(168, 85, 247, 0.35)",
                borderRadius: "18px",
                padding: "2rem",
                boxShadow: "0 30px 80px rgba(0, 0, 0, 0.9), 0 0 40px rgba(168, 85, 247, 0.2)",
                fontFamily: "monospace",
              }}
            >
              {/* Modal Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem", borderBottom: "1px solid rgba(255, 255, 255, 0.1)", paddingBottom: "0.8rem" }}>
                <div>
                  <div style={{ fontSize: "0.68rem", color: "#38bdf8", letterSpacing: "0.15em", textTransform: "uppercase" }}>
                    ARCHITECTURE TOPOLOGY DEEP DIVE
                  </div>
                  <h3 style={{ margin: "0.3rem 0 0 0", color: "#ffffff", fontSize: "1.3rem", fontFamily: "Georgia, serif" }}>
                    {activeModalProject.title}
                  </h3>
                </div>
                <button
                  onClick={() => {
                    audio.playClick();
                    setActiveModalProject(null);
                  }}
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.08)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    color: "#ffffff",
                    fontFamily: "monospace",
                    fontSize: "0.75rem",
                    padding: "0.3rem 0.7rem",
                    borderRadius: "6px",
                    cursor: "pointer",
                  }}
                >
                  [ ✕ CLOSE ]
                </button>
              </div>

              {/* Architecture Blueprint Grid */}
              <div style={{ display: "grid", gap: "1rem", marginBottom: "1.5rem" }}>
                <div style={{ backgroundColor: "rgba(0, 0, 0, 0.4)", padding: "0.8rem 1rem", borderRadius: "8px", border: "1px solid rgba(255, 255, 255, 0.06)" }}>
                  <div style={{ fontSize: "0.64rem", color: "rgba(255, 255, 255, 0.5)", marginBottom: "0.2rem" }}>TOPOLOGY / NODES</div>
                  <div style={{ color: "#a855f7", fontSize: "0.82rem", fontWeight: "bold" }}>{activeModalProject.architectureDetails.nodes}</div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.8rem" }}>
                  <div style={{ backgroundColor: "rgba(0, 0, 0, 0.4)", padding: "0.8rem 1rem", borderRadius: "8px", border: "1px solid rgba(255, 255, 255, 0.06)" }}>
                    <div style={{ fontSize: "0.64rem", color: "rgba(255, 255, 255, 0.5)", marginBottom: "0.2rem" }}>SLA BENCHMARK</div>
                    <div style={{ color: "#22c55e", fontSize: "0.82rem", fontWeight: "bold" }}>{activeModalProject.architectureDetails.sla}</div>
                  </div>
                  <div style={{ backgroundColor: "rgba(0, 0, 0, 0.4)", padding: "0.8rem 1rem", borderRadius: "8px", border: "1px solid rgba(255, 255, 255, 0.06)" }}>
                    <div style={{ fontSize: "0.64rem", color: "rgba(255, 255, 255, 0.5)", marginBottom: "0.2rem" }}>PROTOCOL / RUNTIME</div>
                    <div style={{ color: "#38bdf8", fontSize: "0.82rem", fontWeight: "bold" }}>{activeModalProject.architectureDetails.protocol}</div>
                  </div>
                </div>

                <div style={{ backgroundColor: "rgba(0, 0, 0, 0.4)", padding: "0.8rem 1rem", borderRadius: "8px", border: "1px solid rgba(255, 255, 255, 0.06)" }}>
                  <div style={{ fontSize: "0.64rem", color: "rgba(255, 255, 255, 0.5)", marginBottom: "0.2rem" }}>EXECUTIVE SUMMARY</div>
                  <div style={{ color: "rgba(255, 255, 255, 0.85)", fontSize: "0.78rem", lineHeight: 1.5 }}>{activeModalProject.architectureDetails.summary}</div>
                </div>
              </div>

              {/* Action Buttons */}
              {activeModalProject.url && (
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <a
                    href={activeModalProject.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => audio.playClick()}
                    style={{
                      backgroundColor: "#a855f7",
                      color: "#000000",
                      padding: "0.6rem 1.4rem",
                      borderRadius: "6px",
                      textDecoration: "none",
                      fontSize: "0.76rem",
                      fontWeight: "bold",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                    }}
                  >
                    LAUNCH PRODUCTION INSTANCE [ ↗ ]
                  </a>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}