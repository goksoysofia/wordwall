"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { playCelebrationSound } from "@/lib/sounds";

interface Balloon {
  id: number;
  x: number;
  color: string;
  delay: number;
  size: number;
}

interface Star {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
  rotation: number;
}

const BALLOON_COLORS = ["#FF6B9D", "#FFD93D", "#4D96FF", "#6BCB77", "#FF8A50", "#9B59B6", "#26D0CE", "#FF5252"];

export default function Celebration({
  show,
  text = "Aferin! 🎉",
  onClose,
}: {
  show: boolean;
  text?: string;
  onClose: () => void;
}) {
  const [balloons, setBalloons] = useState<Balloon[]>([]);
  const [stars, setStars] = useState<Star[]>([]);

  useEffect(() => {
    if (show) {
      playCelebrationSound();
      const newBalloons: Balloon[] = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        color: BALLOON_COLORS[i % BALLOON_COLORS.length],
        delay: Math.random() * 1.5,
        size: 32 + Math.random() * 28,
      }));
      setBalloons(newBalloons);

      const newStars: Star[] = Array.from({ length: 12 }, (_, i) => ({
        id: i,
        x: 10 + Math.random() * 80,
        y: 10 + Math.random() * 80,
        size: 16 + Math.random() * 24,
        delay: Math.random() * 2,
        rotation: Math.random() * 360,
      }));
      setStars(newStars);
    }
  }, [show]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />

          {/* Balloons */}
          {balloons.map((balloon) => (
            <motion.div
              key={balloon.id}
              initial={{ y: "100vh", x: `${balloon.x}vw` }}
              animate={{ y: "-20vh" }}
              transition={{
                duration: 3 + Math.random() * 2,
                delay: balloon.delay,
                ease: "easeOut",
              }}
              className="absolute"
              style={{ left: `${balloon.x}%` }}
            >
              <div
                style={{
                  width: balloon.size,
                  height: balloon.size * 1.2,
                  backgroundColor: balloon.color,
                  borderRadius: "50% 50% 50% 50% / 40% 40% 60% 60%",
                  position: "relative",
                  boxShadow: `inset -4px -4px 0 rgba(0,0,0,0.1), 0 4px 12px ${balloon.color}40`,
                }}
              >
                {/* Balloon shine */}
                <div
                  style={{
                    position: "absolute",
                    top: "15%",
                    left: "20%",
                    width: "30%",
                    height: "25%",
                    backgroundColor: "rgba(255,255,255,0.4)",
                    borderRadius: "50%",
                    transform: "rotate(-30deg)",
                  }}
                />
                {/* String */}
                <div
                  style={{
                    position: "absolute",
                    bottom: -18,
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: 2,
                    height: 24,
                    backgroundColor: balloon.color,
                    opacity: 0.5,
                    borderRadius: 1,
                  }}
                />
              </div>
            </motion.div>
          ))}

          {/* Sparkle stars */}
          {stars.map((star) => (
            <motion.div
              key={`star-${star.id}`}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1.2, 0.8, 1], opacity: [0, 1, 0.8, 0] }}
              transition={{
                duration: 2,
                delay: star.delay,
                repeat: Infinity,
                repeatDelay: 1,
              }}
              className="absolute text-[#FFD93D]"
              style={{
                left: `${star.x}%`,
                top: `${star.y}%`,
                fontSize: star.size,
                transform: `rotate(${star.rotation}deg)`,
              }}
            >
              ✦
            </motion.div>
          ))}

          {/* Main celebration card */}
          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", damping: 12, stiffness: 120, delay: 0.3 }}
            className="relative z-10 mx-4 max-w-sm overflow-hidden rounded-[2rem] bg-white p-8 text-center shadow-2xl md:p-12"
            style={{
              border: "4px solid #FFD93D",
              boxShadow: "0 24px 60px rgba(45, 27, 105, 0.25), 0 0 0 8px rgba(255, 217, 61, 0.2)",
            }}
          >
            {/* Decorative dots in card */}
            <div className="absolute -left-4 -top-4 h-20 w-20 rounded-full bg-[#FFD93D]/15" />
            <div className="absolute -bottom-4 -right-4 h-16 w-16 rounded-full bg-[#FF6B9D]/15" />

            <motion.div
              animate={{ scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="mb-4 text-5xl font-bold md:text-7xl"
            >
              🏆
            </motion.div>
            <h2 className="font-heading text-2xl font-extrabold text-[#2D1B69] md:text-3xl mb-4">{text}</h2>
            <button
              onClick={onClose}
              className="btn-candy px-10 py-3.5 text-lg"
            >
              Tamam ✨
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
