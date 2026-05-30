"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { playCardOpenSound, playCelebrationSound, playFlipSound } from "@/lib/sounds";
import { speak, isSpeechSupported, primeVoices } from "@/lib/speech";
import type { GameStats } from "@/types/game";
import ThemedBackground from "@/components/ThemedBackground";

interface FCOption {
  id: string;
  text?: string;
  imageUrl?: string;
}

export interface FlashcardsProps {
  options: FCOption[];
  title?: string;
  theme: {
    backgroundColor: string;
    cardColors: string[];
    decorEmojis: string[];
    celebrationText: string;
    emoji: string;
    accentGradient?: string;
  };
  onComplete: (stats: GameStats) => void;
}

export default function Flashcards({ options, title, theme, onComplete }: FlashcardsProps) {
  const startTime = useRef(Date.now());
  const hasCompleted = useRef(false);

  const total = options.length;
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState(1);
  const [reps, setReps] = useState<number[]>(() => options.map(() => 0));
  const current = options[index];

  const tts = isSpeechSupported();
  useEffect(() => { primeVoices(); }, []);

  // Kart değişince otomatik seslendir
  useEffect(() => {
    if (!current?.text) return;
    const t = setTimeout(() => speak(current.text!), 300);
    return () => clearTimeout(t);
  }, [current]);

  const go = useCallback((delta: number) => {
    setDir(delta);
    setIndex((i) => Math.min(total - 1, Math.max(0, i + delta)));
    playFlipSound();
  }, [total]);

  const addRep = useCallback(() => {
    playCardOpenSound();
    setReps((prev) => prev.map((r, i) => (i === index ? r + 1 : r)));
  }, [index]);

  const finish = useCallback(() => {
    if (hasCompleted.current) return;
    hasCompleted.current = true;
    playCelebrationSound();
    const stats: GameStats = {
      totalItems: total,
      correctCount: total,
      wrongCount: 0,
      timeSeconds: Math.round((Date.now() - startTime.current) / 1000),
      completedAt: new Date().toISOString(),
      wrongItems: [],
    };
    setTimeout(() => onComplete(stats), 600);
  }, [total, onComplete]);

  if (!current) return null;

  const totalReps = reps.reduce((a, b) => a + b, 0);
  const isLast = index === total - 1;

  return (
    <div className="relative flex min-h-[calc(100dvh-60px)] flex-col items-center gap-5 px-3 py-6 md:px-6" style={{ backgroundColor: theme.backgroundColor }}>
      <ThemedBackground decorEmojis={theme.decorEmojis} backgroundColor={theme.backgroundColor} />

      {/* İlerleme */}
      <div className="z-10 flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-2xl bg-white px-4 py-2 shadow-sm" style={{ border: "2px solid rgba(45, 27, 105, 0.06)" }}>
          <span className="text-lg">🗂️</span>
          <span className="font-heading text-lg font-bold text-[#2D1B69]">{index + 1}</span>
          <span className="text-xs font-bold text-[#8B7BAD]">/ {total}</span>
        </div>
        <div className="flex items-center gap-2 rounded-2xl bg-white px-4 py-2 shadow-sm" style={{ border: "2px solid rgba(45, 27, 105, 0.06)" }}>
          <span className="text-lg">🔁</span>
          <span className="font-heading text-lg font-bold text-[#FF6B9D]">{totalReps}</span>
        </div>
      </div>

      {title && (
        <p className="z-10 max-w-lg text-center font-heading text-base font-bold text-[#2D1B69] sm:text-lg">{title}</p>
      )}

      {/* Kart */}
      <div className="z-10 flex w-full max-w-md flex-1 items-center justify-center">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={current.id}
            custom={dir}
            className="flex w-full flex-col items-center gap-5 rounded-3xl bg-white p-6 shadow-2xl sm:p-8"
            style={{ border: "3px solid rgba(45, 27, 105, 0.08)" }}
            initial={{ opacity: 0, x: dir * 80, rotateY: dir * 20 }}
            animate={{ opacity: 1, x: 0, rotateY: 0 }}
            exit={{ opacity: 0, x: dir * -80, rotateY: dir * -20 }}
            transition={{ type: "spring", stiffness: 220, damping: 24 }}
          >
            {current.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={current.imageUrl} alt="" className="h-44 w-full rounded-2xl object-cover shadow-md sm:h-56" />
            )}
            {current.text && (
              <p className="text-center font-heading text-3xl font-extrabold text-[#2D1B69] sm:text-4xl">{current.text}</p>
            )}

            <div className="flex flex-wrap items-center justify-center gap-2">
              {tts && current.text && (
                <button
                  type="button"
                  onClick={() => speak(current.text!)}
                  className="flex items-center gap-2 rounded-full px-5 py-2.5 font-heading text-base font-bold text-white shadow-md transition hover:scale-105"
                  style={{ background: theme.accentGradient ?? "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
                >
                  🔊 Dinle
                </button>
              )}
              <button
                type="button"
                onClick={addRep}
                className="flex items-center gap-2 rounded-full bg-[#F8F5FF] px-5 py-2.5 font-heading text-base font-bold text-[#2D1B69] shadow-sm transition hover:scale-105"
                style={{ border: "2px solid rgba(45, 27, 105, 0.08)" }}
              >
                👏 Tekrar Et ({reps[index]})
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigasyon */}
      <div className="z-10 flex w-full max-w-md items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => go(-1)}
          disabled={index === 0}
          className="flex h-14 flex-1 items-center justify-center rounded-2xl bg-white font-heading text-base font-bold text-[#2D1B69] shadow-md transition enabled:hover:scale-105 disabled:opacity-40"
          style={{ border: "2px solid rgba(45, 27, 105, 0.08)" }}
        >
          ← Önceki
        </button>
        {isLast ? (
          <button
            type="button"
            onClick={finish}
            className="btn-candy btn-green flex h-14 flex-1 items-center justify-center rounded-2xl text-base"
          >
            Tamamla 🎉
          </button>
        ) : (
          <button
            type="button"
            onClick={() => go(1)}
            className="btn-candy flex h-14 flex-1 items-center justify-center rounded-2xl text-base"
          >
            Sonraki →
          </button>
        )}
      </div>
    </div>
  );
}
