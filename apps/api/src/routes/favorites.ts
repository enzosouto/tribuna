import { and, eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { db } from "../db/client.js";
import { favorites, matches } from "../db/schema.js";
import { notFound } from "../lib/errors.js";
import { requireAuth } from "../lib/require-auth.js";

export async function favoritesRoutes(app: FastifyInstance) {
  app.post("/:matchId", async (request, reply) => {
    const userId = requireAuth(request);
    const { matchId } = z.object({ matchId: z.string().uuid() }).parse(request.params);

    const [match] = await db.select({ id: matches.id }).from(matches).where(eq(matches.id, matchId)).limit(1);
    if (!match) throw notFound("Match not found");

    const [existing] = await db
      .select({ id: favorites.id })
      .from(favorites)
      .where(and(eq(favorites.userId, userId), eq(favorites.matchId, matchId)))
      .limit(1);
    if (!existing) {
      await db.insert(favorites).values({ userId, matchId });
    }
    reply.status(204).send();
  });

  app.delete("/:matchId", async (request, reply) => {
    const userId = requireAuth(request);
    const { matchId } = z.object({ matchId: z.string().uuid() }).parse(request.params);
    await db.delete(favorites).where(and(eq(favorites.userId, userId), eq(favorites.matchId, matchId)));
    reply.status(204).send();
  });
}
