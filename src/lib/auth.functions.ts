import { createServerFn } from "@tanstack/react-start";

import type { AuthUser } from "@/lib/authUser";

export type { AuthUser };

export type AuthState = {
  /** True when a shared KruMath session marker was present on the request. */
  signedIn: boolean;
  /** Always null from the server — identity is resolved in the browser. */
  user: AuthUser | null;
};

/**
 * Server-side KruMath session presence check (spec sections 7–9).
 * Presence only; authoritative playable-user check is `useAuth`.
 */
export const getAuthState = createServerFn({ method: "GET" }).handler(
  async (): Promise<AuthState> => {
    const { hasKrumathSessionMarker } = await import("@/lib/krumathSession.server");
    return { signedIn: hasKrumathSessionMarker(), user: null };
  },
);
