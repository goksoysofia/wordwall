"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { playCorrectSound, playWrongSound } from "@/lib/sounds";
import type { GameStats } from "@/types/game";

export interface MissingWordProps {
  options: { id: string; text?: string; isCorrect?: boolean }[];
  title: string; // sentence with ___ as blank
  theme: {
    backgroundColor: string;
    cardColors: string[];
    celebrationText: string;
    emoji: string;
  };
  onComplete: (stats: GameStats) => void;
}

export default function MissingWord({ options, title, theme, onComplete }: MissingWordProps) {
  const startTime = useRef(Date.now());
  const wrongCountRef = useRef(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const correctOption = options.find((o) => o.isCorrect);
  const blankDisplay = selected
    ? options.find((o) => o.id === selected)?.text || "___"
    : "___";

  // Split sentence around the blank marker
  const parts = title.split("___");
  const hasBlanks = parts.length > 1;

  const handleSelect = useCallback(
    (optionId: string) => {
      if (answered) return;
      setSelected(optionId);
    },
    [answered]
  );

  const handleConfirm = useCallback(() => {
    if (!selected || answered) return;
    setAnswered(true);
    const option = options.find((o) => o.id === selected);
    const correct = option?.isCorrect === true;
    setIsCorrect(correct);

    if (correct) {
      playCorrectSound();
    } else {
      playWrongSound();
      wrongCountRef.current += 1;
    }
  }, [selected, answered, options]);

  useEffect(() => {
    if (answered && isCorrect) {
      const stats: GameStats = {
        totalItems: options.length,
        correctCount: 1,
        wrongCount: wrongCountRef.current,
        timeSeconds: Math.round((Date.now() - startTime.current) / 1000),
        completedAt: new Date().toISOString(),
      };
      const t = setTimeout(() => onComplete(stats), 1500);
      return () => clearTimeout(t);
    }
  }, [answered, isCorrect, onComplete, options.length]);

  const resetGame = () => {
    setSelected(null);
    setAnswered(false);
    setIsCorrect(false);
  };

  return (
    <div className="flex flex-col items-center gap-8 px-3 py-8 md:px-6" style={{ backgroundColor: theme.backgroundColor }}>
      {/* Sentence Card */}
      <motion.div
        className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-xl sm:p-8"
        style={{ border: "3px solid rgba(45, 27, 105, 0.08)" }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="mb-3 text-center text-xs font-bold uppercase tracking-wider text-[#8B7BAD]">
          Boşluğu Doldur ✏️
        </div>
        <p className="text-center font-heading text-xl font-bold leading-relaxed text-[#2D1B69] sm:text-2xl">
          {hasBlanks ? (
            <>
              {parts[0]}
              <span
                className={`mx-1 inline-block min-w-[80px] rounded-xl px-3 py-1 text-center transition-all duration-300 ${
                  answered
                    ? isCorrect
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-rose-100 text-rose-700"
                    : selected
                      ? "bg-indigo-100 text-indigo-700"
                      : "bg-[#F8F5FF] text-[#8B7BAD]"
                }`}
                style={{
                  border: answered
                    ? isCorrect
                      ? "2px solid #22c55e"
                      : "2px solid #ef4444"
                    : selected
                      ? "2px dashed #6366f1"
                      : "2px dashed #C5B8DB",
                }}
              >
                {blankDisplay}
              </span>
              {parts.slice(1).join("___")}
            </>
          ) : (
            title
          )}
        </p>
      </motion.div>

      {/* Word Options */}
      <div className="flex w-full max-w-lg flex-wrap justify-center gap-3">
        {options.map((opt, idx) => {
          const color = theme.cardColors[idx % theme.cardColors.length];
          const isSelected = selected === opt.id;
          const isWrong = answered && isSelected && !isCorrect;
          const isRight = answered && opt.isCorrect;

          return (
            <motion.button
              key={opt.id}
              type="button"
              onClick={() => handleSelect(opt.id)}
              disabled={answered}
              className="rounded-2xl px-5 py-3 font-heading text-base font-bold transition-all duration-200 disabled:cursor-default"
              style={{
                border: isRight
                  ? "3px solid #22c55e"
                  : isWrong
                    ? "3px solid #ef4444"
                    : isSelected
                      ? `3px solid ${color}`
                      : "3px solid rgba(45, 27, 105, 0.08)",
                background: isRight
                  ? "#f0fdf4"
                  : isWrong
                    ? "#fef2f2"
                    : isSelected
                      ? `${color}15`
                      : "white",
                color: "#2D1B69",
              }}
              initial={{ opacity: 0, y: 10 }}
              animate={{
                opacity: answered && !opt.isCorrect && opt.id !== selected ? 0.4 : 1,
                y: 0,
                scale: isWrong ? [1, 1.05, 0.95, 1] : 1,
              }}
              transition={{ delay: idx * 0.06 }}
              whileHover={!answered ? { scale: 1.05, background: `${color}20` } : undefined}
              whileTap={!answered ? { scale: 0.95 } : undefined}
            >
              {opt.text}
              {isRight && answered && " ✓"}
            </motion.button>
          );
        })}
      </div>

      {/* Confirm Button */}
      {selected && !answered && (
        <motion.button
          type="button"
          onClick={handleConfirm}
          className="btn-candy btn-green rounded-2xl px-10 py-3.5 text-lg"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Kontrol Et ✓
        </motion.button>
      )}

      {/* Feedback */}
      {answered && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`rounded-2xl px-6 py-3 text-center font-heading text-base font-bold shadow-md ${
            isCorrect ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
          }`}
        >
          {isCorrect
            ? `Doğru! "${correctOption?.text}" 🎉`
            : `Yanlış! Doğru cevap: "${correctOption?.text}" 💪`}
        </motion.div>
      )}

      {/* Retry */}
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
