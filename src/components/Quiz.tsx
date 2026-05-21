"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { playCorrectSound, playWrongSound } from "@/lib/sounds";
import type { GameStats, WrongItem } from "@/types/game";
import ThemedBackground from "@/components/ThemedBackground";

export interface QuizProps {
  options: { id: string; text?: string; imageUrl?: string; isCorrect?: boolean }[];
  title: string;
  theme: {
    backgroundColor: string;
    cardColors: string[];
    decorEmojis: string[];
    celebrationText: string;
    emoji: string;
  };
  showFeedback?: boolean;
  onComplete: (stats: GameStats) => void;
}

export default function Quiz({ options, title, theme, showFeedback = true, onComplete }: QuizProps) {
  const startTime = useRef(Date.now());
  const scoreRef = useRef({ correct: 0, wrong: 0, total: 0 });
  const hasCompletedRef = useRef(false);
  const wrongItemsRef = useRef<WrongItem[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState({ correct: 0, wrong: 0, total: 0 });
  const [attempts, setAttempts] = useState(0);

  const handleAnswer = useCallback(
    (optionId: string) => {
      if (answered) return;
      setSelected(optionId);
      setAnswered(true);

      const option = options.find((o) => o.id === optionId);
      const correct = option?.isCorrect === true;
      setIsCorrect(correct);

      if (correct) {
        if (showFeedback) playCorrectSound();
        scoreRef.current = { ...scoreRef.current, correct: scoreRef.current.correct + 1, total: scoreRef.current.total + 1 };
        setScore({ ...scoreRef.current });
      } else {
        if (showFeedback) playWrongSound();
        scoreRef.current = { ...scoreRef.current, wrong: scoreRef.current.wrong + 1, total: scoreRef.current.total + 1 };
        setScore({ ...scoreRef.current });
        setAttempts((a) => a + 1);

        const selectedText = option?.text || '';
        const correctOpt = options.find((o) => o.isCorrect);
        wrongItemsRef.current.push({
          text: title,
          correctAnswer: correctOpt?.text || '',
          userAnswer: selectedText
        });
      }
    },
    [answered, options, showFeedback]
  );

  useEffect(() => {
    if (!answered || hasCompletedRef.current) return;

    const shouldComplete = showFeedback
      ? isCorrect || attempts >= 3
      : true; // no feedback → always complete after first answer
    if (!shouldComplete) return;

    hasCompletedRef.current = true;
    const stats: GameStats = {
      totalItems: 1,
      correctCount: scoreRef.current.correct,
      wrongCount: scoreRef.current.wrong,
      timeSeconds: Math.round((Date.now() - startTime.current) / 1000),
      completedAt: new Date().toISOString(),
      wrongItems: wrongItemsRef.current,
    };
    const t = setTimeout(() => onComplete(stats), 1500);
    return () => clearTimeout(t);
  }, [answered, isCorrect, attempts, onComplete, showFeedback]);

  const getOptionStyle = (opt: { id: string; isCorrect?: boolean }) => {
    if (!answered) {
      return {
        border: "3px solid rgba(45, 27, 105, 0.08)",
        background: "white",
      };
    }
    if (!showFeedback) {
      // No feedback: just dim non-selected, highlight selected neutrally
      if (opt.id === selected) {
        return { border: "3px solid #6366f1", background: "#eef2ff" };
      }
      return {
        border: "3px solid rgba(45, 27, 105, 0.06)",
        background: "rgba(255,255,255,0.5)",
        opacity: 0.5,
      };
    }
    if (opt.id === selected) {
      return isCorrect
        ? { border: "3px solid #22c55e", background: "#f0fdf4" }
        : { border: "3px solid #ef4444", background: "#fef2f2" };
    }
    if (opt.isCorrect && !isCorrect) {
      return { border: "3px solid #22c55e", background: "#f0fdf4" };
    }
    return {
      border: "3px solid rgba(45, 27, 105, 0.06)",
      background: "rgba(255,255,255,0.5)",
      opacity: 0.5,
    };
  };

  const resetGame = () => {
    setSelected(null);
    setAnswered(false);
    setIsCorrect(false);
    setScore({ correct: 0, wrong: 0, total: 0 });
    wrongItemsRef.current = [];
    startTime.current = Date.now();
  };

  return (
    <div className="relative flex flex-col items-center gap-6 px-3 py-8 md:px-6" style={{ backgroundColor: theme.backgroundColor }}>
      <ThemedBackground decorEmojis={theme.decorEmojis} backgroundColor={theme.backgroundColor} />
      {/* Question Card */}
      <motion.div
        className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-xl sm:p-8"
        style={{ border: "3px solid rgba(45, 27, 105, 0.08)" }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="mb-2 text-center text-xs font-bold uppercase tracking-wider text-[#8B7BAD]">
          Soru {theme.emoji}
        </div>
        <h2 className="text-center font-heading text-xl font-bold text-[#2D1B69] sm:text-2xl">
          {title}
        </h2>
      </motion.div>

      {/* Options */}
      {(() => {
        const hasImages = options.some((o) => o.imageUrl);
        return (
          <div className={`grid w-full gap-3 ${
            hasImages
              ? "max-w-2xl grid-cols-2"
              : "max-w-lg grid-cols-1"
          }`}>
            {options.map((opt, idx) => {
              const color = theme.cardColors[idx % theme.cardColors.length];
              return (
                <motion.button
                  key={opt.id}
                  type="button"
                  onClick={() => handleAnswer(opt.id)}
                  disabled={answered}
                  className={`relative overflow-hidden rounded-2xl transition-all duration-200 disabled:cursor-default ${
                    hasImages
                      ? "flex flex-col items-center gap-2 p-3 sm:p-4"
                      : "flex min-h-[64px] items-center gap-4 px-5 py-4 text-left"
                  }`}
                  style={getOptionStyle(opt)}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{
                    opacity: 1,
                    x: 0,
                    scale: showFeedback && answered && opt.id === selected && !isCorrect ? [1, 1.02, 0.98, 1] : 1,
                  }}
                  transition={{ delay: idx * 0.08 }}
                  whileHover={!answered ? { scale: 1.02, borderColor: color } : undefined}
                  whileTap={!answered ? { scale: 0.98 } : undefined}
                >
                  {/* Letter badge */}
                  <div
                    className={`flex shrink-0 items-center justify-center rounded-xl font-heading font-bold text-white ${
                      hasImages
                        ? "absolute left-2 top-2 h-8 w-8 text-sm sm:h-9 sm:w-9"
                        : "h-10 w-10 text-base"
                    }`}
                    style={{ background: showFeedback && answered && opt.isCorrect ? "#22c55e" : color }}
                  >
                    {showFeedback && answered && opt.id === selected
                      ? (isCorrect ? "✓" : "✗")
                      : String.fromCharCode(65 + idx)}
                  </div>
                  {opt.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={opt.imageUrl}
                      alt=""
                      className={`rounded-xl object-cover ${
                        hasImages ? "aspect-square w-full" : "h-14 w-14"
                      }`}
                    />
                  )}
                  {opt.text && (
                    <span className={`font-heading font-bold text-[#2D1B69] ${
                      hasImages ? "text-center text-sm sm:text-base" : "text-base"
                    }`}>
                      {opt.text}
                    </span>
                  )}
                </motion.button>
              );
            })}
          </div>
        );
      })()}

      {/* Feedback */}
      {showFeedback && answered && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`rounded-2xl px-6 py-3 text-center font-heading text-base font-bold shadow-md ${
            isCorrect
              ? "bg-emerald-100 text-emerald-700"
              : "bg-rose-100 text-rose-700"
          }`}
        >
          {isCorrect ? "Doğru! Harikasın! 🎉" : attempts >= 3 ? "Yanlış! Doğru cevap gösterildi." : "Yanlış! Tekrar dene 💪"}
        </motion.div>
      )}

      {/* No-feedback: neutral "selected" message */}
      {!showFeedback && answered && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-2xl bg-indigo-100 px-6 py-3 text-center font-heading text-base font-bold text-indigo-700 shadow-md"
        >
          Cevabın kaydedildi! ✨
        </motion.div>
      )}

      {/* Retry / Reset — only when feedback is on */}
      {showFeedback && answered && !isCorrect && attempts < 3 && (
        <button
          type="button"
          onClick={resetGame}
          className="btn-candy rounded-2xl px-8 py-3 text-base"
        >
          Tekrar Dene 🔄
        </button>
      )}
    </div>
  );
}
