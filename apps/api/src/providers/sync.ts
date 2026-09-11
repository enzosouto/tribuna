import { and, desc, eq, gt, isNotNull, isNull, lt, notInArray } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
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
import { normalizeCompetitionName, normalizeTeamName } from "../lib/normalize-name.js";
import type {
  FootballProvider,
  NormalizedMatch,
  NormalizedTeam,
  NormalizedCompetition,
} from "./types.js";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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

// Only look backwards this far: past that, a match the providers never resolved is not
// going to start resolving, and retrying it every run would burn the lookup budget.
const BACKFILL_MAX_AGE_DAYS = 45;
// Kickoff must be at least this old before a missing score counts as "stranded" rather
// than "still being played".
const BACKFILL_MIN_AGE_HOURS = 4;
const BACKFILL_MAX_PER_RUN = 25;
const BACKFILL_PACING_MS = 400;

/**
 * A looked-up id is only trusted when the fixture it describes is the one we stored:
 * external ids are unique per upstream, not across them, so asking TheSportsDB about a
 * football-data id can return a real — but completely unrelated — match.
 */
function isSameFixture(
  candidate: NormalizedMatch,
  stored: { dateTime: Date; homeTeamName: string; awayTeamName: string },
): boolean {
  const candidateDay = candidate.dateTime.slice(0, 10);
  const storedDay = stored.dateTime.toISOString().slice(0, 10);
  // Compared with a day of slack: the two upstreams disagree on kickoff time often
  // enough that a late evening match lands either side of midnight UTC.
  const dayApartMs = Math.abs(new Date(candidateDay).getTime() - new Date(storedDay).getTime());
  if (dayApartMs > 24 * 60 * 60 * 1000) return false;

  const namesMatch = (a: string, b: string) => {
    const [x, y] = [normalizeTeamName(a), normalizeTeamName(b)];
    return Boolean(x) && Boolean(y) && (x.includes(y) || y.includes(x));
  };
  return (
    namesMatch(candidate.homeTeam.name, stored.homeTeamName) &&
    namesMatch(candidate.awayTeam.name, stored.awayTeamName)
  );
}

/**
 * Repairs matches that kicked off, never got a score, and no longer show up in what
 * `fetchMatches` returns — TheSportsDB's free tier only exposes a handful of past events
 * per league, so anything that fell out of that window while the sync wasn't running
 * would otherwise stay scoreless forever.
 */
async function backfillStrandedMatches(provider: FootballProvider): Promise<number> {
  if (!provider.lookupMatch) return 0;

  const now = Date.now();
  const homeTeams = alias(teams, "backfill_home_teams");
  const awayTeams = alias(teams, "backfill_away_teams");

  const stranded = await db
    .select({
      id: matches.id,
      externalId: matches.externalId,
      dateTime: matches.dateTime,
      homeTeamName: homeTeams.name,
      awayTeamName: awayTeams.name,
    })
    .from(matches)
    .innerJoin(homeTeams, eq(homeTeams.id, matches.homeTeamId))
    .innerJoin(awayTeams, eq(awayTeams.id, matches.awayTeamId))
    .where(
      and(
        eq(matches.provider, provider.name),
        isNotNull(matches.externalId),
        isNull(matches.homeScore),
        notInArray(matches.status, ["POSTPONED", "CANCELLED"]),
        lt(matches.dateTime, new Date(now - BACKFILL_MIN_AGE_HOURS * 60 * 60 * 1000)),
        gt(matches.dateTime, new Date(now - BACKFILL_MAX_AGE_DAYS * 24 * 60 * 60 * 1000)),
      ),
    )
    .orderBy(desc(matches.dateTime))
    .limit(BACKFILL_MAX_PER_RUN);

  if (stranded.length === 0) return 0;

  let repaired = 0;
  for (const [index, match] of stranded.entries()) {
    // Seeded matches carry no external id, so there is nothing to look up.
    if (!match.externalId) continue;
    if (index > 0) await sleep(BACKFILL_PACING_MS);
    try {
      const candidate = await provider.lookupMatch(match.externalId, (c) => isSameFixture(c, match));
      if (!candidate || candidate.homeScore === null) continue;
      if (!isSameFixture(candidate, match)) continue;

      await db
        .update(matches)
        .set({
          homeScore: candidate.homeScore,
          awayScore: candidate.awayScore,
          status: candidate.status,
          updatedAt: new Date(),
        })
        .where(eq(matches.id, match.id));
      repaired++;
    } catch (err) {
      console.warn(
        `[sync] backfill of ${provider.name}:${match.externalId} failed:`,
        err instanceof Error ? err.message : err,
      );
    }
  }

  console.log(`[sync] backfill repaired ${repaired}/${stranded.length} stranded matches`);
  return repaired;
}

export async function syncMatchesFromProvider(provider: FootballProvider) {
  const normalizedMatches = await provider.fetchMatches();
  let created = 0;
  let updated = 0;
  let failed = 0;

  // Pre-load existing competitions once so cross-provider name matching doesn't re-scan
  // the table for every single match.
  const competitionNameCache = new Map<string, string>();
  for (const c of await db.select({ id: competitions.id, name: competitions.name }).from(competitions)) {
    competitionNameCache.set(normalizeCompetitionName(c.name), c.id);
  }

  // One match failing (a dropped database connection mid-run, a malformed upstream
  // payload) must not abort the remaining hundreds — the whole point of the sync is
  // that finished matches get their scores, and a partial run that throws leaves most
  // of the table stale until the next tick.
  const syncOneMatch = async (nm: (typeof normalizedMatches)[number]) => {
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

    return existingMatch ? "updated" : "created";
  };

  for (const nm of normalizedMatches) {
    try {
      if ((await syncOneMatch(nm)) === "created") created++;
      else updated++;
    } catch (err) {
      failed++;
      console.warn(
        `[sync] match ${provider.name}:${nm.externalId} failed:`,
        err instanceof Error ? err.message : err,
      );
    }
  }

  const backfilled = await backfillStrandedMatches(provider);

  return { total: normalizedMatches.length, created, updated, failed, backfilled };
}
