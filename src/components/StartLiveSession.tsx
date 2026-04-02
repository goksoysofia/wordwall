"use client";

import { useState } from "react";

interface StartLiveSessionProps {
  activityId: string;
  activityTitle: string;
  onClose: () => void;
}

export default function StartLiveSession({ activityId, activityTitle, onClose }: StartLiveSessionProps) {
  const [sessionCode, setSessionCode] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [ending, setEnding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const liveUrl =
    typeof window !== "undefined" && sessionCode
      ? `${window.location.origin}/live/${sessionCode}`
      : "";

  async function handleStart() {
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/live-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activityId, activityTitle }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Seans oluşturulamadı.");
      }
      const data = await res.json();
      setSessionCode(data.code);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu.");
    } finally {
      setCreating(false);
    }
  }

  async function handleEnd() {
    if (!sessionCode) return;
    setEnding(true);
    try {
      await fetch(`/api/live-sessions/${sessionCode}`, { method: "DELETE" });
      onClose();
    } catch {
      setError("Seans kapatılırken hata oluştu.");
      setEnding(false);
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(liveUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Bağlantıyı kopyalayın:", liveUrl);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="animate-scale-in relative w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl"
        style={{ border: "2px solid rgba(45, 27, 105, 0.08)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Not yet started — show start button */}
        {!sessionCode && !creating && (
          <>
            <div className="mb-4 text-5xl">📡</div>
            <h2 className="font-heading text-2xl font-bold text-[#2D1B69] mb-2">Canlı Seans Başlat</h2>
            <p className="text-sm font-semibold text-[#8B7BAD] mb-6">{activityTitle}</p>

            {error && (
              <p className="mb-4 text-xs font-bold text-red-500">{error}</p>
            )}

            <button
              type="button"
              onClick={handleStart}
              className="btn-candy btn-green w-full rounded-2xl py-3 text-base mb-3"
            >
              Seansı Başlat
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-2xl py-3 text-base font-bold text-[#8B7BAD] hover:text-[#2D1B69] transition"
            >
              Vazgeç
            </button>
          </>
        )}

        {/* Creating — loading spinner */}
        {creating && (
          <>
            <div className="mb-6 flex items-center justify-center">
              <div className="h-16 w-16 animate-spin rounded-full border-4 border-[#FFE8F5] border-t-[#FF6B9D]" />
            </div>
            <p className="text-sm font-semibold text-[#8B7BAD]">Seans oluşturuluyor...</p>
          </>
        )}

        {/* Session active — show code & controls */}
        {sessionCode && !creating && (
          <>
            <div className="mb-4 text-5xl">📡</div>
            <h2 className="font-heading text-2xl font-bold text-[#2D1B69] mb-2">Canlı Seans Başladı!</h2>
            <p className="text-sm font-semibold text-[#8B7BAD] mb-6">{activityTitle}</p>

            {/* Session Code */}
            <div className="mb-6 rounded-2xl bg-[#F8F5FF] p-6" style={{ border: "2px solid rgba(45, 27, 105, 0.06)" }}>
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[#8B7BAD]">Seans Kodu</p>
              <p className="font-heading text-5xl font-bold tracking-[0.2em] text-[#2D1B69]">{sessionCode}</p>
            </div>

            {/* QR Placeholder */}
            <div className="mb-6 flex items-center justify-center">
              <div className="flex h-32 w-32 items-center justify-center rounded-2xl bg-[#F8F5FF] text-xs font-bold text-[#8B7BAD]" style={{ border: "2px dashed rgba(45, 27, 105, 0.1)" }}>
                QR Kod<br />(yakında)
              </div>
            </div>

            {/* Join URL */}
            <div className="mb-6">
              <p className="mb-2 text-xs font-bold text-[#8B7BAD]">Katılım Linki</p>
              <div className="flex items-center gap-2 rounded-xl bg-[#F8F5FF] px-3 py-2" style={{ border: "1px solid rgba(45, 27, 105, 0.06)" }}>
                <p className="min-w-0 flex-1 truncate text-xs font-semibold text-[#2D1B69]">{liveUrl}</p>
                <button
                  type="button"
                  onClick={copyLink}
                  className="shrink-0 rounded-lg bg-[#2D1B69] px-3 py-1.5 text-xs font-bold text-white transition hover:bg-[#3d2a7d]"
                >
                  {copied ? "✓ Kopyalandı" : "Kopyala"}
                </button>
              </div>
            </div>

            {error && (
              <p className="mb-4 text-xs font-bold text-red-500">{error}</p>
            )}

            <button
              type="button"
              onClick={handleEnd}
              disabled={ending}
              className="w-full rounded-2xl bg-red-500 py-3 text-base font-bold text-white transition hover:bg-red-600 disabled:opacity-50 mb-3"
            >
              {ending ? "Kapatılıyor..." : "Seansı Bitir"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-2xl py-3 text-base font-bold text-[#8B7BAD] hover:text-[#2D1B69] transition"
            >
              Kapat
            </button>
          </>
        )}
      </div>
    </div>
  );
}
