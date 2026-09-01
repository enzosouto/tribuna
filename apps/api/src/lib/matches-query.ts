import type { MatchDetail, MatchStatus, MatchSummary } from "@tribuna/shared";
import { and, avg, count, desc, eq, gt, ilike, or, sql, type SQL } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "../db/client.js";
import {
  competitions,
  favorites,
  matches,
  matchEvents,
  matchLineups,
  matchStatistics,
  ratings,
  reviews,
  seasons,
  teams,
  watchlist,
} from "../db/schema.js";
import { toCompetition, toMatchEvent, toMatchLineup, toMatchStatistic, toSeason, toTeam } from "./mappers.js";

const homeTeams = alias(teams, "home_teams");
const awayTeams = alias(teams, "away_teams");

const ratingAgg = db
  .select({
    matchId: ratings.matchId,
    avgValue: avg(ratings.value).as("avg_value"),
    ratingsCount: count(ratings.id).as("ratings_count"),
  })
  .from(ratings)
  .groupBy(ratings.matchId)
  .as("rating_agg");

function baseSelect() {
  return db
    .select({
      match: matches,
      homeTeam: homeTeams,
      awayTeam: awayTeams,
      competition: competitions,
      avgValue: ratingAgg.avgValue,
      ratingsCount: ratingAgg.ratingsCount,
    })
    .from(matches)
    .innerJoin(homeTeams, eq(matches.homeTeamId, homeTeams.id))
    .innerJoin(awayTeams, eq(matches.awayTeamId, awayTeams.id))
    .innerJoin(competitions, eq(matches.competitionId, competitions.id))
    .leftJoin(ratingAgg, eq(ratingAgg.matchId, matches.id));
}

function rowToSummary(row: {
  match: typeof matches.$inferSelect;
  homeTeam: typeof teams.$inferSelect;
  awayTeam: typeof teams.$inferSelect;
  competition: typeof competitions.$inferSelect;
  avgValue: string | null;
  ratingsCount: number | null;
}): MatchSummary {
  return {
    id: row.match.id,
    externalId: row.match.externalId,
    homeTeam: toTeam(row.homeTeam),
    awayTeam: toTeam(row.awayTeam),
    homeScore: row.match.homeScore,
    awayScore: row.match.awayScore,
    competition: toCompetition(row.competition),
    round: row.match.round,
    stadium: row.match.stadium,
    dateTime: row.match.dateTime.toISOString(),
    status: row.match.status,
    averageRating: row.avgValue ? Number(row.avgValue) : null,
    ratingsCount: row.ratingsCount ?? 0,
  };
}

export interface MatchListFilters {
  status?: MatchStatus;
  upcoming?: boolean;
  competitionId?: string;
  teamId?: string;
  q?: string;
  sort?: "recent" | "upcoming" | "popular" | "top_rated";
  page: number;
  pageSize: number;
}

export async function listMatches(filters: MatchListFilters) {
  const conditions: SQL[] = [];

  if (filters.status) conditions.push(eq(matches.status, filters.status));
  if (filters.upcoming) {
    conditions.push(gt(matches.dateTime, new Date()));
    conditions.push(or(eq(matches.status, "SCHEDULED"), eq(matches.status, "TIMED"))!);
  }
  if (filters.competitionId) conditions.push(eq(matches.competitionId, filters.competitionId));
  if (filters.teamId) {
    conditions.push(or(eq(matches.homeTeamId, filters.teamId), eq(matches.awayTeamId, filters.teamId))!);
  }
  if (filters.q) {
    conditions.push(
      or(
        ilike(homeTeams.name, `%${filters.q}%`),
        ilike(awayTeams.name, `%${filters.q}%`),
        ilike(competitions.name, `%${filters.q}%`),
      )!,
    );
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  let orderBy = desc(matches.dateTime);
  if (filters.sort === "upcoming") orderBy = matches.dateTime as unknown as SQL;
  if (filters.sort === "popular") orderBy = desc(sql`coalesce(${ratingAgg.ratingsCount}, 0)`);
  if (filters.sort === "top_rated") orderBy = desc(sql`coalesce(${ratingAgg.avgValue}, 0)`);

  const query = baseSelect().where(where).orderBy(orderBy);

  const offset = (filters.page - 1) * filters.pageSize;
  const [rows, [{ total }]] = await Promise.all([
    query.limit(filters.pageSize).offset(offset),
    db
      .select({ total: count() })
      .from(matches)
      .innerJoin(homeTeams, eq(matches.homeTeamId, homeTeams.id))
      .innerJoin(awayTeams, eq(matches.awayTeamId, awayTeams.id))
      .innerJoin(competitions, eq(matches.competitionId, competitions.id))
      .where(where),
  ]);

  return {
    items: rows.map(rowToSummary),
    total,
  };
}

export async function fetchMatchDetail(
  matchId: string,
  viewerId?: string | null,
): Promise<MatchDetail | null> {
  const [row] = await baseSelect().where(eq(matches.id, matchId)).limit(1);
  if (!row) return null;

  const [seasonRow, events, statistics, lineups, reviewsCountRow, viewerRatingRow, viewerWatchlistRow, viewerFavoriteRow] =
    await Promise.all([
      row.match.seasonId
        ? db.select().from(seasons).where(eq(seasons.id, row.match.seasonId)).limit(1)
        : Promise.resolve([]),
      db.select().from(matchEvents).where(eq(matchEvents.matchId, matchId)),
      db.select().from(matchStatistics).where(eq(matchStatistics.matchId, matchId)),
      db.select().from(matchLineups).where(eq(matchLineups.matchId, matchId)),
      db.select({ total: count() }).from(reviews).where(eq(reviews.matchId, matchId)),
      viewerId
        ? db.select().from(ratings).where(and(eq(ratings.userId, viewerId), eq(ratings.matchId, matchId))).limit(1)
        : Promise.resolve([]),
      viewerId
        ? db
            .select()
            .from(watchlist)
            .where(and(eq(watchlist.userId, viewerId), eq(watchlist.matchId, matchId)))
            .limit(1)
        : Promise.resolve([]),
      viewerId
        ? db
            .select()
            .from(favorites)
            .where(and(eq(favorites.userId, viewerId), eq(favorites.matchId, matchId)))
            .limit(1)
        : Promise.resolve([]),
    ]);

  return {
    ...rowToSummary(row),
    season: seasonRow[0] ? toSeason(seasonRow[0]) : null,
    events: events.map(toMatchEvent),
    statistics: statistics.map(toMatchStatistic),
    lineups: lineups.map(toMatchLineup),
    viewerRating: viewerRatingRow[0] ? Number(viewerRatingRow[0].value) : null,
    viewerFavorited: viewerFavoriteRow.length > 0,
    viewerInWatchlist: viewerWatchlistRow.length > 0,
    reviewsCount: reviewsCountRow[0]?.total ?? 0,
  };
}
