import { eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { db } from "../db/client.js";
import { competitions } from "../db/schema.js";
import { notFound } from "../lib/errors.js";
import { toCompetition } from "../lib/mappers.js";

export async function competitionsRoutes(app: FastifyInstance) {
  app.get("/", async (_request, reply) => {
    const rows = await db.select().from(competitions).limit(50);
    reply.send(rows.map(toCompetition));
  });

  app.get("/:id", async (request, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const [row] = await db.select().from(competitions).where(eq(competitions.id, id)).limit(1);
    if (!row) throw notFound("Competition not found");
    reply.send(toCompetition(row));
  });
}
