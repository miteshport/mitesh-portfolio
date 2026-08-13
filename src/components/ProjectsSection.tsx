"use client";

import { useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import AimScopeSimulator from "@/components/AimScopeSimulator";
import SankalpHabitRing from "@/components/SankalpHabitRing";
import PhysicsPills from "@/components/PhysicsPills";
import BookParallax from "@/components/BookParallax";
import WorldMapRadar from "@/components/WorldMapRadar";
import ContentTicker from "@/components/ContentTicker";
import AudioEqualizer from "@/components/AudioEqualizer";

interface Project {
  id: string;
  title: string;
  category: string;
  url?: string;
}

const PROJECTS: Project[] = [
  {
    id: "zero-sankalp",
    title: "ZERØ & SANKALP",
    category: "Native Android Flagships",
    url: "https://play.google.com/store/apps/details?id=com.zeroapps.zero_crosshair",
  },
  {
    id: "skills-arsenal",
    title: "SKILLS & TECHNICAL STACK",
    category: "Interactive 2D Physics",
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
          gap: 1.2rem;
          width: 100%;
          height: calc(100vh - 165px);
          max-width: 1280px;
        }

        /* APPLE LIQUID GLASS CARD STYLING (Translucent + Saturate 160%) */
        .bento-card-item {
          position: relative;
          border-radius: 16px;
          background-color: rgba(255, 255, 255, 0.03) !important;
          border: 1px solid rgba(255, 255, 255, 0.12) !important;
          backdrop-filter: blur(24px) saturate(160%) !important;
          -webkit-backdrop-filter: blur(24px) saturate(160%) !important;
          padding: 1.1rem 1.3rem;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          overflow: hidden;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
          transition: border-color 0.3s ease, background-color 0.3s ease, transform 0.3s ease, box-shadow 0.3s ease;
        }

        .bento-card-item:hover {
          background-color: rgba(255, 255, 255, 0.07) !important;
          border-color: rgba(168, 85, 247, 0.45) !important;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(168, 85, 247, 0.25) !important;
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
                          [ 🗘 FLIP: SANKALP ]
                        </button>
                        <a
                          href="https://play.google.com/store/apps/details?id=com.zeroapps.zero_crosshair"
                          target="_blank"
                          rel="noopener noreferrer"
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
                          [ 🗘 FLIP: ZERØ ]
                        </button>
                        <a
                          href="https://play.google.com/store/apps/details?id=com.zeroapps.sankalp"
                          target="_blank"
                          rel="noopener noreferrer"
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

                {/* Sleek Top-Right Arrow Badge */}
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
    </section>
  );
}