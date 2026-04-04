"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Activity } from "@/types/activity";
import { getTheme } from "@/lib/themes";
import { useAuth } from "@/lib/auth-context";
import { authFetch } from "@/lib/auth-fetch";
import ShareTemplateModal from "@/components/ShareTemplateModal";

function typeLabel(type: Activity["type"]): { icon: string; label: string } {
  switch (type) {
    case "wheel": return { icon: "🎡", label: "Çark" };
    case "card": return { icon: "🃏", label: "Kart" };
    case "match": return { icon: "🔗", label: "Eşleştirme" };
    case "group-sort": return { icon: "📂", label: "Gruplama" };
    case "quiz": return { icon: "❓", label: "Quiz" };
    case "missing-word": return { icon: "✏️", label: "Boşluk Doldur" };
    case "memory": return { icon: "🧠", label: "Hafıza" };
    case "balloon-pop": return { icon: "🎈", label: "Balon" };
    default: return { icon: "🎮", label: type };
  }
}

type SortOption = "newest" | "oldest" | "az" | "za" | "type";

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
  const { user, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sharingActivity, setSharingActivity] = useState<Activity | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [categoryInput, setCategoryInput] = useState("");

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?redirect=/dashboard");
    }
  }, [authLoading, user, router]);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    activities.forEach((a) => { if (a.category) cats.add(a.category); });
    return Array.from(cats).sort((a, b) => a.localeCompare(b, "tr"));
  }, [activities]);

  const filteredActivities = useMemo(() => {
    let list = activities;
    if (selectedCategory === "__uncategorized__") list = activities.filter((a) => !a.category);
    else if (selectedCategory !== null) list = activities.filter((a) => a.category === selectedCategory);

    const sorted = [...list];
    switch (sortBy) {
      case "newest":
        sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case "oldest":
        sorted.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case "az":
        sorted.sort((a, b) => a.title.localeCompare(b.title, "tr"));
        break;
      case "za":
        sorted.sort((a, b) => b.title.localeCompare(a.title, "tr"));
        break;
      case "type":
        sorted.sort((a, b) => a.type.localeCompare(b.type));
        break;
    }
    return sorted;
  }, [activities, selectedCategory, sortBy]);

  const updateActivityCategory = async (activityId: string, category: string | null) => {
    const activity = activities.find((a) => a.id === activityId);
    if (!activity) return;
    try {
      const res = await authFetch(`/api/activities/${activityId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: activity.title,
          type: activity.type,
          display_mode: activity.display_mode,
          theme: activity.theme,
          category: category,
          options: activity.options,

        }),
      });
      if (res.ok) {
        setActivities((prev) =>
          prev.map((a) => (a.id === activityId ? { ...a, category } : a))
        );
      }
    } catch { /* ignore */ }
    setEditingCategoryId(null);
    setCategoryInput("");
  };

  const loadActivities = useCallback(async () => {
    setError(null);
    try {
      const res = await authFetch("/api/activities");
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
      const res = await authFetch(`/api/activities/${activity.id}`, {
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

  const handleDuplicate = async (activity: Activity) => {
    setDuplicatingId(activity.id);
    try {
      const res = await authFetch("/api/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `${activity.title} (kopya)`,
          type: activity.type,
          display_mode: activity.display_mode,
          theme: activity.theme,
          category: activity.category,
          show_feedback: activity.show_feedback,
          options: activity.options,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        window.alert(data?.error || "Çoğaltma başarısız oldu.");
        return;
      }
      setActivities((prev) => [data, ...prev]);
    } catch {
      window.alert("Çoğaltma sırasında bir hata oluştu.");
    } finally {
      setDuplicatingId(null);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <FloatingDecoration />

      <div className="relative mx-auto max-w-5xl px-6 py-10 sm:px-10 sm:py-14 lg:px-12">
        {/* User bar */}
        {user && (
          <div className="animate-fade-in mb-6 flex items-center justify-end gap-3">
            <div className="flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 shadow-sm" style={{ border: "1px solid rgba(45,27,105,0.08)" }}>
              {user.user_metadata?.avatar_url && (
                <img src={user.user_metadata.avatar_url} alt="" className="h-7 w-7 rounded-full" />
              )}
              <span className="text-sm font-semibold text-[#2D1B69]">
                {user.user_metadata?.full_name || user.email}
              </span>
            </div>
            <button
              type="button"
              onClick={() => void signOut()}
              className="rounded-full bg-white/80 px-4 py-2 text-sm font-semibold text-[#8B7BAD] shadow-sm transition hover:bg-red-50 hover:text-red-500"
              style={{ border: "1px solid rgba(45,27,105,0.08)" }}
            >
              Çıkış Yap
            </button>
          </div>
        )}

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

          <div className="mt-8 flex w-full max-w-sm flex-col gap-3 sm:mt-10">
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
            <div className="animate-fade-in mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center justify-center gap-3 sm:justify-start">
                <div className="text-2xl">📋</div>
                <h2 className="font-heading text-xl font-bold text-[#2D1B69]">
                  Etkinliklerim ({filteredActivities.length}
                  {selectedCategory !== null && ` / ${activities.length}`})
                </h2>
              </div>
              <div className="flex items-center justify-center gap-2 sm:justify-end">
                <span className="text-xs font-bold text-[#8B7BAD]">Sırala:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="rounded-xl border-2 border-[#E8E0F5] bg-[#F8F5FF] px-3 py-1.5 text-xs font-bold text-[#2D1B69] outline-none transition focus:border-[#D0C0F0]"
                >
                  <option value="newest">En yeni</option>
                  <option value="oldest">En eski</option>
                  <option value="az">A → Z</option>
                  <option value="za">Z → A</option>
                  <option value="type">Türe göre</option>
                </select>
              </div>
            </div>

            {/* Category Filter */}
            {categories.length > 0 && (
              <div className="animate-fade-in mb-6 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedCategory(null)}
                  className={`rounded-full px-4 py-1.5 text-sm font-bold transition ${
                    selectedCategory === null
                      ? "bg-[#2D1B69] text-white shadow-md"
                      : "bg-white text-[#8B7BAD] border-2 border-[#E8E0F5] hover:border-[#D0C0F0]"
                  }`}
                >
                  Tümü
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`rounded-full px-4 py-1.5 text-sm font-bold transition ${
                      selectedCategory === cat
                        ? "bg-[#2D1B69] text-white shadow-md"
                        : "bg-white text-[#8B7BAD] border-2 border-[#E8E0F5] hover:border-[#D0C0F0]"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
                {activities.some((a) => !a.category) && (
                  <button
                    type="button"
                    onClick={() => setSelectedCategory("__uncategorized__")}
                    className={`rounded-full px-4 py-1.5 text-sm font-bold transition ${
                      selectedCategory === "__uncategorized__"
                        ? "bg-[#2D1B69] text-white shadow-md"
                        : "bg-white text-[#8B7BAD] border-2 border-[#E8E0F5] hover:border-[#D0C0F0]"
                    }`}
                  >
                    Kategorisiz
                  </button>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredActivities.map((activity, idx) => {
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

                      {/* Category */}
                      <div className="flex items-center gap-1.5 bg-white px-4 pt-3">
                        {editingCategoryId === activity.id ? (
                          <div className="flex w-full items-center gap-1.5">
                            <input
                              type="text"
                              value={categoryInput}
                              onChange={(e) => setCategoryInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  void updateActivityCategory(activity.id, categoryInput.trim() || null);
                                } else if (e.key === "Escape") {
                                  setEditingCategoryId(null);
                                  setCategoryInput("");
                                }
                              }}
                              placeholder="Kategori adı..."
                              list="category-suggestions"
                              autoFocus
                              className="min-w-0 flex-1 rounded-lg border-2 border-[#E8E0F5] bg-[#F8F5FF] px-2.5 py-1.5 text-xs font-semibold text-[#2D1B69] outline-none placeholder:text-[#C0B0D8] focus:border-[#D0C0F0]"
                            />
                            <datalist id="category-suggestions">
                              {categories.map((c) => (
                                <option key={c} value={c} />
                              ))}
                            </datalist>
                            <button
                              type="button"
                              onClick={() => void updateActivityCategory(activity.id, categoryInput.trim() || null)}
                              className="rounded-lg bg-[#2D1B69] px-2.5 py-1.5 text-xs font-bold text-white"
                            >
                              Kaydet
                            </button>
                            <button
                              type="button"
                              onClick={() => { setEditingCategoryId(null); setCategoryInput(""); }}
                              className="rounded-lg px-2 py-1.5 text-xs font-bold text-[#8B7BAD] hover:bg-[#F0EAFF]"
                            >
                              Vazgeç
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCategoryId(activity.id);
                              setCategoryInput(activity.category || "");
                            }}
                            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-[#8B7BAD] transition hover:bg-[#F0EAFF]"
                          >
                            {activity.category ? (
                              <>
                                <span className="text-[10px]">📁</span>
                                {activity.category}
                              </>
                            ) : (
                              <>
                                <span className="text-[10px]">+</span>
                                Kategori ekle
                              </>
                            )}
                          </button>
                        )}
                      </div>

                      {/* Card Actions */}
                      <div className="flex flex-1 flex-col justify-end bg-white p-4 pt-3">
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
                          disabled={duplicatingId === activity.id}
                          onClick={() => void handleDuplicate(activity)}
                          className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-[#E8E0F5] bg-[#F8F5FF] py-2.5 text-[13px] font-semibold text-[#8B7BAD] transition hover:border-[#D0C0F0] hover:bg-[#F0EAFF] hover:text-[#6B5B8D] disabled:opacity-40 active:scale-[0.98]"
                        >
                          {duplicatingId === activity.id ? "Çoğaltılıyor..." : "📋 Çoğalt"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setSharingActivity(activity)}
                          className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 text-[13px] font-semibold text-slate-500 transition hover:border-purple-200 hover:bg-purple-50 hover:text-purple-600 active:scale-[0.98]"
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
