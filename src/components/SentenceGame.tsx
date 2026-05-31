"use client";

import { useCallback, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { playCorrectSound, playWrongSound, playCelebrationSound, playFlipSound } from "@/lib/sounds";
import { shuffle } from "@/lib/shuffle";
import { useGameStats } from "@/hooks/useGameStats";
import type { GameStats } from "@/types/game";
import ThemedBackground from "@/components/ThemedBackground";

interface SentOption {
  id: string;
  text?: string;
}

export interface SentenceGameProps {
  options: SentOption[]; // çeldirici kelimeler (isteğe bağlı)
  title: string; // doğru cümle
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
  word: string;
  distractor: boolean;
}

export default function SentenceGame({ options, title, theme, showFeedback = true, onComplete }: SentenceGameProps) {
  const { isCompleted, recordWrong, markCompleted, buildStats, reset } = useGameStats();

  const targetWords = useMemo(() => title.trim().split(/\s+/).filter(Boolean), [title]);

  const allTiles = useMemo<Tile[]>(() => {
    const wordTiles: Tile[] = targetWords.map((w, i) => ({ id: `w-${i}`, word: w, distractor: false }));
    const distractorTiles: Tile[] = options
      .filter((o) => o.text && o.text.trim())
      .map((o, i) => ({ id: `d-${o.id}-${i}`, word: o.text!.trim(), distractor: true }));
    return shuffle([...wordTiles, ...distractorTiles]);
  }, [targetWords, options]);

  const [strip, setStrip] = useState<Tile[]>([]);
  const [checked, setChecked] = useState(false);

  const pool = useMemo(
    () => allTiles.filter((t) => !strip.some((s) => s.id === t.id)),
    [allTiles, strip]
  );

  const stripWords = strip.map((t) => t.word);
  const isCorrect = useMemo(
    () => stripWords.length === targetWords.length && stripWords.every((w, i) => w === targetWords[i]),
    [stripWords, targetWords]
  );

  const addTile = useCallback(
    (tile: Tile) => {
      if (checked && showFeedback) return;
      playFlipSound();
      setStrip((s) => [...s, tile]);
      setChecked(false);
    },
    [checked, showFeedback]
  );

  const removeTile = useCallback(
    (tile: Tile) => {
      if (checked && showFeedback && isCorrect) return;
      playFlipSound();
      setStrip((s) => s.filter((t) => t.id !== tile.id));
      setChecked(false);
    },
    [checked, showFeedback, isCorrect]
  );

  const complete = useCallback(
    (correct: boolean) => {
      if (!markCompleted()) return;
      if (!correct) {
        recordWrong({
          text: title.trim(),
          correctAnswer: targetWords.join(" "),
          userAnswer: stripWords.join(" ") || "(boş)",
        });
      }
      playCelebrationSound();
      const stats = buildStats({ totalItems: 1, correctCount: correct ? 1 : 0 });
      setTimeout(() => onComplete(stats), 900);
    },
    [title, targetWords, stripWords, onComplete, markCompleted, recordWrong, buildStats]
  );

  const handleCheck = useCallback(() => {
    if (!showFeedback) {
      // Geri bildirim kapalı: cevabı kaydet ve tamamla
      complete(isCorrect);
      return;
    }
    setChecked(true);
    if (isCorrect) {
      playCorrectSound();
      complete(true);
    } else {
      playWrongSound();
      recordWrong();
    }
  }, [showFeedback, isCorrect, complete, recordWrong]);

  const resetGame = () => {
    setStrip([]);
    setChecked(false);
    reset();
  };

  const tileClass = "rounded-2xl px-4 py-2.5 font-heading text-base font-bold shadow-sm sm:text-lg";

  return (
    <div className="relative flex flex-col items-center gap-6 px-3 py-6 md:px-6" style={{ backgroundColor: theme.backgroundColor }}>
      <ThemedBackground decorEmojis={theme.decorEmojis} backgroundColor={theme.backgroundColor} />

      {/* Yönerge */}
      <motion.div
        className="z-10 w-full max-w-lg rounded-2xl bg-white px-5 py-3 text-center shadow-md"
        style={{ border: "2px solid rgba(45, 27, 105, 0.06)" }}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <p className="text-xs font-bold uppercase tracking-wider text-[#8B7BAD]">Cümleyi Kur ✏️</p>
        <p className="mt-1 font-heading text-sm font-bold text-[#2D1B69]">Kelimelere dokunarak doğru cümleyi oluştur</p>
      </motion.div>

      {/* Cevap şeridi */}
      <div
        className="z-10 flex min-h-[72px] w-full max-w-2xl flex-wrap content-start items-center justify-center gap-2 rounded-3xl bg-white/70 p-3"
        style={{ border: "3px dashed rgba(45, 27, 105, 0.14)" }}
      >
        {strip.length === 0 && (
          <span className="py-3 text-sm font-semibold text-[#C5B8DB]">Kelimeleri buraya ekle…</span>
        )}
        <AnimatePresence>
          {strip.map((tile, i) => {
            const wordCorrect = checked && showFeedback ? tile.word === targetWords[i] : null;
            return (
              <motion.button
                key={tile.id}
                type="button"
                onClick={() => removeTile(tile)}
                className={tileClass}
                style={{
                  background: wordCorrect === true ? "#f0fdf4" : wordCorrect === false ? "#fef2f2" : "white",
                  border:
                    wordCorrect === true
                      ? "3px solid #22c55e"
                      : wordCorrect === false
                        ? "3px solid #ef4444"
                        : "3px solid rgba(45, 27, 105, 0.1)",
                  color: "#2D1B69",
                }}
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.6, transition: { duration: 0.15 } }}
                whileTap={{ scale: 0.92 }}
                layout
              >
                {tile.word}
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Kelime havuzu */}
      <div className="z-10 flex w-full max-w-2xl flex-wrap items-center justify-center gap-2 sm:gap-3">
        <AnimatePresence>
          {pool.map((tile, idx) => {
            const color = theme.cardColors[idx % theme.cardColors.length];
            return (
              <motion.button
                key={tile.id}
                type="button"
                onClick={() => addTile(tile)}
                className={tileClass}
                style={{ background: "white", border: `3px solid ${color}`, color: "#2D1B69" }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.6, transition: { duration: 0.15 } }}
                whileHover={{ scale: 1.06, background: `${color}15` }}
                whileTap={{ scale: 0.92 }}
                layout
              >
                {tile.word}
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Geri bildirim */}
      {checked && showFeedback && !isCorrect && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="z-10 rounded-2xl bg-rose-100 px-5 py-2.5 text-center font-heading text-sm font-bold text-rose-700 shadow-md"
        >
          Tekrar dene! Kelimeleri düzenle 💪
        </motion.div>
      )}

      {/* Kontrol / Onayla */}
      {strip.length > 0 && !isCompleted && (
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
