"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { themes } from "@/lib/themes";
import { useAuth } from "@/lib/auth-context";
import { authFetch } from "@/lib/auth-fetch";
import ImageSearchModal from "@/components/ImageSearchModal";
import WordBankModal from "@/components/WordBankModal";
import type { WordEntry } from "@/lib/wordBank";
import type { ActivityType, CreateActivityPayload } from "@/types/activity";

type FlowStep = "type" | "display" | "theme" | "content" | "preview";

interface OptionRow {
  id: string;
  text: string;
  imageUrl?: string;
  pairText?: string;
  pairImageUrl?: string;
  group?: string;
  isCorrect?: boolean;
}

const ACTIVITY_TYPES: { type: ActivityType; emoji: string; label: string; desc: string }[] = [
  { type: "wheel", emoji: "🎡", label: "Çark", desc: "Rastgele seçim çarkı" },
  { type: "card", emoji: "🃏", label: "Kart Açma", desc: "Kartları çevirerek keşfet" },
  { type: "match", emoji: "🔗", label: "Eşleştirme", desc: "Eşlerini bul ve birleştir" },
  { type: "group-sort", emoji: "📂", label: "Gruplama", desc: "Doğru gruba yerleştir" },
  { type: "quiz", emoji: "❓", label: "Quiz", desc: "Çoktan seçmeli sorular" },
  { type: "missing-word", emoji: "✏️", label: "Boşluk Doldur", desc: "Cümledeki boşluğu tamamla" },
  { type: "memory", emoji: "🧠", label: "Hafıza Oyunu", desc: "Eşlerini bul, kartları çevir" },
  { type: "balloon-pop", emoji: "🎈", label: "Balon Patlatma", desc: "Doğru balonları patlat" },
];

function getFlowSteps(activityType: ActivityType | null): FlowStep[] {
  if (!activityType) return ["type"];
  if (activityType === "card") return ["type", "display", "theme", "content", "preview"];
  if (activityType === "balloon-pop") return ["type", "display", "theme", "content", "preview"];
  return ["type", "theme", "content", "preview"];
}

function stepLabel(step: FlowStep): string {
  switch (step) {
    case "type": return "Tür";
    case "display": return "Görünüm";
    case "theme": return "Tema";
    case "content": return "İçerik";
    case "preview": return "Önizleme";
    default: return "";
  }
}

function stepEmoji(step: FlowStep): string {
  switch (step) {
    case "type": return "🎯";
    case "display": return "👀";
    case "theme": return "🎨";
    case "content": return "✏️";
    case "preview": return "🔍";
    default: return "";
  }
}

