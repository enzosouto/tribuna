import type { MatchSummary } from "@tribuna/shared";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { RatingStars } from "@/components/rating-stars";
import { TeamBadge } from "@/components/team-badge";
import { formatDateShort, formatRating, formatTime } from "@/lib/utils";
import { statusLabel } from "@/lib/match-helpers";

export function MatchCard({ match }: { match: MatchSummary }) {
  const hasScore = match.homeScore !== null && match.awayScore !== null;

  return (
    <Link href={`/matches/${match.id}`} className="block">
      <Card className="group h-full p-4 transition-colors hover:border-primary/50">
        <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
          <span className="truncate">{match.competition.name}</span>
          {match.status === "LIVE" ? (
            <Badge variant="default" className="animate-pulse">
              AO VIVO
            </Badge>
          ) : match.status !== "FINISHED" && match.status !== "SCHEDULED" && match.status !== "TIMED" ? (
            <Badge variant="muted">{statusLabel(match.status)}</Badge>
          ) : (
            <span>{formatDateShort(match.dateTime)}</span>
          )}
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <div className="flex flex-col items-center gap-2 text-center">
            <TeamBadge team={match.homeTeam} size={40} />
            <span className="text-sm font-medium leading-tight">{match.homeTeam.shortName ?? match.homeTeam.name}</span>
          </div>

          <div className="px-2 text-center">
            {hasScore ? (
              <span className="font-display text-2xl tracking-wide">
                {match.homeScore} — {match.awayScore}
              </span>
            ) : (
              <span className="font-display text-lg text-muted-foreground">{formatTime(match.dateTime)}</span>
            )}
          </div>

          <div className="flex flex-col items-center gap-2 text-center">
            <TeamBadge team={match.awayTeam} size={40} />
            <span className="text-sm font-medium leading-tight">{match.awayTeam.shortName ?? match.awayTeam.name}</span>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3">
          <div className="flex items-center gap-1.5">
            <RatingStars value={match.averageRating} size={14} readOnly />
            <span className="text-xs text-muted-foreground">{formatRating(match.averageRating)}</span>
          </div>
          <span className="text-xs text-muted-foreground">
            {match.ratingsCount} {match.ratingsCount === 1 ? "avaliação" : "avaliações"}
          </span>
        </div>
      </Card>
    </Link>
  );
}
