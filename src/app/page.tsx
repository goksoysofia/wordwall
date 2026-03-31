"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { Activity } from "@/types/activity";
import { getTheme } from "@/lib/themes";

function typeLabel(type: Activity["type"]): { icon: string; label: string } {
  return type === "wheel"
    ? { icon: "🎡", label: "Çark" }
    : { icon: "🃏", label: "Kart" };
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
    <div className="relative min-h-screen overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50" />
        <div className="absolute left-[-10%] top-[-20%] h-[600px] w-[600px] rounded-full bg-indigo-100/40 blur-3xl" />
        <div className="absolute bottom-[-10%] right-[-10%] h-[500px] w-[500px] rounded-full bg-purple-100/40 blur-3xl" />
        <div className="absolute left-[50%] top-[30%] h-[400px] w-[400px] rounded-full bg-pink-100/30 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        {/* Header */}
        <header className="animate-fade-in mb-12 text-center sm:mb-16">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white/80 px-4 py-1.5 text-sm font-medium text-indigo-600 shadow-sm backdrop-blur-sm">
            <span className="inline-block h-2 w-2 rounded-full bg-indigo-500" />
            Dil ve Konuşma Terapisi
          </div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
            Etkinlik{" "}
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Oluşturucu
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-md text-base text-slate-500 sm:text-lg">
            Etkinlikleri kolayca oluştur, düzenle ve paylaş.
          </p>

          <div className="mx-auto mt-8 max-w-sm sm:mt-10">
            <Link
              href="/create"
              className="btn-primary group flex w-full items-center justify-center gap-3 rounded-2xl px-8 py-4 text-lg font-bold text-white shadow-lg shadow-indigo-500/25 sm:py-5 sm:text-xl"
            >
              <span className="text-2xl transition-transform duration-300 group-hover:scale-110">
                +
              </span>
              Yeni Etkinlik Oluştur
            </Link>
          </div>
        </header>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center gap-5 py-24">
            <div className="relative">
              <div className="h-14 w-14 animate-spin rounded-full border-[3px] border-indigo-100 border-t-indigo-600" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-6 w-6 rounded-full bg-indigo-50" />
              </div>
            </div>
            <p className="text-sm font-medium text-slate-400">Yükleniyor...</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="animate-scale-in mx-auto max-w-sm">
            <div className="glass-strong rounded-3xl border border-red-100 p-8 text-center shadow-lg">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-2xl">
                !
              </div>
              <p className="text-base font-semibold text-slate-800">
                Bir şeyler ters gitti
              </p>
              <p className="mt-2 text-sm text-slate-500">{error}</p>
              <button
                type="button"
                onClick={() => {
                  setLoading(true);
                  void loadActivities();
                }}
                className="mt-6 rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Tekrar dene
              </button>
            </div>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && activities.length === 0 && (
          <div className="animate-slide-up mx-auto max-w-sm">
            <div className="glass-strong rounded-3xl border border-slate-100 p-10 text-center shadow-xl">
              <div className="animate-float mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-50 to-purple-50 text-5xl shadow-inner">
                🌈
              </div>
              <h2 className="text-xl font-bold text-slate-800">
                Henüz etkinlik yok
              </h2>
              <p className="mx-auto mt-3 max-w-[260px] text-sm leading-relaxed text-slate-400">
                İlk etkinliğini oluştur ve çocukların eğlenerek
                öğrenmesini sağla!
              </p>
              <Link
                href="/create"
                className="mt-8 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Başla
                <span className="text-base">→</span>
              </Link>
            </div>
          </div>
        )}

        {/* Activity Grid */}
        {!loading && !error && activities.length > 0 && (
          <>
            <div className="animate-fade-in mb-6 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
                Etkinliklerim ({activities.length})
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {activities.map((activity, idx) => {
                const theme = getTheme(activity.theme);
                const busy = deletingId === activity.id;
                const { icon, label } = typeLabel(activity.type);

                return (
                  <div
                    key={activity.id}
                    className={`animate-slide-up stagger-${Math.min(idx + 1, 6)}`}
                  >
                    <article className="card-hover group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm">
                      {/* Card Header */}
                      <div
                        className="relative px-5 pb-4 pt-5"
                        style={{
                          background: `linear-gradient(135deg, ${theme.backgroundColor}, ${theme.cardColors[0]}15)`,
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/80 text-2xl shadow-sm ring-1 ring-black/5 backdrop-blur-sm">
                            {icon}
                          </div>
                          <div className="min-w-0 flex-1 pt-0.5">
                            <h3 className="truncate text-[15px] font-bold text-slate-800">
                              {activity.title}
                            </h3>
                            <div className="mt-1.5 flex flex-wrap items-center gap-2">
                              <span className="inline-flex items-center gap-1 rounded-full bg-white/60 px-2 py-0.5 text-xs font-medium text-slate-600 backdrop-blur-sm">
                                {theme.emoji} {theme.name}
                              </span>
                              <span className="inline-flex items-center rounded-full bg-white/60 px-2 py-0.5 text-xs font-medium text-slate-500 backdrop-blur-sm">
                                {label}
                              </span>
                            </div>
                          </div>
                        </div>
                        <p className="mt-3 text-[11px] font-medium text-slate-400">
                          {formatCreatedAt(activity.created_at)}
                        </p>
                      </div>

                      {/* Card Actions */}
                      <div className="flex flex-1 flex-col justify-end p-4 pt-3">
                        <div className="grid grid-cols-3 gap-2">
                          <Link
                            href={`/play/${activity.id}`}
                            className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500 py-2.5 text-[13px] font-semibold text-white transition hover:bg-emerald-600 active:scale-[0.97]"
                          >
                            <span className="text-sm">▶</span>
                            Oyna
                          </Link>
                          <Link
                            href={`/edit/${activity.id}`}
                            className="flex items-center justify-center gap-1.5 rounded-xl bg-slate-100 py-2.5 text-[13px] font-semibold text-slate-700 transition hover:bg-slate-200 active:scale-[0.97]"
                          >
                            Düzenle
                          </Link>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => void handleDelete(activity)}
                            className="flex items-center justify-center rounded-xl bg-slate-100 py-2.5 text-[13px] font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-40 active:scale-[0.97]"
                          >
                            {busy ? "..." : "Sil"}
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => void copyPlayLink(activity.id)}
                          className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 text-[13px] font-semibold text-slate-500 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 active:scale-[0.98]"
                        >
                          {copiedId === activity.id ? (
                            <>
                              <span className="text-emerald-500">✓</span>
                              Kopyalandı!
                            </>
                          ) : (
                            <>
                              <svg
                                className="h-3.5 w-3.5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                                />
                              </svg>
                              Bağlantıyı Kopyala
                            </>
                          )}
                        </button>
                      </div>
                    </article>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
