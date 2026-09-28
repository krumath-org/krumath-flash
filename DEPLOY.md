# KruMath Flash — operator checklist

Feature app for **krumath.com/krumath-flash**. **Hard gate:** the whole app requires a signed-in non-anonymous KruMath Supabase user. Stats sync to shared Supabase (`math_flash_stats`); settings/theme/locale stay device-local.

Follow the full playbook in [KRUMATH_PROJECT_INTEGRATION.md](./KRUMATH_PROJECT_INTEGRATION.md). This file is the app-specific checklist.

## Handoff contract (§20)

```text
Project name: KruMath Flash
Project slug: krumath-flash
GitHub: https://github.com/sokna492-km/krumath-flash
Cloudflare Worker name: krumath-flash
Production URL: https://krumath.com/krumath-flash
Authentication model: Hard gate
Supabase project: Existing KruMath Supabase
Required environment variables:
  VITE_SUPABASE_URL
  VITE_SUPABASE_ANON_KEY
  VITE_KRUMATH_ORIGIN (optional, for local cross-origin sign-in)
Required database tables/policies:
  math_flash_stats (own-row RLS + math_flash_is_member)
Any required KruMath main-app changes:
  Confirm /sign-in returnUrl validation
  Optional /home entry linking to /krumath-flash
Cloudflare route: krumath.com/krumath-flash*
Verification status: see checklist below
Known limitations:
  DEV bypasses the hard gate for localhost play
  First local↔cloud stats merge uses Math.max on counters (slight overcount risk once)
  Settings/theme/locale are not synced
```

## Feature repo (done in code)

- [x] Path: `/krumath-flash` (Vite `base` + Nitro `baseURL`)
- [x] Hard gate → `/sign-in?returnUrl=/krumath-flash` (server marker + client playable-user check)
- [x] DEV bypass for local play without KruMath session
- [x] Home → `/home`
- [x] Support (គាំទ្រ) → `/pricing`
- [x] GitHub → project repository
- [x] Account menu: identity + shared `signOut()`
- [x] Stats: localStorage + `math_flash_stats` cloud sync
- [x] Migration SQL ready: [supabase/migrations/0001_math_flash_stats.sql](./supabase/migrations/0001_math_flash_stats.sql)
- [x] `math_flash_stats` applied on shared KruMath Supabase (RLS + 4 policies + `math_flash_is_member`)
- [x] `.env.example` documents `VITE_SUPABASE_*`
- [x] Does not edit the KruMath monorepo UI

## Apply database (operator)

Paste and run the contents of `supabase/migrations/0001_math_flash_stats.sql` in the shared KruMath Supabase **SQL Editor** if not already applied. That creates:

- `public.math_flash_stats`
- `public.math_flash_is_member()`
- Own-row RLS policies (reject anonymous)

**Status:** applied on shared KruMath Supabase.

## Phase B — Cloudflare (operator)

1. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (same project as KruMath) at **build** time.
2. Apply `math_flash_stats` SQL (above) if not already applied.
3. Deploy: `npm run deploy` (build + `wrangler deploy` with Worker name `krumath-flash`).
4. Route is configured in Nitro/wrangler:

   ```text
   krumath.com/krumath-flash*  →  krumath-flash
   ```

5. Smoke-test:
   - Unsigned / anonymous: redirected to `/sign-in?returnUrl=/krumath-flash`
   - After sign-in: returns to `/krumath-flash` and can play
   - Home / Support / GitHub / Account controls work
   - Logout clears shared session; reopening requires sign-in
   - Finished games update Stats UI and `math_flash_stats`
   - Assets load from `/krumath-flash/assets/...`

## Phase C — Maintainer only (not this repo)

After the URL works, add a home entry on **krumath.com/home** linking to `/krumath-flash` in a separate KruMath PR. Confirm `/sign-in` validates `returnUrl` safely.
