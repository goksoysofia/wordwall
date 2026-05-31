"use client";

import { useEffect } from "react";
import { hapticSelection, primeHaptics } from "@/lib/haptics";

// Hangi öğeler basıldığında dokunsal "tık" versin.
const INTERACTIVE = 'button, a[href], [role="button"], summary, [data-haptic]';

function isDisabled(el: Element): boolean {
  return (
    el.hasAttribute("disabled") ||
    el.getAttribute("aria-disabled") === "true" ||
    el.closest("[data-no-haptic]") !== null
  );
}

/**
 * Uygulama geneli native dokunuş katmanı:
 *  • iOS taptic switch'ini önceden hazırlar (ilk dokunuştan önce).
 *  • Her gerçek kontrol basışında (buton/link/role=button) hafif bir haptik tık
 *    verir → her dokunuş "geri tepiyormuş" gibi hisseder, tıpkı native uygulama.
 *
 * Görsel render yok; sadece global davranış. Tek bir delege dinleyici kullanır,
 * bu yüzden ucuz ve her butona ayrı kod gerektirmez. Opt-out: data-no-haptic.
 */
export default function NativeUX() {
  useEffect(() => {
    primeHaptics();

    let last = 0;
    const onPointerDown = (e: PointerEvent) => {
      // Sadece birincil basış (sağ tık / ikincil dokunuş hariç).
      if (e.button !== 0) return;
      const target = e.target as Element | null;
      const control = target?.closest?.(INTERACTIVE);
      if (!control || isDisabled(control)) return;

      // Aynı basışın çift tetiklenmesini engelle (ör. iç içe kontroller).
      const now = e.timeStamp || performance.now();
      if (now - last < 40) return;
      last = now;

      hapticSelection();
    };

    // passive: scroll/etkileşimi hiç bloklamaz.
    document.addEventListener("pointerdown", onPointerDown, { passive: true });
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  return null;
}
