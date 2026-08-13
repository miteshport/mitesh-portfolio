"use client";

import { motion } from "framer-motion";

export default function Navigation() {
  const navLinks = [
    { label: "LINKEDIN", href: "https://www.linkedin.com/in/mitesh-shah-6415777a/" },
    { label: "INSTAGRAM", href: "https://www.instagram.com/mitesh.shah01?igsh=MWVsbHA2dnM5N2poMQ==" },
    { label: "WHATSAPP", href: "https://wa.me/qr/Y4BDLWGVOJ7WO1" },
    { label: "EXECUTIVE CARD", href: "/card", isBadge: true },
  ];

  return (
    <div
      style={{
        position: "fixed",
        bottom: "2rem",
        left: 0,
        width: "100vw",
        display: "flex",
        justifyContent: "center",
        pointerEvents: "none",
        zIndex: 99999,
      }}
    >
      <motion.nav
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        style={{
          pointerEvents: "auto",
          backgroundColor: "rgba(10, 8, 22, 0.88)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          borderRadius: "9999px",
          padding: "0.6rem 1.6rem",
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.6), 0 0 25px rgba(255, 255, 255, 0.05)",
        }}
      >
        <ul
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1.8rem",
            listStyle: "none",
            margin: 0,
            padding: 0,
          }}
        >
          {navLinks.map((link) => (
            <li key={link.label}>
              <motion.a
                href={link.href}
                target={link.href.startsWith("http") ? "_blank" : "_self"}
                rel="noreferrer"
                whileHover={{ scale: 1.05, color: "#ffffff" }}
                whileTap={{ scale: 0.95 }}
                style={{
                  fontFamily: "monospace",
                  fontSize: "0.76rem",
                  letterSpacing: "0.15em",
                  color: "rgba(255, 255, 255, 0.75)",
                  textDecoration: "none",
                  textTransform: "uppercase",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  transition: "color 0.2s ease",
                }}
              >
                {link.label}
                {link.isBadge && (
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      backgroundColor: "#22c55e",
                      boxShadow: "0 0 8px #22c55e",
                      display: "inline-block",
                    }}
                  />
                )}
              </motion.a>
            </li>
          ))}
        </ul>
      </motion.nav>
    </div>
  );
}