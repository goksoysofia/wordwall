"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import type { Activity } from "@/types/activity";
import { getTheme } from "@/lib/themes";
import dynamic from "next/dynamic";
import { usePreferences, togglePreference } from "@/lib/preferences";
// Çekirdek akış bileşenleri — hemen gerekli olduğundan statik kalır.
import Celebration from "@/components/Celebration";
import ResultsScreen from "@/components/ResultsScreen";
import ThemedBackground from "@/components/ThemedBackground";
import type { GameStats } from "@/types/game";

// Oyun chunk'ı yüklenirken gösterilen hafif yer tutucu.
function GameLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div
        className="h-12 w-12 animate-spin rounded-full border-4 border-[#FFE8F5]"
        style={{ borderTopColor: "#FF6B9D" }}
        aria-label="Oyun yükleniyor"
        role="status"
      />
    </div>
  );
}

// Oyun bileşenlerini kod-böl: play rotası 18 oyunun tamamını tek bundle'da
// taşımak yerine yalnızca açılan etkinliğin chunk'ını indirir → çok daha
// hafif ve hızlı ilk yük (native uygulama hissi için kritik).
const SpinningWheel = dynamic(() => import("@/components/SpinningWheel"), { ssr: false, loading: GameLoading });
const CardGrid = dynamic(() => import("@/components/CardGrid"), { ssr: false, loading: GameLoading });
const CardStack = dynamic(() => import("@/components/CardStack"), { ssr: false, loading: GameLoading });
const MatchGame = dynamic(() => import("@/components/MatchGame"), { ssr: false, loading: GameLoading });
const GroupSort = dynamic(() => import("@/components/GroupSort"), { ssr: false, loading: GameLoading });
const Quiz = dynamic(() => import("@/components/Quiz"), { ssr: false, loading: GameLoading });
const MissingWord = dynamic(() => import("@/components/MissingWord"), { ssr: false, loading: GameLoading });
const MemoryGame = dynamic(() => import("@/components/MemoryGame"), { ssr: false, loading: GameLoading });
const BalloonPop = dynamic(() => import("@/components/BalloonPop"), { ssr: false, loading: GameLoading });
const SequenceGame = dynamic(() => import("@/components/SequenceGame"), { ssr: false, loading: GameLoading });
const SentenceGame = dynamic(() => import("@/components/SentenceGame"), { ssr: false, loading: GameLoading });
const UnscrambleGame = dynamic(() => import("@/components/UnscrambleGame"), { ssr: false, loading: GameLoading });
const OddOneOut = dynamic(() => import("@/components/OddOneOut"), { ssr: false, loading: GameLoading });
const TrueFalse = dynamic(() => import("@/components/TrueFalse"), { ssr: false, loading: GameLoading });
const ListenChoose = dynamic(() => import("@/components/ListenChoose"), { ssr: false, loading: GameLoading });
const WordSearch = dynamic(() => import("@/components/WordSearch"), { ssr: false, loading: GameLoading });
const Flashcards = dynamic(() => import("@/components/Flashcards"), { ssr: false, loading: GameLoading });
const BingoGame = dynamic(() => import("@/components/BingoGame"), { ssr: false, loading: GameLoading });
const SyllableCount = dynamic(() => import("@/components/SyllableCount"), { ssr: false, loading: GameLoading });

// On-demand modaller — yalnızca açılınca yüklensin.
const PrintView = dynamic(() => import("@/components/PrintView"), { ssr: false });
const StartLiveSession = dynamic(() => import("@/components/StartLiveSession"), { ssr: false });

