"use client";

import type { MatchDetail, PaginatedResult, Review } from "@tribuna/shared";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import useSWR from "swr";
import { MatchHeader } from "@/components/match-header";
import { MatchLineups } from "@/components/match-lineups";
import { MatchStatistics } from "@/components/match-statistics";
import { MatchTimeline } from "@/components/match-timeline";
import { RatingStars } from "@/components/rating-stars";
import { ReviewCard } from "@/components/review-card";
import { ReviewForm } from "@/components/review-form";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState, ErrorState, GridSkeleton } from "@/components/states";
import { useAuth } from "@/lib/auth-context";
import { fetcher } from "@/lib/api-client";
import { isMatchRatable } from "@/lib/match-helpers";

export default function MatchPage() {
  const params = useParams<{ id: string }>();
  const { user } = useAuth();
  const { data: match, error, isLoading, mutate } = useSWR<MatchDetail>(`/matches/${params.id}`, fetcher);
  const {
    data: reviewsData,
    mutate: mutateReviews,
  } = useSWR<PaginatedResult<Review>>(match ? `/reviews?matchId=${match.id}&pageSize=30` : null, fetcher);
  const [editing, setEditing] = useState<Review | null>(null);
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [pendingRating, setPendingRating] = useState<number | null>(null);

  if (isLoading) {
    return (
      <div className="container py-10">
        <GridSkeleton count={1} className="h-72 w-full rounded-3xl" />
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className="container py-10">
        <ErrorState message="Não foi possível carregar esta partida." />
      </div>
    );
  }

  const myReview = reviewsData?.items.find((r) => r.user.id === user?.id) ?? null;
  const ratable = isMatchRatable(match);
  const hasTimeline = match.events.length > 0;
  const hasStats = match.statistics.length > 0;
  const hasLineups = match.lineups.length > 0;
  const hasExtras = hasTimeline || hasStats || hasLineups;

  function openRatingModal(value: number) {
    setPendingRating(value);
    setRatingModalOpen(true);
  }

  function handleReviewSaved() {
    mutateReviews();
    mutate();
    setRatingModalOpen(false);
    setEditing(null);
  }

  function handleReviewDeleted() {
    mutateReviews();
    mutate();
  }

  const reviewsList =
    reviewsData && reviewsData.items.length === 0 ? (
      <EmptyState title="Nenhuma review ainda" description="Seja o primeiro a compartilhar sua opinião sobre essa partida." />
    ) : reviewsData && reviewsData.items.length > 0 ? (
      <div className="rounded-2xl border border-border bg-card px-5">
        {reviewsData.items.map((r) => (
          <ReviewCard key={r.id} review={r} onEdit={setEditing} onDeleted={handleReviewDeleted} showMatch={false} />
        ))}
      </div>
    ) : null;

  return (
    <div>
      <MatchHeader match={match} />

      <div className="border-b border-border/60 py-10">
        <div className="container flex flex-col items-center gap-3 text-center">
          {!user && (
            <p className="text-sm text-muted-foreground">
              <Link href="/login" className="font-medium text-primary hover:underline">
                Faça login
              </Link>{" "}
              para avaliar essa partida.
            </p>
          )}
          {user && !ratable && (
            <p className="text-sm text-muted-foreground">
              Essa partida ainda não começou — você poderá avaliar assim que ela acontecer.
            </p>
          )}
          {user && ratable && (
            <>
              <p className="text-sm text-muted-foreground">
                {myReview ? "Sua avaliação" : "O que você achou dessa partida?"}
              </p>
              <RatingStars value={match.viewerRating} onChange={openRatingModal} size={40} />
              <p className="text-xs text-muted-foreground">
                {myReview ? "Toque nas estrelas para editar sua review" : "Toque nas estrelas para avaliar e escrever uma review"}
              </p>
            </>
          )}
        </div>
      </div>

      <div className="container py-8">
        {hasExtras ? (
          <Tabs defaultValue="reviews">
            <div className="-mx-4 overflow-x-auto px-4 no-scrollbar sm:mx-0 sm:overflow-visible sm:px-0">
              <TabsList className="w-max flex-nowrap">
                <TabsTrigger value="reviews" className="whitespace-nowrap">
                  Reviews ({reviewsData?.total ?? match.reviewsCount})
                </TabsTrigger>
                {hasTimeline && (
                  <TabsTrigger value="timeline" className="whitespace-nowrap">
                    Timeline
                  </TabsTrigger>
                )}
                {hasStats && (
                  <TabsTrigger value="stats" className="whitespace-nowrap">
                    Estatísticas
                  </TabsTrigger>
                )}
                {hasLineups && (
                  <TabsTrigger value="lineups" className="whitespace-nowrap">
                    Escalações
                  </TabsTrigger>
                )}
              </TabsList>
            </div>

            <TabsContent value="reviews">{reviewsList}</TabsContent>

            {hasTimeline && (
              <TabsContent value="timeline">
                <MatchTimeline events={match.events} homeTeam={match.homeTeam} awayTeam={match.awayTeam} />
              </TabsContent>
            )}

            {hasStats && (
              <TabsContent value="stats">
                <MatchStatistics statistics={match.statistics} homeTeam={match.homeTeam} awayTeam={match.awayTeam} />
              </TabsContent>
            )}

            {hasLineups && (
              <TabsContent value="lineups">
                <MatchLineups lineups={match.lineups} homeTeam={match.homeTeam} awayTeam={match.awayTeam} />
              </TabsContent>
            )}
          </Tabs>
        ) : (
          <>
            <h2 className="mb-4 font-display text-2xl tracking-wide">
              Reviews ({reviewsData?.total ?? match.reviewsCount})
            </h2>
            {reviewsList}
          </>
        )}
      </div>

      <Dialog open={ratingModalOpen} onOpenChange={setRatingModalOpen}>
        <DialogContent>
          <DialogTitle>{myReview ? "Editar sua review" : "Avalie essa partida"}</DialogTitle>
          <ReviewForm
            matchId={match.id}
            existingReview={myReview}
            initialRating={pendingRating}
            onSaved={handleReviewSaved}
            onCancel={() => setRatingModalOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogTitle>Editar review</DialogTitle>
          {editing && (
            <ReviewForm
              matchId={match.id}
              existingReview={editing}
              onSaved={handleReviewSaved}
              onCancel={() => setEditing(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
