/**
 * Server Supabase client is intentionally unused.
 *
 * KruMath stores the real auth session in browser `localStorage`, which SSR
 * cannot read. Hard-gate presence uses the `km_session` marker
 * (`krumathSession.server.ts`); playable-user checks and stats sync run in the
 * browser via `supabase.client.ts`.
 */
export {};
