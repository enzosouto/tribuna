import { FUTURE_MATCH_STATUSES, type MatchSummary } from "@tribuna/shared";

export function isMatchWatchlistable(match: Pick<MatchSummary, "status" | "dateTime">): boolean {
  return (
    (FUTURE_MATCH_STATUSES as string[]).includes(match.status) &&
    new Date(match.dateTime).getTime() > Date.now()
  );
}

const NOT_YET_PLAYED_STATUSES = new Set(["SCHEDULED", "TIMED", "POSTPONED", "CANCELLED"]);

export function isMatchRatable(match: Pick<MatchSummary, "status" | "dateTime">): boolean {
  const hasStarted = new Date(match.dateTime).getTime() <= Date.now();
  return hasStarted && !NOT_YET_PLAYED_STATUSES.has(match.status);
}

export function statusLabel(status: string): string {
  switch (status) {
    case "SCHEDULED":
    case "TIMED":
      return "Agendado";
    case "LIVE":
      return "Ao vivo";
    case "FINISHED":
      return "Encerrado";
    case "POSTPONED":
      return "Adiado";
    case "CANCELLED":
      return "Cancelado";
    default:
      return status;
  }
}
