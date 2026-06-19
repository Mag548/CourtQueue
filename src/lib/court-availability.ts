import type { CourtSession } from "@/lib/supabase/types";

/** Active = status active and not past expiry (null expiry = no timer while queue empty). */
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

/** Rank among untimed sessions (1 = first to get a timer when someone waits in line). */
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

export function courtAssignmentMessage(
  courtNumber: number,
  activeSessionCount: number
): string {
  if (courtNumber === 1) {
    if (activeSessionCount <= 1) {
      return "You are on Court #1. Since you're the only one here, if all the courts fill up and someone joins the queue, your 30 min timer will start.";
    }
    return "You are on Court #1. You're first in line — if all the courts fill up and someone joins the queue, your 30 min timer will start.";
  }

  return `You are on Court #${courtNumber}. When the player on Court #${courtNumber - 1} leaves, you'll be next — your 30 min timer will start if someone joins the queue.`;
}

export function courtTimerAlertMessage(
  courtNumber: number,
  event: "prev_left" | "prev_timed"
): string {
  const prevCourt = courtNumber - 1;
  if (event === "prev_left") {
    return `Court #${prevCourt} is open. You're on Court #${courtNumber} — your 30 min timer will start if someone joins the queue.`;
  }
  return `Court #${prevCourt}'s timer has started. You're on Court #${courtNumber} — your timer will start if another person joins the queue.`;
}
