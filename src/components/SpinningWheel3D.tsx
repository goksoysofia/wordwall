"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Text, Line } from "@react-three/drei";
import * as THREE from "three";
import { playTickSound, playWheelStopSound } from "@/lib/sounds";
import type { GameStats } from "@/types/game";

// ────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────

export interface SpinningWheel3DProps {
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

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────

function shuffle<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.substring(0, 2), 16) / 255,
    parseInt(h.substring(2, 4), 16) / 255,
    parseInt(h.substring(4, 6), 16) / 255,
  ];
}

// ────────────────────────────────────────────────────────────
// 3D Wheel Slice
// ────────────────────────────────────────────────────────────

function WheelSlice({
  index,
  total,
  innerRadius,
  outerRadius,
  depth,
  color,
  label,
  isWinner,
}: {
  index: number;
  total: number;
  innerRadius: number;
  outerRadius: number;
  depth: number;
  color: string;
  label: string;
  isWinner: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const sliceAngle = (Math.PI * 2) / total;
  const startAngle = index * sliceAngle;
  const midAngle = startAngle + sliceAngle / 2;
  const segments = 32;

  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    // inner arc start
    const isx = Math.cos(startAngle) * innerRadius;
    const isy = Math.sin(startAngle) * innerRadius;
    shape.moveTo(isx, isy);
    // line to outer arc start
    shape.lineTo(Math.cos(startAngle) * outerRadius, Math.sin(startAngle) * outerRadius);
    // outer arc
    for (let i = 1; i <= segments; i++) {
      const a = startAngle + (sliceAngle * i) / segments;
      shape.lineTo(Math.cos(a) * outerRadius, Math.sin(a) * outerRadius);
    }
    // line to inner arc end
    const endAngle = startAngle + sliceAngle;
    shape.lineTo(Math.cos(endAngle) * innerRadius, Math.sin(endAngle) * innerRadius);
    // inner arc back
    for (let i = segments - 1; i >= 0; i--) {
      const a = startAngle + (sliceAngle * i) / segments;
      shape.lineTo(Math.cos(a) * innerRadius, Math.sin(a) * innerRadius);
    }
    shape.closePath();

    const extrudeSettings = { depth, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 3 };
    return new THREE.ExtrudeGeometry(shape, extrudeSettings);
  }, [startAngle, sliceAngle, innerRadius, outerRadius, depth, segments]);

  const [r, g, b] = hexToRgb(color);
  const textR = (outerRadius + innerRadius) / 2;
  const textX = Math.cos(midAngle) * textR;
  const textY = Math.sin(midAngle) * textR;

  // Glow animation for winner
  const matRef = useRef<THREE.MeshPhysicalMaterial>(null);
  useFrame((_, delta) => {
    if (matRef.current && isWinner) {
      const t = Date.now() * 0.003;
      matRef.current.emissiveIntensity = 0.3 + Math.sin(t) * 0.2;
    }
  });

  const truncated = label.length > 12 ? label.slice(0, 11) + "…" : label;

  return (
    <group>
      <mesh ref={meshRef} geometry={geometry} position={[0, 0, -depth / 2]}>
        <meshPhysicalMaterial
          ref={matRef}
          color={new THREE.Color(r, g, b)}
          metalness={0.1}
          roughness={0.35}
          clearcoat={0.4}
          clearcoatRoughness={0.2}
          emissive={isWinner ? new THREE.Color(r, g, b) : new THREE.Color(0, 0, 0)}
          emissiveIntensity={isWinner ? 0.3 : 0}
        />
      </mesh>
      {/* Label */}
      {truncated && (
        <group position={[textX, textY, depth / 2 + 0.01]} rotation={[0, 0, midAngle + Math.PI / 2]}>
          <Text
            fontSize={total <= 4 ? 0.22 : total <= 8 ? 0.16 : 0.12}
            color="white"
            anchorX="center"
            anchorY="middle"
            font="/fonts/Nunito-Bold.ttf"
            outlineWidth={0.015}
            outlineColor="#000000"
            maxWidth={1.2}
          >
            {truncated}
          </Text>
        </group>
      )}
    </group>
  );
}

// ────────────────────────────────────────────────────────────
// 3D Wheel Assembly
// ────────────────────────────────────────────────────────────

