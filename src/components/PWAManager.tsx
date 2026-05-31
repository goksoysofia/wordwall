"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

// `beforeinstallprompt` henüz standart tiplerde yok — minimal tanım.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const INSTALL_DISMISS_KEY = "ww-install-dismissed";

// Install/“ana ekrana ekle” önerisini oyun/oturum ekranlarında gösterme —
// tam ekran deneyimi bölünmesin.
function bannerHidden(pathname: string): boolean {
  return (
    pathname.startsWith("/play/") ||
    pathname.startsWith("/live/") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/auth")
  );
}

function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return (
    /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    // iPadOS 13+ kendini Mac gibi tanıtır.
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari'nin kendine özel bayrağı.
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

export default function PWAManager() {
  const pathname = usePathname();
  const [offline, setOffline] = useState(false);
  const [reconnected, setReconnected] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstall, setShowInstall] = useState(false);
  const [iosHint, setIosHint] = useState(false);
  const reconnectTimer = useRef<number | null>(null);

  // --- Service worker kaydı + güncelleme tespiti ---------------------------
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

    let refreshing = false;
    const onControllerChange = () => {
      // Yeni SW kontrolü aldı (kullanıcı "Yenile" dedi) → tek sefer reload.
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    const register = async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js");

        // Halihazırda bekleyen bir sürüm varsa hemen bildir.
        if (reg.waiting && navigator.serviceWorker.controller) {
          setWaitingWorker(reg.waiting);
        }

        reg.addEventListener("updatefound", () => {
          const installing = reg.installing;
          if (!installing) return;
          installing.addEventListener("statechange", () => {
            // Yeni sürüm kuruldu ve eski bir kontrolör varsa → güncelleme hazır.
            if (installing.state === "installed" && navigator.serviceWorker.controller) {
              setWaitingWorker(installing);
            }
          });
        });
      } catch (err) {
        console.error("[SW] kayıt hatası:", err);
      }
    };

    if (document.readyState === "complete") void register();
    else window.addEventListener("load", () => void register(), { once: true });

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
    };
  }, []);

  // --- Çevrimiçi / çevrimdışı durumu ---------------------------------------
  useEffect(() => {
    const sync = () => {
      const isOffline = !navigator.onLine;
      setOffline((prev) => {
        // Çevrimdışıdan döndüyse kısa bir "yeniden bağlandın" bildirimi göster.
        if (prev && !isOffline) {
          setReconnected(true);
          if (reconnectTimer.current) window.clearTimeout(reconnectTimer.current);
          reconnectTimer.current = window.setTimeout(() => setReconnected(false), 2600);
        }
        return isOffline;
      });
    };
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
      if (reconnectTimer.current) window.clearTimeout(reconnectTimer.current);
    };
  }, []);

  // --- Install prompt (Android/Chrome) + iOS ipucu -------------------------
  useEffect(() => {
    const dismissed = (() => {
      try {
        return localStorage.getItem(INSTALL_DISMISS_KEY) === "1";
      } catch {
        return false;
      }
    })();
    if (dismissed || isStandalone()) return;

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
      setShowInstall(true);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);

    const onInstalled = () => {
      setShowInstall(false);
      setInstallEvent(null);
      setIosHint(false);
      try {
        localStorage.setItem(INSTALL_DISMISS_KEY, "1");
      } catch {
        /* yok say */
      }
    };
    window.addEventListener("appinstalled", onInstalled);

    // iOS Safari `beforeinstallprompt` desteklemez → elle yönerge göster.
    if (isIOS() && !isStandalone()) setIosHint(true);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const dismissInstall = useCallback(() => {
    setShowInstall(false);
    setIosHint(false);
    try {
      localStorage.setItem(INSTALL_DISMISS_KEY, "1");
    } catch {
      /* yok say */
    }
  }, []);

  const triggerInstall = useCallback(async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    try {
      await installEvent.userChoice;
    } finally {
      setShowInstall(false);
      setInstallEvent(null);
    }
  }, [installEvent]);

  const applyUpdate = useCallback(() => {
    waitingWorker?.postMessage("SKIP_WAITING");
    setWaitingWorker(null);
    // controllerchange tetiklenince sayfa otomatik yenilenecek.
  }, [waitingWorker]);

  const showInstallBanner = (showInstall || iosHint) && !bannerHidden(pathname);

  return (
    <>
      {/* Çevrimdışı / yeniden bağlandı çubuğu */}
      {(offline || reconnected) && (
        <div
          role="status"
          aria-live="polite"
          className="pointer-events-none fixed inset-x-0 top-0 z-[60] flex justify-center px-3"
          style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 0.5rem)" }}
        >
          <div
            className={`pointer-events-auto flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold text-white shadow-lg ${
              offline ? "bg-[#8B7BAD]" : "bg-[#6BCB77]"
            }`}
            style={{ animation: "ww-toast-in 0.3s ease-out" }}
          >
            <span aria-hidden>{offline ? "📡" : "✓"}</span>
            {offline ? "Çevrimdışısın — kayıtlı etkinlikler çalışmaya devam eder" : "Yeniden çevrimiçisin"}
          </div>
        </div>
      )}

      {/* Güncelleme hazır bildirimi */}
      {waitingWorker && (
        <div
          role="status"
          className="fixed inset-x-0 bottom-0 z-[70] flex justify-center px-3"
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 0.75rem)" }}
        >
          <div
            className="flex items-center gap-3 rounded-2xl bg-[#2D1B69] px-4 py-3 text-white shadow-2xl"
            style={{ animation: "ww-toast-in 0.3s ease-out" }}
          >
            <span className="text-lg" aria-hidden>✨</span>
            <span className="text-sm font-bold">Yeni sürüm hazır</span>
            <button
              type="button"
              onClick={applyUpdate}
              className="rounded-xl bg-[#FF6B9D] px-4 py-1.5 text-sm font-bold text-white transition active:scale-95"
            >
              Yenile
            </button>
          </div>
        </div>
      )}

      {/* Ana ekrana ekle önerisi */}
      {showInstallBanner && (
        <div
          className="fixed inset-x-0 bottom-0 z-[65] flex justify-center px-3"
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 0.75rem)" }}
        >
          <div
            className="flex w-full max-w-md items-center gap-3 rounded-2xl border-2 border-white/80 bg-white p-3 shadow-2xl"
            style={{ animation: "ww-toast-in 0.35s ease-out" }}
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FFF3E4] text-2xl">
              🎨
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-heading text-sm font-bold text-[#2D1B69]">
                Wordwall&apos;u ana ekrana ekle
              </p>
              <p className="text-xs font-semibold leading-snug text-[#8B7BAD]">
                {iosHint && !showInstall ? (
                  <>
                    <span aria-hidden>⎋</span> Paylaş &rarr; &quot;Ana Ekrana Ekle&quot; ile
                    uygulama gibi kullan.
                  </>
                ) : (
                  "Tam ekran, hızlı ve çevrimdışı çalışan uygulama deneyimi."
                )}
              </p>
            </div>
            {showInstall && (
              <button
                type="button"
                onClick={() => void triggerInstall()}
                className="shrink-0 rounded-xl bg-[#FF6B9D] px-4 py-2 text-sm font-bold text-white transition active:scale-95"
              >
                Ekle
              </button>
            )}
            <button
              type="button"
              onClick={dismissInstall}
              aria-label="Kapat"
              className="shrink-0 rounded-lg p-1.5 text-[#8B7BAD] transition hover:bg-[#F0EAFF]"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
