"use client";

import { Bookmark, BookmarkCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError } from "@/lib/api-client";
import { cn } from "@/lib/utils";

interface WatchlistButtonProps {
  matchId: string;
  initialInWatchlist: boolean;
  canAdd: boolean;
  size?: "sm" | "default";
  className?: string;
}

export function WatchlistButton({
  matchId,
  initialInWatchlist,
  canAdd,
  size = "default",
  className,
}: WatchlistButtonProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [inWatchlist, setInWatchlist] = useState(initialInWatchlist);
  const [loading, setLoading] = useState(false);

  if (!canAdd && !inWatchlist) return null;

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      router.push("/login");
      return;
    }
    setLoading(true);
    try {
      if (inWatchlist) {
        await api.delete(`/watchlist/${matchId}`);
        setInWatchlist(false);
      } else {
        await api.post("/watchlist", { matchId });
        setInWatchlist(true);
      }
    } catch (err) {
      if (err instanceof ApiError) {
        // Match is no longer eligible (e.g. kicked off) — reflect reality instead of a fake state.
        console.error(err.message);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      onClick={toggle}
      disabled={loading}
      variant={inWatchlist ? "secondary" : "default"}
      size={size}
      className={cn("gap-2", className)}
    >
      {inWatchlist ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
      {inWatchlist ? "Na minha Watchlist" : "Quero assistir"}
    </Button>
  );
}
