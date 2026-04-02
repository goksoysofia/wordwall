"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { Activity } from "@/types/activity";
import { getTheme } from "@/lib/themes";
import ShareTemplateModal from "@/components/ShareTemplateModal";

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

function FloatingDecoration() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* Warm gradient base */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#FFF8F0] via-[#FFF3E4] to-[#FFE8F5]" />

      {/* Big decorative blobs */}
      <div className="deco-blob-1 left-[-10%] top-[-15%] bg-[#FFD93D]" />
      <div className="deco-blob-2 right-[-8%] top-[20%] bg-[#FF6B9D]" />
      <div className="deco-blob-1 bottom-[-5%] left-[30%] bg-[#4D96FF]" />
      <div className="deco-blob-2 bottom-[10%] right-[5%] bg-[#6BCB77]" />

      {/* Dot pattern overlay */}
      <div className="absolute inset-0 bg-dots-pattern" />

      {/* Floating emojis */}
      <div className="animate-float-slow absolute left-[8%] top-[15%] text-4xl opacity-20">⭐</div>
      <div className="animate-float absolute right-[12%] top-[8%] text-3xl opacity-15" style={{ animationDelay: "1s" }}>🌈</div>
      <div className="animate-float-slow absolute bottom-[20%] left-[5%] text-3xl opacity-15" style={{ animationDelay: "2s" }}>🎈</div>
      <div className="animate-float absolute bottom-[15%] right-[8%] text-4xl opacity-20" style={{ animationDelay: "0.5s" }}>✨</div>
      <div className="animate-float-slow absolute left-[45%] top-[5%] text-2xl opacity-10" style={{ animationDelay: "3s" }}>🎪</div>
    </div>
  );
}

