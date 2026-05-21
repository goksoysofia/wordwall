"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { playTickSound, playWheelStopSound } from "@/lib/sounds";
import type { GameStats } from "@/types/game";
import ThemedBackground from "@/components/ThemedBackground";

export interface SpinningWheelProps {
  options: { id: string; text?: string; imageUrl?: string }[];
  theme: {
    id: string;
    name: string;
    emoji: string;
    backgroundColor: string;
    wheelColors: string[];
    decorEmojis: string[];
    celebrationText: string;
    /** Açık dilimlerde etiket rengi (ör. 23 Nisan beyaz dilim) */
    accentColor?: string;
  };
  onComplete: (stats: GameStats) => void;
}

const CX = 100;
const CY = 100;
const R_OUTER = 92;
const R_INNER = 38;
/** Metin dış kenara (ibre ucuna) yapışmasın diye yarıçap oranı — düşük = daha içte */
const LABEL_RADIUS_RATIO = 0.68;
const MIN_FULL_SPINS = 5;

/** Sabit ibre: ekranda sol tarafta (SVG koordinatlarında 180° = 9 yön). */
const POINTER_ANGLE_DEG = 180;

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

function parseHexRgb(hex: string): [number, number, number] | null {
  const m = hex.trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!m) return null;
  let h = m[1];
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function srgbChannelToLinear(c: number): number {
  const x = c / 255;
  return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
}

