import { NextRequest, NextResponse } from "next/server";
import {
  supabaseAdmin,
  getUserFromRequest,
  parseJsonBody,
  jsonError,
  serverError,
} from "@/lib/api-server";
import { validateActivityInput } from "@/lib/validation";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { data, error } = await supabaseAdmin
    .from("activities")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    return jsonError("Etkinlik bulunamadı.", 404);
  }

  return NextResponse.json(data);
}

/** Confirm the activity exists and is owned by the requesting user. */
async function assertOwnership(id: string, userId: string) {
  const { data: existing } = await supabaseAdmin
    .from("activities")
    .select("user_id")
    .eq("id", id)
    .single();

  if (!existing) return { ok: false as const, status: 404, message: "Etkinlik bulunamadı." };
  if (existing.user_id !== userId) {
    return { ok: false as const, status: 403, message: "Bu etkinlik üzerinde yetkiniz yok." };
  }
  return { ok: true as const };
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getUserFromRequest(request);
  if (!user) {
    return jsonError("Giriş yapmanız gerekiyor.", 401);
  }

  const owner = await assertOwnership(id, user.id);
  if (!owner.ok) return jsonError(owner.message, owner.status);

  const body = await parseJsonBody(request);
  const validation = validateActivityInput(body);
  if (!validation.ok) {
    return jsonError(validation.error, 400);
  }
  const v = validation.value;

  const { data, error } = await supabaseAdmin
    .from("activities")
    .update({
      title: v.title,
      type: v.type,
      display_mode: v.display_mode,
      theme: v.theme,
      category: v.category,
      show_feedback: v.show_feedback,
      options: v.options,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return serverError("activities.PUT", error);
  }

  return NextResponse.json(data);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getUserFromRequest(request);
  if (!user) {
    return jsonError("Giriş yapmanız gerekiyor.", 401);
  }

  const owner = await assertOwnership(id, user.id);
  if (!owner.ok) return jsonError(owner.message, owner.status);

  const { error } = await supabaseAdmin.from("activities").delete().eq("id", id);

  if (error) {
    return serverError("activities.DELETE", error);
  }

  return NextResponse.json({ success: true });
}
