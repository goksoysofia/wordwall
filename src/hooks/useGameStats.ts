"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { GameStats, WrongItem } from "@/types/game";

/**
 * Optional overrides for {@link UseGameStats.buildStats}. Any field left
 * undefined falls back to the value tracked internally by the hook.
 *
 * Games where every item counts as correct (card decks, wheels, flashcards)
 * pass `correctCount` explicitly; games with bespoke scoring (memory, bingo)
 * pass both `correctCount` and `wrongCount`; quiz-like games pass only
 * `totalItems` and let the recorded counters fill in the rest.
 */
export interface BuildStatsArgs {
  /** Total number of scorable items in the activity. */
  totalItems: number;
  /** Overrides the recorded correct count. */
  correctCount?: number;
  /** Overrides the recorded wrong count. */
  wrongCount?: number;
  /** Overrides the recorded wrong-item details. */
  wrongItems?: readonly WrongItem[];
}

export interface UseGameStats {
  /** Recorded correct answers, suitable for rendering a live score. */
  readonly correctCount: number;
  /** Recorded wrong answers, suitable for rendering a live score. */
  readonly wrongCount: number;
  /** Recorded wrong-item details for the post-game report. */
  readonly wrongItems: readonly WrongItem[];
  /**
   * Whether the game has been latched complete (see
   * {@link UseGameStats.markCompleted}). Exposed as reactive state so the UI can
   * gate interactions or hide controls after completion without reading a ref
   * during render.
   */
  readonly isCompleted: boolean;
  /** Increments the correct counter by `amount` (default 1). */
  recordCorrect: (amount?: number) => void;
  /**
   * Increments the wrong counter by 1 and, when provided, appends `item` to the
   * wrong-item report list.
   */
  recordWrong: (item?: WrongItem) => void;
  /**
   * Builds an immutable {@link GameStats} snapshot. Computes `timeSeconds` from
   * the elapsed time since mount (or the last {@link UseGameStats.reset}). Reads
   * the latest counters from internal refs, so it is safe to call from
   * `setTimeout`/async callbacks without stale-closure bugs.
   */
  buildStats: (args: BuildStatsArgs) => GameStats;
  /**
   * Idempotent completion latch. Returns `true` exactly once — the first time it
   * is called after mount or {@link UseGameStats.reset} — and `false` on every
   * subsequent call. Use it to guarantee `onComplete` fires only once:
   *
   * @example
   * if (allItemsDone && markCompleted()) {
   *   onComplete(buildStats({ totalItems }));
   * }
   */
  markCompleted: () => boolean;
  /** Resets counters, wrong items, the completion latch, and the timer. */
  reset: () => void;
}

/**
 * Centralizes the per-game bookkeeping shared by every activity component:
 * elapsed-time tracking, correct/wrong tallies, the wrong-item report list, a
 * one-shot completion latch, and assembling the final {@link GameStats}.
 *
 * Counters are exposed as React state (so the live score re-renders) while the
 * authoritative values are mirrored into refs (so {@link UseGameStats.buildStats}
 * reads the latest values even when invoked from a delayed callback). The timer
 * is started in a mount effect rather than during render, keeping the hook pure
 * with respect to React's rules of hooks.
 */
export function useGameStats(): UseGameStats {
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [wrongItems, setWrongItems] = useState<readonly WrongItem[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);

  // Refs are the source of truth read by buildStats; state mirrors them for the UI.
  const correctRef = useRef(0);
  const wrongRef = useRef(0);
  const wrongItemsRef = useRef<WrongItem[]>([]);
  const completedRef = useRef(false);
  // 0 means "not started yet"; set in the mount effect below.
  const startedAtRef = useRef(0);

  useEffect(() => {
    startedAtRef.current = Date.now();
  }, []);

  const recordCorrect = useCallback((amount = 1) => {
    correctRef.current += amount;
    setCorrectCount(correctRef.current);
  }, []);

  const recordWrong = useCallback((item?: WrongItem) => {
    wrongRef.current += 1;
    setWrongCount(wrongRef.current);
    if (item) {
      wrongItemsRef.current = [...wrongItemsRef.current, item];
      setWrongItems(wrongItemsRef.current);
    }
  }, []);

  const buildStats = useCallback((args: BuildStatsArgs): GameStats => {
    const elapsedMs = startedAtRef.current === 0 ? 0 : Date.now() - startedAtRef.current;
    return {
      totalItems: args.totalItems,
      correctCount: args.correctCount ?? correctRef.current,
      wrongCount: args.wrongCount ?? wrongRef.current,
      timeSeconds: Math.max(0, Math.round(elapsedMs / 1000)),
      completedAt: new Date().toISOString(),
      wrongItems: args.wrongItems ? [...args.wrongItems] : [...wrongItemsRef.current],
    };
  }, []);

  const markCompleted = useCallback(() => {
    if (completedRef.current) return false;
    completedRef.current = true;
    setIsCompleted(true);
    return true;
  }, []);

  const reset = useCallback(() => {
    correctRef.current = 0;
    wrongRef.current = 0;
    wrongItemsRef.current = [];
    completedRef.current = false;
    startedAtRef.current = Date.now();
    setCorrectCount(0);
    setWrongCount(0);
    setWrongItems([]);
    setIsCompleted(false);
  }, []);

  return {
    correctCount,
    wrongCount,
    wrongItems,
    isCompleted,
    recordCorrect,
    recordWrong,
    buildStats,
    markCompleted,
    reset,
  };
}
