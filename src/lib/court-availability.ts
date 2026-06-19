import type { CourtSession } from "@/lib/supabase/types";

/** Active = status active and not past expiry (null expiry = open-ended). */
export function isSessionActive(session: CourtSession): boolean {
  if (session.status !== "active") return false;
  if (!session.expires_at) return true;
  return new Date(session.expires_at).getTime() > Date.now();
}

export function countActiveSessions(sessions: CourtSession[]): number {
  return sessions.filter(isSessionActive).length;
}

export function getAvailableCourts(
  numCourts: number,
  activeSessions: CourtSession[],
  reportedOccupied = 0
): number {
  const appOccupied = countActiveSessions(activeSessions);
  const totalOccupied = Math.min(numCourts, appOccupied + reportedOccupied);
  return Math.max(0, numCourts - totalOccupied);
}

export function formatAvailableCourts(
  available: number,
  numCourts: number
): string {
  return `${available}/${numCourts}`;
}

/** Rank among open-ended sessions (1 = first timed when someone joins). */
export function getOpenTimerOrder(
  sessions: CourtSession[],
  queueEntryId: string
): number {
  const open = sessions
    .filter((s) => isSessionActive(s) && !s.expires_at)
    .sort(
      (a, b) =>
        new Date(a.started_at ?? a.created_at ?? 0).getTime() -
        new Date(b.started_at ?? b.created_at ?? 0).getTime()
    );

  const idx = open.findIndex((s) => s.queue_entry_id === queueEntryId);
  return idx >= 0 ? idx + 1 : 0;
}

export function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export function openPlayMessage(timerOrder: number): string {
  if (timerOrder <= 0) {
    return "Enjoy your time — your 30-minute timer starts when someone joins the queue.";
  }
  if (timerOrder === 1) {
    return "Enjoy your time — you'll be the first whose timer starts when someone joins the queue.";
  }
  return `Enjoy your time — you'll be the ${ordinal(timerOrder)} whose timer starts when someone joins the queue.`;
}
