"use client";
import { motion } from "framer-motion";
import { ReactNode } from "react";
const ease = [0.16, 1, 0.3, 1] as [number, number, number, number]; // Premium out-expo curve

export function RevealText({ children, delay = 0 }: { children: ReactNode, delay?: number }) {
  return (
    <div style={{ overflow: "hidden", display: "inline-block", verticalAlign: "top" }}>
      <motion.div
        initial={{ y: "100%", opacity: 0, rotateZ: 5 }}
        whileInView={{ y: 0, opacity: 1, rotateZ: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, delay, ease }}
      >
        {children}
      </motion.div>
    </div>
  );
}

export function RevealBlock({ children, delay = 0 }: { children: ReactNode, delay?: number }) {
  return (
    <motion.div
      initial={{ y: 50, opacity: 0, filter: "blur(10px)" }}
      whileInView={{ y: 0, opacity: 1, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 1, delay, ease }}
    >
      {children}
    </motion.div>
  );
}
