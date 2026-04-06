import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const search = searchParams.get("search");
  const sort = searchParams.get("sort") || "popular";
  const excludeUser = searchParams.get("exclude_user");

  // Fetch community templates
  let tplQuery = supabase.from("templates").select("*").eq("source", "community");
  if (category) tplQuery = tplQuery.eq("category", category);
  if (search) tplQuery = tplQuery.or(`title.ilike.%${search}%,tags.cs.{${search}}`);

  // Fetch all user activities (exclude current user's own)
  let actQuery = supabase.from("activities").select("*").not("user_id", "is", null);
  if (excludeUser) actQuery = actQuery.neq("user_id", excludeUser);
  if (category) actQuery = actQuery.eq("category", category);
  if (search) actQuery = actQuery.ilike("title", `%${search}%`);

  const [tplResult, actResult] = await Promise.all([tplQuery, actQuery]);

  if (tplResult.error) {
    return NextResponse.json({ error: tplResult.error.message }, { status: 500 });
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
        const { data } = await supabase.auth.admin.getUserById(uid);
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

async function getUserFromRequest(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.slice(7);
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Giriş yapmanız gerekiyor." }, { status: 401 });
  }

  const body = await request.json();

  const { title, description, type, display_mode, theme, options, category, tags, author_name } = body;

  if (!title || !type || !theme || !options || !category) {
    return NextResponse.json(
      { error: "title, type, theme, options ve category zorunludur." },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("templates")
    .insert({
      title,
      description: description || null,
      type,
      display_mode: display_mode || null,
      theme,
      options,
      category,
      tags: tags || [],
      source: "community",
      author_name: author_name || null,
      user_id: user.id,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
