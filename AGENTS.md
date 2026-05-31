# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

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
18 activity types, each accepting `options`, `theme`, and `onComplete(stats)`:
- `SpinningWheel` (wheel), `CardGrid`/`CardStack` (card), `MatchGame` (match), `GroupSort` (group-sort), `Quiz` (quiz), `MissingWord` (missing-word), `MemoryGame` (memory), `BalloonPop` (balloon-pop)
- `SequenceGame` (sequence), `SentenceGame` (sentence), `UnscrambleGame` (unscramble), `OddOneOut` (odd-one-out), `TrueFalse` (true-false), `ListenChoose` (listen-choose), `WordSearch` (word-search), `Flashcards` (flashcards), `BingoGame` (bingo), `SyllableCount` (syllable-count)

All games track `GameStats` (totalItems, correctCount, wrongCount, timeSeconds) and pass results to `ResultsScreen`.

### Shared Utilities (`src/lib/`)
- `supabase.ts` — Browser client (anon key) singleton; used for auth only (DB access goes through API routes)
- `api-server.ts` — **Server-only** helpers: `supabaseAdmin` (service role), `getUserFromRequest`, `parseJsonBody`, `jsonError`/`serverError` (sanitized errors), in-memory `rateLimit`. Never import from client code.
- `validation.ts` — Server-side input validation for activity/template payloads (`ACTIVITY_TYPES`, size/length limits)
- `auth-fetch.ts` — `authFetch` client wrapper that attaches the Supabase bearer token (skips JSON Content-Type for FormData)
- `auth-context.tsx` — `AuthProvider` / `useAuth` (Google OAuth via Supabase)
- `email.ts` — Nodemailer (Gmail SMTP) completion emails; HTML-escapes all user input
- `sounds.ts` — Audio synthesis engine with ADSR envelopes, procedural effects
- `themes.ts` — Curated themes with Turkish labels, emojis, color palettes

### Security model
- All DB access flows through API routes using `SUPABASE_SERVICE_ROLE_KEY` (RLS-bypassing) — **each route owns its own authz checks** via `getUserFromRequest` + ownership verification.
- Mutating routes validate input (`validation.ts`), return sanitized errors (`serverError`), and rate-limit public/expensive endpoints (`rateLimit`).
- RLS policies (`supabase/migrations/`) are defense-in-depth only.

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
NEXT_PUBLIC_SUPABASE_URL        # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY   # Public anon key (client auth)
SUPABASE_SERVICE_ROLE_KEY       # Service role key (server-only, API routes)
NEXT_PUBLIC_SITE_URL            # Canonical origin — OG metadata + completion email links
PEXELS_API_KEY                  # "Görsel Ara" image search
GMAIL_USER                      # Gmail SMTP sender (therapist completion emails)
GMAIL_APP_PASSWORD              # Gmail app password
```

See `.env.local.example` for the full template.
