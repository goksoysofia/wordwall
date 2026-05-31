import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useGameStats } from "./useGameStats";

describe("useGameStats", () => {
  it("records correct and wrong answers", () => {
    const { result } = renderHook(() => useGameStats());

    act(() => {
      result.current.recordCorrect();
      result.current.recordCorrect(2);
      result.current.recordWrong({ text: "elma", correctAnswer: "armut" });
    });

    expect(result.current.correctCount).toBe(3);
    expect(result.current.wrongCount).toBe(1);
    expect(result.current.wrongItems).toEqual([{ text: "elma", correctAnswer: "armut" }]);
  });

  it("recordWrong without detail still increments the counter", () => {
    const { result } = renderHook(() => useGameStats());

    act(() => {
      result.current.recordWrong();
    });

    expect(result.current.wrongCount).toBe(1);
    expect(result.current.wrongItems).toEqual([]);
  });

  it("buildStats defaults to the recorded counters", () => {
    const { result } = renderHook(() => useGameStats());

    act(() => {
      result.current.recordCorrect();
      result.current.recordWrong({ text: "x" });
    });

    const stats = result.current.buildStats({ totalItems: 5 });
    expect(stats.totalItems).toBe(5);
    expect(stats.correctCount).toBe(1);
    expect(stats.wrongCount).toBe(1);
    expect(stats.wrongItems).toEqual([{ text: "x" }]);
    expect(typeof stats.completedAt).toBe("string");
  });

  it("buildStats honors explicit overrides (all-correct games)", () => {
    const { result } = renderHook(() => useGameStats());

    const stats = result.current.buildStats({
      totalItems: 8,
      correctCount: 8,
      wrongCount: 0,
      wrongItems: [],
    });

    expect(stats.correctCount).toBe(8);
    expect(stats.wrongCount).toBe(0);
    expect(stats.wrongItems).toEqual([]);
  });

  it("buildStats returns a defensive copy of wrong items", () => {
    const { result } = renderHook(() => useGameStats());

    act(() => {
      result.current.recordWrong({ text: "a" });
    });
    const stats = result.current.buildStats({ totalItems: 1 });

    act(() => {
      result.current.recordWrong({ text: "b" });
    });

    // The previously built snapshot must not see later mutations.
    expect(stats.wrongItems).toEqual([{ text: "a" }]);
  });

  it("markCompleted latches exactly once and exposes isCompleted", () => {
    const { result } = renderHook(() => useGameStats());

    expect(result.current.isCompleted).toBe(false);

    let first = false;
    let second = false;
    act(() => {
      first = result.current.markCompleted();
      second = result.current.markCompleted();
    });

    expect(first).toBe(true);
    expect(second).toBe(false);
    expect(result.current.isCompleted).toBe(true);
  });

  it("reset clears counters, wrong items, and the completion latch", () => {
    const { result } = renderHook(() => useGameStats());

    act(() => {
      result.current.recordCorrect();
      result.current.recordWrong({ text: "x" });
      result.current.markCompleted();
    });

    act(() => {
      result.current.reset();
    });

    expect(result.current.correctCount).toBe(0);
    expect(result.current.wrongCount).toBe(0);
    expect(result.current.wrongItems).toEqual([]);
    expect(result.current.isCompleted).toBe(false);

    let canCompleteAgain = false;
    act(() => {
      canCompleteAgain = result.current.markCompleted();
    });
    expect(canCompleteAgain).toBe(true);
  });

  describe("timeSeconds", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });
    afterEach(() => {
      vi.useRealTimers();
    });

    it("reflects elapsed wall-clock time and is never negative", () => {
      vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
      const { result } = renderHook(() => useGameStats());

      // Advance 12.4s; buildStats should round to 12.
      act(() => {
        vi.advanceTimersByTime(12_400);
      });
      expect(result.current.buildStats({ totalItems: 1 }).timeSeconds).toBe(12);
    });
  });
});
