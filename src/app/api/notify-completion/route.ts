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

    // 1. Try to fetch the activity
    let activityTitle = "Bilinmeyen Etkinlik";
    let activityType = "Oyun";
    let therapistEmail = process.env.GMAIL_USER || "";
    let therapistName = "Değerli Danışman";

    const { data: activity } = await supabase
      .from("activities")
      .select("*")
      .eq("id", activityId)
      .single();

    if (activity) {
      activityTitle = activity.title;
      activityType = activity.type;

      // 2. Try to get the therapist (creator) info
      if (activity.user_id) {
        try {
          const { data: userData, error: userError } = await supabase.auth.admin.getUserById(
            activity.user_id
          );
          if (!userError && userData?.user?.email) {
            therapistEmail = userData.user.email;
            therapistName = userData.user.user_metadata?.full_name || "Değerli Danışman";
          }
        } catch (e) {
          console.warn("[notify-completion] Error fetching user auth record:", e);
        }
      }
    } else {
      console.warn("[notify-completion] Activity not found in DB, using fallback defaults for sending email:", activityId);
    }

    // Ensure we have a recipient email
    if (!therapistEmail && process.env.GMAIL_USER) {
      therapistEmail = process.env.GMAIL_USER;
    }

    if (!therapistEmail) {
      console.warn("[notify-completion] No therapist email or fallback available, skipping email");
      return NextResponse.json({ ok: true });
    }

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
