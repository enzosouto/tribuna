import { MATCH_STATUSES } from "@tribuna/shared";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { fetchMatchDetail, listMatches } from "../lib/matches-query.js";
import { notFound } from "../lib/errors.js";

const listQuerySchema = z.object({
  status: z.enum(MATCH_STATUSES).optional(),
  upcoming: z.coerce.boolean().optional(),
  competitionId: z.string().uuid().optional(),
  teamId: z.string().uuid().optional(),
  q: z.string().min(1).optional(),
  sort: z.enum(["recent", "upcoming", "popular", "top_rated"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

export async function matchesRoutes(app: FastifyInstance) {
  app.get("/", async (request, reply) => {
    const query = listQuerySchema.parse(request.query);
    const { items, total } = await listMatches(query);
    reply.send({
      items,
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
    });
  });

  app.get("/:id", async (request, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const detail = await fetchMatchDetail(id, request.userId);
    if (!detail) throw notFound("Match not found");
    reply.send(detail);
  });
}
