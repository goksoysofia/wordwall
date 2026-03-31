"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { themes } from "@/lib/themes";
import type { CreateActivityPayload } from "@/types/activity";

type FlowStep = "type" | "display" | "theme" | "content" | "preview";

interface OptionRow {
  id: string;
  text: string;
  imageUrl?: string;
}

function getFlowSteps(activityType: "wheel" | "card" | null): FlowStep[] {
  if (!activityType) return ["type"];
  if (activityType === "wheel") return ["type", "theme", "content", "preview"];
  return ["type", "display", "theme", "content", "preview"];
}

function stepLabel(step: FlowStep): string {
  switch (step) {
    case "type":
      return "Etkinlik türü";
    case "display":
      return "Görünüm";
    case "theme":
      return "Tema";
    case "content":
      return "İçerik";
    case "preview":
      return "Önizleme";
    default:
      return "";
  }
}

export default function CreateActivityPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<FlowStep>("type");
  const [activityType, setActivityType] = useState<"wheel" | "card" | null>(
    null
  );
  const [displayMode, setDisplayMode] = useState<"grid" | "stack" | null>(
    null
  );
  const [selectedThemeId, setSelectedThemeId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [options, setOptions] = useState<OptionRow[]>([
    { id: uuidv4(), text: "" },
  ]);
  const [uploadingIds, setUploadingIds] = useState<Set<string>>(new Set());
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const flowSteps = useMemo(
    () => getFlowSteps(activityType),
    [activityType]
  );
  const stepIndex = flowSteps.indexOf(currentStep);
  const totalSteps = flowSteps.length;

  function goBack() {
    if (currentStep === "type") return;
    const idx = stepIndex;
    if (idx <= 0) return;
    setCurrentStep(flowSteps[idx - 1]!);
  }

  function selectType(type: "wheel" | "card") {
    setActivityType(type);
    setDisplayMode(type === "wheel" ? null : displayMode);
    if (type === "wheel") {
      setCurrentStep("theme");
    } else {
      setCurrentStep("display");
    }
  }

  function confirmDisplayMode(mode: "grid" | "stack") {
    setDisplayMode(mode);
    setCurrentStep("theme");
  }

  function goNextFromTheme() {
    if (!selectedThemeId) return;
    setCurrentStep("content");
  }

  function goNextFromContent() {
    const hasEmptyRow = options.some(
      (o) => o.text.trim().length === 0 && !o.imageUrl
    );
    if (hasEmptyRow) return;
    const hasOne = options.some(
      (o) => o.text.trim().length > 0 || Boolean(o.imageUrl)
    );
    if (!hasOne) return;
    setCurrentStep("preview");
  }

  function addOption() {
    setOptions((prev) => [...prev, { id: uuidv4(), text: "" }]);
  }

  function removeOption(id: string) {
    setOptions((prev) => {
      const next = prev.filter((o) => o.id !== id);
      return next.length === 0 ? [{ id: uuidv4(), text: "" }] : next;
    });
  }

  function updateOptionText(id: string, text: string) {
    setOptions((prev) =>
      prev.map((o) => (o.id === id ? { ...o, text } : o))
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
      if (!res.ok) {
        throw new Error(data.error || "Yükleme başarısız");
      }
      if (!data.url) throw new Error("Sunucu yanıtı geçersiz");
      setOptions((prev) =>
        prev.map((o) =>
          o.id === optionId ? { ...o, imageUrl: data.url } : o
        )
      );
    } catch (e) {
      console.error(e);
      alert(
        e instanceof Error ? e.message : "Görsel yüklenirken bir hata oluştu."
      );
    } finally {
      setUploadingIds((s) => {
        const next = new Set(s);
        next.delete(optionId);
        return next;
      });
    }
  }

  const contentValid =
    options.length > 0 &&
    options.every((o) => o.text.trim().length > 0 || Boolean(o.imageUrl));
  const hasAtLeastOneOption = options.some(
    (o) => o.text.trim().length > 0 || Boolean(o.imageUrl)
  );

  async function handleSave() {
    if (!activityType || !selectedThemeId) return;
    if (activityType === "card" && !displayMode) return;

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

    const body: CreateActivityPayload = {
      title: title.trim() || "Adsız etkinlik",
      type: activityType,
      display_mode: activityType === "card" ? displayMode : null,
      theme: selectedThemeId,
      options: payloadOptions,
    };

    setSaveError(null);
    setIsSaving(true);
    try {
      const res = await fetch("/api/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as { id?: string; error?: string };
      if (!res.ok) {
        throw new Error(data.error || "Kayıt başarısız");
      }
      if (!data.id) throw new Error("Etkinlik kimliği alınamadı");
      router.push(`/play/${data.id}`);
    } catch (e) {
      setSaveError(
        e instanceof Error ? e.message : "Kaydedilirken bir hata oluştu."
      );
    } finally {
      setIsSaving(false);
    }
  }

  const selectedTheme = themes.find((t) => t.id === selectedThemeId);

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-zinc-100/50 text-zinc-900">
      <div className="mx-auto flex min-h-screen max-w-2xl flex-col px-4 pb-28 pt-6 sm:px-8 sm:pb-24 sm:pt-8">
        <header className="mb-6 flex shrink-0 items-center gap-4 sm:mb-8">
          {currentStep === "type" ? (
            <Link
              href="/"
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white text-base font-semibold text-zinc-600 shadow-sm ring-1 ring-zinc-200 transition hover:bg-zinc-50 active:bg-zinc-100"
            >
              ←
            </Link>
          ) : (
            <button
              type="button"
              onClick={goBack}
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white text-base font-semibold text-zinc-600 shadow-sm ring-1 ring-zinc-200 transition hover:bg-zinc-50 active:bg-zinc-100"
            >
              ←
            </button>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-xl font-bold tracking-tight sm:text-2xl">
              Etkinlik oluştur
            </h1>
            <p className="mt-0.5 text-sm text-zinc-400">
              {stepLabel(currentStep)} · Adım {stepIndex + 1} / {totalSteps}
            </p>
          </div>
        </header>

        <div
          className="mx-auto mb-8 flex w-full max-w-xs items-center justify-center gap-2 sm:mb-10"
          role="progressbar"
          aria-valuenow={stepIndex + 1}
          aria-valuemin={1}
          aria-valuemax={totalSteps}
          aria-label="İlerleme"
        >
          {flowSteps.map((s, i) => (
            <span
              key={s + i}
              className={`h-2 flex-1 rounded-full transition-all duration-300 ${
                i === stepIndex
                  ? "bg-indigo-600 shadow-sm shadow-indigo-200"
                  : i < stepIndex
                    ? "bg-indigo-300"
                    : "bg-zinc-200"
              }`}
              title={stepLabel(s)}
            />
          ))}
        </div>

        <main className="flex-1">
          {currentStep === "type" && (
            <section className="space-y-6" aria-labelledby="step-type-heading">
              <h2 id="step-type-heading" className="sr-only">
                Etkinlik türü seçin
              </h2>
              <p className="text-center text-base text-zinc-500 sm:text-lg">
                Hangi etkinlik türünü kullanmak istersiniz?
              </p>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => selectType("wheel")}
                  className="flex aspect-square flex-col items-center justify-center gap-3 rounded-3xl border-2 border-transparent bg-white p-6 text-center shadow-md ring-1 ring-zinc-200 transition hover:ring-indigo-300 hover:shadow-lg active:scale-[0.97]"
                >
                  <span className="text-5xl sm:text-6xl" aria-hidden>
                    🎡
                  </span>
                  <span className="text-lg font-bold sm:text-xl">Çark</span>
                  <span className="text-xs text-zinc-400 sm:text-sm">
                    Rastgele seçim çarkı
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => selectType("card")}
                  className="flex aspect-square flex-col items-center justify-center gap-3 rounded-3xl border-2 border-transparent bg-white p-6 text-center shadow-md ring-1 ring-zinc-200 transition hover:ring-indigo-300 hover:shadow-lg active:scale-[0.97]"
                >
                  <span className="text-5xl sm:text-6xl" aria-hidden>
                    🃏
                  </span>
                  <span className="text-lg font-bold sm:text-xl">
                    Kart Açma
                  </span>
                  <span className="text-xs text-zinc-400 sm:text-sm">
                    Kartları çevirerek keşfet
                  </span>
                </button>
              </div>
            </section>
          )}

          {currentStep === "display" && (
            <section
              className="space-y-6"
              aria-labelledby="step-display-heading"
            >
              <h2 id="step-display-heading" className="sr-only">
                Görünüm modu
              </h2>
              <p className="text-center text-base text-zinc-500 sm:text-lg">
                Kartların nasıl dizileceğini seçin.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => confirmDisplayMode("grid")}
                  className="flex aspect-square flex-col items-center justify-center gap-3 rounded-3xl bg-white p-6 shadow-md ring-1 ring-zinc-200 transition hover:ring-indigo-300 hover:shadow-lg active:scale-[0.97]"
                >
                  <span className="text-4xl sm:text-5xl" aria-hidden>
                    ⊞
                  </span>
                  <span className="text-lg font-bold">Izgara Modu</span>
                  <span className="text-xs text-zinc-400 sm:text-sm">3×3 ızgara düzeni</span>
                </button>
                <button
                  type="button"
                  onClick={() => confirmDisplayMode("stack")}
                  className="flex aspect-square flex-col items-center justify-center gap-3 rounded-3xl bg-white p-6 shadow-md ring-1 ring-zinc-200 transition hover:ring-indigo-300 hover:shadow-lg active:scale-[0.97]"
                >
                  <span className="text-4xl sm:text-5xl" aria-hidden>
                    ▤
                  </span>
                  <span className="text-lg font-bold">Sıralı Mod</span>
                  <span className="text-xs text-zinc-400 sm:text-sm">
                    Kartlar sırayla açılır
                  </span>
                </button>
              </div>
            </section>
          )}

          {currentStep === "theme" && (
            <section className="space-y-6" aria-labelledby="step-theme-heading">
              <h2 id="step-theme-heading" className="sr-only">
                Tema seçin
              </h2>
              <p className="text-center text-base text-zinc-500 sm:text-lg">
                Bir tema seçin; renkler ve görseller buna göre ayarlanır.
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
                {themes.map((theme) => {
                  const selected = selectedThemeId === theme.id;
                  return (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => setSelectedThemeId(theme.id)}
                      className={`flex flex-col overflow-hidden rounded-2xl bg-white text-left shadow-md ring-2 transition-all duration-200 active:scale-[0.97] ${
                        selected
                          ? "ring-indigo-600 shadow-indigo-100"
                          : "ring-zinc-200 hover:ring-indigo-300"
                      }`}
                    >
                      <div
                        className="flex items-center gap-2 px-3 pb-2 pt-3 sm:px-4 sm:pt-4"
                        style={{ backgroundColor: theme.backgroundColor }}
                      >
                        <span className="text-2xl sm:text-3xl" aria-hidden>
                          {theme.emoji}
                        </span>
                        <span className="min-w-0 flex-1 text-sm font-bold leading-tight sm:text-base">
                          {theme.name}
                        </span>
                      </div>
                      <div
                        className="flex h-3 w-full sm:h-4"
                        role="presentation"
                      >
                        {theme.cardColors.map((c, i) => (
                          <div
                            key={i}
                            className="min-w-0 flex-1"
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="pt-4">
                <button
                  type="button"
                  disabled={!selectedThemeId}
                  onClick={goNextFromTheme}
                  className="flex min-h-14 w-full items-center justify-center rounded-2xl bg-indigo-600 text-lg font-bold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:shadow-none active:bg-indigo-800"
                >
                  Devam →
                </button>
              </div>
            </section>
          )}

          {currentStep === "content" && (
            <section
              className="space-y-6"
              aria-labelledby="step-content-heading"
            >
              <h2 id="step-content-heading" className="sr-only">
                İçerik ekle
              </h2>
              <div>
                <label
                  htmlFor="activity-title"
                  className="mb-2 block text-sm font-semibold text-zinc-600"
                >
                  Etkinlik adı
                </label>
                <input
                  id="activity-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Örn. Haftanın kelimeleri"
                  className="min-h-14 w-full rounded-2xl border-2 border-zinc-200 bg-white px-4 text-lg outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-baseline justify-between">
                  <p className="text-sm font-semibold text-zinc-600">
                    Seçenekler
                  </p>
                  <p className="text-xs text-zinc-400">
                    Her satırda yazı veya görsel olmalıdır
                  </p>
                </div>
                {options.map((opt, idx) => (
                  <div
                    key={opt.id}
                    className="rounded-2xl bg-white p-4 shadow-md ring-1 ring-zinc-200"
                  >
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-zinc-500">
                        Seçenek {idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeOption(opt.id)}
                        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl bg-red-50 text-lg font-bold text-red-600 ring-1 ring-red-100 active:bg-red-100"
                        aria-label="Seçeneği kaldır"
                      >
                        ×
                      </button>
                    </div>
                    <label className="sr-only" htmlFor={`opt-text-${opt.id}`}>
                      Yazı ekle
                    </label>
                    <input
                      id={`opt-text-${opt.id}`}
                      type="text"
                      value={opt.text}
                      onChange={(e) =>
                        updateOptionText(opt.id, e.target.value)
                      }
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
                        <span className="inline-flex min-h-12 flex-1 items-center justify-center rounded-xl bg-zinc-100 px-4 text-base font-semibold text-zinc-800 ring-1 ring-zinc-200 active:bg-zinc-200 sm:flex-none">
                          {uploadingIds.has(opt.id)
                            ? "Yükleniyor…"
                            : "Görsel ekle"}
                        </span>
                      </label>
                      {opt.imageUrl && (
                        <div className="relative h-24 w-full overflow-hidden rounded-xl bg-zinc-100 sm:h-20 sm:w-32">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={opt.imageUrl}
                            alt="Önizleme"
                            className="h-full w-full object-contain"
                          />
                        </div>
                      )}
                    </div>
                    {opt.text.trim().length === 0 && !opt.imageUrl && (
                      <p className="mt-2 text-sm text-amber-700">
                        Yazı veya görsel ekleyin.
                      </p>
                    )}
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={addOption}
                className="flex min-h-14 w-full items-center justify-center rounded-2xl border-2 border-dashed border-indigo-300 bg-indigo-50/50 text-base font-semibold text-indigo-700 transition hover:border-indigo-400 hover:bg-indigo-50 active:bg-indigo-100"
              >
                + Seçenek ekle
              </button>

              {!contentValid && hasAtLeastOneOption && (
                <p className="rounded-xl bg-amber-50 px-4 py-3 text-center text-sm text-amber-700 ring-1 ring-amber-100">
                  Tüm seçeneklerde yazı veya görsel olmalı; boş satırları
                  silin veya doldurun.
                </p>
              )}
              {!hasAtLeastOneOption && (
                <p className="rounded-xl bg-amber-50 px-4 py-3 text-center text-sm text-amber-700 ring-1 ring-amber-100">
                  En az bir seçenek için yazı veya görsel ekleyin.
                </p>
              )}

              <button
                type="button"
                disabled={!contentValid || !hasAtLeastOneOption}
                onClick={goNextFromContent}
                className="flex min-h-14 w-full items-center justify-center rounded-2xl bg-indigo-600 text-lg font-bold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:shadow-none active:bg-indigo-800"
              >
                Önizlemeye geç →
              </button>
            </section>
          )}

          {currentStep === "preview" && (
            <section
              className="space-y-6"
              aria-labelledby="step-preview-heading"
            >
              <h2 id="step-preview-heading" className="sr-only">
                Önizleme ve kaydet
              </h2>
              <div className="rounded-3xl bg-white p-6 shadow-md ring-1 ring-zinc-200 sm:p-8">
                <h3 className="mb-5 text-lg font-bold text-zinc-800">
                  Özet
                </h3>
                <dl className="space-y-3 text-base">
                  <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
                    <dt className="font-medium text-zinc-500">Etkinlik adı</dt>
                    <dd className="font-semibold text-zinc-900">
                      {title.trim() || "Adsız etkinlik"}
                    </dd>
                  </div>
                  <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
                    <dt className="font-medium text-zinc-500">Tür</dt>
                    <dd className="font-semibold text-zinc-900">
                      {activityType === "wheel" ? "Çark" : "Kart açma"}
                    </dd>
                  </div>
                  {activityType === "card" && displayMode && (
                    <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
                      <dt className="font-medium text-zinc-500">Görünüm</dt>
                      <dd className="font-semibold text-zinc-900">
                        {displayMode === "grid"
                          ? "Izgara modu (3×3)"
                          : "Sıralı mod"}
                      </dd>
                    </div>
                  )}
                  <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
                    <dt className="font-medium text-zinc-500">Tema</dt>
                    <dd className="flex items-center gap-2 font-semibold text-zinc-900">
                      {selectedTheme && (
                        <>
                          <span>{selectedTheme.emoji}</span>
                          <span>{selectedTheme.name}</span>
                        </>
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="mb-2 font-medium text-zinc-500">
                      Seçenekler (
                      {
                        options.filter(
                          (o) =>
                            o.text.trim().length > 0 || Boolean(o.imageUrl)
                        ).length
                      }
                      )
                    </dt>
                    <dd>
                      <ul className="list-inside list-disc space-y-1 text-zinc-800">
                        {options
                          .filter(
                            (o) =>
                              o.text.trim().length > 0 || Boolean(o.imageUrl)
                          )
                          .map((o) => (
                            <li key={o.id}>
                              {o.text.trim() || "(görsel)"}
                              {o.imageUrl ? " · görsel eklendi" : ""}
                            </li>
                          ))}
                      </ul>
                    </dd>
                  </div>
                </dl>
              </div>

              {saveError && (
                <p
                  className="rounded-2xl bg-red-50 px-4 py-3 text-center text-sm text-red-800 ring-1 ring-red-100"
                  role="alert"
                >
                  {saveError}
                </p>
              )}

              <button
                type="button"
                disabled={isSaving}
                onClick={() => void handleSave()}
                className="flex min-h-14 w-full items-center justify-center rounded-2xl bg-emerald-600 text-lg font-bold text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70 active:bg-emerald-800"
              >
                {isSaving ? "Kaydediliyor…" : "Kaydet ve Oyna ✓"}
              </button>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
