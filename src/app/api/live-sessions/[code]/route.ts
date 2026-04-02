import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SESSION_EXPIRY_HOURS = 24;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  // Fetch the session by code
  const { data: session, error } = await supabase
    .from("live_sessions")
    .select("*")
    .eq("code", code)
    .eq("is_active", true)
    .single();

  if (error || !session) {
    return NextResponse.json(
      { error: "Session not found or is no longer active" },
      { status: 404 }
    );
  }

  // Check if session has expired (24h)
  const createdAt = new Date(session.created_at);
  const now = new Date();
  const hoursElapsed = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

  if (hoursElapsed > SESSION_EXPIRY_HOURS) {
    // Mark session as inactive
    await supabase
      .from("live_sessions")
      .update({ is_active: false })
      .eq("id", session.id);

    return NextResponse.json(
      { error: "Session has expired" },
      { status: 410 }
    );
  }

  // Fetch the associated activity
  const { data: activity, error: activityError } = await supabase
    .from("activities")
    .select("*")
    .eq("id", session.activity_id)
    .single();

  if (activityError || !activity) {
    return NextResponse.json(
      { error: "Activity associated with this session was not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ session, activity });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  try {
    const body = await request.json();

    // Build update object with only allowed fields
    const updateFields: Record<string, unknown> = {};
    if (body.current_item_index !== undefined) {
      updateFields.current_item_index = body.current_item_index;
    }
    if (body.is_active !== undefined) {
      updateFields.is_active = body.is_active;
    }
    if (body.participants !== undefined) {
      updateFields.participants = body.participants;
    }

    if (Object.keys(updateFields).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    updateFields.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("live_sessions")
      .update(updateFields)
      .eq("code", code)
      .eq("is_active", true)
      .select()
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "Session not found or is no longer active" },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  const { data, error } = await supabase
    .from("live_sessions")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("code", code)
    .eq("is_active", true)
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "Session not found or already ended" },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, session: data });
}
