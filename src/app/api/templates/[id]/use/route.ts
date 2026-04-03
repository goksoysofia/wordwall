import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getUserFromRequest(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.slice(7);
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Giriş yapmanız gerekiyor." }, { status: 401 });
  }

  const { data: template, error: fetchError } = await supabase
    .from("templates")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !template) {
    return NextResponse.json({ error: "Şablon bulunamadı." }, { status: 404 });
  }

  const { data: activity, error: insertError } = await supabase
    .from("activities")
    .insert({
      title: `${template.title} (kopya)`,
      type: template.type,
      display_mode: template.display_mode,
      theme: template.theme,
      options: template.options,
      user_id: user.id,
    })
    .select()
    .single();

  if (insertError || !activity) {
    return NextResponse.json({ error: insertError?.message || "Etkinlik oluşturulamadı." }, { status: 500 });
  }

  await supabase
    .from("templates")
    .update({ use_count: (template.use_count || 0) + 1 })
    .eq("id", id);

  return NextResponse.json({ id: activity.id });
}
