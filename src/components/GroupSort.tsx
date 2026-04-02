"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { playCorrectSound, playWrongSound } from "@/lib/sounds";
import type { GameStats } from "@/types/game";

export interface GroupSortProps {
  options: { id: string; text?: string; imageUrl?: string; group?: string }[];
  theme: {
    backgroundColor: string;
    cardColors: string[];
    celebrationText: string;
    emoji: string;
  };
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

export default function GroupSort({ options, theme, onComplete }: GroupSortProps) {
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
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [score, setScore] = useState({ correct: 0, wrong: 0 });

  const handleDrop = useCallback(
    (itemId: string, targetGroup: string) => {
      const item = remaining.find((o) => o.id === itemId);
      if (!item) return;

      if (item.group === targetGroup) {
        playCorrectSound();
        setFeedback({ itemId, correct: true });
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
          setSelectedItem(null);
        }, 400);
      } else {
        playWrongSound();
        setFeedback({ itemId, correct: false });
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
    if (!selectedItem) return;
    handleDrop(selectedItem, group);
  };

  const resetGame = () => {
    setRemaining(shuffle(options.filter((o) => o.group)));
    const init: Record<string, typeof options> = {};
    groups.forEach((g) => { init[g] = []; });
    setSorted(init);
    setFeedback(null);
    setSelectedItem(null);
    setScore({ correct: 0, wrong: 0 });
    scoreRef.current = { correct: 0, wrong: 0 };
    startTime.current = Date.now();
    hasCompleted.current = false;
  };

  return (
    <div className="flex flex-col items-center gap-6 px-3 py-6 md:px-6" style={{ backgroundColor: theme.backgroundColor }}>
      {/* Score */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 rounded-2xl bg-white px-4 py-2 shadow-sm" style={{ border: "2px solid rgba(45, 27, 105, 0.06)" }}>
          <span className="text-lg">✅</span>
          <span className="font-heading text-lg font-bold text-emerald-600">{score.correct}</span>
        </div>
        <div className="flex items-center gap-2 rounded-2xl bg-white px-4 py-2 shadow-sm" style={{ border: "2px solid rgba(45, 27, 105, 0.06)" }}>
          <span className="text-lg">❌</span>
          <span className="font-heading text-lg font-bold text-rose-500">{score.wrong}</span>
        </div>
        <div className="flex items-center gap-2 rounded-2xl bg-white px-4 py-2 shadow-sm" style={{ border: "2px solid rgba(45, 27, 105, 0.06)" }}>
          <span className="text-sm font-bold text-[#8B7BAD]">
            {options.length - remaining.length}/{options.length}
          </span>
        </div>
      </div>

      {/* Instruction */}
      <p className="text-center font-heading text-base font-bold text-[#2D1B69]">
        Bir öğe seç, sonra doğru gruba yerleştir! 📂
      </p>

      {/* Unsorted Items */}
      {remaining.length > 0 && (
        <div className="w-full max-w-2xl">
          <div className="mb-2 text-center text-xs font-bold uppercase tracking-wider text-[#8B7BAD]">
            Yerleştirilecekler ({remaining.length})
          </div>
          <div className="flex flex-wrap justify-center gap-2.5">
            <AnimatePresence>
              {remaining.map((item) => {
                const isSelected = selectedItem === item.id;
                const fb = feedback?.itemId === item.id ? feedback : null;
                return (
                  <motion.button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedItem(isSelected ? null : item.id)}
                    className="flex items-center gap-2 rounded-2xl px-4 py-3 text-left transition-all duration-200"
                    style={{
                      border: fb
                        ? fb.correct
                          ? "3px solid #22c55e"
                          : "3px solid #ef4444"
                        : isSelected
                          ? "3px solid #6366f1"
                          : "3px solid rgba(45, 27, 105, 0.08)",
                      background: fb
                        ? fb.correct
                          ? "#f0fdf4"
                          : "#fef2f2"
                        : isSelected
                          ? "#eef2ff"
                          : "white",
                      transform: isSelected ? "scale(1.05)" : undefined,
                    }}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{
                      opacity: 1,
                      scale: fb?.correct === false ? [1, 1.05, 0.95, 1] : 1,
                    }}
                    exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.3 } }}
                    layout
                  >
                    {item.imageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.imageUrl} alt="" className="h-10 w-10 rounded-xl object-cover" />
                    )}
                    {item.text && (
                      <span className="font-heading text-sm font-bold text-[#2D1B69]">{item.text}</span>
                    )}
                  </motion.button>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Group Buckets */}
      <div className="grid w-full max-w-2xl gap-4" style={{ gridTemplateColumns: `repeat(${Math.min(groups.length, 3)}, 1fr)` }}>
        {groups.map((group, gi) => {
          const color = theme.cardColors[gi % theme.cardColors.length];
          const items = sorted[group] || [];
          return (
            <motion.button
              key={group}
              type="button"
              onClick={() => handleGroupClick(group)}
              disabled={!selectedItem}
              className="flex flex-col items-center rounded-3xl p-4 transition-all duration-200 hover:shadow-lg disabled:cursor-default"
              style={{
                background: `${color}15`,
                border: `3px dashed ${color}60`,
                minHeight: 140,
              }}
              whileHover={selectedItem ? { scale: 1.02, borderStyle: "solid" } : undefined}
              whileTap={selectedItem ? { scale: 0.98 } : undefined}
            >
              <div
                className="mb-3 rounded-2xl px-4 py-2 font-heading text-sm font-bold text-white shadow-sm"
                style={{ background: color }}
              >
                {group}
              </div>
              <div className="flex flex-wrap justify-center gap-1.5">
                <AnimatePresence>
                  {items.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-1.5 rounded-xl bg-white px-3 py-1.5 text-xs font-bold text-[#2D1B69] shadow-sm"
                      style={{ border: `2px solid ${color}30` }}
                    >
                      {item.imageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.imageUrl} alt="" className="h-6 w-6 rounded-lg object-cover" />
                      )}
                      {item.text && <span>{item.text}</span>}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
              {items.length === 0 && (
                <p className="mt-2 text-xs font-semibold text-[#C5B8DB]">
                  Buraya bırak
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
