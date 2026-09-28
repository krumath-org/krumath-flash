# KruMath Flash

**Watch. Calculate. Answer.**

A mental math flash trainer for students, classrooms, and projectors. Numbers flash on screen — you calculate in your head and answer fast.

Part of [krumath.com](https://krumath.com): production URL is `https://krumath.com/krumath-flash`. Uses shared KruMath authentication (hard gate) and stores per-user stats in the shared KruMath Supabase project.

English and Khmer UI, light/dark theme, fullscreen support.

## Features

- **Game modes:** Addition, Subtraction, Add / Subtract, Multiplication, Division, Mixed mental, Survival, Speed, Daily challenge
- **Difficulties:** Easy, Medium, Hard, Expert
- **Tunable play:** Numbers per round, flash time, gap between numbers, round count, countdown
- **Feedback:** Sound and vibration (where supported)
- **Cloud stats:** Games played, accuracy, streaks, and recent results synced per KruMath account (`math_flash_stats`)
- **KruMath chrome:** Home, Support (គាំទ្រ → pricing), GitHub, Account / sign-out

## Tech stack

- React 19
- TanStack Start / Router
- Vite 8 (via `@lovable.dev/vite-tanstack-config`)
- Tailwind CSS 4
- TypeScript
- Supabase Auth (shared KruMath project)

## Quick start

Requires [Node.js](https://nodejs.org/) (LTS recommended) and npm.

```sh
git clone https://github.com/sokna492-km/krumath-flash.git
cd krumath-flash
cp .env.example .env
# Fill VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (same as KruMath)
npm install
npm run dev
```

Open the URL shown in the terminal (usually `http://localhost:5173/krumath-flash/`).

**Auth:** Production requires a signed-in non-anonymous KruMath user. `npm run dev` bypasses the hard gate so you can play locally without a session. Optionally set `VITE_KRUMATH_ORIGIN` to point sign-in / home / pricing links at a local KruMath app.

Apply the SQL in `supabase/migrations/0001_math_flash_stats.sql` to the shared KruMath Supabase project before relying on cloud stats.

## Scripts

| Command           | Description                                       |
| ----------------- | ------------------------------------------------- |
| `npm run dev`     | Start the development server (hard gate bypassed) |
| `npm run build`   | Production build                                  |
| `npm run deploy`  | Build + deploy Cloudflare Worker                  |
| `npm run preview` | Preview the production build                      |
| `npm run lint`    | Run ESLint                                        |
| `npm run format`  | Format with Prettier                              |

See [DEPLOY.md](./DEPLOY.md) for Cloudflare routing and the integration handoff. Full contract: [KRUMATH_PROJECT_INTEGRATION.md](./KRUMATH_PROJECT_INTEGRATION.md).

## Contributing

Issues and pull requests are welcome.

## License

[MIT](LICENSE)