function Wheel3DScene({
  options,
  colors,
  rotation,
  isSpinning,
  winnerIndex,
  onTransitionEnd,
}: {
  options: { id: string; text?: string }[];
  colors: string[];
  rotation: number;
  isSpinning: boolean;
  winnerIndex: number | null;
  onTransitionEnd: () => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const currentRotation = useRef(0);
  const targetRotation = useRef(0);
  const velocity = useRef(0);
  const prevSpinning = useRef(false);
  const tickTimerRef = useRef(0);

  useEffect(() => {
    if (isSpinning) {
      targetRotation.current = (rotation * Math.PI) / 180;
      // Calculate initial velocity based on distance
      const distance = targetRotation.current - currentRotation.current;
      velocity.current = distance * 0.6; // will decelerate
      prevSpinning.current = true;
    }
  }, [isSpinning, rotation]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    if (prevSpinning.current) {
      const target = targetRotation.current;
      const diff = target - currentRotation.current;

      if (Math.abs(diff) < 0.002) {
        // Arrived
        currentRotation.current = target;
        groupRef.current.rotation.z = target;
        if (prevSpinning.current) {
          prevSpinning.current = false;
          onTransitionEnd();
        }
        return;
      }

      // Ease-out interpolation
      const speed = Math.min(Math.abs(diff) * 3.5, 25);
      const step = Math.sign(diff) * speed * delta;
      currentRotation.current += Math.abs(step) > Math.abs(diff) ? diff : step;
      groupRef.current.rotation.z = currentRotation.current;

      // Tick sound based on rotation
      tickTimerRef.current += Math.abs(step);
      const sliceAngle = (Math.PI * 2) / Math.max(options.length, 1);
      if (tickTimerRef.current > sliceAngle * 0.4) {
        tickTimerRef.current = 0;
        playTickSound();
      }
    } else {
      // Idle: gentle hover wobble
      const wobble = Math.sin(Date.now() * 0.001) * 0.005;
      groupRef.current.rotation.z = currentRotation.current + wobble;
    }
  });

  const n = options.length;
  const depth = 0.25;

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[3, 4, 5]} intensity={1.2} castShadow />
      <directionalLight position={[-2, -1, 3]} intensity={0.4} color="#ffe0f0" />
      <pointLight position={[0, 0, 3]} intensity={0.6} color="#ffffff" />

      {/* Environment reflections */}
      <Environment preset="sunset" />

      {/* Wheel group */}
      <group ref={groupRef} position={[0, 0, 0]}>
        {options.map((opt, i) => (
          <WheelSlice
            key={opt.id}
            index={i}
            total={n}
            innerRadius={0.5}
            outerRadius={2}
            depth={depth}
            color={colors[i % colors.length]}
            label={opt.text || "?"}
            isWinner={winnerIndex === i && !isSpinning}
          />
        ))}

        {/* Inner ring (hub border) */}
        <mesh position={[0, 0, depth / 2 + 0.01]}>
          <ringGeometry args={[0.45, 0.52, 64]} />
          <meshPhysicalMaterial color="#FFD93D" metalness={0.6} roughness={0.2} />
        </mesh>

        {/* Outer ring */}
        <mesh position={[0, 0, depth / 2 + 0.01]}>
          <ringGeometry args={[1.98, 2.06, 64]} />
          <meshPhysicalMaterial color="#FFD93D" metalness={0.6} roughness={0.2} />
        </mesh>

        {/* Divider lines between slices */}
        {options.map((_, i) => {
          const angle = (i * Math.PI * 2) / n;
          const x1 = Math.cos(angle) * 0.5;
          const y1 = Math.sin(angle) * 0.5;
          const x2 = Math.cos(angle) * 2;
          const y2 = Math.sin(angle) * 2;
          const z = depth / 2 + 0.02;
          return (
            <Line
              key={`div-${i}`}
              points={[[x1, y1, z], [x2, y2, z]]}
              color="white"
              lineWidth={1}
              opacity={0.5}
              transparent
            />
          );
        })}
      </group>

      {/* Pointer (fixed, doesn't rotate) */}
      <group position={[0, 2.15, depth / 2 + 0.1]}>
        <mesh rotation={[0, 0, Math.PI]}>
          <coneGeometry args={[0.18, 0.35, 4]} />
          <meshPhysicalMaterial color="#2D1B69" metalness={0.3} roughness={0.4} />
        </mesh>
        {/* Pointer shine */}
        <mesh position={[0, -0.18, 0.01]}>
          <sphereGeometry args={[0.06, 16, 16]} />
          <meshPhysicalMaterial color="#FFD93D" metalness={0.8} roughness={0.1} emissive="#FFD93D" emissiveIntensity={0.3} />
        </mesh>
      </group>

      {/* Center hub */}
      <mesh position={[0, 0, depth / 2 + 0.03]}>
        <circleGeometry args={[0.45, 64]} />
        <meshPhysicalMaterial
          color="#ffffff"
          metalness={0.05}
          roughness={0.1}
          clearcoat={0.8}
        />
      </mesh>
    </>
  );
}

