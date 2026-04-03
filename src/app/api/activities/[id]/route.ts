import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getUserFromRequest(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.slice(7);
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

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

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  return NextResponse.json(data);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Giriş yapmanız gerekiyor." }, { status: 401 });
  }

  // Verify ownership
  const { data: existing } = await supabaseAdmin
    .from("activities")
    .select("user_id")
    .eq("id", id)
    .single();

  if (existing?.user_id && existing.user_id !== user.id) {
    return NextResponse.json({ error: "Bu etkinliği düzenleme yetkiniz yok." }, { status: 403 });
  }

  const body = await request.json();

  const { data, error } = await supabaseAdmin
    .from("activities")
    .update({
      title: body.title,
      type: body.type,
      display_mode: body.display_mode,
      theme: body.theme,
      category: body.category || null,
      options: body.options,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
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
    return NextResponse.json({ error: "Giriş yapmanız gerekiyor." }, { status: 401 });
  }

  // Verify ownership
  const { data: existing } = await supabaseAdmin
    .from("activities")
    .select("user_id")
    .eq("id", id)
    .single();

  if (existing?.user_id && existing.user_id !== user.id) {
    return NextResponse.json({ error: "Bu etkinliği silme yetkiniz yok." }, { status: 403 });
  }

  const { error } = await supabaseAdmin
    .from("activities")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
