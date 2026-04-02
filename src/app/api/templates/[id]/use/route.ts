import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

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
