"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { playCorrectSound, playWrongSound, playCelebrationSound } from "@/lib/sounds";
import type { GameStats, WrongItem } from "@/types/game";
import ThemedBackground from "@/components/ThemedBackground";

interface OddOption {
  id: string;
  text?: string;
  imageUrl?: string;
  isCorrect?: boolean; // farklı olan
}

export interface OddOneOutProps {
  options: OddOption[];
  title?: string;
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

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function OddOneOut({ options, title, theme, showFeedback = true, onComplete }: OddOneOutProps) {
  const startTime = useRef(Date.now());
  const hasCompleted = useRef(false);
  const wrongRef = useRef(0);
  const wrongItemsRef = useRef<WrongItem[]>([]);

  const items = useMemo(() => shuffle(options), [options]);
  const oddOption = useMemo(() => options.find((o) => o.isCorrect), [options]);

  const [wrongPick, setWrongPick] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);

  const finish = useCallback(
    (correct: boolean) => {
      if (hasCompleted.current) return;
      hasCompleted.current = true;
      playCelebrationSound();
      const stats: GameStats = {
        totalItems: 1,
        correctCount: correct ? 1 : 0,
        wrongCount: wrongRef.current + (correct ? 0 : 1),
        timeSeconds: Math.round((Date.now() - startTime.current) / 1000),
        completedAt: new Date().toISOString(),
        wrongItems: wrongItemsRef.current,
      };
      setTimeout(() => onComplete(stats), 900);
    },
    [onComplete]
  );

  const handlePick = useCallback(
    (item: OddOption) => {
      if (answered) return;
      const correct = item.isCorrect === true;

      if (!showFeedback) {
        setPicked(item.id);
        setAnswered(true);
        if (!correct) {
          wrongItemsRef.current.push({
            text: oddOption?.text || "Farklı öğe",
            correctAnswer: oddOption?.text || "Farklı olan",
            userAnswer: item.text || "Seçim",
          });
        }
        finish(correct);
        return;
      }

      if (correct) {
        playCorrectSound();
        setPicked(item.id);
        setAnswered(true);
        finish(true);
      } else {
        playWrongSound();
        wrongRef.current += 1;
        wrongItemsRef.current.push({
          text: oddOption?.text || "Farklı öğe",
          correctAnswer: oddOption?.text || "Farklı olan",
          userAnswer: item.text || "Seçim",
        });
        setWrongPick(item.id);
        setTimeout(() => setWrongPick(null), 600);
      }
    },
    [answered, showFeedback, oddOption, finish]
  );

  const resetGame = () => {
    setWrongPick(null);
    setAnswered(false);
    setPicked(null);
    wrongRef.current = 0;
    wrongItemsRef.current = [];
    startTime.current = Date.now();
    hasCompleted.current = false;
  };

  const cols = items.length <= 4 ? "grid-cols-2" : items.length <= 6 ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-3 sm:grid-cols-4";

  return (
    <div className="relative flex flex-col items-center gap-6 px-3 py-8 md:px-6" style={{ backgroundColor: theme.backgroundColor }}>
      <ThemedBackground decorEmojis={theme.decorEmojis} backgroundColor={theme.backgroundColor} />

      {/* Yönerge */}
      <motion.div
        className="z-10 w-full max-w-lg rounded-2xl bg-white px-5 py-3 text-center shadow-md"
        style={{ border: "2px solid rgba(45, 27, 105, 0.06)" }}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <p className="font-heading text-base font-bold text-[#2D1B69] sm:text-lg">{title || "Hangisi farklı?"}</p>
        <p className="mt-1 text-xs font-bold text-[#8B7BAD]">Gruba ait olmayanı bul ve dokun 🔍</p>
      </motion.div>

      {/* Öğeler */}
      <div className={`z-10 grid w-full max-w-2xl gap-3 sm:gap-4 ${cols}`}>
        {items.map((item, idx) => {
          const color = theme.cardColors[idx % theme.cardColors.length];
          const isWrong = wrongPick === item.id;
          const isPickedRight = showFeedback && answered && item.isCorrect;
          const isPickedNoFb = !showFeedback && picked === item.id;
          return (
            <motion.button
              key={item.id}
              type="button"
              onClick={() => handlePick(item)}
              disabled={answered}
              className="flex aspect-square flex-col items-center justify-center gap-2 rounded-3xl bg-white p-3 shadow-md disabled:cursor-default"
              style={{
                border: isPickedRight
                  ? "4px solid #22c55e"
                  : isWrong
                    ? "4px solid #ef4444"
                    : isPickedNoFb
                      ? "4px solid #6366f1"
                      : `3px solid ${color}40`,
                background: isPickedRight ? "#f0fdf4" : isWrong ? "#fef2f2" : isPickedNoFb ? "#eef2ff" : "white",
                opacity: answered && showFeedback && !item.isCorrect ? 0.45 : 1,
              }}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1, x: isWrong ? [0, -8, 8, -6, 6, 0] : 0 }}
              transition={{ delay: idx * 0.05 }}
              whileHover={!answered ? { scale: 1.05 } : undefined}
              whileTap={!answered ? { scale: 0.95 } : undefined}
            >
              {item.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.imageUrl} alt="" className="h-16 w-16 rounded-xl object-cover sm:h-24 sm:w-24" />
              )}
              {item.text && (
                <span className="text-center font-heading text-sm font-bold text-[#2D1B69] sm:text-base">{item.text}</span>
              )}
              {isPickedRight && <span className="text-xl">✅</span>}
            </motion.button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={resetGame}
        className="z-10 rounded-2xl bg-white px-6 py-2.5 font-heading text-sm font-bold text-[#2D1B69] shadow-md transition hover:scale-105 hover:shadow-lg"
        style={{ border: "2px solid rgba(45, 27, 105, 0.06)" }}
      >
        🔄 Yeniden Başlat
      </button>
    </div>
  );
}
