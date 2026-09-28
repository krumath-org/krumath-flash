/**
 * KruMath shared-session contract.
 *
 * IMPORTANT: KruMath's main web app keeps its Supabase session in `localStorage`,
 * not in `@supabase/ssr` cookies — see
 * `KruMath/apps/web/src/config/supabase-browser.ts`.
 *
 * The only cookie it exposes is the `km_session` presence marker, set by
 * KruMath's AuthContext on sign-in and cleared on logout. Server-side hard-gate
 * checks use that marker; the authoritative playable-user check runs in the
 * browser via `useAuth`.
 */

/** Presence marker cookie name — must match KruMath's AuthContext. */
export const KRUMATH_SESSION_MARKER_COOKIE = "km_session";

/**
 * Shared auth cookie domain for production `krumath.com`.
 * Returns `undefined` on localhost so cookies stay host-only.
 */
export function getKrumathCookieDomain(hostname: string | undefined | null): string | undefined {
  if (!hostname) return undefined;
  const host = hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".localhost")) return undefined;
  if (host === "krumath.com" || host.endsWith(".krumath.com")) return ".krumath.com";
  return undefined;
}

/**
 * `document.cookie` assignment that clears the KruMath presence marker.
 * Mirrors KruMath's clear attributes so deletion targets the same cookie.
 */
export function clearKrumathSessionMarker(hostname: string | undefined | null): string {
  const domain = getKrumathCookieDomain(hostname);
  const domainAttr = domain ? `; Domain=${domain}` : "";
  return `${KRUMATH_SESSION_MARKER_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax${domainAttr}`;
}
