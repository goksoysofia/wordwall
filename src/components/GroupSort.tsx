"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { playCorrectSound, playWrongSound } from "@/lib/sounds";
import type { GameStats } from "@/types/game";
import ThemedBackground from "@/components/ThemedBackground";

export interface GroupSortProps {
  options: { id: string; text?: string; imageUrl?: string; group?: string }[];
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

export default function GroupSort({ options, theme, showFeedback = true, onComplete }: GroupSortProps) {
  const startTime = useRef(Date.now());
  const scoreRef = useRef({ correct: 0, wrong: 0 });
  const hasCompleted = useRef(false);
  const groups = useMemo(() => {
    const set = new Set<string>();
    options.forEach((o) => { if (o.group) set.add(o.group); });
    return Array.from(set);
  }, [options]);

  const shuffledItems = useMemo(
    () => shuffle(options.filter((o) => o.group)),
    [options]
  );

  const [remaining, setRemaining] = useState(shuffledItems);
  const [sorted, setSorted] = useState<Record<string, typeof options>>(() => {
    const init: Record<string, typeof options> = {};
    groups.forEach((g) => { init[g] = []; });
    return init;
  });
  const [feedback, setFeedback] = useState<{ itemId: string; correct: boolean } | null>(null);
  const [score, setScore] = useState({ correct: 0, wrong: 0 });

  /** Sıradaki tek öğe — kullanıcı doğrudan grup seçer; seçim adımı yok. */
  const currentItem = remaining[0];

  const handleDrop = useCallback(
    (itemId: string, targetGroup: string) => {
      const item = remaining.find((o) => o.id === itemId);
      if (!item) return;

      if (item.group === targetGroup) {
        if (showFeedback) playCorrectSound();
        setFeedback(showFeedback ? { itemId, correct: true } : null);
        setScore((s) => {
          const next = { ...s, correct: s.correct + 1 };
          scoreRef.current = next;
          return next;
        });
        setTimeout(() => {
          setRemaining((prev) => prev.filter((o) => o.id !== itemId));
          setSorted((prev) => ({
            ...prev,
            [targetGroup]: [...(prev[targetGroup] || []), item],
          }));
          setFeedback(null);
        }, 400);
      } else {
        if (showFeedback) playWrongSound();
        setFeedback(showFeedback ? { itemId, correct: false } : null);
        setScore((s) => {
          const next = { ...s, wrong: s.wrong + 1 };
          scoreRef.current = next;
          return next;
        });
        setTimeout(() => {
          setFeedback(null);
        }, 600);
      }
    },
    [remaining]
  );

  useEffect(() => {
    if (remaining.length === 0 && options.length > 0 && !hasCompleted.current) {
      hasCompleted.current = true;
      const s = scoreRef.current;
      const stats: GameStats = {
        totalItems: options.length,
        correctCount: s.correct,
        wrongCount: s.wrong,
        timeSeconds: Math.round((Date.now() - startTime.current) / 1000),
        completedAt: new Date().toISOString(),
      };
      setTimeout(() => onComplete(stats), 600);
    }
  }, [remaining.length, options.length, onComplete]);

  const handleGroupClick = (group: string) => {
    const id = remaining[0]?.id;
    if (!id || feedback) return;
    handleDrop(id, group);
  };

  const groupCount = groups.length;
  /** Daha fazla grup = daha sıkı boşluk; hepsi tek satırda kalır. */
  const groupGapClass =
    groupCount >= 5 ? "gap-1.5 sm:gap-2" : groupCount >= 4 ? "gap-2 sm:gap-2.5" : "gap-3 sm:gap-4 md:gap-5";
  const groupPadClass = groupCount >= 4 ? "p-2 sm:p-3" : "p-4";
  const groupTitleClass =
    groupCount >= 5
      ? "mb-2 rounded-xl px-2 py-1.5 text-xs font-extrabold sm:px-3 sm:py-2 sm:text-sm"
      : groupCount >= 4
        ? "mb-3 rounded-2xl px-3 py-2 text-sm font-extrabold sm:text-base"
        : "mb-4 rounded-2xl px-6 py-2.5 text-base font-extrabold sm:text-lg";

  const resetGame = () => {
    setRemaining(shuffle(options.filter((o) => o.group)));
    const init: Record<string, typeof options> = {};
    groups.forEach((g) => { init[g] = []; });
    setSorted(init);
    setFeedback(null);
    setScore({ correct: 0, wrong: 0 });
    scoreRef.current = { correct: 0, wrong: 0 };
    startTime.current = Date.now();
    hasCompleted.current = false;
  };

  return (
    <div className="relative flex flex-col items-center gap-6 px-3 py-6 md:px-6" style={{ backgroundColor: theme.backgroundColor }}>
      <ThemedBackground decorEmojis={theme.decorEmojis} backgroundColor={theme.backgroundColor} />
      {/* Score */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 rounded-2xl bg-white px-4 py-2 shadow-sm" style={{ border: "2px solid rgba(45, 27, 105, 0.06)" }}>
          <span className="text-lg">📂</span>
          <span className="font-heading text-lg font-bold text-[#2D1B69]">
            {options.length - remaining.length}/{options.length}
          </span>
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
        Bu öğeyi ait olduğu grubu seçerek yerleştir! 📂
      </p>

      {/* Tek sıradaki öğe */}
      {currentItem && (
        <div className={currentItem.imageUrl ? "w-full max-w-2xl px-1 sm:px-2" : "w-full max-w-md"}>
          <div className="mb-3 text-center text-xs font-bold uppercase tracking-wider text-[#8B7BAD]">
            Sıra {options.length - remaining.length + 1} / {options.length}
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentItem.id}
              role="group"
              aria-label="Yerleştirilecek öğe"
              className="mx-auto flex max-w-full flex-col items-center overflow-hidden rounded-3xl shadow-lg"
              style={{
                width: currentItem.imageUrl ? "min(100%, min(42rem, 92vw))" : undefined,
                border: feedback?.itemId === currentItem.id
                  ? feedback.correct
                    ? "3px solid #22c55e"
                    : "3px solid #ef4444"
                  : "3px solid rgba(45, 27, 105, 0.08)",
                background: feedback?.itemId === currentItem.id
                  ? feedback.correct
                    ? "#f0fdf4"
                    : "#fef2f2"
                  : "white",
                boxShadow: "0 8px 28px rgba(0,0,0,0.08)",
              }}
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{
                opacity: 1,
                y: 0,
                scale: feedback?.itemId === currentItem.id && feedback?.correct === false ? [1, 1.04, 0.98, 1] : 1,
              }}
              exit={{ opacity: 0, y: -12, scale: 0.95, transition: { duration: 0.25 } }}
            >
              {currentItem.imageUrl ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={currentItem.imageUrl}
                    alt=""
                    className="h-52 w-full object-cover object-center sm:h-64 md:h-72 lg:h-80"
                  />
                  {currentItem.text && (
                    <span className="w-full px-4 py-3 text-center font-heading text-base font-bold text-[#2D1B69] sm:text-lg">
                      {currentItem.text}
                    </span>
                  )}
                </>
              ) : (
                <span className="px-8 py-10 text-center font-heading text-lg font-bold leading-snug text-[#2D1B69] sm:text-xl">
                  {currentItem.text}
                </span>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {/* Group Buckets — grup sayısına göre eşit genişlik, tek satır */}
      <div className={`flex w-full max-w-4xl flex-nowrap items-stretch ${groupGapClass}`}>
        {groups.map((group, gi) => {
          const color = theme.cardColors[gi % theme.cardColors.length];
          const items = sorted[group] || [];
          const canPick = !!currentItem && !feedback;
          return (
            <motion.button
              key={group}
              type="button"
              onClick={() => handleGroupClick(group)}
              disabled={!canPick}
              className={`flex min-h-[140px] min-w-0 flex-1 flex-col items-center rounded-3xl transition-all duration-200 disabled:cursor-default sm:min-h-[160px] ${groupPadClass}`}
              style={{
                background: `${color}18`,
                border: canPick ? `3px dashed ${color}` : `3px dashed ${color}50`,
                boxShadow: canPick ? `0 4px 20px ${color}30` : undefined,
              }}
              whileHover={canPick ? { scale: 1.03, borderStyle: "solid" } : undefined}
              whileTap={canPick ? { scale: 0.97 } : undefined}
            >
              {/* Group title */}
              <div
                className={`w-full max-w-full truncate text-center font-heading tracking-wide text-white shadow-lg ${groupTitleClass}`}
                style={{
                  background: `linear-gradient(135deg, ${color}, ${color}DD)`,
                  boxShadow: `0 4px 14px ${color}50`,
                }}
                title={group}
              >
                {group}
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                <AnimatePresence>
                  {items.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex flex-col items-center overflow-hidden rounded-xl bg-white shadow-sm"
                      style={{ border: `2px solid ${color}30`, width: item.imageUrl ? 90 : undefined }}
                    >
                      {item.imageUrl ? (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={item.imageUrl} alt="" className="h-16 w-full object-cover sm:h-20" />
                          {item.text && (
                            <span className="w-full truncate px-1.5 py-1 text-center text-[11px] font-bold text-[#2D1B69]">
                              {item.text}
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="px-3 py-1.5 text-xs font-bold text-[#2D1B69]">{item.text}</span>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
              {items.length === 0 && (
                <p className="mt-3 text-sm font-semibold text-[#C5B8DB]">
                  Buraya yerleştir
                </p>
              )}
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
