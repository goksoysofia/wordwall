import { NextRequest, NextResponse } from "next/server";
import {
  supabaseAdmin,
  parseJsonBody,
  getClientIp,
  rateLimit,
  rateLimited,
  jsonError,
} from "@/lib/api-server";

const SESSION_EXPIRY_HOURS = 24;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  // Throttle lookups per IP to slow brute-force enumeration of active session codes.
  if (!rateLimit(`live-join:${getClientIp(request)}`, 30, 60_000)) {
    return rateLimited();
  }

  // Fetch the session by code
  const { data: session, error } = await supabaseAdmin
    .from("live_sessions")
    .select("*")
    .eq("code", code)
    .eq("is_active", true)
    .single();

  if (error || !session) {
    return jsonError("Oturum bulunamadı veya artık aktif değil.", 404);
  }

  // Check if session has expired (24h)
  const createdAt = new Date(session.created_at);
  const now = new Date();
  const hoursElapsed = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

  if (hoursElapsed > SESSION_EXPIRY_HOURS) {
    await supabaseAdmin.from("live_sessions").update({ is_active: false }).eq("id", session.id);
    return jsonError("Oturumun süresi doldu.", 410);
  }

  // Fetch the associated activity
  const { data: activity, error: activityError } = await supabaseAdmin
    .from("activities")
    .select("*")
    .eq("id", session.activity_id)
    .single();

  if (activityError || !activity) {
    return jsonError("Bu oturuma ait etkinlik bulunamadı.", 404);
  }

  return NextResponse.json({ session, activity });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  const body = await parseJsonBody(request);
  if (!body) {
    return jsonError("Geçersiz istek gövdesi.", 400);
  }

  // Build update object with only allowed, type-validated fields.
  const updateFields: Record<string, unknown> = {};
  if (body.current_item_index !== undefined) {
    const idx = Math.floor(Number(body.current_item_index));
    if (!Number.isFinite(idx) || idx < 0 || idx > 10_000) {
      return jsonError("Geçersiz öğe sırası.", 400);
    }
    updateFields.current_item_index = idx;
  }
  if (body.is_active !== undefined) {
    if (typeof body.is_active !== "boolean") {
      return jsonError("Geçersiz oturum durumu.", 400);
    }
    updateFields.is_active = body.is_active;
  }
  if (body.participants !== undefined) {
    const p = Math.floor(Number(body.participants));
    if (!Number.isFinite(p) || p < 0 || p > 100_000) {
      return jsonError("Geçersiz katılımcı sayısı.", 400);
    }
    updateFields.participants = p;
  }

  if (Object.keys(updateFields).length === 0) {
    return jsonError("Güncellenecek geçerli alan yok.", 400);
  }

  updateFields.updated_at = new Date().toISOString();

  const { data, error } = await supabaseAdmin
    .from("live_sessions")
    .update(updateFields)
    .eq("code", code)
    .eq("is_active", true)
    .select()
    .single();

  if (error || !data) {
    return jsonError("Oturum bulunamadı veya artık aktif değil.", 404);
  }

  return NextResponse.json(data);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  const { data, error } = await supabaseAdmin
    .from("live_sessions")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("code", code)
    .eq("is_active", true)
    .select()
    .single();

  if (error || !data) {
    return jsonError("Oturum bulunamadı veya zaten sonlandırılmış.", 404);
  }

  return NextResponse.json({ success: true, session: data });
}
