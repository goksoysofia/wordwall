"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { playMatchSound, playWrongSound, playCelebrationSound } from "@/lib/sounds";
import { speak, isSpeechSupported, primeVoices } from "@/lib/speech";
import type { GameStats, WrongItem } from "@/types/game";
import ThemedBackground from "@/components/ThemedBackground";

interface BingoOption {
  id: string;
  text?: string;
  imageUrl?: string;
}

export interface BingoGameProps {
  options: BingoOption[];
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

export default function BingoGame({ options, title, theme, showFeedback = true, onComplete }: BingoGameProps) {
  const startTime = useRef(Date.now());
  const hasCompleted = useRef(false);
  const wrongRef = useRef(0);
  const wrongItemsRef = useRef<WrongItem[]>([]);

  const valid = useMemo(() => options.filter((o) => o.text || o.imageUrl), [options]);
  const side = useMemo(() => Math.min(5, Math.max(2, Math.floor(Math.sqrt(valid.length)))), [valid.length]);
  const board = useMemo(() => shuffle(valid).slice(0, side * side), [valid, side]);
  const callQueue = useMemo(() => shuffle(board), [board]);

  const [callIndex, setCallIndex] = useState(0);
  const [daubed, setDaubed] = useState<Set<string>>(new Set());
  const [won, setWon] = useState(false);
  const [wrongId, setWrongId] = useState<string | null>(null);

  const called = callQueue[callIndex];
  const tts = isSpeechSupported();

  useEffect(() => { primeVoices(); }, []);
  useEffect(() => {
    if (!called) return;
    const t = setTimeout(() => called.text && speak(called.text), 350);
    return () => clearTimeout(t);
  }, [called]);

  const checkWin = useCallback((daubedSet: Set<string>): boolean => {
    const isDaubed = (idx: number) => daubedSet.has(board[idx].id);
    // satırlar
    for (let r = 0; r < side; r++) {
      let all = true;
      for (let c = 0; c < side; c++) if (!isDaubed(r * side + c)) { all = false; break; }
      if (all) return true;
    }
    // sütunlar
    for (let c = 0; c < side; c++) {
      let all = true;
      for (let r = 0; r < side; r++) if (!isDaubed(r * side + c)) { all = false; break; }
      if (all) return true;
    }
    // çaprazlar
    let d1 = true, d2 = true;
    for (let i = 0; i < side; i++) {
      if (!isDaubed(i * side + i)) d1 = false;
      if (!isDaubed(i * side + (side - 1 - i))) d2 = false;
    }
    return d1 || d2;
  }, [board, side]);

  const finishWin = useCallback(() => {
    if (hasCompleted.current) return;
    hasCompleted.current = true;
    setWon(true);
    playCelebrationSound();
    const stats: GameStats = {
      totalItems: board.length,
      correctCount: daubed.size + 1,
      wrongCount: wrongRef.current,
      timeSeconds: Math.round((Date.now() - startTime.current) / 1000),
      completedAt: new Date().toISOString(),
      wrongItems: wrongItemsRef.current,
    };
    setTimeout(() => onComplete(stats), 1400);
  }, [board.length, daubed.size, onComplete]);

  const handleCell = useCallback(
    (cell: BingoOption) => {
      if (won || hasCompleted.current || !called) return;
      if (daubed.has(cell.id)) return;

      const matches = cell.id === called.id || (cell.text === called.text && cell.imageUrl === called.imageUrl);
      if (matches) {
        playMatchSound();
        const next = new Set(daubed).add(cell.id);
        setDaubed(next);
        if (checkWin(next)) {
          finishWin();
        } else {
          // sıradaki henüz daub edilmemiş çağrıya geç
          setTimeout(() => {
            setCallIndex((ci) => {
              let n = ci + 1;
              while (n < callQueue.length && next.has(callQueue[n].id)) n++;
              return n;
            });
          }, 500);
        }
      } else {
        if (showFeedback) playWrongSound();
        wrongRef.current += 1;
        wrongItemsRef.current.push({
          text: called.text || "Öğe",
          correctAnswer: called.text || "Çağrılan öğe",
          userAnswer: cell.text || "Yanlış hücre",
        });
        setWrongId(cell.id);
        setTimeout(() => setWrongId(null), 500);
      }
    },
    [won, called, daubed, showFeedback, checkWin, finishWin, callQueue]
  );

  const resetGame = () => {
    setCallIndex(0);
    setDaubed(new Set());
    setWon(false);
    setWrongId(null);
    wrongRef.current = 0;
    wrongItemsRef.current = [];
    startTime.current = Date.now();
    hasCompleted.current = false;
  };

  const cellFont = side >= 4 ? "text-xs sm:text-sm" : "text-sm sm:text-base";

  return (
    <div className="relative flex flex-col items-center gap-5 px-3 py-6 md:px-6" style={{ backgroundColor: theme.backgroundColor }}>
      <ThemedBackground decorEmojis={theme.decorEmojis} backgroundColor={theme.backgroundColor} />

      {/* İlerleme */}
      <div className="z-10 flex items-center gap-2 rounded-2xl bg-white px-4 py-2 shadow-sm" style={{ border: "2px solid rgba(45, 27, 105, 0.06)" }}>
        <span className="text-lg">🎱</span>
        <span className="font-heading text-lg font-bold text-[#2D1B69]">{daubed.size}</span>
        <span className="text-xs font-bold text-[#8B7BAD]">/ {board.length}</span>
      </div>

      {title && <p className="z-10 max-w-lg text-center font-heading text-sm font-bold text-[#2D1B69]">{title}</p>}

      {/* Çağrılan öğe */}
      {called && !won && (
        <motion.div
          key={called.id}
          className="z-10 flex flex-col items-center gap-2 rounded-3xl bg-white px-6 py-4 shadow-xl"
          style={{ border: "3px solid rgba(45, 27, 105, 0.08)" }}
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#8B7BAD]">Bunu bul!</span>
          <div className="flex items-center gap-3">
            {called.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={called.imageUrl} alt="" className="h-16 w-16 rounded-xl object-cover sm:h-20 sm:w-20" />
            )}
            {called.text && (
              <span className="font-heading text-2xl font-extrabold text-[#2D1B69] sm:text-3xl">{called.text}</span>
            )}
            {tts && called.text && (
              <button
                type="button"
                onClick={() => speak(called.text!)}
                className="flex h-11 w-11 items-center justify-center rounded-full text-xl text-white shadow-md transition hover:scale-110"
                style={{ background: theme.accentGradient ?? "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
              >
                🔊
              </button>
            )}
          </div>
        </motion.div>
      )}

      {/* Tahta */}
      <div
        className="z-10 grid w-full gap-1.5 rounded-3xl bg-white p-2 shadow-lg sm:gap-2 sm:p-3"
        style={{
          gridTemplateColumns: `repeat(${side}, minmax(0, 1fr))`,
          maxWidth: "min(94vw, 480px)",
          border: "3px solid rgba(45, 27, 105, 0.08)",
        }}
      >
        {board.map((cell, idx) => {
          const color = theme.cardColors[idx % theme.cardColors.length];
          const isDaubed = daubed.has(cell.id);
          const isWrong = wrongId === cell.id;
          return (
            <motion.button
              key={cell.id}
              type="button"
              onClick={() => handleCell(cell)}
              disabled={isDaubed || won}
              className={`relative flex aspect-square flex-col items-center justify-center gap-1 overflow-hidden rounded-xl p-1 ${cellFont} font-heading font-bold disabled:cursor-default`}
              style={{
                background: isDaubed ? color : isWrong ? "#fef2f2" : "white",
                border: isDaubed ? `2px solid ${color}` : isWrong ? "2px solid #ef4444" : `2px solid ${color}40`,
                color: isDaubed ? "white" : "#2D1B69",
              }}
              animate={{ x: isWrong ? [0, -5, 5, -4, 4, 0] : 0 }}
              whileTap={!isDaubed && !won ? { scale: 0.93 } : undefined}
            >
              {cell.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={cell.imageUrl}
                  alt=""
                  className="h-9 w-9 rounded-md object-cover sm:h-12 sm:w-12"
                  style={{ opacity: isDaubed ? 0.85 : 1 }}
                />
              )}
              {cell.text && <span className="line-clamp-2 text-center leading-tight">{cell.text}</span>}
              {isDaubed && (
                <motion.span
                  className="absolute right-1 top-1 text-base"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                >
                  ⭐
                </motion.span>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* BINGO kazanma */}
      <AnimatePresence>
        {won && (
          <motion.div
            className="z-20 rounded-3xl bg-white px-8 py-5 text-center shadow-2xl"
            initial={{ opacity: 0, scale: 0.5, rotate: -8 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
          >
            <motion.p
              className="font-heading text-4xl font-extrabold"
              style={{ background: theme.accentGradient ?? "linear-gradient(135deg, #FF6B9D, #FF8A50)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 0.6, repeat: 3 }}
            >
              TOMBALA! 🎉
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

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
