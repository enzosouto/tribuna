import type { MatchEvent, Team } from "@tribuna/shared";
import { ArrowLeftRight, CircleDot, Square } from "lucide-react";
import { EmptyState } from "@/components/states";

const ICONS: Record<MatchEvent["type"], React.ReactNode> = {
  GOAL: <CircleDot className="h-4 w-4 text-primary" />,
  OWN_GOAL: <CircleDot className="h-4 w-4 text-destructive" />,
  PENALTY_GOAL: <CircleDot className="h-4 w-4 text-primary" />,
  PENALTY_MISSED: <CircleDot className="h-4 w-4 text-muted-foreground" />,
  YELLOW_CARD: <Square className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />,
  RED_CARD: <Square className="h-3.5 w-3.5 fill-destructive text-destructive" />,
  SUBSTITUTION: <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />,
  VAR: <CircleDot className="h-4 w-4 text-muted-foreground" />,
};

const LABELS: Record<MatchEvent["type"], string> = {
  GOAL: "Gol",
  OWN_GOAL: "Gol contra",
  PENALTY_GOAL: "Gol de pênalti",
  PENALTY_MISSED: "Pênalti perdido",
  YELLOW_CARD: "Cartão amarelo",
  RED_CARD: "Cartão vermelho",
  SUBSTITUTION: "Substituição",
  VAR: "Revisão do VAR",
};

export function MatchTimeline({
  events,
  homeTeam,
  awayTeam,
}: {
  events: MatchEvent[];
  homeTeam: Team;
  awayTeam: Team;
}) {
  if (events.length === 0) {
    return <EmptyState title="Sem timeline disponível" description="Os eventos desta partida ainda não foram registrados." />;
  }

  const sorted = [...events].sort((a, b) => (a.minute ?? 0) - (b.minute ?? 0));

  return (
    <ol className="space-y-3">
      {sorted.map((event) => {
        const isHome = event.teamId === homeTeam.id;
        const isAway = event.teamId === awayTeam.id;
        return (
          <li
            key={event.id}
            className="flex items-center gap-3 rounded-xl border border-border/60 bg-card px-4 py-2.5 text-sm"
          >
            <span className="w-10 shrink-0 font-display text-base text-muted-foreground">
              {event.minute != null ? `${event.minute}'` : "—"}
            </span>
            {ICONS[event.type]}
            <span className="flex-1">
              <span className="font-medium">{event.playerName ?? LABELS[event.type]}</span>
              {event.assistName && <span className="text-muted-foreground"> · assist. {event.assistName}</span>}
              <span className="ml-1 text-muted-foreground">— {LABELS[event.type]}</span>
            </span>
            {(isHome || isAway) && (
              <span className="shrink-0 text-xs text-muted-foreground">{isHome ? homeTeam.shortName : awayTeam.shortName}</span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
