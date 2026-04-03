import { NextRequest, NextResponse } from "next/server";

const PEXELS_API_KEY = process.env.PEXELS_API_KEY;

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q");
  const page = req.nextUrl.searchParams.get("page") || "1";

  if (!query || query.trim().length === 0) {
    return NextResponse.json({ error: "Arama terimi gerekli" }, { status: 400 });
  }

  if (!PEXELS_API_KEY) {
    return NextResponse.json({ error: "Pexels API anahtarı tanımlı değil" }, { status: 500 });
  }

  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query.trim())}&per_page=20&page=${page}&locale=tr-TR`,
      { headers: { Authorization: PEXELS_API_KEY } }
    );

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: `Pexels API hatası: ${res.status} ${text}` }, { status: 502 });
    }

    const data = await res.json();

    const photos = (data.photos ?? []).map((p: { id: number; src: { medium: string; small: string; tiny: string }; alt: string; photographer: string }) => ({
      id: p.id,
      src: p.src.medium,
      thumb: p.src.small,
      alt: p.alt,
      photographer: p.photographer,
    }));

    return NextResponse.json({
      photos,
      totalResults: data.total_results,
      page: data.page,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Görsel aranırken hata oluştu" },
      { status: 500 }
    );
  }
}
