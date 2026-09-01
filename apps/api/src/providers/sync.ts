import { and, eq } from "drizzle-orm";
import { db } from "../db/client.js";
import {
  competitions,
  matchEvents,
  matchLineups,
  matches,
  matchStatistics,
  seasons,
  teams,
} from "../db/schema.js";
import { normalizeCompetitionName } from "../lib/normalize-name.js";
import type { FootballProvider, NormalizedTeam, NormalizedCompetition } from "./types.js";

async function upsertTeam(provider: string, team: NormalizedTeam): Promise<string> {
  const [existing] = await db
    .select({ id: teams.id })
    .from(teams)
    .where(and(eq(teams.provider, provider), eq(teams.externalId, team.externalId)))
    .limit(1);

  if (existing) {
    await db
      .update(teams)
      .set({
        name: team.name,
        shortName: team.shortName,
        crestUrl: team.crestUrl,
        country: team.country,
      })
      .where(eq(teams.id, existing.id));
    return existing.id;
  }

  // Teams are NOT merged by name across providers: short club names ("Vitória", "América")
  // are common to multiple unrelated real-world clubs, and merging by name risks mixing up
  // crests/identities. Competitions are merged by name because those names are curated
  // and specific enough (see upsertCompetition) to not collide this way.
  const [created] = await db
    .insert(teams)
    .values({ provider, ...team })
    .returning({ id: teams.id });
  return created.id;
}

async function upsertCompetition(
  provider: string,
  competition: NormalizedCompetition,
  nameCache: Map<string, string>,
): Promise<string> {
  const [existing] = await db
    .select({ id: competitions.id })
    .from(competitions)
    .where(and(eq(competitions.provider, provider), eq(competitions.externalId, competition.externalId)))
    .limit(1);

  if (existing) {
    await db
      .update(competitions)
      .set({
        name: competition.name,
        code: competition.code,
        emblemUrl: competition.emblemUrl,
        country: competition.country,
      })
      .where(eq(competitions.id, existing.id));
    return existing.id;
  }

  const nameKey = normalizeCompetitionName(competition.name);
  const byName = nameCache.get(nameKey);
  if (byName) return byName;

  const [created] = await db
    .insert(competitions)
    .values({ provider, ...competition })
    .returning({ id: competitions.id });
  nameCache.set(nameKey, created.id);
  return created.id;
}

async function upsertSeason(competitionId: string, year: string): Promise<string> {
  const [existing] = await db
    .select({ id: seasons.id })
    .from(seasons)
    .where(and(eq(seasons.competitionId, competitionId), eq(seasons.year, year)))
    .limit(1);
  if (existing) return existing.id;

  const [created] = await db
    .insert(seasons)
    .values({ competitionId, year })
    .returning({ id: seasons.id });
  return created.id;
}

export async function syncMatchesFromProvider(provider: FootballProvider) {
  const normalizedMatches = await provider.fetchMatches();
  let created = 0;
  let updated = 0;

  // Pre-load existing competitions once so cross-provider name matching doesn't re-scan
  // the table for every single match.
  const competitionNameCache = new Map<string, string>();
  for (const c of await db.select({ id: competitions.id, name: competitions.name }).from(competitions)) {
    competitionNameCache.set(normalizeCompetitionName(c.name), c.id);
  }

  for (const nm of normalizedMatches) {
    const homeTeamId = await upsertTeam(provider.name, nm.homeTeam);
    const awayTeamId = await upsertTeam(provider.name, nm.awayTeam);
    const competitionId = await upsertCompetition(provider.name, nm.competition, competitionNameCache);
    const seasonId = await upsertSeason(competitionId, nm.season.year);

    const [existingMatch] = await db
      .select({ id: matches.id })
      .from(matches)
      .where(and(eq(matches.provider, provider.name), eq(matches.externalId, nm.externalId)))
      .limit(1);

    let matchId: string;
    if (existingMatch) {
      matchId = existingMatch.id;
      await db
        .update(matches)
        .set({
          homeTeamId,
          awayTeamId,
          homeScore: nm.homeScore,
          awayScore: nm.awayScore,
          competitionId,
          seasonId,
          round: nm.round,
          stadium: nm.stadium,
          dateTime: new Date(nm.dateTime),
          status: nm.status,
          updatedAt: new Date(),
        })
        .where(eq(matches.id, matchId));
      updated++;
    } else {
      const [createdMatch] = await db
        .insert(matches)
        .values({
          provider: provider.name,
          externalId: nm.externalId,
          homeTeamId,
          awayTeamId,
          homeScore: nm.homeScore,
          awayScore: nm.awayScore,
          competitionId,
          seasonId,
          round: nm.round,
          stadium: nm.stadium,
          dateTime: new Date(nm.dateTime),
          status: nm.status,
        })
        .returning({ id: matches.id });
      matchId = createdMatch.id;
      created++;
    }

    const teamExternalToId: Record<string, string> = {
      [nm.homeTeam.externalId]: homeTeamId,
      [nm.awayTeam.externalId]: awayTeamId,
    };

    if (nm.events.length > 0) {
      await db.delete(matchEvents).where(eq(matchEvents.matchId, matchId));
      await db.insert(matchEvents).values(
        nm.events.map((e) => ({
          matchId,
          type: e.type,
          minute: e.minute,
          teamId: e.teamExternalId ? teamExternalToId[e.teamExternalId] ?? null : null,
          playerName: e.playerName,
          assistName: e.assistName,
          detail: e.detail,
        })),
      );
    }

    if (nm.statistics.length > 0) {
      await db.delete(matchStatistics).where(eq(matchStatistics.matchId, matchId));
      await db.insert(matchStatistics).values(
        nm.statistics.map((s) => ({
          matchId,
          teamId: teamExternalToId[s.teamExternalId] ?? homeTeamId,
          possession: s.possession,
          shots: s.shots,
          shotsOnTarget: s.shotsOnTarget,
          corners: s.corners,
          fouls: s.fouls,
          yellowCards: s.yellowCards,
          redCards: s.redCards,
          offsides: s.offsides,
        })),
      );
    }

    if (nm.lineups.length > 0) {
      await db.delete(matchLineups).where(eq(matchLineups.matchId, matchId));
      await db.insert(matchLineups).values(
        nm.lineups.map((l) => ({
          matchId,
          teamId: teamExternalToId[l.teamExternalId] ?? homeTeamId,
          playerName: l.playerName,
          shirtNumber: l.shirtNumber,
          position: l.position,
          role: l.role,
        })),
      );
    }
  }

  return { total: normalizedMatches.length, created, updated };
}
