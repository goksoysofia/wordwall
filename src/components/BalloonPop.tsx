"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { playPopSound, playCorrectSound, playWrongSound } from "@/lib/sounds";
import type { GameStats } from "@/types/game";

export interface BalloonPopProps {
  options: { id: string; text?: string; imageUrl?: string; isCorrect?: boolean }[];
  title: string; // instruction/question
  theme: {
    backgroundColor: string;
    cardColors: string[];
    celebrationText: string;
    emoji: string;
  };
  onComplete: (stats: GameStats) => void;
}

interface BalloonData {
  id: string;
  originalId: string;
  text?: string;
  imageUrl?: string;
  isCorrect: boolean;
  color: string;
  x: number;
  y: number;
  delay: number;
  floatRange: number;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function BalloonPop({ options, title, theme, onComplete }: BalloonPopProps) {
  const startTime = useRef(Date.now());
  const hasCompletedRef = useRef(false);
  const scoreRef = useRef({ correct: 0, wrong: 0 });

  // Stable random values per option id, stored in a ref so they don't change on re-render
  const randomsRef = useRef<Map<string, { yOffset: number; floatRange: number }>>(new Map());
  const getRandoms = (id: string) => {
    if (!randomsRef.current.has(id)) {
      randomsRef.current.set(id, {
        yOffset: Math.random() * 10,
        floatRange: 8 + Math.random() * 8,
      });
    }
    return randomsRef.current.get(id)!;
  };

  const balloons = useMemo(() => {
    const cols = Math.min(options.length, 4);
    return shuffle(
      options.map((o, i) => {
        const rng = getRandoms(o.id);
        return {
          id: o.id,
          originalId: o.id,
          text: o.text,
          imageUrl: o.imageUrl,
          isCorrect: o.isCorrect === true,
          color: theme.cardColors[i % theme.cardColors.length],
          x: ((i % cols) + 0.5) * (100 / cols),
          y: 20 + Math.floor(i / cols) * 35 + rng.yOffset,
          delay: i * 0.15,
          floatRange: rng.floatRange,
        };
      })
    );
  }, [options, theme.cardColors]);

  const [popped, setPopped] = useState<Set<string>>(new Set());
  const [popEffects, setPopEffects] = useState<{ id: string; x: number; y: number; correct: boolean }[]>([]);
  const [score, setScore] = useState({ correct: 0, wrong: 0 });
  const correctCount = options.filter((o) => o.isCorrect).length;

  const handlePop = useCallback(
    (balloon: BalloonData) => {
      if (popped.has(balloon.id)) return;

      playPopSound();
      setPopped((prev) => new Set(prev).add(balloon.id));
      setPopEffects((prev) => [
        ...prev,
        { id: balloon.id, x: balloon.x, y: balloon.y, correct: balloon.isCorrect },
      ]);

      if (balloon.isCorrect) {
        playCorrectSound();
        setScore((s) => {
          const next = { ...s, correct: s.correct + 1 };
          scoreRef.current = next;
          return next;
        });
      } else {
        playWrongSound();
        setScore((s) => {
          const next = { ...s, wrong: s.wrong + 1 };
          scoreRef.current = next;
          return next;
        });
      }

      setTimeout(() => {
        setPopEffects((prev) => prev.filter((e) => e.id !== balloon.id));
      }, 1000);
    },
    [popped]
  );

  useEffect(() => {
    if (score.correct >= correctCount && correctCount > 0 && !hasCompletedRef.current) {
      hasCompletedRef.current = true;
      setTimeout(() => {
        const s = scoreRef.current;
        const stats: GameStats = {
          totalItems: options.length,
          correctCount: s.correct,
          wrongCount: s.wrong,
          timeSeconds: Math.round((Date.now() - startTime.current) / 1000),
          completedAt: new Date().toISOString(),
        };
        onComplete(stats);
      }, 800);
    }
  }, [score.correct, correctCount, onComplete, options.length]);

  const resetGame = () => {
    setPopped(new Set());
    setPopEffects([]);
    setScore({ correct: 0, wrong: 0 });
    scoreRef.current = { correct: 0, wrong: 0 };
    hasCompletedRef.current = false;
    startTime.current = Date.now();
  };

  return (
    <div className="flex flex-col items-center gap-4 px-3 py-6 md:px-6" style={{ backgroundColor: theme.backgroundColor }}>
      {/* Score */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 rounded-2xl bg-white px-4 py-2 shadow-sm" style={{ border: "2px solid rgba(45, 27, 105, 0.06)" }}>
          <span className="text-lg">🎈</span>
          <span className="font-heading text-lg font-bold text-emerald-600">{score.correct}</span>
          <span className="text-xs font-bold text-[#8B7BAD]">/ {correctCount}</span>
        </div>
        {score.wrong > 0 && (
          <div className="flex items-center gap-2 rounded-2xl bg-white px-4 py-2 shadow-sm" style={{ border: "2px solid rgba(45, 27, 105, 0.06)" }}>
            <span className="text-lg">💨</span>
            <span className="font-heading text-lg font-bold text-rose-500">{score.wrong}</span>
          </div>
        )}
      </div>

      {/* Question / Instruction */}
      <motion.div
        className="w-full max-w-lg rounded-2xl bg-white px-5 py-3 text-center shadow-md"
        style={{ border: "2px solid rgba(45, 27, 105, 0.06)" }}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <p className="font-heading text-base font-bold text-[#2D1B69] sm:text-lg">{title}</p>
        <p className="mt-1 text-xs font-bold text-[#8B7BAD]">Doğru balonları patlat! 🎯</p>
      </motion.div>

      {/* Balloon Area */}
      <div
        className="relative w-full max-w-2xl overflow-hidden rounded-3xl"
        style={{
          height: "min(60vh, 500px)",
          background: `linear-gradient(180deg, ${theme.backgroundColor}, ${theme.backgroundColor}DD, rgba(255,255,255,0.3))`,
          border: "3px solid rgba(45, 27, 105, 0.06)",
        }}
      >
        {/* Pop effects */}
        <AnimatePresence>
          {popEffects.map((effect) => (
            <motion.div
              key={`effect-${effect.id}`}
              className="pointer-events-none absolute z-20 font-heading text-3xl font-bold"
              style={{ left: `${effect.x}%`, top: `${effect.y}%`, transform: "translate(-50%, -50%)" }}
              initial={{ opacity: 1, scale: 1 }}
              animate={{ opacity: 0, scale: 2, y: -40 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
            >
              {effect.correct ? "✅" : "❌"}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Balloons */}
        <AnimatePresence>
          {balloons
            .filter((b) => !popped.has(b.id))
            .map((balloon) => (
              <motion.button
                key={balloon.id}
                type="button"
                onClick={() => handlePop(balloon)}
                className="absolute z-10 flex flex-col items-center"
                style={{
                  left: `${balloon.x}%`,
                  top: `${balloon.y}%`,
                  transform: "translate(-50%, -50%)",
                }}
                initial={{ opacity: 0, scale: 0, y: 50 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  y: [0, -balloon.floatRange, 0],
                }}
                exit={{
                  scale: [1.3, 0],
                  opacity: 0,
                  transition: { duration: 0.3 },
                }}
                transition={{
                  y: {
                    duration: 2 + balloon.delay,
                    repeat: Infinity,
                    repeatType: "reverse",
                    ease: "easeInOut",
                  },
                  opacity: { delay: balloon.delay },
                  scale: { delay: balloon.delay, type: "spring", stiffness: 200 },
                }}
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
              >
                {/* Balloon SVG */}
                <svg width="80" height="100" viewBox="0 0 100 110" className="drop-shadow-lg">
                  {/* String */}
                  <path
                    d="M50,85 Q48,90 52,95 Q48,100 50,105"
                    fill="none"
                    stroke={balloon.color}
                    strokeWidth="1.5"
                    opacity="0.6"
                  />
                  {/* Balloon body */}
                  <ellipse
                    cx="50"
                    cy="45"
                    rx="35"
                    ry="40"
                    fill={balloon.color}
                    opacity="0.9"
                  />
                  {/* Shine */}
                  <ellipse
                    cx="38"
                    cy="32"
                    rx="10"
                    ry="14"
                    fill="white"
                    opacity="0.3"
                    transform="rotate(-20, 38, 32)"
                  />
                  {/* Knot */}
                  <polygon points="46,83 50,88 54,83" fill={balloon.color} opacity="0.8" />
                  {/* Text */}
                  {balloon.text && (
                    <text
                      x="50"
                      y="48"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="white"
                      fontSize={balloon.text.length > 8 ? 10 : 13}
                      fontWeight="800"
                      fontFamily="'Nunito', sans-serif"
                      style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.3))" }}
                    >
                      {balloon.text.length > 12
                        ? balloon.text.slice(0, 11) + "…"
                        : balloon.text}
                    </text>
                  )}
                </svg>
                {/* Image below balloon if provided */}
                {balloon.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={balloon.imageUrl}
                    alt=""
                    className="-mt-4 h-10 w-10 rounded-full border-2 border-white object-cover shadow-md"
                  />
                )}
              </motion.button>
            ))}
        </AnimatePresence>

        {/* All popped message */}
        {popped.size === balloons.length && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="rounded-3xl bg-white/90 px-8 py-6 text-center shadow-xl backdrop-blur-sm">
              <div className="mb-2 text-4xl">{score.wrong === 0 ? "🏆" : "🎈"}</div>
              <p className="font-heading text-lg font-bold text-[#2D1B69]">
                {score.wrong === 0 ? "Mükemmel!" : "Tamamlandı!"}
              </p>
              <p className="text-sm font-bold text-[#8B7BAD]">
                {score.correct} doğru, {score.wrong} yanlış
              </p>
            </div>
          </motion.div>
        )}
      </div>

      {/* Reset */}
      <button
        type="button"
        onClick={resetGame}
        className="rounded-2xl bg-white px-6 py-2.5 font-heading text-sm font-bold text-[#2D1B69] shadow-md transition hover:scale-105 hover:shadow-lg"
        style={{ border: "2px solid rgba(45, 27, 105, 0.06)" }}
      >
        🔄 Yeniden Başlat
      </button>
    </div>
  );
}
