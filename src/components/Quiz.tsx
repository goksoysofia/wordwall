"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { playCorrectSound, playWrongSound } from "@/lib/sounds";
import type { GameStats, WrongItem } from "@/types/game";
import type { QuizAnswer } from "@/types/activity";
import ThemedBackground from "@/components/ThemedBackground";

interface ParsedQuestion {
  id: string;
  question: string;
  imageUrl?: string;
  answers: QuizAnswer[];
}

export interface QuizProps {
  options: {
    id: string;
    text?: string;
    imageUrl?: string;
    isCorrect?: boolean;
    question?: string;
    answers?: { id: string; text?: string; imageUrl?: string; isCorrect?: boolean }[];
  }[];
  title: string;
  theme: {
    backgroundColor: string;
    cardColors: string[];
    decorEmojis: string[];
    celebrationText: string;
    emoji: string;
  };
  showFeedback?: boolean;
  onComplete: (stats: GameStats) => void;
}

/**
 * Parse options into a normalized array of questions.
 * Supports both old format (single question via title + flat options)
 * and new format (each option is a question with nested answers).
 */
function parseQuestions(
  options: QuizProps["options"],
  title: string
): ParsedQuestion[] {
  // New format: options contain nested question + answers
  if (options.length > 0 && options[0].question && options[0].answers) {
    return options.map((opt) => ({
      id: opt.id,
      question: opt.question!,
      imageUrl: opt.imageUrl,
      answers: opt.answers!,
    }));
  }

  // Old format: title is the question, options are answers
  return [
    {
      id: "legacy-q",
      question: title,
      answers: options.map((opt) => ({
        id: opt.id,
        text: opt.text,
        imageUrl: opt.imageUrl,
        isCorrect: opt.isCorrect,
      })),
    },
  ];
}

