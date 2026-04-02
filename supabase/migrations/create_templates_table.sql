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

create index if not exists idx_templates_category on templates (category);
create index if not exists idx_templates_source on templates (source);
create index if not exists idx_templates_use_count on templates (use_count desc);
create index if not exists idx_templates_created_at on templates (created_at desc);
create index if not exists idx_templates_title_search on templates using gin (to_tsvector('simple', title));
