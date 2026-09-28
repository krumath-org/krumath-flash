import { getCookies } from "@tanstack/react-start/server";

import { KRUMATH_SESSION_MARKER_COOKIE } from "@/lib/krumathCookies";

/**
 * Server-side presence check for the shared KruMath session.
 *
 * Not a cryptographic check — KruMath stores the real Supabase session in
 * `localStorage`. The only server-visible signal is the `km_session` marker.
 * Authoritative playable-user checks run in the browser via `useAuth`.
 */
export function hasKrumathSessionMarker(): boolean {
  const cookies = getCookies();
  const value = cookies[KRUMATH_SESSION_MARKER_COOKIE];
  return typeof value === "string" && value.length > 0;
}
