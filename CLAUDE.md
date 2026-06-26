# Tiqyaz Streaming Platform — Project Conventions

## What this is
A media streaming web app (film, series, later podcasts) for Tiqyaz Studios.
Three surfaces in one codebase: public site, viewer app, admin/CMS.

## Stack
Next.js (App Router) + TypeScript (strict) · Tailwind · PostgreSQL (Neon) + Prisma ·
Auth.js v5 · Bunny Stream (video) · R2/S3 (images) · Resend (email) ·
Paystack (payments) · Claude API (AI).

## Hosting
MVP on Vercel. Target architecture is Docker on AWS (ECS + RDS), deferred to
post-MVP. Stay portable: `output: "standalone"`, integrations in lib/, no
Vercel-proprietary services, standard Postgres only.

## Folder structure
- `app/`            App Router routes (group by surface: (public), (viewer), (admin))
- `app/api/`        Route handlers
- `components/ui/`  Design-system primitives ONLY
- `components/`     Feature components
- `lib/`            Integrations + helpers (bunny.ts, paystack.ts, ai.ts, email.ts)
- `lib/auth.ts`     Auth.js v5 config + exported `auth()` helper
- `proxy.ts`        Route protection (Next.js 16 middleware replacement)
- `lib/db.ts`       Prisma singleton
- `prisma/`         schema + migrations + seed

## Coding conventions
- Server Components by default; add "use client" only when needed.
- TypeScript strict; no `any`. Validate all external input with zod.
- Prisma client imported from lib/db.ts (singleton; avoid pooled-connection exhaustion).
- Soft-delete with an `isDeleted` boolean; never hard-delete user/content data.
- Auth on the server via the Auth.js v5 `auth()` helper exported from lib/auth.ts.
  Route protection lives in proxy.ts (Next 16). Admin routes check role === "ADMIN".
- No hardcoded colors/spacing/fonts — use design tokens. Compose from components/ui.

## Streaming rules (critical)
- NEVER proxy large video files through the app server — admin uploads go
  browser -> Bunny directly (TUS/resumable).
- All playback URLs are token-signed; no raw stream URLs in the client.

## Event logging (critical)
All user interactions (play, skip, like, watchlist, search, onboarding) MUST be
recorded via `lib/events.ts` `logEvent()`. Never write WatchEvent rows directly.

## Workflow
- One vertical slice per task (schema -> API -> UI), end to end.
- Conventional commits, one feature per commit. Typecheck + lint before committing.