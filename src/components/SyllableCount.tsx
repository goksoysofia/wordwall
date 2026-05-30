"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { playCorrectSound, playWrongSound, playCelebrationSound, playCardOpenSound, playTickSound } from "@/lib/sounds";
import { speak, isSpeechSupported, primeVoices } from "@/lib/speech";
import type { GameStats, WrongItem } from "@/types/game";
import ThemedBackground from "@/components/ThemedBackground";

interface SylOption {
  id: string;
  text?: string;
  imageUrl?: string;
}

export interface SyllableCountProps {
  options: SylOption[];
  title?: string;
  theme: {
    backgroundColor: string;
    cardColors: string[];
    decorEmojis: string[];
    celebrationText: string;
    emoji: string;
    accentGradient?: string;
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

// Türkçede hece sayısı = sesli harf sayısı
const VOWELS = /[aeıioöuüAEIİOÖUÜ]/g;
function syllableCount(word: string): number {
  const m = word.match(VOWELS);
  return m ? m.length : 1;
}

export default function SyllableCount({ options, title, theme, showFeedback = true, onComplete }: SyllableCountProps) {
  const startTime = useRef(Date.now());
  const hasCompleted = useRef(false);
  const correctRef = useRef(0);
  const wrongRef = useRef(0);
  const wrongItemsRef = useRef<WrongItem[]>([]);

  const deck = useMemo(() => shuffle(options.filter((o) => o.text && o.text.trim())), [options]);
  const total = deck.length;

  const maxButtons = useMemo(() => {
    // En az 3 buton; en uzun kelimenin hece sayısı kadar buton (doğru cevap daima
    // ulaşılabilir olsun). Üst sınır yok — butonlar gerekirse alt satıra sarar.
    const max = deck.reduce((m, o) => Math.max(m, syllableCount(o.text!)), 1);
    return Math.max(3, max);
  }, [deck]);

  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const current = deck[index];

  const tts = isSpeechSupported();
  useEffect(() => { primeVoices(); }, []);
  useEffect(() => {
    if (!current?.text) return;
    setPicked(null);
    const t = setTimeout(() => speak(current.text!), 300);
    return () => clearTimeout(t);
  }, [current]);

  const correctCountForCurrent = current ? syllableCount(current.text!) : 0;

  const handlePick = useCallback(
    (n: number) => {
      if (picked !== null || !current) return;
      setPicked(n);
      const correct = n === correctCountForCurrent;
      if (correct) {
        correctRef.current += 1;
        if (showFeedback) playCorrectSound();
        else playCardOpenSound();
      } else {
        wrongRef.current += 1;
        wrongItemsRef.current.push({
          text: current.text || "Kelime",
          correctAnswer: `${correctCountForCurrent} hece`,
          userAnswer: `${n} hece`,
        });
        if (showFeedback) playWrongSound();
        else playCardOpenSound();
      }

      const delay = showFeedback ? 1000 : 450;
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
        }
      }, delay);
    },
    [picked, current, correctCountForCurrent, showFeedback, index, total, onComplete]
  );

  const resetGame = () => {
    setIndex(0);
    setPicked(null);
    correctRef.current = 0;
    wrongRef.current = 0;
    wrongItemsRef.current = [];
    startTime.current = Date.now();
    hasCompleted.current = false;
  };

  if (!current) return null;

  return (
    <div className="relative flex flex-col items-center gap-6 px-3 py-8 md:px-6" style={{ backgroundColor: theme.backgroundColor }}>
      <ThemedBackground decorEmojis={theme.decorEmojis} backgroundColor={theme.backgroundColor} />

      {/* İlerleme */}
      <div className="z-10 flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-2xl bg-white px-4 py-2 shadow-sm" style={{ border: "2px solid rgba(45, 27, 105, 0.06)" }}>
          <span className="text-lg">👏</span>
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

      <p className="z-10 max-w-lg text-center font-heading text-base font-bold text-[#2D1B69] sm:text-lg">
        {title || "Kaç hece var? Alkışla ve say! 👏"}
      </p>

      {/* Kelime kartı */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          className="z-10 flex w-full max-w-md flex-col items-center gap-3 rounded-3xl bg-white p-6 shadow-xl"
          style={{ border: "3px solid rgba(45, 27, 105, 0.08)" }}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
        >
          {current.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={current.imageUrl} alt="" className="h-36 w-44 rounded-2xl object-cover shadow-md sm:h-44 sm:w-56" />
          )}
          <p className="text-center font-heading text-3xl font-extrabold text-[#2D1B69] sm:text-4xl">{current.text}</p>
          {tts && (
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

      {/* Sayı butonları */}
      <div className="z-10 flex flex-wrap items-center justify-center gap-3">
        {Array.from({ length: maxButtons }).map((_, i) => {
          const n = i + 1;
          const color = theme.cardColors[i % theme.cardColors.length];
          const isPicked = picked === n;
          const showRight = showFeedback && picked !== null && n === correctCountForCurrent;
          const showWrong = showFeedback && isPicked && n !== correctCountForCurrent;
          return (
            <motion.button
              key={n}
              type="button"
              onMouseDown={() => picked === null && playTickSound()}
              onClick={() => handlePick(n)}
              disabled={picked !== null}
              className="flex h-16 w-16 items-center justify-center rounded-2xl font-heading text-2xl font-extrabold shadow-md disabled:cursor-default sm:h-20 sm:w-20 sm:text-3xl"
              style={{
                background: showRight ? "#22c55e" : showWrong ? "#ef4444" : isPicked ? color : "white",
                border: showRight
                  ? "3px solid #16a34a"
                  : showWrong
                    ? "3px solid #dc2626"
                    : `3px solid ${color}`,
                color: showRight || showWrong || isPicked ? "white" : "#2D1B69",
                opacity: picked !== null && showFeedback && !showRight && !showWrong ? 0.4 : 1,
              }}
              whileHover={picked === null ? { scale: 1.08 } : undefined}
              whileTap={picked === null ? { scale: 0.92 } : undefined}
            >
              {n}
            </motion.button>
          );
        })}
      </div>

      {showFeedback && picked !== null && (
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`z-10 rounded-2xl px-6 py-2.5 text-center font-heading text-base font-bold shadow-md ${
            picked === correctCountForCurrent ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
          }`}
        >
          {picked === correctCountForCurrent
            ? `Doğru! ${correctCountForCurrent} hece 🎉`
            : `${correctCountForCurrent} hece var 💪`}
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
