"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-lg">
        <p className="text-4xl" aria-hidden>
          ⚠️
        </p>
        <h1 className="mt-4 text-xl font-bold text-slate-800">
          Sayfa yüklenirken hata oluştu
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Tarayıcı konsolunda (F12) ayrıntıya bakabilirsiniz.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-6 rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Tekrar dene
        </button>
      </div>
    </div>
  );
}
