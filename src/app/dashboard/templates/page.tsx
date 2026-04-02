"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Template, TemplateCategory, TemplateSource } from "@/types/template";
import { TEMPLATE_CATEGORIES } from "@/types/template";
import { getTheme } from "@/lib/themes";

const ACTIVITY_TYPE_LABELS: Record<string, { icon: string; label: string }> = {
  wheel: { icon: "🎡", label: "Çark" },
  card: { icon: "🃏", label: "Kart" },
  match: { icon: "🔗", label: "Eşleştirme" },
  "group-sort": { icon: "📂", label: "Gruplama" },
  quiz: { icon: "❓", label: "Quiz" },
  "missing-word": { icon: "✏️", label: "Boşluk Doldur" },
  memory: { icon: "🧠", label: "Hafıza" },
  "balloon-pop": { icon: "🎈", label: "Balon" },
};

export default function TemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<TemplateCategory | null>(null);
  const [activeSource, setActiveSource] = useState<TemplateSource | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sort, setSort] = useState<"popular" | "newest">("popular");
  const [usingId, setUsingId] = useState<string | null>(null);

  const loadTemplates = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeCategory) params.set("category", activeCategory);
      if (activeSource) params.set("source", activeSource);
      if (searchQuery.trim()) params.set("search", searchQuery.trim());
      params.set("sort", sort);

      const res = await fetch(`/api/templates?${params}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Şablonlar yüklenemedi.");
        return;
      }
      setTemplates(Array.isArray(data) ? data : []);
    } catch {
      setError("Bağlantı hatası.");
    } finally {
      setLoading(false);
    }
  }, [activeCategory, activeSource, searchQuery, sort]);

  useEffect(() => {
    void loadTemplates();
  }, [loadTemplates]);

  const handleUse = async (templateId: string) => {
    setUsingId(templateId);
    try {
      const res = await fetch(`/api/templates/${templateId}/use`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Şablon kullanılamadı.");
        return;
      }
      router.push(`/edit/${data.id}`);
    } catch {
      alert("Bir hata oluştu.");
    } finally {
      setUsingId(null);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-[#FFF8F0] via-[#FFF3E4] to-[#E8F4FD]" />
        <div className="deco-blob-1 left-[-15%] top-[5%] bg-[#FFD93D]" />
        <div className="deco-blob-2 bottom-[0%] right-[-10%] bg-[#FF6B9D]" />
        <div className="absolute inset-0 bg-dots-pattern" />
      </div>

      <div className="relative mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        <header className="animate-fade-in mb-8 flex items-center gap-4">
          <Link
            href="/dashboard"
            className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-lg text-[#8B7BAD] shadow-md transition hover:scale-105 hover:shadow-lg"
            style={{ border: "2px solid rgba(45, 27, 105, 0.08)" }}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="font-heading text-2xl font-bold tracking-tight text-[#2D1B69] sm:text-3xl">
              Şablon Pazarı 📚
            </h1>
            <p className="mt-1 text-sm font-semibold text-[#8B7BAD]">
              Hazır şablonları keşfet, tek tıkla kullan
            </p>
          </div>
        </header>

        <div className="animate-fade-in mb-6">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Şablon ara... (örneğin: r sesi, hayvanlar)"
            className="input-playful w-full"
          />
        </div>

        <div className="animate-fade-in mb-4 flex flex-wrap gap-2">
          {([null, "official", "community"] as const).map((src) => (
            <button
              key={src ?? "all"}
              type="button"
              onClick={() => setActiveSource(src)}
              className={`rounded-2xl px-4 py-2 text-sm font-bold transition ${
                activeSource === src
                  ? "text-white shadow-md"
                  : "bg-white text-[#8B7BAD] hover:bg-[#F8F5FF]"
              }`}
              style={
                activeSource === src
                  ? { background: "linear-gradient(135deg, #FF6B9D, #FF8A50)", border: "2px solid transparent" }
                  : { border: "2px solid rgba(45, 27, 105, 0.06)" }
              }
            >
              {src === null ? "Tümü" : src === "official" ? "⭐ Resmi" : "👥 Topluluk"}
            </button>
          ))}
          <div className="ml-auto flex gap-2">
            {(["popular", "newest"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSort(s)}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                  sort === s ? "bg-[#2D1B69] text-white" : "bg-white text-[#8B7BAD]"
                }`}
                style={{ border: "2px solid rgba(45, 27, 105, 0.06)" }}
              >
                {s === "popular" ? "Popüler" : "Yeni"}
              </button>
            ))}
          </div>
        </div>

        <div className="animate-fade-in mb-8 flex gap-2 overflow-x-auto pb-2">
          <button
            type="button"
            onClick={() => setActiveCategory(null)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold transition ${
              activeCategory === null
                ? "bg-[#2D1B69] text-white shadow-md"
                : "bg-white text-[#8B7BAD] hover:bg-[#F8F5FF]"
            }`}
            style={{ border: "2px solid rgba(45, 27, 105, 0.06)" }}
          >
            Tümü
          </button>
          {TEMPLATE_CATEGORIES.map((cat) => (
            <button
              key={cat.slug}
              type="button"
              onClick={() => setActiveCategory(cat.slug)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold transition ${
                activeCategory === cat.slug
                  ? "bg-[#2D1B69] text-white shadow-md"
                  : "bg-white text-[#8B7BAD] hover:bg-[#F8F5FF]"
              }`}
              style={{ border: "2px solid rgba(45, 27, 105, 0.06)" }}
            >
              {cat.emoji} {cat.label}
            </button>
          ))}
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center gap-5 py-20">
            <div className="h-14 w-14 animate-spin rounded-full border-[3px] border-[#FFE8F5] border-t-[#FF6B9D]" />
            <p className="text-sm font-medium text-[#8B7BAD]">Şablonlar yükleniyor...</p>
          </div>
        )}

        {!loading && error && (
          <div className="mx-auto max-w-sm rounded-3xl border-2 border-red-100 bg-white p-8 text-center shadow-lg">
            <div className="mb-4 text-4xl">😕</div>
            <p className="font-bold text-slate-800">{error}</p>
            <button
              type="button"
              onClick={() => void loadTemplates()}
              className="mt-4 rounded-xl bg-[#2D1B69] px-6 py-2.5 text-sm font-semibold text-white"
            >
              Tekrar dene
            </button>
          </div>
        )}

        {!loading && !error && templates.length === 0 && (
          <div className="mx-auto max-w-sm rounded-3xl bg-white p-10 text-center shadow-lg" style={{ border: "2px solid rgba(45, 27, 105, 0.06)" }}>
            <div className="mb-4 text-5xl">📭</div>
            <h2 className="font-heading text-xl font-bold text-[#2D1B69]">Şablon bulunamadı</h2>
            <p className="mt-2 text-sm text-[#8B7BAD]">Filtrelerinizi değiştirmeyi deneyin.</p>
          </div>
        )}

        {!loading && !error && templates.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {templates.map((tmpl) => {
              const theme = getTheme(tmpl.theme);
              const typeInfo = ACTIVITY_TYPE_LABELS[tmpl.type] || { icon: "🎯", label: "Etkinlik" };
              const catInfo = TEMPLATE_CATEGORIES.find((c) => c.slug === tmpl.category);
              const busy = usingId === tmpl.id;

              return (
                <article
                  key={tmpl.id}
                  className="card-hover flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm transition-all duration-200"
                  style={{ border: "2px solid rgba(45, 27, 105, 0.06)" }}
                >
                  <div className="flex h-2">
                    {theme.cardColors.slice(0, 5).map((c, i) => (
                      <div key={i} className="flex-1" style={{ backgroundColor: c }} />
                    ))}
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#F8F5FF] px-2.5 py-0.5 text-xs font-bold text-[#8B7BAD]">
                        {typeInfo.icon} {typeInfo.label}
                      </span>
                      {tmpl.source === "official" && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-600">
                          ⭐ Resmi
                        </span>
                      )}
                      {tmpl.is_premium && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-bold text-purple-600">
                          🔒 Premium
                        </span>
                      )}
                    </div>
                    <h3 className="mb-1 font-heading text-base font-bold text-[#2D1B69]">{tmpl.title}</h3>
                    {tmpl.description && (
                      <p className="mb-3 text-xs leading-relaxed text-[#8B7BAD] line-clamp-2">{tmpl.description}</p>
                    )}
                    <div className="mt-auto flex items-center justify-between pt-3">
                      {catInfo && (
                        <span className="text-xs font-bold text-[#C5B8DB]">{catInfo.emoji} {catInfo.label}</span>
                      )}
                      <span className="text-xs font-bold text-[#C5B8DB]">
                        {tmpl.use_count > 0 ? `${tmpl.use_count} kez kullanıldı` : "Yeni"}
                      </span>
                    </div>
                    {tmpl.source === "community" && tmpl.author_name && (
                      <p className="mt-1 text-[10px] font-semibold text-[#C5B8DB]">👤 {tmpl.author_name}</p>
                    )}
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void handleUse(tmpl.id)}
                      className="btn-candy btn-green mt-3 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm"
                    >
                      {busy ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                          Kopyalanıyor...
                        </>
                      ) : (
                        "Kullan →"
                      )}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
