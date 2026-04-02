"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { playCorrectSound, playWrongSound } from "@/lib/sounds";
import type { GameStats } from "@/types/game";

export interface QuizProps {
  options: { id: string; text?: string; imageUrl?: string; isCorrect?: boolean }[];
  title: string;
  theme: {
    backgroundColor: string;
    cardColors: string[];
    celebrationText: string;
    emoji: string;
  };
  onComplete: (stats: GameStats) => void;
}

export default function Quiz({ options, title, theme, onComplete }: QuizProps) {
  const startTime = useRef(Date.now());
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState({ correct: 0, wrong: 0, total: 0 });

  // For multi-question support, track current question index
  // In current data model, one activity = one question
  // title = question, options = answers

  const handleAnswer = useCallback(
    (optionId: string) => {
      if (answered) return;
      setSelected(optionId);
      setAnswered(true);

      const option = options.find((o) => o.id === optionId);
      const correct = option?.isCorrect === true;
      setIsCorrect(correct);

      if (correct) {
        playCorrectSound();
        setScore((s) => ({ ...s, correct: s.correct + 1, total: s.total + 1 }));
      } else {
        playWrongSound();
        setScore((s) => ({ ...s, wrong: s.wrong + 1, total: s.total + 1 }));
      }
    },
    [answered, options]
  );

  useEffect(() => {
    if (answered && isCorrect) {
      const stats: GameStats = {
        totalItems: options.length,
        correctCount: score.correct,
        wrongCount: score.wrong,
        timeSeconds: Math.round((Date.now() - startTime.current) / 1000),
        completedAt: new Date().toISOString(),
      };
      const t = setTimeout(() => onComplete(stats), 1500);
      return () => clearTimeout(t);
    }
  }, [answered, isCorrect, onComplete, options.length, score]);

  const getOptionStyle = (opt: { id: string; isCorrect?: boolean }) => {
    if (!answered) {
      return {
        border: "3px solid rgba(45, 27, 105, 0.08)",
        background: "white",
      };
    }
    if (opt.id === selected) {
      return isCorrect
        ? { border: "3px solid #22c55e", background: "#f0fdf4" }
        : { border: "3px solid #ef4444", background: "#fef2f2" };
    }
    if (opt.isCorrect && !isCorrect) {
      // Show correct answer when user picked wrong
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
  };

  return (
    <div className="flex flex-col items-center gap-6 px-3 py-8 md:px-6" style={{ backgroundColor: theme.backgroundColor }}>
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
      <div className="grid w-full max-w-lg gap-3">
        {options.map((opt, idx) => {
          const color = theme.cardColors[idx % theme.cardColors.length];
          return (
            <motion.button
              key={opt.id}
              type="button"
              onClick={() => handleAnswer(opt.id)}
              disabled={answered}
              className="flex min-h-[64px] items-center gap-4 rounded-2xl px-5 py-4 text-left transition-all duration-200 disabled:cursor-default"
              style={getOptionStyle(opt)}
              initial={{ opacity: 0, x: -20 }}
              animate={{
                opacity: 1,
                x: 0,
                scale: answered && opt.id === selected && !isCorrect ? [1, 1.02, 0.98, 1] : 1,
              }}
              transition={{ delay: idx * 0.08 }}
              whileHover={!answered ? { scale: 1.02, borderColor: color } : undefined}
              whileTap={!answered ? { scale: 0.98 } : undefined}
            >
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-heading text-base font-bold text-white"
                style={{ background: answered && opt.isCorrect ? "#22c55e" : color }}
              >
                {answered && opt.id === selected ? (isCorrect ? "✓" : "✗") : String.fromCharCode(65 + idx)}
              </div>
              {opt.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={opt.imageUrl} alt="" className="h-14 w-14 rounded-xl object-cover" />
              )}
              {opt.text && (
                <span className="font-heading text-base font-bold text-[#2D1B69]">{opt.text}</span>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Feedback */}
      {answered && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`rounded-2xl px-6 py-3 text-center font-heading text-base font-bold shadow-md ${
            isCorrect
              ? "bg-emerald-100 text-emerald-700"
              : "bg-rose-100 text-rose-700"
          }`}
        >
          {isCorrect ? "Doğru! Harikasın! 🎉" : "Yanlış! Tekrar dene 💪"}
        </motion.div>
      )}

      {/* Retry / Reset */}
      {answered && !isCorrect && (
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
