"use client";

import type { Competition, MatchSummary, PaginatedResult, UserPublic } from "@tribuna/shared";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import useSWR from "swr";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { CompetitionCard } from "@/components/competition-card";
import { MatchCard } from "@/components/match-card";
import { UserCard } from "@/components/user-card";
import { EmptyState, GridSkeleton } from "@/components/states";
import { SectionHeader } from "@/components/section-header";
import { useAuth } from "@/lib/auth-context";
import { fetcher } from "@/lib/api-client";

const SORTS = [
  { value: "popular", label: "Populares" },
  { value: "top_rated", label: "Melhores avaliadas" },
  { value: "finished", label: "Realizadas" },
  { value: "upcoming", label: "Futuras" },
] as const;

function ExploreContent() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const searchParams = useSearchParams();
  const competitionId = searchParams.get("competitionId") ?? undefined;
  const [sort, setSort] = useState<(typeof SORTS)[number]["value"]>("popular");
  const [page, setPage] = useState(1);

  // "Realizadas" = most recently finished first. "Futuras" = soonest upcoming first.
  const apiSort = sort === "finished" ? "recent" : sort;
  const query = new URLSearchParams({ sort: apiSort, page: String(page), pageSize: "12" });
  if (competitionId) query.set("competitionId", competitionId);
  if (sort === "upcoming") query.set("upcoming", "true");
  if (sort === "finished") query.set("status", "FINISHED");

  const { data, isLoading } = useSWR<PaginatedResult<MatchSummary>>(`/matches?${query.toString()}`, fetcher);
  const { data: competitions } = useSWR<Competition[]>("/competitions", fetcher);
  const { data: popularUsers } = useSWR<UserPublic[]>(isAdmin ? "/users?sort=popular&pageSize=6" : null, fetcher);

  return (
    <div className="container space-y-10 py-6">
      <div>
        <h1 className="font-display text-3xl tracking-wide">Explorar</h1>
        <p className="text-sm text-muted-foreground">Descubra partidas, competições e torcedores.</p>
      </div>

      <Tabs
        value={sort}
        onValueChange={(v) => {
          setSort(v as typeof sort);
          setPage(1);
        }}
      >
        <div className="-mx-4 overflow-x-auto px-4 no-scrollbar sm:mx-0 sm:overflow-visible sm:px-0">
          <TabsList className="w-max flex-nowrap">
            {SORTS.map((s) => (
              <TabsTrigger key={s.value} value={s.value} className="whitespace-nowrap">
                {s.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
      </Tabs>

      <section>
        {isLoading && <GridSkeleton />}
        {data && data.items.length === 0 && <EmptyState title="Nenhuma partida encontrada" />}
        {data && data.items.length > 0 && (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.items.map((m) => (
                <MatchCard key={m.id} match={m} />
              ))}
            </div>
            {data.totalPages > page && (
              <div className="mt-6 flex justify-center">
                <Button variant="outline" onClick={() => setPage((p) => p + 1)}>
                  Carregar mais
                </Button>
              </div>
            )}
          </>
        )}
      </section>

      {competitions && competitions.length > 0 && (
        <section>
          <SectionHeader title="Competições" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {competitions.map((c) => (
              <CompetitionCard key={c.id} competition={c} />
            ))}
          </div>
        </section>
      )}

      {popularUsers && popularUsers.length > 0 && (
        <section>
          <SectionHeader title="Usuários" href="/admin" hrefLabel="Ver mais" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {popularUsers.map((u) => (
              <UserCard key={u.id} user={u} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense fallback={null}>
      <ExploreContent />
    </Suspense>
  );
}
