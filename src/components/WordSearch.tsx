"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { playMatchSound, playWrongSound, playCelebrationSound, playTickSound } from "@/lib/sounds";
import type { GameStats, WrongItem } from "@/types/game";
import ThemedBackground from "@/components/ThemedBackground";

interface WSOption {
  id: string;
  text?: string;
}

export interface WordSearchProps {
  options: WSOption[];
  title?: string;
  theme: {
    backgroundColor: string;
    cardColors: string[];
    decorEmojis: string[];
    celebrationText: string;
    emoji: string;
  };
  onComplete: (stats: GameStats) => void;
}

const TR_LETTERS = Array.from("ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ");
const up = (s: string) => s.toLocaleUpperCase("tr-TR");

// 4 yön: yatay →, dikey ↓, çapraz ↘, çapraz ↗
const DIRS: [number, number][] = [
  [0, 1],
  [1, 0],
  [1, 1],
  [-1, 1],
];

function cleanWord(text: string): string {
  return up(text).replace(/[^A-ZÇĞİıÖŞÜ]/giu, "");
}

interface GenResult {
  grid: string[][];
  size: number;
}

function tryGenerate(words: string[], size: number): GenResult | null {
  const grid: (string | null)[][] = Array.from({ length: size }, () => Array(size).fill(null));

  const placeWord = (word: string): boolean => {
    const letters = Array.from(word);
    for (let attempt = 0; attempt < 250; attempt++) {
      const [dr, dc] = DIRS[Math.floor(Math.random() * DIRS.length)];
      const len = letters.length;
      // başlangıç sınırları
      const rMin = dr < 0 ? (len - 1) * -dr : 0;
      const rMax = size - 1 - (dr > 0 ? (len - 1) * dr : 0);
      const cMax = size - 1 - (dc > 0 ? (len - 1) * dc : 0);
      if (rMax < rMin || cMax < 0) continue;
      const r0 = rMin + Math.floor(Math.random() * (rMax - rMin + 1));
      const c0 = Math.floor(Math.random() * (cMax + 1));
      // çakışma kontrolü
      let ok = true;
      for (let i = 0; i < len; i++) {
        const r = r0 + dr * i;
        const c = c0 + dc * i;
        const existing = grid[r][c];
        if (existing !== null && existing !== letters[i]) { ok = false; break; }
      }
      if (!ok) continue;
      for (let i = 0; i < len; i++) {
        grid[r0 + dr * i][c0 + dc * i] = letters[i];
      }
      return true;
    }
    return false;
  };

  for (const w of words) {
    if (Array.from(w).length > size) return null;
    if (!placeWord(w)) return null;
  }

  // boşlukları rastgele harfle doldur
  const filled: string[][] = grid.map((row) =>
    row.map((c) => c ?? TR_LETTERS[Math.floor(Math.random() * TR_LETTERS.length)])
  );
  return { grid: filled, size };
}

function generate(words: string[]): GenResult {
  const longest = words.reduce((m, w) => Math.max(m, Array.from(w).length), 0);
  const totalLen = words.reduce((s, w) => s + Array.from(w).length, 0);
  let size = Math.min(13, Math.max(7, longest, Math.ceil(Math.sqrt(totalLen * 2.2))));
  for (let s = size; s <= 15; s++) {
    const res = tryGenerate(words, s);
    if (res) return res;
    size = s;
  }
  // son çare: en uzun kadar ızgara, sığmayanları at
  const fit = words.filter((w) => Array.from(w).length <= 15);
  return tryGenerate(fit, 15) || { grid: [[TR_LETTERS[0]]], size: 1 };
}

