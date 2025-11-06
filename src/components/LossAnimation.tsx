/**
 * @fileoverview LossAnimation component - Dramatic animation when a player hits a mine.
 */

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaBomb } from "react-icons/fa";

interface LossAnimationProps {
  /** Whether to show the animation */
  show: boolean;
  /** The player who lost */
  losingPlayer?: "player1" | "player2";
  /** Callback when animation completes */
  onComplete?: () => void;
}

/**
 * LossAnimation component - Full-screen dramatic explosion animation.
 * Shows when a player reveals a mine and loses the game.
 */
export function LossAnimation({
  show,
  losingPlayer,
  onComplete,
}: LossAnimationProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      // Auto-hide after animation completes
      const timer = setTimeout(() => {
        setIsVisible(false);
        onComplete?.();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  // Generate random particles for explosion effect
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    delay: Math.random() * 0.5,
    duration: 0.5 + Math.random() * 0.5,
  }));

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Screen shake container */}
          <motion.div
            className="fixed inset-0 z-50 pointer-events-none"
            initial={{ x: 0, y: 0 }}
            animate={{
              x: [0, -10, 10, -8, 8, -5, 5, 0],
              y: [0, -8, 8, -6, 6, -4, 4, 0],
            }}
            transition={{
              duration: 0.6,
              ease: "easeOut",
            }}
          >
            {/* Red flash overlay */}
            <motion.div
              className="absolute inset-0 bg-error/30"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0.8, 0] }}
              transition={{ duration: 0.6 }}
            />

            {/* Explosion particles */}
            <div className="absolute inset-0 overflow-hidden">
              {particles.map((particle) => (
                <motion.div
                  key={particle.id}
                  className="absolute w-2 h-2 bg-error rounded-full"
                  style={{
                    left: `${particle.x}%`,
                    top: `${particle.y}%`,
                  }}
                  initial={{ scale: 0, opacity: 1 }}
                  animate={{
                    scale: [0, 2, 0],
                    opacity: [1, 1, 0],
                    x: (Math.random() - 0.5) * 200,
                    y: (Math.random() - 0.5) * 200,
                  }}
                  transition={{
                    delay: particle.delay,
                    duration: particle.duration,
                    ease: "easeOut",
                  }}
                />
              ))}
            </div>

            {/* Main explosion content */}
            <div className="absolute inset-0 flex items-center justify-center">
              {/* BOOM text */}
              <motion.div
                className="text-center"
                initial={{ scale: 0, opacity: 0 }}
                animate={{
                  scale: [0, 1.5, 1.2, 1],
                  opacity: [0, 1, 1, 1],
                  rotate: [0, -10, 10, 0],
                }}
                transition={{
                  duration: 0.8,
                  ease: "easeOut",
                }}
              >
                <motion.h1
                  className="text-9xl font-black text-error drop-shadow-2xl"
                  animate={{
                    textShadow: [
                      "0 0 0px rgba(239, 68, 68, 0)",
                      "0 0 20px rgba(239, 68, 68, 1)",
                      "0 0 40px rgba(239, 68, 68, 0.8)",
                      "0 0 20px rgba(239, 68, 68, 0.5)",
                    ],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    repeatType: "reverse",
                  }}
                >
                  BOOM!
                </motion.h1>

                {/* Bomb icon */}
                <motion.div
                  className="mt-4"
                  initial={{ scale: 0, rotate: 0 }}
                  animate={{
                    scale: [0, 1.5, 1],
                    rotate: [0, 360, 720],
                  }}
                  transition={{
                    delay: 0.2,
                    duration: 1,
                    ease: "easeOut",
                  }}
                >
                  <FaBomb className="text-8xl text-error mx-auto" />
                </motion.div>

                {/* You Lost text */}
                <motion.p
                  className="text-4xl font-bold text-error-content mt-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                >
                  {losingPlayer === "player1"
                    ? "Player 1 Lost!"
                    : losingPlayer === "player2"
                    ? "Player 2 Lost!"
                    : "Game Over!"}
                </motion.p>
              </motion.div>
            </div>

            {/* Expanding circle effect */}
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              initial={{ scale: 0 }}
              animate={{ scale: 3, opacity: [0.5, 0] }}
              transition={{ duration: 1, ease: "easeOut" }}
            >
              <div className="w-64 h-64 rounded-full border-4 border-error/50" />
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

