import type { FootballProviderName, MatchStatus } from "@tribuna/shared";

export interface NormalizedTeam {
  externalId: string;
  name: string;
  shortName: string | null;
  crestUrl: string | null;
  country: string | null;
}

export interface NormalizedCompetition {
  externalId: string;
  name: string;
  code: string | null;
  emblemUrl: string | null;
  country: string | null;
}

export interface NormalizedSeason {
  year: string;
  startDate: string | null;
  endDate: string | null;
}

export interface NormalizedEvent {
  type:
    | "GOAL"
    | "OWN_GOAL"
    | "PENALTY_GOAL"
    | "PENALTY_MISSED"
    | "YELLOW_CARD"
    | "RED_CARD"
    | "SUBSTITUTION"
    | "VAR";
  minute: number | null;
  teamExternalId: string | null;
  playerName: string | null;
  assistName: string | null;
  detail: string | null;
}

export interface NormalizedStatistic {
  teamExternalId: string;
  possession: number | null;
  shots: number | null;
  shotsOnTarget: number | null;
  corners: number | null;
  fouls: number | null;
  yellowCards: number | null;
  redCards: number | null;
  offsides: number | null;
}

export interface NormalizedLineupEntry {
  teamExternalId: string;
  playerName: string;
  shirtNumber: number | null;
  position: string | null;
  role: "STARTER" | "SUBSTITUTE" | "COACH";
}

export interface NormalizedMatch {
  externalId: string;
  homeTeam: NormalizedTeam;
  awayTeam: NormalizedTeam;
  homeScore: number | null;
  awayScore: number | null;
  competition: NormalizedCompetition;
  season: NormalizedSeason;
  round: string | null;
  stadium: string | null;
  dateTime: string;
  status: MatchStatus;
  events: NormalizedEvent[];
  statistics: NormalizedStatistic[];
  lineups: NormalizedLineupEntry[];
}

export interface FootballProvider {
  name: FootballProviderName;
  fetchMatches(): Promise<NormalizedMatch[]>;
}
