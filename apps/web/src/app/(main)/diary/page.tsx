"use client";

import type { DiaryEntry } from "@tribuna/shared";
import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { RatingStars } from "@/components/rating-stars";
import { TeamBadge } from "@/components/team-badge";
import { EmptyState, ErrorState, GridSkeleton } from "@/components/states";
import { useAuth } from "@/lib/auth-context";
import { fetcher } from "@/lib/api-client";
import { formatDateShort } from "@/lib/utils";

export default function DiaryPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { data, error, isLoading } = useSWR<DiaryEntry[]>(user ? "/diary" : null, fetcher);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [authLoading, user, router]);

  if (authLoading || !user) return null;

  const groups = new Map<string, DiaryEntry[]>();
  (data ?? []).forEach((entry) => {
    const key = formatDateShort(entry.match.dateTime);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(entry);
  });

  return (
    <div className="container max-w-2xl space-y-6 py-6">
      <div>
        <h1 className="font-display text-3xl tracking-wide">Diário</h1>
        <p className="text-sm text-muted-foreground">Partidas que você já assistiu e avaliou.</p>
      </div>

      {isLoading && <GridSkeleton count={3} className="space-y-4" />}
      {error && <ErrorState message="Não foi possível carregar seu diário." />}
      {data && data.length === 0 && (
        <EmptyState
          title="Seu diário está vazio"
          description="Avalie uma partida para começar a construir seu histórico."
        />
      )}

      {[...groups.entries()].map(([date, entries]) => (
        <div key={date}>
          <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground">{date}</p>
          <div className="space-y-2">
            {entries.map((entry) => (
              <Link
                key={entry.ratingId}
                href={`/matches/${entry.match.id}`}
                className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 hover:border-primary/50"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center -space-x-2">
                    <TeamBadge team={entry.match.homeTeam} size={32} />
                    <TeamBadge team={entry.match.awayTeam} size={32} />
                  </div>
                  <div>
                    <p className="font-medium">
                      {entry.match.homeTeam.shortName ?? entry.match.homeTeam.name}{" "}
                      {entry.match.homeScore ?? "-"} × {entry.match.awayScore ?? "-"}{" "}
                      {entry.match.awayTeam.shortName ?? entry.match.awayTeam.name}
                    </p>
                    <p className="text-xs text-muted-foreground">{entry.match.competition.name}</p>
                  </div>
                </div>
                <RatingStars value={entry.ratingValue} readOnly size={16} />
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