/** WCAG göre göreli parlaklık (0–1); yüksek = açık zemin */
function colorLuminance(hex: string): number | null {
  const rgb = parseHexRgb(hex);
  if (!rgb) return null;
  const [r, g, b] = rgb.map(srgbChannelToLinear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function isLightSliceFill(hex: string): boolean {
  const L = colorLuminance(hex);
  if (L == null) return false;
  return L >= 0.55;
}

/** Açık dilimde okunaklı, temayla uyumlu koyu etiket rengi */
function wheelSliceLabelColor(sliceFill: string, accent: string | undefined, palette: string[]): string {
  if (!isLightSliceFill(sliceFill)) return "#ffffff";
  const candidates = [accent, ...palette].filter((c): c is string => Boolean(c));
  for (const c of candidates) {
    const L = colorLuminance(c);
    if (L != null && L < 0.55) return c;
  }
  return "#2D1B69";
}

/** Custom ease-out curve matching cubic-bezier(0.22, 1, 0.36, 1) */
function easeOutQuint(t: number): number {
  return 1 - Math.pow(1 - t, 5);
}

export default function SpinningWheel({
  options: initialOptions,
  theme,
  onComplete,
}: SpinningWheelProps) {
  const initialSnapshot = useRef(initialOptions);
  const startTime = useRef(Date.now());
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const hasCompletedRef = useRef(false);
  const [remaining, setRemaining] = useState(() => shuffle([...initialOptions]));
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winnerIndex, setWinnerIndex] = useState<number | null>(null);

  // Animation refs
  const animRef = useRef<number | null>(null);
  const animStartTime = useRef(0);
  const animStartRotation = useRef(0);
  const animTargetRotation = useRef(0);
  const animDuration = useRef(4000);
  const lastSliceIndex = useRef(-1);
  const pendingWinnerRef = useRef<number | null>(null);

  const n = remaining.length;
  const sliceDeg = n > 0 ? 360 / n : 0;

  useEffect(() => {
    if (remaining.length === 0 && !hasCompletedRef.current) {
      hasCompletedRef.current = true;
      onCompleteRef.current({
        totalItems: initialSnapshot.current.length,
        correctCount: initialSnapshot.current.length,
        wrongCount: 0,
        timeSeconds: Math.round((Date.now() - startTime.current) / 1000),
        completedAt: new Date().toISOString(),
        wrongItems: [],
      });
    }
  }, [remaining.length]);

  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
      if (animRef.current !== null) cancelAnimationFrame(animRef.current);
    };
  }, []);

  const maxLabelLen = useMemo(() => {
    // Radial text has more room along the radius
    if (n <= 0) return 14;
    if (n <= 4) return 14;
    if (n <= 8) return 12;
    if (n <= 12) return 10;
    return 8;
  }, [n]);

  const animate = useCallback(
    (timestamp: number) => {
      const elapsed = timestamp - animStartTime.current;
      const duration = animDuration.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutQuint(progress);

      const startRot = animStartRotation.current;
      const targetRot = animTargetRotation.current;
      const currentRot = startRot + (targetRot - startRot) * eased;

      setRotation(currentRot);

      // Tick sound on slice boundary crossing (ibre sol tarafta → ibre altındaki dilim)
      if (n > 0) {
        const normalizedDeg = ((currentRot % 360) + 360) % 360;
        const w = ((POINTER_ANGLE_DEG - normalizedDeg) % 360 + 360) % 360;
        const wShifted = (w + 90 + 360) % 360;
        const currentSlice = Math.floor(wShifted / sliceDeg) % n;
        if (currentSlice !== lastSliceIndex.current && lastSliceIndex.current !== -1) {
          playTickSound();
        }
        lastSliceIndex.current = currentSlice;
      }

      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        // Animation complete
        animRef.current = null;
        playWheelStopSound();
        setIsSpinning(false);
        const w = pendingWinnerRef.current;
        pendingWinnerRef.current = null;
        if (w !== null) setWinnerIndex(w);
      }
    },
    [n, sliceDeg]
  );

  const handleSpin = useCallback(() => {
    if (isSpinning || n < 1) return;

    setWinnerIndex(null);
    setIsSpinning(true);

    const current = rotation;
    const winner = Math.floor(Math.random() * n);
    // İbre solda (180°). Dilim merkezi midDeg = -90 + (i+0.5)*sliceDeg; midDeg + rotation ≡ 180 (mod 360).
    const targetMod =
      ((POINTER_ANGLE_DEG + 90 - (winner * sliceDeg + sliceDeg / 2)) % 360 + 360) % 360;
    const currentMod = ((current % 360) + 360) % 360;
    let delta = (targetMod - currentMod + 360) % 360;
    if (delta < 1) delta += 360;
    const spinAmount = MIN_FULL_SPINS * 360 + delta;
    const nextRotation = current + spinAmount;

    // Longer duration for more spins = more dramatic
    const totalDegrees = spinAmount;
    animDuration.current = Math.min(3000 + totalDegrees * 1.2, 6000);

    pendingWinnerRef.current = winner;
    animStartRotation.current = current;
    animTargetRotation.current = nextRotation;
    lastSliceIndex.current = -1;

    animStartTime.current = performance.now();
    animRef.current = requestAnimationFrame(animate);
  }, [isSpinning, n, sliceDeg, rotation, animate]);

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
    if (animRef.current !== null) {
      cancelAnimationFrame(animRef.current);
      animRef.current = null;
    }
    setIsSpinning(false);
    setWinnerIndex(null);
    setRotation(0);
    setRemaining(shuffle([...initialSnapshot.current]));
    hasCompletedRef.current = false;
  }, []);

  const wheelColors = theme.wheelColors.length > 0 ? theme.wheelColors : ["#FF6B9D", "#FFD93D", "#4D96FF"];

  return (
    <div
      className="relative flex w-full flex-col items-center gap-6 px-3 py-6 md:px-4"
      style={{ backgroundColor: theme.backgroundColor }}
    >
      <ThemedBackground decorEmojis={theme.decorEmojis} backgroundColor={theme.backgroundColor} />
      <div className="relative z-10 w-full max-w-[min(100%,520px)] overflow-visible pl-2 pr-1 aspect-square">
        {/* Pointer — sol tarafta, merkeze doğru */}
        <div
          className="pointer-events-none absolute left-2 top-1/2 z-20 -translate-y-1/2 sm:left-3"
          aria-hidden
        >
          <svg width="36" height="40" viewBox="0 0 36 40" className="drop-shadow-lg">
            <polygon
              points="32,20 8,6 8,34"
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
            className="h-full w-full rounded-full"
            style={{
              transform: `rotate(${rotation}deg)`,
            }}
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
                      ) : (() => {
                        const textR = R_INNER + (R_OUTER - R_INNER) * LABEL_RADIUS_RATIO;
                        const tp = polarDeg(CX, CY, textR, midDeg);
                        const labelFill = wheelSliceLabelColor(fill, theme.accentColor, wheelColors);
                        return (
                          <text
                            x={tp.x}
                            y={tp.y}
                            textAnchor="start"
                            dominantBaseline="middle"
                            fill={labelFill}
                            fontSize={n <= 4 ? 11 : n <= 8 ? 9 : 7.5}
                            fontWeight="800"
                            fontFamily="'Nunito', system-ui, sans-serif"
                            transform={`rotate(${midDeg + 180}, ${tp.x}, ${tp.y})`}
                            style={{ filter: "url(#wheelTextShadow)" }}
                          >
                            {label}
                          </text>
                        );
                      })()}
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
