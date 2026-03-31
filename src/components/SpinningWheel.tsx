"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { playTickSound, playWheelStopSound } from "@/lib/sounds";

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
  onComplete: () => void;
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
      onComplete();
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

  const wheelColors = theme.wheelColors.length > 0 ? theme.wheelColors : ["#6366f1", "#8b5cf6", "#ec4899"];

  return (
    <div
      className="flex w-full flex-col items-center gap-6 px-3 py-4 md:px-4"
      style={{ backgroundColor: theme.backgroundColor }}
    >
      <div className="relative w-full max-w-[min(100%,500px)] aspect-square">
        {/* Pointer */}
        <div
          className="pointer-events-none absolute left-1/2 top-0 z-20 -translate-x-1/2 -translate-y-1"
          aria-hidden
        >
          <svg width="36" height="28" viewBox="0 0 36 28" className="drop-shadow-md">
            <polygon
              points="18,26 4,4 32,4"
              fill="#1e293b"
              stroke="#f8fafc"
              strokeWidth="2"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <div
          className="absolute inset-0 flex items-center justify-center rounded-full shadow-[0_12px_40px_rgba(0,0,0,0.25)]"
          style={{ filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.2))" }}
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
                <circle cx={CX} cy={CY} r={R_OUTER} fill="#334155" />
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
                        stroke={isHighlight ? "#fef08a" : "rgba(255,255,255,0.35)"}
                        strokeWidth={isHighlight ? 4 : 1}
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
                          fontWeight="700"
                          fontFamily="system-ui, sans-serif"
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

          {/* Center hub + spin */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div
              className="pointer-events-auto flex h-[26%] max-h-[130px] min-h-[72px] w-[26%] min-w-[72px] max-w-[130px] items-center justify-center rounded-full border-4 border-white/90 bg-white shadow-lg"
              style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.2), inset 0 2px 8px rgba(255,255,255,0.9)" }}
            >
              <button
                type="button"
                onClick={handleSpin}
                disabled={isSpinning || n < 1}
                className="flex h-[78%] w-[78%] items-center justify-center rounded-full bg-slate-800 text-sm font-bold text-white shadow-inner transition enabled:hover:bg-slate-700 enabled:active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 md:text-base"
              >
                Çevir
              </button>
            </div>
          </div>
        </div>
      </div>

      {selectedOption && !isSpinning && (
        <div className="w-full max-w-md rounded-2xl border border-white/20 bg-white/95 p-4 shadow-xl backdrop-blur-sm dark:bg-slate-900/95">
          <p className="mb-1 text-center text-xs font-medium uppercase tracking-wide text-slate-500">
            Seçilen
          </p>
          <div className="flex flex-col items-center gap-3">
            {selectedOption.imageUrl && (
              <img
                src={selectedOption.imageUrl}
                alt=""
                className="h-20 w-20 rounded-lg object-cover shadow-md"
              />
            )}
            {selectedOption.text && (
              <p className="text-center text-lg font-semibold text-slate-800 dark:text-slate-100">
                {selectedOption.text}
              </p>
            )}
            {!selectedOption.text && !selectedOption.imageUrl && (
              <p className="text-slate-500">—</p>
            )}
          </div>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={removeWinner}
              className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-rose-700 active:scale-[0.98]"
            >
              Bu Seçeneği Kaldır
            </button>
            <button
              type="button"
              onClick={spinAgain}
              className="rounded-xl bg-slate-700 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-slate-600 active:scale-[0.98]"
            >
              Tekrar Çevir
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col items-center gap-2">
        <p className="text-center text-sm text-slate-600/90 dark:text-slate-300">
          {theme.emoji} {theme.celebrationText}
        </p>
        <button
          type="button"
          onClick={resetAll}
          disabled={isSpinning}
          className="rounded-xl border-2 border-slate-600/30 bg-white/80 px-5 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-white disabled:opacity-50 dark:bg-slate-800/80 dark:text-slate-100"
        >
          Yeniden Başlat
        </button>
      </div>
    </div>
  );
}
