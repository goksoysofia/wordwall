/**
 * Server-side input validation for activity/template payloads.
 * Keeps the database honest and prevents abuse (oversized payloads, bad types).
 */

// Must stay in sync with supabase/migrations/update_activities_type_check.sql
export const ACTIVITY_TYPES = [
  "wheel",
  "card",
  "match",
  "group-sort",
  "quiz",
  "missing-word",
  "memory",
  "balloon-pop",
  "sequence",
  "sentence",
  "unscramble",
  "odd-one-out",
  "true-false",
  "listen-choose",
  "word-search",
  "flashcards",
  "bingo",
  "syllable-count",
] as const;

export const DISPLAY_MODES = ["grid", "stack", "pop", "read"] as const;

const MAX_TITLE = 200;
const MAX_THEME = 60;
const MAX_CATEGORY = 60;
const MAX_DESCRIPTION = 1000;
const MAX_OPTIONS_ITEMS = 300;
const MAX_OPTIONS_BYTES = 1_000_000; // ~1 MB serialized — images live in storage, not here
const MAX_TAGS = 20;
const MAX_TAG_LEN = 40;

export interface ValidatedActivity {
  title: string;
  type: string;
  display_mode: string | null;
  theme: string;
  category: string | null;
  show_feedback: boolean;
  options: unknown[];
}

type Result<T> = { ok: true; value: T } | { ok: false; error: string };

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function optionsTooLarge(options: unknown[]): boolean {
  try {
    return JSON.stringify(options).length > MAX_OPTIONS_BYTES;
  } catch {
    return true; // circular / non-serializable
  }
}

/** Validate the shared activity fields used by both activities and templates. */
export function validateActivityInput(body: Record<string, unknown> | null): Result<ValidatedActivity> {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Geçersiz istek gövdesi." };
  }

  if (!isNonEmptyString(body.title)) {
    return { ok: false, error: "Başlık zorunludur." };
  }
  if ((body.title as string).length > MAX_TITLE) {
    return { ok: false, error: `Başlık en fazla ${MAX_TITLE} karakter olabilir.` };
  }

  if (typeof body.type !== "string" || !(ACTIVITY_TYPES as readonly string[]).includes(body.type)) {
    return { ok: false, error: "Geçersiz etkinlik türü." };
  }

  if (!isNonEmptyString(body.theme) || (body.theme as string).length > MAX_THEME) {
    return { ok: false, error: "Geçersiz tema." };
  }

  let display_mode: string | null = null;
  if (body.display_mode != null) {
    if (
      typeof body.display_mode !== "string" ||
      !(DISPLAY_MODES as readonly string[]).includes(body.display_mode)
    ) {
      return { ok: false, error: "Geçersiz görüntüleme modu." };
    }
    display_mode = body.display_mode;
  }

  let category: string | null = null;
  if (body.category != null) {
    if (typeof body.category !== "string" || body.category.length > MAX_CATEGORY) {
      return { ok: false, error: "Geçersiz kategori." };
    }
    category = body.category || null;
  }

  if (!Array.isArray(body.options)) {
    return { ok: false, error: "Geçersiz içerik." };
  }
  // `sentence` builds its words from the title; distractor options are optional.
  if (body.options.length === 0 && body.type !== "sentence") {
    return { ok: false, error: "En az bir öğe eklemelisiniz." };
  }
  if (body.options.length > MAX_OPTIONS_ITEMS) {
    return { ok: false, error: `En fazla ${MAX_OPTIONS_ITEMS} öğe ekleyebilirsiniz.` };
  }
  if (optionsTooLarge(body.options)) {
    return { ok: false, error: "İçerik boyutu çok büyük." };
  }

  const show_feedback = typeof body.show_feedback === "boolean" ? body.show_feedback : true;

  return {
    ok: true,
    value: {
      title: (body.title as string).trim(),
      type: body.type,
      display_mode,
      theme: body.theme as string,
      category,
      show_feedback,
      options: body.options,
    },
  };
}

export interface ValidatedTemplate extends ValidatedActivity {
  description: string | null;
  tags: string[];
  author_name: string | null;
}

/** Validate a community template submission (activity fields + template extras). */
export function validateTemplateInput(
  body: Record<string, unknown> | null
): Result<ValidatedTemplate> {
  const base = validateActivityInput(body);
  if (!base.ok) return base;
  const b = body as Record<string, unknown>;

  if (!isNonEmptyString(b.category)) {
    return { ok: false, error: "Kategori zorunludur." };
  }

  let description: string | null = null;
  if (b.description != null) {
    if (typeof b.description !== "string" || b.description.length > MAX_DESCRIPTION) {
      return { ok: false, error: "Açıklama çok uzun." };
    }
    description = b.description || null;
  }

  let tags: string[] = [];
  if (b.tags != null) {
    if (!Array.isArray(b.tags) || b.tags.length > MAX_TAGS) {
      return { ok: false, error: "Geçersiz etiketler." };
    }
    tags = b.tags
      .filter((t): t is string => typeof t === "string")
      .map((t) => t.trim().slice(0, MAX_TAG_LEN))
      .filter(Boolean);
  }

  let author_name: string | null = null;
  if (b.author_name != null) {
    if (typeof b.author_name !== "string") {
      return { ok: false, error: "Geçersiz yazar adı." };
    }
    author_name = b.author_name.slice(0, MAX_TITLE) || null;
  }

  return {
    ok: true,
    value: { ...base.value, category: base.value.category as string, description, tags, author_name },
  };
}
