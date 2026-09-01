import type { Team, Competition, Season, MatchEvent, MatchStatistic, MatchLineupEntry } from "@tribuna/shared";
import type * as schema from "../db/schema.js";

type TeamRow = typeof schema.teams.$inferSelect;
type CompetitionRow = typeof schema.competitions.$inferSelect;
type SeasonRow = typeof schema.seasons.$inferSelect;
type MatchEventRow = typeof schema.matchEvents.$inferSelect;
type MatchStatisticRow = typeof schema.matchStatistics.$inferSelect;
type MatchLineupRow = typeof schema.matchLineups.$inferSelect;

export function toTeam(row: TeamRow): Team {
  return {
    id: row.id,
    externalId: row.externalId,
    name: row.name,
    shortName: row.shortName,
    crestUrl: row.crestUrl,
    country: row.country,
  };
}

export function toCompetition(row: CompetitionRow): Competition {
  return {
    id: row.id,
    externalId: row.externalId,
    name: row.name,
    code: row.code,
    emblemUrl: row.emblemUrl,
    country: row.country,
  };
}

export function toSeason(row: SeasonRow): Season {
  return {
    id: row.id,
    competitionId: row.competitionId,
    year: row.year,
    startDate: row.startDate ? row.startDate.toISOString() : null,
    endDate: row.endDate ? row.endDate.toISOString() : null,
  };
}

export function toMatchEvent(row: MatchEventRow): MatchEvent {
  return {
    id: row.id,
    matchId: row.matchId,
    type: row.type,
    minute: row.minute,
    teamId: row.teamId,
    playerName: row.playerName,
    assistName: row.assistName,
    detail: row.detail,
  };
}

export function toMatchStatistic(row: MatchStatisticRow): MatchStatistic {
  return {
    id: row.id,
    matchId: row.matchId,
    teamId: row.teamId,
    possession: row.possession,
    shots: row.shots,
    shotsOnTarget: row.shotsOnTarget,
    corners: row.corners,
    fouls: row.fouls,
    yellowCards: row.yellowCards,
    redCards: row.redCards,
    offsides: row.offsides,
  };
}

export function toMatchLineup(row: MatchLineupRow): MatchLineupEntry {
  return {
    id: row.id,
    matchId: row.matchId,
    teamId: row.teamId,
    playerName: row.playerName,
    shirtNumber: row.shirtNumber,
    position: row.position,
    role: row.role,
  };
}
