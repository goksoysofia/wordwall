import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendActivityCompletionEmail } from "@/lib/email";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { activityId, stats, playerName } = body;

    if (!activityId || !stats) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Fetch the activity
    const { data: activity, error: actError } = await supabase
      .from("activities")
      .select("*")
      .eq("id", activityId)
      .single();

    if (actError || !activity) {
      // Activity not found — silently succeed (don't break the player experience)
      console.warn("[notify-completion] Activity not found:", activityId);
      return NextResponse.json({ ok: true });
    }

    // 2. Get the therapist (creator) info
    if (!activity.user_id) {
      // No creator — skip email
      console.warn("[notify-completion] Activity has no user_id, skipping email");
      return NextResponse.json({ ok: true });
    }

    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(
      activity.user_id
    );

    if (userError || !userData?.user?.email) {
      console.warn("[notify-completion] Could not find therapist email:", activity.user_id);
      return NextResponse.json({ ok: true });
    }

    const therapistEmail = userData.user.email;
    const therapistName = userData.user.user_metadata?.full_name || "";

    // 3. Check if Gmail env vars are configured
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      console.warn("[notify-completion] Gmail credentials not configured, skipping email");
      return NextResponse.json({ ok: true });
    }

    // 4. Build play URL
    const origin = request.headers.get("origin") || request.headers.get("referer")?.replace(/\/[^/]*$/, "") || "https://wordwall.app";
    const playUrl = `${origin}/play/${activityId}`;

    // 5. Send email
    await sendActivityCompletionEmail({
      therapistEmail,
      therapistName,
      playerName: playerName || "Anonim Danışan",
      activityTitle: activity.title,
      activityType: activity.type,
      stats: {
        totalItems: stats.totalItems,
        correctCount: stats.correctCount,
        wrongCount: stats.wrongCount,
        timeSeconds: stats.timeSeconds,
        completedAt: stats.completedAt,
        wrongItems: stats.wrongItems || [],
      },
      playUrl,
    });

    console.log(`[notify-completion] Email sent to ${therapistEmail} for activity ${activityId}`);
    return NextResponse.json({ ok: true });
  } catch (error) {
    // Log the error but return success — don't break the player experience
    console.error("[notify-completion] Error sending email:", error);
    return NextResponse.json({ ok: true });
  }
}
