"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { playPopSound, playCorrectSound, playWrongSound, playCardOpenSound, playCelebrationSound } from "@/lib/sounds";
import type { GameStats } from "@/types/game";
import ThemedBackground from "@/components/ThemedBackground";

export interface BalloonPopProps {
  options: { id: string; text?: string; imageUrl?: string; isCorrect?: boolean }[];
  title: string; // instruction/question
  theme: {
    backgroundColor: string;
    cardColors: string[];
    decorEmojis: string[];
    celebrationText: string;
    emoji: string;
  };
  showFeedback?: boolean;
  displayMode?: "pop" | "read";
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

export default function BalloonPop({ options, title, theme, showFeedback = true, displayMode = "pop", onComplete }: BalloonPopProps) {
  const isReadMode = displayMode === "read";
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

  // Dynamic balloon size based on option count
  const balloonSize = useMemo(() => {
    const count = options.length;
    if (count <= 2) return { width: 140, height: 175, fontSize: 18, fontSizeSmall: 14, truncate: 16, imgSize: "h-14 w-14" };
    if (count <= 4) return { width: 120, height: 150, fontSize: 16, fontSizeSmall: 12, truncate: 14, imgSize: "h-12 w-12" };
    if (count <= 6) return { width: 100, height: 125, fontSize: 14, fontSizeSmall: 11, truncate: 13, imgSize: "h-11 w-11" };
    if (count <= 8) return { width: 90, height: 112, fontSize: 13, fontSizeSmall: 10, truncate: 12, imgSize: "h-10 w-10" };
    return { width: 70, height: 88, fontSize: 10, fontSizeSmall: 8, truncate: 11, imgSize: "h-8 w-8" };
  }, [options.length]);

  const balloons = useMemo(() => {
    const count = options.length;
    const cols = count <= 2 ? 2 : count <= 4 ? 2 : count <= 6 ? 3 : Math.min(count, 4);
    const rowGap = count <= 4 ? 40 : count <= 6 ? 32 : 28;
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
          y: 15 + Math.floor(i / cols) * rowGap + rng.yOffset,
          delay: i * 0.15,
          floatRange: rng.floatRange,
        };
      })
    );
  }, [options, theme.cardColors]);

  const [popped, setPopped] = useState<Set<string>>(new Set());
  const [popEffects, setPopEffects] = useState<{ id: string; x: number; y: number; correct: boolean }[]>([]);
  const [score, setScore] = useState({ correct: 0, wrong: 0 });
  const [revealedBalloon, setRevealedBalloon] = useState<BalloonData | null>(null);
  const [showReadComplete, setShowReadComplete] = useState(false);
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

      if (isReadMode) {
        setRevealedBalloon(balloon);
        playCardOpenSound();
      } else {
        if (balloon.isCorrect) {
          if (showFeedback) playCorrectSound();
          setScore((s) => {
            const next = { ...s, correct: s.correct + 1 };
            scoreRef.current = next;
            return next;
          });
        } else {
          if (showFeedback) playWrongSound();
          setScore((s) => {
            const next = { ...s, wrong: s.wrong + 1 };
            scoreRef.current = next;
            return next;
          });
        }
      }

      setTimeout(() => {
        setPopEffects((prev) => prev.filter((e) => e.id !== balloon.id));
      }, 1000);
    },
    [popped, isReadMode, showFeedback]
  );

  useEffect(() => {
    if (isReadMode) {
      if (popped.size === balloons.length && !revealedBalloon && !hasCompletedRef.current) {
        hasCompletedRef.current = true;
        playCelebrationSound();
        setShowReadComplete(true);
      }
    } else {
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
    }
  }, [score.correct, correctCount, onComplete, options.length, isReadMode, popped.size, balloons.length, revealedBalloon]);

  const resetGame = () => {
    setPopped(new Set());
    setPopEffects([]);
    setScore({ correct: 0, wrong: 0 });
    scoreRef.current = { correct: 0, wrong: 0 };
    hasCompletedRef.current = false;
    startTime.current = Date.now();
    setRevealedBalloon(null);
    setShowReadComplete(false);
  };

  return (
    <div className="relative flex flex-col items-center gap-4 px-3 py-6 md:px-6" style={{ backgroundColor: theme.backgroundColor }}>
      <ThemedBackground decorEmojis={theme.decorEmojis} backgroundColor={theme.backgroundColor} />
      {/* Score */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 rounded-2xl bg-white px-4 py-2 shadow-sm" style={{ border: "2px solid rgba(45, 27, 105, 0.06)" }}>
          <span className="text-lg">🎈</span>
          <span className="font-heading text-lg font-bold text-[#2D1B69]">{popped.size}</span>
          <span className="text-xs font-bold text-[#8B7BAD]">/ {options.length}</span>
        </div>
        {!isReadMode && showFeedback && score.wrong > 0 && (
          <div className="flex items-center gap-2 rounded-2xl bg-white px-4 py-2 shadow-sm" style={{ border: "2px solid rgba(45, 27, 105, 0.06)" }}>
            <span className="text-lg">💨</span>
            <span className="font-heading text-lg font-bold text-rose-500">{score.wrong}</span>
          </div>
        )}
      </div>

      {/* Question / Instruction */}
      {!isReadMode && (
        <motion.div
          className="w-full max-w-lg rounded-2xl bg-white px-5 py-3 text-center shadow-md"
          style={{ border: "2px solid rgba(45, 27, 105, 0.06)" }}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="font-heading text-base font-bold text-[#2D1B69] sm:text-lg">{title}</p>
          <p className="mt-1 text-xs font-bold text-[#8B7BAD]">Doğru balonları patlat! 🎯</p>
        </motion.div>
      )}

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
              {isReadMode ? "💥" : showFeedback ? (effect.correct ? "✅" : "❌") : "💥"}
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
                <svg width={balloonSize.width} height={balloonSize.height} viewBox="0 0 100 110" className="drop-shadow-lg">
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
                  {!isReadMode && balloon.text && (
                    <text
                      x="50"
                      y="48"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="white"
                      fontSize={balloon.text.length > 8 ? balloonSize.fontSizeSmall : balloonSize.fontSize}
                      fontWeight="800"
                      fontFamily="'Nunito', sans-serif"
                      style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.3))" }}
                    >
                      {balloon.text.length > balloonSize.truncate
                        ? balloon.text.slice(0, balloonSize.truncate - 1) + "…"
                        : balloon.text}
                    </text>
                  )}
                </svg>
                {/* Image below balloon if provided */}
                {!isReadMode && balloon.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={balloon.imageUrl}
                    alt=""
                    className={`-mt-4 rounded-full border-2 border-white object-cover shadow-md ${balloonSize.imgSize}`}
                  />
                )}
              </motion.button>
            ))}
        </AnimatePresence>

        {/* Read mode confetti */}
        {isReadMode && showReadComplete && (
          <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
            {theme.decorEmojis.slice(0, 6).map((emoji, i) => (
              <motion.div
                key={`confetti-${i}`}
                className="absolute text-2xl"
                style={{ left: `${10 + i * 15}%` }}
                initial={{ y: -40, opacity: 1, rotate: 0 }}
                animate={{
                  y: ["-10%", "110%"],
                  rotate: [0, 360],
                  opacity: [1, 1, 0],
                }}
                transition={{
                  duration: 2.5 + i * 0.3,
                  delay: i * 0.2,
                  repeat: Infinity,
                  repeatDelay: 1,
                  ease: "easeIn",
                }}
              >
                {emoji}
              </motion.div>
            ))}
          </div>
        )}

        {/* All popped — completion */}
        {isReadMode ? (
          // Read mode: celebration with replay button
          showReadComplete && (
            <motion.div
              className="absolute inset-0 z-30 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="rounded-3xl bg-white/90 px-8 py-6 text-center shadow-xl backdrop-blur-sm">
                <motion.div
                  className="mb-3 text-5xl"
                  animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 2 }}
                >
                  🎉
                </motion.div>
                <p className="font-heading text-xl font-bold text-[#2D1B69]">
                  {theme.celebrationText}
                </p>
                <p className="mt-1 text-sm font-bold text-[#8B7BAD]">
                  {options.length} seçenek okundu!
                </p>
                <button
                  type="button"
                  onClick={resetGame}
                  className="mt-4 rounded-2xl px-6 py-2.5 font-heading text-sm font-bold text-white shadow-md transition hover:scale-105 hover:shadow-lg"
                  style={{ background: "linear-gradient(135deg, #FF6B9D, #FF8A50)" }}
                >
                  🔄 Tekrar Oyna
                </button>
              </div>
            </motion.div>
          )
        ) : (
          // Pop mode: existing completion
          popped.size === balloons.length && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="rounded-3xl bg-white/90 px-8 py-6 text-center shadow-xl backdrop-blur-sm">
                <div className="mb-2 text-4xl">{!showFeedback || score.wrong === 0 ? "🏆" : "🎈"}</div>
                <p className="font-heading text-lg font-bold text-[#2D1B69]">
                  {!showFeedback ? "Tebrikler!" : score.wrong === 0 ? "Mükemmel!" : "Tamamlandı!"}
                </p>
                {showFeedback && (
                  <p className="text-sm font-bold text-[#8B7BAD]">
                    {score.correct} doğru, {score.wrong} yanlış
                  </p>
                )}
              </div>
            </motion.div>
          )
        )}
      </div>

      {/* Read Mode: Revealed Card Modal */}
      <AnimatePresence>
        {isReadMode && revealedBalloon && (
          <motion.div
            key="read-modal-overlay"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setRevealedBalloon(null)}
          >
            <motion.div
              key="read-modal-card"
              className="mx-4 flex max-w-sm flex-col items-center gap-4 rounded-3xl p-8 shadow-2xl"
              style={{
                backgroundColor: revealedBalloon.color,
                border: "4px solid rgba(255,255,255,0.3)",
              }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              onClick={() => setRevealedBalloon(null)}
            >
              {revealedBalloon.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={revealedBalloon.imageUrl}
                  alt=""
                  className="h-32 w-32 rounded-2xl border-4 border-white/30 object-cover shadow-lg"
                />
              )}
              {revealedBalloon.text && (
                <p
                  className="text-center font-heading text-3xl font-bold text-white sm:text-4xl"
                  style={{ textShadow: "0 2px 4px rgba(0,0,0,0.2)" }}
                >
                  {revealedBalloon.text}
                </p>
              )}
              <p className="mt-2 text-sm font-semibold text-white/70">
                Devam etmek için dokunun
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
