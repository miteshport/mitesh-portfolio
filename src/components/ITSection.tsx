"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RevealText, RevealBlock } from "./Reveal";

export default function ITSection() {
  const [isOpen, setIsOpen] = useState(false);
  const [typedCommand, setTypedCommand] = useState("");
  const [showStats, setShowStats] = useState(false);
  const fullCommand = "./reveal_stack.sh --execute";

  useEffect(() => {
    if (isOpen) {
      setTypedCommand("");
      setShowStats(false);
      let i = 0;
      const interval = setInterval(() => {
        setTypedCommand(fullCommand.slice(0, i + 1));
        i++;
        if (i === fullCommand.length) {
          clearInterval(interval);
          setTimeout(() => setShowStats(true), 600);
        }
      }, 40); // Slightly faster typing speed for a pro-dev feel
      return () => clearInterval(interval);
    } else {
      setTypedCommand("");
      setShowStats(false);
    }
  }, [isOpen]);

  return (
    <section className="awwwards-it-section">
      <div className="awwwards-it-container">

        <div className="awwwards-it-header">
          <RevealText>
            <h2>The Engine</h2>
          </RevealText>
          <RevealBlock delay={0.1}>
            <p>The technical foundation powering the creativity.</p>
          </RevealBlock>
        </div>

        <RevealBlock delay={0.2}>
          <motion.div
            className="awwwards-terminal-block"
            onClick={() => setIsOpen(!isOpen)}
            whileHover={{ scale: 1.01, boxShadow: "0 30px 60px rgba(0,0,0,0.8)" }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          >
            <div className="awwwards-terminal-top">
              <span className="awwwards-dot awwwards-red"></span>
              <span className="awwwards-dot awwwards-yellow"></span>
              <span className="awwwards-dot awwwards-green"></span>
              <span className="awwwards-title">mitesh@system:~/operations</span>
            </div>

            <div className="awwwards-terminal-body">
              <p className="awwwards-command">~ $ {isOpen ? typedCommand : <span className="awwwards-blink">_</span>}</p>
              {!isOpen && <p className="awwwards-system-msg">Press anywhere to execute root sequence...</p>}

              <AnimatePresence>
                {showStats && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="awwwards-terminal-stack"
                  >
                    <ul>
                      <li><span className="awwwards-cmd-output">[✓] Experience:</span> 10+ Years Enterprise IT Operations</li>
                      <li><span className="awwwards-cmd-output">[✓] Specialization:</span> P1/P2 Major Incident Coordination & RCA</li>
                      <li><span className="awwwards-cmd-output">[✓] Scale:</span> 3,000+ User Infrastructure / Enterprise Networking</li>
                      <li><span className="awwwards-cmd-output">[✓] Stack:</span> ServiceNow ITSM, Entra ID, M365, Active Directory</li>
                    </ul>

                    <div style={{ marginTop: "3rem" }}>
                    <a
                      href="/Mitesh_Shah_IT_Operations_Incident_Management.pdf"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="awwwards-download-btn"
                    >
                      EXECUTE: DOWNLOAD_RESUME.PDF
                    </a>
                  </div>

                  <p className="awwwards-cursor awwwards-blink" style={{ marginTop: "1.5rem" }}>_</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
        </RevealBlock>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .awwwards-it-section {
          width: 100vw;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #000;
          position: relative;
          z-index: 10;
          padding: 10vw;
        }
        .awwwards-it-container {
          width: 100%;
          max-width: 1200px;
          display: flex;
          flex-direction: column;
          gap: 4rem;
        }
        .awwwards-it-header h2 {
          font-family: serif;
          font-size: clamp(3rem, 5vw, 6rem);
          color: #fff;
          margin: 0;
          line-height: 1;
        }
        .awwwards-it-header p {
          font-family: monospace;
          color: rgba(255, 255, 255, 0.5);
          font-size: 1.1rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-top: 1rem;
        }
        .awwwards-terminal-block {
          background: #090909;
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          overflow: hidden;
          cursor: pointer;
          box-shadow: 0 20px 40px rgba(0,0,0,0.5);
        }
        .awwwards-terminal-top {
          background: #111;
          padding: 1rem 1.5rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }
        .awwwards-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
        }
        .awwwards-red { background: #ff5f56; }
        .awwwards-yellow { background: #ffbd2e; }
        .awwwards-green { background: #27c93f; }
        .awwwards-title {
          font-family: monospace;
          color: rgba(255, 255, 255, 0.4);
          margin-left: 1rem;
          font-size: 0.85rem;
        }
        .awwwards-terminal-body {
          padding: 3rem;
          font-family: monospace;
          color: #ccc;
          min-height: 350px;
          font-size: 1.1rem;
          line-height: 1.6;
        }
        .awwwards-command {
          color: #fff;
          margin-bottom: 2rem;
        }
        .awwwards-system-msg {
          color: rgba(255, 255, 255, 0.3);
          font-style: italic;
        }
        .awwwards-terminal-stack ul {
          display: flex;
          flex-direction: column;
          gap: 1.2rem;
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .awwwards-cmd-output {
          color: #27c93f;
          margin-right: 1rem;
        }
        .awwwards-download-btn {
          display: inline-block;
          background: transparent;
          color: #27c93f;
          border: 1px solid rgba(39, 201, 63, 0.3);
          padding: 1rem 2rem;
          font-family: monospace;
          text-decoration: none;
          border-radius: 4px;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          font-size: 0.9rem;
          letter-spacing: 0.05em;
        }
        .awwwards-download-btn:hover {
          background: rgba(39, 201, 63, 0.1);
          border-color: #27c93f;
          box-shadow: 0 0 20px rgba(39, 201, 63, 0.2);
        }
        .awwwards-blink {
          animation: blink 1s step-end infinite;
          color: #fff;
        }
        @keyframes blink {
          50% { opacity: 0; }
        }

        @media (max-width: 768px) {
          .awwwards-it-section {
            padding: 20vw 5vw;
          }
          .awwwards-it-header h2 {
            font-size: 2.5rem;
          }
          .awwwards-terminal-body {
            padding: 1.5rem;
            min-height: 250px;
            font-size: 0.95rem;
          }
          .awwwards-cmd-output {
            display: block;
            margin-bottom: 0.2rem;
          }
          .awwwards-terminal-stack ul {
            gap: 1.5rem;
          }
        }
      `}} />
    </section>
  );
}