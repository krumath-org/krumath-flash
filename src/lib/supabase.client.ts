import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";

function supabaseUrl(): string {
  const url = import.meta.env["VITE_SUPABASE_URL"] as string | undefined;
  if (!url) throw new Error("Missing VITE_SUPABASE_URL. Copy .env.example and set credentials.");
  return url;
}

function supabaseAnonKey(): string {
  const key = import.meta.env["VITE_SUPABASE_ANON_KEY"] as string | undefined;
  if (!key)
    throw new Error("Missing VITE_SUPABASE_ANON_KEY. Copy .env.example and set credentials.");
  return key;
}

type BrowserClient = SupabaseClient;

let browserClient: BrowserClient | undefined;

/**
 * Memoized browser Supabase client.
 *
 * Storage is the shared KruMath session in `localStorage` — NOT `@supabase/ssr`
 * cookies. KruMath's main web app persists its session with a plain
 * `createClient(..., { auth: { storage: localStorage } })`, so nothing writes
 * an `sb-*-auth-token` cookie on `krumath.com`.
 *
 * `localStorage` is scoped per origin (not path). This app is served from
 * `krumath.com/krumath-flash` — the same origin as `krumath.com/home` — so the
 * default storage key reads the exact same session the main app wrote.
 *
 * Client-only: call from effects/handlers, never during SSR. Import dynamically
 * (`await import("@/lib/supabase.client")`) from modules that SSR so TanStack
 * Start import protection keeps it out of the server graph.
 */
export function getSupabaseBrowserClient(): BrowserClient {
  if (browserClient) return browserClient;

  browserClient = createClient(supabaseUrl(), supabaseAnonKey(), {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  });
  return browserClient;
}

/** @deprecated Prefer getSupabaseBrowserClient — kept for call-site clarity. */
export function createSupabaseBrowserClient(): BrowserClient {
  return getSupabaseBrowserClient();
}

export async function getBrowserUser(): Promise<User | null> {
  const { data } = await getSupabaseBrowserClient().auth.getUser();
  return data.user ?? null;
}
