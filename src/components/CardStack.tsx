"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { playCardOpenSound } from "@/lib/sounds";
import type { GameStats } from "@/types/game";
import ThemedBackground from "@/components/ThemedBackground";

function useIsNarrowMobile() {
  const subscribe = useCallback((onStoreChange: () => void) => {
    const mq = window.matchMedia("(max-width: 767px)");
    mq.addEventListener("change", onStoreChange);
    return () => mq.removeEventListener("change", onStoreChange);
  }, []);
  const getSnapshot = useCallback(() => window.matchMedia("(max-width: 767px)").matches, []);
  const getServerSnapshot = useCallback(() => false, []);
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export interface CardStackProps {
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

export default function CardStack({ options, theme, onComplete }: CardStackProps) {
  const isMobile = useIsNarrowMobile();
  const optionMap = useMemo(() => new Map(options.map((o) => [o.id, o])), [options]);
  const initialIds = useMemo(() => options.map((o) => o.id), [options]);

  const [orderedIds, setOrderedIds] = useState<string[]>(() => [...initialIds]);
  const [openedIds, setOpenedIds] = useState<Set<string>>(() => new Set());
  const [currentOpenId, setCurrentOpenId] = useState<string | null>(null);
  const [flipOpen, setFlipOpen] = useState(false);
  const completedRef = useRef(false);
  const startTime = useRef(Date.now());

  const idsKey = useMemo(() => initialIds.join(","), [initialIds]);

  useEffect(() => {
    completedRef.current = false;
    startTime.current = Date.now();
    setOpenedIds(new Set());
    setCurrentOpenId(null);
    setFlipOpen(false);
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

  const closedStack = useMemo(
    () => orderedIds.filter((id) => !openedIds.has(id)),
    [orderedIds, openedIds]
  );

  const handleRestart = useCallback(() => {
    completedRef.current = false;
    startTime.current = Date.now();
    setOrderedIds((prev) => restartOrder(prev, openedIds));
    setOpenedIds(new Set());
    setCurrentOpenId(null);
    setFlipOpen(false);
  }, [openedIds]);

  const drawTopCard = useCallback(() => {
    if (closedStack.length === 0) return;
    const id = closedStack[closedStack.length - 1];
    playCardOpenSound();
    setCurrentOpenId(id);
    setFlipOpen(false);
    setOpenedIds((s) => new Set(s).add(id));
    requestAnimationFrame(() => setFlipOpen(true));
  }, [closedStack]);

  const topId = closedStack.length > 0 ? closedStack[closedStack.length - 1] : null;
  const currentOption = currentOpenId ? optionMap.get(currentOpenId) : undefined;
  const currentIndex = currentOpenId ? orderedIds.indexOf(currentOpenId) : -1;

  const emojis = theme.cardFrontEmojis;
  const colors = theme.cardColors;

  return (
    <div
      className="relative flex min-h-[100dvh] w-full flex-col md:flex-row md:gap-6"
      style={{ backgroundColor: theme.backgroundColor }}
    >
      <ThemedBackground decorEmojis={theme.decorEmojis} backgroundColor={theme.backgroundColor} />
      {/* Stack area */}
      <div className="relative flex min-h-[260px] flex-1 items-end justify-center pb-4 pt-8 md:min-h-0 md:max-w-[48%] md:items-center md:pb-8 md:pt-8">
        <div className="relative h-[240px] w-full max-w-sm md:h-[min(70vh,480px)] md:max-w-md">
          {closedStack.map((id, stackIndex) => {
            const opt = optionMap.get(id);
            if (!opt) return null;
            const orderIndex = orderedIds.indexOf(id);
            const emoji = emojis[orderIndex % emojis.length];
            const cardBg = colors[orderIndex % colors.length];
            const depthFromTop = closedStack.length - 1 - stackIndex;
            const isTop = id === topId;
            const fanRotate = (stackIndex - (closedStack.length - 1) / 2) * 5;
            const offsetY = depthFromTop * 10;
            const offsetX = (stackIndex - (closedStack.length - 1) / 2) * 6;

            return (
              <motion.button
                key={id}
                type="button"
                disabled={!isTop}
                onClick={() => isTop && drawTopCard()}
                className="absolute left-1/2 top-1/2 h-[min(42vw,12rem)] w-[min(58vw,15rem)] -translate-x-1/2 -translate-y-1/2 rounded-3xl border-0 p-0 outline-none disabled:cursor-default md:h-56 md:w-48"
                style={{
                  zIndex: stackIndex + 1,
                  x: offsetX,
                  y: offsetY,
                  rotate: fanRotate,
                  pointerEvents: isTop ? "auto" : "none",
                  boxShadow: "0 4px 0 rgba(45, 27, 105, 0.04), 0 12px 32px rgba(45, 27, 105, 0.12)",
                  border: "2px solid rgba(255,255,255,0.8)",
                }}
                whileTap={isTop ? { scale: 0.96 } : undefined}
                aria-label={isTop ? "Üstteki kartı aç" : undefined}
              >
                <div
                  className="flex h-full w-full items-center justify-center rounded-3xl"
                  style={{ backgroundColor: cardBg }}
                >
                  <span className="text-5xl md:text-6xl" aria-hidden>
                    {emoji}
                  </span>
                </div>
              </motion.button>
            );
          })}
          {closedStack.length === 0 && (
            <p className="absolute inset-0 flex items-center justify-center text-center font-heading text-lg font-bold text-[#8B7BAD]">
              Tüm kartlar açıldı 🎉
            </p>
          )}
        </div>
      </div>

      {/* Opened card area */}
      <div className="relative flex flex-1 flex-col items-center justify-start px-4 pb-28 pt-4 md:justify-center md:pb-12 md:pt-8">
        <AnimatePresence mode="wait">
          {currentOpenId && currentOption && currentIndex >= 0 ? (
            <motion.div
              key={currentOpenId}
              initial={
                isMobile
                  ? { x: 0, y: 36, opacity: 0, scale: 0.92 }
                  : { x: -72, y: 0, opacity: 0, scale: 0.92 }
              }
              animate={{ x: 0, y: 0, opacity: 1, scale: 1 }}
              exit={
                isMobile
                  ? { y: -28, opacity: 0, scale: 0.9 }
                  : { x: 100, opacity: 0, scale: 0.9 }
              }
              transition={{ type: "spring", damping: 24, stiffness: 260 }}
              className="flex w-full max-w-md flex-col items-center gap-4"
            >
              <div className="relative aspect-[4/5] w-full max-w-sm [perspective:1000px]">
                <motion.div
                  className="relative h-full w-full"
                  style={{ transformStyle: "preserve-3d" }}
                  initial={{ rotateY: 0 }}
                  animate={{ rotateY: flipOpen ? 180 : 0 }}
                  transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div
                    className="absolute inset-0 flex items-center justify-center rounded-3xl"
                    style={{
                      backfaceVisibility: "hidden",
                      WebkitBackfaceVisibility: "hidden",
                      backgroundColor: colors[currentIndex % colors.length],
                      boxShadow: "0 4px 0 rgba(45, 27, 105, 0.04), 0 24px 48px rgba(45, 27, 105, 0.15)",
                      border: "2px solid rgba(255,255,255,0.6)",
                    }}
                  >
                    <span className="text-7xl md:text-8xl" aria-hidden>
                      {emojis[currentIndex % emojis.length]}
                    </span>
                  </div>
                  <div
                    className="absolute inset-0 flex flex-col items-center justify-center gap-4 overflow-hidden rounded-3xl p-6"
                    style={{
                      backfaceVisibility: "hidden",
                      WebkitBackfaceVisibility: "hidden",
                      transform: "rotateY(180deg)",
                      backgroundColor: colors[currentIndex % colors.length],
                      boxShadow: "0 4px 0 rgba(45, 27, 105, 0.04), 0 24px 48px rgba(45, 27, 105, 0.15)",
                      border: "2px solid rgba(255,255,255,0.6)",
                    }}
                  >
                    {currentOption.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={currentOption.imageUrl}
                        alt=""
                        className="max-h-[45%] w-full object-contain"
                      />
                    ) : null}
                    {currentOption.text ? (
                      <p className="text-center font-heading text-2xl font-bold text-white drop-shadow-md md:text-3xl">
                        {currentOption.text}
                      </p>
                    ) : null}
                  </div>
                </motion.div>
              </div>
            </motion.div>
          ) : (
            <motion.p
              key="placeholder"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center font-heading text-lg font-bold text-[#8B7BAD] md:mt-0"
            >
              Desteden bir kart seç 👆
            </motion.p>
          )}
        </AnimatePresence>
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
    </div>
  );
}
