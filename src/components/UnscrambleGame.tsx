"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { playCorrectSound, playWrongSound, playCelebrationSound, playFlipSound, playCardOpenSound } from "@/lib/sounds";
import { speak, isSpeechSupported, primeVoices } from "@/lib/speech";
import type { GameStats, WrongItem } from "@/types/game";
import ThemedBackground from "@/components/ThemedBackground";

interface UnscrambleOption {
  id: string;
  text?: string;
  imageUrl?: string;
}

export interface UnscrambleGameProps {
  options: UnscrambleOption[];
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

interface Tile {
  id: string;
  ch: string;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const up = (s: string) => s.toLocaleUpperCase("tr-TR");

/** Tireli/boşluklu yazı = hece; aksi halde harf harf böl. */
function splitWord(text: string): string[] {
  const t = text.trim();
  if (/[-·•/\s]/.test(t)) {
    return t.split(/[-·•/\s]+/).filter(Boolean);
  }
  return Array.from(t).filter((c) => c.trim().length > 0);
}

export default function UnscrambleGame({ options, title, theme, showFeedback = true, onComplete }: UnscrambleGameProps) {
  const startTime = useRef(Date.now());
  const hasCompleted = useRef(false);
  const correctRef = useRef(0);
  const wrongRef = useRef(0);
  const wrongItemsRef = useRef<WrongItem[]>([]);

  const deck = useMemo(() => options.filter((o) => o.text && o.text.trim()), [options]);
  const total = deck.length;

  const [index, setIndex] = useState(0);
  const current = deck[index];

  const targetString = useMemo(() => (current ? splitWord(current.text!).join("") : ""), [current]);
  const baseTiles = useMemo<Tile[]>(
    () => (current ? splitWord(current.text!).map((ch, i) => ({ id: `t-${i}`, ch })) : []),
    [current]
  );
  const [poolOrder, setPoolOrder] = useState<Tile[]>([]);
  const [placed, setPlaced] = useState<Tile[]>([]);
  const [shake, setShake] = useState(false);
  const [solvedFlash, setSolvedFlash] = useState(false);

  useEffect(() => {
    primeVoices();
  }, []);

  // Yeni kelimeye geçildiğinde tahta sıfırla
  useEffect(() => {
    setPlaced([]);
    setPoolOrder(shuffle(baseTiles));
    setShake(false);
    setSolvedFlash(false);
  }, [baseTiles]);

  const pool = poolOrder.filter((t) => !placed.some((p) => p.id === t.id));

  const assembled = placed.map((t) => t.ch).join("");
  const isFull = placed.length === baseTiles.length && baseTiles.length > 0;
  const isCorrect = isFull && up(assembled) === up(targetString);

  const tts = isSpeechSupported();

  const advance = useCallback(() => {
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
      setTimeout(() => onComplete(stats), 900);
    } else {
      setIndex((i) => i + 1);
    }
  }, [index, total, onComplete]);

  const placeTile = useCallback((tile: Tile) => {
    playFlipSound();
    setPlaced((p) => [...p, tile]);
  }, []);

  const removeTile = useCallback((tile: Tile) => {
    if (solvedFlash) return;
    playFlipSound();
    setPlaced((p) => p.filter((t) => t.id !== tile.id));
  }, [solvedFlash]);

