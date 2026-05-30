import { NextRequest, NextResponse } from "next/server";
import {
  supabaseAdmin,
  getUserFromRequest,
  rateLimit,
  rateLimited,
  jsonError,
  serverError,
} from "@/lib/api-server";

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

// Whitelist of safe raster image types → file extension. SVG is intentionally
// excluded (can carry inline scripts → stored XSS when served from a bucket).
const ALLOWED_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};

/** Confirm the uploaded bytes actually match a known image format. */
function sniffImage(bytes: Uint8Array): boolean {
  // PNG
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return true;
  // JPEG
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return true;
  // GIF
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) return true;
  // WEBP: "RIFF"...."WEBP"
  if (
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  ) {
    return true;
  }
  return false;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return jsonError("Giriş yapmanız gerekiyor.", 401);
    }

    if (!rateLimit(`upload:${user.id}`, 30, 60_000)) {
      return rateLimited();
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return jsonError("Dosya bulunamadı.", 400);
    }

    const ext = ALLOWED_TYPES[file.type];
    if (!ext) {
      return jsonError("Yalnızca PNG, JPEG, WebP veya GIF görselleri yükleyebilirsiniz.", 400);
    }

    if (file.size > MAX_SIZE) {
      return jsonError("Dosya boyutu 5 MB sınırını aşıyor.", 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    if (!sniffImage(new Uint8Array(buffer.subarray(0, 12)))) {
      return jsonError("Dosya geçerli bir görsel değil.", 400);
    }

    // Filename derived from validated type — never trust the client-provided name/extension.
    const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error } = await supabaseAdmin.storage
      .from("activity-images")
      .upload(fileName, buffer, { contentType: file.type });

    if (error) {
      return serverError("upload", error, "Görsel yüklenemedi. Lütfen tekrar deneyin.");
    }

    const { data: urlData } = supabaseAdmin.storage
      .from("activity-images")
      .getPublicUrl(fileName);

    return NextResponse.json({ url: urlData.publicUrl });
  } catch (err) {
    return serverError("upload", err, "Görsel yüklenemedi. Lütfen tekrar deneyin.");
  }
}
