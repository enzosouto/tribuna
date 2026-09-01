import type { MatchDetail } from "@tribuna/shared";
import { CalendarDays, MapPin } from "lucide-react";
import { AddToListButton } from "@/components/add-to-list-button";
import { Badge } from "@/components/ui/badge";
import { FavoriteButton } from "@/components/favorite-button";
import { FootballBackground } from "@/components/football-background";
import { RatingStars } from "@/components/rating-stars";
import { TeamBadge } from "@/components/team-badge";
import { WatchlistButton } from "@/components/watchlist-button";
import { isMatchWatchlistable, statusLabel } from "@/lib/match-helpers";
import { formatDateShort, formatRating, formatTime } from "@/lib/utils";

export function MatchHeader({ match }: { match: MatchDetail }) {
  const hasScore = match.homeScore !== null && match.awayScore !== null;

  return (
    <FootballBackground className="min-h-[320px] px-4 py-10 sm:px-8" fade="full" overlayOpacity={0.4}>
      <div className="container flex flex-col items-center gap-6 text-center">
        <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-muted-foreground">
          <span>{match.competition.name}</span>
          {match.round && (
            <>
              <span>·</span>
              <span>{match.round}</span>
            </>
          )}
        </div>

        <div className="grid w-full max-w-xl grid-cols-[1fr_auto_1fr] items-center gap-4">
          <div className="flex flex-col items-center gap-3">
            <TeamBadge team={match.homeTeam} size={64} />
            <span className="font-medium">{match.homeTeam.name}</span>
          </div>

          <div className="px-2">
            {hasScore ? (
              <span className="font-display text-5xl tracking-wide">
                {match.homeScore} — {match.awayScore}
              </span>
            ) : (
              <span className="font-display text-3xl text-muted-foreground">{formatTime(match.dateTime)}</span>
            )}
            {match.status === "LIVE" && (
              <div className="mt-2">
                <Badge className="animate-pulse">AO VIVO</Badge>
              </div>
            )}
          </div>

          <div className="flex flex-col items-center gap-3">
            <TeamBadge team={match.awayTeam} size={64} />
            <span className="font-medium">{match.awayTeam.name}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <CalendarDays className="h-4 w-4" /> {formatDateShort(match.dateTime)} · {formatTime(match.dateTime)}
          </span>
          {match.stadium && (
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4" /> {match.stadium}
            </span>
          )}
          {(match.status === "POSTPONED" || match.status === "CANCELLED") && (
            <Badge variant="muted">{statusLabel(match.status)}</Badge>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <div className="flex items-center gap-2 rounded-full bg-black/40 px-4 py-2">
            <RatingStars value={match.averageRating} readOnly size={16} />
            <span className="text-sm text-muted-foreground">
              {formatRating(match.averageRating)} · {match.ratingsCount}{" "}
              {match.ratingsCount === 1 ? "avaliação" : "avaliações"}
            </span>
          </div>
          <WatchlistButton
            matchId={match.id}
            initialInWatchlist={match.viewerInWatchlist}
            canAdd={isMatchWatchlistable(match)}
          />
          <FavoriteButton matchId={match.id} initialFavorited={match.viewerFavorited} />
          <AddToListButton matchId={match.id} />
        </div>
      </div>
    </FootballBackground>
  );
}
