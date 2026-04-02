"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LiveJoinPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleJoin() {
    const trimmed = code.trim();
    if (trimmed.length !== 6) {
      setError("Kod 6 haneli olmalıdır.");
      return;
    }
    // For now, redirect to play page with session code
    // In the future, this will check Supabase for the session
    router.push(`/live/${trimmed}`);
  }

  return (
    <div className="flex min-h-screen items-center justify-center" style={{ background: "linear-gradient(135deg, #FFF8F0, #FFE8F5, #E8F4FD)" }}>
      <div className="w-full max-w-sm px-4">
        <div className="rounded-3xl bg-white p-8 shadow-xl text-center" style={{ border: "2px solid rgba(45, 27, 105, 0.06)" }}>
          <div className="mb-4 text-5xl">🎮</div>
          <h1 className="font-heading text-2xl font-bold text-[#2D1B69] mb-2">Canlı Seans</h1>
          <p className="text-sm font-semibold text-[#8B7BAD] mb-6">Katılmak için seans kodunu girin</p>

          <input
            type="text"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6));
              setError(null);
            }}
            placeholder="000000"
            maxLength={6}
            className="input-playful mb-4 text-center text-3xl tracking-[0.5em] font-heading font-bold"
            style={{ letterSpacing: "0.3em" }}
          />

          {error && (
            <p className="mb-4 text-xs font-bold text-red-500">{error}</p>
          )}

          <button
            type="button"
            onClick={handleJoin}
            disabled={code.length !== 6}
            className="btn-candy btn-green w-full rounded-2xl py-3.5 text-lg disabled:opacity-50"
          >
            Katıl 🚀
          </button>

          <Link href="/dashboard" className="mt-4 inline-block text-sm font-bold text-[#8B7BAD] hover:text-[#FF6B9D]">
            ← Ana Sayfa
          </Link>
        </div>
      </div>
    </div>
  );
}