  const handleCheck = useCallback(() => {
    if (!current) return;
    if (!showFeedback) {
      if (isCorrect) correctRef.current += 1;
      else {
        wrongRef.current += 1;
        wrongItemsRef.current.push({ text: current.text!, correctAnswer: current.text!, userAnswer: assembled || "(boş)" });
      }
      setSolvedFlash(true);
      playCardOpenSound();
      setTimeout(advance, 700);
      return;
    }
    if (isCorrect) {
      correctRef.current += 1;
      setSolvedFlash(true);
      playCorrectSound();
      speak(current.text!);
      setTimeout(advance, 1000);
    } else {
      wrongRef.current += 1;
      wrongItemsRef.current.push({ text: current.text!, correctAnswer: current.text!, userAnswer: assembled || "(boş)" });
      playWrongSound();
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  }, [current, showFeedback, isCorrect, assembled, advance]);

  const resetGame = () => {
    setIndex(0);
    hasCompleted.current = false;
    correctRef.current = 0;
    wrongRef.current = 0;
    wrongItemsRef.current = [];
    startTime.current = Date.now();
  };

  if (!current) return null;

  // Parça sayısına göre kutu boyutu
  const big = baseTiles.length <= 6;
  const tileBox = big
    ? "h-14 w-14 text-2xl sm:h-16 sm:w-16 sm:text-3xl"
    : "h-11 w-11 text-lg sm:h-14 sm:w-14 sm:text-2xl";

  return (
    <div className="relative flex flex-col items-center gap-5 px-3 py-6 md:px-6" style={{ backgroundColor: theme.backgroundColor }}>
      <ThemedBackground decorEmojis={theme.decorEmojis} backgroundColor={theme.backgroundColor} />

      {/* İlerleme */}
      <div className="z-10 flex items-center gap-2 rounded-2xl bg-white px-4 py-2 shadow-sm" style={{ border: "2px solid rgba(45, 27, 105, 0.06)" }}>
        <span className="text-lg">🔤</span>
        <span className="font-heading text-lg font-bold text-[#2D1B69]">{index + 1}</span>
        <span className="text-xs font-bold text-[#8B7BAD]">/ {total}</span>
      </div>

      {title && (
        <p className="z-10 max-w-lg text-center font-heading text-base font-bold text-[#2D1B69] sm:text-lg">{title}</p>
      )}

      {/* Görsel ipucu */}
      {current.imageUrl && (
        <motion.div
          key={`img-${current.id}`}
          className="z-10 overflow-hidden rounded-3xl bg-white shadow-lg"
          style={{ border: "3px solid rgba(45, 27, 105, 0.08)" }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={current.imageUrl} alt="" className="h-36 w-48 object-cover sm:h-44 sm:w-60" />
        </motion.div>
      )}

      {tts && (
        <button
          type="button"
          onClick={() => speak(current.text!)}
          className="z-10 flex items-center gap-2 rounded-full bg-white px-4 py-2 font-heading text-sm font-bold text-[#2D1B69] shadow-sm transition hover:scale-105"
          style={{ border: "2px solid rgba(45, 27, 105, 0.08)" }}
        >
          🔊 Dinle
        </button>
      )}

      {/* Cevap slotları */}
      <motion.div
        className="z-10 flex flex-wrap items-center justify-center gap-2"
        animate={{ x: shake ? [0, -10, 10, -8, 8, 0] : 0 }}
      >
        {Array.from({ length: baseTiles.length }).map((_, i) => {
          const tile = placed[i];
          const color = theme.cardColors[i % theme.cardColors.length];
          return (
            <button
              key={`slot-${i}`}
              type="button"
              onClick={() => tile && removeTile(tile)}
              disabled={!tile || solvedFlash}
              className={`flex items-center justify-center rounded-2xl font-heading font-extrabold ${tileBox} disabled:cursor-default`}
              style={{
                background: solvedFlash ? "#f0fdf4" : tile ? "white" : `${color}10`,
                border: solvedFlash
                  ? "3px solid #22c55e"
                  : tile
                    ? `3px solid ${color}`
                    : `2px dashed ${color}80`,
                color: "#2D1B69",
              }}
            >
              {tile ? up(tile.ch) : ""}
            </button>
          );
        })}
      </motion.div>

      {/* Harf/hece havuzu */}
      <div className="z-10 flex max-w-2xl flex-wrap items-center justify-center gap-2 sm:gap-3">
        <AnimatePresence>
          {pool.map((tile) => (
            <motion.button
              key={tile.id}
              type="button"
              onClick={() => placeTile(tile)}
              className={`flex items-center justify-center rounded-2xl bg-white font-heading font-extrabold text-[#2D1B69] shadow-md ${tileBox}`}
              style={{ border: "3px solid rgba(45, 27, 105, 0.1)" }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.15 } }}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.9 }}
              layout
            >
              {up(tile.ch)}
            </motion.button>
          ))}
        </AnimatePresence>
      </div>

      {isFull && !solvedFlash && (
        <motion.button
          type="button"
          onClick={handleCheck}
          className="btn-candy btn-green z-10 rounded-2xl px-10 py-3.5 text-lg"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {showFeedback ? "Kontrol Et ✓" : "Onayla ✓"}
        </motion.button>
      )}

      {solvedFlash && showFeedback && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="z-10 rounded-2xl bg-emerald-100 px-6 py-2.5 text-center font-heading text-base font-bold text-emerald-700 shadow-md"
        >
          Doğru! {up(targetString)} 🎉
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
