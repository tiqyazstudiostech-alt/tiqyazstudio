# Tiqyaz — Vercel Deployment Guide

## Overview

- **Hosting**: Vercel (MVP). Future: Docker on AWS ECS + RDS (post-MVP).
- **Database**: Neon PostgreSQL. Two connection strings are required:
  - `DATABASE_URL` — pooled (PgBouncer) connection for the running app.
  - `DIRECT_URL` — direct connection for `prisma migrate deploy` at build time.
- **Region**: `fra1` (Frankfurt) — closest Vercel region to Nairobi.
- **Migrations**: run automatically during each Vercel build via `prisma migrate deploy`.

---

## 1. One-time Vercel project setup

1. Go to [vercel.com/new](https://vercel.com/new) and import the GitHub repository.
2. Framework preset: **Next.js** (auto-detected).
3. Leave **Root Directory** blank (repo root).
4. Leave **Build Command** blank — `vercel.json` overrides it with:
   ```
   prisma migrate deploy && npm run build
   ```
5. Leave **Output Directory** blank (Next.js standalone is detected).
6. Click **Deploy** — the first deploy will fail until env vars are set (step 2).

---

## 2. Environment variables

Set these in **Project → Settings → Environment Variables**.  
Apply each to **Production**, **Preview**, and **Development** unless noted.

### Required on day one

| Variable | Where to get it | Notes |
|---|---|---|
| `DATABASE_URL` | Neon console → **Pooled connection** | `?pgbouncer=true&connect_timeout=15` |
| `DIRECT_URL` | Neon console → **Direct connection** | No pgbouncer params needed |
| `AUTH_SECRET` | `openssl rand -base64 32` | Must be unique per environment |
| `AUTH_URL` | The deployed URL (e.g. `https://tiqyaz.vercel.app`) | Production only; Vercel sets `VERCEL_URL` automatically for previews |

> **Important**: `DIRECT_URL` is used only during `prisma migrate deploy` at build time.
> Without it, migrations will run over the pooled connection and may fail on large schemas.

### Auth URL for preview deploys

Vercel generates unique URLs for every preview deploy (`*.vercel.app`).  
Auth.js v5 picks up `VERCEL_URL` automatically for previews, so `AUTH_URL` only
needs to be set explicitly in **Production**.

### Add as integrations come online

| Variable | Service |
|---|---|
| `BUNNY_API_KEY` | Bunny.net dashboard |
| `BUNNY_LIBRARY_ID` | Bunny Stream library settings |
| `BUNNY_CDN_HOSTNAME` | e.g. `vz-xxxxxxxx.b-cdn.net` |
| `RESEND_API_KEY` | Resend dashboard |
| `PAYSTACK_SECRET_KEY` | Paystack dashboard (use test key for preview) |
| `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | Paystack dashboard |
| `ANTHROPIC_API_KEY` | Anthropic console |

---

## 3. Deploy flow

### Production (`main` branch)

1. Merge a PR to `main`.
2. Vercel triggers a production build automatically.
3. Build sequence (see `vercel.json`):
   - `npm ci` → runs `postinstall: prisma generate`
   - `prisma migrate deploy` → applies pending migrations against Neon via `DIRECT_URL`
   - `npm run build` → `next build` (standalone output)
4. If the build passes, Vercel promotes the deployment to the production domain.

### Preview deploys (pull requests)

- Every PR gets its own preview URL (`https://<hash>-tiqyaz.vercel.app`).
- Uses the same env vars as Production except for `AUTH_URL` (handled via `VERCEL_URL`).
- Migrations run on the same Neon database — use a **separate Neon branch** per PR
  if you need database isolation (Neon branching is free and instant).

### Rollback

- Vercel keeps all previous deployments. Promote any previous deployment instantly
  from **Project → Deployments** without re-running the build.
- Database: migrations are forward-only (`migrate deploy`). Keep a Neon branch backup
  before any destructive migration.

---

## 4. CI (GitHub Actions)

`.github/workflows/ci.yml` runs on every PR to `main`:

- **Lint** — `eslint`
- **Typecheck** — `tsc --noEmit`

It does **not** run `next build` (Vercel handles that). The workflow uses a dummy
`DATABASE_URL` so `prisma generate` (postinstall) can generate types without a live DB.

---

## 5. Post-deploy verification checklist

After deploying to production for the first time:

- [ ] `GET /api/health` returns `{ "status": "ok" }`
- [ ] `GET /` renders the public home page
- [ ] `GET /watch` redirects to `/sign-in`
- [ ] `GET /admin` redirects to `/sign-in`
- [ ] Sign in with `admin@tiqyaz.dev` / `admin1234` and reach `/watch`
- [ ] Navigate to `/admin` — confirmed accessible for the ADMIN role
- [ ] Sign out and confirm redirect to `/`

If `/api/health` returns 503, check:
1. `DATABASE_URL` is set and points to the Neon pooled connection.
2. The Neon project is not paused (free tier auto-pauses after inactivity).

---

## 6. Cron jobs (future — requires Vercel Pro)

When the M-Pesa renewal reminder route is ready, add to `vercel.json`:

```json
"crons": [
  {
    "path": "/api/cron/renewal-reminders",
    "schedule": "0 7 * * *"
  }
]
```

Schedule: daily at **07:00 UTC** (10:00 EAT). Protect the endpoint with a
`CRON_SECRET` header check to prevent unauthorized invocations.

---

## 7. Custom domain

1. **Vercel → Project → Settings → Domains** → Add domain.
2. Add the DNS records Vercel shows (CNAME or A record) via your registrar.
3. Update `AUTH_URL` in Vercel env vars to the custom domain.
4. Redeploy (or trigger via Vercel dashboard) to pick up the new `AUTH_URL`.
