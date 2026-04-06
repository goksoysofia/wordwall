"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { themes } from "@/lib/themes";
import { authFetch } from "@/lib/auth-fetch";
import {
  TARGET_SOUNDS,
  WORD_BANK,
  POSITION_LABELS,
  getWords,
  getWordCounts,
  type SoundPosition,
  type WordEntry,
} from "@/lib/wordBank";
import type { ActivityType } from "@/types/activity";

type Step = "sounds" | "words" | "create";

const ACTIVITY_TYPES: { type: ActivityType; emoji: string; label: string; desc: string }[] = [
  { type: "wheel", emoji: "🎡", label: "Çark", desc: "Rastgele seçim çarkı" },
  { type: "card", emoji: "🃏", label: "Kart Açma", desc: "Kartları çevirerek keşfet" },
  { type: "memory", emoji: "🧠", label: "Hafıza Oyunu", desc: "Eşlerini bul" },
  { type: "balloon-pop", emoji: "🎈", label: "Balon Patlatma", desc: "Doğru balonları patlat" },
  { type: "quiz", emoji: "❓", label: "Quiz", desc: "Çoktan seçmeli" },
  { type: "match", emoji: "🔗", label: "Eşleştirme", desc: "Eşlerini bul" },
];

const soundGroups = [
  { label: "Erken Sesler", age: "2-3 yaş", sounds: ["p", "b", "m", "t", "d", "n", "y"] },
  { label: "Orta Sesler", age: "3-4 yaş", sounds: ["k", "g", "f", "v", "h"] },
  { label: "Geç Sesler", age: "4-5 yaş", sounds: ["l", "r", "s", "z", "ş", "ç", "c", "j"] },
];

interface WordBankCreateModalProps {
  onClose: () => void;
}