export default function WordSearch({ options, title, theme, onComplete }: WordSearchProps) {
  const startTime = useRef(Date.now());
  const hasCompleted = useRef(false);
  const wrongRef = useRef(0);

  const words = useMemo(() => {
    const cleaned = options.map((o) => cleanWord(o.text || "")).filter((w) => Array.from(w).length >= 2);
    // tekilleştir
    return Array.from(new Set(cleaned));
  }, [options]);

  const [seed, setSeed] = useState(0);
  const { grid, size } = useMemo(() => generate(words), [words, seed]);

  const [start, setStart] = useState<[number, number] | null>(null);
  const [found, setFound] = useState<Record<string, string>>({}); // "r,c" -> color
  const [foundWords, setFoundWords] = useState<Set<string>>(new Set());
  const [wrongCells, setWrongCells] = useState<string[]>([]);

  const lineBetween = (a: [number, number], b: [number, number]): [number, number][] | null => {
    const [r1, c1] = a;
    const [r2, c2] = b;
    const dr = Math.sign(r2 - r1);
    const dc = Math.sign(c2 - c1);
    const straight = r1 === r2 || c1 === c2 || Math.abs(r2 - r1) === Math.abs(c2 - c1);
    if (!straight) return null;
    const steps = Math.max(Math.abs(r2 - r1), Math.abs(c2 - c1));
    const cells: [number, number][] = [];
    for (let i = 0; i <= steps; i++) cells.push([r1 + dr * i, c1 + dc * i]);
    return cells;
  };

  const handleCell = useCallback(
    (r: number, c: number) => {
      if (hasCompleted.current) return;
      if (!start) {
        playTickSound();
        setStart([r, c]);
        return;
      }
      if (start[0] === r && start[1] === c) {
        setStart(null);
        return;
      }
      const cells = lineBetween(start, [r, c]);
      if (!cells) {
        // hizalı değil → yeni başlangıç
        playTickSound();
        setStart([r, c]);
        return;
      }
      const letters = cells.map(([rr, cc]) => grid[rr][cc]).join("");
      const reversed = Array.from(letters).reverse().join("");
      const match = words.find((w) => (w === up(letters) || w === up(reversed)) && !foundWords.has(w));
      if (match) {
        const color = theme.cardColors[foundWords.size % theme.cardColors.length];
        playMatchSound();
        setFound((prev) => {
          const next = { ...prev };
          cells.forEach(([rr, cc]) => { next[`${rr},${cc}`] = color; });
          return next;
        });
        setFoundWords((prev) => new Set(prev).add(match));
      } else {
        playWrongSound();
        wrongRef.current += 1;
        const keys = cells.map(([rr, cc]) => `${rr},${cc}`);
        setWrongCells(keys);
        setTimeout(() => setWrongCells([]), 400);
      }
      setStart(null);
    },
    [start, grid, words, foundWords, theme.cardColors]
  );

  useEffect(() => {
    if (words.length > 0 && foundWords.size === words.length && !hasCompleted.current) {
      hasCompleted.current = true;
      playCelebrationSound();
      const stats: GameStats = {
        totalItems: words.length,
        correctCount: words.length,
        wrongCount: wrongRef.current,
        timeSeconds: Math.round((Date.now() - startTime.current) / 1000),
        completedAt: new Date().toISOString(),
        wrongItems: [] as WrongItem[],
      };
      setTimeout(() => onComplete(stats), 800);
    }
  }, [foundWords, words.length, onComplete]);

  const resetGame = () => {
    setStart(null);
    setFound({});
    setFoundWords(new Set());
    setWrongCells([]);
    wrongRef.current = 0;
    startTime.current = Date.now();
    hasCompleted.current = false;
    setSeed((s) => s + 1);
  };

  // hücre font boyutu ızgara boyutuna göre
  const fontSize = size >= 12 ? "clamp(11px, 3vw, 18px)" : size >= 10 ? "clamp(13px, 3.6vw, 22px)" : "clamp(15px, 4.4vw, 26px)";

  return (
    <div className="relative flex flex-col items-center gap-5 px-3 py-6 md:px-6" style={{ backgroundColor: theme.backgroundColor }}>
      <ThemedBackground decorEmojis={theme.decorEmojis} backgroundColor={theme.backgroundColor} />

      {/* İlerleme */}
      <div className="z-10 flex items-center gap-2 rounded-2xl bg-white px-4 py-2 shadow-sm" style={{ border: "2px solid rgba(45, 27, 105, 0.06)" }}>
        <span className="text-lg">🔎</span>
        <span className="font-heading text-lg font-bold text-[#2D1B69]">{foundWords.size}</span>
        <span className="text-xs font-bold text-[#8B7BAD]">/ {words.length}</span>
      </div>

      {title && (
        <p className="z-10 max-w-lg text-center font-heading text-sm font-bold text-[#2D1B69]">{title}</p>
      )}
      <p className="z-10 -mt-2 text-center text-xs font-semibold text-[#8B7BAD]">Başlangıç ve bitiş harfine dokun ✨</p>

      {/* Aranan kelimeler */}
      <div className="z-10 flex max-w-xl flex-wrap items-center justify-center gap-2">
        {words.map((w) => {
          const done = foundWords.has(w);
          return (
            <span
              key={w}
              className={`rounded-full px-3 py-1 font-heading text-sm font-bold transition ${
                done ? "bg-emerald-100 text-emerald-600 line-through" : "bg-white text-[#2D1B69]"
              }`}
              style={{ border: "2px solid rgba(45, 27, 105, 0.08)" }}
            >
              {done && "✓ "}{w}
            </span>
          );
        })}
      </div>

      {/* Izgara */}
      <div
        className="z-10 grid w-full select-none gap-1 rounded-3xl bg-white p-2 shadow-lg sm:gap-1.5 sm:p-3"
        style={{
          gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`,
          maxWidth: "min(94vw, 540px)",
          border: "3px solid rgba(45, 27, 105, 0.08)",
        }}
      >
        {grid.map((row, r) =>
          row.map((ch, c) => {
            const key = `${r},${c}`;
            const isStart = start && start[0] === r && start[1] === c;
            const foundColor = found[key];
            const isWrong = wrongCells.includes(key);
            return (
              <button
                key={key}
                type="button"
                onClick={() => handleCell(r, c)}
                className="flex aspect-square items-center justify-center rounded-lg font-heading font-extrabold transition-colors"
                style={{
                  fontSize,
                  color: foundColor ? "white" : "#2D1B69",
                  background: foundColor
                    ? foundColor
                    : isStart
                      ? "#6366f1"
                      : isWrong
                        ? "#fecaca"
                        : "#F8F5FF",
                  ...(isStart ? { color: "white" } : {}),
                  border: "1px solid rgba(45, 27, 105, 0.05)",
                }}
              >
                {ch}
              </button>
            );
          })
        )}
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
