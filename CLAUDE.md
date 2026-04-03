# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run lint` | Next.js linting |

## Tech Stack

- **Next.js 16** (App Router, Turbopack) + **React 19** + **TypeScript 6**
- **Supabase** — PostgreSQL database, realtime subscriptions, RLS
- **Tailwind CSS 4** + **Framer Motion** for candy-themed UI and animations
- **Web Audio API** — procedural sound synthesis (no audio files)

## Architecture

### Routing (`src/app/`)
- `/create` — Activity creation wizard (type → content → theme)
- `/play/[id]` — Play an activity (loads from Supabase, renders game component)
- `/edit/[id]` — Edit existing activity
- `/dashboard` — Activity list; `/dashboard/templates` — Template marketplace
- `/live/[code]` — Join live session by code
- `/api/*` — REST endpoints (activities, templates, live-sessions, upload)

### Game Components (`src/components/`)
8 activity types, each accepting `options`, `theme`, and `onComplete(stats)`:
- `SpinningWheel` (wheel), `CardGrid`/`CardStack` (card), `MatchGame` (match), `GroupSort` (group-sort), `Quiz` (quiz), `MissingWord` (missing-word), `MemoryGame` (memory), `BalloonPop` (balloon-pop)

All games track `GameStats` (totalItems, correctCount, wrongCount, timeSeconds) and pass results to `ResultsScreen`.

### Shared Utilities (`src/lib/`)
- `supabase.ts` — Client (anon key) and server (service role key) Supabase instances
- `sounds.ts` — Audio synthesis engine with ADSR envelopes, procedural effects
- `themes.ts` — 10 curated themes with Turkish labels, emojis, color palettes

### Types (`src/types/`)
- `activity.ts` — ActivityType, ActivityOption, Activity
- `template.ts` — Template, TemplateCategory
- `game.ts` — GameStats

### Database (`supabase/`)
- `migrations/` — SQL for `templates`, `live_sessions` tables, activity type constraints
- `seed/` — 18 official templates across 6 categories

## Key Patterns

- All pages use `"use client"` — no RSC currently
- API routes use `SUPABASE_SERVICE_ROLE_KEY` for privileged ops; client uses anon key
- Activity types are constrained: `wheel | card | match | group-sort | quiz | missing-word | memory | balloon-pop`
- Card type has `displayMode`: `grid` or `stack`
- Template system: `source: "official"` (curated) vs `"community"` (user-shared)
- Live sessions use Supabase Realtime with unique 6-char codes

## Localization

All UI is in **Turkish**. Target users are Turkish speech/language therapists. Keep all user-facing strings in Turkish.

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
PEXELS_API_KEY
```