// ────────────────────────────────────────────────────────────
// Main Component (wraps Canvas + UI)
// ────────────────────────────────────────────────────────────

const MIN_FULL_SPINS = 5;

export default function SpinningWheel3D({
  options: initialOptions,
  theme,
  onComplete,
}: SpinningWheel3DProps) {
  const initialSnapshot = useRef(initialOptions);
  const startTime = useRef(Date.now());
  const [remaining, setRemaining] = useState(() => shuffle([...initialOptions]));
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winnerIndex, setWinnerIndex] = useState<number | null>(null);
  const rotationRef = useRef(0);
  const pendingWinnerRef = useRef<number | null>(null);

  const n = remaining.length;
  const sliceDeg = n > 0 ? 360 / n : 0;

  useEffect(() => {
    rotationRef.current = rotation;
  }, [rotation]);

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

  const handleSpin = useCallback(() => {
    if (isSpinning || n < 1) return;
    setWinnerIndex(null);
    setIsSpinning(true);

    const current = rotationRef.current;
    const winner = Math.floor(Math.random() * n);
    const targetMod = winner * sliceDeg + sliceDeg / 2;
    const currentMod = ((current % 360) + 360) % 360;
    let delta = (targetMod - currentMod + 360) % 360;
    if (delta < 1) delta += 360;
    const spinAmount = MIN_FULL_SPINS * 360 + delta;
    const nextRotation = current + spinAmount;

    pendingWinnerRef.current = winner;
    setRotation(nextRotation);
  }, [isSpinning, n, sliceDeg]);

  const onTransitionEnd = useCallback(() => {
    playWheelStopSound();
    setIsSpinning(false);
    const w = pendingWinnerRef.current;
    pendingWinnerRef.current = null;
    if (w !== null) setWinnerIndex(w);
  }, []);

  const selectedOption = winnerIndex !== null && winnerIndex < n ? remaining[winnerIndex] : null;

  const removeWinner = useCallback(() => {
    if (!selectedOption) return;
    setRemaining((prev) => prev.filter((o) => o.id !== selectedOption.id));
    setWinnerIndex(null);
  }, [selectedOption]);

  const spinAgain = useCallback(() => {
    setWinnerIndex(null);
  }, []);

  const resetAll = useCallback(() => {
    setIsSpinning(false);
    setWinnerIndex(null);
    setRotation(0);
    rotationRef.current = 0;
    setRemaining(shuffle([...initialSnapshot.current]));
  }, []);

  const wheelColors = theme.wheelColors.length > 0 ? theme.wheelColors : ["#FF6B9D", "#FFD93D", "#4D96FF"];

  return (
    <div className="flex w-full flex-col items-center gap-6 px-3 py-6 md:px-4" style={{ backgroundColor: theme.backgroundColor }}>
      {/* 3D Canvas */}
      <div className="relative w-full max-w-[min(100%,560px)] aspect-square">
        <Canvas
          camera={{ position: [0, 0, 4.5], fov: 45 }}
          style={{ borderRadius: "24px" }}
          gl={{ antialias: true, alpha: true }}
          dpr={[1, 2]}
        >
          <Wheel3DScene
            options={remaining}
            colors={wheelColors}
            rotation={rotation}
            isSpinning={isSpinning}
            winnerIndex={winnerIndex}
            onTransitionEnd={onTransitionEnd}
          />
        </Canvas>

        {/* Center spin button overlay */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <button
            type="button"
            onClick={handleSpin}
            disabled={isSpinning || n < 1}
            className="pointer-events-auto flex h-[18%] max-h-[100px] min-h-[60px] w-[18%] min-w-[60px] max-w-[100px] items-center justify-center rounded-full font-heading text-sm font-bold text-white shadow-xl transition enabled:hover:scale-110 enabled:active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 md:text-base"
            style={{
              background: "linear-gradient(135deg, #FF6B9D, #FF8A50)",
              boxShadow: "0 4px 0 #D4456E, 0 8px 25px rgba(255, 107, 157, 0.4), inset 0 1px 2px rgba(255,255,255,0.3)",
              border: "3px solid rgba(255,255,255,0.5)",
            }}
          >
            {isSpinning ? "..." : "Çevir"}
          </button>
        </div>
      </div>

      {/* Winner result card */}
      {selectedOption && !isSpinning && (
        <div
          className="animate-bounce-in w-full max-w-md rounded-3xl p-5 shadow-xl"
          style={{ background: "white", border: "2px solid rgba(45, 27, 105, 0.06)" }}
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

      {/* Footer */}
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
