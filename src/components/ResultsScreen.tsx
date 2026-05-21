"use client";

import { motion } from "framer-motion";
import type { GameStats } from "@/types/game";

export interface ResultsScreenProps {
  stats: GameStats; // Kept in interface to prevent breaking TS signature elsewhere
  activityTitle: string;
  themeEmoji: string;
  activityId: string;
  onReplay: () => void;
  onBack: () => void;
}

const containerVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 200, damping: 18 },
  },
};

export default function ResultsScreen({
  activityTitle,
  themeEmoji,
  onReplay,
  onBack,
}: ResultsScreenProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#FFF8F0] bg-dots-pattern px-4 py-10">
      <motion.div
        className="w-full max-w-md"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Main Celebration Card */}
        <motion.div
          variants={itemVariants}
          className="relative overflow-hidden rounded-3xl bg-white p-8 text-center shadow-2xl border-2 border-[rgba(45,27,105,0.05)] flex flex-col items-center gap-6"
        >
          {/* Animated decorative backgrounds */}
          <div className="absolute -top-12 -left-12 h-24 w-24 rounded-full bg-[#FFE8F5] opacity-60 blur-xl pointer-events-none" />
          <div className="absolute -bottom-12 -right-12 h-28 w-28 rounded-full bg-[#E8F4FD] opacity-70 blur-xl pointer-events-none" />

          {/* Theme Emoji & Celebration Icons */}
          <div className="relative">
            <motion.div
              className="text-7xl mb-2 filter drop-shadow-md select-none"
              animate={{ 
                scale: [1, 1.15, 1],
                rotate: [0, -10, 10, -5, 5, 0] 
              }}
              transition={{ 
                duration: 1.5,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut"
              }}
            >
              {themeEmoji || "🎉"}
            </motion.div>
            
            {/* Tiny floating stars around emoji */}
            <motion.span 
              className="absolute -top-2 -left-4 text-xl select-none"
              animate={{ y: [0, -6, 0], opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.2 }}
            >
              ✨
            </motion.span>
            <motion.span 
              className="absolute -bottom-2 -right-4 text-xl select-none"
              animate={{ y: [0, -8, 0], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2.3, repeat: Infinity, delay: 0.5 }}
            >
              🌟
            </motion.span>
          </div>

          {/* Encouragement Headline */}
          <div className="flex flex-col gap-2 z-10">
            <h1 className="font-heading text-4xl font-extrabold text-[#FF6B9D] leading-tight select-none drop-shadow-sm">
              Aferin! Harikasın! 🌟
            </h1>
            <p className="font-heading text-base font-semibold text-[#8B7BAD] px-2 select-none">
              &ldquo;{activityTitle}&rdquo; etkinliğini başarıyla tamamladın. Harika bir iş çıkardın!
            </p>
          </div>

          {/* Action Buttons inside Card */}
          <div className="w-full flex flex-col gap-3 mt-4 z-10">
            <button
              type="button"
              onClick={onReplay}
              className="btn-candy w-full rounded-2xl py-4 font-heading text-lg font-bold text-white shadow-md hover:scale-[1.02] active:scale-[0.98] transition-transform duration-150"
            >
              Tekrar Oyna 🔄
            </button>
            <button
              type="button"
              onClick={onBack}
              className="btn-blue w-full rounded-2xl py-4 font-heading text-lg font-bold text-white shadow-md hover:scale-[1.02] active:scale-[0.98] transition-transform duration-150"
            >
              Geri Dön ↩
            </button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
