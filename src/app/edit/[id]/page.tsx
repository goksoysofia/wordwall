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
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-violet-200 border-t-violet-500" />
          <p className="text-slate-600">Etkinlik yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
        <div className="max-w-md rounded-3xl bg-white p-8 text-center shadow-xl">
          <div className="text-5xl mb-4">😕</div>
          <h1 className="text-xl font-bold text-slate-800 mb-2">{error}</h1>
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

  const selectedTheme = themes.find((t) => t.id === selectedThemeId);

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-zinc-100/50 text-zinc-900">
      <div className="mx-auto max-w-2xl px-4 pb-28 pt-6 sm:px-8 sm:pb-24 sm:pt-8">
        <header className="mb-8 flex items-center gap-4">
          <Link
            href="/"
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white text-base font-semibold text-zinc-600 shadow-sm ring-1 ring-zinc-200 transition hover:bg-zinc-50 active:bg-zinc-100"
          >
            ←
          </Link>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
            Etkinliği Düzenle
          </h1>
        </header>

        <div className="space-y-6">
          <div className="rounded-2xl bg-white p-5 shadow-md ring-1 ring-zinc-200 sm:p-6">
            <label className="mb-3 block text-sm font-semibold text-zinc-500">
              Etkinlik Türü
            </label>
            <div className="grid grid-cols-2 gap-3">
              {(["wheel", "card"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setActivityType(t);
                    if (t === "wheel") setDisplayMode(null);
                    else if (!displayMode) setDisplayMode("grid");
                  }}
                  className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-base font-semibold transition ${
                    activityType === t
                      ? "bg-indigo-600 text-white shadow-sm shadow-indigo-200"
                      : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                  }`}
                >
                  {t === "wheel" ? "🎡 Çark" : "🃏 Kart Açma"}
                </button>
              ))}
            </div>
          </div>

          {activityType === "card" && (
            <div className="rounded-2xl bg-white p-5 shadow-md ring-1 ring-zinc-200 sm:p-6">
              <label className="mb-3 block text-sm font-semibold text-zinc-500">
                Görünüm Modu
              </label>
              <div className="grid grid-cols-2 gap-3">
                {(["grid", "stack"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setDisplayMode(m)}
                    className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-base font-semibold transition ${
                      displayMode === m
                        ? "bg-indigo-600 text-white shadow-sm shadow-indigo-200"
                        : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                    }`}
                  >
                    {m === "grid" ? "⊞ Izgara" : "▤ Sıralı"}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-2xl bg-white p-5 shadow-md ring-1 ring-zinc-200 sm:p-6">
            <label className="mb-3 block text-sm font-semibold text-zinc-500">
              Tema
            </label>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {themes.map((theme) => (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => setSelectedThemeId(theme.id)}
                  className={`flex flex-col overflow-hidden rounded-xl text-left ring-2 transition-all duration-200 active:scale-[0.97] ${
                    selectedThemeId === theme.id
                      ? "ring-indigo-600 shadow-indigo-100"
                      : "ring-zinc-200 hover:ring-indigo-300"
                  }`}
                >
                  <div
                    className="flex items-center gap-2 px-3 py-2.5"
                    style={{ backgroundColor: theme.backgroundColor }}
                  >
                    <span className="text-xl">{theme.emoji}</span>
                    <span className="text-sm font-bold">{theme.name}</span>
                  </div>
                  <div className="flex h-3 w-full">
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
              <p className="mt-3 text-sm text-zinc-400">
                Seçili: {selectedTheme.emoji} {selectedTheme.name}
              </p>
            )}
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-md ring-1 ring-zinc-200 sm:p-6">
            <label
              htmlFor="edit-title"
              className="mb-2 block text-sm font-semibold text-zinc-500"
            >
              Etkinlik Adı
            </label>
            <input
              id="edit-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Örn. Haftanın kelimeleri"
              className="min-h-14 w-full rounded-xl border-2 border-zinc-200 bg-zinc-50 px-4 text-lg outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          <div className="space-y-4">
            <p className="text-sm font-semibold text-zinc-600">Seçenekler</p>
            {options.map((opt, idx) => (
              <div
                key={opt.id}
                className="rounded-2xl bg-white p-4 shadow-md ring-1 ring-zinc-200"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium text-zinc-500">
                    Seçenek {idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeOption(opt.id)}
                    className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-xl bg-red-50 text-lg font-bold text-red-600 ring-1 ring-red-100 active:bg-red-100"
                  >
                    ×
                  </button>
                </div>
                <input
                  type="text"
                  value={opt.text}
                  onChange={(e) => updateOptionText(opt.id, e.target.value)}
                  placeholder="Yazı ekle"
                  className="mb-3 min-h-12 w-full rounded-xl border-2 border-zinc-200 bg-zinc-50 px-3 text-base outline-none focus:border-indigo-500"
                />
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <label className="inline-flex cursor-pointer">
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
                    <span className="inline-flex min-h-12 items-center justify-center rounded-xl bg-zinc-100 px-4 text-base font-semibold text-zinc-800 ring-1 ring-zinc-200 active:bg-zinc-200">
                      {uploadingIds.has(opt.id) ? "Yükleniyor…" : "Görsel ekle"}
                    </span>
                  </label>
                  {opt.imageUrl && (
                    <div className="relative h-20 w-32 overflow-hidden rounded-xl bg-zinc-100">
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
              className="flex min-h-14 w-full items-center justify-center rounded-2xl border-2 border-dashed border-indigo-300 bg-indigo-50/50 text-base font-semibold text-indigo-700 transition hover:border-indigo-400 hover:bg-indigo-50 active:bg-indigo-100"
            >
              + Seçenek ekle
            </button>
          </div>

          {saveError && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-center text-sm text-red-800 ring-1 ring-red-100">
              {saveError}
            </p>
          )}

          <button
            type="button"
            disabled={!contentValid || isSaving}
            onClick={() => void handleSave()}
            className="flex min-h-14 w-full items-center justify-center rounded-2xl bg-emerald-600 text-lg font-bold text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70 active:bg-emerald-800"
          >
            {isSaving ? "Kaydediliyor…" : "Güncelle ve Oyna ✓"}
          </button>
        </div>
      </div>
    </div>
  );
}
