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

  // Handle activity-based templates (id starts with "activity:")
  const isActivity = id.startsWith("activity:");
  const realId = isActivity ? id.slice("activity:".length) : id;

  let sourceTitle: string;
  let sourceType: string;
  let sourceDisplayMode: string | null;
  let sourceTheme: string;
  let sourceOptions: unknown;

  if (isActivity) {
    const { data: act, error: fetchError } = await supabase
      .from("activities")
      .select("*")
      .eq("id", realId)
      .single();

    if (fetchError || !act) {
      return NextResponse.json({ error: "Etkinlik bulunamadı." }, { status: 404 });
    }

    sourceTitle = act.title;
    sourceType = act.type;
    sourceDisplayMode = act.display_mode;
    sourceTheme = act.theme;
    sourceOptions = act.options;
  } else {
    const { data: template, error: fetchError } = await supabase
      .from("templates")
      .select("*")
      .eq("id", realId)
      .single();

    if (fetchError || !template) {
      return NextResponse.json({ error: "Şablon bulunamadı." }, { status: 404 });
    }

    sourceTitle = template.title;
    sourceType = template.type;
    sourceDisplayMode = template.display_mode;
    sourceTheme = template.theme;
    sourceOptions = template.options;

    // Increment use_count for real templates
    await supabase
      .from("templates")
      .update({ use_count: (template.use_count || 0) + 1 })
      .eq("id", realId);
  }

  const { data: activity, error: insertError } = await supabase
    .from("activities")
    .insert({
      title: `${sourceTitle} (kopya)`,
      type: sourceType,
      display_mode: sourceDisplayMode,
      theme: sourceTheme,
      options: sourceOptions,
      user_id: user.id,
    })
    .select()
    .single();

  if (insertError || !activity) {
    return NextResponse.json({ error: insertError?.message || "Etkinlik oluşturulamadı." }, { status: 500 });
  }

  return NextResponse.json({ id: activity.id });
}
