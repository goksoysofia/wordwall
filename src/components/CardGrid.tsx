"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { playCardOpenSound } from "@/lib/sounds";
import type { GameStats } from "@/types/game";
import ThemedBackground from "@/components/ThemedBackground";

export interface CardGridProps {
  options: { id: string; text?: string; imageUrl?: string }[];
  theme: {
    id: string;
    name: string;
    emoji: string;
    backgroundColor: string;
    cardColors: string[];
    cardFrontEmojis: string[];
    decorEmojis: string[];
    celebrationText: string;
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

function restartOrder(ids: string[], wasOpened: Set<string>): string[] {
  const opened = ids.filter((id) => wasOpened.has(id));
  const unopened = ids.filter((id) => !wasOpened.has(id));
  return [...shuffle(unopened), ...shuffle(opened)];
}

export default function CardGrid({ options, theme, onComplete }: CardGridProps) {
  const optionMap = useMemo(() => new Map(options.map((o) => [o.id, o])), [options]);
  const initialIds = useMemo(() => options.map((o) => o.id), [options]);

  const [orderedIds, setOrderedIds] = useState<string[]>(() => [...initialIds]);
  const [openedIds, setOpenedIds] = useState<Set<string>>(() => new Set());
  const [modalCardId, setModalCardId] = useState<string | null>(null);
  const [modalFlipped, setModalFlipped] = useState(false);
  const completedRef = useRef(false);
  const startTime = useRef(Date.now());

  const idsKey = useMemo(() => initialIds.join(","), [initialIds]);

  useEffect(() => {
    completedRef.current = false;
    startTime.current = Date.now();
    setOpenedIds(new Set());
    setModalCardId(null);
    setModalFlipped(false);
  }, [idsKey]);

  useEffect(() => {
    setOrderedIds((prev) => {
      const next = initialIds;
      if (prev.length === next.length && prev.every((id, i) => id === next[i])) return prev;
      return [...next];
    });
  }, [initialIds]);

  useEffect(() => {
    if (options.length === 0) return;
    if (openedIds.size === options.length && !completedRef.current) {
      completedRef.current = true;
      onComplete({
        totalItems: options.length,
        correctCount: options.length,
        wrongCount: 0,
        timeSeconds: Math.round((Date.now() - startTime.current) / 1000),
        completedAt: new Date().toISOString(),
        wrongItems: [],
      });
    }
  }, [openedIds.size, options.length, onComplete]);

  const openCard = useCallback((id: string) => {
    if (openedIds.has(id)) return;
    playCardOpenSound();
    setModalCardId(id);
    setModalFlipped(false);
    requestAnimationFrame(() => {
      setModalFlipped(true);
    });
  }, [openedIds]);

  const closeModal = useCallback(() => {
    if (modalCardId) {
      setOpenedIds((s) => new Set(s).add(modalCardId));
    }
    setModalCardId(null);
    setModalFlipped(false);
  }, [modalCardId]);

  const handleRestart = useCallback(() => {
    completedRef.current = false;
    startTime.current = Date.now();
    setOrderedIds((prev) => restartOrder(prev, openedIds));
    setOpenedIds(new Set());
    setModalCardId(null);
    setModalFlipped(false);
  }, [openedIds]);

  const modalOption = modalCardId ? optionMap.get(modalCardId) : undefined;
  const modalIndex = modalCardId ? orderedIds.indexOf(modalCardId) : -1;

  const emojis = theme.cardFrontEmojis;
  const colors = theme.cardColors;

  return (
    <div
      className="relative min-h-[100dvh] w-full px-3 py-6 pb-28 md:px-6 md:py-8"
      style={{ backgroundColor: theme.backgroundColor }}
    >
      <ThemedBackground decorEmojis={theme.decorEmojis} backgroundColor={theme.backgroundColor} />
      <div
        className="mx-auto w-full max-w-6xl"
        style={
          {
            display: "grid",
            gap: "clamp(0.875rem, 2.5vw, 1.5rem)",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 10rem), 1fr))",
          } as React.CSSProperties
        }
      >
        {orderedIds.map((id, index) => {
          const opt = optionMap.get(id);
          if (!opt) return null;
          const isOpen = openedIds.has(id);
          const emoji = emojis[index % emojis.length];
          const cardBg = colors[index % colors.length];

          return (
            <motion.button
              key={id}
              type="button"
              layout
              whileTap={{ scale: 0.95 }}
              onClick={() => openCard(id)}
              className="relative aspect-[4/5] w-full max-w-none rounded-3xl border-0 p-2.5 outline-none focus-visible:ring-4 focus-visible:ring-[#FF6B9D]/40 md:p-3"
              style={{
                backgroundColor: "white",
                border: "2px solid rgba(45, 27, 105, 0.06)",
                boxShadow: "0 4px 0 rgba(45, 27, 105, 0.04), 0 10px 28px rgba(45, 27, 105, 0.08)",
              }}
              aria-label={isOpen ? `Açık kart: ${opt.text ?? "içerik"}` : "Kapalı kart"}
            >
              <div
                className="flex h-full w-full flex-col overflow-hidden rounded-2xl"
                style={{ backgroundColor: isOpen ? cardBg : "transparent" }}
              >
                {isOpen ? (
                  <div className="flex h-full min-h-0 flex-1 flex-col items-center justify-center gap-2 p-3 text-center">
                    {opt.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={opt.imageUrl}
                        alt=""
                        className="max-h-[55%] w-full max-w-full rounded-xl object-contain"
                      />
                    ) : null}
                    {opt.text ? (
                      <p className="font-heading text-base font-bold leading-snug text-white drop-shadow-sm md:text-lg">
                        {opt.text}
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <div
                    className="flex h-full w-full items-center justify-center rounded-2xl"
                    style={{
                      backgroundColor: cardBg,
                      boxShadow: "inset 0 2px 8px rgba(0,0,0,0.1)",
                    }}
                  >
                    <span className="select-none text-5xl md:text-6xl" aria-hidden>
                      {emoji}
                    </span>
                  </div>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Restart button */}
      <div className="fixed bottom-5 left-0 right-0 z-30 flex justify-center px-4">
        <button
          type="button"
          onClick={handleRestart}
          className="btn-candy rounded-full px-8 py-3.5 text-base md:text-lg"
        >
          🔄 Yeniden Başlat
        </button>
      </div>

      {/* Card Modal */}
      <AnimatePresence>
        {modalCardId && modalOption && modalIndex >= 0 && (
          <motion.div
            key={modalCardId}
            role="dialog"
            aria-modal="true"
            aria-label="Kart"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex flex-col items-center justify-center p-4"
            onClick={closeModal}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-[3px]"
            />

            <motion.div
              initial={{ scale: 0.6, opacity: 0, rotate: -5 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ type: "spring", damping: 20, stiffness: 260 }}
              className="relative z-10 flex w-full max-w-md flex-col items-center gap-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative h-[min(58vh,420px)] w-full max-w-sm [perspective:1000px]">
                <motion.div
                  className="relative h-full w-full"
                  style={{ transformStyle: "preserve-3d" }}
                  initial={{ rotateY: 0 }}
                  animate={{ rotateY: modalFlipped ? 180 : 0 }}
                  transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                >
                  {/* Card front (emoji side) */}
                  <div
                    className="absolute inset-0 flex items-center justify-center rounded-3xl"
                    style={{
                      backfaceVisibility: "hidden",
                      WebkitBackfaceVisibility: "hidden",
                      backgroundColor: colors[modalIndex % colors.length],
                      boxShadow: "0 24px 48px rgba(45, 27, 105, 0.25), 0 0 0 4px rgba(255,255,255,0.6)",
                    }}
                  >
                    <span className="text-7xl md:text-8xl" aria-hidden>
                      {emojis[modalIndex % emojis.length]}
                    </span>
                  </div>
                  {/* Card back (content side) */}
                  <div
                    className="absolute inset-0 flex flex-col items-center justify-center gap-4 overflow-hidden rounded-3xl p-6"
                    style={{
                      backfaceVisibility: "hidden",
                      WebkitBackfaceVisibility: "hidden",
                      transform: "rotateY(180deg)",
                      backgroundColor: colors[modalIndex % colors.length],
                      boxShadow: "0 24px 48px rgba(45, 27, 105, 0.25), 0 0 0 4px rgba(255,255,255,0.6)",
                    }}
                  >
                    {modalOption.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={modalOption.imageUrl}
                        alt=""
                        className="max-h-[45%] w-full object-contain"
                      />
                    ) : null}
                    {modalOption.text ? (
                      <p className="text-center font-heading text-2xl font-bold text-white drop-shadow-md md:text-3xl">
                        {modalOption.text}
                      </p>
                    ) : null}
                  </div>
                </motion.div>
              </div>

              <motion.button
                type="button"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: modalFlipped ? 1 : 0, y: modalFlipped ? 0 : 12 }}
                transition={{ delay: modalFlipped ? 0.35 : 0 }}
                onClick={closeModal}
                className="btn-candy min-h-[52px] min-w-[200px] rounded-full px-8 py-3.5 text-lg"
              >
                Devam Et →
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