export default function PlayPage() {
  const { id } = useParams<{ id: string | string[] }>();
  const router = useRouter();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [gameStats, setGameStats] = useState<GameStats | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showPrint, setShowPrint] = useState(false);
  const [showLiveSession, setShowLiveSession] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [nameSubmitted, setNameSubmitted] = useState(false);
  // Tekrar oyna: tam sayfa yenileme yerine oyunu remount ederek sıfırla
  // (anında, yeniden fetch yok, girilen danışan adı korunur).
  const [playCount, setPlayCount] = useState(0);
  // Ses tercihi (haptik ayrı yönetilir) — terapist sessiz seansta kısabilsin.
  const prefs = usePreferences();

  useEffect(() => {
    if (!id || (Array.isArray(id) && id.length === 0)) {
      setError("Geçersiz etkinlik bağlantısı.");
      setLoading(false);
      return;
    }
    const activityId = Array.isArray(id) ? id[0] : id;
    (async () => {
      const controller = new AbortController();
      const timeoutMs = 20000;
      const t = window.setTimeout(() => controller.abort(), timeoutMs);
      try {
        const res = await fetch(`/api/activities/${activityId}`, {
          signal: controller.signal,
        });
        if (!res.ok) {
          setError("Etkinlik bulunamadı.");
          return;
        }
        const data = await res.json();
        setActivity(data);
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") {
          setError("Sunucu çok geç yanıt verdi. Ağı kontrol edip yeniden deneyin.");
        } else if (typeof navigator !== "undefined" && !navigator.onLine) {
          // Çevrimdışı ve etkinlik daha önce açılmadığı için cache'te yok.
          setError("Çevrimdışısın. Bu etkinlik bu cihazda henüz açılmadığı için kayıtlı değil.");
        } else {
          setError("Bağlantı hatası.");
        }
      } finally {
        window.clearTimeout(t);
        setLoading(false);
      }
    })();
  }, [id]);

  const handleComplete = useCallback((stats: GameStats) => {
    setGameStats(stats);
    setShowCelebration(true);

    if (activity?.id) {
      fetch("/api/notify-completion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activityId: activity.id,
          playerName: playerName.trim(),
          stats,
        }),
      }).catch((err) => {
        console.error("[notify-completion] Error:", err);
      });
    }
  }, [activity?.id, playerName]);

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
  const cardMode =
    activity.type === "card"
      ? activity.display_mode === "stack"
        ? "stack"
        : "grid"
      : null;

  if (activity && !nameSubmitted) {
    return (
      <div
        className="flex min-h-screen items-center justify-center p-4 relative overflow-hidden"
        style={{ backgroundColor: theme.backgroundColor }}
      >
        <ThemedBackground decorEmojis={theme.decorEmojis} backgroundColor={theme.backgroundColor} />
        
        <motion.div
          className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl text-center relative z-10 border-4 border-white/80"
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", duration: 0.6 }}
        >
          <div className="text-6xl mb-4 animate-bounce">👋</div>
          
          <h2 className="font-heading text-2xl font-extrabold text-[#2D1B69] mb-2 sm:text-3xl">
            Hoş Geldin!
          </h2>
          
          <p className="text-[#8B7BAD] font-bold text-sm sm:text-base mb-6">
            Oyuna başlamadan önce lütfen adını yaz:
          </p>
          
          <form onSubmit={(e) => {
            e.preventDefault();
            if (playerName.trim().length >= 2) {
              setNameSubmitted(true);
            }
          }}>
            <div className="relative mb-6">
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Adın ve Soyadın..."
                maxLength={40}
                required
                autoFocus
                className="w-full rounded-2xl border-3 border-indigo-100 bg-slate-50 px-5 py-4 text-center font-heading text-lg font-bold text-[#2D1B69] placeholder:text-[#8B7BAD]/60 focus:border-[#FF6B9D] focus:bg-white focus:outline-none transition-all duration-300"
              />
            </div>
            
            <button
              type="submit"
              disabled={playerName.trim().length < 2}
              className="w-full py-4 rounded-2xl font-heading text-lg font-bold text-white shadow-lg transition-all duration-300 disabled:opacity-50 disabled:shadow-none enabled:hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              }}
            >
              Başla 🎮
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.backgroundColor }}>
      {/* Playful Header Bar */}
      <div
        className="flex items-center justify-between px-4 py-3 sm:px-6"
        style={{
          paddingTop: 'calc(env(safe-area-inset-top, 0px) + 0.75rem)',
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
        <h1 className="font-heading text-base font-bold text-[#2D1B69] truncate mx-2 sm:text-lg sm:mx-4">
          {activity.title}
        </h1>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => togglePreference("sound")}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F8F5FF] text-[#8B7BAD] transition hover:scale-105 hover:bg-[#F0EAFF]"
            style={{ border: "2px solid rgba(45, 27, 105, 0.06)" }}
            title={prefs.sound ? "Sesi kapat" : "Sesi aç"}
            aria-label={prefs.sound ? "Sesi kapat" : "Sesi aç"}
            aria-pressed={!prefs.sound}
          >
            {prefs.sound ? (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.25 9.75L19.5 12m0 0l2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
              </svg>
            )}
          </button>
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
          <div className="hidden items-center gap-2 rounded-full bg-[#F8F5FF] px-3 py-1.5 text-sm font-bold text-[#8B7BAD] sm:flex" style={{ border: "2px solid rgba(45, 27, 105, 0.06)" }}>
            <span>{theme.emoji}</span>
            <span className="hidden sm:inline">{theme.name}</span>
          </div>
        </div>
      </div>

      <Fragment key={playCount}>
      {activity.type === "wheel" && (
        <SpinningWheel
          options={activity.options}
          theme={theme}
          onComplete={handleComplete}
        />
      )}

      {activity.type === "card" && cardMode === "grid" && (
        <CardGrid
          options={activity.options}
          theme={theme}
          onComplete={handleComplete}
        />
      )}

      {activity.type === "card" && cardMode === "stack" && (
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
          displayMode={(activity.display_mode === "pop" || activity.display_mode === "read") ? activity.display_mode : "pop"}
          onComplete={handleComplete}
        />
      )}

      {activity.type === "sequence" && (
        <SequenceGame
          options={activity.options}
          title={activity.title}
          theme={theme}
          showFeedback={activity.show_feedback}
          onComplete={handleComplete}
        />
      )}

      {activity.type === "sentence" && (
        <SentenceGame
          options={activity.options}
          title={activity.title}
          theme={theme}
          showFeedback={activity.show_feedback}
          onComplete={handleComplete}
        />
      )}

      {activity.type === "unscramble" && (
        <UnscrambleGame
          options={activity.options}
          title={activity.title}
          theme={theme}
          showFeedback={activity.show_feedback}
          onComplete={handleComplete}
        />
      )}

      {activity.type === "odd-one-out" && (
        <OddOneOut
          options={activity.options}
          title={activity.title}
          theme={theme}
          showFeedback={activity.show_feedback}
          onComplete={handleComplete}
        />
      )}

      {activity.type === "true-false" && (
        <TrueFalse
          options={activity.options}
          title={activity.title}
          theme={theme}
          showFeedback={activity.show_feedback}
          onComplete={handleComplete}
        />
      )}

      {activity.type === "listen-choose" && (
        <ListenChoose
          options={activity.options}
          title={activity.title}
          theme={theme}
          showFeedback={activity.show_feedback}
          onComplete={handleComplete}
        />
      )}

      {activity.type === "word-search" && (
        <WordSearch
          options={activity.options}
          title={activity.title}
          theme={theme}
          onComplete={handleComplete}
        />
      )}

      {activity.type === "flashcards" && (
        <Flashcards
          options={activity.options}
          title={activity.title}
          theme={theme}
          onComplete={handleComplete}
        />
      )}

      {activity.type === "bingo" && (
        <BingoGame
          options={activity.options}
          title={activity.title}
          theme={theme}
          showFeedback={activity.show_feedback}
          onComplete={handleComplete}
        />
      )}

      {activity.type === "syllable-count" && (
        <SyllableCount
          options={activity.options}
          title={activity.title}
          theme={theme}
          showFeedback={activity.show_feedback}
          onComplete={handleComplete}
        />
      )}
      </Fragment>

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
            setShowCelebration(false);
            setPlayCount((c) => c + 1);
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
