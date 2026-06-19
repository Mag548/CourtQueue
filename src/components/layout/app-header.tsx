"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { MaterialIcon } from "@/components/ui/material-icon";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@/lib/brand";

type SportFilter = "all" | "tennis" | "pickleball";

interface AppHeaderProps {
  search?: string;
  onSearchChange?: (value: string) => void;
  filter?: SportFilter;
  onFilterChange?: (filter: SportFilter) => void;
  showSearch?: boolean;
  showSportToggle?: boolean;
  /** Inline in page flow (desktop sidebar layout) vs fixed over map */
  variant?: "floating" | "inline";
  /** Slide header off-screen (mobile map view when bottom sheet is expanded) */
  dismissed?: boolean;
  className?: string;
}

export function AppHeader({
  search = "",
  onSearchChange,
  filter = "all",
  onFilterChange,
  showSearch = false,
  showSportToggle = false,
  variant = "floating",
  dismissed = false,
  className,
}: AppHeaderProps) {
  const { user, profile } = useAuth();
  const router = useRouter();
  const isFloating = variant === "floating";

  const bar = (
    <header
      className={cn(
        "flex items-center gap-2 sm:gap-3",
        "rounded-full border border-white/10 bg-surface/80 backdrop-blur-xl",
        "px-3 sm:px-5 py-2 sm:py-3 shadow-[0px_40px_40px_-10px_rgba(19,19,19,0.4)]",
        !isFloating && className
      )}
    >
      <Link href="/app" className="flex items-center gap-2 shrink-0">
        <MaterialIcon
          name="sports_tennis"
          filled
          className="text-primary-fixed text-xl"
        />
        <span className="text-lg font-bold tracking-tighter text-primary-fixed hidden sm:inline">
          {APP_NAME}
        </span>
      </Link>

      {showSearch && onSearchChange && (
        <div className="flex-1 min-w-0 relative">
          <MaterialIcon
            name="search"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-base pointer-events-none"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search courts…"
            className="w-full h-9 sm:h-10 bg-white/5 border border-white/10 rounded-full py-2 pl-9 pr-3 text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary-container/30 transition-all"
          />
        </div>
      )}

      <div className="flex items-center gap-2 shrink-0">
        {showSportToggle && onFilterChange && (
          <div className="hidden sm:flex bg-white/5 rounded-full p-1 border border-white/10">
            {(["tennis", "pickleball"] as const).map((sport) => (
              <button
                key={sport}
                type="button"
                onClick={() =>
                  onFilterChange(filter === sport ? "all" : sport)
                }
                className={cn(
                  "px-3 py-1.5 rounded-full label-caps transition-all capitalize",
                  filter === sport
                    ? "bg-primary-container text-on-primary-container"
                    : "text-on-surface-variant hover:text-primary"
                )}
              >
                {sport}
              </button>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={() => router.push(user ? "/profile" : "/auth")}
          className="h-9 w-9 sm:h-10 sm:w-10 rounded-full border border-white/20 bg-surface-container overflow-hidden active:scale-95 transition-transform shrink-0"
        >
          {user ? (
            <Avatar className="h-full w-full">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-surface-container-high text-primary-fixed text-sm font-semibold">
                {profile?.full_name?.[0]?.toUpperCase() ??
                  user.email?.[0]?.toUpperCase() ??
                  "U"}
              </AvatarFallback>
            </Avatar>
          ) : (
            <div className="h-full w-full flex items-center justify-center">
              <MaterialIcon name="person" className="text-on-surface-variant" />
            </div>
          )}
        </button>
      </div>
    </header>
  );

  if (!isFloating) {
    return bar;
  }

  return (
    <div
      className={cn(
        "fixed top-0 inset-x-0 z-50 px-4 sm:px-5 pt-[max(1rem,env(safe-area-inset-top,0px))]",
        "transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]",
        dismissed && "-translate-y-[110%] opacity-0 pointer-events-none",
        className
      )}
    >
      <div className="max-w-2xl mx-auto">{bar}</div>
    </div>
  );
}
