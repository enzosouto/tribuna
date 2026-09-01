import { count, desc, eq, ilike, or } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { db } from "../db/client.js";
import { ratings, reviews, users } from "../db/schema.js";
import { badRequest, notFound } from "../lib/errors.js";
import { requireAdmin } from "../lib/require-admin.js";

export async function adminRoutes(app: FastifyInstance) {
  app.get("/users", async (request, reply) => {
    await requireAdmin(request);

    const query = z
      .object({
        q: z.string().trim().min(1).optional(),
        page: z.coerce.number().int().min(1).default(1),
        pageSize: z.coerce.number().int().min(1).max(100).default(25),
      })
      .parse(request.query);

    const where = query.q
      ? or(
          ilike(users.name, `%${query.q}%`),
          ilike(users.username, `%${query.q}%`),
          ilike(users.email, `%${query.q}%`),
        )
      : undefined;

    const [rows, [{ total }]] = await Promise.all([
      db
        .select()
        .from(users)
        .where(where)
        .orderBy(desc(users.createdAt))
        .limit(query.pageSize)
        .offset((query.page - 1) * query.pageSize),
      db.select({ total: count() }).from(users).where(where),
    ]);

    const items = await Promise.all(
      rows.map(async (u) => {
        const [[ratingAgg], [reviewAgg]] = await Promise.all([
          db.select({ count: count() }).from(ratings).where(eq(ratings.userId, u.id)),
          db.select({ count: count() }).from(reviews).where(eq(reviews.userId, u.id)),
        ]);
        return {
          id: u.id,
          name: u.name,
          username: u.username,
          email: u.email,
          role: u.role,
          status: u.status,
          avatarUrl: u.avatarUrl,
          createdAt: u.createdAt.toISOString(),
          matchesCount: ratingAgg?.count ?? 0,
          reviewsCount: reviewAgg?.count ?? 0,
        };
      }),
    );

    reply.send({
      items,
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
    });
  });

  app.post("/users/:id/ban", async (request, reply) => {
    const adminId = await requireAdmin(request);
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    if (id === adminId) throw badRequest("You cannot ban your own account");

    const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.id, id)).limit(1);
    if (!existing) throw notFound("User not found");

    await db.update(users).set({ status: "banned", bannedAt: new Date() }).where(eq(users.id, id));
    reply.status(204).send();
  });

  app.post("/users/:id/unban", async (request, reply) => {
    await requireAdmin(request);
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);

    const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.id, id)).limit(1);
    if (!existing) throw notFound("User not found");

    await db.update(users).set({ status: "active", bannedAt: null }).where(eq(users.id, id));
    reply.status(204).send();
  });

  app.delete("/users/:id", async (request, reply) => {
    const adminId = await requireAdmin(request);
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);

    if (id === adminId) throw badRequest("You cannot delete your own account from the admin panel");

    const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.id, id)).limit(1);
    if (!existing) throw notFound("User not found");

    await db.delete(users).where(eq(users.id, id));
    reply.status(204).send();
  });
}
