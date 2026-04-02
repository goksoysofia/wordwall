# Template Marketplace Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a template marketplace where therapists browse, use, and share activity templates across 6 therapy categories.

**Architecture:** Supabase `templates` table mirrors the `activities` structure with extra metadata fields (category, tags, source, author_name, use_count, is_premium). Next.js API route handlers follow the existing pattern (inline supabase client, NextRequest/NextResponse). New `/dashboard/templates` page for browsing, plus a "Share as Template" flow from existing activities.

**Tech Stack:** Next.js 16, React 19, Supabase, Tailwind CSS 4, Framer Motion, TypeScript

---

### Task 1: Template Type Definitions

**Files:**
- Create: `src/types/template.ts`

- [ ] **Step 1: Create template types file**

```ts
// src/types/template.ts
import type { ActivityType, CardDisplayMode, ActivityOption } from "./activity";

export type TemplateCategory =
  | "artikulasyon"
  | "kelime-hazinesi"
  | "gramer"
  | "anlama"
  | "sosyal-iletisim"
  | "diger";

export type TemplateSource = "official" | "community";

export interface Template {
  id: string;
  title: string;
  description: string | null;
  type: ActivityType;
  display_mode: CardDisplayMode | null;
  theme: string;
  options: ActivityOption[];
  category: TemplateCategory;
  tags: string[];
  source: TemplateSource;
  author_name: string | null;
  use_count: number;
  is_premium: boolean;
  created_at: string;
}

export interface CreateTemplatePayload {
  title: string;
  description: string;
  type: ActivityType;
  display_mode: CardDisplayMode | null;
  theme: string;
  options: ActivityOption[];
  category: TemplateCategory;
  tags: string[];
  author_name: string;
}

export const TEMPLATE_CATEGORIES: { slug: TemplateCategory; label: string; emoji: string }[] = [
  { slug: "artikulasyon", label: "Artikulasyon", emoji: "🗣️" },
  { slug: "kelime-hazinesi", label: "Kelime Hazinesi", emoji: "📖" },
  { slug: "gramer", label: "Gramer", emoji: "✍️" },
  { slug: "anlama", label: "Dil Anlama", emoji: "👂" },
  { slug: "sosyal-iletisim", label: "Sosyal Iletisim", emoji: "🤝" },
  { slug: "diger", label: "Diger", emoji: "🎯" },
];
```

- [ ] **Step 2: Verify types compile**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/types/template.ts
git commit -m "feat: add template type definitions"
```

---

### Task 2: Supabase Migration — Create templates Table

**Files:**
- Create: `supabase/migrations/create_templates_table.sql`

- [ ] **Step 1: Create migration file**

```sql
-- supabase/migrations/create_templates_table.sql

create table if not exists templates (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  type text not null,
  display_mode text,
  theme text not null,
  options jsonb not null default '[]'::jsonb,
  category text not null,
  tags text[] not null default '{}',
  source text not null default 'community',
  author_name text,
  use_count integer not null default 0,
  is_premium boolean not null default false,
  created_at timestamptz not null default now()
);

-- Index for common queries
create index if not exists idx_templates_category on templates (category);
create index if not exists idx_templates_source on templates (source);
create index if not exists idx_templates_use_count on templates (use_count desc);
create index if not exists idx_templates_created_at on templates (created_at desc);

-- Full text search on title
create index if not exists idx_templates_title_search on templates using gin (to_tsvector('simple', title));
```

- [ ] **Step 2: Run migration on Supabase**

Run the SQL in Supabase Dashboard SQL Editor, or if using CLI:
```bash
supabase db push
```
Expected: table `templates` created with indexes

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/create_templates_table.sql
git commit -m "feat: add templates table migration"
```

---

### Task 3: GET /api/templates — List & Search

**Files:**
- Create: `src/app/api/templates/route.ts`

- [ ] **Step 1: Create the GET endpoint**

```ts
// src/app/api/templates/route.ts
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
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/app/api/templates/route.ts
git commit -m "feat: add GET /api/templates endpoint with filtering and search"
```

---

### Task 4: POST /api/templates — Create Community Template

**Files:**
- Modify: `src/app/api/templates/route.ts`

- [ ] **Step 1: Add POST handler to existing route file**

Append to `src/app/api/templates/route.ts`:

```ts
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
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/app/api/templates/route.ts
git commit -m "feat: add POST /api/templates for community template creation"
```

---

### Task 5: GET/DELETE /api/templates/[id] + POST /api/templates/[id]/use

