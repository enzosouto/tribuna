"use client";

import type { DiaryEntry, ListSummary, PaginatedResult, Review, UserPublic } from "@tribuna/shared";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import useSWR from "swr";
import { ListCard } from "@/components/list-card";
import { ProfileHeader } from "@/components/profile-header";
import { RatingStars } from "@/components/rating-stars";
import { ReviewCard } from "@/components/review-card";
import { TeamBadge } from "@/components/team-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserCard } from "@/components/user-card";
import { EmptyState, ErrorState, GridSkeleton } from "@/components/states";
import { fetcher } from "@/lib/api-client";

export default function UserProfilePage() {
  const params = useParams<{ username: string }>();
  const [tab, setTab] = useState("reviews");
  const { data: profile, error, isLoading } = useSWR<UserPublic>(`/users/${params.username}`, fetcher);
  const { data: reviewsData } = useSWR<PaginatedResult<Review>>(
    profile ? `/reviews?username=${params.username}&pageSize=30` : null,
    fetcher,
  );
  const { data: matchesData } = useSWR<DiaryEntry[]>(
    profile ? `/users/${params.username}/matches` : null,
    fetcher,
  );
  const { data: lists } = useSWR<ListSummary[]>(profile ? `/users/${params.username}/lists` : null, fetcher);
  const { data: followers } = useSWR<UserPublic[]>(profile ? `/users/${params.username}/followers` : null, fetcher);
  const { data: following } = useSWR<UserPublic[]>(profile ? `/users/${params.username}/following` : null, fetcher);

  if (isLoading) {
    return (
      <div className="container py-10">
        <GridSkeleton count={1} className="h-40 w-full rounded-2xl" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="container py-10">
        <ErrorState message="Usuário não encontrado." />
      </div>
    );
  }

  return (
    <div className="container space-y-6 py-6">
      <ProfileHeader user={profile} onStatClick={setTab} />

      <Tabs value={tab} onValueChange={setTab}>
        <div className="-mx-4 overflow-x-auto px-4 no-scrollbar sm:mx-0 sm:overflow-visible sm:px-0">
          <TabsList className="w-max flex-nowrap">
            <TabsTrigger value="reviews" className="whitespace-nowrap">
              Reviews
            </TabsTrigger>
            <TabsTrigger value="matches" className="whitespace-nowrap">
              Partidas
            </TabsTrigger>
            <TabsTrigger value="lists" className="whitespace-nowrap">
              Listas
            </TabsTrigger>
            <TabsTrigger value="followers" className="whitespace-nowrap">
              Seguidores
            </TabsTrigger>
            <TabsTrigger value="following" className="whitespace-nowrap">
              Seguindo
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="reviews">
          {reviewsData && reviewsData.items.length === 0 && <EmptyState title="Nenhuma review ainda" />}
          {reviewsData && reviewsData.items.length > 0 && (
            <div className="rounded-2xl border border-border bg-card px-5">
              {reviewsData.items.map((r) => (
                <ReviewCard key={r.id} review={r} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="matches">
          {matchesData && matchesData.length === 0 && <EmptyState title="Nenhuma partida avaliada ainda" />}
          {matchesData && matchesData.length > 0 && (
            <div className="space-y-2">
              {matchesData.map((entry) => (
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
          )}
        </TabsContent>

        <TabsContent value="lists">
          {lists && lists.length === 0 && <EmptyState title="Nenhuma lista criada ainda" />}
          {lists && lists.length > 0 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {lists.map((l) => (
                <ListCard key={l.id} list={l} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="followers">
          {followers && followers.length === 0 && <EmptyState title="Nenhum seguidor ainda" />}
          {followers && followers.length > 0 && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {followers.map((u) => (
                <UserCard key={u.id} user={u} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="following">
          {following && following.length === 0 && <EmptyState title="Ainda não segue ninguém" />}
          {following && following.length > 0 && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {following.map((u) => (
                <UserCard key={u.id} user={u} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
