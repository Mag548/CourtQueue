"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import type { CourtSession } from "@/lib/supabase/types";
import { courtTimerAlertMessage } from "@/lib/court-availability";

type SessionSnapshot = {
  expires_at: string | null;
  status: string;
};

/** Toast when the player on the previous court leaves or gets a timer. */
export function useCourtTimerAlerts(
  activeSessions: CourtSession[],
  userCourtNumber: number | null | undefined,
  userEntryId: string | null | undefined
) {
  const prevByCourt = useRef<Map<number, SessionSnapshot> | null>(null);

  useEffect(() => {
    if (!userCourtNumber || userCourtNumber <= 1 || !userEntryId) return;

    const mySession = activeSessions.find(
      (s) => s.queue_entry_id === userEntryId
    );
    if (!mySession || mySession.expires_at) return;

    const prevCourt = userCourtNumber - 1;
    const prevSnapshot = prevByCourt.current?.get(prevCourt);
    const prevSession = activeSessions.find(
      (s) => s.court_number === prevCourt
    );

    if (prevByCourt.current) {
      if (prevSnapshot?.status === "active" && !prevSession) {
        toast.info(courtTimerAlertMessage(userCourtNumber, "prev_left"));
      } else if (
        prevSnapshot &&
        !prevSnapshot.expires_at &&
        prevSession?.expires_at
      ) {
        toast.info(courtTimerAlertMessage(userCourtNumber, "prev_timed"));
      }
    }

    const next = new Map<number, SessionSnapshot>();
    for (const s of activeSessions) {
      if (s.court_number != null) {
        next.set(s.court_number, {
          expires_at: s.expires_at,
          status: s.status,
        });
      }
    }
    prevByCourt.current = next;
  }, [activeSessions, userCourtNumber, userEntryId]);
}
