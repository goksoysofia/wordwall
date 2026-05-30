import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, getUserFromRequest, jsonError, serverError } from "@/lib/api-server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getUserFromRequest(request);
  if (!user) {
    return jsonError("Giriş yapmanız gerekiyor.", 401);
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
    const { data: act, error: fetchError } = await supabaseAdmin
      .from("activities")
      .select("*")
      .eq("id", realId)
      .single();

    if (fetchError || !act) {
      return jsonError("Etkinlik bulunamadı.", 404);
    }

    sourceTitle = act.title;
    sourceType = act.type;
    sourceDisplayMode = act.display_mode;
    sourceTheme = act.theme;
    sourceOptions = act.options;
  } else {
    const { data: template, error: fetchError } = await supabaseAdmin
      .from("templates")
      .select("*")
      .eq("id", realId)
      .single();

    if (fetchError || !template) {
      return jsonError("Şablon bulunamadı.", 404);
    }

    sourceTitle = template.title;
    sourceType = template.type;
    sourceDisplayMode = template.display_mode;
    sourceTheme = template.theme;
    sourceOptions = template.options;

    // Increment use_count for real templates
    await supabaseAdmin
      .from("templates")
      .update({ use_count: (template.use_count || 0) + 1 })
      .eq("id", realId);
  }

  const { data: activity, error: insertError } = await supabaseAdmin
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
    return serverError("templates.use", insertError);
  }

  return NextResponse.json({ id: activity.id });
}
