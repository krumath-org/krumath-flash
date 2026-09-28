import type { User } from "@supabase/supabase-js";

/** Minimal account shape the UI and auth helpers exchange. */
export type AuthUser = {
  id: string;
  email: string | null;
  /** Resolved display name (profile, full_name, or email local part). */
  name: string | null;
};

/** Same rule as KruMath: reject missing and anonymous users. */
export function isPlayableUser(user: User | null): boolean {
  if (!user) return false;
  if (user.is_anonymous) return false;
  return true;
}

const NAME_METADATA_KEYS = ["name", "full_name"] as const;

/** Preferred display name for a KruMath account. */
export function resolveDisplayName(user: User | null): string | null {
  if (!user) return null;

  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  for (const key of NAME_METADATA_KEYS) {
    const value = meta[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }

  const email = user.email?.trim();
  if (email) {
    const localPart = email.split("@")[0]?.trim();
    if (localPart) return localPart;
  }

  return null;
}

/** Map a Supabase user to the UI shape (null when not playable). */
export function toAuthUser(user: User | null): AuthUser | null {
  if (!isPlayableUser(user) || !user) return null;
  return {
    id: user.id,
    email: user.email ?? null,
    name: resolveDisplayName(user),
  };
}
