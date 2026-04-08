"use client";

import { motion } from "framer-motion";
import type { GameStats } from "@/types/game";
import { isNative } from '@/lib/platform';

export interface ResultsScreenProps {
  stats: GameStats;
  activityTitle: string;
  themeEmoji: string;
  activityId: string;
  onReplay: () => void;
  onBack: () => void;
}

function formatTime(seconds: number): string {
  if (seconds < 60) {
    return `${seconds} saniye`;
  }
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (secs === 0) {
    return `${mins} dakika`;
  }
  return `${mins} dakika ${secs} saniye`;
}

function getEncouragementMessage(accuracy: number): string {
  if (accuracy === 100) return "Mükemmel! 🏆";
  if (accuracy >= 80) return "Harikasın! 🌟";
  if (accuracy >= 60) return "Çok iyi! 💪";
  return "İyi deneme! Tekrar deneyelim 🎯";
}

function getProgressBarColor(accuracy: number): string {
  if (accuracy > 80) return "#6BCB77";
  if (accuracy > 60) return "#FFD93D";
  return "#FF5252";
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 28, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring" as const, stiffness: 260, damping: 20 },
  },
};

export default function ResultsScreen({
  stats,
  activityTitle,
  themeEmoji,
  activityId,
  onReplay,
  onBack,
}: ResultsScreenProps) {
  const accuracy =
    stats.totalItems > 0
      ? Math.round((stats.correctCount / stats.totalItems) * 100)
      : 0;

  const encouragement = getEncouragementMessage(accuracy);
  const progressColor = getProgressBarColor(accuracy);

  const handleShare = async () => {
    const shareData = {
      title: activityTitle,
      text: `${activityTitle} — ${accuracy}% başarı oranı ile tamamladım!`,
      url: `${window.location.origin}/play/${activityId}`,
    };

    if (isNative()) {
      const { Share } = await import('@capacitor/share');
      await Share.share(shareData);
    } else if (navigator.share) {
      await navigator.share(shareData);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#FFF8F0] bg-dots-pattern px-4 py-10">
      <motion.div
        className="w-full max-w-md"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div
          variants={itemVariants}
          className="mb-6 flex flex-col items-center gap-2 text-center"
        >
          <motion.div
            className="mb-2 text-6xl"
            animate={{ rotate: [0, -8, 8, -4, 4, 0] }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            {themeEmoji}
          </motion.div>
          <h1 className="font-heading text-3xl font-bold text-[#2D1B69]">
            Oyun Bitti!
          </h1>
          <p className="font-heading text-base font-semibold text-[#8B7BAD]">
            {activityTitle}
          </p>
        </motion.div>

        {/* Encouragement Banner */}
        <motion.div
          variants={itemVariants}
          className="mb-5 rounded-3xl bg-white px-6 py-4 text-center shadow-xl"
          style={{ border: "2px solid rgba(45, 27, 105, 0.06)" }}
        >
          <p className="font-heading text-2xl font-bold text-[#FF6B9D]">
            {encouragement}
          </p>
        </motion.div>

        {/* Stats Cards */}
        <div className="mb-5 grid grid-cols-2 gap-3">
          {/* Correct */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col items-center gap-1 rounded-3xl bg-white px-4 py-5 shadow-xl"
            style={{ border: "2px solid rgba(45, 27, 105, 0.06)" }}
          >
            <span className="text-3xl">✅</span>
            <span className="font-heading text-3xl font-bold text-[#6BCB77]">
              {stats.correctCount}
            </span>
            <span className="font-heading text-sm font-semibold text-[#8B7BAD]">
              Doğru
            </span>
          </motion.div>

          {/* Wrong */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col items-center gap-1 rounded-3xl bg-white px-4 py-5 shadow-xl"
            style={{ border: "2px solid rgba(45, 27, 105, 0.06)" }}
          >
            <span className="text-3xl">❌</span>
            <span className="font-heading text-3xl font-bold text-[#FF5252]">
              {stats.wrongCount}
            </span>
            <span className="font-heading text-sm font-semibold text-[#8B7BAD]">
              Yanlış
            </span>
          </motion.div>

          {/* Time */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col items-center gap-1 rounded-3xl bg-white px-4 py-5 shadow-xl"
            style={{ border: "2px solid rgba(45, 27, 105, 0.06)" }}
          >
            <span className="text-3xl">⏱️</span>
            <span className="font-heading text-xl font-bold text-[#4D96FF]">
              {formatTime(stats.timeSeconds)}
            </span>
            <span className="font-heading text-sm font-semibold text-[#8B7BAD]">
              Süre
            </span>
          </motion.div>

          {/* Accuracy */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col items-center gap-1 rounded-3xl bg-white px-4 py-5 shadow-xl"
            style={{ border: "2px solid rgba(45, 27, 105, 0.06)" }}
          >
            <span className="text-3xl">🎯</span>
            <span
              className="font-heading text-3xl font-bold"
              style={{ color: progressColor }}
            >
              {accuracy}%
            </span>
            <span className="font-heading text-sm font-semibold text-[#8B7BAD]">
              Başarı Oranı
            </span>
          </motion.div>
        </div>

        {/* Progress Bar */}
        <motion.div
          variants={itemVariants}
          className="mb-7 rounded-3xl bg-white px-6 py-5 shadow-xl"
          style={{ border: "2px solid rgba(45, 27, 105, 0.06)" }}
        >
          <div className="mb-2 flex items-center justify-between">
            <span className="font-heading text-sm font-bold text-[#2D1B69]">
              Başarı Oranı
            </span>
            <span
              className="font-heading text-sm font-bold"
              style={{ color: progressColor }}
            >
              {accuracy}%
            </span>
          </div>
          <div className="h-4 w-full overflow-hidden rounded-full bg-[rgba(45,27,105,0.07)]">
            <motion.div
              className="h-full rounded-full"
              style={{ background: progressColor }}
              initial={{ width: 0 }}
              animate={{ width: `${accuracy}%` }}
              transition={{ duration: 0.9, delay: 0.5, ease: "easeOut" }}
            />
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col gap-3 sm:flex-row"
        >
          <button
            type="button"
            onClick={onReplay}
            className="btn-candy flex-1 rounded-2xl px-6 py-4 font-heading text-base font-bold text-white"
          >
            Tekrar Oyna 🔄
          </button>
          <button
            type="button"
            onClick={onBack}
            className="btn-blue flex-1 rounded-2xl px-6 py-4 font-heading text-base font-bold text-white"
          >
            Ana Sayfa ↩
          </button>
          <button
            type="button"
            onClick={handleShare}
            className="flex-1 rounded-2xl bg-[#8B7BAD] px-6 py-4 font-heading text-base font-bold text-white transition hover:bg-[#7A6B9C]"
          >
            Paylaş 📤
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}
