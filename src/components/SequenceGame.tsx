"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { playCorrectSound, playWrongSound, playCelebrationSound, playCardOpenSound } from "@/lib/sounds";
import type { GameStats, WrongItem } from "@/types/game";
import ThemedBackground from "@/components/ThemedBackground";

interface SeqOption {
  id: string;
  text?: string;
  imageUrl?: string;
}

export interface SequenceGameProps {
  options: SeqOption[];
  title: string; // yönerge (örn. "Küçükten büyüğe sırala")
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

export default function SequenceGame({ options, title, theme, showFeedback = true, onComplete }: SequenceGameProps) {
  const startTime = useRef(Date.now());
  const hasCompleted = useRef(false);
  const wrongRef = useRef(0);
  const wrongItemsRef = useRef<WrongItem[]>([]);

  const total = options.length;
  const [pool, setPool] = useState<SeqOption[]>(() => shuffle(options));
  const [placed, setPlaced] = useState<SeqOption[]>([]);
  const [shakeId, setShakeId] = useState<string | null>(null);

  const correctOrderIds = useMemo(() => options.map((o) => o.id), [options]);

  // Öğe boyutu seçenek sayısına göre akışkan ölçeklenir.
  const sizing = useMemo(() => {
    if (total <= 4) return { img: "h-16 w-16 sm:h-20 sm:w-20", text: "text-sm sm:text-base", pad: "px-3 py-2.5", min: "min-w-[68px] sm:min-w-[84px]" };
    if (total <= 6) return { img: "h-14 w-14 sm:h-16 sm:w-16", text: "text-xs sm:text-sm", pad: "px-2.5 py-2", min: "min-w-[60px] sm:min-w-[72px]" };
    return { img: "h-12 w-12 sm:h-14 sm:w-14", text: "text-[11px] sm:text-xs", pad: "px-2 py-1.5", min: "min-w-[54px] sm:min-w-[64px]" };
  }, [total]);

  const handlePoolTap = useCallback(
    (item: SeqOption) => {
      if (hasCompleted.current) return;
      const expectedIndex = placed.length;

      if (showFeedback) {
        if (correctOrderIds[expectedIndex] === item.id) {
          playCorrectSound();
          setPlaced((p) => [...p, item]);
          setPool((p) => p.filter((o) => o.id !== item.id));
        } else {
          playWrongSound();
          wrongRef.current += 1;
          wrongItemsRef.current.push({
            text: item.text || "Öğe",
            correctAnswer: `${expectedIndex + 1}. sıraya ait değil`,
            userAnswer: `${expectedIndex + 1}. sıraya konmaya çalışıldı`,
          });
          setShakeId(item.id);
          setTimeout(() => setShakeId(null), 500);
        }
      } else {
        playCardOpenSound();
        setPlaced((p) => [...p, item]);
        setPool((p) => p.filter((o) => o.id !== item.id));
      }
    },
    [placed.length, showFeedback, correctOrderIds]
  );

  // Geri bildirim kapalıyken yerleştirileni geri al
  const handlePlacedTap = useCallback(
    (item: SeqOption) => {
      if (showFeedback || hasCompleted.current) return;
      setPlaced((p) => p.filter((o) => o.id !== item.id));
      setPool((p) => [...p, item]);
    },
    [showFeedback]
  );

  useEffect(() => {
    if (pool.length === 0 && total > 0 && !hasCompleted.current) {
      hasCompleted.current = true;
      const correctCount = placed.reduce(
        (acc, item, idx) => acc + (correctOrderIds[idx] === item.id ? 1 : 0),
        0
      );
      // Geri bildirim kapalıysa yanlış yerleşenleri kayda geç
      if (!showFeedback) {
        placed.forEach((item, idx) => {
          if (correctOrderIds[idx] !== item.id) {
            wrongItemsRef.current.push({
              text: item.text || "Öğe",
              correctAnswer: `Doğru sıra: ${correctOrderIds.indexOf(item.id) + 1}`,
              userAnswer: `Konulan sıra: ${idx + 1}`,
            });
          }
        });
      }
      playCelebrationSound();
      const stats: GameStats = {
        totalItems: total,
        correctCount: showFeedback ? total : correctCount,
        wrongCount: wrongRef.current + (showFeedback ? 0 : total - correctCount),
        timeSeconds: Math.round((Date.now() - startTime.current) / 1000),
        completedAt: new Date().toISOString(),
        wrongItems: wrongItemsRef.current,
      };
      setTimeout(() => onComplete(stats), 800);
    }
  }, [pool.length, placed, total, correctOrderIds, showFeedback, onComplete]);

  const resetGame = () => {
    setPool(shuffle(options));
    setPlaced([]);
    setShakeId(null);
    wrongRef.current = 0;
    wrongItemsRef.current = [];
    hasCompleted.current = false;
    startTime.current = Date.now();
  };

  const renderCard = (item: SeqOption, variant: "pool" | "placed", index?: number) => (
    <div className="flex flex-col items-center gap-1">
      {item.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.imageUrl}
          alt=""
          className={`${sizing.img} rounded-xl border-2 border-white object-cover shadow-sm`}
        />
      )}
      {item.text && (
        <span className={`text-center font-heading font-bold text-[#2D1B69] ${sizing.text}`}>
          {item.text}
        </span>
      )}
      {variant === "placed" && index !== undefined && (
        <span className="text-[10px] font-bold text-[#8B7BAD]">{index + 1}</span>
      )}
    </div>
  );

  return (
    <div className="relative flex flex-col items-center gap-5 px-3 py-6 md:px-6" style={{ backgroundColor: theme.backgroundColor }}>
      <ThemedBackground decorEmojis={theme.decorEmojis} backgroundColor={theme.backgroundColor} />

      {/* Skor */}
      <div className="z-10 flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-2xl bg-white px-4 py-2 shadow-sm" style={{ border: "2px solid rgba(45, 27, 105, 0.06)" }}>
          <span className="text-lg">🔢</span>
          <span className="font-heading text-lg font-bold text-[#2D1B69]">{placed.length}</span>
          <span className="text-xs font-bold text-[#8B7BAD]">/ {total}</span>
        </div>
        {showFeedback && wrongRef.current > 0 && (
          <div className="flex items-center gap-2 rounded-2xl bg-white px-4 py-2 shadow-sm" style={{ border: "2px solid rgba(45, 27, 105, 0.06)" }}>
            <span className="text-lg">❌</span>
            <span className="font-heading text-lg font-bold text-rose-500">{wrongRef.current}</span>
          </div>
        )}
      </div>

      {/* Yönerge */}
      <motion.div
        className="z-10 w-full max-w-lg rounded-2xl bg-white px-5 py-3 text-center shadow-md"
        style={{ border: "2px solid rgba(45, 27, 105, 0.06)" }}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <p className="font-heading text-base font-bold text-[#2D1B69] sm:text-lg">{title || "Doğru sıraya diz"}</p>
        <p className="mt-1 text-xs font-bold text-[#8B7BAD]">Sırayla dokun: küçükten büyüğe / baştan sona 🔢</p>
      </motion.div>

      {/* Sıralama alanı (hedef) */}
      <div className="z-10 flex w-full max-w-2xl flex-wrap items-stretch justify-center gap-2 rounded-3xl bg-white/60 p-3 sm:gap-3" style={{ border: "3px dashed rgba(45, 27, 105, 0.12)", minHeight: 96 }}>
        {Array.from({ length: total }).map((_, i) => {
          const item = placed[i];
          const color = theme.cardColors[i % theme.cardColors.length];
          return (
            <motion.button
              key={`slot-${i}`}
              type="button"
              onClick={() => item && handlePlacedTap(item)}
              disabled={!item || showFeedback}
              className={`flex flex-col items-center justify-center rounded-2xl ${sizing.pad} ${sizing.min} disabled:cursor-default`}
              style={{
                background: item ? "white" : `${color}10`,
                border: item ? `3px solid ${color}` : `2px dashed ${color}80`,
              }}
              whileTap={item && !showFeedback ? { scale: 0.94 } : undefined}
              layout
            >
              {item ? (
                renderCard(item, "placed", i)
              ) : (
                <span className="font-heading text-lg font-bold" style={{ color: `${color}` }}>{i + 1}</span>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Havuz */}
      <div className="z-10 flex w-full max-w-2xl flex-wrap items-stretch justify-center gap-2 sm:gap-3">
        <AnimatePresence>
          {pool.map((item) => (
            <motion.button
              key={item.id}
              type="button"
              onClick={() => handlePoolTap(item)}
              className={`flex flex-col items-center justify-center rounded-2xl bg-white ${sizing.pad} ${sizing.min} shadow-md`}
              style={{ border: "3px solid rgba(45, 27, 105, 0.08)" }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{
                opacity: 1,
                scale: 1,
                x: shakeId === item.id ? [0, -8, 8, -6, 6, 0] : 0,
                borderColor: shakeId === item.id ? "#ef4444" : "rgba(45, 27, 105, 0.08)",
              }}
              exit={{ opacity: 0, scale: 0.6, transition: { duration: 0.2 } }}
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.94 }}
              layout
            >
              {renderCard(item, "pool")}
            </motion.button>
          ))}
        </AnimatePresence>
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
