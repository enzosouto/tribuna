import type { LineupRole, MatchEventType, MatchStatus } from "./enums.js";

export interface UserPublic {
  id: string;
  username: string;
  name: string;
  avatarUrl: string | null;
  bio: string | null;
  createdAt: string;
  matchesCount: number;
  reviewsCount: number;
  followersCount: number;
  followingCount: number;
  averageRating: number | null;
  isFollowedByViewer?: boolean;
  isViewer?: boolean;
  role?: "user" | "admin";
}

export interface Team {
  id: string;
  externalId: string | null;
  name: string;
  shortName: string | null;
  crestUrl: string | null;
  country: string | null;
}

export interface Competition {
  id: string;
  externalId: string | null;
  name: string;
  code: string | null;
  emblemUrl: string | null;
  country: string | null;
}

export interface Season {
  id: string;
  competitionId: string;
  year: string;
  startDate: string | null;
  endDate: string | null;
}

export interface MatchEvent {
  id: string;
  matchId: string;
  type: MatchEventType;
  minute: number | null;
  teamId: string | null;
  playerName: string | null;
  assistName: string | null;
  detail: string | null;
}

export interface MatchStatistic {
  id: string;
  matchId: string;
  teamId: string;
  possession: number | null;
  shots: number | null;
  shotsOnTarget: number | null;
  corners: number | null;
  fouls: number | null;
  yellowCards: number | null;
  redCards: number | null;
  offsides: number | null;
}

export interface MatchLineupEntry {
  id: string;
  matchId: string;
  teamId: string;
  playerName: string;
  shirtNumber: number | null;
  position: string | null;
  role: LineupRole;
}

export interface MatchSummary {
  id: string;
  externalId: string | null;
  homeTeam: Team;
  awayTeam: Team;
  homeScore: number | null;
  awayScore: number | null;
  competition: Competition;
  round: string | null;
  stadium: string | null;
  dateTime: string;
  status: MatchStatus;
  averageRating: number | null;
  ratingsCount: number;
}

export interface MatchDetail extends MatchSummary {
  season: Season | null;
  events: MatchEvent[];
  statistics: MatchStatistic[];
  lineups: MatchLineupEntry[];
  viewerRating: number | null;
  viewerInWatchlist: boolean;
  viewerFavorited: boolean;
  reviewsCount: number;
}

export interface DiaryEntry {
  ratingId: string;
  ratingValue: number;
  ratedAt: string;
  match: MatchSummary;
}

export interface Review {
  id: string;
  matchId: string;
  match: MatchSummary;
  user: UserPublic;
  rating: number | null;
  body: string;
  likesCount: number;
  likedByViewer: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ListSummary {
  id: string;
  name: string;
  description: string | null;
  coverUrl: string | null;
  author: UserPublic;
  matchesCount: number;
  createdAt: string;
}

export interface ListDetail extends ListSummary {
  matches: MatchSummary[];
}

export interface PaginatedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
