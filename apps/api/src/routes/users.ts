import { changePasswordSchema, updateProfileSchema } from "@tribuna/shared";
import { count, desc, eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { hashPassword, verifyPassword } from "../auth/password.js";
import { db } from "../db/client.js";
import { follows, lists, users } from "../db/schema.js";
import { conflict, notFound, unauthorized } from "../lib/errors.js";
import { requireAuth } from "../lib/require-auth.js";
import { fetchUserPublic } from "../lib/user-profile.js";

export async function usersRoutes(app: FastifyInstance) {
  app.get("/", async (request, reply) => {
    const query = z
      .object({ sort: z.enum(["popular"]).default("popular"), pageSize: z.coerce.number().int().min(1).max(50).default(10) })
      .parse(request.query);

    const followerAgg = db
      .select({ followingId: follows.followingId, followerCount: count(follows.id).as("follower_count") })
      .from(follows)
      .groupBy(follows.followingId)
      .as("follower_agg");

    const rows = await db
      .select({ user: users, followerCount: followerAgg.followerCount })
      .from(users)
      .leftJoin(followerAgg, eq(followerAgg.followingId, users.id))
      .orderBy(desc(followerAgg.followerCount))
      .limit(query.pageSize);

    const profiles = await Promise.all(rows.map((r) => fetchUserPublic(r.user.id, request.userId)));
    reply.send(profiles.filter(Boolean));
  });

  app.patch("/me", async (request, reply) => {
    const userId = requireAuth(request);
    const input = updateProfileSchema.parse(request.body);

    if (input.username) {
      const [existing] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.username, input.username))
        .limit(1);
      if (existing && existing.id !== userId) throw conflict("Username already in use");
    }

    await db
      .update(users)
      .set({
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.username !== undefined ? { username: input.username } : {}),
        ...(input.bio !== undefined ? { bio: input.bio } : {}),
        ...(input.avatarUrl !== undefined ? { avatarUrl: input.avatarUrl } : {}),
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    const profile = await fetchUserPublic(userId, userId);
    reply.send(profile);
  });

  app.post("/me/password", async (request, reply) => {
    const userId = requireAuth(request);
    const input = changePasswordSchema.parse(request.body);

    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) throw notFound("User not found");

    const valid = await verifyPassword(input.currentPassword, user.passwordHash);
    if (!valid) throw unauthorized("Current password is incorrect");

    const passwordHash = await hashPassword(input.newPassword);
    await db.update(users).set({ passwordHash, updatedAt: new Date() }).where(eq(users.id, userId));
    reply.status(204).send();
  });

  app.get("/:username", async (request, reply) => {
    const { username } = z.object({ username: z.string() }).parse(request.params);
    const [user] = await db.select({ id: users.id }).from(users).where(eq(users.username, username)).limit(1);
    if (!user) throw notFound("User not found");
    const profile = await fetchUserPublic(user.id, request.userId);
    reply.send(profile);
  });

  app.get("/:username/followers", async (request, reply) => {
    const { username } = z.object({ username: z.string() }).parse(request.params);
    const [user] = await db.select({ id: users.id }).from(users).where(eq(users.username, username)).limit(1);
    if (!user) throw notFound("User not found");

    const rows = await db
      .select({ follower: users })
      .from(follows)
      .innerJoin(users, eq(follows.followerId, users.id))
      .where(eq(follows.followingId, user.id))
      .orderBy(desc(follows.createdAt))
      .limit(100);

    const profiles = await Promise.all(rows.map((r) => fetchUserPublic(r.follower.id, request.userId)));
    reply.send(profiles.filter(Boolean));
  });

  app.get("/:username/following", async (request, reply) => {
    const { username } = z.object({ username: z.string() }).parse(request.params);
    const [user] = await db.select({ id: users.id }).from(users).where(eq(users.username, username)).limit(1);
    if (!user) throw notFound("User not found");

    const rows = await db
      .select({ followee: users })
      .from(follows)
      .innerJoin(users, eq(follows.followingId, users.id))
      .where(eq(follows.followerId, user.id))
      .orderBy(desc(follows.createdAt))
      .limit(100);

    const profiles = await Promise.all(rows.map((r) => fetchUserPublic(r.followee.id, request.userId)));
    reply.send(profiles.filter(Boolean));
  });

  app.get("/:username/lists", async (request, reply) => {
    const { username } = z.object({ username: z.string() }).parse(request.params);
    const [user] = await db.select({ id: users.id }).from(users).where(eq(users.username, username)).limit(1);
    if (!user) throw notFound("User not found");

    const rows = await db.select().from(lists).where(eq(lists.userId, user.id)).orderBy(desc(lists.createdAt));
    reply.send(rows);
  });
}
