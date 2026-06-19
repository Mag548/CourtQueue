"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, ShieldAlert, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { isSessionActive } from "@/lib/court-availability";

type CourtRow = {
  id: string;
  name: string;
  num_courts: number;
  playing: number;
  waiting: number;
};

export function AdminCourtClearPanel() {
  const supabase = createClient();
  const [courts, setCourts] = useState<CourtRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearingId, setClearingId] = useState<string | null>(null);

  const fetchCourts = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("courts")
      .select(
        `
        id,
        name,
        num_courts,
        queue:queues(
          id,
          queue_entries(status)
        )
      `
      )
      .eq("is_active", true)
      .order("name");

    if (error) {
      toast.error("Failed to load courts");
      setLoading(false);
      return;
    }

    const rows: CourtRow[] = [];
    for (const court of data ?? []) {
      const { data: sessions } = await supabase
        .from("court_sessions")
        .select("*")
        .eq("court_id", court.id)
        .eq("status", "active");

      const queue = Array.isArray(court.queue) ? court.queue[0] : court.queue;
      const entries =
        (queue as { queue_entries?: { status: string }[] } | null)
          ?.queue_entries ?? [];

      rows.push({
        id: court.id,
        name: court.name,
        num_courts: court.num_courts,
        playing: (sessions ?? []).filter(isSessionActive).length,
        waiting: entries.filter((e) => e.status === "waiting").length,
      });
    }

    setCourts(rows);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchCourts();
  }, [fetchCourts]);

  const handleClear = async (court: CourtRow) => {
    const total = court.playing + court.waiting;
    if (total === 0) {
      toast.info(`${court.name} is already empty.`);
      return;
    }

    const confirmed = window.confirm(
      `Clear everyone at ${court.name}?\n\nThis ends ${court.playing} active session(s) and removes ${court.waiting} player(s) from the queue.`
    );
    if (!confirmed) return;

    setClearingId(court.id);
    const { data, error } = await supabase.rpc("admin_clear_court", {
      p_court_id: court.id,
    });
    setClearingId(null);

    if (error) {
      toast.error(error.message || "Failed to clear court");
      return;
    }

    const result = data as {
      sessions_cleared?: number;
      entries_cleared?: number;
    };

    toast.success(
      `Cleared ${court.name} — ${result.sessions_cleared ?? 0} session(s), ${result.entries_cleared ?? 0} queue entry(ies).`
    );
    fetchCourts();
  };

  return (
    <Card className="border-orange-500/30 bg-orange-500/[0.04]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldAlert className="w-4 h-4 text-orange-400" />
          Admin — Clear Courts
        </CardTitle>
        <CardDescription>
          End all active sessions and remove everyone from the queue at any
          court.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : courts.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No active courts found.
          </p>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {courts.map((court) => {
              const busy = court.playing + court.waiting;
              return (
                <div
                  key={court.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-white/[0.06]"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{court.name}</p>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      <Badge variant="outline" className="text-[10px] h-5">
                        {court.playing} playing
                      </Badge>
                      <Badge variant="outline" className="text-[10px] h-5">
                        {court.waiting} waiting
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="shrink-0 rounded-xl h-9"
                    disabled={busy === 0 || clearingId === court.id}
                    onClick={() => handleClear(court)}
                  >
                    {clearingId === court.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <>
                        <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                        Clear
                      </>
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
