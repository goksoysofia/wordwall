import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import SWRegister from "./sw-register";

export const metadata: Metadata = {
  applicationName: "Wordwall",
  title: {
    default: "Wordwall — Etkinlik Oluşturucu",
    template: "%s · Wordwall",
  },
  description: "Dil ve konuşma terapisi etkinlikleri oluştur, oyna ve paylaş.",
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
    <html lang="tr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;500;600;700;800&family=Nunito:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        <SWRegister />
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
