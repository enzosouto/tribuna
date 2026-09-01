import type { Review } from "@tribuna/shared";
import { and, count, desc, eq, inArray, type SQL } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "../db/client.js";
import { competitions, matches, reviewLikes, reviews, teams, users } from "../db/schema.js";
import { toCompetition, toTeam } from "./mappers.js";

const homeTeams = alias(teams, "review_home_teams");
const awayTeams = alias(teams, "review_away_teams");

const likeAgg = db
  .select({
    reviewId: reviewLikes.reviewId,
    likesCount: count(reviewLikes.id).as("likes_count"),
  })
  .from(reviewLikes)
  .groupBy(reviewLikes.reviewId)
  .as("like_agg");

export interface ReviewListFilters {
  matchId?: string;
  authorIds?: string[];
  page: number;
  pageSize: number;
}

export async function listReviews(filters: ReviewListFilters, viewerId?: string | null) {
  const conditions: SQL[] = [];
  if (filters.matchId) conditions.push(eq(reviews.matchId, filters.matchId));
  if (filters.authorIds) conditions.push(inArray(reviews.userId, filters.authorIds));
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const rows = await db
    .select({
      review: reviews,
      author: users,
      likesCount: likeAgg.likesCount,
      match: matches,
      homeTeam: homeTeams,
      awayTeam: awayTeams,
      competition: competitions,
    })
    .from(reviews)
    .innerJoin(users, eq(reviews.userId, users.id))
    .innerJoin(matches, eq(reviews.matchId, matches.id))
    .innerJoin(homeTeams, eq(matches.homeTeamId, homeTeams.id))
    .innerJoin(awayTeams, eq(matches.awayTeamId, awayTeams.id))
    .innerJoin(competitions, eq(matches.competitionId, competitions.id))
    .leftJoin(likeAgg, eq(likeAgg.reviewId, reviews.id))
    .where(where)
    .orderBy(desc(reviews.createdAt))
    .limit(filters.pageSize)
    .offset((filters.page - 1) * filters.pageSize);

  const [{ total }] = await db.select({ total: count() }).from(reviews).where(where);

  const likedSet = new Set<string>();
  if (viewerId && rows.length > 0) {
    const liked = await db
      .select({ reviewId: reviewLikes.reviewId })
      .from(reviewLikes)
      .where(
        and(
          eq(reviewLikes.userId, viewerId),
          inArray(
            reviewLikes.reviewId,
            rows.map((r) => r.review.id),
          ),
        ),
      );
    liked.forEach((l) => likedSet.add(l.reviewId));
  }

  const items: Review[] = rows.map((row) => ({
    id: row.review.id,
    matchId: row.review.matchId,
    match: {
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
      averageRating: null,
      ratingsCount: 0,
    },
    user: {
      id: row.author.id,
      username: row.author.username,
      name: row.author.name,
      avatarUrl: row.author.avatarUrl,
      bio: row.author.bio,
      createdAt: row.author.createdAt.toISOString(),
      matchesCount: 0,
      reviewsCount: 0,
      followersCount: 0,
      followingCount: 0,
      averageRating: null,
    },
    rating: row.review.rating ? Number(row.review.rating) : null,
    body: row.review.body,
    likesCount: row.likesCount ?? 0,
    likedByViewer: likedSet.has(row.review.id),
    createdAt: row.review.createdAt.toISOString(),
    updatedAt: row.review.updatedAt.toISOString(),
  }));

  return { items, total };
}
