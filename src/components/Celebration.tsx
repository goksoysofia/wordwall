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

  useEffect(() => {
    if (show) {
      playCelebrationSound();
      const colors = ["#FF6B6B", "#FFE66D", "#4ECDC4", "#FF8A5C", "#A8E6CF", "#FF7EB3", "#7EC8E3", "#C3A6FF"];
      const newBalloons: Balloon[] = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        color: colors[i % colors.length],
        delay: Math.random() * 1.5,
        size: 30 + Math.random() * 25,
      }));
      setBalloons(newBalloons);
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
          <div className="absolute inset-0 bg-black/40" />

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
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    bottom: -15,
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: 2,
                    height: 20,
                    backgroundColor: balloon.color,
                    opacity: 0.6,
                  }}
                />
              </div>
            </motion.div>
          ))}

          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", damping: 10, stiffness: 100, delay: 0.3 }}
            className="relative z-10 bg-white rounded-3xl p-8 md:p-12 shadow-2xl text-center max-w-sm mx-4"
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="text-4xl md:text-6xl font-bold mb-4"
            >
              🏆
            </motion.div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">{text}</h2>
            <button
              onClick={onClose}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-3 rounded-full text-lg font-semibold hover:shadow-lg transition-shadow"
            >
              Tamam
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
