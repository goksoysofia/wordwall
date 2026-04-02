"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { v4 as uuidv4 } from "uuid";
import { themes } from "@/lib/themes";
import type { Activity, ActivityType, CardDisplayMode } from "@/types/activity";

interface OptionRow {
  id: string;
  text: string;
  imageUrl?: string;
  pairText?: string;
  pairImageUrl?: string;
  group?: string;
  isCorrect?: boolean;
}

const ACTIVITY_TYPES: { type: ActivityType; emoji: string; label: string }[] = [
  { type: "wheel", emoji: "🎡", label: "Çark" },
  { type: "card", emoji: "🃏", label: "Kart Açma" },
  { type: "match", emoji: "🔗", label: "Eşleştirme" },
  { type: "group-sort", emoji: "📂", label: "Gruplama" },
  { type: "quiz", emoji: "❓", label: "Quiz" },
  { type: "missing-word", emoji: "✏️", label: "Boşluk Doldur" },
  { type: "memory", emoji: "🧠", label: "Hafıza Oyunu" },
  { type: "balloon-pop", emoji: "🎈", label: "Balon Patlatma" },
];

export default function EditActivityPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activityType, setActivityType] = useState<ActivityType>("wheel");
  const [displayMode, setDisplayMode] = useState<CardDisplayMode | null>(null);
  const [selectedThemeId, setSelectedThemeId] = useState<string>("fruits");
  const [title, setTitle] = useState("");
  const [options, setOptions] = useState<OptionRow[]>([]);
  const [groups, setGroups] = useState<string[]>(["Grup 1", "Grup 2"]);
  const [uploadingIds, setUploadingIds] = useState<Set<string>>(new Set());
  const [generatingIds, setGeneratingIds] = useState<Set<string>>(new Set());
  const [aiPrompts, setAiPrompts] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await fetch(`/api/activities/${id}`);
        if (!res.ok) {
          setError("Etkinlik bulunamadı.");
          return;
        }
        const data: Activity = await res.json();
        setActivityType(data.type);
        setDisplayMode(data.display_mode);
        setSelectedThemeId(data.theme);
        setTitle(data.title);
        setOptions(
          data.options.map((o) => ({
            id: o.id,
            text: o.text || "",
            imageUrl: o.imageUrl,
            pairText: o.pairText,
            pairImageUrl: o.pairImageUrl,
            group: o.group,
            isCorrect: o.isCorrect,
          }))
        );
        // Extract groups from options for group-sort
        if (data.type === "group-sort") {
          const groupSet = new Set<string>();
          data.options.forEach((o) => { if (o.group) groupSet.add(o.group); });
          if (groupSet.size > 0) {
            setGroups(Array.from(groupSet));
          }
        }
      } catch {
        setError("Bağlantı hatası.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  function addOption() {
    const newOpt: OptionRow = { id: uuidv4(), text: "" };
    if (activityType === "group-sort" && groups.length > 0) {
      newOpt.group = groups[0];
    }
    setOptions((prev) => [...prev, newOpt]);
  }

  function removeOption(optId: string) {
    setOptions((prev) => {
      const next = prev.filter((o) => o.id !== optId);
      return next.length === 0 ? [{ id: uuidv4(), text: "" }] : next;
    });
  }

  function updateOption(optId: string, updates: Partial<OptionRow>) {
    setOptions((prev) => prev.map((o) => (o.id === optId ? { ...o, ...updates } : o)));
  }

  function toggleCorrect(optId: string) {
    if (activityType === "quiz" || activityType === "missing-word") {
      setOptions((prev) => prev.map((o) => ({ ...o, isCorrect: o.id === optId })));
    } else {
      setOptions((prev) => prev.map((o) => (o.id === optId ? { ...o, isCorrect: !o.isCorrect } : o)));
    }
  }

  async function onPickImage(optionId: string, file: File | null, isPair = false) {
    if (!file) return;
    const uploadKey = isPair ? `pair-${optionId}` : optionId;
    setUploadingIds((s) => new Set(s).add(uploadKey));
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const contentType = res.headers.get("content-type") ?? "";
      if (!contentType.includes("application/json")) {
        const text = await res.text();
        throw new Error(text || "Sunucu geçersiz yanıt döndürdü");
      }
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok) throw new Error(data.error || "Yükleme başarısız");
      if (!data.url) throw new Error("Sunucu yanıtı geçersiz");
      if (isPair) {
        updateOption(optionId, { pairImageUrl: data.url });
      } else {
        updateOption(optionId, { imageUrl: data.url });
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : "Görsel yüklenirken hata oluştu.");
    } finally {
      setUploadingIds((s) => {
        const next = new Set(s);
        next.delete(uploadKey);
        return next;
      });
    }
  }

  async function onGenerateImage(optionId: string, prompt: string, isPair = false) {
    if (!prompt.trim()) return;
    const genKey = isPair ? `pair-${optionId}` : optionId;
    setGeneratingIds((s) => new Set(s).add(genKey));
    try {
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const contentType = res.headers.get("content-type") ?? "";
      if (!contentType.includes("application/json")) {
        const text = await res.text();
        throw new Error(text || "Sunucu geçersiz yanıt döndürdü");
      }
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok) throw new Error(data.error || "Görsel oluşturulamadı");
      if (!data.url) throw new Error("Sunucu yanıtı geçersiz");
      if (isPair) {
        updateOption(optionId, { pairImageUrl: data.url });
      } else {
        updateOption(optionId, { imageUrl: data.url });
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : "AI görsel oluşturulurken hata oluştu.");
    } finally {
      setGeneratingIds((s) => {
        const next = new Set(s);
        next.delete(genKey);
        return next;
      });
    }
  }

  const contentValid = useMemo(() => {
    switch (activityType) {
      case "wheel":
      case "card":
      case "memory":
        return options.length > 0 && options.every((o) => o.text.trim() || o.imageUrl);
      case "match":
        return options.length >= 2 && options.every((o) => (o.text.trim() || o.imageUrl) && (o.pairText?.trim() || o.pairImageUrl));
      case "group-sort":
        return groups.length >= 2 && groups.every((g) => g.trim()) && options.length >= 2 && options.every((o) => (o.text.trim() || o.imageUrl) && o.group);
      case "quiz":
      case "balloon-pop":
        return options.length >= 2 && options.every((o) => o.text.trim() || o.imageUrl) && options.some((o) => o.isCorrect);
      case "missing-word":
        return title.includes("___") && options.length >= 2 && options.every((o) => o.text.trim()) && options.some((o) => o.isCorrect);
      default:
        return false;
    }
  }, [activityType, options, groups, title]);

  async function handleSave() {
    const payloadOptions = options
      .filter((o) => o.text.trim().length > 0 || o.imageUrl)
      .map((o) => ({
        id: o.id,
        ...(o.text.trim() ? { text: o.text.trim() } : {}),
        ...(o.imageUrl ? { imageUrl: o.imageUrl } : {}),
        ...(o.pairText?.trim() ? { pairText: o.pairText.trim() } : {}),
        ...(o.pairImageUrl ? { pairImageUrl: o.pairImageUrl } : {}),
        ...(o.group ? { group: o.group } : {}),
        ...(o.isCorrect !== undefined ? { isCorrect: o.isCorrect } : {}),
      }));

    if (payloadOptions.length === 0) {
      setSaveError("En az bir geçerli seçenek ekleyin.");
      return;
    }

    setSaveError(null);
    setIsSaving(true);
    try {
      const res = await fetch(`/api/activities/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim() || "Adsız etkinlik",
          type: activityType,
          display_mode: activityType === "card" ? displayMode : null,
          theme: selectedThemeId,
          options: payloadOptions,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Güncelleme başarısız");
      router.push(`/play/${id}`);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Kaydedilirken bir hata oluştu.");
    } finally {
      setIsSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: "linear-gradient(135deg, #FFF8F0, #FFE8F5)" }}>
        <div className="flex flex-col items-center gap-5">
          <div className="relative">
            <div className="h-16 w-16 animate-spin rounded-full border-[4px] border-[#FFE8F5]" style={{ borderTopColor: "#FF6B9D" }} />
            <div className="absolute inset-0 flex items-center justify-center text-2xl">✏️</div>
          </div>
          <p className="font-heading text-lg font-bold text-[#8B7BAD]">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4" style={{ background: "linear-gradient(135deg, #FFF8F0, #FFE8F5)" }}>
        <div className="card-playful max-w-sm p-10 text-center">
          <div className="mx-auto mb-4 text-5xl">😕</div>
          <h1 className="font-heading text-xl font-bold text-[#2D1B69]">{error}</h1>
          <Link href="/dashboard" className="btn-candy mt-6 inline-flex items-center gap-2 px-6 py-3 text-sm">
            Ana Sayfaya Dön
          </Link>
        </div>
      </div>
    );
  }

  const selectedTheme = themes.find((t) => t.id === selectedThemeId);

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-[#FFF8F0] via-[#FFF3E4] to-[#E8F4FD]" />
        <div className="deco-blob-1 left-[-15%] top-[5%] bg-[#4D96FF]" />
        <div className="deco-blob-2 bottom-[0%] right-[-10%] bg-[#6BCB77]" />
        <div className="absolute inset-0 bg-dots-pattern" />
      </div>

      <div className="relative mx-auto max-w-xl px-4 pb-32 pt-6 sm:px-6 sm:pb-28 sm:pt-8">
        {/* Header */}
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
          <h1 className="font-heading text-xl font-bold tracking-tight text-[#2D1B69] sm:text-2xl">
            Etkinliği Düzenle ✏️
          </h1>
        </header>

        <div className="animate-slide-up space-y-5">
          {/* Type */}
          <div className="card-playful p-5">
            <label className="mb-3 flex items-center gap-2 text-sm font-bold text-[#2D1B69]">
              <span>🎯</span> Etkinlik Türü
            </label>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {ACTIVITY_TYPES.map((t) => (
                <button
                  key={t.type}
                  type="button"
                  onClick={() => {
                    setActivityType(t.type);
                    if (t.type === "card" && !displayMode) setDisplayMode("grid");
                    else if (t.type !== "card") setDisplayMode(null);
                  }}
                  className={`flex items-center justify-center gap-1.5 rounded-2xl px-3 py-3 text-xs font-bold transition ${
                    activityType === t.type
                      ? "text-white shadow-md"
                      : "bg-[#F8F5FF] text-[#8B7BAD] hover:bg-[#F0EAFF]"
                  }`}
                  style={
                    activityType === t.type
                      ? { background: "linear-gradient(135deg, #FF6B9D, #FF8A50)", border: "2px solid transparent" }
                      : { border: "2px solid rgba(45, 27, 105, 0.06)" }
                  }
                >
                  {t.emoji} {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Display mode (card only) */}
          {activityType === "card" && (
            <div className="animate-scale-in card-playful p-5">
              <label className="mb-3 flex items-center gap-2 text-sm font-bold text-[#2D1B69]">
                <span>👀</span> Görünüm Modu
              </label>
              <div className="grid grid-cols-2 gap-3">
                {(["grid", "stack"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setDisplayMode(m)}
                    className={`flex items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-sm font-bold transition ${
                      displayMode === m ? "text-white shadow-md" : "bg-[#F8F5FF] text-[#8B7BAD] hover:bg-[#F0EAFF]"
                    }`}
                    style={
                      displayMode === m
                        ? { background: "linear-gradient(135deg, #4D96FF, #6BCB77)", border: "2px solid transparent" }
                        : { border: "2px solid rgba(45, 27, 105, 0.06)" }
                    }
                  >
                    {m === "grid" ? "⊞ Izgara" : "▤ Sıralı"}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Theme */}
          <div className="card-playful p-5">
            <label className="mb-3 flex items-center gap-2 text-sm font-bold text-[#2D1B69]">
              <span>🎨</span> Tema
            </label>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {themes.map((theme) => (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => setSelectedThemeId(theme.id)}
                  className={`flex flex-col overflow-hidden rounded-xl text-left transition-all duration-200 active:scale-[0.97] ${
                    selectedThemeId === theme.id ? "ring-2 ring-[#FF6B9D]/40 shadow-md scale-[1.02]" : "hover:shadow-md"
                  }`}
                  style={{
                    border: selectedThemeId === theme.id ? "2px solid #FF6B9D" : "2px solid rgba(45, 27, 105, 0.06)",
                    background: "white",
                  }}
                >
                  <div className="flex items-center gap-2 px-3 py-2.5" style={{ backgroundColor: theme.backgroundColor }}>
                    <span className="text-lg">{theme.emoji}</span>
                    <span className="min-w-0 flex-1 truncate text-xs font-bold text-[#2D1B69]">{theme.name}</span>
                    {selectedThemeId === theme.id && (
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#FF6B9D] text-[9px] text-white">✓</span>
                    )}
                  </div>
                  <div className="flex h-2 w-full">
                    {theme.cardColors.slice(0, 5).map((c, i) => (
                      <div key={i} className="flex-1" style={{ backgroundColor: c }} />
                    ))}
                  </div>
                </button>
              ))}
            </div>
            {selectedTheme && (
              <p className="mt-3 text-xs font-bold text-[#8B7BAD]">
                Seçili: {selectedTheme.emoji} {selectedTheme.name}
              </p>
            )}
          </div>

          {/* Title */}
          <div className="card-playful p-5">
            <label htmlFor="edit-title" className="mb-2 flex items-center gap-2 text-sm font-bold text-[#2D1B69]">
              <span>📝</span>
              {activityType === "quiz" || activityType === "balloon-pop"
                ? "Soru"
                : activityType === "missing-word"
                  ? "Cümle (___ ile boşluk belirtin)"
                  : "Etkinlik Adı"}
            </label>
            <input
              id="edit-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                activityType === "quiz"
                  ? "Örn. Türkiye'nin başkenti neresidir?"
                  : activityType === "missing-word"
                    ? "Örn. Kedi ___ içer."
                    : "Örn. Haftanın kelimeleri"
              }
              className="input-playful"
            />
            {activityType === "missing-word" && !title.includes("___") && title.length > 0 && (
              <p className="mt-2 flex items-center gap-1 text-xs font-semibold text-amber-500">
                <span>⚠️</span> Cümleye ___ (üç alt çizgi) ile boşluk ekleyin
              </p>
            )}
          </div>

          {/* Group Names (group-sort only) */}
          {activityType === "group-sort" && (
            <div className="card-playful p-5">
              <label className="mb-3 flex items-center gap-2 text-sm font-bold text-[#2D1B69]">
                <span>📂</span> Grup adları
              </label>
              <div className="space-y-2">
                {groups.map((g, gi) => (
                  <div key={gi} className="flex items-center gap-2">
                    <div
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
                      style={{ background: themes.find((t) => t.id === selectedThemeId)?.cardColors[gi % 7] || "#6366f1" }}
                    >
                      {gi + 1}
                    </div>
                    <input
                      type="text"
                      value={g}
                      onChange={(e) => {
                        const newGroups = [...groups];
                        const oldName = newGroups[gi];
                        newGroups[gi] = e.target.value;
                        setGroups(newGroups);
                        setOptions((prev) =>
                          prev.map((o) => (o.group === oldName ? { ...o, group: e.target.value } : o))
                        );
                      }}
                      placeholder={`Grup ${gi + 1}`}
                      className="input-playful"
                    />
                    {groups.length > 2 && (
                      <button
                        type="button"
                        onClick={() => {
                          const removed = groups[gi];
                          setGroups((prev) => prev.filter((_, i) => i !== gi));
                          setOptions((prev) => prev.filter((o) => o.group !== removed));
                        }}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-[#C5B8DB] transition hover:bg-red-50 hover:text-red-500"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setGroups((prev) => [...prev, `Grup ${prev.length + 1}`])}
                className="mt-2 text-xs font-bold text-[#8B7BAD] transition hover:text-[#FF6B9D]"
              >
                + Grup ekle
              </button>
            </div>
          )}

          {/* Options */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <p className="flex items-center gap-2 text-sm font-bold text-[#2D1B69]">
                <span>🎯</span>
                {activityType === "match" ? "Çiftler" : activityType === "quiz" || activityType === "balloon-pop" ? "Cevaplar" : activityType === "missing-word" ? "Kelime seçenekleri" : "Seçenekler"}
              </p>
              <p className="rounded-full bg-[#FF6B9D]/10 px-3 py-0.5 text-xs font-bold text-[#FF6B9D]">
                {options.filter((o) => o.text.trim() || o.imageUrl).length} eklendi
              </p>
            </div>
            {options.map((opt, idx) => (
              <div key={opt.id} className="card-playful p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#FFD93D] to-[#FF8A50] text-sm font-bold text-white">
                    {idx + 1}
                  </span>
                  <div className="flex items-center gap-2">
                    {(activityType === "quiz" || activityType === "missing-word" || activityType === "balloon-pop") && (
                      <button
                        type="button"
                        onClick={() => toggleCorrect(opt.id)}
                        className={`flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                          opt.isCorrect
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-[#F8F5FF] text-[#8B7BAD] hover:bg-emerald-50 hover:text-emerald-600"
                        }`}
                      >
                        {opt.isCorrect ? "✅ Doğru" : "Doğru?"}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => removeOption(opt.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-xl text-[#C5B8DB] transition hover:bg-red-50 hover:text-red-500"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
                <input
                  type="text"
                  value={opt.text}
                  onChange={(e) => updateOption(opt.id, { text: e.target.value })}
                  placeholder={activityType === "match" ? "Sol taraf (öğe)" : "Yazı ekle..."}
                  className="input-playful mb-3"
                />
                {activityType === "match" && (
                  <input
                    type="text"
                    value={opt.pairText || ""}
                    onChange={(e) => updateOption(opt.id, { pairText: e.target.value })}
                    placeholder="Sağ taraf (eşi)"
                    className="input-playful mb-3"
                    style={{ borderColor: "#D0C0F0" }}
                  />
                )}
                {activityType === "group-sort" && (
                  <div className="mb-3">
                    <label className="mb-1 block text-xs font-bold text-[#8B7BAD]">Grup:</label>
                    <div className="flex flex-wrap gap-2">
                      {groups.map((g, gi) => (
                        <button
                          key={gi}
                          type="button"
                          onClick={() => updateOption(opt.id, { group: g })}
                          className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                            opt.group === g
                              ? "text-white shadow-sm"
                              : "bg-[#F8F5FF] text-[#8B7BAD] hover:bg-[#F0EAFF]"
                          }`}
                          style={
                            opt.group === g
                              ? { background: themes.find((t) => t.id === selectedThemeId)?.cardColors[gi % 7] || "#6366f1" }
                              : { border: "1px solid rgba(45, 27, 105, 0.08)" }
                          }
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        disabled={uploadingIds.has(opt.id)}
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          e.target.value = "";
                          void onPickImage(opt.id, f ?? null);
                        }}
                      />
                      <span className="inline-flex items-center gap-1.5 rounded-xl border-2 border-[#E8E0F5] bg-[#F8F5FF] px-3 py-2 text-xs font-bold text-[#8B7BAD] transition hover:border-[#D0C0F0] hover:bg-[#F0EAFF]">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {uploadingIds.has(opt.id) ? "Yükleniyor..." : "Görsel"}
                      </span>
                    </label>
                    <button
                      type="button"
                      disabled={generatingIds.has(opt.id)}
                      onClick={() => {
                        const current = aiPrompts[opt.id];
                        if (current?.trim()) {
                          void onGenerateImage(opt.id, current);
                        } else {
                          setAiPrompts((p) => ({ ...p, [opt.id]: p[opt.id] ?? "" }));
                        }
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl border-2 border-[#E0D4F5] bg-gradient-to-r from-[#F3EAFF] to-[#EAF0FF] px-3 py-2 text-xs font-bold text-[#7C5CBF] transition hover:border-[#C5B0E8] hover:shadow-sm"
                    >
                      {generatingIds.has(opt.id) ? (
                        <>
                          <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#7C5CBF]/30 border-t-[#7C5CBF]" />
                          Üretiliyor...
                        </>
                      ) : (
                        <>
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                          </svg>
                          AI Görsel
                        </>
                      )}
                    </button>
                    {opt.imageUrl && (
                      <div className="h-14 w-18 overflow-hidden rounded-xl border-2 border-[#E8E0F5]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={opt.imageUrl} alt="Önizleme" className="h-full w-full object-contain" />
                      </div>
                    )}
                  </div>
                  {aiPrompts[opt.id] !== undefined && !opt.imageUrl && (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={aiPrompts[opt.id] || ""}
                        onChange={(e) => setAiPrompts((p) => ({ ...p, [opt.id]: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && aiPrompts[opt.id]?.trim()) {
                            void onGenerateImage(opt.id, aiPrompts[opt.id]);
                          }
                        }}
                        placeholder="Örn: kırmızı bir elma"
                        className="input-playful flex-1 !py-2 text-xs"
                        disabled={generatingIds.has(opt.id)}
                      />
                      <button
                        type="button"
                        disabled={!aiPrompts[opt.id]?.trim() || generatingIds.has(opt.id)}
                        onClick={() => void onGenerateImage(opt.id, aiPrompts[opt.id])}
                        className="shrink-0 rounded-xl bg-gradient-to-r from-[#7C5CBF] to-[#5B8DEF] px-3 py-2 text-xs font-bold text-white transition hover:opacity-90 disabled:opacity-50"
                      >
                        Üret
                      </button>
                    </div>
                  )}
                </div>
                {activityType === "match" && (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          disabled={uploadingIds.has(`pair-${opt.id}`)}
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            e.target.value = "";
                            void onPickImage(opt.id, f ?? null, true);
                          }}
                        />
                        <span className="inline-flex items-center gap-1.5 rounded-xl border-2 border-[#D0C0F0] bg-[#F0EAFF] px-3 py-2 text-xs font-bold text-[#8B7BAD] transition hover:border-[#B8A0E0]">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {uploadingIds.has(`pair-${opt.id}`) ? "Yükleniyor..." : "Eş görsel"}
                        </span>
                      </label>
                      <button
                        type="button"
                        disabled={generatingIds.has(`pair-${opt.id}`)}
                        onClick={() => {
                          const key = `pair-${opt.id}`;
                          const current = aiPrompts[key];
                          if (current?.trim()) {
                            void onGenerateImage(opt.id, current, true);
                          } else {
                            setAiPrompts((p) => ({ ...p, [key]: p[key] ?? "" }));
                          }
                        }}
                        className="inline-flex items-center gap-1.5 rounded-xl border-2 border-[#E0D4F5] bg-gradient-to-r from-[#F3EAFF] to-[#EAF0FF] px-3 py-2 text-xs font-bold text-[#7C5CBF] transition hover:border-[#C5B0E8] hover:shadow-sm"
                      >
                        {generatingIds.has(`pair-${opt.id}`) ? (
                          <>
                            <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#7C5CBF]/30 border-t-[#7C5CBF]" />
                            Üretiliyor...
                          </>
                        ) : (
                          <>
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                            </svg>
                            AI Eş Görsel
                          </>
                        )}
                      </button>
                      {opt.pairImageUrl && (
                        <div className="h-14 w-18 overflow-hidden rounded-xl border-2 border-[#D0C0F0]">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={opt.pairImageUrl} alt="Eş önizleme" className="h-full w-full object-contain" />
                        </div>
                      )}
                    </div>
                    {aiPrompts[`pair-${opt.id}`] !== undefined && !opt.pairImageUrl && (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={aiPrompts[`pair-${opt.id}`] || ""}
                          onChange={(e) => setAiPrompts((p) => ({ ...p, [`pair-${opt.id}`]: e.target.value }))}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && aiPrompts[`pair-${opt.id}`]?.trim()) {
                              void onGenerateImage(opt.id, aiPrompts[`pair-${opt.id}`], true);
                            }
                          }}
                          placeholder="Örn: mavi bir araba"
                          className="input-playful flex-1 !py-2 text-xs"
                          disabled={generatingIds.has(`pair-${opt.id}`)}
                        />
                        <button
                          type="button"
                          disabled={!aiPrompts[`pair-${opt.id}`]?.trim() || generatingIds.has(`pair-${opt.id}`)}
                          onClick={() => void onGenerateImage(opt.id, aiPrompts[`pair-${opt.id}`], true)}
                          className="shrink-0 rounded-xl bg-gradient-to-r from-[#7C5CBF] to-[#5B8DEF] px-3 py-2 text-xs font-bold text-white transition hover:opacity-90 disabled:opacity-50"
                        >
                          Üret
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addOption}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#D0C0F0] bg-[#F8F5FF]/50 py-4 text-sm font-bold text-[#8B7BAD] transition hover:border-[#FF6B9D] hover:bg-[#FFF5F8] hover:text-[#FF6B9D]"
            >
              <span className="text-lg">+</span>
              {activityType === "match" ? "Çift ekle" : "Seçenek ekle"}
            </button>
          </div>

          {saveError && (
            <div className="rounded-2xl border-2 border-red-200 bg-red-50 px-4 py-3 text-center text-sm font-bold text-red-600">
              {saveError}
            </div>
          )}

          <button
            type="button"
            disabled={!contentValid || isSaving}
            onClick={() => void handleSave()}
            className="btn-candy btn-green flex min-h-[56px] w-full items-center justify-center gap-2 text-lg"
          >
            {isSaving ? (
              <>
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Kaydediliyor...
              </>
            ) : (
              "Güncelle ve Oyna 🚀"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
