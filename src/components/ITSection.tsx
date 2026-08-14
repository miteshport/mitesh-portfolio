"use client";

import { useState, useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";

const OUTPUT_LINES = [
  { label: "[✓] Experience:", value: "10+ Years Global Enterprise IT Operations", color: "#22c55e" },
  { label: "[✓] Specialization:", value: "P1/P2 Major Incident Command & Root Cause Analysis", color: "#f59e0b" },
  { label: "[✓] Scale:", value: "3,000+ User Infrastructure / Zero-Downtime Networking", color: "#3b82f6" },
  { label: "[✓] Stack:", value: "ServiceNow ITSM, Entra ID, M365 Security, Active Directory", color: "#a855f7" },
];

export default function ITSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: false, amount: 0.3 });

  const [typedCommand, setTypedCommand] = useState("");
  const [showOutput, setShowOutput] = useState(false);
  const fullCommand = "./reveal_stack.sh --execute";

  // Mini-Game Breach Simulation State
  const [isBreachActive, setIsBreachActive] = useState(false);
  const [breachStep, setBreachStep] = useState(0); // 0 = idle, 1 = contain, 2 = failover, 3 = hotfix, 4 = resolved
  const [slaCountdown, setSlaCountdown] = useState(45.0);
  const [simLogs, setSimLogs] = useState<string[]>([]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isBreachActive && breachStep > 0 && breachStep < 4) {
      timer = setInterval(() => {
        setSlaCountdown((prev) => Math.max(0, +(prev - 0.05).toFixed(2)));
      }, 50);
    }
    return () => clearInterval(timer);
  }, [isBreachActive, breachStep]);

  useEffect(() => {
    if (isInView && !isBreachActive) {
      setTypedCommand("");
      setShowOutput(false);
      let i = 0;
      const interval = setInterval(() => {
        setTypedCommand(fullCommand.slice(0, i + 1));
        i++;
        if (i === fullCommand.length) {
          clearInterval(interval);
          setTimeout(() => setShowOutput(true), 350);
        }
      }, 30);
      return () => clearInterval(interval);
    }
  }, [isInView, isBreachActive]);

  const startBreachGame = () => {
    setIsBreachActive(true);
    setBreachStep(1);
    setSlaCountdown(45.0);
    setSimLogs(["[ALERT] 23:31:02 - Critical packet drop detected on Gateway Node 09."]);
  };

  const handleStepClick = (stepIndex: number) => {
    if (stepIndex === breachStep) {
      if (breachStep === 1) {
        setSimLogs((prev) => [...prev, "[✓] STAGE 1: Node 09 isolated. Quarantine perimeter active."]);
        setBreachStep(2);
      } else if (breachStep === 2) {
        setSimLogs((prev) => [...prev, "[✓] STAGE 2: Secondary datacenter failover engaged. Traffic normalized."]);
        setBreachStep(3);
      } else if (breachStep === 3) {
        setSimLogs((prev) => [...prev, "[✓] STAGE 3: Kernel hotfix applied. Zero downtime SLA preserved."]);
        setBreachStep(4);
      }
    }
  };

  const resetTerminal = () => {
    setIsBreachActive(false);
    setBreachStep(0);
    setSimLogs([]);
    setTypedCommand(fullCommand);
    setShowOutput(true);
  };

  return (
    <section
      ref={sectionRef}
      id="it"
      style={{
        width: "100vw",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        backgroundColor: "transparent",
        padding: "6rem 2rem",
        zIndex: 10,
      }}
    >
      {/* Section Header */}
      <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
        <h2
          style={{
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontStyle: "italic",
            fontSize: "clamp(2.5rem, 4.5vw, 4.5rem)",
            color: "#ffffff",
            margin: 0,
          }}
        >
          The Engine
        </h2>
        <p
          style={{
            fontFamily: "monospace",
            fontSize: "0.85rem",
            letterSpacing: "0.2em",
            color: "rgba(255, 255, 255, 0.5)",
            textTransform: "uppercase",
            marginTop: "0.5rem",
          }}
        >
          The Technical Foundation Powering Major Incident Operations
        </p>
      </div>

      {/* Floating Glassmorphic macOS Terminal Window (APPLE LIQUID GLASS) */}
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.96 }}
        animate={isInView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 40, scale: 0.96 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        style={{
          width: "100%",
          maxWidth: "880px",
          backgroundColor: isBreachActive && breachStep < 4 ? "rgba(35, 8, 12, 0.65)" : "rgba(255, 255, 255, 0.03)",
          border: isBreachActive && breachStep < 4 ? "1px solid #ef4444" : "1px solid rgba(255, 255, 255, 0.12)",
          borderRadius: "14px",
          backdropFilter: "blur(24px) saturate(160%)",
          WebkitBackdropFilter: "blur(24px) saturate(160%)",
          boxShadow: isBreachActive && breachStep < 4
            ? "0 30px 80px rgba(239, 68, 68, 0.3), 0 0 50px rgba(239, 68, 68, 0.35)"
            : "0 30px 80px rgba(0, 0, 0, 0.5), 0 0 40px rgba(168, 85, 247, 0.15)",
          overflow: "hidden",
          position: "relative",
          transition: "background-color 0.4s ease, border-color 0.4s ease, box-shadow 0.4s ease",
        }}
      >
        {/* Terminal Header Bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0.9rem 1.2rem",
            backgroundColor: "rgba(255, 255, 255, 0.04)",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            position: "relative",
            zIndex: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", minWidth: 0, flex: 1 }}>
            <div style={{ display: "flex", gap: "0.45rem", marginRight: "0.8rem", flexShrink: 0 }}>
              <span style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: "#ff5f56" }} />
              <span style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: "#ffbd2e" }} />
              <span style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: "#27c93f" }} />
            </div>
            <span
              style={{
                fontFamily: "monospace",
                fontSize: "0.75rem",
                color: isBreachActive && breachStep < 4 ? "#ef4444" : "rgba(255, 255, 255, 0.6)",
                letterSpacing: "0.05em",
                fontWeight: isBreachActive ? "bold" : "normal",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {isBreachActive && breachStep < 4 ? "root@incident:~/MAJOR_ALERT" : "mitesh@system:~/operations"}
            </span>
          </div>

          {!isBreachActive ? (
            <button
              onClick={startBreachGame}
              style={{
                backgroundColor: "rgba(239, 68, 68, 0.15)",
                border: "1px solid #ef4444",
                color: "#ef4444",
                fontFamily: "monospace",
                fontSize: "0.65rem",
                padding: "0.25rem 0.6rem",
                borderRadius: "4px",
                cursor: "pointer",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                flexShrink: 0,
                marginLeft: "0.5rem",
              }}
            >
              [ P1 BREACH SIMULATION ]
            </button>
          ) : (
            <button
              onClick={resetTerminal}
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                color: "#ffffff",
                fontFamily: "monospace",
                fontSize: "0.65rem",
                padding: "0.25rem 0.6rem",
                borderRadius: "4px",
                cursor: "pointer",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                flexShrink: 0,
                marginLeft: "0.5rem",
              }}
            >
              [ RESET SYSTEM ]
            </button>
          )}
        </div>

        {/* Terminal Body Prompt Row */}
        <div
          style={{
            padding: "1.2rem 1.8rem 0.8rem 1.8rem",
            fontFamily: "monospace",
            fontSize: "0.95rem",
            lineHeight: 1.9,
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
          }}
        >
          <span style={{ color: "#38bdf8" }}>~ $</span>
          <span>{isBreachActive ? "./triage_incident.sh --command_center" : typedCommand}</span>
          <span
            style={{
              width: 8,
              height: 18,
              backgroundColor: "#38bdf8",
              display: "inline-block",
              animation: "pulse 1s infinite",
            }}
          />
        </div>

        {/* PHYSICAL LIQUID WINDOW FRAME EXPANSION */}
        <motion.div
          animate={{
            gridTemplateRows: isBreachActive || showOutput ? "1fr" : "0fr",
            opacity: isBreachActive || showOutput ? 1 : 0,
          }}
          transition={{
            duration: 0.8,
            ease: [0.22, 1, 0.36, 1],
          }}
          style={{
            display: "grid",
            willChange: "grid-template-rows, opacity",
          }}
        >
          <div style={{ overflow: "hidden", padding: "0 1.8rem 1.8rem 1.8rem" }}>
            {!isBreachActive ? (
              <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
                {OUTPUT_LINES.map((line, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -12 }}
                    animate={showOutput ? { opacity: 1, x: 0 } : { opacity: 0, x: -12 }}
                    transition={{
                      duration: 0.35,
                      delay: 0.12 + idx * 0.1,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "baseline" }}
                  >
                    <span style={{ color: line.color, fontWeight: "bold" }}>{line.label}</span>
                    <span style={{ color: "rgba(255, 255, 255, 0.9)" }}>{line.value}</span>
                  </motion.div>
                ))}

                {/* Executive Card Action Button */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={showOutput ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
                  transition={{ duration: 0.4, delay: 0.55 }}
                  style={{ marginTop: "1.5rem" }}
                >
                  <a
                    href="/card"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      padding: "0.75rem 1.8rem",
                      borderRadius: "6px",
                      backgroundColor: "rgba(34, 197, 94, 0.12)",
                      border: "1px solid #22c55e",
                      color: "#22c55e",
                      fontFamily: "monospace",
                      fontSize: "0.85rem",
                      letterSpacing: "0.1em",
                      textDecoration: "none",
                      textTransform: "uppercase",
                      transition: "all 0.3s ease",
                    }}
                  >
                    EXECUTE: VIEW_EXECUTIVE_CARD.PDF
                  </a>
                </motion.div>
              </div>
            ) : (
              /* LIVE INCIDENT TRIAGE SIMULATION */
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} style={{ marginTop: "1rem" }}>
                {breachStep < 4 ? (
                  <div>
                    {/* Live Telemetry & Countdown HUD */}
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "0.75rem 1rem",
                        backgroundColor: "rgba(0, 0, 0, 0.4)",
                        border: "1px solid rgba(239, 68, 68, 0.4)",
                        borderRadius: "8px",
                        marginBottom: "1.2rem",
                        gap: "0.6rem",
                        fontFamily: "monospace",
                      }}
                    >
                      <div style={{ color: "#ef4444", fontWeight: "bold", fontSize: "0.85rem", letterSpacing: "0.08em" }}>
                        SLA BREACH WINDOW: 00:{slaCountdown.toFixed(2)}s
                      </div>
                      <div style={{ fontSize: "0.72rem", color: "rgba(255, 255, 255, 0.7)", letterSpacing: "0.05em" }}>
                        PACKET LOSS: <span style={{ color: "#ef4444" }}>84%</span> | IOPS: <span style={{ color: "#f59e0b" }}>DEGRADED</span>
                      </div>
                    </div>

                    {/* Simulation Execution Logs */}
                    <div
                      style={{
                        backgroundColor: "rgba(0, 0, 0, 0.35)",
                        padding: "0.8rem 1rem",
                        borderRadius: "6px",
                        marginBottom: "1.2rem",
                        fontFamily: "monospace",
                        fontSize: "0.76rem",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.3rem",
                      }}
                    >
                      {simLogs.map((log, i) => (
                        <div key={i} style={{ color: log.includes("[✓]") ? "#22c55e" : "#ef4444" }}>
                          {log}
                        </div>
                      ))}
                    </div>

                    <p style={{ color: "rgba(255,255,255,0.7)", marginBottom: "1rem", fontFamily: "monospace", fontSize: "0.8rem" }}>
                      Execute rapid command triage in sequence to restore infrastructure SLA:
                    </p>

                    <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
                      <button
                        onClick={() => handleStepClick(1)}
                        disabled={breachStep !== 1}
                        style={{
                          padding: "0.85rem 1.4rem",
                          borderRadius: "6px",
                          backgroundColor: breachStep > 1 ? "rgba(34, 197, 94, 0.2)" : breachStep === 1 ? "#ef4444" : "rgba(255, 255, 255, 0.05)",
                          border: breachStep > 1 ? "1px solid #22c55e" : breachStep === 1 ? "1px solid #ef4444" : "1px solid rgba(255, 255, 255, 0.1)",
                          color: breachStep > 1 ? "#22c55e" : breachStep === 1 ? "#ffffff" : "rgba(255, 255, 255, 0.4)",
                          fontFamily: "monospace",
                          fontSize: "0.82rem",
                          textAlign: "left",
                          cursor: breachStep === 1 ? "pointer" : "default",
                          transition: "all 0.2s ease",
                        }}
                      >
                        {breachStep > 1 ? "[✓] STAGE 1 EXECUTED: isolate_compromised_node" : "1. $ isolate_compromised_node --target=cluster_09"}
                      </button>

                      <button
                        onClick={() => handleStepClick(2)}
                        disabled={breachStep !== 2}
                        style={{
                          padding: "0.85rem 1.4rem",
                          borderRadius: "6px",
                          backgroundColor: breachStep > 2 ? "rgba(34, 197, 94, 0.2)" : breachStep === 2 ? "#ef4444" : "rgba(255, 255, 255, 0.05)",
                          border: breachStep > 2 ? "1px solid #22c55e" : breachStep === 2 ? "#ef4444" : "1px solid rgba(255, 255, 255, 0.1)",
                          color: breachStep > 2 ? "#22c55e" : breachStep === 2 ? "#ffffff" : "rgba(255, 255, 255, 0.4)",
                          fontFamily: "monospace",
                          fontSize: "0.82rem",
                          textAlign: "left",
                          cursor: breachStep === 2 ? "pointer" : "default",
                          transition: "all 0.2s ease",
                        }}
                      >
                        {breachStep > 2 ? "[✓] STAGE 2 EXECUTED: engage_secondary_failover" : "2. $ engage_secondary_failover --datacenter=central"}
                      </button>

                      <button
                        onClick={() => handleStepClick(3)}
                        disabled={breachStep !== 3}
                        style={{
                          padding: "0.85rem 1.4rem",
                          borderRadius: "6px",
                          backgroundColor: breachStep > 3 ? "rgba(34, 197, 94, 0.2)" : breachStep === 3 ? "#ef4444" : "rgba(255, 255, 255, 0.05)",
                          border: breachStep > 3 ? "1px solid #22c55e" : breachStep === 3 ? "#ef4444" : "1px solid rgba(255, 255, 255, 0.1)",
                          color: breachStep > 3 ? "#22c55e" : breachStep === 3 ? "#ffffff" : "rgba(255, 255, 255, 0.4)",
                          fontFamily: "monospace",
                          fontSize: "0.82rem",
                          textAlign: "left",
                          cursor: breachStep === 3 ? "pointer" : "default",
                          transition: "all 0.2s ease",
                        }}
                      >
                        {breachStep > 3 ? "[✓] STAGE 3 EXECUTED: deploy_hotfix" : "3. $ deploy_hotfix --verify_integrity"}
                      </button>
                    </div>
                  </div>
                ) : (
                  /* EXECUTIVE RESOLUTION DASHBOARD */
                  <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                    <div
                      style={{
                        color: "#22c55e",
                        fontWeight: "bold",
                        fontSize: "1.15rem",
                        letterSpacing: "0.1em",
                        marginBottom: "1rem",
                        fontFamily: "monospace",
                      }}
                    >
                      [✓] INCIDENT RESOLVED. 100% SLA PRESERVED.
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                        gap: "0.8rem",
                        backgroundColor: "rgba(34, 197, 94, 0.08)",
                        border: "1px solid rgba(34, 197, 94, 0.3)",
                        padding: "1rem",
                        borderRadius: "8px",
                        marginBottom: "1.2rem",
                        fontFamily: "monospace",
                      }}
                    >
                      <div>
                        <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.68rem" }}>RESOLUTION MTTR</div>
                        <div style={{ color: "#ffffff", fontSize: "0.95rem", fontWeight: "bold" }}>14.2s (RECORD)</div>
                      </div>
                      <div>
                        <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.68rem" }}>ACTIVE USERS</div>
                        <div style={{ color: "#22c55e", fontSize: "0.95rem", fontWeight: "bold" }}>3,000+ RESTORED</div>
                      </div>
                      <div>
                        <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.68rem" }}>NETWORK LATENCY</div>
                        <div style={{ color: "#38bdf8", fontSize: "0.95rem", fontWeight: "bold" }}>2ms NOMINAL</div>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginTop: "1.5rem" }}>
                      <a
                        href="/card"
                        style={{
                          padding: "0.75rem 1.4rem",
                          borderRadius: "6px",
                          backgroundColor: "#22c55e",
                          color: "#000000",
                          fontFamily: "monospace",
                          fontSize: "0.8rem",
                          fontWeight: "bold",
                          textDecoration: "none",
                          textTransform: "uppercase",
                        }}
                      >
                        [ VIEW EXECUTIVE PASS ]
                      </a>
                      <button
                        onClick={resetTerminal}
                        style={{
                          padding: "0.75rem 1.4rem",
                          borderRadius: "6px",
                          backgroundColor: "rgba(255, 255, 255, 0.1)",
                          color: "#ffffff",
                          fontFamily: "monospace",
                          fontSize: "0.8rem",
                          border: "1px solid rgba(255, 255, 255, 0.2)",
                          cursor: "pointer",
                          textTransform: "uppercase",
                        }}
                      >
                        RETURN TO TERMINAL
                      </button>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}