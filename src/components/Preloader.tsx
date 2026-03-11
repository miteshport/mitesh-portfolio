"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const LOGS = [
  "INITIALIZING_CORE...",
  "LOADING_MESH_DATA...",
  "ALLOCATING_MEMORY...",
  "MOUNTING_DRIVES...",
  "ESTABLISHING_UPLINK...",
  "DECRYPTING_ASSETS...",
  "COMPILING_SHADERS...",
  "BYPASSING_SECURITY...",
  "SYSTEM_READY_OK"
];

export default function Preloader() {
  const [progress, setProgress] = useState(0);
  const [logIndex, setLogIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 2 seconds to reach 100
    // Updates every 20ms -> 100 steps
    const intervalTime = 20;
    const totalSteps = 2000 / intervalTime;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const currentProgress = Math.min(Math.floor((currentStep / totalSteps) * 100), 100);
      setProgress(currentProgress);

      if (currentStep % 10 === 0) {
         setLogIndex(prev => Math.min(prev + 1, LOGS.length - 1));
      }

      if (currentStep >= totalSteps) {
        clearInterval(timer);
        setTimeout(() => {
          setIsLoading(false);
        }, 200); // slight pause at 100%
      }
    }, intervalTime);

    // Lock scroll during loading
    document.body.style.overflow = 'hidden';

    return () => {
      clearInterval(timer);
      document.body.style.overflow = 'auto'; // Unlock scroll
    };
  }, []);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          className="awwwards-preloader"
          initial={{ y: 0 }}
          exit={{ y: "-100vh" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} // ease-out-expo
        >
          <div className="preloader-content">
            <div className="preloader-percentage">
              [ {String(progress).padStart(3, '0')}% ]
            </div>
            <div className="preloader-log">
              {LOGS[logIndex]}
            </div>
          </div>
          <style dangerouslySetInnerHTML={{
            __html: `
            .awwwards-preloader {
              position: fixed;
              inset: 0;
              z-index: 9999;
              background-color: #000;
              display: flex;
              align-items: center;
              justify-content: center;
              color: #fff;
            }
            .preloader-content {
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 1.5rem;
            }
            .preloader-percentage {
              font-family: monospace;
              font-size: clamp(4rem, 10vw, 8rem);
              font-weight: bold;
              letter-spacing: 0.05em;
              color: #fff;
            }
            .preloader-log {
              font-family: monospace;
              font-size: 1rem;
              color: #27c93f;
              text-transform: uppercase;
              letter-spacing: 0.1em;
            }
            `
          }} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