export default function Quiz({
  options,
  title,
  theme,
  showFeedback = true,
  onComplete,
}: QuizProps) {
  const questions = useMemo(() => parseQuestions(options, title), [options, title]);
  const totalQuestions = questions.length;

  const startTime = useRef(Date.now());
  const hasCompletedRef = useRef(false);
  const wrongItemsRef = useRef<WrongItem[]>([]);
  const scoreRef = useRef({ correct: 0, wrong: 0 });
  // Hangi soruların skoru kaydedildiği — her soru yalnızca bir kez (ilk cevapta) sayılır.
  const scoredRef = useRef<Set<string>>(new Set());

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [transitioning, setTransitioning] = useState(false);

  const currentQ = questions[currentIndex];

  const handleAnswer = useCallback(
    (answerId: string) => {
      if (answered || transitioning) return;
      setSelected(answerId);
      setAnswered(true);

      const answer = currentQ.answers.find((a) => a.id === answerId);
      const correct = answer?.isCorrect === true;
      setIsCorrect(correct);

      // Skoru ve hatalı öğeyi soru başına yalnızca İLK cevapta kaydet; "Tekrar Dene"
      // ile yeniden denemeler skoru şişirmesin ve aynı soruyu rapora birden çok kez
      // yazmasın. Böylece correct + wrong = toplam soru sayısı olur.
      if (!scoredRef.current.has(currentQ.id)) {
        scoredRef.current.add(currentQ.id);
        if (correct) {
          scoreRef.current.correct += 1;
        } else {
          scoreRef.current.wrong += 1;
          const correctAns = currentQ.answers.find((a) => a.isCorrect);
          wrongItemsRef.current.push({
            text: currentQ.question,
            correctAnswer: correctAns?.text || "",
            userAnswer: answer?.text || "",
          });
        }
      }

      if (correct) {
        if (showFeedback) playCorrectSound();
      } else {
        if (showFeedback) playWrongSound();
        setAttempts((a) => a + 1);
      }
    },
    [answered, transitioning, currentQ, showFeedback]
  );

  // Move to next question or complete the quiz
  const advanceToNext = useCallback(() => {
    if (hasCompletedRef.current) return;

    const nextIndex = currentIndex + 1;
    if (nextIndex >= totalQuestions) {
      // Quiz finished
      hasCompletedRef.current = true;
      const stats: GameStats = {
        totalItems: totalQuestions,
        correctCount: scoreRef.current.correct,
        wrongCount: scoreRef.current.wrong,
        timeSeconds: Math.round((Date.now() - startTime.current) / 1000),
        completedAt: new Date().toISOString(),
        wrongItems: wrongItemsRef.current,
      };
      onComplete(stats);
    } else {
      // Transition to next question
      setTransitioning(true);
      setTimeout(() => {
        setCurrentIndex(nextIndex);
        setSelected(null);
        setAnswered(false);
        setIsCorrect(false);
        setAttempts(0);
        setTransitioning(false);
      }, 400);
    }
  }, [currentIndex, totalQuestions, onComplete]);

  // Auto-advance after answer
  useEffect(() => {
    if (!answered || hasCompletedRef.current) return;

    const shouldAdvance = showFeedback
      ? isCorrect || attempts >= 3
      : true;
    if (!shouldAdvance) return;

    const t = setTimeout(() => advanceToNext(), 1500);
    return () => clearTimeout(t);
  }, [answered, isCorrect, attempts, showFeedback, advanceToNext]);

  const retryQuestion = useCallback(() => {
    setSelected(null);
    setAnswered(false);
    setIsCorrect(false);
  }, []);

  const getOptionStyle = (opt: { id: string; isCorrect?: boolean }) => {
    if (!answered) {
      return {
        border: "3px solid rgba(45, 27, 105, 0.08)",
        background: "white",
      };
    }
    if (!showFeedback) {
      if (opt.id === selected) {
        return { border: "3px solid #6366f1", background: "#eef2ff" };
      }
      return {
        border: "3px solid rgba(45, 27, 105, 0.06)",
        background: "rgba(255,255,255,0.5)",
        opacity: 0.5,
      };
    }
    if (opt.id === selected) {
      return isCorrect
        ? { border: "3px solid #22c55e", background: "#f0fdf4" }
        : { border: "3px solid #ef4444", background: "#fef2f2" };
    }
    if (opt.isCorrect && !isCorrect) {
      return { border: "3px solid #22c55e", background: "#f0fdf4" };
    }
    return {
      border: "3px solid rgba(45, 27, 105, 0.06)",
      background: "rgba(255,255,255,0.5)",
      opacity: 0.5,
    };
  };

  return (
    <div
      className="relative flex min-h-screen flex-col items-center gap-6 px-3 py-8 md:px-6"
      style={{ backgroundColor: theme.backgroundColor }}
    >
      <ThemedBackground
        decorEmojis={theme.decorEmojis}
        backgroundColor={theme.backgroundColor}
      />

      {/* Progress Bar — only show if multiple questions */}
      {totalQuestions > 1 && (
        <motion.div
          className="w-full max-w-lg"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="mb-1 flex items-center justify-between px-1">
            <span className="font-heading text-xs font-bold text-[#8B7BAD]">
              Soru {currentIndex + 1}/{totalQuestions}
            </span>
            <span className="font-heading text-xs font-bold text-[#8B7BAD]">
              {theme.emoji}
            </span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/60 shadow-inner">
            <motion.div
              className="h-full rounded-full"
              style={{
                background: "linear-gradient(90deg, #FF6B9D, #FF8A50)",
              }}
              initial={{ width: 0 }}
              animate={{
                width: `${((currentIndex + (answered ? 1 : 0)) / totalQuestions) * 100}%`,
              }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </motion.div>
      )}

      {/* Question + Answers with AnimatePresence for smooth transitions */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQ.id}
          className="flex w-full flex-col items-center gap-6"
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -60 }}
          transition={{ duration: 0.35 }}
        >
          {/* Question Card */}
          <motion.div
            className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-xl sm:p-8"
            style={{ border: "3px solid rgba(45, 27, 105, 0.08)" }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {totalQuestions > 1 && (
              <div className="mb-2 text-center text-xs font-bold uppercase tracking-wider text-[#8B7BAD]">
                Soru {currentIndex + 1} {theme.emoji}
              </div>
            )}
            {totalQuestions === 1 && (
              <div className="mb-2 text-center text-xs font-bold uppercase tracking-wider text-[#8B7BAD]">
                Soru {theme.emoji}
              </div>
            )}
            <h2 className="text-center font-heading text-xl font-bold text-[#2D1B69] sm:text-2xl">
              {currentQ.question}
            </h2>
            {currentQ.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={currentQ.imageUrl}
                alt=""
                className="mx-auto mt-4 max-h-48 rounded-2xl object-contain"
              />
            )}
          </motion.div>

          {/* Options */}
          {(() => {
            const hasImages = currentQ.answers.some((a) => a.imageUrl);
            return (
              <div
                className={`grid w-full gap-3 ${
                  hasImages
                    ? "max-w-2xl grid-cols-2"
                    : "max-w-lg grid-cols-1"
                }`}
              >
                {currentQ.answers.map((opt, idx) => {
                  const color =
                    theme.cardColors[idx % theme.cardColors.length];
                  return (
                    <motion.button
                      key={opt.id}
                      type="button"
                      onClick={() => handleAnswer(opt.id)}
                      disabled={answered || transitioning}
                      className={`relative overflow-hidden rounded-2xl transition-all duration-200 disabled:cursor-default ${
                        hasImages
                          ? "flex flex-col items-center gap-2 p-3 sm:p-4"
                          : "flex min-h-[64px] items-center gap-4 px-5 py-4 text-left"
                      }`}
                      style={getOptionStyle(opt)}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{
                        opacity: 1,
                        x: 0,
                        scale:
                          showFeedback &&
                          answered &&
                          opt.id === selected &&
                          !isCorrect
                            ? [1, 1.02, 0.98, 1]
                            : 1,
                      }}
                      transition={{ delay: idx * 0.08 }}
                      whileHover={
                        !answered && !transitioning
                          ? { scale: 1.02, borderColor: color }
                          : undefined
                      }
                      whileTap={
                        !answered && !transitioning
                          ? { scale: 0.98 }
                          : undefined
                      }
                    >
                      {/* Letter badge */}
                      <div
                        className={`flex shrink-0 items-center justify-center rounded-xl font-heading font-bold text-white ${
                          hasImages
                            ? "absolute left-2 top-2 h-8 w-8 text-sm sm:h-9 sm:w-9"
                            : "h-10 w-10 text-base"
                        }`}
                        style={{
                          background:
                            showFeedback && answered && opt.isCorrect
                              ? "#22c55e"
                              : color,
                        }}
                      >
                        {showFeedback && answered && opt.id === selected
                          ? isCorrect
                            ? "✓"
                            : "✗"
                          : String.fromCharCode(65 + idx)}
                      </div>
                      {opt.imageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={opt.imageUrl}
                          alt=""
                          className={`rounded-xl object-cover ${
                            hasImages ? "aspect-square w-full" : "h-14 w-14"
                          }`}
                        />
                      )}
                      {opt.text && (
                        <span
                          className={`font-heading font-bold text-[#2D1B69] ${
                            hasImages
                              ? "text-center text-sm sm:text-base"
                              : "text-base"
                          }`}
                        >
                          {opt.text}
                        </span>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            );
          })()}

          {/* Feedback */}
          {showFeedback && answered && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`rounded-2xl px-6 py-3 text-center font-heading text-base font-bold shadow-md ${
                isCorrect
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-rose-100 text-rose-700"
              }`}
            >
              {isCorrect
                ? "Doğru! Harikasın! 🎉"
                : attempts >= 3
                ? "Yanlış! Doğru cevap gösterildi."
                : "Yanlış! Tekrar dene 💪"}
            </motion.div>
          )}

          {/* No-feedback: neutral "selected" message */}
          {!showFeedback && answered && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-2xl bg-indigo-100 px-6 py-3 text-center font-heading text-base font-bold text-indigo-700 shadow-md"
            >
              Cevabın kaydedildi! ✨
            </motion.div>
          )}

          {/* Retry — only when feedback is on */}
          {showFeedback && answered && !isCorrect && attempts < 3 && (
            <button
              type="button"
              onClick={retryQuestion}
              className="btn-candy rounded-2xl px-8 py-3 text-base"
            >
              Tekrar Dene 🔄
            </button>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
