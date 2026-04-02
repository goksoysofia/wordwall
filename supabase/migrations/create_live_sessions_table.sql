create table if not exists live_sessions (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  activity_id uuid not null references activities(id) on delete cascade,
  activity_title text not null,
  is_active boolean not null default true,
  participants integer not null default 0,
  current_item_index integer not null default 0,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '24 hours')
);

create index if not exists idx_live_sessions_code on live_sessions (code);
create index if not exists idx_live_sessions_active on live_sessions (is_active) where is_active = true;

-- Enable realtime for live_sessions
alter publication supabase_realtime add table live_sessions;

-- RLS policies
alter table live_sessions enable row level security;

-- Anyone can read active sessions (needed for joining)
create policy "Anyone can read active sessions" on live_sessions
  for select using (is_active = true);

-- Anyone can insert sessions (no auth yet)
create policy "Anyone can create sessions" on live_sessions
  for insert with check (true);

-- Anyone can update sessions (no auth yet)
create policy "Anyone can update sessions" on live_sessions
  for update using (true);