export default function HomePage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sharingActivity, setSharingActivity] = useState<Activity | null>(null);

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
      <FloatingDecoration />

      <div className="relative mx-auto max-w-5xl px-6 py-10 sm:px-10 sm:py-14 lg:px-12">
        {/* Header */}
        <header className="animate-fade-in mb-12 flex flex-col items-center text-center sm:mb-16">
          <div className="animate-bounce-in mb-5 inline-block">
            <div className="animate-wiggle text-5xl sm:text-6xl">🎨</div>
          </div>
          <h1 className="font-heading text-4xl font-extrabold tracking-tight text-[#2D1B69] sm:text-5xl lg:text-6xl">
            Etkinlik{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: "linear-gradient(135deg, #FF6B9D, #FF8A50, #FFD93D, #6BCB77, #4D96FF)",
              }}
            >
              Oluşturucu
            </span>
          </h1>
          <p className="mt-4 max-w-md text-base font-semibold text-[#8B7BAD] sm:text-lg">
            Etkinlikleri kolayca oluştur, düzenle ve paylaş
          </p>

          <div className="mt-8 w-full max-w-sm sm:mt-10">
            <Link
              href="/create"
              className="btn-candy group flex w-full items-center justify-center gap-3 rounded-2xl px-8 py-5 text-lg sm:text-xl"
            >
              <span className="text-2xl transition-transform duration-300 group-hover:rotate-90 group-hover:scale-125">
                +
              </span>
              Yeni Etkinlik Oluştur
            </Link>
            <Link
              href="/dashboard/templates"
              className="flex w-full items-center justify-center gap-3 rounded-2xl bg-white px-8 py-4 text-lg font-bold text-[#2D1B69] shadow-md transition hover:shadow-lg hover:scale-[1.02]"
              style={{ border: "2px solid rgba(45, 27, 105, 0.08)" }}
            >
              <span className="text-2xl">📚</span>
              Şablon Pazarı
            </Link>
          </div>
        </header>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center gap-5 py-24">
            <div className="relative">
              <div
                className="h-16 w-16 animate-spin rounded-full border-[4px] border-[#FFE8F5]"
                style={{ borderTopColor: "#FF6B9D" }}
              />
              <div className="absolute inset-0 flex items-center justify-center text-2xl">
                🎪
              </div>
            </div>
            <p className="font-heading text-lg font-bold text-[#8B7BAD]">Yükleniyor...</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="animate-bounce-in flex justify-center">
            <div className="card-playful w-full max-w-sm p-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-4xl">
                😕
              </div>
              <p className="font-heading text-lg font-bold text-[#2D1B69]">
                Bir şeyler ters gitti
              </p>
              <p className="mt-2 text-sm font-medium text-[#8B7BAD]">{error}</p>
              <button
                type="button"
                onClick={() => {
                  setLoading(true);
                  void loadActivities();
                }}
                className="btn-candy mt-6 rounded-xl px-6 py-3 text-sm"
              >
                Tekrar Dene
              </button>
            </div>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && activities.length === 0 && (
          <div className="animate-slide-up flex justify-center">
            <div className="card-playful w-full max-w-sm p-10 text-center">
              <div className="animate-float mx-auto mb-6 text-6xl">🌈</div>
              <h2 className="font-heading text-2xl font-bold text-[#2D1B69]">
                Henüz etkinlik yok
              </h2>
              <p className="mx-auto mt-3 max-w-[260px] text-sm font-medium leading-relaxed text-[#8B7BAD]">
                İlk etkinliğini oluştur ve çocukların eğlenerek
                öğrenmesini sağla!
              </p>
              <Link
                href="/create"
                className="btn-candy mt-8 inline-flex items-center gap-2 rounded-xl px-8 py-3 text-base"
              >
                Başla
                <span className="text-lg">→</span>
              </Link>
            </div>
          </div>
        )}

        {/* Activity Grid */}
        {!loading && !error && activities.length > 0 && (
          <>
            <div className="animate-fade-in mb-8 flex items-center justify-center gap-3 sm:justify-start">
              <div className="text-2xl">📋</div>
              <h2 className="font-heading text-xl font-bold text-[#2D1B69]">
                Etkinliklerim ({activities.length})
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {activities.map((activity, idx) => {
                const theme = getTheme(activity.theme);
                const busy = deletingId === activity.id;
                const { icon, label } = typeLabel(activity.type);

                return (
                  <div
                    key={activity.id}
                    className={`animate-slide-up stagger-${Math.min(idx + 1, 8)}`}
                  >
                    <article className="card-playful group flex h-full flex-col overflow-hidden">
                      {/* Card Header with Theme Color */}
                      <div
                        className="relative overflow-hidden px-5 pb-4 pt-5"
                        style={{
                          background: theme.accentGradient,
                        }}
                      >
                        {/* Decorative circles */}
                        <div
                          className="absolute -right-4 -top-4 h-24 w-24 rounded-full opacity-20"
                          style={{ backgroundColor: "white" }}
                        />
                        <div
                          className="absolute -bottom-2 -left-2 h-16 w-16 rounded-full opacity-15"
                          style={{ backgroundColor: "white" }}
                        />

                        <div className="relative flex items-start gap-3">
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/90 text-3xl shadow-sm">
                            {icon}
                          </div>
                          <div className="min-w-0 flex-1 pt-0.5">
                            <h3 className="truncate font-heading text-lg font-bold text-white drop-shadow-sm">
                              {activity.title}
                            </h3>
                            <div className="mt-1.5 flex flex-wrap items-center gap-2">
                              <span className="inline-flex items-center gap-1 rounded-full bg-white/30 px-2.5 py-0.5 text-xs font-bold text-white backdrop-blur-sm">
                                {theme.emoji} {theme.name}
                              </span>
                              <span className="inline-flex items-center rounded-full bg-white/30 px-2.5 py-0.5 text-xs font-bold text-white backdrop-blur-sm">
                                {label}
                              </span>
                            </div>
                          </div>
                        </div>
                        <p className="relative mt-3 text-xs font-semibold text-white/70">
                          {formatCreatedAt(activity.created_at)}
                        </p>
                      </div>

                      {/* Card Actions */}
                      <div className="flex flex-1 flex-col justify-end bg-white p-4 pt-4">
                        <div className="grid grid-cols-3 gap-2">
                          <Link
                            href={`/play/${activity.id}`}
                            className="btn-green flex items-center justify-center gap-1.5 rounded-xl py-3 text-sm font-bold text-white active:scale-[0.97]"
                          >
                            <span>▶</span>
                            Oyna
                          </Link>
                          <Link
                            href={`/edit/${activity.id}`}
                            className="btn-blue flex items-center justify-center gap-1.5 rounded-xl py-3 text-sm font-bold text-white active:scale-[0.97]"
                          >
                            Düzenle
                          </Link>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => void handleDelete(activity)}
                            className="flex items-center justify-center rounded-xl border-2 border-red-200 bg-red-50 py-3 text-sm font-bold text-red-500 transition hover:bg-red-100 disabled:opacity-40 active:scale-[0.97]"
                          >
                            {busy ? "..." : "Sil"}
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => void copyPlayLink(activity.id)}
                          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-[#E8E0F5] bg-[#F8F5FF] py-3 text-sm font-bold text-[#8B7BAD] transition hover:border-[#D0C0F0] hover:bg-[#F0EAFF] hover:text-[#6B5B8D] active:scale-[0.98]"
                        >
                          {copiedId === activity.id ? (
                            <>
                              <span className="text-green-500">✓</span>
                              Kopyalandı!
                            </>
                          ) : (
                            <>
                              <svg
                                className="h-4 w-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2.5}
                                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                                />
                              </svg>
                              Bağlantıyı Kopyala
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => setSharingActivity(activity)}
                          className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 text-[13px] font-semibold text-slate-500 transition hover:border-purple-200 hover:bg-purple-50 hover:text-purple-600 active:scale-[0.98]"
                        >
                          🌟 Şablon Olarak Paylaş
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

      {sharingActivity && (
        <ShareTemplateModal
          activity={sharingActivity}
          onClose={() => setSharingActivity(null)}
          onSuccess={() => {
            setSharingActivity(null);
            alert("Şablonunuz başarıyla paylaşıldı! 🎉");
          }}
        />
      )}
    </div>
  );
}
