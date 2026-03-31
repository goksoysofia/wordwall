"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { playCardOpenSound } from "@/lib/sounds";

export interface CardGridProps {
  options: { id: string; text?: string; imageUrl?: string }[];
  theme: {
    id: string;
    name: string;
    emoji: string;
    backgroundColor: string;
    cardColors: string[];
    cardFrontEmojis: string[];
    celebrationText: string;
  };
  onComplete: () => void;
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

  const idsKey = useMemo(() => initialIds.join(","), [initialIds]);

  useEffect(() => {
    completedRef.current = false;
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
      onComplete();
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
      className="min-h-[100dvh] w-full px-3 py-4 pb-24 md:px-6 md:py-6"
      style={{ backgroundColor: theme.backgroundColor }}
    >
      <div
        className="mx-auto w-full max-w-6xl"
        style={
          {
            display: "grid",
            gap: "clamp(0.75rem, 2vw, 1.25rem)",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 9.5rem), 1fr))",
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
              whileTap={{ scale: 0.97 }}
              onClick={() => openCard(id)}
              className="relative aspect-[4/5] w-full max-w-none rounded-2xl border-0 p-2 shadow-lg outline-none ring-2 ring-black/5 focus-visible:ring-4 focus-visible:ring-purple-400 md:p-2.5"
              style={{
                backgroundColor: theme.backgroundColor,
                boxShadow: "0 10px 28px rgba(0,0,0,0.12), 0 4px 10px rgba(0,0,0,0.08)",
              }}
              aria-label={isOpen ? `Açık kart: ${opt.text ?? "içerik"}` : "Kapalı kart"}
            >
              <div
                className="flex h-full w-full flex-col overflow-hidden rounded-xl"
                style={{ backgroundColor: isOpen ? cardBg : "transparent" }}
              >
                {isOpen ? (
                  <div className="flex h-full min-h-0 flex-1 flex-col items-center justify-center gap-2 p-3 text-center">
                    {opt.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={opt.imageUrl}
                        alt=""
                        className="max-h-[55%] w-full max-w-full rounded-lg object-contain"
                      />
                    ) : null}
                    {opt.text ? (
                      <p className="text-base font-semibold leading-snug text-white drop-shadow-sm md:text-lg">
                        {opt.text}
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <div
                    className="flex h-full w-full items-center justify-center rounded-xl shadow-inner"
                    style={{ backgroundColor: cardBg }}
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

      <div className="fixed bottom-4 left-0 right-0 z-30 flex justify-center px-4">
        <button
          type="button"
          onClick={handleRestart}
          className="rounded-full bg-gray-900 px-6 py-3 text-base font-semibold text-white shadow-lg active:scale-[0.98] md:py-3.5 md:text-lg"
        >
          Yeniden Başlat
        </button>
      </div>

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
              className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
            />

            <motion.div
              initial={{ scale: 0.65, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ type: "spring", damping: 22, stiffness: 280 }}
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
                  <div
                    className="absolute inset-0 flex items-center justify-center rounded-3xl shadow-2xl"
                    style={{
                      backfaceVisibility: "hidden",
                      WebkitBackfaceVisibility: "hidden",
                      backgroundColor: colors[modalIndex % colors.length],
                      boxShadow: "0 24px 48px rgba(0,0,0,0.25)",
                    }}
                  >
                    <span className="text-7xl md:text-8xl" aria-hidden>
                      {emojis[modalIndex % emojis.length]}
                    </span>
                  </div>
                  <div
                    className="absolute inset-0 flex flex-col items-center justify-center gap-4 overflow-hidden rounded-3xl p-6 shadow-2xl"
                    style={{
                      backfaceVisibility: "hidden",
                      WebkitBackfaceVisibility: "hidden",
                      transform: "rotateY(180deg)",
                      backgroundColor: colors[modalIndex % colors.length],
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
                      <p className="text-center text-xl font-bold text-white drop-shadow-md md:text-2xl">
                        {modalOption.text}
                      </p>
                    ) : null}
                  </div>
                </motion.div>
              </div>

              <motion.button
                type="button"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: modalFlipped ? 1 : 0, y: modalFlipped ? 0 : 8 }}
                transition={{ delay: modalFlipped ? 0.35 : 0 }}
                onClick={closeModal}
                className="min-h-[48px] min-w-[200px] rounded-full bg-white px-8 py-3 text-lg font-semibold text-gray-900 shadow-lg active:scale-[0.98]"
              >
                Devam Et
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
