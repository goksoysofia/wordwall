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
}

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
  const [uploadingIds, setUploadingIds] = useState<Set<string>>(new Set());
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
          }))
        );
      } catch {
        setError("Bağlantı hatası.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  function addOption() {
    setOptions((prev) => [...prev, { id: uuidv4(), text: "" }]);
  }

  function removeOption(optId: string) {
    setOptions((prev) => {
      const next = prev.filter((o) => o.id !== optId);
      return next.length === 0 ? [{ id: uuidv4(), text: "" }] : next;
    });
  }

  function updateOptionText(optId: string, text: string) {
    setOptions((prev) =>
      prev.map((o) => (o.id === optId ? { ...o, text } : o))
    );
  }

  async function onPickImage(optionId: string, file: File | null) {
    if (!file) return;
    setUploadingIds((s) => new Set(s).add(optionId));
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
      setOptions((prev) =>
        prev.map((o) =>
          o.id === optionId ? { ...o, imageUrl: data.url } : o
        )
      );
    } catch (e) {
      alert(e instanceof Error ? e.message : "Görsel yüklenirken hata oluştu.");
    } finally {
      setUploadingIds((s) => {
        const next = new Set(s);
        next.delete(optionId);
        return next;
      });
    }
  }

  const contentValid = useMemo(
    () =>
      options.length > 0 &&
      options.every((o) => o.text.trim().length > 0 || Boolean(o.imageUrl)),
    [options]
  );

  async function handleSave() {
    const payloadOptions = options
      .filter((o) => o.text.trim().length > 0 || o.imageUrl)
      .map((o) => ({
        id: o.id,
        ...(o.text.trim() ? { text: o.text.trim() } : {}),
        ...(o.imageUrl ? { imageUrl: o.imageUrl } : {}),
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
      setSaveError(
        e instanceof Error ? e.message : "Kaydedilirken bir hata oluştu."
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50/30">
        <div className="flex flex-col items-center gap-5">
          <div className="relative">
            <div className="h-14 w-14 animate-spin rounded-full border-[3px] border-indigo-100 border-t-indigo-600" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-6 w-6 rounded-full bg-indigo-50" />
            </div>
          </div>
          <p className="text-sm font-medium text-slate-400">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50/30 px-4">
        <div className="glass-strong max-w-sm rounded-3xl border border-slate-100 p-10 text-center shadow-xl">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-3xl">
            😕
          </div>
          <h1 className="text-lg font-bold text-slate-800">{error}</h1>
          <Link
            href="/"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
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
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-indigo-50/30" />
        <div className="absolute left-[-20%] top-[10%] h-[500px] w-[500px] rounded-full bg-indigo-50/50 blur-3xl" />
        <div className="absolute bottom-[0%] right-[-10%] h-[400px] w-[400px] rounded-full bg-purple-50/50 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-xl px-4 pb-32 pt-6 sm:px-6 sm:pb-28 sm:pt-8">
        {/* Header */}
        <header className="animate-fade-in mb-8 flex items-center gap-4">
          <Link
            href="/"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-sm text-slate-500 shadow-sm ring-1 ring-slate-200/80 transition hover:bg-slate-50 hover:text-slate-700"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-lg font-bold tracking-tight text-slate-800 sm:text-xl">
            Etkinliği Düzenle
          </h1>
        </header>

        <div className="animate-slide-up space-y-5">
          {/* Type */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <label className="mb-3 block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Etkinlik Türü
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {(["wheel", "card"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setActivityType(t);
                    if (t === "wheel") setDisplayMode(null);
                    else if (!displayMode) setDisplayMode("grid");
                  }}
                  className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                    activityType === t
                      ? "bg-indigo-500 text-white shadow-sm shadow-indigo-200"
                      : "bg-slate-50 text-slate-500 ring-1 ring-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {t === "wheel" ? "🎡 Çark" : "🃏 Kart Açma"}
                </button>
              ))}
            </div>
          </div>

          {/* Display mode */}
          {activityType === "card" && (
            <div className="animate-scale-in rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
              <label className="mb-3 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Görünüm Modu
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {(["grid", "stack"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setDisplayMode(m)}
                    className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                      displayMode === m
                        ? "bg-indigo-500 text-white shadow-sm shadow-indigo-200"
                        : "bg-slate-50 text-slate-500 ring-1 ring-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {m === "grid" ? "⊞ Izgara" : "▤ Sıralı"}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Theme */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <label className="mb-3 block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Tema
            </label>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {themes.map((theme) => (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => setSelectedThemeId(theme.id)}
                  className={`flex flex-col overflow-hidden rounded-xl border-2 text-left transition-all duration-200 active:scale-[0.97] ${
                    selectedThemeId === theme.id
                      ? "border-indigo-500 shadow-sm shadow-indigo-100"
                      : "border-transparent ring-1 ring-slate-200 hover:ring-slate-300"
                  }`}
                >
                  <div
                    className="flex items-center gap-2 px-3 py-2.5"
                    style={{ backgroundColor: theme.backgroundColor }}
                  >
                    <span className="text-lg">{theme.emoji}</span>
                    <span className="min-w-0 flex-1 truncate text-xs font-bold text-slate-700">
                      {theme.name}
                    </span>
                    {selectedThemeId === theme.id && (
                      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-indigo-500 text-[8px] text-white">
                        ✓
                      </span>
                    )}
                  </div>
                  <div className="flex h-1.5 w-full">
                    {theme.cardColors.map((c, i) => (
                      <div
                        key={i}
                        className="flex-1"
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </button>
              ))}
            </div>
            {selectedTheme && (
              <p className="mt-3 text-xs text-slate-400">
                Seçili: {selectedTheme.emoji} {selectedTheme.name}
              </p>
            )}
          </div>

          {/* Title */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <label
              htmlFor="edit-title"
              className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400"
            >
              Etkinlik Adı
            </label>
            <input
              id="edit-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Örn. Haftanın kelimeleri"
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3.5 text-base font-medium text-slate-800 placeholder:text-slate-300 focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          {/* Options */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Seçenekler
              </p>
              <p className="text-[11px] text-slate-300">
                {options.filter((o) => o.text.trim() || o.imageUrl).length} eklendi
              </p>
            </div>
            {options.map((opt, idx) => (
              <div
                key={opt.id}
                className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-400">
                    {idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeOption(opt.id)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-300 transition hover:bg-red-50 hover:text-red-500"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <input
                  type="text"
                  value={opt.text}
                  onChange={(e) => updateOptionText(opt.id, e.target.value)}
                  placeholder="Yazı ekle..."
                  className="mb-3 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-medium text-slate-700 placeholder:text-slate-300 focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                />
                <div className="flex items-center gap-3">
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
                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-500 transition hover:border-slate-300 hover:bg-slate-100">
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {uploadingIds.has(opt.id) ? "Yükleniyor..." : "Görsel"}
                    </span>
                  </label>
                  {opt.imageUrl && (
                    <div className="h-12 w-16 overflow-hidden rounded-lg bg-slate-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={opt.imageUrl}
                        alt="Önizleme"
                        className="h-full w-full object-contain"
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={addOption}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 bg-white/50 py-4 text-sm font-semibold text-slate-400 transition hover:border-indigo-300 hover:bg-indigo-50/30 hover:text-indigo-500"
            >
              <span className="text-lg">+</span>
              Seçenek ekle
            </button>
          </div>

          {saveError && (
            <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-center text-sm text-red-600">
              {saveError}
            </div>
          )}

          <button
            type="button"
            disabled={!contentValid || isSaving}
            onClick={() => void handleSave()}
            className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 text-base font-bold text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.98]"
          >
            {isSaving ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Kaydediliyor...
              </>
            ) : (
              "Güncelle ve Oyna"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
