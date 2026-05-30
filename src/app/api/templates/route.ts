import { NextRequest, NextResponse } from "next/server";
import {
  supabaseAdmin,
  getUserFromRequest,
  parseJsonBody,
  jsonError,
  serverError,
} from "@/lib/api-server";
import { validateTemplateInput } from "@/lib/validation";

/** Strip characters that have special meaning in PostgREST filter strings. */
function sanitizeSearch(raw: string): string {
  return raw.replace(/[,(){}*\\%]/g, " ").trim().slice(0, 60);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const rawSearch = searchParams.get("search");
  const search = rawSearch ? sanitizeSearch(rawSearch) : null;
  const sort = searchParams.get("sort") || "popular";
  const excludeUser = searchParams.get("exclude_user");

  // Fetch community templates
  let tplQuery = supabaseAdmin.from("templates").select("*").eq("source", "community");
  if (category) tplQuery = tplQuery.eq("category", category);
  if (search) tplQuery = tplQuery.or(`title.ilike.%${search}%,tags.cs.{${search}}`);

  // Fetch all user activities (exclude current user's own)
  let actQuery = supabaseAdmin.from("activities").select("*").not("user_id", "is", null);
  if (excludeUser) actQuery = actQuery.neq("user_id", excludeUser);
  if (category) actQuery = actQuery.eq("category", category);
  if (search) actQuery = actQuery.ilike("title", `%${search}%`);

  const [tplResult, actResult] = await Promise.all([tplQuery, actQuery]);

  if (tplResult.error) {
    return serverError("templates.GET", tplResult.error);
  }

  const templates = tplResult.data || [];

  // Transform activities into template-like objects
  let activityTemplates: Record<string, unknown>[] = [];
  if (!actResult.error && actResult.data?.length) {
    // Get unique user IDs and fetch display names
    const userIds = [...new Set(actResult.data.map((a: Record<string, unknown>) => a.user_id as string))];
    const userNameMap: Record<string, string> = {};

    await Promise.all(
      userIds.map(async (uid) => {
        const { data } = await supabaseAdmin.auth.admin.getUserById(uid);
        if (data?.user) {
          userNameMap[uid] =
            (data.user.user_metadata?.full_name as string) ||
            data.user.email ||
            "";
        }
      })
    );

    activityTemplates = actResult.data.map((act: Record<string, unknown>) => ({
      id: `activity:${act.id}`,
      title: act.title,
      description: null,
      type: act.type,
      display_mode: act.display_mode,
      theme: act.theme,
      options: act.options,
      category: act.category || "diger",
      tags: [],
      source: "community" as const,
      author_name: userNameMap[act.user_id as string] || null,
      use_count: 0,
      created_at: act.created_at,
      _is_activity: true,
    }));
  }

  // Merge and deduplicate (skip activities already shared as templates by same user+title)
  const tplKeys = new Set(templates.map((t: Record<string, unknown>) => `${t.user_id}:${t.title}`));
  const merged = [
    ...templates,
    ...activityTemplates.filter((a) => !tplKeys.has(`${(a as Record<string, unknown>).user_id}:${a.title}`)),
  ];

  // Sort
  if (sort === "popular") {
    merged.sort((a, b) => ((b.use_count as number) || 0) - ((a.use_count as number) || 0));
  } else {
    merged.sort((a, b) => new Date(b.created_at as string).getTime() - new Date(a.created_at as string).getTime());
  }

  return NextResponse.json(merged);
}

export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return jsonError("Giriş yapmanız gerekiyor.", 401);
  }

  const body = await parseJsonBody(request);
  const validation = validateTemplateInput(body);
  if (!validation.ok) {
    return jsonError(validation.error, 400);
  }
  const v = validation.value;

  const { data, error } = await supabaseAdmin
    .from("templates")
    .insert({
      title: v.title,
      description: v.description,
      type: v.type,
      display_mode: v.display_mode,
      theme: v.theme,
      options: v.options,
      category: v.category,
      tags: v.tags,
      source: "community",
      author_name: v.author_name,
      user_id: user.id,
    })
    .select()
    .single();

  if (error) {
    return serverError("templates.POST", error);
  }

  return NextResponse.json(data);
}
