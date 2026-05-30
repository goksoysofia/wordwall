import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase helpers shared by all API routes.
 *
 * The admin client uses the service-role key and therefore BYPASSES Row Level
 * Security. Every route is responsible for its own authorization checks — never
 * import this from client ("use client") code.
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Singleton — avoids creating a new client (and connection pool) per request.
export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

/** Resolve the authenticated user from the `Authorization: Bearer <token>` header. */
export async function getUserFromRequest(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.slice(7);
  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

/** Safely parse a JSON body. Returns `null` on malformed input instead of throwing. */
export async function parseJsonBody<T = Record<string, unknown>>(
  request: NextRequest
): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}

/** Standard JSON error response with a user-facing (Turkish) message. */
export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Log the real error server-side and return a generic message to the client.
 * Prevents leaking internal database/details (column names, constraints, etc.).
 */
export function serverError(
  context: string,
  detail: unknown,
  clientMessage = "İşlem sırasında bir hata oluştu. Lütfen tekrar deneyin."
) {
  console.error(`[${context}]`, detail);
  return NextResponse.json({ error: clientMessage }, { status: 500 });
}

/** Best-effort client IP for rate limiting. */
export function getClientIp(request: NextRequest): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

/**
 * Lightweight in-memory fixed-window rate limiter.
 *
 * Note: state lives per server instance, so on serverless this is a best-effort
 * defense against naive abuse rather than a hard guarantee. For strict limits
 * across instances, front the deployment with Vercel WAF rate-limiting or an
 * external store (e.g. Upstash Redis).
 */
const rateBuckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = rateBuckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    rateBuckets.set(key, { count: 1, resetAt: now + windowMs });
    // Opportunistic cleanup to bound memory growth.
    if (rateBuckets.size > 5000) {
      for (const [k, b] of rateBuckets) {
        if (now > b.resetAt) rateBuckets.delete(k);
      }
    }
    return true;
  }

  if (bucket.count >= limit) return false;
  bucket.count++;
  return true;
}

export const rateLimited = () =>
  jsonError("Çok fazla istek gönderildi. Lütfen biraz bekleyip tekrar deneyin.", 429);
