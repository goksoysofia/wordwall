import { describe, expect, it } from "vitest";
import { seededRandom, shuffle } from "./shuffle";

describe("shuffle", () => {
  it("returns a new array and never mutates the input", () => {
    const input = [1, 2, 3, 4, 5];
    const output = shuffle(input);
    expect(output).not.toBe(input);
    expect(input).toEqual([1, 2, 3, 4, 5]);
  });

  it("preserves every element exactly once (it is a permutation)", () => {
    const input = ["a", "b", "c", "d", "e", "f"];
    const output = shuffle(input);
    expect([...output].sort()).toEqual([...input].sort());
    expect(output).toHaveLength(input.length);
  });

  it("is deterministic when given a deterministic rng", () => {
    // rng() === 0 makes Fisher–Yates rotate the last element to the front at
    // each step, yielding a fixed, reproducible permutation.
    const input = [1, 2, 3, 4];
    expect(shuffle(input, () => 0)).toEqual(shuffle(input, () => 0));
  });

  it("handles empty and single-element arrays", () => {
    expect(shuffle([])).toEqual([]);
    expect(shuffle([42])).toEqual([42]);
  });

  it("actually permutes the elements", () => {
    // rng() === 0 rotates the last element to the front at each step, so the
    // ordering provably differs from the identity for length >= 2.
    expect(shuffle([1, 2, 3, 4, 5], () => 0)).toEqual([2, 3, 4, 5, 1]);
  });
});

describe("seededRandom", () => {
  it("yields the same sequence for the same seed", () => {
    const a = seededRandom(42);
    const b = seededRandom(42);
    const seqA = [a(), a(), a(), a()];
    const seqB = [b(), b(), b(), b()];
    expect(seqA).toEqual(seqB);
  });

  it("yields different sequences for different seeds", () => {
    const a = seededRandom(1);
    const b = seededRandom(2);
    expect([a(), a(), a()]).not.toEqual([b(), b(), b()]);
  });

  it("produces values in the half-open interval [0, 1)", () => {
    const rng = seededRandom(7);
    for (let i = 0; i < 100; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it("makes shuffle reproducible for a given seed", () => {
    const input = ["a", "b", "c", "d", "e"];
    expect(shuffle(input, seededRandom(99))).toEqual(shuffle(input, seededRandom(99)));
  });
});
