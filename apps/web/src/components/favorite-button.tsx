"use client";

import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api-client";
import { cn } from "@/lib/utils";

export function FavoriteButton({ matchId, initialFavorited }: { matchId: string; initialFavorited: boolean }) {
  const { user } = useAuth();
  const router = useRouter();
  const [favorited, setFavorited] = useState(initialFavorited);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    if (!user) {
      router.push("/login");
      return;
    }
    setLoading(true);
    const next = !favorited;
    setFavorited(next);
    try {
      if (next) await api.post(`/favorites/${matchId}`);
      else await api.delete(`/favorites/${matchId}`);
    } catch {
      setFavorited(!next);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading}
      aria-label="Favoritar partida"
      className={cn(
        "flex h-11 w-11 items-center justify-center rounded-full bg-black/40 text-muted-foreground transition-colors hover:text-primary",
        favorited && "text-primary",
      )}
    >
      <Heart className={cn("h-5 w-5", favorited && "fill-primary")} />
    </button>
  );
}
