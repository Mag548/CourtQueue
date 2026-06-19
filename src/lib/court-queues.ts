import type { CourtSession, Queue } from "@/lib/supabase/types";

export type CourtBreakdown = {
  tennis: number;
  pickleball_dedicated: number;
  pickleball_lined: number;
};

export type QueueWithEntries = Queue & {
  queue_entries?: { status: string }[];
};

export function parseCourtBreakdown(raw: unknown): CourtBreakdown {
  const obj =
    raw && typeof raw === "object"
      ? (raw as Record<string, unknown>)
      : {};
  return {
    tennis: Number(obj.tennis ?? 0) || 0,
    pickleball_dedicated: Number(obj.pickleball_dedicated ?? 0) || 0,
    pickleball_lined: Number(obj.pickleball_lined ?? 0) || 0,
  };
}

export function getActiveQueues(queues: QueueWithEntries[]): QueueWithEntries[] {
  return queues.filter((q) => q.is_active !== false);
}

export function resolveQueueForSport(
  queues: QueueWithEntries[],
  queueMode: string,
  sport: "tennis" | "pickleball"
): QueueWithEntries | null {
  const active = getActiveQueues(queues);
  if (queueMode === "dual") {
    const scope = sport === "tennis" ? "tennis" : "pickleball";
    return active.find((q) => q.sport_scope === scope) ?? null;
  }
  return (
    active.find((q) => q.sport_scope === "shared") ?? active[0] ?? null
  );
}

export function queueCapacity(
  queue: QueueWithEntries | null,
  fallback: number
): number {
  return Math.max(1, queue?.capacity ?? fallback);
}

export function waitingCount(queue: QueueWithEntries | null): number {
  return (
    queue?.queue_entries?.filter((e) => e.status === "waiting").length ?? 0
  );
}

export function totalWaitingCount(queues: QueueWithEntries[]): number {
  return getActiveQueues(queues).reduce(
    (sum, queue) => sum + waitingCount(queue),
    0
  );
}

export function sessionsForQueue(
  sessions: CourtSession[],
  queueId: string | null | undefined
): CourtSession[] {
  if (!queueId) return sessions;
  return sessions.filter((s) => s.queue_id === queueId);
}

export function breakdownLabel(breakdown: CourtBreakdown): string {
  const parts: string[] = [];
  if (breakdown.tennis > 0) {
    parts.push(`${breakdown.tennis} tennis`);
  }
  if (breakdown.pickleball_dedicated > 0) {
    parts.push(`${breakdown.pickleball_dedicated} pickleball`);
  }
  if (breakdown.pickleball_lined > 0) {
    parts.push(`${breakdown.pickleball_lined} multi-lined`);
  }
  return parts.join(" · ") || "Courts";
}
