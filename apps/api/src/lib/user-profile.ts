import { and, avg, count, eq } from "drizzle-orm";
import type { UserPublic } from "@tribuna/shared";
import { db } from "../db/client.js";
import { follows, ratings, reviews, users, watchlist } from "../db/schema.js";

export async function fetchUserPublic(
  userId: string,
  viewerId?: string | null,
): Promise<UserPublic | null> {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return null;

  const [[ratingAgg], [reviewAgg], [followerAgg], [followingAgg], follow] = await Promise.all([
    db
      .select({ count: count(), avg: avg(ratings.value) })
      .from(ratings)
      .where(eq(ratings.userId, userId)),
    db.select({ count: count() }).from(reviews).where(eq(reviews.userId, userId)),
    db.select({ count: count() }).from(follows).where(eq(follows.followingId, userId)),
    db.select({ count: count() }).from(follows).where(eq(follows.followerId, userId)),
    viewerId && viewerId !== userId
      ? db
          .select()
          .from(follows)
          .where(and(eq(follows.followerId, viewerId), eq(follows.followingId, userId)))
          .limit(1)
      : Promise.resolve([]),
  ]);

  return {
    id: user.id,
    username: user.username,
    name: user.name,
    avatarUrl: user.avatarUrl,
    bio: user.bio,
    createdAt: user.createdAt.toISOString(),
    matchesCount: ratingAgg?.count ?? 0,
    reviewsCount: reviewAgg?.count ?? 0,
    followersCount: followerAgg?.count ?? 0,
    followingCount: followingAgg?.count ?? 0,
    averageRating: ratingAgg?.avg ? Number(ratingAgg.avg) : null,
    isFollowedByViewer: viewerId ? follow.length > 0 : undefined,
    isViewer: viewerId ? viewerId === userId : undefined,
    role: viewerId === userId ? user.role : undefined,
  };
}

export async function isMatchInWatchlist(userId: string, matchId: string): Promise<boolean> {
  const [row] = await db
    .select()
    .from(watchlist)
    .where(and(eq(watchlist.userId, userId), eq(watchlist.matchId, matchId)))
    .limit(1);
  return !!row;
}
