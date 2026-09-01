export const MATCH_STATUSES = [
  "SCHEDULED",
  "TIMED",
  "LIVE",
  "FINISHED",
  "POSTPONED",
  "CANCELLED",
] as const;
export type MatchStatus = (typeof MATCH_STATUSES)[number];

export const FUTURE_MATCH_STATUSES: MatchStatus[] = ["SCHEDULED", "TIMED"];

export const MATCH_EVENT_TYPES = [
  "GOAL",
  "OWN_GOAL",
  "PENALTY_GOAL",
  "PENALTY_MISSED",
  "YELLOW_CARD",
  "RED_CARD",
  "SUBSTITUTION",
  "VAR",
] as const;
export type MatchEventType = (typeof MATCH_EVENT_TYPES)[number];

export const LINEUP_ROLES = ["STARTER", "SUBSTITUTE", "COACH"] as const;
export type LineupRole = (typeof LINEUP_ROLES)[number];

export const FOOTBALL_PROVIDERS = ["mock", "football-data", "thesportsdb", "mix"] as const;
export type FootballProviderName = (typeof FOOTBALL_PROVIDERS)[number];
