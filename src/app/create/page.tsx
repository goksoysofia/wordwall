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
      return "Tür";
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

      const contentType = res.headers.get("content-type") ?? "";
      if (!contentType.includes("application/json")) {
        const text = await res.text();
        throw new Error(text || "Sunucu geçersiz yanıt döndürdü");
      }

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
    <div className="relative min-h-screen overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-indigo-50/30" />
        <div className="absolute left-[-20%] top-[10%] h-[500px] w-[500px] rounded-full bg-indigo-50/50 blur-3xl" />
        <div className="absolute bottom-[0%] right-[-10%] h-[400px] w-[400px] rounded-full bg-purple-50/50 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-xl flex-col px-4 pb-32 pt-6 sm:px-6 sm:pb-28 sm:pt-8">
        {/* Header */}
        <header className="animate-fade-in mb-8 flex shrink-0 items-center gap-4">
          {currentStep === "type" ? (
            <Link
              href="/"
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-sm text-slate-500 shadow-sm ring-1 ring-slate-200/80 transition hover:bg-slate-50 hover:text-slate-700"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
          ) : (
            <button
              type="button"
              onClick={goBack}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-sm text-slate-500 shadow-sm ring-1 ring-slate-200/80 transition hover:bg-slate-50 hover:text-slate-700"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-bold tracking-tight text-slate-800 sm:text-xl">
              Yeni Etkinlik
            </h1>
          </div>
          <div className="text-xs font-semibold text-slate-400">
            {stepIndex + 1}/{totalSteps}
          </div>
        </header>

        {/* Progress Bar */}
        <div className="animate-fade-in mb-10 sm:mb-12">
          <div className="flex gap-1.5">
            {flowSteps.map((s, i) => (
              <div key={s + i} className="flex-1" title={stepLabel(s)}>
                <div
                  className={`h-1 rounded-full transition-all duration-500 ${
                    i <= stepIndex ? "bg-indigo-500" : "bg-slate-200"
                  }`}
                />
                <p
                  className={`mt-1.5 text-center text-[10px] font-semibold transition-colors ${
                    i === stepIndex ? "text-indigo-600" : "text-slate-300"
                  }`}
                >
                  {stepLabel(s)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Steps */}
        <main className="flex-1">
          {/* Step: Type */}
          {currentStep === "type" && (
            <section className="animate-slide-up space-y-6" aria-labelledby="step-type-heading">
              <h2 id="step-type-heading" className="sr-only">
                Etkinlik türü seçin
              </h2>
              <div className="text-center">
                <h3 className="text-2xl font-bold text-slate-800 sm:text-3xl">
                  Ne oluşturmak istersiniz?
                </h3>
                <p className="mt-2 text-sm text-slate-400">
                  Bir etkinlik türü seçin
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => selectType("wheel")}
                  className="card-hover group flex flex-col items-center justify-center gap-4 rounded-3xl border border-slate-200/80 bg-white p-6 py-10 text-center shadow-sm"
                >
                  <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-amber-50 to-orange-50 text-5xl shadow-inner transition-transform duration-300 group-hover:scale-110">
                    🎡
                  </div>
                  <div>
                    <span className="text-lg font-bold text-slate-800">Çark</span>
                    <p className="mt-1 text-xs text-slate-400">
                      Rastgele seçim çarkı
                    </p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => selectType("card")}
                  className="card-hover group flex flex-col items-center justify-center gap-4 rounded-3xl border border-slate-200/80 bg-white p-6 py-10 text-center shadow-sm"
                >
                  <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-50 to-indigo-50 text-5xl shadow-inner transition-transform duration-300 group-hover:scale-110">
                    🃏
                  </div>
                  <div>
                    <span className="text-lg font-bold text-slate-800">Kart Açma</span>
                    <p className="mt-1 text-xs text-slate-400">
                      Kartları çevirerek keşfet
                    </p>
                  </div>
                </button>
              </div>
            </section>
          )}

          {/* Step: Display */}
          {currentStep === "display" && (
            <section className="animate-slide-up space-y-6" aria-labelledby="step-display-heading">
              <h2 id="step-display-heading" className="sr-only">
                Görünüm modu
              </h2>
              <div className="text-center">
                <h3 className="text-2xl font-bold text-slate-800 sm:text-3xl">
                  Kartlar nasıl görünsün?
                </h3>
                <p className="mt-2 text-sm text-slate-400">
                  Bir görünüm modu seçin
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => confirmDisplayMode("grid")}
                  className="card-hover group flex flex-col items-center justify-center gap-4 rounded-3xl border border-slate-200/80 bg-white p-6 py-10 text-center shadow-sm"
                >
                  <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-50 to-teal-50 shadow-inner transition-transform duration-300 group-hover:scale-110">
                    <div className="grid grid-cols-3 gap-1">
                      {Array.from({ length: 9 }).map((_, i) => (
                        <div key={i} className="h-3 w-3 rounded-sm bg-emerald-300/80" />
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-lg font-bold text-slate-800">Izgara</span>
                    <p className="mt-1 text-xs text-slate-400">3x3 ızgara düzeni</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => confirmDisplayMode("stack")}
                  className="card-hover group flex flex-col items-center justify-center gap-4 rounded-3xl border border-slate-200/80 bg-white p-6 py-10 text-center shadow-sm"
                >
                  <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-violet-50 to-purple-50 shadow-inner transition-transform duration-300 group-hover:scale-110">
                    <div className="flex flex-col items-center gap-1">
                      <div className="h-6 w-10 rounded-md border-2 border-violet-300/80 bg-violet-100/50" />
                      <div className="h-6 w-10 -translate-y-3 rounded-md border-2 border-violet-400/80 bg-violet-200/50" />
                    </div>
                  </div>
                  <div>
                    <span className="text-lg font-bold text-slate-800">Sıralı</span>
                    <p className="mt-1 text-xs text-slate-400">Kartlar sırayla açılır</p>
                  </div>
                </button>
              </div>
            </section>
          )}

          {/* Step: Theme */}
          {currentStep === "theme" && (
            <section className="animate-slide-up space-y-6" aria-labelledby="step-theme-heading">
              <h2 id="step-theme-heading" className="sr-only">
                Tema seçin
              </h2>
              <div className="text-center">
                <h3 className="text-2xl font-bold text-slate-800 sm:text-3xl">
                  Bir tema seçin
                </h3>
                <p className="mt-2 text-sm text-slate-400">
                  Renkler ve görseller buna göre ayarlanır
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2 sm:grid-cols-3">
                {themes.map((theme) => {
                  const selected = selectedThemeId === theme.id;
                  return (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => setSelectedThemeId(theme.id)}
                      className={`flex flex-col overflow-hidden rounded-2xl border-2 bg-white text-left shadow-sm transition-all duration-200 active:scale-[0.97] ${
                        selected
                          ? "border-indigo-500 shadow-md shadow-indigo-100 ring-2 ring-indigo-500/20"
                          : "border-transparent ring-1 ring-slate-200/80 hover:ring-slate-300"
                      }`}
                    >
                      <div
                        className="flex items-center gap-2.5 px-3.5 py-3 sm:px-4"
                        style={{ backgroundColor: theme.backgroundColor }}
                      >
                        <span className="text-2xl" aria-hidden>
                          {theme.emoji}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-[13px] font-bold text-slate-700">
                          {theme.name}
                        </span>
                        {selected && (
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-500 text-[10px] text-white">
                            ✓
                          </span>
                        )}
                      </div>
                      <div className="flex h-2 w-full" role="presentation">
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
              <button
                type="button"
                disabled={!selectedThemeId}
                onClick={goNextFromTheme}
                className="btn-primary mt-4 flex min-h-[52px] w-full items-center justify-center rounded-2xl text-base font-bold text-white shadow-lg shadow-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
                style={!selectedThemeId ? { background: "#d1d5db" } : undefined}
              >
                Devam
              </button>
            </section>
          )}

          {/* Step: Content */}
          {currentStep === "content" && (
            <section className="animate-slide-up space-y-6" aria-labelledby="step-content-heading">
              <h2 id="step-content-heading" className="sr-only">
                İçerik ekle
              </h2>
              <div className="text-center">
                <h3 className="text-2xl font-bold text-slate-800 sm:text-3xl">
                  İçeriği hazırlayın
                </h3>
                <p className="mt-2 text-sm text-slate-400">
                  Etkinliğe ad verin ve seçenekleri ekleyin
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
                <label
                  htmlFor="activity-title"
                  className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400"
                >
                  Etkinlik adı
                </label>
                <input
                  id="activity-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Örn. Haftanın kelimeleri"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3.5 text-base font-medium text-slate-800 placeholder:text-slate-300 focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                />
              </div>

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
                        aria-label="Seçeneği kaldır"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
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
                    {opt.text.trim().length === 0 && !opt.imageUrl && (
                      <p className="mt-2 text-xs text-amber-500">
                        Yazı veya görsel ekleyin
                      </p>
                    )}
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={addOption}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 bg-white/50 py-4 text-sm font-semibold text-slate-400 transition hover:border-indigo-300 hover:bg-indigo-50/30 hover:text-indigo-500"
              >
                <span className="text-lg">+</span>
                Seçenek ekle
              </button>

              {!contentValid && hasAtLeastOneOption && (
                <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-center text-xs font-medium text-amber-600">
                  Tüm seçeneklerde yazı veya görsel olmalı
                </div>
              )}
              {!hasAtLeastOneOption && (
                <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-center text-xs font-medium text-amber-600">
                  En az bir seçenek ekleyin
                </div>
              )}

              <button
                type="button"
                disabled={!contentValid || !hasAtLeastOneOption}
                onClick={goNextFromContent}
                className="btn-primary flex min-h-[52px] w-full items-center justify-center rounded-2xl text-base font-bold text-white shadow-lg shadow-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
                style={!contentValid || !hasAtLeastOneOption ? { background: "#d1d5db" } : undefined}
              >
                Önizleme
              </button>
            </section>
          )}

          {/* Step: Preview */}
          {currentStep === "preview" && (
            <section className="animate-slide-up space-y-6" aria-labelledby="step-preview-heading">
              <h2 id="step-preview-heading" className="sr-only">
                Önizleme ve kaydet
              </h2>
              <div className="text-center">
                <h3 className="text-2xl font-bold text-slate-800 sm:text-3xl">
                  Her şey hazır!
                </h3>
                <p className="mt-2 text-sm text-slate-400">
                  Kontrol edin ve kaydedin
                </p>
              </div>

              <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
                <div className="divide-y divide-slate-100">
                  <div className="flex items-center justify-between px-5 py-4">
                    <span className="text-sm text-slate-400">Etkinlik adı</span>
                    <span className="text-sm font-semibold text-slate-800">
                      {title.trim() || "Adsız etkinlik"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between px-5 py-4">
                    <span className="text-sm text-slate-400">Tür</span>
                    <span className="text-sm font-semibold text-slate-800">
                      {activityType === "wheel" ? "🎡 Çark" : "🃏 Kart açma"}
                    </span>
                  </div>
                  {activityType === "card" && displayMode && (
                    <div className="flex items-center justify-between px-5 py-4">
                      <span className="text-sm text-slate-400">Görünüm</span>
                      <span className="text-sm font-semibold text-slate-800">
                        {displayMode === "grid" ? "Izgara (3x3)" : "Sıralı"}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between px-5 py-4">
                    <span className="text-sm text-slate-400">Tema</span>
                    <span className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                      {selectedTheme && (
                        <>
                          {selectedTheme.emoji} {selectedTheme.name}
                        </>
                      )}
                    </span>
                  </div>
                  <div className="px-5 py-4">
                    <span className="text-sm text-slate-400">
                      Seçenekler ({options.filter((o) => o.text.trim().length > 0 || Boolean(o.imageUrl)).length})
                    </span>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {options
                        .filter((o) => o.text.trim().length > 0 || Boolean(o.imageUrl))
                        .map((o) => (
                          <span
                            key={o.id}
                            className="inline-flex items-center rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600"
                          >
                            {o.text.trim() || "Görsel"}
                            {o.imageUrl && <span className="ml-1 text-slate-400">📷</span>}
                          </span>
                        ))}
                    </div>
                  </div>
                </div>
              </div>

              {saveError && (
                <div
                  className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-center text-sm text-red-600"
                  role="alert"
                >
                  {saveError}
                </div>
              )}

              <button
                type="button"
                disabled={isSaving}
                onClick={() => void handleSave()}
                className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 text-base font-bold text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.98]"
              >
                {isSaving ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Kaydediliyor...
                  </>
                ) : (
                  "Kaydet ve Oyna"
                )}
              </button>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
