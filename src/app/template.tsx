"use client";

// Rota geçiş katmanı. App Router `template.tsx`'i her navigasyonda yeniden
// mount eder → giriş animasyonu her sayfa değişiminde tekrar oynar ve native
// "push" hissi verir. Animasyon `backwards` fill ile çalışır (forwards DEĞİL),
// böylece bitince kalıcı transform kalmaz ve içerideki position:fixed modaller
// (Kutlama, Sonuç ekranı...) doğru konumlanır. prefers-reduced-motion'da kapalı.

export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="ww-route-enter">{children}</div>;
}