**Files:**
- Create: `src/app/api/templates/[id]/route.ts`
- Create: `src/app/api/templates/[id]/use/route.ts`

- [ ] **Step 1: Create template detail & delete endpoint**

```ts
// src/app/api/templates/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { data, error } = await supabase
    .from("templates")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  return NextResponse.json(data);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { error } = await supabase
    .from("templates")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
```

- [ ] **Step 2: Create the "use" endpoint that copies template to activity**

```ts
// src/app/api/templates/[id]/use/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // 1. Fetch the template
  const { data: template, error: fetchError } = await supabase
    .from("templates")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !template) {
    return NextResponse.json({ error: "Sablon bulunamadi." }, { status: 404 });
  }

  // 2. Create a new activity from template
  const { data: activity, error: insertError } = await supabase
    .from("activities")
    .insert({
      title: `${template.title} (kopya)`,
      type: template.type,
      display_mode: template.display_mode,
      theme: template.theme,
      options: template.options,
    })
    .select()
    .single();

  if (insertError || !activity) {
    return NextResponse.json({ error: insertError?.message || "Etkinlik olusturulamadi." }, { status: 500 });
  }

  // 3. Increment use_count
  await supabase.rpc("increment_use_count", { template_id: id }).catch(() => {
    // Fallback: manual increment if RPC not set up
    supabase
      .from("templates")
      .update({ use_count: (template.use_count || 0) + 1 })
      .eq("id", id)
      .then(() => {});
  });

  return NextResponse.json({ id: activity.id });
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add src/app/api/templates/[id]/route.ts src/app/api/templates/[id]/use/route.ts
git commit -m "feat: add template detail, delete, and use endpoints"
```

---

### Task 6: Templates Browse Page — Layout & Filtering

**Files:**
- Create: `src/app/dashboard/templates/page.tsx`

- [ ] **Step 1: Create the templates browse page**

