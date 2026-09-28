import { useEffect, useRef, useState } from "react";
import { LogOut, UserRound } from "lucide-react";

import { IconTooltip } from "@/components/flash/IconTooltip";
import type { AuthUser } from "@/lib/authUser";

const iconBtnClass =
  "inline-flex size-9 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground active:scale-[0.96]";

interface AccountMenuProps {
  user: AuthUser | null;
  signInHref: string;
  onSignOut: () => void | Promise<void>;
  signingOut?: boolean;
  signInLabel: string;
  accountLabel: string;
  signOutLabel: string;
  signingOutLabel: string;
}

/**
 * Compact toolbar account control (spec §12).
 * Signed out → KruMath sign-in link. Signed in → identity + logout.
 */
export function AccountMenu({
  user,
  signInHref,
  onSignOut,
  signingOut = false,
  signInLabel,
  accountLabel,
  signOutLabel,
  signingOutLabel,
}: AccountMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  if (!user) {
    return (
      <IconTooltip label={signInLabel} side="bottom">
        <a href={signInHref} aria-label={signInLabel} className={iconBtnClass}>
          <UserRound className="size-4" strokeWidth={1.75} aria-hidden />
        </a>
      </IconTooltip>
    );
  }

  const displayName = user.name ?? user.email ?? "KruMath";
  const initial = (displayName.trim()[0] ?? "K").toUpperCase();

  return (
    <div ref={containerRef} className="relative">
      <IconTooltip label={accountLabel} side="bottom">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={accountLabel}
          aria-haspopup="menu"
          aria-expanded={open}
          className={`${iconBtnClass} font-semibold text-foreground`}
        >
          <span
            className="flex size-6 items-center justify-center rounded-full bg-primary text-[0.65rem] font-bold text-primary-foreground"
            aria-hidden
          >
            {initial}
          </span>
        </button>
      </IconTooltip>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+0.35rem)] z-50 min-w-[12.5rem] overflow-hidden rounded-xl border border-border bg-card shadow-lg"
        >
          <div className="border-b border-border/80 px-3 py-2.5">
            <p className="truncate text-sm font-semibold text-foreground">{displayName}</p>
            {user.email ? (
              <p className="mt-0.5 truncate text-xs text-muted-foreground">{user.email}</p>
            ) : null}
          </div>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              void onSignOut();
            }}
            disabled={signingOut}
            className="flex w-full cursor-pointer items-center gap-2 px-3 py-2.5 text-left text-sm font-medium text-foreground transition-colors hover:bg-secondary disabled:opacity-60"
          >
            <LogOut className="size-4 text-muted-foreground" aria-hidden />
            <span>{signingOut ? signingOutLabel : signOutLabel}</span>
          </button>
        </div>
      )}
    </div>
  );
}
