"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { playTickSound, playWheelStopSound } from "@/lib/sounds";
import type { GameStats } from "@/types/game";

export interface SpinningWheelProps {
  options: { id: string; text?: string; imageUrl?: string }[];
  theme: {
    id: string;
    name: string;
    emoji: string;
    backgroundColor: string;
    wheelColors: string[];
    celebrationText: string;
  };
  onComplete: (stats: GameStats) => void;
}

const CX = 100;
const CY = 100;
const R_OUTER = 92;
const R_INNER = 38;
const SPIN_DURATION_MS = 4000;
const MIN_FULL_SPINS = 5;

function shuffle<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function polarDeg(cx: number, cy: number, r: number, deg: number) {
  const rad = (deg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function donutSlicePath(
  startDeg: number,
  endDeg: number,
  rInner: number,
  rOuter: number
): string {
  const p1 = polarDeg(CX, CY, rInner, startDeg);
  const p2 = polarDeg(CX, CY, rOuter, startDeg);
  const p3 = polarDeg(CX, CY, rOuter, endDeg);
  const p4 = polarDeg(CX, CY, rInner, endDeg);
  const slice = endDeg - startDeg;
  const largeArc = slice > 180 ? 1 : 0;
  return [
    `M ${p1.x} ${p1.y}`,
    `L ${p2.x} ${p2.y}`,
    `A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${p3.x} ${p3.y}`,
    `L ${p4.x} ${p4.y}`,
    `A ${rInner} ${rInner} 0 ${largeArc} 0 ${p1.x} ${p1.y}`,
    "Z",
  ].join(" ");
}

function truncateLabel(text: string, maxLen: number): string {
  const t = text.trim();
  if (t.length <= maxLen) return t;
  return `${t.slice(0, Math.max(1, maxLen - 1))}…`;
}

export default function SpinningWheel({
  options: initialOptions,
  theme,
  onComplete,
}: SpinningWheelProps) {
  const initialSnapshot = useRef(initialOptions);
  const startTime = useRef(Date.now());
  const [remaining, setRemaining] = useState(() => shuffle([...initialOptions]));
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winnerIndex, setWinnerIndex] = useState<number | null>(null);
  const rotationRef = useRef(0);
  const tickIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pendingWinnerRef = useRef<number | null>(null);
  const spinActiveRef = useRef(false);

  const n = remaining.length;
  const sliceDeg = n > 0 ? 360 / n : 0;

  useEffect(() => {
    rotationRef.current = rotation;
  }, [rotation]);

  const clearTickInterval = useCallback(() => {
    if (tickIntervalRef.current !== null) {
      clearInterval(tickIntervalRef.current);
      tickIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (remaining.length === 0) {
      onComplete({
        totalItems: initialSnapshot.current.length,
        correctCount: initialSnapshot.current.length,
        wrongCount: 0,
        timeSeconds: Math.round((Date.now() - startTime.current) / 1000),
        completedAt: new Date().toISOString(),
      });
    }
  }, [remaining.length, onComplete]);

  useEffect(() => () => clearTickInterval(), [clearTickInterval]);

  const maxLabelLen = useMemo(() => {
    if (n <= 0) return 12;
    if (n <= 2) return 28;
    if (n <= 4) return 18;
    if (n <= 6) return 14;
    return 10;
  }, [n]);

  const handleSpin = useCallback(() => {
    if (isSpinning || n < 1) return;

    setWinnerIndex(null);
    setIsSpinning(true);

    tickIntervalRef.current = setInterval(() => {
      playTickSound();
    }, 100);

    const current = rotationRef.current;
    const winner = Math.floor(Math.random() * n);
    const targetMod = winner * sliceDeg + sliceDeg / 2;
    const currentMod = ((current % 360) + 360) % 360;
    let delta = (targetMod - currentMod + 360) % 360;
    if (delta < 1) delta += 360;
    const spinAmount = MIN_FULL_SPINS * 360 + delta;
    const nextRotation = current + spinAmount;

    pendingWinnerRef.current = winner;
    spinActiveRef.current = true;

    requestAnimationFrame(() => {
      setRotation(nextRotation);
    });
  }, [isSpinning, n, sliceDeg]);

  const onTransitionEnd = useCallback(
    (e: React.TransitionEvent<HTMLDivElement>) => {
      if (e.propertyName !== "transform" || e.target !== e.currentTarget) return;
      if (!spinActiveRef.current) return;
      spinActiveRef.current = false;
      clearTickInterval();
      playWheelStopSound();
      setIsSpinning(false);
      const w = pendingWinnerRef.current;
      pendingWinnerRef.current = null;
      if (w !== null) setWinnerIndex(w);
    },
    [clearTickInterval]
  );

  const selectedOption = winnerIndex !== null && winnerIndex < n ? remaining[winnerIndex] : null;

  const removeWinner = useCallback(() => {
    if (selectedOption == null || winnerIndex === null) return;
    setRemaining((prev) => prev.filter((o) => o.id !== selectedOption.id));
    setWinnerIndex(null);
  }, [selectedOption, winnerIndex]);

  const spinAgain = useCallback(() => {
    setWinnerIndex(null);
  }, []);

  const resetAll = useCallback(() => {
    clearTickInterval();
    setIsSpinning(false);
    setWinnerIndex(null);
    setRotation(0);
    rotationRef.current = 0;
    setRemaining(shuffle([...initialSnapshot.current]));
  }, [clearTickInterval]);

  const wheelColors = theme.wheelColors.length > 0 ? theme.wheelColors : ["#FF6B9D", "#FFD93D", "#4D96FF"];

  return (
    <div
      className="flex w-full flex-col items-center gap-6 px-3 py-6 md:px-4"
      style={{ backgroundColor: theme.backgroundColor }}
    >
      <div className="relative w-full max-w-[min(100%,520px)] aspect-square">
        {/* Pointer - playful triangle */}
        <div
          className="pointer-events-none absolute left-1/2 top-0 z-20 -translate-x-1/2 -translate-y-1"
          aria-hidden
        >
          <svg width="40" height="32" viewBox="0 0 40 32" className="drop-shadow-lg">
            <polygon
              points="20,30 4,4 36,4"
              fill="#2D1B69"
              stroke="#FFD93D"
              strokeWidth="3"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <div
          className="absolute inset-0 flex items-center justify-center rounded-full"
          style={{
            boxShadow: "0 12px 40px rgba(45, 27, 105, 0.2), 0 0 0 6px rgba(255,255,255,0.8), 0 0 0 10px rgba(45, 27, 105, 0.08)",
          }}
        >
          <div
            className="h-full w-full rounded-full will-change-transform"
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: isSpinning
                ? `transform ${SPIN_DURATION_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`
                : "none",
            }}
            onTransitionEnd={onTransitionEnd}
          >
            <svg
              viewBox="0 0 200 200"
              className="h-full w-full rounded-full"
              role="img"
              aria-label="Çark"
            >
              <defs>
                <filter id="wheelTextShadow" x="-50%" y="-50%" width="200%" height="200%">
                  <feDropShadow dx="0" dy="1" stdDeviation="1.2" floodColor="#000" floodOpacity="0.75" />
                </filter>
              </defs>
              {n === 0 ? (
                <circle cx={CX} cy={CY} r={R_OUTER} fill="#2D1B69" />
              ) : (
                remaining.map((opt, i) => {
                  const startDeg = -90 + i * sliceDeg;
                  const endDeg = -90 + (i + 1) * sliceDeg;
                  const midDeg = -90 + (i + 0.5) * sliceDeg;
                  const fill = wheelColors[i % wheelColors.length];
                  const isHighlight = winnerIndex === i && !isSpinning;
                  const label = opt.text
                    ? truncateLabel(opt.text, maxLabelLen)
                    : opt.imageUrl
                      ? ""
                      : "?";
                  const mid = polarDeg(CX, CY, (R_INNER + R_OUTER) / 2, midDeg);
                  const imgPos = polarDeg(CX, CY, (R_INNER + R_OUTER) / 2 - 6, midDeg);

                  return (
                    <g key={opt.id}>
                      <path
                        d={donutSlicePath(startDeg, endDeg, R_INNER, R_OUTER)}
                        fill={fill}
                        stroke={isHighlight ? "#FFD93D" : "rgba(255,255,255,0.4)"}
                        strokeWidth={isHighlight ? 4 : 1.5}
                        className="transition-[stroke,stroke-width] duration-300"
                      />
                      {opt.imageUrl ? (
                        <g
                          transform={`translate(${imgPos.x}, ${imgPos.y}) rotate(${midDeg + 90})`}
                        >
                          <image
                            href={opt.imageUrl}
                            x={-14}
                            y={-14}
                            width={28}
                            height={28}
                            preserveAspectRatio="xMidYMid slice"
                            clipPath="none"
                            className="rounded-sm"
                            style={{ filter: "url(#wheelTextShadow)" }}
                          />
                        </g>
                      ) : (
                        <text
                          x={mid.x}
                          y={mid.y}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fill="white"
                          fontSize={n <= 4 ? 11 : n <= 8 ? 9 : 8}
                          fontWeight="800"
                          fontFamily="'Nunito', system-ui, sans-serif"
                          transform={`rotate(${midDeg + 90}, ${mid.x}, ${mid.y})`}
                          style={{
                            filter: "url(#wheelTextShadow)",
                            maxWidth: 40,
                          }}
                        >
                          {label}
                        </text>
                      )}
                    </g>
                  );
                })
              )}
            </svg>
          </div>

          {/* Center hub + spin button */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div
              className="pointer-events-auto flex h-[26%] max-h-[130px] min-h-[72px] w-[26%] min-w-[72px] max-w-[130px] items-center justify-center rounded-full bg-white"
              style={{
                border: "4px solid #FFD93D",
                boxShadow: "0 4px 20px rgba(45, 27, 105, 0.15), inset 0 2px 8px rgba(255,255,255,0.9)",
              }}
            >
              <button
                type="button"
                onClick={handleSpin}
                disabled={isSpinning || n < 1}
                className="flex h-[78%] w-[78%] items-center justify-center rounded-full font-heading text-base font-bold text-white shadow-inner transition enabled:hover:scale-105 enabled:active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 md:text-lg"
                style={{
                  background: "linear-gradient(135deg, #FF6B9D, #FF8A50)",
                  boxShadow: "0 3px 0 #D4456E, inset 0 1px 2px rgba(255,255,255,0.3)",
                }}
              >
                Çevir
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Winner result card */}
      {selectedOption && !isSpinning && (
        <div
          className="animate-bounce-in w-full max-w-md rounded-3xl p-5 shadow-xl"
          style={{
            background: "white",
            border: "2px solid rgba(45, 27, 105, 0.06)",
          }}
        >
          <p className="mb-2 text-center text-xs font-bold uppercase tracking-wider text-[#8B7BAD]">
            🎯 Seçilen
          </p>
          <div className="flex flex-col items-center gap-3">
            {selectedOption.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={selectedOption.imageUrl}
                alt=""
                className="h-24 w-24 rounded-2xl object-cover shadow-md"
                style={{ border: "2px solid rgba(45, 27, 105, 0.06)" }}
              />
            )}
            {selectedOption.text && (
              <p className="text-center font-heading text-2xl font-bold text-[#2D1B69]">
                {selectedOption.text}
              </p>
            )}
            {!selectedOption.text && !selectedOption.imageUrl && (
              <p className="text-[#8B7BAD]">—</p>
            )}
          </div>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={removeWinner}
              className="btn-candy rounded-xl px-5 py-3 text-sm"
            >
              Bu Seçeneği Kaldır
            </button>
            <button
              type="button"
              onClick={spinAgain}
              className="btn-candy btn-blue rounded-xl px-5 py-3 text-sm"
            >
              Tekrar Çevir
            </button>
          </div>
        </div>
      )}

      {/* Footer info + restart */}
      <div className="flex flex-col items-center gap-3">
        <p className="text-center text-sm font-bold text-[#8B7BAD]">
          {theme.emoji} {theme.celebrationText}
        </p>
        <button
          type="button"
          onClick={resetAll}
          disabled={isSpinning}
          className="rounded-2xl bg-white px-6 py-2.5 font-heading text-sm font-bold text-[#2D1B69] shadow-md transition hover:scale-105 hover:shadow-lg disabled:opacity-50"
          style={{ border: "2px solid rgba(45, 27, 105, 0.06)" }}
        >
          🔄 Yeniden Başlat
        </button>
      </div>
    </div>
  );
}
