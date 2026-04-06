"use client";

import { useState, useMemo } from "react";
import {
  TARGET_SOUNDS,
  WORD_BANK,
  POSITION_LABELS,
  getWords,
  getWordCounts,
  type SoundPosition,
  type WordEntry,
} from "@/lib/wordBank";

interface WordBankModalProps {
  onAddWords: (words: WordEntry[]) => void;
  onClose: () => void;
}

export default function WordBankModal({ onAddWords, onClose }: WordBankModalProps) {
  const [selectedSound, setSelectedSound] = useState<string | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<SoundPosition | null>(null);
  const [selectedWords, setSelectedWords] = useState<Set<string>>(new Set());

  const words = useMemo(() => {
    if (!selectedSound) return [];
    return getWords(selectedSound, selectedPosition ?? undefined);
  }, [selectedSound, selectedPosition]);

  const counts = useMemo(() => {
    if (!selectedSound) return null;
    return getWordCounts(selectedSound);
  }, [selectedSound]);

  const totalForSound = counts
    ? counts.basta + counts.ortada + counts.sonda
    : 0;

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

  function handleAdd() {
    const toAdd = words.filter((w) => selectedWords.has(w.word));
    if (toAdd.length > 0) onAddWords(toAdd);
    onClose();
  }

  // Sound difficulty grouping for display
  const soundGroups = [
    { label: "Erken Sesler", sounds: ["p", "b", "m", "t", "d", "n", "y"] },
    { label: "Orta Sesler", sounds: ["k", "g", "f", "v", "h"] },
    { label: "Geç Sesler", sounds: ["l", "r", "s", "z", "ş", "ç", "c", "j"] },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        {/* Header */}
        <div className="shrink-0 border-b border-[#F0EAFF] px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-heading text-xl font-bold text-[#2D1B69]">
                Kelime Bankası
              </h2>
              <p className="mt-0.5 text-xs font-semibold text-[#8B7BAD]">
                Artikülasyon terapisi hedef ses kelimeleri
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-2xl text-[#8B7BAD] transition hover:bg-[#F8F5FF] hover:text-[#2D1B69]"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Breadcrumb / Back */}
          {selectedSound && (
            <button
              type="button"
              onClick={() => {
                setSelectedSound(null);
                setSelectedPosition(null);
                setSelectedWords(new Set());
              }}
              className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-[#F8F5FF] px-3 py-1.5 text-xs font-bold text-[#8B7BAD] transition hover:bg-[#F0EAFF]"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
              </svg>
              Tüm sesler
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {!selectedSound ? (
            /* Sound Selection */
            <div className="space-y-6">
              {soundGroups.map((group) => (
                <div key={group.label}>
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-[#2D1B69]">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-lg bg-gradient-to-br from-[#FFD93D] to-[#FF8A50] text-[10px] font-bold text-white">
                      {group.label === "Erken Sesler" ? "1" : group.label === "Orta Sesler" ? "2" : "3"}
                    </span>
                    {group.label}
                    <span className="text-xs font-medium text-[#C5B8DB]">
                      ({group.label === "Erken Sesler" ? "2-3 yaş" : group.label === "Orta Sesler" ? "3-4 yaş" : "4-5 yaş"})
                    </span>
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
                            onClick={() => setSelectedSound(s)}
                            className="group flex flex-col items-center gap-1 rounded-2xl border-2 border-[#E8E0F5] bg-white p-3 transition hover:border-[#FF6B9D] hover:shadow-md active:scale-95"
                          >
                            <span className="font-heading text-2xl font-bold text-[#2D1B69] transition group-hover:text-[#FF6B9D]">
                              /{s}/
                            </span>
                            <span className="text-[10px] font-bold text-[#C5B8DB]">
                              {total} kelime
                            </span>
                          </button>
                        );
                      })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Word Selection */
            <div className="space-y-4">
              {/* Sound info */}
              <div className="text-center">
                <span className="font-heading text-3xl font-bold text-[#FF6B9D]">
                  /{selectedSound}/
                </span>
                <p className="mt-1 text-xs font-semibold text-[#8B7BAD]">
                  {WORD_BANK[selectedSound]?.label} — {totalForSound} kelime
                </p>
              </div>

              {/* Position Filter */}
              <div className="flex items-center justify-center gap-2">
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

              {/* Select all / deselect */}
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-[#8B7BAD]">
                  {selectedWords.size} kelime secildi
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={selectAll}
                    className="text-xs font-bold text-[#8B7BAD] transition hover:text-[#FF6B9D]"
                  >
                    Tümünü seç
                  </button>
                  {selectedWords.size > 0 && (
                    <button
                      type="button"
                      onClick={deselectAll}
                      className="text-xs font-bold text-[#C5B8DB] transition hover:text-red-400"
                    >
                      Temizle
                    </button>
                  )}
                </div>
              </div>

              {/* Word Grid */}
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {words.map((w) => {
                  const isSelected = selectedWords.has(w.word);
                  // Highlight the target sound in the word
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
                          isSelected
                            ? "bg-[#FF6B9D] font-bold text-white"
                            : "bg-[#F0EAFF] text-[#8B7BAD]"
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

              {words.length === 0 && (
                <p className="py-8 text-center text-sm font-semibold text-[#C5B8DB]">
                  Bu pozisyonda kelime bulunamadı
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer / Add Button */}
        {selectedSound && selectedWords.size > 0 && (
          <div className="shrink-0 border-t border-[#F0EAFF] px-6 py-4">
            <button
              type="button"
              onClick={handleAdd}
              className="btn-candy flex w-full min-h-[48px] items-center justify-center gap-2 text-base"
            >
              {selectedWords.size} kelime ekle
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
