import type { MetadataRoute } from "next";

export const dynamic = "force-static";

// PWA web app manifest — /manifest.webmanifest olarak sunulur.
// Android (Chrome) ve iOS (Safari "Ana Ekrana Ekle") için kurulabilirlik sağlar.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Wordwall — Etkinlik Oluşturucu",
    short_name: "Wordwall",
    description: "Dil ve konuşma terapisi etkinlikleri oluştur, oyna ve paylaş.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#FFF8F0",
    theme_color: "#FFF8F0",
    lang: "tr",
    dir: "ltr",
    categories: ["education", "kids", "games"],
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
