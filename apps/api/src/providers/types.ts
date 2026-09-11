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
  /**
   * Resolves a single match by the external id we already stored.
   *
   * `fetchMatches` only returns whatever window the upstream exposes (TheSportsDB gives
   * the last handful of events per league), so a match whose result landed after it fell
   * out of that window would stay scoreless forever. This is the escape hatch the
   * backfill pass uses to go get those results by id.
   *
   * Returns null when the provider doesn't know the id. Ids are only unique per
   * upstream, so a provider may well answer with an entirely different fixture; pass
   * `isExpected` so a multi-upstream provider can discard those and keep looking, and
   * check the result again at the call site.
   */
  lookupMatch?(
    externalId: string,
    isExpected?: (candidate: NormalizedMatch) => boolean,
  ): Promise<NormalizedMatch | null>;
}
