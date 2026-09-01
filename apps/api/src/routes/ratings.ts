import { ratingSchema } from "@tribuna/shared";
import { and, eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { db } from "../db/client.js";
import { matches, ratings } from "../db/schema.js";
import { notFound } from "../lib/errors.js";
import { assertMatchIsRatable } from "../lib/match-rules.js";
import { requireAuth } from "../lib/require-auth.js";

export async function ratingsRoutes(app: FastifyInstance) {
  app.post("/", async (request, reply) => {
    const userId = requireAuth(request);
    const input = ratingSchema.parse(request.body);

    const [match] = await db.select().from(matches).where(eq(matches.id, input.matchId)).limit(1);
    if (!match) throw notFound("Match not found");
    assertMatchIsRatable(match);

    const [existing] = await db
      .select()
      .from(ratings)
      .where(and(eq(ratings.userId, userId), eq(ratings.matchId, input.matchId)))
      .limit(1);

    if (existing) {
      const [updated] = await db
        .update(ratings)
        .set({ value: input.value.toString(), updatedAt: new Date() })
        .where(eq(ratings.id, existing.id))
        .returning();
      reply.send({ id: updated.id, matchId: updated.matchId, value: Number(updated.value) });
      return;
    }

    const [created] = await db
      .insert(ratings)
      .values({ userId, matchId: input.matchId, value: input.value.toString() })
      .returning();
    reply.status(201).send({ id: created.id, matchId: created.matchId, value: Number(created.value) });
  });

  app.delete("/:matchId", async (request, reply) => {
    const userId = requireAuth(request);
    const { matchId } = request.params as { matchId: string };
    await db.delete(ratings).where(and(eq(ratings.userId, userId), eq(ratings.matchId, matchId)));
    reply.status(204).send();
  });
}
