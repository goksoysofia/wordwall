import type { Metadata, Viewport } from "next";
import { Baloo_2, Nunito } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import PWAManager from "@/components/PWAManager";
import NativeUX from "@/components/NativeUX";
import { getSplashLinks } from "@/lib/apple-splash";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://wordwall.app";

// Fontları build sırasında self-host et: render-blocking üçüncü-taraf isteği
// ortadan kalkar (daha hızlı ilk boya) ve çevrimdışı da çalışır. latin-ext
// alt kümesi Türkçe karakterler (ğ, ş, İ, ı, ç, ö, ü) için gerekli.
const fontHeading = Baloo_2({
  subsets: ["latin", "latin-ext"],
  variable: "--font-heading",
  display: "swap",
});
const fontBody = Nunito({
  subsets: ["latin", "latin-ext"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: "Wordwall",
  title: {
    default: "Wordwall — Etkinlik Oluşturucu",
    template: "%s · Wordwall",
  },
  description: "Dil ve konuşma terapisi etkinlikleri oluştur, oyna ve paylaş.",
  keywords: ["dil terapisi", "konuşma terapisi", "eğitsel oyun", "etkinlik oluşturucu", "DKT"],
  openGraph: {
    type: "website",
    siteName: "Wordwall",
    title: "Wordwall — Etkinlik Oluşturucu",
    description: "Dil ve konuşma terapisi etkinlikleri oluştur, oyna ve paylaş.",
    locale: "tr_TR",
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "Wordwall — Etkinlik Oluşturucu",
    description: "Dil ve konuşma terapisi etkinlikleri oluştur, oyna ve paylaş.",
  },
  robots: { index: true, follow: true },
  appleWebApp: {
    capable: true,
    title: "Wordwall",
    statusBarStyle: "default",
  },
  // Next yalnızca modern `mobile-web-app-capable` üretiyor; eski iOS sürümleri
  // standalone mod için apple-prefixli meta'yı okur — uyumluluk için ekliyoruz.
  other: {
    "apple-mobile-web-app-capable": "yes",
  },
  formatDetection: { telephone: false },
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "32x32", type: "image/png" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Erişilebilirlik için yakınlaştırmaya izin ver, ama oyun deneyiminde
  // kazara aşırı yakınlaşmayı sınırla.
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#FFF8F0",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className={`${fontHeading.variable} ${fontBody.variable}`}>
      <body className="antialiased">
        {/* iOS PWA açılış (splash) ekranları — kurulu uygulamanın cold-launch'ında
            boş beyaz ekran yerine markalı görsel. React 19 bu <link>'leri otomatik
            <head>'e taşır. Eşleşmeyen cihaz sessizce mevcut davranışa düşer. */}
        {getSplashLinks().map((l) => (
          <link
            key={`${l.size}-${l.media}`}
            rel="apple-touch-startup-image"
            media={l.media}
            href={`/apple-splash/${l.size}`}
          />
        ))}
        <NativeUX />
        <PWAManager />
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
