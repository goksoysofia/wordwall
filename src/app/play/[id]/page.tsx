"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import type { Activity } from "@/types/activity";
import { getTheme } from "@/lib/themes";
import SpinningWheel from "@/components/SpinningWheel";
import CardGrid from "@/components/CardGrid";
import CardStack from "@/components/CardStack";
import MatchGame from "@/components/MatchGame";
import GroupSort from "@/components/GroupSort";
import Quiz from "@/components/Quiz";
import MissingWord from "@/components/MissingWord";
import MemoryGame from "@/components/MemoryGame";
import BalloonPop from "@/components/BalloonPop";
import Celebration from "@/components/Celebration";
import ResultsScreen from "@/components/ResultsScreen";
import PrintView from "@/components/PrintView";
import StartLiveSession from "@/components/StartLiveSession";
import type { GameStats } from "@/types/game";

export default function PlayPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [gameStats, setGameStats] = useState<GameStats | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showPrint, setShowPrint] = useState(false);
  const [showLiveSession, setShowLiveSession] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await fetch(`/api/activities/${id}`);
        if (!res.ok) {
          setError("Etkinlik bulunamadı.");
          return;
        }
        const data = await res.json();
        setActivity(data);
      } catch {
        setError("Bağlantı hatası.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleComplete = useCallback((stats: GameStats) => {
    setGameStats(stats);
    setShowCelebration(true);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  }, []);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: "linear-gradient(135deg, #FFF8F0, #FFE8F5, #E8F4FD)" }}>
        <div className="flex flex-col items-center gap-5">
          <div className="relative">
            <div
              className="h-16 w-16 animate-spin rounded-full border-[4px] border-[#FFE8F5]"
              style={{ borderTopColor: "#FF6B9D" }}
            />
            <div className="absolute inset-0 flex items-center justify-center text-2xl">
              🎮
            </div>
          </div>
          <p className="font-heading text-lg font-bold text-[#8B7BAD]">Etkinlik yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error || !activity) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4" style={{ background: "linear-gradient(135deg, #FFF8F0, #FFE8F5)" }}>
        <div className="card-playful max-w-md p-8 text-center">
          <div className="mb-4 text-5xl">😕</div>
          <h1 className="font-heading text-xl font-bold text-[#2D1B69] mb-2">
            {error || "Etkinlik bulunamadı"}
          </h1>
          <p className="text-[#8B7BAD] font-semibold mb-6">
            Bu etkinlik silinmiş veya bağlantı hatalı olabilir.
          </p>
          <Link
            href="/dashboard"
            className="btn-candy inline-flex px-8 py-3 text-base"
          >
            Ana Sayfaya Dön
          </Link>
        </div>
      </div>
    );
  }

  const theme = getTheme(activity.theme);

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.backgroundColor }}>
      {/* Playful Header Bar */}
      <div
        className="flex items-center justify-between px-4 py-3 sm:px-6"
        style={{
          background: "rgba(255,255,255,0.85)",
          backdropFilter: "blur(12px)",
          borderBottom: "2px solid rgba(45, 27, 105, 0.06)",
        }}
      >
        <Link
          href="/dashboard"
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F8F5FF] text-[#8B7BAD] transition hover:scale-105 hover:bg-[#F0EAFF]"
          style={{ border: "2px solid rgba(45, 27, 105, 0.06)" }}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="font-heading text-lg font-bold text-[#2D1B69] truncate mx-4">
          {activity.title}
        </h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleFullscreen}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F8F5FF] text-[#8B7BAD] transition hover:scale-105 hover:bg-[#F0EAFF]"
            style={{ border: "2px solid rgba(45, 27, 105, 0.06)" }}
            title={isFullscreen ? "Tam ekrandan çık" : "Tam ekran"}
          >
            {isFullscreen ? (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 9L4 4m0 0v4m0-4h4m6 6l5 5m0 0v-4m0 4h-4M9 15l-5 5m0 0v-4m0 4h4m6-6l5-5m0 0v4m0-4h-4" />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0 0l-5-5m-7 14H4m0 0v-4m0 4l5-5m11 5h-4m4 0v-4m0 0l-5 5" />
              </svg>
            )}
          </button>
          <button
            type="button"
            onClick={() => setShowPrint(true)}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F8F5FF] text-[#8B7BAD] transition hover:scale-105 hover:bg-[#F0EAFF]"
            style={{ border: "2px solid rgba(45, 27, 105, 0.06)" }}
            title="Yazdır"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => setShowLiveSession(true)}
            className="flex h-10 items-center gap-1.5 rounded-xl bg-[#FF6B9D] px-3 text-sm font-bold text-white transition hover:scale-105 hover:bg-[#FF5A8A]"
            title="Canlı Oturum Başlat"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <span className="hidden sm:inline">Canlı</span>
          </button>
          <div className="flex items-center gap-2 rounded-full bg-[#F8F5FF] px-3 py-1.5 text-sm font-bold text-[#8B7BAD]" style={{ border: "2px solid rgba(45, 27, 105, 0.06)" }}>
            <span>{theme.emoji}</span>
            <span className="hidden sm:inline">{theme.name}</span>
          </div>
        </div>
      </div>

      {activity.type === "wheel" && (
        <SpinningWheel
          options={activity.options}
          theme={theme}
          onComplete={handleComplete}
        />
      )}

      {activity.type === "card" && activity.display_mode === "grid" && (
        <CardGrid
          options={activity.options}
          theme={theme}
          onComplete={handleComplete}
        />
      )}

      {activity.type === "card" && activity.display_mode === "stack" && (
        <CardStack
          options={activity.options}
          theme={theme}
          onComplete={handleComplete}
        />
      )}

      {activity.type === "match" && (
        <MatchGame
          options={activity.options}
          theme={theme}
          showFeedback={activity.show_feedback}
          onComplete={handleComplete}
        />
      )}

      {activity.type === "group-sort" && (
        <GroupSort
          options={activity.options}
          theme={theme}
          showFeedback={activity.show_feedback}
          onComplete={handleComplete}
        />
      )}

      {activity.type === "quiz" && (
        <Quiz
          options={activity.options}
          title={activity.title}
          theme={theme}
          showFeedback={activity.show_feedback}
          onComplete={handleComplete}
        />
      )}

      {activity.type === "missing-word" && (
        <MissingWord
          options={activity.options}
          title={activity.title}
          theme={theme}
          showFeedback={activity.show_feedback}
          onComplete={handleComplete}
        />
      )}

      {activity.type === "memory" && (
        <MemoryGame
          options={activity.options}
          theme={theme}
          onComplete={handleComplete}
        />
      )}

      {activity.type === "balloon-pop" && (
        <BalloonPop
          options={activity.options}
          title={activity.title}
          theme={theme}
          showFeedback={activity.show_feedback}
          onComplete={handleComplete}
        />
      )}

      <Celebration
        show={showCelebration}
        text={theme.celebrationText}
        onClose={() => setShowCelebration(false)}
      />

      {gameStats && !showCelebration && (
        <ResultsScreen
          stats={gameStats}
          activityTitle={activity.title}
          themeEmoji={theme.emoji}
          activityId={activity.id}
          onReplay={() => {
            setGameStats(null);
            window.location.reload();
          }}
          onBack={() => router.push("/dashboard")}
        />
      )}

      {showPrint && activity && (
        <PrintView activity={activity} onClose={() => setShowPrint(false)} />
      )}

      {showLiveSession && activity && (
        <StartLiveSession
          activityId={activity.id}
          activityTitle={activity.title}
          onClose={() => setShowLiveSession(false)}
        />
      )}
    </div>
  );
}
