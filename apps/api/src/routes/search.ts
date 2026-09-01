import { ilike, or } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { db } from "../db/client.js";
import { competitions, teams, users } from "../db/schema.js";
import { listMatches } from "../lib/matches-query.js";
import { toCompetition, toTeam } from "../lib/mappers.js";
import { fetchUserPublic } from "../lib/user-profile.js";

export async function searchRoutes(app: FastifyInstance) {
  app.get("/", async (request, reply) => {
    const { q } = z.object({ q: z.string().min(1) }).parse(request.query);

    const [matchResults, teamRows, competitionRows, userRows] = await Promise.all([
      listMatches({ q, page: 1, pageSize: 8 }),
      db.select().from(teams).where(ilike(teams.name, `%${q}%`)).limit(8),
      db.select().from(competitions).where(ilike(competitions.name, `%${q}%`)).limit(8),
      db
        .select()
        .from(users)
        .where(or(ilike(users.username, `%${q}%`), ilike(users.name, `%${q}%`)))
        .limit(8),
    ]);

    const userProfiles = await Promise.all(userRows.map((u) => fetchUserPublic(u.id, request.userId)));

    reply.send({
      matches: matchResults.items,
      teams: teamRows.map(toTeam),
      competitions: competitionRows.map(toCompetition),
      users: userProfiles.filter(Boolean),
    });
  });
}
