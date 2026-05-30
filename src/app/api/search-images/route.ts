import { NextRequest, NextResponse } from "next/server";
import {
  getUserFromRequest,
  rateLimit,
  rateLimited,
  jsonError,
} from "@/lib/api-server";

const PEXELS_API_KEY = process.env.PEXELS_API_KEY;

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return jsonError("Giriş yapmanız gerekiyor.", 401);
  }

  // Protect the upstream Pexels quota from a single user hammering search.
  if (!rateLimit(`search-images:${user.id}`, 40, 60_000)) {
    return rateLimited();
  }

  const rawQuery = req.nextUrl.searchParams.get("q");
  const pageParam = parseInt(req.nextUrl.searchParams.get("page") || "1", 10);
  const page = Number.isFinite(pageParam) ? Math.min(Math.max(pageParam, 1), 50) : 1;

  const query = rawQuery?.trim().slice(0, 80);
  if (!query) {
    return jsonError("Arama terimi gerekli.", 400);
  }

  if (!PEXELS_API_KEY) {
    console.error("[search-images] PEXELS_API_KEY is not configured");
    return jsonError("Görsel arama şu anda kullanılamıyor.", 503);
  }

  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=20&page=${page}&locale=tr-TR`,
      { headers: { Authorization: PEXELS_API_KEY } }
    );

    if (!res.ok) {
      console.error(`[search-images] Pexels API error: ${res.status}`);
      return jsonError("Görsel servisine ulaşılamadı. Lütfen tekrar deneyin.", 502);
    }

    const data = await res.json();

    const photos = (data.photos ?? []).map(
      (p: { id: number; src: { medium: string; small: string; tiny: string }; alt: string; photographer: string }) => ({
        id: p.id,
        src: p.src.medium,
        thumb: p.src.small,
        alt: p.alt,
        photographer: p.photographer,
      })
    );

    return NextResponse.json({
      photos,
      totalResults: data.total_results,
      page: data.page,
    });
  } catch (e) {
    console.error("[search-images]", e);
    return jsonError("Görsel aranırken bir hata oluştu.", 500);
  }
}
