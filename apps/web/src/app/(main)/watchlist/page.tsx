"use client";

import type { MatchSummary } from "@tribuna/shared";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { MatchCard } from "@/components/match-card";
import { EmptyState, ErrorState, GridSkeleton } from "@/components/states";
import { useAuth } from "@/lib/auth-context";
import { fetcher } from "@/lib/api-client";

export default function WatchlistPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { data, error, isLoading } = useSWR<MatchSummary[]>(user ? "/watchlist" : null, fetcher);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [authLoading, user, router]);

  if (authLoading || !user) return null;

  return (
    <div className="container space-y-6 py-6">
      <div>
        <h1 className="font-display text-3xl tracking-wide">Watchlist</h1>
        <p className="text-sm text-muted-foreground">Partidas futuras que você quer assistir.</p>
      </div>

      {isLoading && <GridSkeleton />}
      {error && <ErrorState message="Não foi possível carregar sua watchlist." />}
      {data && data.length === 0 && (
        <EmptyState
          title="Sua watchlist está vazia"
          description="Adicione partidas futuras que você não quer perder na página de cada jogo."
        />
      )}
      {data && data.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((m) => (
            <MatchCard key={m.id} match={m} />
          ))}
        </div>
      )}
    </div>
  );
}
