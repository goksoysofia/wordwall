import { NextRequest, NextResponse } from "next/server";
import {
  supabaseAdmin,
  parseJsonBody,
  getClientIp,
  rateLimit,
  rateLimited,
  jsonError,
} from "@/lib/api-server";
import { sendActivityCompletionEmail } from "@/lib/email";

const MAX_WRONG_ITEMS = 100;
const MAX_STR = 200;

/** Coerce to a finite, non-negative integer within [0, max]. */
function clampInt(value: unknown, max = 100_000): number {
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(n, max);
}

function clampStr(value: unknown, max = MAX_STR): string {
  return typeof value === "string" ? value.slice(0, max) : "";
}

export async function POST(request: NextRequest) {
  try {
    // Public endpoint — throttle per IP to prevent email-spam amplification.
    if (!rateLimit(`notify:${getClientIp(request)}`, 20, 60_000)) {
      return rateLimited();
    }

    const body = await parseJsonBody<{
      activityId?: string;
      stats?: Record<string, unknown>;
      playerName?: string;
    }>(request);

    const activityId = body?.activityId;
    const rawStats = body?.stats;

    if (!activityId || typeof activityId !== "string" || !rawStats || typeof rawStats !== "object") {
      return jsonError("Eksik veya geçersiz alanlar.", 400);
    }

    // Sanitize / clamp all client-supplied values before they reach the email.
    const stats = {
      totalItems: clampInt(rawStats.totalItems),
      correctCount: clampInt(rawStats.correctCount),
      wrongCount: clampInt(rawStats.wrongCount),
      timeSeconds: clampInt(rawStats.timeSeconds, 86_400),
      completedAt: typeof rawStats.completedAt === "string" ? rawStats.completedAt : new Date().toISOString(),
      wrongItems: Array.isArray(rawStats.wrongItems)
        ? rawStats.wrongItems.slice(0, MAX_WRONG_ITEMS).map((it: Record<string, unknown>) => ({
            text: clampStr(it?.text),
            correctAnswer: clampStr(it?.correctAnswer),
            userAnswer: clampStr(it?.userAnswer),
          }))
        : [],
    };
    const playerName = clampStr(body?.playerName, 60) || "Anonim Danışan";

    let activityTitle = "Bilinmeyen Etkinlik";
    let activityType = "Oyun";
    let therapistEmail = process.env.GMAIL_USER || "";
    let therapistName = "Değerli Danışman";

    const { data: activity } = await supabaseAdmin
      .from("activities")
      .select("*")
      .eq("id", activityId)
      .single();

    if (activity) {
      activityTitle = activity.title;
      activityType = activity.type;

      if (activity.user_id) {
        try {
          const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(
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
      console.warn("[notify-completion] Activity not found, using fallback defaults:", activityId);
    }

    if (!therapistEmail) {
      console.warn("[notify-completion] No therapist email or fallback available, skipping email");
      return NextResponse.json({ ok: true });
    }

    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      console.warn("[notify-completion] Gmail credentials not configured, skipping email");
      // Durum bilgisini döndür (sır değil) — kurulum doğrulamasını kolaylaştırır.
      return NextResponse.json({
        ok: true,
        emailSent: false,
        reason: "gmail_credentials_missing",
        hasUser: !!process.env.GMAIL_USER,
        hasPassword: !!process.env.GMAIL_APP_PASSWORD,
      });
    }

    // Build the play URL from a trusted, server-configured origin (never the request headers).
    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://wordwall.app").replace(/\/+$/, "");
    const playUrl = `${siteUrl}/play/${encodeURIComponent(activityId)}`;

    await sendActivityCompletionEmail({
      therapistEmail,
      therapistName,
      playerName,
      activityTitle,
      activityType,
      stats,
      playUrl,
    });

    console.log(`[notify-completion] Email sent for activity ${activityId}`);
    return NextResponse.json({ ok: true, emailSent: true });
  } catch (error) {
    // Log but return success — never break the player experience over a notification.
    console.error("[notify-completion] Error sending email:", error);
    return NextResponse.json({ ok: true });
  }
}
