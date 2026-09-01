import { and, eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { db } from "../db/client.js";
import { follows, notifications, users } from "../db/schema.js";
import { badRequest, conflict, notFound } from "../lib/errors.js";
import { requireAuth } from "../lib/require-auth.js";

export async function followsRoutes(app: FastifyInstance) {
  app.post("/", async (request, reply) => {
    const followerId = requireAuth(request);
    const { username } = z.object({ username: z.string() }).parse(request.body);

    const [target] = await db.select({ id: users.id }).from(users).where(eq(users.username, username)).limit(1);
    if (!target) throw notFound("User not found");
    if (target.id === followerId) throw badRequest("You cannot follow yourself");

    const [existing] = await db
      .select({ id: follows.id })
      .from(follows)
      .where(and(eq(follows.followerId, followerId), eq(follows.followingId, target.id)))
      .limit(1);
    if (existing) throw conflict("Already following this user");

    await db.insert(follows).values({ followerId, followingId: target.id });
    await db.insert(notifications).values({
      recipientId: target.id,
      actorId: followerId,
      type: "FOLLOW",
    });
    reply.status(201).send({ following: true });
  });

  app.delete("/:username", async (request, reply) => {
    const followerId = requireAuth(request);
    const { username } = z.object({ username: z.string() }).parse(request.params);

    const [target] = await db.select({ id: users.id }).from(users).where(eq(users.username, username)).limit(1);
    if (!target) throw notFound("User not found");

    await db
      .delete(follows)
      .where(and(eq(follows.followerId, followerId), eq(follows.followingId, target.id)));
    reply.status(204).send();
  });
}
