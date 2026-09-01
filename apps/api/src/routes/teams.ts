import { eq, ilike } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { db } from "../db/client.js";
import { teams } from "../db/schema.js";
import { notFound } from "../lib/errors.js";
import { toTeam } from "../lib/mappers.js";

export async function teamsRoutes(app: FastifyInstance) {
  app.get("/", async (request, reply) => {
    const { q } = z.object({ q: z.string().optional() }).parse(request.query);
    const rows = q
      ? await db.select().from(teams).where(ilike(teams.name, `%${q}%`)).limit(50)
      : await db.select().from(teams).limit(50);
    reply.send(rows.map(toTeam));
  });

  app.get("/:id", async (request, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const [row] = await db.select().from(teams).where(eq(teams.id, id)).limit(1);
    if (!row) throw notFound("Team not found");
    reply.send(toTeam(row));
  });
}
