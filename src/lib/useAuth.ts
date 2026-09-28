import { useCallback, useEffect, useState } from "react";
import { createClientOnlyFn } from "@tanstack/react-start";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";

import { toAuthUser, type AuthUser } from "@/lib/authUser";
import { clearKrumathSessionMarker } from "@/lib/krumathCookies";
import { APP_SLUG_PATH, getSignInUrl } from "@/lib/krumathUrls";

export type { AuthUser };

export type UseAuthResult = {
  user: AuthUser | null;
  /** True until the browser has verified the shared session. */
  checking: boolean;
  signingOut: boolean;
  signOut: () => Promise<void>;
};

const readCurrentUser = createClientOnlyFn(async (): Promise<AuthUser | null> => {
  const { getSupabaseBrowserClient } = await import("@/lib/supabase.client");
  const { data } = await getSupabaseBrowserClient().auth.getUser();
  return toAuthUser(data.user);
});

const subscribeToAuthChanges = createClientOnlyFn(
  async (onChange: (user: AuthUser | null) => void): Promise<() => void> => {
    const { getSupabaseBrowserClient } = await import("@/lib/supabase.client");
    const supabase = getSupabaseBrowserClient();
    const { data } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        onChange(toAuthUser(session?.user ?? null));
      },
    );
    return () => data.subscription.unsubscribe();
  },
);

const signOutSharedSession = createClientOnlyFn(async (): Promise<void> => {
  const { getSupabaseBrowserClient } = await import("@/lib/supabase.client");
  await getSupabaseBrowserClient().auth.signOut();
  document.cookie = clearKrumathSessionMarker(window.location.hostname);
});

/**
 * Client-side auth for the account menu and hard gate.
 * Authoritative check — reads the shared localStorage session.
 */
export function useAuth(initialUser: AuthUser | null = null): UseAuthResult {
  const [user, setUser] = useState<AuthUser | null>(initialUser);
  const [checking, setChecking] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    void (async () => {
      try {
        const current = await readCurrentUser();
        if (cancelled) return;
        setUser(current);

        unsubscribe = await subscribeToAuthChanges((next) => {
          if (!cancelled) setUser(next);
        });
      } catch {
        /* missing config or transient error — leave user as-is */
      } finally {
        if (!cancelled) setChecking(false);
      }
    })();

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  const signOut = useCallback(async () => {
    setSigningOut(true);
    try {
      await signOutSharedSession();
    } catch {
      /* still leave the app rather than show a stale session */
    } finally {
      window.location.assign(getSignInUrl(APP_SLUG_PATH));
    }
  }, []);

  return { user, checking, signingOut, signOut };
}
