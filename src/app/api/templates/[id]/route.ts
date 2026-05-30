import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, getUserFromRequest, jsonError, serverError } from "@/lib/api-server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { data, error } = await supabaseAdmin
    .from("templates")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    return jsonError("Şablon bulunamadı.", 404);
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

  // Verify the template exists and is owned by the requesting user.
  const { data: existing } = await supabaseAdmin
    .from("templates")
    .select("user_id, source")
    .eq("id", id)
    .single();

  if (!existing) {
    return jsonError("Şablon bulunamadı.", 404);
  }
  if (existing.source === "official") {
    return jsonError("Resmi şablonlar silinemez.", 403);
  }
  if (existing.user_id !== user.id) {
    return jsonError("Bu şablonu silme yetkiniz yok.", 403);
  }

  const { error } = await supabaseAdmin.from("templates").delete().eq("id", id);

  if (error) {
    return serverError("templates.DELETE", error);
  }

  return NextResponse.json({ success: true });
}
