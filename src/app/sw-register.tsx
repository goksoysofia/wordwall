"use client";

import { useEffect } from "react";
import { isNative } from "@/lib/platform";

// Service worker'ı yalnızca üretimde ve tarayıcı (Capacitor native değil)
// ortamında kaydeder. Dev'de HMR ile çakışmaması için devre dışıdır.
export default function SWRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (isNative()) return;
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

    const register = () => {
      navigator.serviceWorker
        .register("/sw.js")
        .catch((err) => console.error("[SW] kayıt hatası:", err));
    };

    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
  }, []);

  return null;
}
