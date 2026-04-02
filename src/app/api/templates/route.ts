import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const source = searchParams.get("source");
  const search = searchParams.get("search");
  const sort = searchParams.get("sort") || "popular";

  let query = supabase.from("templates").select("*");

  if (category) {
    query = query.eq("category", category);
  }
  if (source) {
    query = query.eq("source", source);
  }
  if (search) {
    query = query.or(`title.ilike.%${search}%,tags.cs.{${search}}`);
  }
  if (sort === "popular") {
    query = query.order("use_count", { ascending: false });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
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
      is_premium: false,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
