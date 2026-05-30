import { NextRequest, NextResponse } from "next/server";
import {
  supabaseAdmin,
  getUserFromRequest,
  parseJsonBody,
  jsonError,
  serverError,
} from "@/lib/api-server";
import { validateActivityInput } from "@/lib/validation";

export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);

  // Authenticated → only the user's own activities.
  // Unauthenticated → no listing (activities are fetched individually by id on the play page).
  if (!user) {
    return NextResponse.json([]);
  }

  const { data, error } = await supabaseAdmin
    .from("activities")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return serverError("activities.GET", error);
  }

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return jsonError("Giriş yapmanız gerekiyor.", 401);
  }

  const body = await parseJsonBody(request);
  const validation = validateActivityInput(body);
  if (!validation.ok) {
    return jsonError(validation.error, 400);
  }
  const v = validation.value;

  const { data, error } = await supabaseAdmin
    .from("activities")
    .insert({
      title: v.title,
      type: v.type,
      display_mode: v.display_mode,
      theme: v.theme,
      category: v.category,
      show_feedback: v.show_feedback,
      options: v.options,
      user_id: user.id,
    })
    .select()
    .single();

  if (error) {
    return serverError("activities.POST", error);
  }

  return NextResponse.json(data);
}