export default function CreateActivityPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [currentStep, setCurrentStep] = useState<FlowStep>("type");
  const [activityType, setActivityType] = useState<ActivityType | null>(null);
  const [displayMode, setDisplayMode] = useState<"grid" | "stack" | "pop" | "read" | null>(null);
  const [selectedThemeId, setSelectedThemeId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [showFeedback, setShowFeedback] = useState(true);
  const [options, setOptions] = useState<OptionRow[]>([{ id: uuidv4(), text: "" }]);
  const [groups, setGroups] = useState<string[]>(["Grup 1", "Grup 2"]);
  const [uploadingIds, setUploadingIds] = useState<Set<string>>(new Set());
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [imageSearchTarget, setImageSearchTarget] = useState<{ optionId: string; isPair: boolean } | null>(null);
  const [showWordBank, setShowWordBank] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?redirect=/create");
    }
  }, [authLoading, user, router]);

  const flowSteps = useMemo(() => getFlowSteps(activityType), [activityType]);
  const stepIndex = flowSteps.indexOf(currentStep);
  const totalSteps = flowSteps.length;

  function goBack() {
    if (currentStep === "type") return;
    const idx = stepIndex;
    if (idx <= 0) return;
    setCurrentStep(flowSteps[idx - 1]!);
  }

  function selectType(type: ActivityType) {
    setActivityType(type);
    if (type === "card") {
      setDisplayMode(displayMode ?? null);
      setCurrentStep("display");
    } else if (type === "balloon-pop") {
      setDisplayMode(displayMode ?? null);
      setCurrentStep("display");
    } else {
      setDisplayMode(null);
      setCurrentStep("theme");
    }
    if (type !== activityType) {
      setOptions([{ id: uuidv4(), text: "" }]);
      setTitle("");
    }
  }

  function confirmDisplayMode(mode: "grid" | "stack" | "pop" | "read") {
    setDisplayMode(mode);
    setCurrentStep("theme");
  }

  function goNextFromTheme() {
    if (!selectedThemeId) return;
    setCurrentStep("content");
  }

  // Content validation per type
  const contentValid = useMemo(() => {
    if (!activityType) return false;

    switch (activityType) {
      case "wheel":
      case "card":
      case "memory":
        return options.length > 0 && options.every((o) => o.text.trim() || o.imageUrl);

      case "match":
        return (
          options.length >= 2 &&
          options.every((o) => (o.text.trim() || o.imageUrl) && (o.pairText?.trim() || o.pairImageUrl))
        );

      case "group-sort":
        return (
          groups.length >= 2 &&
          groups.every((g) => g.trim().length > 0) &&
          options.length >= 2 &&
          options.every((o) => (o.text.trim() || o.imageUrl) && o.group)
        );

      case "quiz":
        return (
          options.length >= 2 &&
          options.every((o) => o.text.trim() || o.imageUrl) &&
          options.some((o) => o.isCorrect)
        );

      case "balloon-pop":
        if (displayMode === "read") {
          return (
            options.length >= 2 &&
            options.every((o) => o.text.trim() || o.imageUrl)
          );
        }
        return (
          options.length >= 2 &&
          options.every((o) => o.text.trim() || o.imageUrl) &&
          options.some((o) => o.isCorrect)
        );

      case "missing-word":
        return (
          title.includes("___") &&
          options.length >= 2 &&
          options.every((o) => o.text.trim()) &&
          options.some((o) => o.isCorrect)
        );

      default:
        return false;
    }
  }, [activityType, options, groups, title, displayMode]);

  function goNextFromContent() {
    if (!contentValid) return;
    setCurrentStep("preview");
  }

  function addOption() {
    const newOpt: OptionRow = { id: uuidv4(), text: "" };
    if (activityType === "group-sort" && groups.length > 0) {
      newOpt.group = groups[0];
    }
    setOptions((prev) => [...prev, newOpt]);
  }

  function removeOption(id: string) {
    setOptions((prev) => {
      const next = prev.filter((o) => o.id !== id);
      return next.length === 0 ? [{ id: uuidv4(), text: "" }] : next;
    });
  }

  function updateOption(id: string, updates: Partial<OptionRow>) {
    setOptions((prev) => prev.map((o) => (o.id === id ? { ...o, ...updates } : o)));
  }

  function toggleCorrect(id: string) {
    if (activityType === "quiz" || activityType === "missing-word") {
      // Single correct answer
      setOptions((prev) =>
        prev.map((o) => ({ ...o, isCorrect: o.id === id }))
      );
    } else {
      // Multiple correct (balloon-pop)
      setOptions((prev) =>
        prev.map((o) => (o.id === id ? { ...o, isCorrect: !o.isCorrect } : o))
      );
    }
  }

  function handleWordBankAdd(words: WordEntry[]) {
    const newOptions: OptionRow[] = words.map((w) => ({
      id: uuidv4(),
      text: w.word,
    }));
    setOptions((prev) => {
      // If first option is empty placeholder, replace it
      if (prev.length === 1 && !prev[0].text.trim() && !prev[0].imageUrl) {
        return newOptions;
      }
      return [...prev, ...newOptions];
    });
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
      alert(e instanceof Error ? e.message : "Görsel yüklenirken bir hata oluştu.");
    } finally {
      setUploadingIds((s) => {
        const next = new Set(s);
        next.delete(uploadKey);
        return next;
      });
    }
  }

  async function handleSave() {
    if (!activityType || !selectedThemeId) return;
    if (activityType === "card" && !displayMode) return;
    if (activityType === "balloon-pop" && !displayMode) return;

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

    const body: CreateActivityPayload = {
      title: title.trim() || "Adsız etkinlik",
      type: activityType,
      display_mode: (activityType === "card" || activityType === "balloon-pop") ? displayMode : null,
      theme: selectedThemeId,
      category: category.trim() || null,
      show_feedback: showFeedback,
      options: payloadOptions,
    };

    setSaveError(null);
    setIsSaving(true);
    try {
      const res = await authFetch("/api/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as { id?: string; error?: string };
      if (!res.ok) throw new Error(data.error || "Kayıt başarısız");
      if (!data.id) throw new Error("Etkinlik kimliği alınamadı");
      router.push(`/play/${data.id}`);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Kaydedilirken bir hata oluştu.");
    } finally {
      setIsSaving(false);
    }
  }

  const selectedTheme = themes.find((t) => t.id === selectedThemeId);

  // Helper: get type label info
  const typeInfo = ACTIVITY_TYPES.find((t) => t.type === activityType);

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-[#FFF8F0] via-[#FFF3E4] to-[#E8F4FD]" />
        <div className="deco-blob-1 left-[-15%] top-[5%] bg-[#FFD93D]" />
        <div className="deco-blob-2 bottom-[0%] right-[-10%] bg-[#FF6B9D]" />
        <div className="absolute inset-0 bg-dots-pattern" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-xl flex-col px-4 pb-32 pt-6 sm:px-6 sm:pb-28 sm:pt-8">
        {/* Header */}
        <header className="animate-fade-in mb-8 flex shrink-0 items-center gap-4">
          {currentStep === "type" ? (
            <Link
              href="/dashboard"
              className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-lg text-[#8B7BAD] shadow-md transition hover:scale-105 hover:shadow-lg"
              style={{ border: "2px solid rgba(45, 27, 105, 0.08)" }}
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
          ) : (
            <button
              type="button"
              onClick={goBack}
              className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-lg text-[#8B7BAD] shadow-md transition hover:scale-105 hover:shadow-lg"
              style={{ border: "2px solid rgba(45, 27, 105, 0.08)" }}
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="font-heading text-xl font-bold tracking-tight text-[#2D1B69] sm:text-2xl">
              Yeni Etkinlik ✨
            </h1>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-sm font-bold text-[#8B7BAD] shadow-sm" style={{ border: "2px solid rgba(45, 27, 105, 0.06)" }}>
            {stepIndex + 1}/{totalSteps}
          </div>
        </header>

        {/* Progress Bar */}
        <div className="animate-fade-in mb-10 sm:mb-12">
          <div className="flex gap-2">
            {flowSteps.map((s, i) => (
              <div key={s + i} className="flex-1" title={stepLabel(s)}>
                <div
                  className="h-2 rounded-full transition-all duration-500"
                  style={{
                    background: i <= stepIndex
                      ? "linear-gradient(135deg, #FF6B9D, #FF8A50)"
                      : "rgba(45, 27, 105, 0.08)",
                  }}
                />
                <div className="mt-2 flex items-center justify-center gap-1">
                  <span className="text-xs">{stepEmoji(s)}</span>
                  <p className={`text-center text-[11px] font-bold transition-colors ${i === stepIndex ? "text-[#FF6B9D]" : "text-[#C5B8DB]"}`}>
                    {stepLabel(s)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Steps */}
        <main className="flex-1">
          {/* Step: Type */}
          {currentStep === "type" && (
            <section className="animate-slide-up space-y-6" aria-labelledby="step-type-heading">
              <h2 id="step-type-heading" className="sr-only">Etkinlik türü seçin</h2>
              <div className="text-center">
                <h3 className="font-heading text-2xl font-bold text-[#2D1B69] sm:text-3xl">
                  Ne oluşturmak istersiniz?
                </h3>
                <p className="mt-2 text-sm font-semibold text-[#8B7BAD]">Bir etkinlik türü seçin</p>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2">
                {ACTIVITY_TYPES.map((at) => (
                  <button
                    key={at.type}
                    type="button"
                    onClick={() => selectType(at.type)}
                    className="card-playful group flex flex-col items-center justify-center gap-3 p-5 py-8 text-center"
                  >
                    <div
                      className="flex h-20 w-20 items-center justify-center rounded-3xl text-5xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6"
                      style={{ background: "linear-gradient(135deg, #FFF3E4, #FFE8D6)" }}
                    >
                      {at.emoji}
                    </div>
                    <div>
                      <span className="font-heading text-lg font-bold text-[#2D1B69]">{at.label}</span>
                      <p className="mt-0.5 text-[11px] font-semibold text-[#8B7BAD]">{at.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Step: Display (card / balloon-pop) */}
          {currentStep === "display" && (
            <section className="animate-slide-up space-y-6" aria-labelledby="step-display-heading">
              <h2 id="step-display-heading" className="sr-only">Görünüm modu</h2>
              <div className="text-center">
                <h3 className="font-heading text-2xl font-bold text-[#2D1B69] sm:text-3xl">
                  {activityType === "balloon-pop" ? "Balon modu seçin" : "Kartlar nasıl görünsün?"}
                </h3>
                <p className="mt-2 text-sm font-semibold text-[#8B7BAD]">Bir görünüm modu seçin</p>
              </div>
              <div className="grid grid-cols-2 gap-5 pt-2">
                {activityType === "balloon-pop" ? (
                  <>
                    <button
                      type="button"
                      onClick={() => confirmDisplayMode("pop")}
                      className="card-playful group flex flex-col items-center justify-center gap-4 p-6 py-10 text-center"
                    >
                      <div className="flex h-24 w-24 items-center justify-center rounded-3xl text-5xl transition-transform duration-300 group-hover:scale-110"
                        style={{ background: "linear-gradient(135deg, #FFE0EC, #FFD0E0)" }}
                      >
                        🎯
                      </div>
                      <div>
                        <span className="font-heading text-xl font-bold text-[#2D1B69]">Balon Patlat</span>
                        <p className="mt-1 text-xs font-semibold text-[#8B7BAD]">Doğru balonları patlat</p>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => confirmDisplayMode("read")}
                      className="card-playful group flex flex-col items-center justify-center gap-4 p-6 py-10 text-center"
                    >
                      <div className="flex h-24 w-24 items-center justify-center rounded-3xl text-5xl transition-transform duration-300 group-hover:scale-110"
                        style={{ background: "linear-gradient(135deg, #E0EEFF, #D0E0FF)" }}
                      >
                        📖
                      </div>
                      <div>
                        <span className="font-heading text-xl font-bold text-[#2D1B69]">Balon Oku</span>
                        <p className="mt-1 text-xs font-semibold text-[#8B7BAD]">Balonlara tıkla ve oku</p>
                      </div>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => confirmDisplayMode("grid")}
                      className="card-playful group flex flex-col items-center justify-center gap-4 p-6 py-10 text-center"
                    >
                      <div className="flex h-24 w-24 items-center justify-center rounded-3xl transition-transform duration-300 group-hover:scale-110"
                        style={{ background: "linear-gradient(135deg, #E8FFF0, #D6FFE0)" }}
                      >
                        <div className="grid grid-cols-3 gap-1.5">
                          {Array.from({ length: 9 }).map((_, i) => (
                            <div key={i} className="h-4 w-4 rounded-md bg-[#6BCB77]/60" />
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="font-heading text-xl font-bold text-[#2D1B69]">Izgara</span>
                        <p className="mt-1 text-xs font-semibold text-[#8B7BAD]">3x3 ızgara düzeni</p>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => confirmDisplayMode("stack")}
                      className="card-playful group flex flex-col items-center justify-center gap-4 p-6 py-10 text-center"
                    >
                      <div className="flex h-24 w-24 items-center justify-center rounded-3xl transition-transform duration-300 group-hover:scale-110"
                        style={{ background: "linear-gradient(135deg, #F3E8FF, #E6D6FF)" }}
                      >
                        <div className="flex flex-col items-center gap-0.5">
                          <div className="h-8 w-12 rounded-lg border-2 border-[#9B59B6]/50 bg-[#9B59B6]/20" />
                          <div className="h-8 w-12 -translate-y-4 rounded-lg border-2 border-[#9B59B6]/70 bg-[#9B59B6]/30" />
                        </div>
                      </div>
                      <div>
                        <span className="font-heading text-xl font-bold text-[#2D1B69]">Sıralı</span>
                        <p className="mt-1 text-xs font-semibold text-[#8B7BAD]">Kartlar sırayla açılır</p>
                      </div>
                    </button>
                  </>
                )}
              </div>
            </section>
          )}

          {/* Step: Theme */}
          {currentStep === "theme" && (
            <section className="animate-slide-up space-y-6" aria-labelledby="step-theme-heading">
              <h2 id="step-theme-heading" className="sr-only">Tema seçin</h2>
              <div className="text-center">
                <h3 className="font-heading text-2xl font-bold text-[#2D1B69] sm:text-3xl">
                  Bir tema seçin 🎨
                </h3>
                <p className="mt-2 text-sm font-semibold text-[#8B7BAD]">Renkler ve görseller buna göre ayarlanır</p>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2 sm:grid-cols-3">
                {themes.map((theme) => {
                  const selected = selectedThemeId === theme.id;
                  return (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => setSelectedThemeId(theme.id)}
                      className={`flex flex-col overflow-hidden rounded-2xl text-left shadow-sm transition-all duration-200 active:scale-[0.97] ${
                        selected ? "ring-4 ring-[#FF6B9D]/40 shadow-lg scale-[1.02]" : "hover:shadow-md hover:scale-[1.01]"
                      }`}
                      style={{
                        border: selected ? "2px solid #FF6B9D" : "2px solid rgba(45, 27, 105, 0.06)",
                        background: "white",
                      }}
                    >
                      <div className="flex items-center gap-2.5 px-3.5 py-3.5 sm:px-4" style={{ backgroundColor: theme.backgroundColor }}>
                        <span className="text-2xl" aria-hidden>{theme.emoji}</span>
                        <span className="min-w-0 flex-1 truncate text-sm font-bold text-[#2D1B69]">{theme.name}</span>
                        {selected && (
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#FF6B9D] text-xs text-white">✓</span>
                        )}
                      </div>
                      <div className="flex h-2.5 w-full" role="presentation">
                        {theme.cardColors.slice(0, 5).map((c, i) => (
                          <div key={i} className="min-w-0 flex-1" style={{ backgroundColor: c }} />
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
                className="btn-candy mt-4 flex min-h-[56px] w-full items-center justify-center text-lg"
              >
                Devam →
              </button>
            </section>
          )}

          {/* Step: Content */}
          {currentStep === "content" && (
            <section className="animate-slide-up space-y-6" aria-labelledby="step-content-heading">
              <h2 id="step-content-heading" className="sr-only">İçerik ekle</h2>
              <div className="text-center">
                <h3 className="font-heading text-2xl font-bold text-[#2D1B69] sm:text-3xl">
                  İçeriği hazırlayın ✏️
                </h3>
                <p className="mt-2 text-sm font-semibold text-[#8B7BAD]">
                  {activityType === "match" && "Eşleştirilecek çiftleri ekleyin"}
                  {activityType === "group-sort" && "Grupları ve öğelerini belirleyin"}
                  {activityType === "quiz" && "Soruyu ve cevap seçeneklerini ekleyin"}
                  {activityType === "missing-word" && "Cümleyi ve kelime seçeneklerini girin"}
                  {activityType === "balloon-pop" && displayMode === "read" && "Balonlara eklenecek seçenekleri girin"}
                  {activityType === "balloon-pop" && displayMode !== "read" && "Soruyu ve balonları oluşturun"}
                  {activityType === "memory" && "Eşleştirilecek kartları ekleyin"}
                  {(activityType === "wheel" || activityType === "card") && "Etkinliğe ad verin ve seçenekleri ekleyin"}
                </p>
              </div>

              {/* Title Input */}
              {!(activityType === "balloon-pop" && displayMode === "read") && (
              <div className="card-playful p-5">
                <label htmlFor="activity-title" className="mb-2 flex items-center gap-2 text-sm font-bold text-[#2D1B69]">
                  <span>📝</span>
                  {activityType === "quiz" || activityType === "balloon-pop"
                    ? "Soru"
                    : activityType === "missing-word"
                      ? "Cümle (___ ile boşluk belirtin)"
                      : "Etkinlik adı"}
                </label>
                <input
                  id="activity-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={
                    activityType === "quiz"
                      ? "Örn. Türkiye'nin başkenti neresidir?"
                      : activityType === "missing-word"
                        ? "Örn. Kedi ___ içer."
                        : activityType === "balloon-pop"
                          ? "Örn. Hangileri meyve?"
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
              )}

              {/* Category */}
              <div className="card-playful p-5">
                <label htmlFor="activity-category" className="mb-2 flex items-center gap-2 text-sm font-bold text-[#2D1B69]">
                  <span>📁</span> Kategori <span className="text-xs font-medium text-[#8B7BAD]">(isteğe bağlı)</span>
                </label>
                <input
                  id="activity-category"
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Örn. Artikülasyon, Kelime Hazinesi, 1. Sınıf"
                  className="input-playful"
                />
              </div>

              {/* Show Feedback Toggle */}
              {activityType && ["quiz", "missing-word", "balloon-pop", "match", "group-sort"].includes(activityType) && !(activityType === "balloon-pop" && displayMode === "read") && (
                <div className="card-playful flex items-center justify-between p-5">
                  <div>
                    <div className="flex items-center gap-2 text-sm font-bold text-[#2D1B69]">
                      <span>💬</span> Doğru/Yanlış Geri Bildirimi
                    </div>
                    <p className="mt-1 text-xs font-medium text-[#8B7BAD]">
                      Kapalıyken çocuk cevabının doğru mu yanlış mı olduğunu görmez
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowFeedback(!showFeedback)}
                    className={`relative h-7 w-12 shrink-0 rounded-full transition-colors duration-200 ${
                      showFeedback ? "bg-emerald-400" : "bg-gray-300"
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-md transition-transform duration-200 ${
                        showFeedback ? "translate-x-5" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>
              )}

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
                            // Update options that referenced the old name
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

              {/* Word Bank Button — for simple list types */}
              {activityType && ["wheel", "card", "memory", "balloon-pop"].includes(activityType) && (
                <button
                  type="button"
                  onClick={() => setShowWordBank(true)}
                  className="card-playful flex w-full items-center gap-4 p-4 text-left transition hover:shadow-lg active:scale-[0.98]"
                >
                  <div
                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-2xl"
                    style={{ background: "linear-gradient(135deg, #E8F4FD, #D6ECFF)" }}
                  >
                    🗣️
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="font-heading text-sm font-bold text-[#2D1B69]">Kelime Bankası</span>
                    <p className="mt-0.5 text-xs font-semibold text-[#8B7BAD]">
                      Hedef sese göre hazır kelimeler ekle
                    </p>
                  </div>
                  <svg className="h-5 w-5 shrink-0 text-[#C5B8DB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}

              {/* Options List */}
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
                        {/* Correct toggle for quiz/missing-word/balloon-pop */}
                        {(activityType === "quiz" || activityType === "missing-word" || (activityType === "balloon-pop" && displayMode !== "read")) && (
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
                          aria-label="Seçeneği kaldır"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Text input */}
                    <input
                      type="text"
                      value={opt.text}
                      onChange={(e) => updateOption(opt.id, { text: e.target.value })}
                      placeholder={activityType === "match" ? "Sol taraf (öğe)" : "Yazı ekle..."}
                      className="input-playful mb-3"
                    />

                    {/* Pair text input (match only) */}
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

                    {/* Group selector (group-sort only) */}
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

                    {/* Image upload + search */}
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
                            {uploadingIds.has(opt.id) ? "Yükleniyor..." : "Yükle"}
                          </span>
                        </label>
                        <button
                          type="button"
                          onClick={() => setImageSearchTarget({ optionId: opt.id, isPair: false })}
                          className="inline-flex items-center gap-1.5 rounded-xl border-2 border-[#E8E0F5] bg-[#F8F5FF] px-3 py-2 text-xs font-bold text-[#8B7BAD] transition hover:border-[#D0C0F0] hover:bg-[#F0EAFF]"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                          Görsel Ara
                        </button>
                        {opt.imageUrl && (
                          <div className="h-14 w-18 overflow-hidden rounded-xl border-2 border-[#E8E0F5]">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={opt.imageUrl} alt="Önizleme" className="h-full w-full object-contain" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Pair image upload + search (match only) */}
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
                              {uploadingIds.has(`pair-${opt.id}`) ? "Yükleniyor..." : "Eş yükle"}
                            </span>
                          </label>
                          <button
                            type="button"
                            onClick={() => setImageSearchTarget({ optionId: opt.id, isPair: true })}
                            className="inline-flex items-center gap-1.5 rounded-xl border-2 border-[#D0C0F0] bg-[#F0EAFF] px-3 py-2 text-xs font-bold text-[#8B7BAD] transition hover:border-[#B8A0E0]"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            Eş Görsel Ara
                          </button>
                          {opt.pairImageUrl && (
                            <div className="h-14 w-18 overflow-hidden rounded-xl border-2 border-[#D0C0F0]">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={opt.pairImageUrl} alt="Eş önizleme" className="h-full w-full object-contain" />
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Validation warning */}
                    {opt.text.trim().length === 0 && !opt.imageUrl && (
                      <p className="mt-2 flex items-center gap-1 text-xs font-semibold text-amber-500">
                        <span>⚠️</span> Yazı veya görsel ekleyin
                      </p>
                    )}
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={addOption}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#D0C0F0] bg-[#F8F5FF]/50 py-4 text-sm font-bold text-[#8B7BAD] transition hover:border-[#FF6B9D] hover:bg-[#FFF5F8] hover:text-[#FF6B9D]"
              >
                <span className="text-lg">+</span>
                {activityType === "match" ? "Çift ekle" : "Seçenek ekle"}
              </button>

              {/* Validation messages */}
              {!contentValid && options.length > 0 && (
                <div className="rounded-2xl border-2 border-amber-200 bg-amber-50 px-4 py-3 text-center text-xs font-bold text-amber-600">
                  ⚠️{" "}
                  {(activityType === "quiz" || activityType === "missing-word" || (activityType === "balloon-pop" && displayMode !== "read")) &&
                    !options.some((o) => o.isCorrect) &&
                    "En az bir doğru cevap işaretleyin. "}
                  {activityType === "missing-word" && !title.includes("___") &&
                    "Cümleye ___ ile boşluk ekleyin. "}
                  {activityType === "match" && options.some((o) => !o.pairText?.trim() && !o.pairImageUrl) &&
                    "Her çiftin sağ tarafını doldurun. "}
                  {activityType === "group-sort" && options.some((o) => !o.group) &&
                    "Her öğe için bir grup seçin. "}
                  {options.some((o) => !o.text.trim() && !o.imageUrl) &&
                    "Tüm seçeneklerde yazı veya görsel olmalı."}
                </div>
              )}

              <button
                type="button"
                disabled={!contentValid}
                onClick={goNextFromContent}
                className="btn-candy flex min-h-[56px] w-full items-center justify-center text-lg"
              >
                Önizleme 🔍
              </button>
            </section>
          )}

          {/* Step: Preview */}
          {currentStep === "preview" && (
            <section className="animate-slide-up space-y-6" aria-labelledby="step-preview-heading">
              <h2 id="step-preview-heading" className="sr-only">Önizleme ve kaydet</h2>
              <div className="text-center">
                <div className="animate-bounce-in mb-2 text-4xl">🎉</div>
                <h3 className="font-heading text-2xl font-bold text-[#2D1B69] sm:text-3xl">
                  Her şey hazır!
                </h3>
                <p className="mt-2 text-sm font-semibold text-[#8B7BAD]">Kontrol edin ve kaydedin</p>
              </div>

              <div className="card-playful overflow-hidden">
                <div className="divide-y-3 divide-[#F5F0FF]">
                  {!(activityType === "balloon-pop" && displayMode === "read") && (
                  <div className="flex items-center justify-between px-5 py-4">
                    <span className="text-sm font-semibold text-[#8B7BAD]">📝 {activityType === "quiz" || activityType === "balloon-pop" ? "Soru" : activityType === "missing-word" ? "Cümle" : "Etkinlik adı"}</span>
                    <span className="font-heading text-sm font-bold text-[#2D1B69]">
                      {title.trim() || "Adsız etkinlik"}
                    </span>
                  </div>
                  )}
                  <div className="flex items-center justify-between px-5 py-4">
                    <span className="text-sm font-semibold text-[#8B7BAD]">🎯 Tür</span>
                    <span className="font-heading text-sm font-bold text-[#2D1B69]">
                      {typeInfo ? `${typeInfo.emoji} ${typeInfo.label}` : "?"}
                    </span>
                  </div>
                  {(activityType === "card" || activityType === "balloon-pop") && displayMode && (
                    <div className="flex items-center justify-between px-5 py-4">
                      <span className="text-sm font-semibold text-[#8B7BAD]">👀 Görünüm</span>
                      <span className="font-heading text-sm font-bold text-[#2D1B69]">
                        {displayMode === "grid" ? "Izgara (3x3)" : displayMode === "stack" ? "Sıralı" : displayMode === "pop" ? "Balon Patlat" : "Balon Oku"}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between px-5 py-4">
                    <span className="text-sm font-semibold text-[#8B7BAD]">🎨 Tema</span>
                    <span className="flex items-center gap-2 font-heading text-sm font-bold text-[#2D1B69]">
                      {selectedTheme && (
                        <>{selectedTheme.emoji} {selectedTheme.name}</>
                      )}
                    </span>
                  </div>
                  <div className="px-5 py-4">
                    <span className="text-sm font-semibold text-[#8B7BAD]">
                      🎯 {activityType === "match" ? "Çiftler" : "Seçenekler"} ({options.filter((o) => o.text.trim() || o.imageUrl).length})
                    </span>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {options
                        .filter((o) => o.text.trim() || o.imageUrl)
                        .map((o) => (
                          <span
                            key={o.id}
                            className="inline-flex items-center rounded-xl bg-gradient-to-r from-[#FFF5F8] to-[#F8F5FF] px-3 py-1.5 text-xs font-bold text-[#2D1B69]"
                            style={{ border: "2px solid rgba(45, 27, 105, 0.06)" }}
                          >
                            {o.isCorrect && <span className="mr-1 text-emerald-500">✅</span>}
                            {o.text.trim() || "Görsel"}
                            {o.imageUrl && <span className="ml-1 text-[#8B7BAD]">📷</span>}
                            {activityType === "match" && o.pairText && (
                              <span className="ml-1 text-[#8B7BAD]">→ {o.pairText}</span>
                            )}
                            {activityType === "group-sort" && o.group && (
                              <span className="ml-1 text-[#8B7BAD]">[{o.group}]</span>
                            )}
                          </span>
                        ))}
                    </div>
                  </div>
                </div>
              </div>

              {saveError && (
                <div className="rounded-2xl border-2 border-red-200 bg-red-50 px-4 py-3 text-center text-sm font-bold text-red-600" role="alert">
                  {saveError}
                </div>
              )}

              <button
                type="button"
                disabled={isSaving}
                onClick={() => void handleSave()}
                className="btn-candy btn-green flex min-h-[56px] w-full items-center justify-center gap-2 text-lg"
              >
                {isSaving ? (
                  <>
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Kaydediliyor...
                  </>
                ) : (
                  "Kaydet ve Oyna 🚀"
                )}
              </button>
            </section>
          )}
        </main>
      </div>

      {/* Pexels image search modal */}
      <ImageSearchModal
        open={imageSearchTarget !== null}
        onClose={() => setImageSearchTarget(null)}
        onSelect={(url) => {
          if (imageSearchTarget) {
            if (imageSearchTarget.isPair) {
              updateOption(imageSearchTarget.optionId, { pairImageUrl: url });
            } else {
              updateOption(imageSearchTarget.optionId, { imageUrl: url });
            }
          }
        }}
      />

      {showWordBank && (
        <WordBankModal
          onAddWords={handleWordBankAdd}
          onClose={() => setShowWordBank(false)}
        />
      )}
    </div>
  );
}
