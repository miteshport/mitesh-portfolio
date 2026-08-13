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
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .mobile-floating-nav {
          pointer-events: auto;
          background-color: rgba(10, 8, 22, 0.88);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 9999px;
          padding: 0.6rem 1.6rem;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6), 0 0 25px rgba(255, 255, 255, 0.05);
        }

        .mobile-nav-ul {
          display: flex;
          align-items: center;
          gap: 1.8rem;
          list-style: none;
          margin: 0;
          padding: 0;
        }

        .mobile-nav-link {
          font-family: monospace;
          font-size: 0.76rem;
          letter-spacing: 0.15em;
          color: rgba(255, 255, 255, 0.75);
          text-decoration: none;
          text-transform: uppercase;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          white-space: nowrap;
        }

        @media (max-width: 768px) {
          .mobile-floating-nav {
            padding: 0.4rem 0.8rem !important;
            bottom: 1rem !important;
          }
          .mobile-nav-ul {
            gap: 0.6rem !important;
          }
          .mobile-nav-link {
            font-size: 0.6rem !important;
            letter-spacing: 0.06em !important;
          }
        }
      `,
        }}
      />

      <motion.nav
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="mobile-floating-nav"
      >
        <ul className="mobile-nav-ul">
          {navLinks.map((link) => (
            <li key={link.label}>
              <motion.a
                href={link.href}
                target={link.href.startsWith("http") ? "_blank" : "_self"}
                rel="noreferrer"
                whileHover={{ scale: 1.05, color: "#ffffff" }}
                whileTap={{ scale: 0.95 }}
                className="mobile-nav-link"
              >
                {link.label}
                {link.isBadge && (
                  <span
                    style={{
                      width: 6,
                      height: 6,
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