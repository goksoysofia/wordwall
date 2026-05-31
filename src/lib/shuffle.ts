/**
 * Returns a new array containing the elements of `input` in random order.
 *
 * Uses the Fisher–Yates (Knuth) shuffle, which produces a uniformly random
 * permutation in O(n) time. The input array is never mutated.
 *
 * The random source is injectable so the shuffle can be exercised
 * deterministically in tests. `rng` must behave like `Math.random`: it returns
 * a float in the half-open interval [0, 1).
 *
 * @example
 * shuffle([1, 2, 3]);                 // e.g. [2, 3, 1]
 * shuffle([1, 2, 3], () => 0);        // deterministic, for tests
 */
export function shuffle<T>(input: readonly T[], rng: () => number = Math.random): T[] {
  const result = input.slice();
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Creates a deterministic pseudo-random generator (mulberry32) seeded by `seed`.
 *
 * The returned function is drop-in compatible with {@link shuffle}'s `rng`
 * parameter and yields the same sequence for the same seed. This makes a shuffle
 * reproducible — e.g. a per-round scramble that must stay stable across
 * re-renders can be derived as `shuffle(tiles, seededRandom(round))` instead of
 * being generated impurely and stored in state.
 */
export function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
