"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import type { Activity } from "@/types/activity";
import { getTheme } from "@/lib/themes";
import SpinningWheel from "@/components/SpinningWheel";
import CardGrid from "@/components/CardGrid";
import CardStack from "@/components/CardStack";
import Celebration from "@/components/Celebration";

export default function PlayPage() {
  const { id } = useParams<{ id: string }>();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);

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

  const handleComplete = useCallback(() => {
    setShowCelebration(true);
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-violet-50 to-fuchsia-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-violet-200 border-t-violet-500" />
          <p className="text-slate-600">Etkinlik yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error || !activity) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-violet-50 to-fuchsia-50 px-4">
        <div className="max-w-md rounded-3xl bg-white p-8 text-center shadow-xl">
          <div className="text-5xl mb-4">😕</div>
          <h1 className="text-xl font-bold text-slate-800 mb-2">
            {error || "Etkinlik bulunamadı"}
          </h1>
          <p className="text-slate-600 mb-6">
            Bu etkinlik silinmiş veya bağlantı hatalı olabilir.
          </p>
          <Link
            href="/"
            className="inline-flex rounded-xl bg-violet-500 px-6 py-3 font-semibold text-white hover:bg-violet-600"
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
      <div className="flex items-center justify-between px-4 py-3 bg-white/80 backdrop-blur-sm border-b border-black/5">
        <Link
          href="/"
          className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
        >
          ← Ana Sayfa
        </Link>
        <h1 className="text-lg font-bold text-slate-800 truncate mx-4">
          {activity.title}
        </h1>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <span>{theme.emoji}</span>
          <span className="hidden sm:inline">{theme.name}</span>
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

      <Celebration
        show={showCelebration}
        text={theme.celebrationText}
        onClose={() => setShowCelebration(false)}
      />
    </div>
  );
}