export default function WordBankCreateModal({ onClose }: WordBankCreateModalProps) {
  const router = useRouter();

  // Step 1: Sound selection
  const [step, setStep] = useState<Step>("sounds");
  const [selectedSound, setSelectedSound] = useState<string | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<SoundPosition | null>(null);
  const [selectedWords, setSelectedWords] = useState<Set<string>>(new Set());

  // Step 2: Activity creation
  const [activityType, setActivityType] = useState<ActivityType | null>(null);
  const [selectedThemeId, setSelectedThemeId] = useState<string>("fruits");
  const [title, setTitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const words = useMemo(() => {
    if (!selectedSound) return [];
    return getWords(selectedSound, selectedPosition ?? undefined);
  }, [selectedSound, selectedPosition]);

  const counts = useMemo(() => {
    if (!selectedSound) return null;
    return getWordCounts(selectedSound);
  }, [selectedSound]);

  const totalForSound = counts ? counts.basta + counts.ortada + counts.sonda : 0;

  // The chosen word entries (for building options)
  const chosenWordEntries = useMemo(() => {
    if (!selectedSound) return [];
    const all = getWords(selectedSound);
    return all.filter((w) => selectedWords.has(w.word));
  }, [selectedSound, selectedWords]);

  function toggleWord(word: string) {
    setSelectedWords((prev) => {
      const next = new Set(prev);
      if (next.has(word)) next.delete(word);
      else next.add(word);
      return next;
    });
  }

  function selectAll() {
    setSelectedWords(new Set(words.map((w) => w.word)));
  }

  function deselectAll() {
    setSelectedWords(new Set());
  }

  function goToCreate() {
    if (selectedWords.size === 0) return;
    // Auto-generate title
    const soundLabel = WORD_BANK[selectedSound!]?.label ?? `/${selectedSound}/`;
    const posLabel = selectedPosition ? POSITION_LABELS[selectedPosition] : "";
    setTitle(`${soundLabel}${posLabel ? ` — ${posLabel}` : ""}`);
    setStep("create");
  }

  async function handleCreate() {
    if (!activityType || chosenWordEntries.length === 0) return;

    const options = chosenWordEntries.map((w) => ({
      id: uuidv4(),
      text: w.word,
    }));

    const body = {
      title: title.trim() || "Artikülasyon Etkinliği",
      type: activityType,
      display_mode: activityType === "card" ? "grid" : null,
      theme: selectedThemeId,
      category: "Artikülasyon",
      show_feedback: true,
      options,
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        {/* Header */}
        <div className="shrink-0 border-b border-[#F0EAFF] px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="flex h-11 w-11 items-center justify-center rounded-2xl text-xl"
                style={{ background: "linear-gradient(135deg, #E8F4FD, #D6ECFF)" }}
              >
                🗣️
              </div>
              <div>
                <h2 className="font-heading text-lg font-bold text-[#2D1B69]">
                  Kelime Bankası
                </h2>
                <p className="text-[11px] font-semibold text-[#8B7BAD]">
                  {step === "sounds" && "Hedef ses seçin"}
                  {step === "words" && `/${selectedSound}/ sesi — kelime seçin`}
                  {step === "create" && `${selectedWords.size} kelime — etkinlik oluştur`}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-2xl text-[#8B7BAD] transition hover:bg-[#F8F5FF]"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Step indicator */}
          <div className="mt-4 flex gap-2">
            {(["sounds", "words", "create"] as Step[]).map((s, i) => (
              <div key={s} className="flex-1">
                <div
                  className="h-1.5 rounded-full transition-all duration-300"
                  style={{
                    background:
                      (s === "sounds" && step !== "sounds") ||
                      (s === "words" && step === "create") ||
                      s === step
                        ? "linear-gradient(135deg, #FF6B9D, #FF8A50)"
                        : "rgba(45, 27, 105, 0.08)",
                  }}
                />
                <p className={`mt-1 text-center text-[10px] font-bold ${s === step ? "text-[#FF6B9D]" : "text-[#C5B8DB]"}`}>
                  {i === 0 ? "Ses" : i === 1 ? "Kelimeler" : "Oluştur"}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* ── STEP 1: Sound Selection ── */}
          {step === "sounds" && (
            <div className="space-y-5">
              {soundGroups.map((group) => (
                <div key={group.label}>
                  <h3 className="mb-2.5 flex items-center gap-2 text-sm font-bold text-[#2D1B69]">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-lg bg-gradient-to-br from-[#FFD93D] to-[#FF8A50] text-[10px] font-bold text-white">
                      {group.label === "Erken Sesler" ? "1" : group.label === "Orta Sesler" ? "2" : "3"}
                    </span>
                    {group.label}
                    <span className="text-xs font-medium text-[#C5B8DB]">({group.age})</span>
                  </h3>
                  <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
                    {group.sounds
                      .filter((s) => WORD_BANK[s])
                      .map((s) => {
                        const data = WORD_BANK[s]!;
                        const total =
                          data.positions.basta.length +
                          data.positions.ortada.length +
                          data.positions.sonda.length;
                        return (
                          <button
                            key={s}
                            type="button"
                            onClick={() => {
                              setSelectedSound(s);
                              setSelectedPosition(null);
                              setSelectedWords(new Set());
                              setStep("words");
                            }}
                            className="group flex flex-col items-center gap-1 rounded-2xl border-2 border-[#E8E0F5] bg-white p-3 transition hover:border-[#FF6B9D] hover:shadow-md active:scale-95"
                          >
                            <span className="font-heading text-2xl font-bold text-[#2D1B69] transition group-hover:text-[#FF6B9D]">
                              /{s}/
                            </span>
                            <span className="text-[10px] font-bold text-[#C5B8DB]">{total} kelime</span>
                          </button>
                        );
                      })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── STEP 2: Word Selection ── */}
          {step === "words" && selectedSound && (
            <div className="space-y-4">
              {/* Back to sounds */}
              <button
                type="button"
                onClick={() => setStep("sounds")}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#F8F5FF] px-3 py-1.5 text-xs font-bold text-[#8B7BAD] transition hover:bg-[#F0EAFF]"
              >
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
                </svg>
                Tüm sesler
              </button>

              {/* Sound heading */}
              <div className="text-center">
                <span className="font-heading text-3xl font-bold text-[#FF6B9D]">/{selectedSound}/</span>
                <p className="mt-1 text-xs font-semibold text-[#8B7BAD]">
                  {WORD_BANK[selectedSound]?.label} — {totalForSound} kelime
                </p>
              </div>

              {/* Position filter */}
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedPosition(null)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                    !selectedPosition
                      ? "bg-[#FF6B9D] text-white shadow-sm"
                      : "bg-[#F8F5FF] text-[#8B7BAD] hover:bg-[#F0EAFF]"
                  }`}
                >
                  Tümü ({totalForSound})
                </button>
                {(Object.keys(POSITION_LABELS) as SoundPosition[]).map((pos) => (
                  <button
                    key={pos}
                    type="button"
                    onClick={() => setSelectedPosition(pos)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                      selectedPosition === pos
                        ? "bg-[#FF6B9D] text-white shadow-sm"
                        : "bg-[#F8F5FF] text-[#8B7BAD] hover:bg-[#F0EAFF]"
                    }`}
                  >
                    {POSITION_LABELS[pos]} ({counts?.[pos] ?? 0})
                  </button>
                ))}
              </div>

              {/* Select controls */}
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-[#8B7BAD]">
                  {selectedWords.size} kelime secildi
                </p>
                <div className="flex gap-2">
                  <button type="button" onClick={selectAll} className="text-xs font-bold text-[#8B7BAD] transition hover:text-[#FF6B9D]">
                    Tümünü seç
                  </button>
                  {selectedWords.size > 0 && (
                    <button type="button" onClick={deselectAll} className="text-xs font-bold text-[#C5B8DB] transition hover:text-red-400">
                      Temizle
                    </button>
                  )}
                </div>
              </div>

              {/* Word grid */}
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {words.map((w) => {
                  const isSelected = selectedWords.has(w.word);
                  const soundIdx = w.word.toLowerCase().indexOf(selectedSound!);
                  return (
                    <button
                      key={w.word}
                      type="button"
                      onClick={() => toggleWord(w.word)}
                      className={`flex items-center gap-2 rounded-2xl border-2 px-3 py-2.5 text-left transition active:scale-95 ${
                        isSelected
                          ? "border-[#FF6B9D] bg-[#FFF5F8] shadow-sm"
                          : "border-[#E8E0F5] bg-white hover:border-[#D0C0F0] hover:bg-[#F8F5FF]"
                      }`}
                    >
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs transition ${
                          isSelected ? "bg-[#FF6B9D] font-bold text-white" : "bg-[#F0EAFF] text-[#8B7BAD]"
                        }`}
                      >
                        {isSelected ? "✓" : ""}
                      </span>
                      <span className="min-w-0 truncate text-sm font-bold text-[#2D1B69]">
                        {soundIdx >= 0 ? (
                          <>
                            {w.word.slice(0, soundIdx)}
                            <span className="text-[#FF6B9D]">
                              {w.word.slice(soundIdx, soundIdx + selectedSound!.length)}
                            </span>
                            {w.word.slice(soundIdx + selectedSound!.length)}
                          </>
                        ) : (
                          w.word
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── STEP 3: Create Activity ── */}
          {step === "create" && (
            <div className="space-y-5">
              {/* Back to words */}
              <button
                type="button"
                onClick={() => setStep("words")}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#F8F5FF] px-3 py-1.5 text-xs font-bold text-[#8B7BAD] transition hover:bg-[#F0EAFF]"
              >
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
                </svg>
                Kelimelere dön
              </button>

              {/* Selected words preview */}
              <div className="rounded-2xl border-2 border-[#E8E0F5] bg-[#F8F5FF] p-4">
                <p className="mb-2 text-xs font-bold text-[#8B7BAD]">
                  Secilen kelimeler ({chosenWordEntries.length})
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {chosenWordEntries.map((w) => (
                    <span
                      key={w.word}
                      className="inline-flex items-center rounded-lg bg-white px-2.5 py-1 text-xs font-bold text-[#2D1B69] shadow-sm"
                      style={{ border: "1px solid rgba(45,27,105,0.08)" }}
                    >
                      {w.word}
                    </span>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="mb-1.5 block text-sm font-bold text-[#2D1B69]">Etkinlik Adı</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Örn. /r/ sesi başta"
                  className="input-playful"
                />
              </div>

              {/* Activity Type */}
              <div>
                <label className="mb-2 block text-sm font-bold text-[#2D1B69]">Etkinlik Türü</label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {ACTIVITY_TYPES.map((at) => (
                    <button
                      key={at.type}
                      type="button"
                      onClick={() => setActivityType(at.type)}
                      className={`flex flex-col items-center gap-1.5 rounded-2xl border-2 p-3 transition active:scale-95 ${
                        activityType === at.type
                          ? "border-[#FF6B9D] bg-[#FFF5F8] shadow-sm"
                          : "border-[#E8E0F5] bg-white hover:border-[#D0C0F0] hover:bg-[#F8F5FF]"
                      }`}
                    >
                      <span className="text-2xl">{at.emoji}</span>
                      <span className="text-xs font-bold text-[#2D1B69]">{at.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Theme */}
              <div>
                <label className="mb-2 block text-sm font-bold text-[#2D1B69]">Tema</label>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {themes.map((theme) => {
                    const selected = selectedThemeId === theme.id;
                    return (
                      <button
                        key={theme.id}
                        type="button"
                        onClick={() => setSelectedThemeId(theme.id)}
                        className={`flex flex-col items-center gap-1 overflow-hidden rounded-xl p-2 transition active:scale-95 ${
                          selected
                            ? "ring-2 ring-[#FF6B9D] shadow-md"
                            : "border-2 border-[#E8E0F5] hover:border-[#D0C0F0]"
                        }`}
                        style={{ backgroundColor: selected ? theme.backgroundColor : "white" }}
                      >
                        <span className="text-xl">{theme.emoji}</span>
                        <span className="text-[10px] font-bold text-[#2D1B69]">{theme.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Error */}
              {saveError && (
                <div className="rounded-xl bg-red-50 px-4 py-3 text-center text-xs font-bold text-red-500">
                  {saveError}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-[#F0EAFF] px-6 py-4">
          {step === "words" && selectedWords.size > 0 && (
            <button
              type="button"
              onClick={goToCreate}
              className="btn-candy flex w-full min-h-[48px] items-center justify-center gap-2 text-base"
            >
              {selectedWords.size} kelime ile etkinlik oluştur
            </button>
          )}

          {step === "create" && (
            <button
              type="button"
              disabled={!activityType || isSaving || chosenWordEntries.length === 0}
              onClick={() => void handleCreate()}
              className="btn-candy flex w-full min-h-[48px] items-center justify-center gap-2 text-base disabled:opacity-40"
            >
              {isSaving ? (
                <>
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Oluşturuluyor...
                </>
              ) : (
                <>Etkinliği Oluştur</>
              )}
            </button>
          )}

          {step === "sounds" && (
            <p className="text-center text-xs font-semibold text-[#C5B8DB]">
              Bir hedef ses seçerek başlayın
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
