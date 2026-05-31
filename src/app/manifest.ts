import type { MetadataRoute } from "next";

export const dynamic = "force-static";

// PWA web app manifest — /manifest.webmanifest olarak sunulur.
// Android (Chrome) ve iOS (Safari "Ana Ekrana Ekle") için kurulabilirlik sağlar.
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Wordwall — Etkinlik Oluşturucu",
    short_name: "Wordwall",
    description: "Dil ve konuşma terapisi etkinlikleri oluştur, oyna ve paylaş.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    // Daha entegre bir pencere modu varsa onu tercih et, yoksa standalone'a düş.
    display_override: ["standalone", "minimal-ui"],
    orientation: "any",
    background_color: "#FFF8F0",
    theme_color: "#FFF8F0",
    lang: "tr",
    dir: "ltr",
    categories: ["education", "kids", "games"],
    prefer_related_applications: false,
    // Ana ekran ikonuna basılı tutunca çıkan hızlı eylemler.
    shortcuts: [
      {
        name: "Yeni Etkinlik Oluştur",
        short_name: "Oluştur",
        url: "/create",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Etkinliklerim",
        short_name: "Etkinlikler",
        url: "/dashboard",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
    ],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
