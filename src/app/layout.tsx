import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import CapacitorInit from "./capacitor-init";

export const metadata: Metadata = {
  title: "Etkinlik Oluşturucu",
  description: "Dil ve konuşma terapisi etkinlikleri oluştur ve paylaş",
};

export const viewport: Viewport = {
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
        <CapacitorInit />
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
