"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { playWrongSound, playMatchSound } from "@/lib/sounds";
import type { GameStats } from "@/types/game";
import ThemedBackground from "@/components/ThemedBackground";

export interface MatchGameProps {
  options: { id: string; text?: string; imageUrl?: string; pairText?: string; pairImageUrl?: string }[];
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

interface MatchItem {
  id: string;
  originalId: string;
  side: "left" | "right";
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

function buildRightItems(options: MatchGameProps["options"]): MatchItem[] {
  return shuffle(
    options.map((o) => ({
      id: `right-${o.id}`,
      originalId: o.id,
      side: "right" as const,
      text: o.pairText || o.text,
      imageUrl: o.pairImageUrl || o.imageUrl,
    }))
  );
}

export default function MatchGame({ options, theme, showFeedback = true, onComplete }: MatchGameProps) {
  const startTime = useRef(Date.now());
  const scoreRef = useRef({ correct: 0, wrong: 0 });
  const hasCompleted = useRef(false);
  const wrongPairTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const leftItems = useMemo<MatchItem[]>(
    () =>
      options.map((o) => ({
        id: `left-${o.id}`,
        originalId: o.id,
        side: "left" as const,
        text: o.text,
        imageUrl: o.imageUrl,
      })),
    [options]
  );

  const [rightItems, setRightItems] = useState<MatchItem[]>(() => buildRightItems(options));

  // Re-build right items when options change (e.g. new game loaded)
  useEffect(() => {
    setRightItems(buildRightItems(options));
  }, [options]);

  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [selectedRight, setSelectedRight] = useState<string | null>(null);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [wrongPair, setWrongPair] = useState<{ left: string; right: string } | null>(null);
  const [score, setScore] = useState({ correct: 0, wrong: 0 });

  // Clean up wrongPair timeout on unmount
  useEffect(() => {
    return () => {
      if (wrongPairTimeoutRef.current) {
        clearTimeout(wrongPairTimeoutRef.current);
      }
    };
  }, []);

  const checkMatch = useCallback(
    (leftId: string, rightId: string) => {
      const leftItem = leftItems.find((i) => i.id === leftId);
      const rightItem = rightItems.find((i) => i.id === rightId);
      if (!leftItem || !rightItem) return;

      if (leftItem.originalId === rightItem.originalId) {
        if (showFeedback) playMatchSound();
        setMatched((prev) => new Set(prev).add(leftItem.originalId));
        scoreRef.current = { ...scoreRef.current, correct: scoreRef.current.correct + 1 };
        setScore({ ...scoreRef.current });
        setSelectedLeft(null);
        setSelectedRight(null);
      } else {
        if (showFeedback) playWrongSound();
        setWrongPair({ left: leftId, right: rightId });
        scoreRef.current = { ...scoreRef.current, wrong: scoreRef.current.wrong + 1 };
        setScore({ ...scoreRef.current });
        wrongPairTimeoutRef.current = setTimeout(() => {
          setWrongPair(null);
          setSelectedLeft(null);
          setSelectedRight(null);
          wrongPairTimeoutRef.current = null;
        }, 600);
      }
    },
    [leftItems, rightItems]
  );

  useEffect(() => {
    if (selectedLeft && selectedRight) {
      checkMatch(selectedLeft, selectedRight);
    }
  }, [selectedLeft, selectedRight, checkMatch]);

  useEffect(() => {
    if (matched.size === options.length && options.length > 0 && !hasCompleted.current) {
      hasCompleted.current = true;
      const stats: GameStats = {
        totalItems: options.length,
        correctCount: matched.size,
        wrongCount: scoreRef.current.wrong,
        timeSeconds: Math.round((Date.now() - startTime.current) / 1000),
        completedAt: new Date().toISOString(),
      };
      setTimeout(() => onComplete(stats), 500);
    }
  }, [matched.size, options.length, onComplete]);

  const handleSelect = (item: MatchItem) => {
    if (matched.has(item.originalId)) return;
    if (wrongPair) return;

    if (item.side === "left") {
      setSelectedLeft(item.id === selectedLeft ? null : item.id);
    } else {
      setSelectedRight(item.id === selectedRight ? null : item.id);
    }
  };

  const getCardStyle = (item: MatchItem) => {
    const isMatched = matched.has(item.originalId);
    const isSelected =
      (item.side === "left" && selectedLeft === item.id) ||
      (item.side === "right" && selectedRight === item.id);
    const isWrong =
      wrongPair &&
      ((item.side === "left" && wrongPair.left === item.id) ||
        (item.side === "right" && wrongPair.right === item.id));

    if (isMatched) return { border: showFeedback ? "3px solid #22c55e" : "3px solid #6366f1", background: showFeedback ? "#f0fdf4" : "#eef2ff", opacity: 0.7 };
    if (isWrong) return { border: showFeedback ? "3px solid #ef4444" : "3px solid rgba(45, 27, 105, 0.15)", background: showFeedback ? "#fef2f2" : "white" };
    if (isSelected) return { border: "3px solid #6366f1", background: "#eef2ff", transform: "scale(1.03)" };
    return { border: "3px solid rgba(45, 27, 105, 0.08)", background: "white" };
  };

  const resetGame = () => {
    if (wrongPairTimeoutRef.current) {
      clearTimeout(wrongPairTimeoutRef.current);
      wrongPairTimeoutRef.current = null;
    }
    setSelectedLeft(null);
    setSelectedRight(null);
    setMatched(new Set());
    setWrongPair(null);
    scoreRef.current = { correct: 0, wrong: 0 };
    setScore({ correct: 0, wrong: 0 });
    setRightItems(buildRightItems(options));
    startTime.current = Date.now();
    hasCompleted.current = false;
  };

  return (
    <div className="relative flex flex-col items-center gap-6 px-3 py-6 md:px-6" style={{ backgroundColor: theme.backgroundColor }}>
      <ThemedBackground decorEmojis={theme.decorEmojis} backgroundColor={theme.backgroundColor} />
      {/* Score */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 rounded-2xl bg-white px-4 py-2 shadow-sm" style={{ border: "2px solid rgba(45, 27, 105, 0.06)" }}>
          <span className="text-lg">🔗</span>
          <span className="font-heading text-lg font-bold text-[#2D1B69]">{matched.size}/{options.length}</span>
        </div>
        {showFeedback && score.wrong > 0 && (
          <div className="flex items-center gap-2 rounded-2xl bg-white px-4 py-2 shadow-sm" style={{ border: "2px solid rgba(45, 27, 105, 0.06)" }}>
            <span className="text-lg">❌</span>
            <span className="font-heading text-lg font-bold text-rose-500">{score.wrong}</span>
          </div>
        )}
      </div>

      {/* Instruction */}
      <p className="text-center font-heading text-base font-bold text-[#2D1B69]">
        Soldaki ile sağdaki eşini bul! 🔗
      </p>

      {/* Game Board */}
      <div className="grid w-full max-w-2xl grid-cols-2 gap-3 sm:gap-5">
        {/* Left Column */}
        <div className="flex flex-col gap-3">
          <div className="mb-1 text-center text-xs font-bold uppercase tracking-wider text-[#8B7BAD]">Öğe</div>
          <AnimatePresence>
            {leftItems.map((item) => (
              <motion.button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item)}
                disabled={matched.has(item.originalId) || wrongPair !== null}
                className="flex min-h-[72px] items-center gap-3 rounded-2xl px-4 py-3 text-left transition-all duration-200 disabled:cursor-default"
                style={getCardStyle(item)}
                whileTap={!matched.has(item.originalId) ? { scale: 0.97 } : undefined}
                layout
              >
                {matched.has(item.originalId) && showFeedback && <span className="text-xl">✅</span>}
                {item.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.imageUrl} alt="" className="h-12 w-12 rounded-xl object-cover" />
                )}
                {item.text && (
                  <span className="font-heading text-sm font-bold text-[#2D1B69] sm:text-base">{item.text}</span>
                )}
              </motion.button>
            ))}
          </AnimatePresence>
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-3">
          <div className="mb-1 text-center text-xs font-bold uppercase tracking-wider text-[#8B7BAD]">Eşi</div>
          <AnimatePresence>
            {rightItems.map((item) => (
              <motion.button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item)}
                disabled={matched.has(item.originalId) || wrongPair !== null}
                className="flex min-h-[72px] items-center gap-3 rounded-2xl px-4 py-3 text-left transition-all duration-200 disabled:cursor-default"
                style={getCardStyle(item)}
                whileTap={!matched.has(item.originalId) ? { scale: 0.97 } : undefined}
                layout
              >
                {matched.has(item.originalId) && showFeedback && <span className="text-xl">✅</span>}
                {item.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.imageUrl} alt="" className="h-12 w-12 rounded-xl object-cover" />
                )}
                {item.text && (
                  <span className="font-heading text-sm font-bold text-[#2D1B69] sm:text-base">{item.text}</span>
                )}
              </motion.button>
            ))}
          </AnimatePresence>
        </div>
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
