"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import type { Activity } from "@/types/activity";

export default function LiveSessionPage() {
  const { code } = useParams<{ code: string }>();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check localStorage for session data
    const sessionData = localStorage.getItem(`live-session-${code}`);
    if (sessionData) {
      try {
        const parsed = JSON.parse(sessionData);
        if (parsed.activityId) {
          // Fetch the activity
          fetch(`/api/activities/${parsed.activityId}`)
            .then((res) => res.ok ? res.json() : Promise.reject())
            .then((data) => setActivity(data))
            .catch(() => setError("Etkinlik bulunamadı."));
        } else {
          setError("Geçersiz seans.");
        }
      } catch {
        setError("Seans verisi okunamadı.");
      }
    } else {
      setError("Bu kodla bir seans bulunamadı. Seans sahibiyle aynı cihazda olmanız gerekiyor (şimdilik).");
    }
    setLoading(false);
  }, [code]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: "linear-gradient(135deg, #FFF8F0, #FFE8F5)" }}>
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-[#FFE8F5] border-t-[#FF6B9D]" />
      </div>
    );
  }

  if (error || !activity) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4" style={{ background: "linear-gradient(135deg, #FFF8F0, #FFE8F5)" }}>
        <div className="max-w-sm rounded-3xl bg-white p-8 text-center shadow-xl" style={{ border: "2px solid rgba(45, 27, 105, 0.06)" }}>
          <div className="mb-4 text-5xl">😕</div>
          <h1 className="font-heading text-xl font-bold text-[#2D1B69] mb-2">{error || "Seans bulunamadı"}</h1>
          <p className="text-sm text-[#8B7BAD] mb-6">Supabase entegrasyonu sonrasında farklı cihazlardan katılım mümkün olacak.</p>
          <Link href="/live" className="btn-candy inline-flex px-8 py-3 text-base">Geri Dön</Link>
        </div>
      </div>
    );
  }

  // Redirect to play page for now
  return (
    <div className="flex min-h-screen items-center justify-center" style={{ background: "linear-gradient(135deg, #FFF8F0, #FFE8F5)" }}>
      <div className="max-w-sm rounded-3xl bg-white p-8 text-center shadow-xl" style={{ border: "2px solid rgba(45, 27, 105, 0.06)" }}>
        <div className="mb-4 text-5xl">🎮</div>
        <h1 className="font-heading text-xl font-bold text-[#2D1B69] mb-2">{activity.title}</h1>
        <p className="text-sm text-[#8B7BAD] mb-2">Seans Kodu: <span className="font-heading font-bold text-[#FF6B9D]">{code}</span></p>
        <p className="text-xs text-[#C5B8DB] mb-6">Canlı seans başladı!</p>
        <Link href={`/play/${activity.id}`} className="btn-candy btn-green inline-flex px-8 py-3 text-base">
          Oyuna Başla 🚀
        </Link>
      </div>
    </div>
  );
}
