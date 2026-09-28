import { createClientOnlyFn } from "@tanstack/react-start";

import type { Difficulty, Mode } from "@/lib/flash/engine";
import { emptyStats, persistStats, type GameRecord, type Stats } from "@/lib/flash/storage";

const TABLE = "math_flash_stats";
const SYNC_DEBOUNCE_MS = 800;

const RANK: Difficulty[] = ["easy", "medium", "hard", "expert"];

function isDifficulty(value: unknown): value is Difficulty {
  return value === "easy" || value === "medium" || value === "hard" || value === "expert";
}

function isMode(value: unknown): value is Mode {
  return (
    value === "add" ||
    value === "sub" ||
    value === "mixed" ||
    value === "mul" ||
    value === "div" ||
    value === "mental" ||
    value === "survival" ||
    value === "speed" ||
    value === "daily"
  );
}

function parseGameRecord(raw: unknown): GameRecord | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (typeof r["at"] !== "number") return null;
  if (!isMode(r["mode"]) || !isDifficulty(r["difficulty"])) return null;
  if (typeof r["score"] !== "number" || typeof r["correct"] !== "number") return null;
  if (typeof r["total"] !== "number" || typeof r["bestStreak"] !== "number") return null;
  if (typeof r["durationMs"] !== "number") return null;
  return {
    at: r["at"],
    mode: r["mode"],
    difficulty: r["difficulty"],
    score: r["score"],
    correct: r["correct"],
    total: r["total"],
    bestStreak: r["bestStreak"],
    durationMs: r["durationMs"],
  };
}

/** Coerce a remote jsonb blob into a Stats shape. */
export function normalizeStats(raw: unknown): Stats {
  if (!raw || typeof raw !== "object") return { ...emptyStats };
  const s = raw as Record<string, unknown>;
  const recentRaw = Array.isArray(s["recent"]) ? s["recent"] : [];
  const recent = recentRaw
    .map(parseGameRecord)
    .filter((rec): rec is GameRecord => rec !== null)
    .slice(0, 15);

  const daily: Stats["daily"] = {};
  if (s["daily"] && typeof s["daily"] === "object") {
    for (const [key, value] of Object.entries(s["daily"] as Record<string, unknown>)) {
      if (!value || typeof value !== "object") continue;
      const d = value as Record<string, unknown>;
      if (
        typeof d["score"] === "number" &&
        typeof d["correct"] === "number" &&
        typeof d["total"] === "number"
      ) {
        daily[key] = { score: d["score"], correct: d["correct"], total: d["total"] };
      }
    }
  }

  return {
    gamesPlayed: typeof s["gamesPlayed"] === "number" ? s["gamesPlayed"] : 0,
    questions: typeof s["questions"] === "number" ? s["questions"] : 0,
    correct: typeof s["correct"] === "number" ? s["correct"] : 0,
    bestScore: typeof s["bestScore"] === "number" ? s["bestScore"] : 0,
    bestStreak: typeof s["bestStreak"] === "number" ? s["bestStreak"] : 0,
    fastestFlashMs: typeof s["fastestFlashMs"] === "number" ? s["fastestFlashMs"] : null,
    highestDifficulty: isDifficulty(s["highestDifficulty"]) ? s["highestDifficulty"] : null,
    recent,
    daily,
  };
}

function betterDaily(
  a: { score: number; correct: number; total: number },
  b: { score: number; correct: number; total: number },
): { score: number; correct: number; total: number } {
  if (a.score > b.score) return a;
  if (a.score === b.score && a.correct > b.correct) return a;
  return b;
}

/**
 * Merge local and remote stats.
 * Bests use max/min; daily keeps best per day; recent unions by `at` (cap 15);
 * counters take Math.max to avoid double-counting after the first sync.
 */
export function mergeStats(local: Stats, remote: Stats): Stats {
  const recentMap = new Map<number, GameRecord>();
  for (const record of remote.recent) recentMap.set(record.at, record);
  for (const record of local.recent) recentMap.set(record.at, record);
  const recent = Array.from(recentMap.values())
    .sort((a, b) => b.at - a.at)
    .slice(0, 15);

  const daily: Stats["daily"] = { ...remote.daily };
  for (const [key, value] of Object.entries(local.daily)) {
    const prev = daily[key];
    daily[key] = prev ? betterDaily(value, prev) : value;
  }

  let highestDifficulty: Difficulty | null = local.highestDifficulty;
  if (
    remote.highestDifficulty &&
    (!highestDifficulty || RANK.indexOf(remote.highestDifficulty) > RANK.indexOf(highestDifficulty))
  ) {
    highestDifficulty = remote.highestDifficulty;
  }

  let fastestFlashMs: number | null = local.fastestFlashMs;
  if (remote.fastestFlashMs !== null) {
    fastestFlashMs =
      fastestFlashMs === null
        ? remote.fastestFlashMs
        : Math.min(fastestFlashMs, remote.fastestFlashMs);
  }

  return {
    gamesPlayed: Math.max(local.gamesPlayed, remote.gamesPlayed),
    questions: Math.max(local.questions, remote.questions),
    correct: Math.max(local.correct, remote.correct),
    bestScore: Math.max(local.bestScore, remote.bestScore),
    bestStreak: Math.max(local.bestStreak, remote.bestStreak),
    fastestFlashMs,
    highestDifficulty,
    recent,
    daily,
  };
}

const fetchRemoteStats = createClientOnlyFn(async (userId: string): Promise<Stats | null> => {
  try {
    const { getSupabaseBrowserClient } = await import("@/lib/supabase.client");
    const { data, error } = await getSupabaseBrowserClient()
      .from(TABLE)
      .select("stats")
      .eq("user_id", userId)
      .maybeSingle();

    if (error || !data) return null;
    const row = data as { stats: unknown };
    return normalizeStats(row.stats);
  } catch {
    return null;
  }
});

const pushRemoteStats = createClientOnlyFn(async (userId: string, stats: Stats): Promise<void> => {
  try {
    const { getSupabaseBrowserClient } = await import("@/lib/supabase.client");
    await getSupabaseBrowserClient()
      .from(TABLE)
      .upsert(
        { user_id: userId, stats, updated_at: new Date().toISOString() },
        { onConflict: "user_id" },
      );
  } catch {
    /* best-effort — never block play */
  }
});

export async function loadStatsFromSupabase(userId: string): Promise<Stats | null> {
  if (typeof window === "undefined" || !userId) return null;
  return fetchRemoteStats(userId);
}

export async function syncStatsToSupabase(userId: string, stats: Stats): Promise<void> {
  if (typeof window === "undefined" || !userId) return;
  await pushRemoteStats(userId, stats);
}

/** Load remote stats, merge with local, persist both sides. */
export async function hydrateStatsFromCloud(userId: string, local: Stats): Promise<Stats> {
  const remote = await loadStatsFromSupabase(userId);
  if (!remote) {
    await syncStatsToSupabase(userId, local);
    return local;
  }
  const merged = mergeStats(local, remote);
  persistStats(merged);
  await syncStatsToSupabase(userId, merged);
  return merged;
}

export { SYNC_DEBOUNCE_MS };
