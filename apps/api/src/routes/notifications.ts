import { and, desc, eq, isNull, count } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { db } from "../db/client.js";
import { notifications, users } from "../db/schema.js";
import { requireAuth } from "../lib/require-auth.js";

export async function notificationsRoutes(app: FastifyInstance) {
  app.get("/", async (request, reply) => {
    const recipientId = requireAuth(request);

    const rows = await db
      .select({ notification: notifications, actor: users })
      .from(notifications)
      .innerJoin(users, eq(notifications.actorId, users.id))
      .where(eq(notifications.recipientId, recipientId))
      .orderBy(desc(notifications.createdAt))
      .limit(30);

    reply.send(
      rows.map((row) => ({
        id: row.notification.id,
        type: row.notification.type,
        read: row.notification.readAt !== null,
        createdAt: row.notification.createdAt.toISOString(),
        actor: {
          id: row.actor.id,
          username: row.actor.username,
          name: row.actor.name,
          avatarUrl: row.actor.avatarUrl,
        },
      })),
    );
  });

  app.get("/unread-count", async (request, reply) => {
    const recipientId = requireAuth(request);
    const [row] = await db
      .select({ count: count() })
      .from(notifications)
      .where(and(eq(notifications.recipientId, recipientId), isNull(notifications.readAt)));
    reply.send({ count: row?.count ?? 0 });
  });

  app.post("/read", async (request, reply) => {
    const recipientId = requireAuth(request);
    await db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(and(eq(notifications.recipientId, recipientId), isNull(notifications.readAt)));
    reply.status(204).send();
  });
}
