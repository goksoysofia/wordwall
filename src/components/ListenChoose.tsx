"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { playCorrectSound, playWrongSound, playCelebrationSound } from "@/lib/sounds";
import { speak, isSpeechSupported, primeVoices } from "@/lib/speech";
import type { GameStats, WrongItem } from "@/types/game";
import ThemedBackground from "@/components/ThemedBackground";

interface LCOption {
  id: string;
  text?: string;
  imageUrl?: string;
}

export interface ListenChooseProps {
  options: LCOption[];
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

export default function ListenChoose({ options, title, theme, showFeedback = true, onComplete }: ListenChooseProps) {
  const startTime = useRef(Date.now());
  const hasCompleted = useRef(false);
  const correctRef = useRef(0);
  const wrongRef = useRef(0);
  const wrongItemsRef = useRef<WrongItem[]>([]);

  const deck = useMemo(() => options.filter((o) => o.text && o.text.trim()), [options]);
  const rounds = useMemo(() => shuffle(deck), [deck]);
  const total = rounds.length;

  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const target = rounds[index];

  const tts = isSpeechSupported();

  // Bu turdaki seçenekler: hedef + çeldiriciler
  const choices = useMemo(() => {
    if (!target) return [];
    const others = shuffle(deck.filter((o) => o.id !== target.id)).slice(0, 3);
    return shuffle([target, ...others]);
  }, [target, deck]);

  useEffect(() => { primeVoices(); }, []);

  // Tur başında otomatik seslendir
  useEffect(() => {
    if (!target) return;
    setPicked(null);
    setRevealed(false);
    const t = setTimeout(() => speak(target.text!), 350);
    return () => clearTimeout(t);
  }, [target]);

  const handlePick = useCallback(
    (choice: LCOption) => {
      if (picked || !target) return;
      const correct = choice.id === target.id;
      setPicked(choice.id);

      if (correct) {
        correctRef.current += 1;
        if (showFeedback) playCorrectSound();
      } else {
        wrongRef.current += 1;
        wrongItemsRef.current.push({
          text: target.text || "Kelime",
          correctAnswer: target.text || "",
          userAnswer: choice.text || "Seçim",
        });
        if (showFeedback) playWrongSound();
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
    [picked, target, showFeedback, index, total, onComplete]
  );

  const resetGame = () => {
    setIndex(0);
    setPicked(null);
    setRevealed(false);
    correctRef.current = 0;
    wrongRef.current = 0;
    wrongItemsRef.current = [];
    startTime.current = Date.now();
    hasCompleted.current = false;
  };

  if (!target) return null;

  const cols = choices.length <= 2 ? "grid-cols-2" : "grid-cols-2";

  return (
    <div className="relative flex flex-col items-center gap-6 px-3 py-8 md:px-6" style={{ backgroundColor: theme.backgroundColor }}>
      <ThemedBackground decorEmojis={theme.decorEmojis} backgroundColor={theme.backgroundColor} />

      {/* İlerleme */}
      <div className="z-10 flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-2xl bg-white px-4 py-2 shadow-sm" style={{ border: "2px solid rgba(45, 27, 105, 0.06)" }}>
          <span className="text-lg">👂</span>
          <span className="font-heading text-lg font-bold text-[#2D1B69]">{index + 1}</span>
          <span className="text-xs font-bold text-[#8B7BAD]">/ {total}</span>
        </div>
      </div>

      <p className="z-10 max-w-lg text-center font-heading text-base font-bold text-[#2D1B69] sm:text-lg">
        {title || "Dinle ve doğru olanı bul!"}
      </p>

      {/* Dinle paneli */}
      <motion.div
        className="z-10 flex flex-col items-center gap-3 rounded-3xl bg-white px-8 py-6 shadow-xl"
        style={{ border: "3px solid rgba(45, 27, 105, 0.08)" }}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <motion.button
          type="button"
          onClick={() => speak(target.text!)}
          disabled={!tts}
          className="flex h-24 w-24 items-center justify-center rounded-full text-5xl text-white shadow-lg disabled:opacity-40 sm:h-28 sm:w-28 sm:text-6xl"
          style={{ background: theme.accentGradient ?? "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
          whileHover={tts ? { scale: 1.06 } : undefined}
          whileTap={tts ? { scale: 0.94 } : undefined}
          animate={{ boxShadow: ["0 8px 24px rgba(99,102,241,0.3)", "0 8px 32px rgba(99,102,241,0.5)", "0 8px 24px rgba(99,102,241,0.3)"] }}
          transition={{ duration: 1.6, repeat: Infinity }}
        >
          🔊
        </motion.button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => speak(target.text!)}
            disabled={!tts}
            className="rounded-full bg-[#F8F5FF] px-4 py-1.5 text-sm font-bold text-[#8B7BAD] transition hover:scale-105 disabled:opacity-40"
          >
            🔁 Tekrar
          </button>
          <button
            type="button"
            onClick={() => setRevealed((r) => !r)}
            className="rounded-full bg-[#F8F5FF] px-4 py-1.5 text-sm font-bold text-[#8B7BAD] transition hover:scale-105"
          >
            {revealed ? "🙈 Gizle" : "👁 Göster"}
          </button>
        </div>
        {(!tts || revealed) && (
          <p className="font-heading text-lg font-extrabold text-[#2D1B69]">{target.text}</p>
        )}
        {!tts && (
          <p className="text-[11px] font-semibold text-[#C5B8DB]">Bu cihazda ses yok — kelimeyi siz okuyun</p>
        )}
      </motion.div>

      {/* Seçenekler */}
      <div className={`z-10 grid w-full max-w-lg gap-3 sm:gap-4 ${cols}`}>
        {choices.map((choice, idx) => {
          const color = theme.cardColors[idx % theme.cardColors.length];
          const isTarget = choice.id === target.id;
          const isPicked = picked === choice.id;
          const showRight = showFeedback && picked && isTarget;
          const showWrong = showFeedback && isPicked && !isTarget;
          return (
            <motion.button
              key={choice.id}
              type="button"
              onClick={() => handlePick(choice)}
              disabled={!!picked}
              className="flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-3xl bg-white p-3 shadow-md disabled:cursor-default"
              style={{
                border: showRight
                  ? "4px solid #22c55e"
                  : showWrong
                    ? "4px solid #ef4444"
                    : isPicked
                      ? "4px solid #6366f1"
                      : `3px solid ${color}40`,
                background: showRight ? "#f0fdf4" : showWrong ? "#fef2f2" : "white",
                opacity: picked && showFeedback && !isTarget && !isPicked ? 0.45 : 1,
              }}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              whileHover={!picked ? { scale: 1.04 } : undefined}
              whileTap={!picked ? { scale: 0.96 } : undefined}
            >
              {choice.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={choice.imageUrl} alt="" className="h-20 w-20 rounded-xl object-cover sm:h-24 sm:w-24" />
              ) : (
                <span className="text-center font-heading text-lg font-bold text-[#2D1B69] sm:text-xl">{choice.text}</span>
              )}
              {choice.imageUrl && choice.text && (
                <span className="text-center text-xs font-bold text-[#8B7BAD]">{choice.text}</span>
              )}
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
