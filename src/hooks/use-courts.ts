"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { isSessionActive } from "@/lib/court-availability";
import type { CourtWithQueue, Court, CourtSession } from "@/lib/supabase/types";

async function fetchActiveSessions(
  supabase: ReturnType<typeof createClient>,
  courtId: string
): Promise<CourtSession[]> {
  const { data } = await supabase
    .from("court_sessions")
    .select("*")
    .eq("court_id", courtId)
    .eq("status", "active");

  return (data ?? []).filter(isSessionActive);
}

function withQueueData(
  court: Record<string, unknown>,
  sessions: CourtSession[]
): CourtWithQueue {
  const queue = Array.isArray(court.queue) ? court.queue[0] : court.queue;

  return {
    ...(court as CourtWithQueue),
    queue: queue
      ? {
          ...queue,
          queue_entries: (queue.queue_entries || []).filter(
            (e: { status: string }) => e.status === "waiting"
          ),
        }
      : null,
    active_sessions: sessions,
  };
}

export function useCourts() {
  const [courts, setCourts] = useState<CourtWithQueue[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchCourts = useCallback(async () => {
    await supabase.rpc("expire_old_sessions");

    const { data, error } = await supabase
      .from("courts")
      .select(
        `
        *,
        queue:queues(
          *,
          queue_entries(*)
        )
      `
      )
      .eq("is_active", true)
      .order("name");

    if (error) {
      console.error("Error fetching courts:", error);
      return;
    }

    const courtsWithSessions = await Promise.all(
      (data || []).map(async (court) => {
        const sessions = await fetchActiveSessions(supabase, court.id);
        return withQueueData(court, sessions);
      })
    );

    setCourts(courtsWithSessions);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchCourts();

    const channel = supabase
      .channel("courts-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "queue_entries" },
        () => fetchCourts()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "court_sessions" },
        () => fetchCourts()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, fetchCourts]);

  return { courts, loading, refetch: fetchCourts };
}

export function useCourt(courtId: string) {
  const [court, setCourt] = useState<CourtWithQueue | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchCourt = useCallback(async () => {
    const { data, error } = await supabase
      .from("courts")
      .select(
        `
        *,
        queue:queues(
          *,
          queue_entries(*)
        )
      `
      )
      .eq("id", courtId)
      .single();

    if (error || !data) return;

    const sessions = await fetchActiveSessions(supabase, courtId);
    setCourt(withQueueData(data, sessions));
    setLoading(false);
  }, [supabase, courtId]);

  useEffect(() => {
    fetchCourt();

    const channel = supabase
      .channel(`court-${courtId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "queue_entries",
        },
        () => fetchCourt()
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "court_sessions",
          filter: `court_id=eq.${courtId}`,
        },
        () => fetchCourt()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, courtId, fetchCourt]);

  return { court, loading, refetch: fetchCourt };
}

export function useCourtSearch(courts: Court[]) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "tennis" | "pickleball">("all");

  const filtered = courts.filter((court) => {
    const matchesQuery =
      query === "" ||
      court.name.toLowerCase().includes(query.toLowerCase()) ||
      court.address?.toLowerCase().includes(query.toLowerCase());

    const matchesFilter =
      filter === "all" ||
      court.court_type === filter ||
      court.court_type === "both";

    return matchesQuery && matchesFilter;
  });

  return { filtered, query, setQuery, filter, setFilter };
}
