"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { playCorrectSound, playWrongSound, playCelebrationSound, playCardOpenSound } from "@/lib/sounds";
import { speak, isSpeechSupported, primeVoices } from "@/lib/speech";
import type { GameStats, WrongItem } from "@/types/game";
import ThemedBackground from "@/components/ThemedBackground";

interface TFOption {
  id: string;
  text?: string;
  imageUrl?: string;
  isCorrect?: boolean; // ifade doğru mu?
}

export interface TrueFalseProps {
  options: TFOption[];
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

export default function TrueFalse({ options, title, theme, showFeedback = true, onComplete }: TrueFalseProps) {
  const startTime = useRef(Date.now());
  const hasCompleted = useRef(false);
  const correctRef = useRef(0);
  const wrongRef = useRef(0);
  const wrongItemsRef = useRef<WrongItem[]>([]);

  const deck = useMemo(() => shuffle(options.filter((o) => o.text || o.imageUrl)), [options]);
  const total = deck.length;

  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState<boolean | null>(null);
  const current = deck[index];

  const tts = isSpeechSupported();
  useEffect(() => { primeVoices(); }, []);

  const handleAnswer = useCallback(
    (value: boolean) => {
      if (answer !== null || !current) return;
      const truth = current.isCorrect === true;
      const userCorrect = value === truth;
      setAnswer(value);

      if (userCorrect) {
        correctRef.current += 1;
        if (showFeedback) playCorrectSound();
        else playCardOpenSound();
      } else {
        wrongRef.current += 1;
        wrongItemsRef.current.push({
          text: current.text || "İfade",
          correctAnswer: truth ? "Doğru" : "Yanlış",
          userAnswer: value ? "Doğru" : "Yanlış",
        });
        if (showFeedback) playWrongSound();
        else playCardOpenSound();
      }

      const delay = showFeedback ? 1100 : 450;
      setTimeout(() => {
        if (index + 1 >= total) {
          if (hasCompleted.current) return;
          hasCompleted.current = true;
          playCelebrationSound();
          const stats: GameStats = {
            totalItems: total,
            correctCount: correctRef.current,
            wrongCount: wrongRef.current,
            timeSeconds: Math.round((Date.now() - startTime.current) / 1000),
            completedAt: new Date().toISOString(),
            wrongItems: wrongItemsRef.current,
          };
          setTimeout(() => onComplete(stats), 600);
        } else {
          setIndex((i) => i + 1);
          setAnswer(null);
        }
      }, delay);
    },
    [answer, current, showFeedback, index, total, onComplete]
  );

  const resetGame = () => {
    setIndex(0);
    setAnswer(null);
    correctRef.current = 0;
    wrongRef.current = 0;
    wrongItemsRef.current = [];
    startTime.current = Date.now();
    hasCompleted.current = false;
  };

  if (!current) return null;

  const truth = current.isCorrect === true;
  const userCorrect = answer !== null && answer === truth;

  return (
    <div className="relative flex flex-col items-center gap-6 px-3 py-8 md:px-6" style={{ backgroundColor: theme.backgroundColor }}>
      <ThemedBackground decorEmojis={theme.decorEmojis} backgroundColor={theme.backgroundColor} />

      {/* İlerleme */}
      <div className="z-10 flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-2xl bg-white px-4 py-2 shadow-sm" style={{ border: "2px solid rgba(45, 27, 105, 0.06)" }}>
          <span className="text-lg">⚖️</span>
          <span className="font-heading text-lg font-bold text-[#2D1B69]">{index + 1}</span>
          <span className="text-xs font-bold text-[#8B7BAD]">/ {total}</span>
        </div>
        {showFeedback && (
          <div className="flex items-center gap-2 rounded-2xl bg-white px-4 py-2 shadow-sm" style={{ border: "2px solid rgba(45, 27, 105, 0.06)" }}>
            <span className="text-lg">⭐</span>
            <span className="font-heading text-lg font-bold text-emerald-500">{correctRef.current}</span>
          </div>
        )}
      </div>

      {title && (
        <p className="z-10 max-w-lg text-center text-xs font-bold uppercase tracking-wider text-[#8B7BAD]">{title}</p>
      )}

      {/* İfade kartı */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          className="z-10 flex w-full max-w-lg flex-col items-center gap-4 rounded-3xl bg-white p-6 shadow-xl sm:p-8"
          style={{
            border:
              answer !== null && showFeedback
                ? userCorrect
                  ? "4px solid #22c55e"
                  : "4px solid #ef4444"
                : "3px solid rgba(45, 27, 105, 0.08)",
          }}
          initial={{ opacity: 0, x: 40, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: -40, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 220, damping: 24 }}
        >
          {current.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={current.imageUrl} alt="" className="h-36 w-44 rounded-2xl object-cover shadow-md sm:h-44 sm:w-56" />
          )}
          {current.text && (
            <p className="text-center font-heading text-xl font-bold leading-relaxed text-[#2D1B69] sm:text-2xl">{current.text}</p>
          )}
          {tts && current.text && (
            <button
              type="button"
              onClick={() => speak(current.text!)}
              className="flex items-center gap-2 rounded-full bg-[#F8F5FF] px-4 py-1.5 text-sm font-bold text-[#8B7BAD] transition hover:scale-105"
            >
              🔊 Dinle
            </button>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Doğru / Yanlış butonları */}
      <div className="z-10 flex w-full max-w-lg gap-3 sm:gap-4">
        <motion.button
          type="button"
          onClick={() => handleAnswer(true)}
          disabled={answer !== null}
          className="flex flex-1 items-center justify-center gap-2 rounded-3xl py-5 font-heading text-xl font-extrabold text-white shadow-lg disabled:opacity-60 sm:text-2xl"
          style={{ background: "linear-gradient(135deg, #6BCB77, #45B649)", boxShadow: "0 6px 0 #3A9B3E" }}
          whileTap={answer === null ? { scale: 0.95, y: 3 } : undefined}
        >
          ✓ Doğru
        </motion.button>
        <motion.button
          type="button"
          onClick={() => handleAnswer(false)}
          disabled={answer !== null}
          className="flex flex-1 items-center justify-center gap-2 rounded-3xl py-5 font-heading text-xl font-extrabold text-white shadow-lg disabled:opacity-60 sm:text-2xl"
          style={{ background: "linear-gradient(135deg, #FF6B9D, #FF5252)", boxShadow: "0 6px 0 #D4456E" }}
          whileTap={answer === null ? { scale: 0.95, y: 3 } : undefined}
        >
          ✗ Yanlış
        </motion.button>
      </div>

      {/* Geri bildirim */}
      {answer !== null && showFeedback && (
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`z-10 rounded-2xl px-6 py-2.5 text-center font-heading text-base font-bold shadow-md ${
            userCorrect ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
          }`}
        >
          {userCorrect ? "Doğru! 🎉" : `Yanlış! Cevap: ${truth ? "Doğru" : "Yanlış"}`}
        </motion.div>
      )}
      {answer !== null && !showFeedback && (
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          className="z-10 rounded-2xl bg-indigo-100 px-6 py-2.5 text-center font-heading text-base font-bold text-indigo-700 shadow-md"
        >
          Kaydedildi ✨
        </motion.div>
      )}

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
