import { reviewCreateSchema, reviewUpdateSchema } from "@tribuna/shared";
import { and, eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { db } from "../db/client.js";
import { follows, matches, ratings, reviewLikes, reviews, users } from "../db/schema.js";
import { conflict, forbidden, notFound } from "../lib/errors.js";
import { assertMatchIsRatable } from "../lib/match-rules.js";
import { requireAuth } from "../lib/require-auth.js";
import { listReviews } from "../lib/reviews-query.js";

async function upsertRatingFromReview(userId: string, matchId: string, value: number | null | undefined) {
  if (value === null || value === undefined) return;
  const [existing] = await db
    .select({ id: ratings.id })
    .from(ratings)
    .where(and(eq(ratings.userId, userId), eq(ratings.matchId, matchId)))
    .limit(1);
  if (existing) {
    await db.update(ratings).set({ value: value.toString(), updatedAt: new Date() }).where(eq(ratings.id, existing.id));
  } else {
    await db.insert(ratings).values({ userId, matchId, value: value.toString() });
  }
}

export async function reviewsRoutes(app: FastifyInstance) {
  app.get("/", async (request, reply) => {
    const query = z
      .object({
        matchId: z.string().uuid().optional(),
        username: z.string().optional(),
        feed: z.enum(["following"]).optional(),
        page: z.coerce.number().int().min(1).default(1),
        pageSize: z.coerce.number().int().min(1).max(50).default(20),
      })
      .parse(request.query);

    let authorIds: string[] | undefined;
    if (query.username) {
      const [author] = await db.select({ id: users.id }).from(users).where(eq(users.username, query.username)).limit(1);
      if (!author) throw notFound("User not found");
      authorIds = [author.id];
    } else if (query.feed === "following") {
      const userId = requireAuth(request);
      const followingRows = await db
        .select({ id: follows.followingId })
        .from(follows)
        .where(eq(follows.followerId, userId));
      authorIds = followingRows.map((r) => r.id);
      if (authorIds.length === 0) {
        reply.send({ items: [], page: query.page, pageSize: query.pageSize, total: 0, totalPages: 1 });
        return;
      }
    }

    const { items, total } = await listReviews(
      { matchId: query.matchId, authorIds, page: query.page, pageSize: query.pageSize },
      request.userId,
    );
    reply.send({
      items,
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
    });
  });

  app.post("/", async (request, reply) => {
    const userId = requireAuth(request);
    const input = reviewCreateSchema.parse(request.body);

    const [match] = await db.select().from(matches).where(eq(matches.id, input.matchId)).limit(1);
    if (!match) throw notFound("Match not found");
    assertMatchIsRatable(match);

    const [existing] = await db
      .select({ id: reviews.id })
      .from(reviews)
      .where(and(eq(reviews.userId, userId), eq(reviews.matchId, input.matchId)))
      .limit(1);
    if (existing) throw conflict("You already reviewed this match. Edit your existing review instead.");

    const [created] = await db
      .insert(reviews)
      .values({
        userId,
        matchId: input.matchId,
        body: input.body,
        rating: input.rating != null ? input.rating.toString() : null,
      })
      .returning();

    await upsertRatingFromReview(userId, input.matchId, input.rating);

    reply.status(201).send(created);
  });

  app.patch("/:id", async (request, reply) => {
    const userId = requireAuth(request);
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const input = reviewUpdateSchema.parse(request.body);

    const [existing] = await db.select().from(reviews).where(eq(reviews.id, id)).limit(1);
    if (!existing) throw notFound("Review not found");
    if (existing.userId !== userId) throw forbidden("You can only edit your own review");

    const [updated] = await db
      .update(reviews)
      .set({
        body: input.body ?? existing.body,
        rating: input.rating !== undefined ? (input.rating != null ? input.rating.toString() : null) : existing.rating,
        updatedAt: new Date(),
      })
      .where(eq(reviews.id, id))
      .returning();

    if (input.rating !== undefined) {
      await upsertRatingFromReview(userId, existing.matchId, input.rating);
    }

    reply.send(updated);
  });

  app.delete("/:id", async (request, reply) => {
    const userId = requireAuth(request);
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);

    const [existing] = await db.select().from(reviews).where(eq(reviews.id, id)).limit(1);
    if (!existing) throw notFound("Review not found");
    if (existing.userId !== userId) throw forbidden("You can only delete your own review");

    await db.delete(reviews).where(eq(reviews.id, id));
    reply.status(204).send();
  });

  app.post("/:id/like", async (request, reply) => {
    const userId = requireAuth(request);
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);

    const [review] = await db.select({ id: reviews.id }).from(reviews).where(eq(reviews.id, id)).limit(1);
    if (!review) throw notFound("Review not found");

    const [existing] = await db
      .select({ id: reviewLikes.id })
      .from(reviewLikes)
      .where(and(eq(reviewLikes.reviewId, id), eq(reviewLikes.userId, userId)))
      .limit(1);
    if (!existing) {
      await db.insert(reviewLikes).values({ reviewId: id, userId });
    }
    reply.status(204).send();
  });

  app.delete("/:id/like", async (request, reply) => {
    const userId = requireAuth(request);
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    await db.delete(reviewLikes).where(and(eq(reviewLikes.reviewId, id), eq(reviewLikes.userId, userId)));
    reply.status(204).send();
  });
}
