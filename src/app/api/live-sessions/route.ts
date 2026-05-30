import { NextRequest, NextResponse } from "next/server";
import { randomInt } from "crypto";
import {
  supabaseAdmin,
  parseJsonBody,
  getClientIp,
  rateLimit,
  rateLimited,
  jsonError,
  serverError,
} from "@/lib/api-server";

/** Cryptographically-random 6-digit session code (harder to enumerate than Math.random). */
function generateCode(): string {
  return randomInt(100000, 1000000).toString();
}

export async function POST(request: NextRequest) {
  // Throttle session creation per IP.
  if (!rateLimit(`live-create:${getClientIp(request)}`, 20, 60_000)) {
    return rateLimited();
  }

  const body = await parseJsonBody<{ activityId?: string; activityTitle?: string }>(request);
  if (!body?.activityId || typeof body.activityId !== "string" || !body.activityTitle) {
    return jsonError("activityId ve activityTitle zorunludur.", 400);
  }
  const activityTitle = String(body.activityTitle).slice(0, 200);

  // Generate a unique 6-digit code, retry on collision
  let code = "";
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    code = generateCode();
    const { data: existing } = await supabaseAdmin
      .from("live_sessions")
      .select("id")
      .eq("code", code)
      .eq("is_active", true)
      .single();

    if (!existing) break;
    attempts++;
  }

  if (attempts >= maxAttempts) {
    return jsonError("Oturum kodu oluşturulamadı. Lütfen tekrar deneyin.", 503);
  }

  const { data, error } = await supabaseAdmin
    .from("live_sessions")
    .insert({
      code,
      activity_id: body.activityId,
      activity_title: activityTitle,
      is_active: true,
      current_item_index: 0,
      participants: 0,
    })
    .select()
    .single();

  if (error) {
    return serverError("live-sessions.POST", error);
  }

  return NextResponse.json(data);
}

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("live_sessions")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) {
    return serverError("live-sessions.GET", error);
  }

  return NextResponse.json(data);
}
