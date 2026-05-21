"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { playFlipSound, playMatchSound, playWrongSound } from "@/lib/sounds";
import type { GameStats } from "@/types/game";
import ThemedBackground from "@/components/ThemedBackground";

export interface MemoryGameProps {
  options: { id: string; text?: string; imageUrl?: string }[];
  theme: {
    backgroundColor: string;
    cardColors: string[];
    cardFrontEmojis: string[];
    decorEmojis: string[];
    celebrationText: string;
    emoji: string;
  };
  onComplete: (stats: GameStats) => void;
}

interface MemoryCard {
  uid: string;
  originalId: string;
  text?: string;
  imageUrl?: string;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function MemoryGame({ options, theme, onComplete }: MemoryGameProps) {
  const startTime = useRef(Date.now());
  const lockRef = useRef(false);
  const hasCompleted = useRef(false);
  const cards = useMemo(() => {
    const pairs: MemoryCard[] = [];
    options.forEach((o) => {
      pairs.push({ uid: `${o.id}-a`, originalId: o.id, text: o.text, imageUrl: o.imageUrl });
      pairs.push({ uid: `${o.id}-b`, originalId: o.id, text: o.text, imageUrl: o.imageUrl });
    });
    return shuffle(pairs);
  }, [options]);

  const [flipped, setFlipped] = useState<string[]>([]);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [checking, setChecking] = useState(false);
  const [moves, setMoves] = useState(0);

  const handleFlip = useCallback(
    (uid: string) => {
      if (lockRef.current) return;
      if (checking) return;
      if (flipped.includes(uid)) return;
      if (matched.has(cards.find((c) => c.uid === uid)?.originalId || "")) return;
      if (flipped.length >= 2) return;

      playFlipSound();
      const next = [...flipped, uid];
      setFlipped(next);

      if (next.length === 2) {
        lockRef.current = true;
        setMoves((m) => m + 1);
        setChecking(true);
        const card1 = cards.find((c) => c.uid === next[0]);
        const card2 = cards.find((c) => c.uid === next[1]);

        if (card1 && card2 && card1.originalId === card2.originalId) {
          playMatchSound();
          setTimeout(() => {
            setMatched((prev) => new Set(prev).add(card1.originalId));
            setFlipped([]);
            setChecking(false);
            lockRef.current = false;
          }, 500);
        } else {
          playWrongSound();
          setTimeout(() => {
            setFlipped([]);
            setChecking(false);
            lockRef.current = false;
          }, 800);
        }
      }
    },
    [flipped, matched, checking, cards]
  );

  useEffect(() => {
    if (matched.size === options.length && options.length > 0 && !hasCompleted.current) {
      hasCompleted.current = true;
      const stats: GameStats = {
        totalItems: options.length,
        correctCount: matched.size,
        wrongCount: moves - matched.size,
        timeSeconds: Math.round((Date.now() - startTime.current) / 1000),
        completedAt: new Date().toISOString(),
        wrongItems: [],
      };
      setTimeout(() => onComplete(stats), 600);
    }
  }, [matched.size, options.length, onComplete, moves]);

  const resetGame = () => {
    setFlipped([]);
    setMatched(new Set());
    setChecking(false);
    setMoves(0);
    startTime.current = Date.now();
    hasCompleted.current = false;
    lockRef.current = false;
  };

  const cols = cards.length <= 8 ? 3 : cards.length <= 16 ? 4 : 5;

  return (
    <div className="relative flex flex-col items-center gap-6 px-3 py-6 md:px-6" style={{ backgroundColor: theme.backgroundColor }}>
      <ThemedBackground decorEmojis={theme.decorEmojis} backgroundColor={theme.backgroundColor} />
      {/* Stats */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 rounded-2xl bg-white px-4 py-2 shadow-sm" style={{ border: "2px solid rgba(45, 27, 105, 0.06)" }}>
          <span className="text-lg">🔄</span>
          <span className="font-heading text-lg font-bold text-[#2D1B69]">{moves}</span>
          <span className="text-xs font-bold text-[#8B7BAD]">hamle</span>
        </div>
        <div className="flex items-center gap-2 rounded-2xl bg-white px-4 py-2 shadow-sm" style={{ border: "2px solid rgba(45, 27, 105, 0.06)" }}>
          <span className="text-lg">✅</span>
          <span className="font-heading text-lg font-bold text-emerald-600">{matched.size}</span>
          <span className="text-xs font-bold text-[#8B7BAD]">/ {options.length}</span>
        </div>
      </div>

      {/* Instruction */}
      <p className="text-center font-heading text-base font-bold text-[#2D1B69]">
        Eşlerini bul! Kartları çevir 🧠
      </p>

      {/* Card Grid */}
      <div
        className="mx-auto grid w-full gap-2.5 sm:gap-3"
        style={{
          maxWidth: cols * 110 + (cols - 1) * 12,
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
        }}
      >
        {cards.map((card, idx) => {
          const isFlipped = flipped.includes(card.uid);
          const isMatched = matched.has(card.originalId);
          const isRevealed = isFlipped || isMatched;
          const emoji = theme.cardFrontEmojis[idx % theme.cardFrontEmojis.length];
          const color = theme.cardColors[idx % theme.cardColors.length];

          return (
            <motion.button
              key={card.uid}
              type="button"
              onClick={() => handleFlip(card.uid)}
              disabled={isRevealed || checking}
              className="relative aspect-square w-full cursor-pointer disabled:cursor-default"
              style={{ perspective: 600 }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.03 }}
            >
              <motion.div
                className="absolute inset-0"
                style={{ transformStyle: "preserve-3d" }}
                animate={{ rotateY: isRevealed ? 180 : 0 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
              >
                {/* Card Back */}
                <div
                  className="absolute inset-0 flex items-center justify-center rounded-2xl text-2xl shadow-md sm:text-3xl"
                  style={{
                    backfaceVisibility: "hidden",
                    background: `linear-gradient(135deg, ${color}, ${color}CC)`,
                    border: "3px solid rgba(255,255,255,0.3)",
                  }}
                >
                  {emoji}
                </div>

                {/* Card Front (content) */}
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-white p-2 shadow-md"
                  style={{
                    backfaceVisibility: "hidden",
                    transform: "rotateY(180deg)",
                    border: isMatched
                      ? "3px solid #22c55e"
                      : "3px solid rgba(45, 27, 105, 0.1)",
                    background: isMatched ? "#f0fdf4" : "white",
                  }}
                >
                  {card.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={card.imageUrl}
                      alt=""
                      className="h-full w-full rounded-xl object-cover"
                    />
                  ) : (
                    <span className="font-heading text-xs font-bold text-[#2D1B69] sm:text-sm">
                      {card.text}
                    </span>
                  )}
                  {isMatched && (
                    <div className="absolute bottom-1 right-1 text-sm">✅</div>
                  )}
                </div>
              </motion.div>
            </motion.button>
          );
        })}
      </div>

      {/* Reset */}
      <button
        type="button"
        onClick={resetGame}
        className="rounded-2xl bg-white px-6 py-2.5 font-heading text-sm font-bold text-[#2D1B69] shadow-md transition hover:scale-105 hover:shadow-lg"
        style={{ border: "2px solid rgba(45, 27, 105, 0.06)" }}
      >
        🔄 Yeniden Başlat
      </button>
    </div>
  );
}
