import type { ActivityType, CardDisplayMode, ActivityOption } from "./activity";

export type TemplateCategory =
  | "artikulasyon"
  | "kelime-hazinesi"
  | "gramer"
  | "anlama"
  | "sosyal-iletisim"
  | "diger";

export type TemplateSource = "community";

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
  { slug: "artikulasyon", label: "Artikülasyon", emoji: "🗣️" },
  { slug: "kelime-hazinesi", label: "Kelime Hazinesi", emoji: "📖" },
  { slug: "gramer", label: "Gramer", emoji: "✍️" },
  { slug: "anlama", label: "Dil Anlama", emoji: "👂" },
  { slug: "sosyal-iletisim", label: "Sosyal İletişim", emoji: "🤝" },
  { slug: "diger", label: "Diğer", emoji: "🎯" },
];
