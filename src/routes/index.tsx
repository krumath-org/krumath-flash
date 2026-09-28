import { createFileRoute, redirect } from "@tanstack/react-router";
import { FlashGame } from "@/components/flash/FlashGame";
import { getAuthState } from "@/lib/auth.functions";
import { APP_SLUG_PATH, getSignInUrl } from "@/lib/krumathUrls";

const title = "KruMath Flash — Mental Math Flash Game";
const description =
  "Flash numbers, calculate in your head, answer fast. A minimal mental arithmetic game for students, classrooms and projectors.";

export const Route = createFileRoute("/")({
  ssr: false,
  /**
   * Hard gate (spec §7–9): reject requests with no shared KruMath session
   * marker before rendering. Presence only — authoritative playable-user check
   * runs client-side in FlashGame via useAuth.
   * DEV skips so localhost works without a KruMath session.
   */
  beforeLoad: async () => {
    if (import.meta.env.DEV) return;
    const state = await getAuthState();
    if (!state.signedIn) {
      throw redirect({ href: getSignInUrl(APP_SLUG_PATH), reloadDocument: true });
    }
  },
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: FlashGame,
});
