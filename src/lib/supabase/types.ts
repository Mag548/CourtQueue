export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      court_sessions: {
        Row: {
          court_id: string
          court_number: number | null
          created_at: string | null
          expires_at: string | null
          extended: boolean | null
          id: string
          queue_entry_id: string | null
          queue_id: string | null
          started_at: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          court_id: string
          court_number?: number | null
          created_at?: string | null
          expires_at?: string | null
          extended?: boolean | null
          id?: string
          queue_entry_id?: string | null
          queue_id?: string | null
          started_at?: string | null
          status?: string
          user_id?: string | null
        }
        Update: {
          court_id?: string
          court_number?: number | null
          created_at?: string | null
          expires_at?: string | null
          extended?: boolean | null
          id?: string
          queue_entry_id?: string | null
          queue_id?: string | null
          started_at?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "court_sessions_court_id_fkey"
            columns: ["court_id"]
            isOneToOne: false
            referencedRelation: "courts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "court_sessions_queue_entry_id_fkey"
            columns: ["queue_entry_id"]
            isOneToOne: false
            referencedRelation: "queue_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "court_sessions_queue_id_fkey"
            columns: ["queue_id"]
            isOneToOne: false
            referencedRelation: "queues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "court_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      court_traffic_reports: {
        Row: {
          id: string
          court_id: string
          user_id: string | null
          occupied_courts: number
          note: string | null
          reported_at: string
        }
        Insert: {
          id?: string
          court_id: string
          user_id?: string | null
          occupied_courts: number
          note?: string | null
          reported_at?: string
        }
        Update: {
          id?: string
          court_id?: string
          user_id?: string | null
          occupied_courts?: number
          note?: string | null
          reported_at?: string
        }
        Relationships: []
      }
      courts: {
        Row: {
          address: string | null
          amenities: string[] | null
          court_breakdown: Json
          court_type: string
          created_at: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          latitude: number
          longitude: number
          name: string
          num_courts: number
          queue_mode: string
        }
        Insert: {
          address?: string | null
          amenities?: string[] | null
          court_breakdown?: Json
          court_type: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          latitude: number
          longitude: number
          name: string
          num_courts?: number
          queue_mode?: string
        }
        Update: {
          address?: string | null
          amenities?: string[] | null
          court_breakdown?: Json
          court_type?: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          latitude?: number
          longitude?: number
          name?: string
          num_courts?: number
          queue_mode?: string
        }
        Relationships: []
      }
      queue_entries: {
        Row: {
          assigned_court_number: number | null
          extended_at: string | null
          id: string
          invite_code: string | null
          joined_at: string | null
          notified_at: string | null
          party_size: number
          position: number
          queue_id: string
          sport: string
          started_playing_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          assigned_court_number?: number | null
          extended_at?: string | null
          id?: string
          invite_code?: string | null
          joined_at?: string | null
          notified_at?: string | null
          party_size?: number
          position: number
          queue_id: string
          sport: string
          started_playing_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          assigned_court_number?: number | null
          extended_at?: string | null
          id?: string
          invite_code?: string | null
          joined_at?: string | null
          notified_at?: string | null
          party_size?: number
          position?: number
          queue_id?: string
          sport?: string
          started_playing_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "queue_entries_queue_id_fkey"
            columns: ["queue_id"]
            isOneToOne: false
            referencedRelation: "queues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "queue_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      queues: {
        Row: {
          capacity: number | null
          court_id: string
          created_at: string | null
          id: string
          is_active: boolean | null
          sport_scope: string
        }
        Insert: {
          capacity?: number | null
          court_id: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          sport_scope?: string
        }
        Update: {
          capacity?: number | null
          court_id?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          sport_scope?: string
        }
        Relationships: [
          {
            foreignKeyName: "queues_court_id_fkey"
            columns: ["court_id"]
            isOneToOne: false
            referencedRelation: "courts"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          preferred_sport: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          preferred_sport?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          preferred_sport?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      expire_old_sessions: { Args: Record<string, never>; Returns: undefined }
      generate_invite_code: { Args: Record<string, never>; Returns: string }
      get_open_session_timer_order: {
        Args: { p_court_id: string; p_entry_id: string }
        Returns: number
      }
      process_after_queue_join: {
        Args: { p_entry_id: string }
        Returns: Json
      }
      promote_waiting_player: {
        Args: { p_queue_id: string }
        Returns: Json
      }
      reorder_queue: { Args: { p_queue_id: string }; Returns: undefined }
      sync_court_timers: {
        Args: { p_queue_id: string }
        Returns: undefined
      }
      admin_clear_court: {
        Args: { p_court_id: string }
        Returns: Json
      }
      is_app_admin: { Args: Record<string, never>; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Convenience types
export type User = Database["public"]["Tables"]["users"]["Row"];
export type Court = Database["public"]["Tables"]["courts"]["Row"];
export type Queue = Database["public"]["Tables"]["queues"]["Row"];
export type QueueEntry = Database["public"]["Tables"]["queue_entries"]["Row"];
export type CourtSession = Database["public"]["Tables"]["court_sessions"]["Row"];

export type CourtBreakdown = {
  tennis: number;
  pickleball_dedicated: number;
  pickleball_lined: number;
};

export type CourtWithQueue = Court & {
  court_breakdown: CourtBreakdown;
  queues: (Queue & { queue_entries: QueueEntry[] })[];
  queue: (Queue & { queue_entries: QueueEntry[] }) | null;
  active_sessions: CourtSession[];
};
