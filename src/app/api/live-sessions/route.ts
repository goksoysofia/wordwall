import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.activityId || !body.activityTitle) {
      return NextResponse.json(
        { error: "activityId and activityTitle are required" },
        { status: 400 }
      );
    }

    // Generate a unique 6-digit code, retry on collision
    let code: string = "";
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      code = generateCode();
      const { data: existing } = await supabase
        .from("live_sessions")
        .select("id")
        .eq("code", code)
        .eq("is_active", true)
        .single();

      if (!existing) break;
      attempts++;
    }

    if (attempts >= maxAttempts) {
      return NextResponse.json(
        { error: "Could not generate a unique session code. Please try again." },
        { status: 500 }
      );
    }

    const { data, error } = await supabase
      .from("live_sessions")
      .insert({
        code,
        activity_id: body.activityId,
        activity_title: body.activityTitle,
        is_active: true,
        current_item_index: 0,
        participants: 0,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}

export async function GET() {
  const { data, error } = await supabase
    .from("live_sessions")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
