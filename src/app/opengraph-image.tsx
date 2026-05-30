import { ImageResponse } from "next/og";

// Branded social-share card, auto-attached to OpenGraph & Twitter metadata.
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Wordwall — Etkinlik Oluşturucu";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #FFF8F0, #FFE8F5 55%, #E8F4FD)",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 140, marginBottom: 12 }}>🎨</div>
        <div
          style={{
            fontSize: 88,
            fontWeight: 800,
            color: "#2D1B69",
            letterSpacing: -2,
          }}
        >
          Wordwall
        </div>
        <div
          style={{
            fontSize: 38,
            fontWeight: 700,
            color: "#8B7BAD",
            marginTop: 8,
          }}
        >
          Dil ve Konuşma Terapisi Etkinlikleri
        </div>
        <div
          style={{
            display: "flex",
            gap: 24,
            marginTop: 40,
            fontSize: 52,
          }}
        >
          <span>🎡</span>
          <span>🃏</span>
          <span>🔗</span>
          <span>❓</span>
          <span>🎈</span>
          <span>🧠</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
