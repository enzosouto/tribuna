import { normalizeTeamName } from "../lib/normalize-name.js";
import { FootballDataProvider } from "./football-data.js";
import { TheSportsDbProvider } from "./thesportsdb.js";
import type { FootballProvider, NormalizedMatch } from "./types.js";

// One normalized name "matching" another means either is a substring of the other —
// handles cases like "coritiba" (TheSportsDB) vs "coritibafbc" (football-data) once
// the common suffix words above are already stripped.
function namesMatch(a: string, b: string): boolean {
  if (!a || !b) return false;
  return a.includes(b) || b.includes(a);
}

function isSameFixture(a: NormalizedMatch, b: NormalizedMatch): boolean {
  if (a.dateTime.slice(0, 10) !== b.dateTime.slice(0, 10)) return false;
  return (
    namesMatch(normalizeTeamName(a.homeTeam.name), normalizeTeamName(b.homeTeam.name)) &&
    namesMatch(normalizeTeamName(a.awayTeam.name), normalizeTeamName(b.awayTeam.name))
  );
}

/**
 * Combines TheSportsDB (used first, has broad league coverage including Brasileirão on
 * the free public key) with football-data.org (fills in matches TheSportsDB's free tier
 * doesn't return, since it only gives 1 past + 1 next event per league).
 */
export class MixProvider implements FootballProvider {
  name = "mix" as const;

  async fetchMatches(): Promise<NormalizedMatch[]> {
    const [theSportsDbMatches, footballDataMatches] = await Promise.all([
      new TheSportsDbProvider().fetchMatches().catch((err) => {
        console.warn("[mix] TheSportsDB fetch failed:", err instanceof Error ? err.message : err);
        return [] as NormalizedMatch[];
      }),
      new FootballDataProvider().fetchMatches().catch((err) => {
        console.warn("[mix] football-data.org fetch failed:", err instanceof Error ? err.message : err);
        return [] as NormalizedMatch[];
      }),
    ]);

    // Only compare against matches on nearby days — keeps this from being O(n*m) across
    // the whole dataset while still catching timezone-shifted duplicates.
    const byDay = new Map<string, NormalizedMatch[]>();
    for (const m of theSportsDbMatches) {
      const day = m.dateTime.slice(0, 10);
      if (!byDay.has(day)) byDay.set(day, []);
      byDay.get(day)!.push(m);
    }

    const uniqueFootballData = footballDataMatches.filter((fdMatch) => {
      const candidates = byDay.get(fdMatch.dateTime.slice(0, 10)) ?? [];
      return !candidates.some((tsdbMatch) => isSameFixture(fdMatch, tsdbMatch));
    });

    return [...theSportsDbMatches, ...uniqueFootballData];
  }
}
