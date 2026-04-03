"use client";

import { useMemo } from "react";

interface ThemedBackgroundProps {
  decorEmojis: string[];
  backgroundColor: string;
}

const POSITIONS: { top: string; left?: string; right?: string; size: string; rotate: number; delay: number }[] = [
  { top: "3%", left: "2%", size: "1.8rem", rotate: -15, delay: 0 },
  { top: "8%", right: "4%", size: "1.4rem", rotate: 20, delay: 1.2 },
  { top: "18%", left: "5%", size: "1.2rem", rotate: 10, delay: 2.5 },
  { top: "25%", right: "3%", size: "1.6rem", rotate: -25, delay: 0.8 },
  { top: "38%", left: "1%", size: "1.5rem", rotate: 15, delay: 3.1 },
  { top: "45%", right: "2%", size: "1.3rem", rotate: -10, delay: 1.8 },
  { top: "55%", left: "4%", size: "1.7rem", rotate: 30, delay: 0.4 },
  { top: "62%", right: "5%", size: "1.2rem", rotate: -20, delay: 2.2 },
  { top: "72%", left: "2%", size: "1.4rem", rotate: 5, delay: 3.5 },
  { top: "78%", right: "3%", size: "1.6rem", rotate: -12, delay: 1.5 },
  { top: "88%", left: "6%", size: "1.3rem", rotate: 22, delay: 2.8 },
  { top: "92%", right: "4%", size: "1.5rem", rotate: -8, delay: 0.6 },
];

export default function ThemedBackground({ decorEmojis }: ThemedBackgroundProps) {
  const items = useMemo(() => {
    if (decorEmojis.length === 0) return [];
    return POSITIONS.map((pos, i) => ({
      ...pos,
      emoji: decorEmojis[i % decorEmojis.length],
    }));
  }, [decorEmojis]);

  if (items.length === 0) return null;

  return (
    <>
      <style>{`
        @keyframes themed-drift {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
      `}</style>
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden="true"
      >
        {items.map((item, i) => (
          <div
            key={i}
            className="absolute select-none"
            style={{
              top: item.top,
              left: item.left,
              right: item.right,
              fontSize: item.size,
              opacity: 0.1,
              transform: `rotate(${item.rotate}deg)`,
              animation: `themed-drift 6s ease-in-out ${item.delay}s infinite`,
              filter: "grayscale(20%)",
            }}
          >
            {item.emoji}
          </div>
        ))}
      </div>
    </>
  );
}
