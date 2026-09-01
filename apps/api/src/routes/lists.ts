import { listAddMatchSchema, listCreateSchema, listUpdateSchema } from "@tribuna/shared";
import { and, count, desc, eq, inArray } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { db } from "../db/client.js";
import { competitions, listMatches, lists, matches, teams, users } from "../db/schema.js";
import { forbidden, notFound } from "../lib/errors.js";
import { toCompetition, toTeam } from "../lib/mappers.js";
import { requireAuth } from "../lib/require-auth.js";
import { fetchUserPublic } from "../lib/user-profile.js";

const homeTeams = alias(teams, "list_home_teams");
const awayTeams = alias(teams, "list_away_teams");

async function listSummary(row: typeof lists.$inferSelect, viewerId?: string | null) {
  const [author, [{ total }]] = await Promise.all([
    fetchUserPublic(row.userId, viewerId),
    db.select({ total: count() }).from(listMatches).where(eq(listMatches.listId, row.id)),
  ]);
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    coverUrl: row.coverUrl,
    author,
    matchesCount: total,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function listsRoutes(app: FastifyInstance) {
  app.get("/", async (request, reply) => {
    const query = z
      .object({
        username: z.string().optional(),
        page: z.coerce.number().int().min(1).default(1),
        pageSize: z.coerce.number().int().min(1).max(50).default(20),
      })
      .parse(request.query);

    let ownerId: string | undefined;
    if (query.username) {
      const [owner] = await db.select({ id: users.id }).from(users).where(eq(users.username, query.username)).limit(1);
      if (!owner) throw notFound("User not found");
      ownerId = owner.id;
    }

    const rows = await db
      .select()
      .from(lists)
      .where(ownerId ? eq(lists.userId, ownerId) : undefined)
      .orderBy(desc(lists.createdAt))
      .limit(query.pageSize)
      .offset((query.page - 1) * query.pageSize);

    const items = await Promise.all(rows.map((r) => listSummary(r, request.userId)));
    reply.send({ items, page: query.page, pageSize: query.pageSize });
  });

  app.get("/mine", async (request, reply) => {
    const userId = requireAuth(request);
    const query = z.object({ matchId: z.string().uuid().optional() }).parse(request.query);

    const rows = await db.select().from(lists).where(eq(lists.userId, userId)).orderBy(desc(lists.createdAt));

    let containsSet = new Set<string>();
    if (query.matchId && rows.length > 0) {
      const inLists = await db
        .select({ listId: listMatches.listId })
        .from(listMatches)
        .where(and(eq(listMatches.matchId, query.matchId), inArray(listMatches.listId, rows.map((r) => r.id))));
      containsSet = new Set(inLists.map((r) => r.listId));
    }

    const items = await Promise.all(
      rows.map(async (r) => {
        const [{ total }] = await db.select({ total: count() }).from(listMatches).where(eq(listMatches.listId, r.id));
        return {
          id: r.id,
          name: r.name,
          description: r.description,
          coverUrl: r.coverUrl,
          matchesCount: total,
          containsMatch: containsSet.has(r.id),
        };
      }),
    );

    reply.send(items);
  });

  app.get("/:id", async (request, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const [row] = await db.select().from(lists).where(eq(lists.id, id)).limit(1);
    if (!row) throw notFound("List not found");

    const matchRows = await db
      .select({ match: matches, homeTeam: homeTeams, awayTeam: awayTeams, competition: competitions })
      .from(listMatches)
      .innerJoin(matches, eq(listMatches.matchId, matches.id))
      .innerJoin(homeTeams, eq(matches.homeTeamId, homeTeams.id))
      .innerJoin(awayTeams, eq(matches.awayTeamId, awayTeams.id))
      .innerJoin(competitions, eq(matches.competitionId, competitions.id))
      .where(eq(listMatches.listId, id))
      .orderBy(desc(listMatches.addedAt));

    const summary = await listSummary(row, request.userId);
    reply.send({
      ...summary,
      matches: matchRows.map((r) => ({
        id: r.match.id,
        externalId: r.match.externalId,
        homeTeam: toTeam(r.homeTeam),
        awayTeam: toTeam(r.awayTeam),
        homeScore: r.match.homeScore,
        awayScore: r.match.awayScore,
        competition: toCompetition(r.competition),
        round: r.match.round,
        stadium: r.match.stadium,
        dateTime: r.match.dateTime.toISOString(),
        status: r.match.status,
        averageRating: null,
        ratingsCount: 0,
      })),
    });
  });

  app.post("/", async (request, reply) => {
    const userId = requireAuth(request);
    const input = listCreateSchema.parse(request.body);
    const [created] = await db
      .insert(lists)
      .values({ userId, name: input.name, description: input.description ?? null, coverUrl: input.coverUrl ?? null })
      .returning();
    reply.status(201).send(await listSummary(created, userId));
  });

  app.patch("/:id", async (request, reply) => {
    const userId = requireAuth(request);
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const input = listUpdateSchema.parse(request.body);

    const [existing] = await db.select().from(lists).where(eq(lists.id, id)).limit(1);
    if (!existing) throw notFound("List not found");
    if (existing.userId !== userId) throw forbidden("You can only edit your own lists");

    const [updated] = await db
      .update(lists)
      .set({
        name: input.name ?? existing.name,
        description: input.description !== undefined ? input.description : existing.description,
        coverUrl: input.coverUrl !== undefined ? input.coverUrl : existing.coverUrl,
        updatedAt: new Date(),
      })
      .where(eq(lists.id, id))
      .returning();
    reply.send(await listSummary(updated, userId));
  });

  app.delete("/:id", async (request, reply) => {
    const userId = requireAuth(request);
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);

    const [existing] = await db.select().from(lists).where(eq(lists.id, id)).limit(1);
    if (!existing) throw notFound("List not found");
    if (existing.userId !== userId) throw forbidden("You can only delete your own lists");

    await db.delete(lists).where(eq(lists.id, id));
    reply.status(204).send();
  });

  app.post("/:id/matches", async (request, reply) => {
    const userId = requireAuth(request);
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const input = listAddMatchSchema.parse(request.body);

    const [list] = await db.select().from(lists).where(eq(lists.id, id)).limit(1);
    if (!list) throw notFound("List not found");
    if (list.userId !== userId) throw forbidden("You can only edit your own lists");

    const [match] = await db.select({ id: matches.id }).from(matches).where(eq(matches.id, input.matchId)).limit(1);
    if (!match) throw notFound("Match not found");

    const [existing] = await db
      .select({ id: listMatches.id })
      .from(listMatches)
      .where(and(eq(listMatches.listId, id), eq(listMatches.matchId, input.matchId)))
      .limit(1);
    if (!existing) {
      await db.insert(listMatches).values({ listId: id, matchId: input.matchId });
    }
    reply.status(204).send();
  });

  app.delete("/:id/matches/:matchId", async (request, reply) => {
    const userId = requireAuth(request);
    const { id, matchId } = z
      .object({ id: z.string().uuid(), matchId: z.string().uuid() })
      .parse(request.params);

    const [list] = await db.select().from(lists).where(eq(lists.id, id)).limit(1);
    if (!list) throw notFound("List not found");
    if (list.userId !== userId) throw forbidden("You can only edit your own lists");

    await db.delete(listMatches).where(and(eq(listMatches.listId, id), eq(listMatches.matchId, matchId)));
    reply.status(204).send();
  });
}
