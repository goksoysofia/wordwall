import { ImageResponse } from "next/og";
import { getSplashSizes, parseSplashSize } from "@/lib/apple-splash";

// iOS açılış görselleri build sırasında prerender edilir (her cihaz boyutu için
// bir statik PNG); çalışma zamanında üretim maliyeti olmaz. Tabloda olmayan
// boyut istenirse 404 (keyfi büyük render engellenir).
export const dynamicParams = false;

export function generateStaticParams() {
  return getSplashSizes().map((size) => ({ size }));
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ size: string }> }
) {
  const { size } = await params;
  const parsed = parseSplashSize(size);
  if (!parsed) return new Response("Not found", { status: 404 });

  const { width, height } = parsed;
  const min = Math.min(width, height);

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
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: min * 0.34,
            height: min * 0.34,
            borderRadius: min * 0.085,
            background: "white",
            boxShadow: "0 20px 60px rgba(45,27,105,0.12)",
            fontSize: min * 0.18,
          }}
        >
          🎨
        </div>
        <div
          style={{
            fontSize: min * 0.092,
            fontWeight: 800,
            color: "#2D1B69",
            letterSpacing: -min * 0.002,
            marginTop: min * 0.07,
          }}
        >
          Wordwall
        </div>
        <div
          style={{
            fontSize: min * 0.034,
            fontWeight: 700,
            color: "#8B7BAD",
            marginTop: min * 0.02,
          }}
        >
          Dil ve Konuşma Terapisi
        </div>
      </div>
    ),
    { width, height }
  );
}
