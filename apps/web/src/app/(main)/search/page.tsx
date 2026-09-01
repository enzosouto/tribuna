"use client";

import type { Competition, MatchSummary, Team, UserPublic } from "@tribuna/shared";
import { Search as SearchIcon } from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import useSWR from "swr";
import { CompetitionCard } from "@/components/competition-card";
import { Input } from "@/components/ui/input";
import { MatchCard } from "@/components/match-card";
import { SectionHeader } from "@/components/section-header";
import { TeamBadge } from "@/components/team-badge";
import { EmptyState, GridSkeleton } from "@/components/states";
import { UserCard } from "@/components/user-card";
import { fetcher } from "@/lib/api-client";

interface SearchResults {
  matches: MatchSummary[];
  teams: Team[];
  competitions: Competition[];
  users: UserPublic[];
}

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQ = searchParams.get("q") ?? "";
  const [input, setInput] = useState(initialQ);
  const [debounced, setDebounced] = useState(initialQ);

  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(input), 350);
    return () => clearTimeout(timeout);
  }, [input]);

  useEffect(() => {
    const params = new URLSearchParams(debounced ? { q: debounced } : {});
    router.replace(`/search${debounced ? `?${params.toString()}` : ""}`);
  }, [debounced, router]);

  const { data, isLoading } = useSWR<SearchResults>(
    debounced.trim().length > 0 ? `/search?q=${encodeURIComponent(debounced.trim())}` : null,
    fetcher,
  );

  const hasResults =
    data && (data.matches.length > 0 || data.teams.length > 0 || data.competitions.length > 0 || data.users.length > 0);

  return (
    <div className="container space-y-8 py-6">
      <div>
        <h1 className="font-display text-3xl tracking-wide">Buscar</h1>
        <div className="relative mt-4 max-w-lg">
          <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            autoFocus
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Buscar partidas, times, usuários, competições..."
            className="pl-10"
          />
        </div>
      </div>

      {debounced.trim().length === 0 && <EmptyState title="Digite para buscar" description="Encontre partidas, times, competições e usuários." />}
      {isLoading && <GridSkeleton />}

      {debounced.trim().length > 0 && !isLoading && !hasResults && (
        <EmptyState title="Nenhum resultado" description={`Não encontramos nada para "${debounced}".`} />
      )}

      {data && data.matches.length > 0 && (
        <section>
          <SectionHeader title="Partidas" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.matches.map((m) => (
              <MatchCard key={m.id} match={m} />
            ))}
          </div>
        </section>
      )}

      {data && data.teams.length > 0 && (
        <section>
          <SectionHeader title="Times" />
          <div className="flex flex-wrap gap-4">
            {data.teams.map((t) => (
              <div key={t.id} className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2">
                <TeamBadge team={t} size={24} />
                <span className="text-sm">{t.name}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {data && data.competitions.length > 0 && (
        <section>
          <SectionHeader title="Competições" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.competitions.map((c) => (
              <CompetitionCard key={c.id} competition={c} />
            ))}
          </div>
        </section>
      )}

      {data && data.users.length > 0 && (
        <section>
          <SectionHeader title="Usuários" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {data.users.map((u) => (
              <UserCard key={u.id} user={u} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <SearchContent />
    </Suspense>
  );
}
