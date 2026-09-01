import { desc, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import type { FastifyInstance } from "fastify";
import { db } from "../db/client.js";
import { competitions, matches, ratings, teams } from "../db/schema.js";
import { toCompetition, toTeam } from "../lib/mappers.js";
import { requireAuth } from "../lib/require-auth.js";

const homeTeams = alias(teams, "diary_home_teams");
const awayTeams = alias(teams, "diary_away_teams");

export async function diaryRoutes(app: FastifyInstance) {
  app.get("/", async (request, reply) => {
    const userId = requireAuth(request);

    const rows = await db
      .select({
        rating: ratings,
        match: matches,
        homeTeam: homeTeams,
        awayTeam: awayTeams,
        competition: competitions,
      })
      .from(ratings)
      .innerJoin(matches, eq(ratings.matchId, matches.id))
      .innerJoin(homeTeams, eq(matches.homeTeamId, homeTeams.id))
      .innerJoin(awayTeams, eq(matches.awayTeamId, awayTeams.id))
      .innerJoin(competitions, eq(matches.competitionId, competitions.id))
      .where(eq(ratings.userId, userId))
      .orderBy(desc(matches.dateTime));

    reply.send(
      rows.map((row) => ({
        ratingId: row.rating.id,
        ratingValue: Number(row.rating.value),
        ratedAt: row.rating.updatedAt.toISOString(),
        match: {
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
        },
      })),
    );
  });
}
