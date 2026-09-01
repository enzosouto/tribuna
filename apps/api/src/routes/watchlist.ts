import { watchlistAddSchema, FUTURE_MATCH_STATUSES } from "@tribuna/shared";
import { and, asc, eq, gt, or } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { db } from "../db/client.js";
import { competitions, matches, teams, watchlist } from "../db/schema.js";
import { badRequest, notFound } from "../lib/errors.js";
import { toCompetition, toTeam } from "../lib/mappers.js";
import { requireAuth } from "../lib/require-auth.js";

const homeTeams = alias(teams, "wl_home_teams");
const awayTeams = alias(teams, "wl_away_teams");

export async function watchlistRoutes(app: FastifyInstance) {
  app.get("/", async (request, reply) => {
    const userId = requireAuth(request);

    const rows = await db
      .select({ match: matches, homeTeam: homeTeams, awayTeam: awayTeams, competition: competitions })
      .from(watchlist)
      .innerJoin(matches, eq(watchlist.matchId, matches.id))
      .innerJoin(homeTeams, eq(matches.homeTeamId, homeTeams.id))
      .innerJoin(awayTeams, eq(matches.awayTeamId, awayTeams.id))
      .innerJoin(competitions, eq(matches.competitionId, competitions.id))
      .where(
        and(
          eq(watchlist.userId, userId),
          gt(matches.dateTime, new Date()),
          or(eq(matches.status, "SCHEDULED"), eq(matches.status, "TIMED")),
        ),
      )
      .orderBy(asc(matches.dateTime));

    reply.send(
      rows.map((row) => ({
        id: row.match.id,
        externalId: row.match.externalId,
        homeTeam: toTeam(row.homeTeam),
        awayTeam: toTeam(row.awayTeam),
        homeScore: row.match.homeScore,
        awayScore: row.match.awayScore,
        competition: toCompetition(row.competition),
        round: row.match.round,
        stadium: row.match.stadium,
        dateTime: row.match.dateTime.toISOString(),
        status: row.match.status,
        averageRating: null,
        ratingsCount: 0,
      })),
    );
  });

  app.post("/", async (request, reply) => {
    const userId = requireAuth(request);
    const input = watchlistAddSchema.parse(request.body);

    const [match] = await db.select().from(matches).where(eq(matches.id, input.matchId)).limit(1);
    if (!match) throw notFound("Match not found");

    const isFuture = match.dateTime.getTime() > Date.now();
    const hasFutureStatus = (FUTURE_MATCH_STATUSES as string[]).includes(match.status);
    if (!isFuture || !hasFutureStatus) {
      throw badRequest("Only upcoming matches (not yet started) can be added to the watchlist");
    }

    const [existing] = await db
      .select({ id: watchlist.id })
      .from(watchlist)
      .where(and(eq(watchlist.userId, userId), eq(watchlist.matchId, input.matchId)))
      .limit(1);
    if (existing) {
      reply.status(200).send({ inWatchlist: true });
      return;
    }

    await db.insert(watchlist).values({ userId, matchId: input.matchId });
    reply.status(201).send({ inWatchlist: true });
  });

  app.delete("/:matchId", async (request, reply) => {
    const userId = requireAuth(request);
    const { matchId } = z.object({ matchId: z.string().uuid() }).parse(request.params);
    await db.delete(watchlist).where(and(eq(watchlist.userId, userId), eq(watchlist.matchId, matchId)));
    reply.status(204).send();
  });
}
