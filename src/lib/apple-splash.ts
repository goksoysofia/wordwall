// =============================================================
// iOS PWA açılış (splash) ekranları için cihaz tablosu.
// iOS, "Ana Ekrana Ekle" ile kurulan web uygulamasını başlatırken
// <link rel="apple-touch-startup-image"> ile eşleşen görseli gösterir;
// yoksa boş beyaz ekran çıkar. Her cihaz/yön için bir media-query gerekir.
//
// Bu tablo hem layout'taki <link> etiketlerini hem de görselleri prerender
// eden route'u (generateStaticParams) besler — tek kaynak.
// =============================================================

export interface SplashDevice {
  /** CSS px cinsinden dikey (portrait) genişlik */
  w: number;
  /** CSS px cinsinden dikey (portrait) yükseklik */
  h: number;
  /** device-pixel-ratio */
  r: number;
  /** Üretilecek yönler */
  orientations: ReadonlyArray<"portrait" | "landscape">;
  /** Yorum amaçlı cihaz adı */
  label: string;
}

// En yaygın modern iPhone'lar (portrait) + iPad'ler (her iki yön).
export const SPLASH_DEVICES: readonly SplashDevice[] = [
  { w: 375, h: 667, r: 2, orientations: ["portrait"], label: "iPhone SE / 8" },
  { w: 414, h: 896, r: 2, orientations: ["portrait"], label: "iPhone XR / 11" },
  { w: 375, h: 812, r: 3, orientations: ["portrait"], label: "iPhone X / 11 Pro / 12-13 mini" },
  { w: 390, h: 844, r: 3, orientations: ["portrait"], label: "iPhone 12 / 13 / 14" },
  { w: 393, h: 852, r: 3, orientations: ["portrait"], label: "iPhone 14 Pro / 15 / 16" },
  { w: 428, h: 926, r: 3, orientations: ["portrait"], label: "iPhone 12-14 Pro Max / Plus" },
  { w: 430, h: 932, r: 3, orientations: ["portrait"], label: "iPhone 15 / 16 Pro Max / Plus" },
  { w: 768, h: 1024, r: 2, orientations: ["portrait", "landscape"], label: "iPad mini / 9.7\"" },
  { w: 810, h: 1080, r: 2, orientations: ["portrait", "landscape"], label: "iPad 10.2\"" },
  { w: 820, h: 1180, r: 2, orientations: ["portrait", "landscape"], label: "iPad Air 10.9\"" },
  { w: 834, h: 1194, r: 2, orientations: ["portrait", "landscape"], label: "iPad Pro 11\"" },
  { w: 1024, h: 1366, r: 2, orientations: ["portrait", "landscape"], label: "iPad Pro 12.9\"" },
] as const;

export interface SplashLink {
  /** Görselin piksel genişliği (verilen yöne göre) */
  pw: number;
  /** Görselin piksel yüksekliği (verilen yöne göre) */
  ph: number;
  /** Route param'ı: "1170x2532" */
  size: string;
  /** <link media="..."> değeri */
  media: string;
}

/** Cihaz tablosunu (cihaz × yön) düz <link> tanımları listesine açar. */
export function getSplashLinks(): SplashLink[] {
  const links: SplashLink[] = [];
  for (const d of SPLASH_DEVICES) {
    for (const o of d.orientations) {
      const portrait = o === "portrait";
      const pw = (portrait ? d.w : d.h) * d.r;
      const ph = (portrait ? d.h : d.w) * d.r;
      const media =
        `(device-width: ${d.w}px) and (device-height: ${d.h}px) ` +
        `and (-webkit-device-pixel-ratio: ${d.r}) and (orientation: ${o})`;
      links.push({ pw, ph, size: `${pw}x${ph}`, media });
    }
  }
  return links;
}

/** Prerender edilecek benzersiz görsel boyutları ("WxH"). */
export function getSplashSizes(): string[] {
  return Array.from(new Set(getSplashLinks().map((l) => l.size)));
}

/** "1170x2532" → { width, height }, güvenli sınırlarla doğrular. */
export function parseSplashSize(size: string): { width: number; height: number } | null {
  const m = /^(\d{2,4})x(\d{2,4})$/.exec(size);
  if (!m) return null;
  const width = Number(m[1]);
  const height = Number(m[2]);
  // Yalnızca tablodaki bilinen boyutlar (keyfi büyük render'ları engelle).
  if (!getSplashSizes().includes(size)) return null;
  return { width, height };
}
