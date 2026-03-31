"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { Activity } from "@/types/activity";
import { getTheme } from "@/lib/themes";

function typeIcon(type: Activity["type"]): string {
  return type === "wheel" ? "🎡" : "🃏";
}

function formatCreatedAt(iso: string): string {
  try {
    return new Intl.DateTimeFormat("tr-TR", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default function HomePage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadActivities = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/activities");
      const data = await res.json();
      if (!res.ok) {
        setError(
          typeof data?.error === "string"
            ? data.error
            : "Etkinlikler yüklenemedi."
        );
        setActivities([]);
        return;
      }
      setActivities(Array.isArray(data) ? data : []);
    } catch {
      setError("Bağlantı hatası. Lütfen tekrar deneyin.");
      setActivities([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadActivities();
  }, [loadActivities]);

  const copyPlayLink = async (id: string) => {
    const url = `${window.location.origin}/play/${id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      window.setTimeout(() => setCopiedId(null), 2000);
    } catch {
      window.prompt("Bağlantıyı kopyalayın:", url);
    }
  };

  const handleDelete = async (activity: Activity) => {
    const ok = window.confirm(
      `"${activity.title}" etkinliğini silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`
    );
    if (!ok) return;

    setDeletingId(activity.id);
    try {
      const res = await fetch(`/api/activities/${activity.id}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        window.alert(
          typeof data?.error === "string"
            ? data.error
            : "Silme işlemi başarısız oldu."
        );
        return;
      }
      setActivities((prev) => prev.filter((a) => a.id !== activity.id));
    } catch {
      window.alert("Silme sırasında bir hata oluştu.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-fuchsia-50/40 to-amber-50/30">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-8 sm:py-12 lg:px-12">
        <header className="mb-10 text-center sm:mb-14">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 sm:text-4xl lg:text-5xl">
            Etkinlik Oluşturucu
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-base text-slate-500 sm:mt-4 sm:text-lg">
            Dil ve konuşma terapisi etkinlikleri oluştur ve paylaş
          </p>
          <div className="mx-auto mt-8 max-w-md sm:mt-10">
            <Link
              href="/create"
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 px-8 py-4 text-lg font-bold text-white shadow-lg shadow-fuchsia-500/30 transition hover:brightness-105 hover:shadow-xl hover:shadow-fuchsia-500/25 focus:outline-none focus-visible:ring-4 focus-visible:ring-fuchsia-300 active:scale-[0.98] sm:py-5 sm:text-xl"
            >
              ✨ Yeni Etkinlik Oluştur
            </Link>
          </div>
        </header>

        {loading && (
          <div className="flex flex-col items-center justify-center gap-4 py-24">
            <div
              className="h-12 w-12 animate-spin rounded-full border-4 border-violet-200 border-t-violet-500"
              aria-hidden
            />
            <p className="text-sm font-medium text-slate-500">Etkinlikler yükleniyor…</p>
          </div>
        )}

        {!loading && error && (
          <div
            role="alert"
            className="mx-auto max-w-sm rounded-2xl border border-red-200 bg-red-50/90 px-6 py-6 text-center text-red-800 shadow-sm"
          >
            <p className="text-base font-semibold">Bir şeyler ters gitti</p>
            <p className="mt-2 text-sm leading-relaxed">{error}</p>
            <button
              type="button"
              onClick={() => {
                setLoading(true);
                void loadActivities();
              }}
              className="mt-5 rounded-xl bg-red-100 px-5 py-2.5 text-sm font-semibold text-red-900 transition hover:bg-red-200"
            >
              Tekrar dene
            </button>
          </div>
        )}

        {!loading && !error && activities.length === 0 && (
          <div className="mx-auto max-w-sm rounded-3xl border border-violet-100 bg-white/80 px-8 py-16 text-center shadow-lg shadow-violet-100/80 backdrop-blur-sm">
            <div className="text-6xl" aria-hidden>
              🌈
            </div>
            <h2 className="mt-5 text-xl font-bold text-slate-800">
              Henüz etkinlik yok
            </h2>
            <p className="mx-auto mt-3 max-w-xs text-sm text-slate-500 leading-relaxed">
              İlk oyununu oluştur; çocuklar çarkı çevirsin veya kartları
              keşfetsin. Burası biraz sessiz — hadi renklendirelim!
            </p>
            <Link
              href="/create"
              className="mt-7 inline-flex rounded-xl bg-violet-100 px-6 py-3 text-sm font-semibold text-violet-800 transition hover:bg-violet-200"
            >
              Hadi başlayalım →
            </Link>
          </div>
        )}

        {!loading && !error && activities.length > 0 && (
          <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {activities.map((activity) => {
              const theme = getTheme(activity.theme);
              const busy = deletingId === activity.id;

              return (
                <li key={activity.id}>
                  <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-white/60 bg-white/90 shadow-md shadow-violet-100/50 backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-violet-200/40">
                    <div className="border-b border-slate-100 bg-gradient-to-r from-violet-50/80 to-fuchsia-50/50 px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span
                          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/70 text-2xl shadow-sm"
                          title={
                            activity.type === "wheel" ? "Çark" : "Kart"
                          }
                          aria-hidden
                        >
                          {typeIcon(activity.type)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <h2 className="truncate text-base font-bold text-slate-800">
                            {activity.title}
                          </h2>
                          <div className="mt-1 flex items-center gap-3">
                            <span className="flex items-center gap-1 text-xs font-medium text-slate-500">
                              <span aria-hidden>{theme.emoji}</span>
                              {theme.name}
                            </span>
                            <span className="text-xs text-slate-400">
                              {formatCreatedAt(activity.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-1 flex-col justify-end gap-3 p-4">
                      <div className="grid grid-cols-3 gap-2">
                        <Link
                          href={`/play/${activity.id}`}
                          className="flex items-center justify-center rounded-xl bg-emerald-500 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                        >
                          Oyna
                        </Link>
                        <Link
                          href={`/edit/${activity.id}`}
                          className="flex items-center justify-center rounded-xl bg-sky-500 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                        >
                          Düzenle
                        </Link>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void handleDelete(activity)}
                          className="flex items-center justify-center rounded-xl bg-rose-100 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-200 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
                        >
                          {busy ? "…" : "Sil"}
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => void copyPlayLink(activity.id)}
                        className="w-full rounded-xl border-2 border-dashed border-violet-200 bg-violet-50/50 py-2.5 text-sm font-semibold text-violet-700 transition hover:border-violet-300 hover:bg-violet-100/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-300"
                      >
                        {copiedId === activity.id
                          ? "✓ Kopyalandı!"
                          : "Bağlantıyı Kopyala"}
                      </button>
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