```tsx
// src/app/dashboard/templates/page.tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Template, TemplateCategory, TemplateSource } from "@/types/template";
import { TEMPLATE_CATEGORIES } from "@/types/template";
import { getTheme } from "@/lib/themes";

const ACTIVITY_TYPE_LABELS: Record<string, { icon: string; label: string }> = {
  wheel: { icon: "🎡", label: "Cark" },
  card: { icon: "🃏", label: "Kart" },
  match: { icon: "🔗", label: "Eslestirme" },
  "group-sort": { icon: "📂", label: "Gruplama" },
  quiz: { icon: "❓", label: "Quiz" },
  "missing-word": { icon: "✏️", label: "Bosluk Doldur" },
  memory: { icon: "🧠", label: "Hafiza" },
  "balloon-pop": { icon: "🎈", label: "Balon" },
};

export default function TemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [activeCategory, setActiveCategory] = useState<TemplateCategory | null>(null);
  const [activeSource, setActiveSource] = useState<TemplateSource | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sort, setSort] = useState<"popular" | "newest">("popular");

  // Using state
  const [usingId, setUsingId] = useState<string | null>(null);

  const loadTemplates = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeCategory) params.set("category", activeCategory);
      if (activeSource) params.set("source", activeSource);
      if (searchQuery.trim()) params.set("search", searchQuery.trim());
      params.set("sort", sort);

      const res = await fetch(`/api/templates?${params}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Sablonlar yuklenemedi.");
        return;
      }
      setTemplates(Array.isArray(data) ? data : []);
    } catch {
      setError("Baglanti hatasi.");
    } finally {
      setLoading(false);
    }
  }, [activeCategory, activeSource, searchQuery, sort]);

  useEffect(() => {
    void loadTemplates();
  }, [loadTemplates]);

  const handleUse = async (templateId: string) => {
    setUsingId(templateId);
    try {
      const res = await fetch(`/api/templates/${templateId}/use`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Sablon kullanilamadi.");
        return;
      }
      router.push(`/edit/${data.id}`);
    } catch {
      alert("Bir hata olustu.");
    } finally {
      setUsingId(null);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-[#FFF8F0] via-[#FFF3E4] to-[#E8F4FD]" />
        <div className="deco-blob-1 left-[-15%] top-[5%] bg-[#FFD93D]" />
        <div className="deco-blob-2 bottom-[0%] right-[-10%] bg-[#FF6B9D]" />
        <div className="absolute inset-0 bg-dots-pattern" />
      </div>

      <div className="relative mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Header */}
        <header className="animate-fade-in mb-8 flex items-center gap-4">
          <Link
            href="/dashboard"
            className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-lg text-[#8B7BAD] shadow-md transition hover:scale-105 hover:shadow-lg"
            style={{ border: "2px solid rgba(45, 27, 105, 0.08)" }}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="font-heading text-2xl font-bold tracking-tight text-[#2D1B69] sm:text-3xl">
              Sablon Pazari 📚
            </h1>
            <p className="mt-1 text-sm font-semibold text-[#8B7BAD]">
              Hazir sablonlari kesfet, tek tikla kullan
            </p>
          </div>
        </header>

        {/* Search */}
        <div className="animate-fade-in mb-6">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Sablon ara... (ornegin: r sesi, hayvanlar)"
            className="input-playful w-full"
          />
        </div>

        {/* Source Tabs */}
        <div className="animate-fade-in mb-4 flex gap-2">
          {([null, "official", "community"] as const).map((src) => (
            <button
              key={src ?? "all"}
              type="button"
              onClick={() => setActiveSource(src)}
              className={`rounded-2xl px-4 py-2 text-sm font-bold transition ${
                activeSource === src
                  ? "text-white shadow-md"
                  : "bg-white text-[#8B7BAD] hover:bg-[#F8F5FF]"
              }`}
              style={
                activeSource === src
                  ? { background: "linear-gradient(135deg, #FF6B9D, #FF8A50)", border: "2px solid transparent" }
                  : { border: "2px solid rgba(45, 27, 105, 0.06)" }
              }
            >
              {src === null ? "Tumu" : src === "official" ? "⭐ Resmi" : "👥 Topluluk"}
            </button>
          ))}

          <div className="ml-auto flex gap-2">
            {(["popular", "newest"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSort(s)}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                  sort === s ? "bg-[#2D1B69] text-white" : "bg-white text-[#8B7BAD]"
                }`}
                style={{ border: "2px solid rgba(45, 27, 105, 0.06)" }}
              >
                {s === "popular" ? "Populer" : "Yeni"}
              </button>
            ))}
          </div>
        </div>

        {/* Category Pills */}
        <div className="animate-fade-in mb-8 flex gap-2 overflow-x-auto pb-2">
          <button
            type="button"
            onClick={() => setActiveCategory(null)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold transition ${
              activeCategory === null
                ? "bg-[#2D1B69] text-white shadow-md"
                : "bg-white text-[#8B7BAD] hover:bg-[#F8F5FF]"
            }`}
            style={{ border: "2px solid rgba(45, 27, 105, 0.06)" }}
          >
            Tumu
          </button>
          {TEMPLATE_CATEGORIES.map((cat) => (
            <button
              key={cat.slug}
              type="button"
              onClick={() => setActiveCategory(cat.slug)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold transition ${
                activeCategory === cat.slug
                  ? "bg-[#2D1B69] text-white shadow-md"
                  : "bg-white text-[#8B7BAD] hover:bg-[#F8F5FF]"
              }`}
              style={{ border: "2px solid rgba(45, 27, 105, 0.06)" }}
            >
              {cat.emoji} {cat.label}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center gap-5 py-20">
            <div className="relative">
              <div className="h-14 w-14 animate-spin rounded-full border-[3px] border-[#FFE8F5] border-t-[#FF6B9D]" />
            </div>
            <p className="text-sm font-medium text-[#8B7BAD]">Sablonlar yukleniyor...</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="mx-auto max-w-sm rounded-3xl border-2 border-red-100 bg-white p-8 text-center shadow-lg">
            <div className="mb-4 text-4xl">😕</div>
            <p className="font-bold text-slate-800">{error}</p>
            <button
              type="button"
              onClick={() => void loadTemplates()}
              className="mt-4 rounded-xl bg-[#2D1B69] px-6 py-2.5 text-sm font-semibold text-white"
            >
              Tekrar dene
            </button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && templates.length === 0 && (
          <div className="mx-auto max-w-sm rounded-3xl bg-white p-10 text-center shadow-lg" style={{ border: "2px solid rgba(45, 27, 105, 0.06)" }}>
            <div className="mb-4 text-5xl">📭</div>
            <h2 className="font-heading text-xl font-bold text-[#2D1B69]">Sablon bulunamadi</h2>
            <p className="mt-2 text-sm text-[#8B7BAD]">Filtrelerinizi degistirmeyi deneyin.</p>
          </div>
        )}

        {/* Template Grid */}
        {!loading && !error && templates.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {templates.map((tmpl) => {
              const theme = getTheme(tmpl.theme);
              const typeInfo = ACTIVITY_TYPE_LABELS[tmpl.type] || { icon: "🎯", label: "Etkinlik" };
              const catInfo = TEMPLATE_CATEGORIES.find((c) => c.slug === tmpl.category);
              const busy = usingId === tmpl.id;

              return (
                <article
                  key={tmpl.id}
                  className="card-hover flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm transition-all duration-200"
                  style={{ border: "2px solid rgba(45, 27, 105, 0.06)" }}
                >
                  {/* Color strip */}
                  <div className="flex h-2">
                    {theme.cardColors.slice(0, 5).map((c, i) => (
                      <div key={i} className="flex-1" style={{ backgroundColor: c }} />
                    ))}
                  </div>

                  <div className="flex flex-1 flex-col p-4">
                    {/* Type + Source badges */}
                    <div className="mb-2 flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#F8F5FF] px-2.5 py-0.5 text-xs font-bold text-[#8B7BAD]">
                        {typeInfo.icon} {typeInfo.label}
                      </span>
                      {tmpl.source === "official" && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-600">
                          ⭐ Resmi
                        </span>
                      )}
                      {tmpl.is_premium && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-bold text-purple-600">
                          🔒 Premium
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="mb-1 font-heading text-base font-bold text-[#2D1B69]">
                      {tmpl.title}
                    </h3>

                    {/* Description */}
                    {tmpl.description && (
                      <p className="mb-3 text-xs leading-relaxed text-[#8B7BAD] line-clamp-2">
                        {tmpl.description}
                      </p>
                    )}

                    {/* Category + Use count */}
                    <div className="mt-auto flex items-center justify-between pt-3">
                      {catInfo && (
                        <span className="text-xs font-bold text-[#C5B8DB]">
                          {catInfo.emoji} {catInfo.label}
                        </span>
                      )}
                      <span className="text-xs font-bold text-[#C5B8DB]">
                        {tmpl.use_count > 0 ? `${tmpl.use_count} kez kullanildi` : "Yeni"}
                      </span>
                    </div>

                    {/* Author (community) */}
                    {tmpl.source === "community" && tmpl.author_name && (
                      <p className="mt-1 text-[10px] font-semibold text-[#C5B8DB]">
                        👤 {tmpl.author_name}
                      </p>
                    )}

                    {/* Use button */}
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void handleUse(tmpl.id)}
                      className="btn-candy btn-green mt-3 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm"
                    >
                      {busy ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                          Kopyalaniyor...
                        </>
                      ) : (
                        "Kullan →"
                      )}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/app/dashboard/templates/page.tsx
git commit -m "feat: add templates browse page with filtering, search, and use flow"
```

---

### Task 7: "Share as Template" Modal & Flow

**Files:**
- Create: `src/components/ShareTemplateModal.tsx`
- Modify: `src/app/dashboard/page.tsx` (add share button to activity cards)

- [ ] **Step 1: Create the share modal component**

```tsx
// src/components/ShareTemplateModal.tsx
"use client";

import { useState } from "react";
import type { Activity } from "@/types/activity";
import type { TemplateCategory } from "@/types/template";
import { TEMPLATE_CATEGORIES } from "@/types/template";

interface ShareTemplateModalProps {
  activity: Activity;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ShareTemplateModal({ activity, onClose, onSuccess }: ShareTemplateModalProps) {
  const [title, setTitle] = useState(activity.title);
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<TemplateCategory>("diger");
  const [tagsInput, setTagsInput] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!title.trim() || !authorName.trim()) {
      setError("Baslik ve isim zorunludur.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const tags = tagsInput
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);

      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          type: activity.type,
          display_mode: activity.display_mode,
          theme: activity.theme,
          options: activity.options,
          category,
          tags,
          author_name: authorName.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Paylasim basarisiz.");

      onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Bir hata olustu.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="animate-scale-in relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"
        style={{ border: "2px solid rgba(45, 27, 105, 0.08)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 font-heading text-xl font-bold text-[#2D1B69]">
          Sablon Olarak Paylas 🌟
        </h2>

        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="mb-1 block text-xs font-bold text-[#8B7BAD]">Sablon Adi</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-playful"
              placeholder="Sablon basligi"
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-1 block text-xs font-bold text-[#8B7BAD]">Aciklama</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-playful min-h-[80px] resize-none"
              placeholder="Bu sablon ne icin kullanilir?"
            />
          </div>

          {/* Category */}
          <div>
            <label className="mb-1 block text-xs font-bold text-[#8B7BAD]">Kategori</label>
            <div className="flex flex-wrap gap-2">
              {TEMPLATE_CATEGORIES.map((cat) => (
                <button
                  key={cat.slug}
                  type="button"
                  onClick={() => setCategory(cat.slug)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                    category === cat.slug
                      ? "bg-[#2D1B69] text-white"
                      : "bg-[#F8F5FF] text-[#8B7BAD] hover:bg-[#F0EAFF]"
                  }`}
                >
                  {cat.emoji} {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="mb-1 block text-xs font-bold text-[#8B7BAD]">Etiketler (virgul ile ayirin)</label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="input-playful"
              placeholder="r-sesi, 5-7-yas, eslestirme"
            />
          </div>

          {/* Author */}
          <div>
            <label className="mb-1 block text-xs font-bold text-[#8B7BAD]">Adiniz</label>
            <input
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              className="input-playful"
              placeholder="Orn. Ayse Ogretmen"
            />
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-xl bg-red-50 px-4 py-2 text-center text-xs font-bold text-red-600">
            {error}
          </div>
        )}

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-2xl bg-[#F8F5FF] py-3 text-sm font-bold text-[#8B7BAD] transition hover:bg-[#F0EAFF]"
          >
            Iptal
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => void handleSubmit()}
            className="btn-candy btn-green flex flex-1 items-center justify-center gap-2 rounded-2xl py-3 text-sm"
          >
            {saving ? "Paylasiliyor..." : "Paylas 🚀"}
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add "Share" button to dashboard activity cards**

In `src/app/dashboard/page.tsx`, find the activity card actions section (the buttons area with "Oyna", "Duzenle", "Sil") and add a share button. Also import the modal and add modal state management:

Add imports at top:
```tsx
import ShareTemplateModal from "@/components/ShareTemplateModal";
```

Add state:
```tsx
const [sharingActivity, setSharingActivity] = useState<Activity | null>(null);
```

Add share button alongside "Baglantıyı Kopyala" button in each activity card:
```tsx
<button
  type="button"
  onClick={() => setSharingActivity(activity)}
  className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 text-[13px] font-semibold text-slate-500 transition hover:border-purple-200 hover:bg-purple-50 hover:text-purple-600 active:scale-[0.98]"
>
  🌟 Sablon Olarak Paylas
</button>
```

Add modal at end of component, before closing `</div>`:
```tsx
{sharingActivity && (
  <ShareTemplateModal
    activity={sharingActivity}
    onClose={() => setSharingActivity(null)}
    onSuccess={() => {
      setSharingActivity(null);
      alert("Sablonunuz basariyla paylasildi! 🎉");
    }}
  />
)}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add src/components/ShareTemplateModal.tsx src/app/dashboard/page.tsx
git commit -m "feat: add share-as-template modal and button on dashboard"
```

---

### Task 8: Add "Templates" Navigation Link to Dashboard

**Files:**
- Modify: `src/app/dashboard/page.tsx`

- [ ] **Step 1: Add templates link to dashboard header**

In `src/app/dashboard/page.tsx`, find the header area with "Yeni Etkinlik Olustur" button and add a templates link next to it:

```tsx
<Link
  href="/dashboard/templates"
  className="flex w-full items-center justify-center gap-3 rounded-2xl bg-white px-8 py-4 text-lg font-bold text-[#2D1B69] shadow-md transition hover:shadow-lg hover:scale-[1.02]"
  style={{ border: "2px solid rgba(45, 27, 105, 0.08)" }}
>
  <span className="text-2xl">📚</span>
  Sablon Pazari
</Link>
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/app/dashboard/page.tsx
git commit -m "feat: add templates marketplace link to dashboard"
```

---

### Task 9: Seed Data — 18 Official Templates

**Files:**
- Create: `supabase/seed/templates-seed.sql`

- [ ] **Step 1: Create seed data SQL file**

```sql
-- supabase/seed/templates-seed.sql
-- 18 official templates for speech therapy

-- Artikulasyon (3)
INSERT INTO templates (title, description, type, theme, options, category, tags, source, is_premium, author_name) VALUES
(
  '/s/ sesi kelime basi eslestirme',
  '5-7 yas grubu icin /s/ sesi hedefleyen eslestirme etkinligi. Kelime basi pozisyonunda /s/ sesi iceren kelimeler.',
  'match', 'fruits',
  '[{"id":"s1","text":"Su","pairText":"Bardak"},{"id":"s2","text":"Saat","pairText":"Zaman"},{"id":"s3","text":"Sabun","pairText":"Temizlik"},{"id":"s4","text":"Sandal","pairText":"Deniz"},{"id":"s5","text":"Sepet","pairText":"Meyve"},{"id":"s6","text":"Silgi","pairText":"Kalem"},{"id":"s7","text":"Simit","pairText":"Yiyecek"},{"id":"s8","text":"Supurge","pairText":"Temizlik"}]'::jsonb,
  'artikulasyon', ARRAY['s-sesi','5-7-yas','eslestirme','kelime-basi'], 'official', false, null
),
(
  '/r/ sesi balon patlatma',
  '/r/ sesi iceren kelimeleri hedefleyen eglenceli balon patlatma oyunu.',
  'balloon-pop', 'aliens',
  '[{"id":"r1","text":"Araba","isCorrect":true},{"id":"r2","text":"Kalem","isCorrect":false},{"id":"r3","text":"Bardak","isCorrect":true},{"id":"r4","text":"Masa","isCorrect":false},{"id":"r5","text":"Portakal","isCorrect":true},{"id":"r6","text":"Kitap","isCorrect":false},{"id":"r7","text":"Karanlik","isCorrect":true},{"id":"r8","text":"Resim","isCorrect":true},{"id":"r9","text":"Top","isCorrect":false},{"id":"r10","text":"Tavuk","isCorrect":false}]'::jsonb,
  'artikulasyon', ARRAY['r-sesi','balon','artikulasyon'], 'official', false, null
),
(
  '/k/ sesi hafiza oyunu',
  '/k/ sesi iceren kelimeleri pekistirmek icin hafiza karti oyunu.',
  'memory', 'blue',
  '[{"id":"k1","text":"Kedi"},{"id":"k2","text":"Kutu"},{"id":"k3","text":"Kapı"},{"id":"k4","text":"Kalem"},{"id":"k5","text":"Koltuk"},{"id":"k6","text":"Kukla"}]'::jsonb,
  'artikulasyon', ARRAY['k-sesi','hafiza','artikulasyon'], 'official', true, null
);

-- Kelime Hazinesi (3)
INSERT INTO templates (title, description, type, theme, options, category, tags, source, is_premium, author_name) VALUES
(
  'Hayvanlar gruplama',
  'Hayvanlari yasadiklari yerlere gore grupla: evcil, yabani, ciftlik.',
  'group-sort', 'farm',
  '[{"id":"h1","text":"Kedi","group":"Evcil"},{"id":"h2","text":"Aslan","group":"Yabani"},{"id":"h3","text":"Inek","group":"Ciftlik"},{"id":"h4","text":"Kopek","group":"Evcil"},{"id":"h5","text":"Kaplan","group":"Yabani"},{"id":"h6","text":"Tavuk","group":"Ciftlik"},{"id":"h7","text":"Balik","group":"Evcil"},{"id":"h8","text":"Fil","group":"Yabani"},{"id":"h9","text":"Koyun","group":"Ciftlik"}]'::jsonb,
  'kelime-hazinesi', ARRAY['hayvanlar','gruplama','kelime'], 'official', false, null
),
(
  'Meyve-sebze eslestirme',
  'Meyve ve sebze isimlerini resimleriyle eslestirme.',
  'match', 'fruits',
  '[{"id":"ms1","text":"Elma","pairText":"Kirmizi meyve"},{"id":"ms2","text":"Havuc","pairText":"Turuncu sebze"},{"id":"ms3","text":"Muz","pairText":"Sari meyve"},{"id":"ms4","text":"Domates","pairText":"Kirmizi sebze"},{"id":"ms5","text":"Uzum","pairText":"Mor meyve"},{"id":"ms6","text":"Biber","pairText":"Yesil sebze"}]'::jsonb,
  'kelime-hazinesi', ARRAY['meyve','sebze','eslestirme'], 'official', true, null
),
(
  'Vucut bolumleri quiz',
  'Vucut bolumlerini tanima ve isimlendirme quiz oyunu.',
  'quiz', 'classroom',
  '[{"id":"v1","text":"Goz","isCorrect":true},{"id":"v2","text":"Kulak","isCorrect":false},{"id":"v3","text":"Burun","isCorrect":false},{"id":"v4","text":"Agiz","isCorrect":false}]'::jsonb,
  'kelime-hazinesi', ARRAY['vucut','quiz','kelime'], 'official', false, null
);

-- Gramer (3)
INSERT INTO templates (title, description, type, theme, options, category, tags, source, is_premium, author_name) VALUES
(
  'Cogul eki bosluk doldurma',
  'Cumlelerdeki boslugu dogru cogul ekiyle tamamla.',
  'missing-word', 'classroom',
  '[{"id":"c1","text":"agaclar","isCorrect":true},{"id":"c2","text":"agac","isCorrect":false},{"id":"c3","text":"agaclik","isCorrect":false}]'::jsonb,
  'gramer', ARRAY['cogul','ek','gramer'], 'official', false, null
),
(
  'Gecmis zaman quiz',
  'Dogru gecmis zaman fiil cekimini secme oyunu.',
  'quiz', 'cars',
  '[{"id":"g1","text":"gitti","isCorrect":true},{"id":"g2","text":"gider","isCorrect":false},{"id":"g3","text":"gidecek","isCorrect":false},{"id":"g4","text":"gidiyor","isCorrect":false}]'::jsonb,
  'gramer', ARRAY['gecmis-zaman','fiil','gramer'], 'official', true, null
),
(
  'Buyuk-kucuk gruplama',
  'Sifatlari buyuk ve kucuk gruplarina ayir.',
  'group-sort', 'treasure',
  '[{"id":"bk1","text":"Dev","group":"Buyuk"},{"id":"bk2","text":"Minik","group":"Kucuk"},{"id":"bk3","text":"Kocaman","group":"Buyuk"},{"id":"bk4","text":"Ufak","group":"Kucuk"},{"id":"bk5","text":"Iri","group":"Buyuk"},{"id":"bk6","text":"Kucucuk","group":"Kucuk"}]'::jsonb,
  'gramer', ARRAY['sifat','gruplama','gramer'], 'official', false, null
);

-- Dil Anlama (3)
INSERT INTO templates (title, description, type, theme, options, category, tags, source, is_premium, author_name) VALUES
(
  'Zit anlamlilar eslestirme',
  'Zit anlamli kelimeleri birbiriyle eslestir.',
  'match', 'pink',
  '[{"id":"z1","text":"Sicak","pairText":"Soguk"},{"id":"z2","text":"Buyuk","pairText":"Kucuk"},{"id":"z3","text":"Hizli","pairText":"Yavas"},{"id":"z4","text":"Uzun","pairText":"Kisa"},{"id":"z5","text":"Acik","pairText":"Kapali"},{"id":"z6","text":"Mutlu","pairText":"Uzgun"}]'::jsonb,
  'anlama', ARRAY['zit-anlam','eslestirme','anlama'], 'official', false, null
),
(
  'Ne ile ne yapariz?',
  'Nesneleri kullanimlariyla eslestirme quiz oyunu.',
  'quiz', 'classroom',
  '[{"id":"n1","text":"Keseriz","isCorrect":true},{"id":"n2","text":"Yazariz","isCorrect":false},{"id":"n3","text":"Boyariz","isCorrect":false},{"id":"n4","text":"Yeriz","isCorrect":false}]'::jsonb,
  'anlama', ARRAY['nesne','islev','anlama'], 'official', true, null
),
(
  'Gunluk rutin siralama',
  'Sabah, ogle ve aksam rutinlerini dogru gruba yerles.',
  'group-sort', 'classroom',
  '[{"id":"sr1","text":"Dis fircala","group":"Sabah"},{"id":"sr2","text":"Ogle yemegi","group":"Ogle"},{"id":"sr3","text":"Pijama giy","group":"Aksam"},{"id":"sr4","text":"Kahvalti","group":"Sabah"},{"id":"sr5","text":"Teneffus","group":"Ogle"},{"id":"sr6","text":"Masal dinle","group":"Aksam"}]'::jsonb,
  'anlama', ARRAY['rutin','siralama','gunluk'], 'official', false, null
);

-- Sosyal Iletisim (3)
INSERT INTO templates (title, description, type, theme, options, category, tags, source, is_premium, author_name) VALUES
(
  'Duygu eslestirme',
  'Yuz ifadelerini duygu isimleriyle eslestir.',
  'match', 'pink',
  '[{"id":"d1","text":"😊","pairText":"Mutlu"},{"id":"d2","text":"😢","pairText":"Uzgun"},{"id":"d3","text":"😠","pairText":"Kizgin"},{"id":"d4","text":"😨","pairText":"Korkmus"},{"id":"d5","text":"😮","pairText":"Sasirmis"},{"id":"d6","text":"😴","pairText":"Uykulu"}]'::jsonb,
  'sosyal-iletisim', ARRAY['duygu','eslestirme','sosyal'], 'official', false, null
),
(
  'Ne hisseder?',
  'Verilen senaryoda kisinin ne hissettigini tahmin et.',
  'quiz', 'pink',
  '[{"id":"nh1","text":"Mutlu","isCorrect":true},{"id":"nh2","text":"Kizgin","isCorrect":false},{"id":"nh3","text":"Korkmus","isCorrect":false},{"id":"nh4","text":"Uzgun","isCorrect":false}]'::jsonb,
  'sosyal-iletisim', ARRAY['duygu','senaryo','sosyal'], 'official', true, null
),
(
  'Kibarlik kelimeleri balon patlatma',
  'Kibar ifadeleri iceren balonlari patlat, kabalari birak.',
  'balloon-pop', 'farm',
  '[{"id":"kb1","text":"Lutfen","isCorrect":true},{"id":"kb2","text":"Tesekkurler","isCorrect":true},{"id":"kb3","text":"Ver bana!","isCorrect":false},{"id":"kb4","text":"Rica ederim","isCorrect":true},{"id":"kb5","text":"Istemiyorum!","isCorrect":false},{"id":"kb6","text":"Pardon","isCorrect":true},{"id":"kb7","text":"Cekil!","isCorrect":false},{"id":"kb8","text":"Ozur dilerim","isCorrect":true}]'::jsonb,
  'sosyal-iletisim', ARRAY['kibarlik','balon','sosyal'], 'official', false, null
);

-- Diger (3)
INSERT INTO templates (title, description, type, theme, options, category, tags, source, is_premium, author_name) VALUES
(
  'Renkler carki',
  'Renk isimlerini ogrenme ve pekistirme carki.',
  'wheel', 'fruits',
  '[{"id":"rc1","text":"Kirmizi"},{"id":"rc2","text":"Mavi"},{"id":"rc3","text":"Yesil"},{"id":"rc4","text":"Sari"},{"id":"rc5","text":"Turuncu"},{"id":"rc6","text":"Mor"},{"id":"rc7","text":"Pembe"},{"id":"rc8","text":"Beyaz"}]'::jsonb,
  'diger', ARRAY['renkler','cark','genel'], 'official', false, null
),
(
  'Haftanin gunleri hafiza',
  'Haftanin gunlerini eslestirerek ogren.',
  'memory', 'blue',
  '[{"id":"hg1","text":"Pazartesi"},{"id":"hg2","text":"Sali"},{"id":"hg3","text":"Carsamba"},{"id":"hg4","text":"Persembe"},{"id":"hg5","text":"Cuma"},{"id":"hg6","text":"Cumartesi"},{"id":"hg7","text":"Pazar"}]'::jsonb,
  'diger', ARRAY['gunler','hafiza','genel'], 'official', true, null
),
(
  'Sayilar 1-10 kart acma',
  'Sayilari 1den 10a kadar kartlarla ogren.',
  'card', 'cars',
  '[{"id":"sy1","text":"1 - Bir"},{"id":"sy2","text":"2 - Iki"},{"id":"sy3","text":"3 - Uc"},{"id":"sy4","text":"4 - Dort"},{"id":"sy5","text":"5 - Bes"},{"id":"sy6","text":"6 - Alti"},{"id":"sy7","text":"7 - Yedi"},{"id":"sy8","text":"8 - Sekiz"},{"id":"sy9","text":"9 - Dokuz"},{"id":"sy10","text":"10 - On"}]'::jsonb,
  'diger', ARRAY['sayilar','kart','genel'], 'official', false, null
);
```

- [ ] **Step 2: Run seed SQL on Supabase**

Run in Supabase Dashboard SQL Editor.
Expected: 18 rows inserted into `templates` table.

- [ ] **Step 3: Commit**

```bash
git add supabase/seed/templates-seed.sql
git commit -m "feat: add 18 official template seed data for speech therapy"
```

---

### Task 10: Verify Full Integration

- [ ] **Step 1: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 2: Run build check**

Run: `npx next build`
Expected: "Compiled successfully" (Supabase env error is expected and pre-existing)

- [ ] **Step 3: Manual smoke test**

Start dev server: `npm run dev`

Test these flows:
1. Navigate to `/dashboard/templates` — page loads, shows templates
2. Filter by category — grid updates
3. Switch between "Resmi" / "Topluluk" tabs
4. Search for "r sesi" — matching templates appear
5. Click "Kullan" on a template — redirects to edit page with copied data
6. Go to dashboard, click "Sablon Olarak Paylas" on an activity — modal opens
7. Fill out modal and submit — template created

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete template marketplace integration"
```
