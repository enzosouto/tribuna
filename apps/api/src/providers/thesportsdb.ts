import type { MatchStatus } from "@tribuna/shared";
import { env } from "../env.js";
import { COUNTRY_NAME_PT } from "../lib/country-names-pt.js";
import type { FootballProvider, NormalizedMatch } from "./types.js";

// Well-known soccer league ids on TheSportsDB. The free public test key only returns
// the single most recent past event and the single next upcoming event per league, so
// we spread across many leagues/cups to get a reasonably sized real dataset.
// Brazil-relevant leagues go first: the free key's shared rate limit starts dropping
// requests partway through this list (see fetchWithRetry below), so anything after
// roughly position 15 is at risk of silently getting zero events some runs.
const LEAGUE_IDS = [
  "4351", // Brazilian Serie A
  "4725", // Copa do Brasil
  "4501", // Copa Libertadores
  "4328", // English Premier League
  "4335", // Spanish La Liga
  "4331", // German Bundesliga
  "4332", // Italian Serie A
  "4334", // French Ligue 1
  "4480", // UEFA Champions League
  "4344", // Portuguese Primeira Liga
  "4337", // Dutch Eredivisie
  "4346", // Major League Soccer
  "4429", // FIFA World Cup
  "4406", // Argentine Primera Division
  "4330", // Scottish Premiership
  "4329", // English Championship
  "4394", // Italian Serie B
  "4395", // Scottish Championship
  "4502", // UEFA European Championship
  "4570", // EFL Cup
  "4497", // Colombia Primera A
  "4498", // FIFA Confederations Cup
];

// TheSportsDB returns league names in English; localize the ones we care about for a
// Brazilian audience instead of showing "Brazilian Serie A" etc.
const COMPETITION_NAME_PT: Record<string, string> = {
  "4328": "Premier League",
  "4335": "La Liga",
  "4331": "Bundesliga",
  "4332": "Serie A Italiana",
  "4334": "Ligue 1",
  "4480": "UEFA Champions League",
  "4344": "Primeira Liga Portuguesa",
  "4337": "Eredivisie",
  "4346": "MLS",
  "4429": "Copa do Mundo FIFA",
  "4406": "Primera División Argentina",
  "4351": "Brasileirão Série A",
  "4330": "Scottish Premiership",
  "4329": "Championship Inglês",
  "4394": "Serie B Italiana",
  "4395": "Scottish Championship",
  "4501": "Copa Libertadores",
  "4502": "Eurocopa",
  "4570": "EFL Cup",
  "4497": "Categoría Primera A (Colômbia)",
  "4498": "Copa das Confederações",
  "4725": "Copa do Brasil",
};

interface TheSportsDbEvent {
  idEvent: string;
  strEvent: string;
  strHomeTeam: string;
  strAwayTeam: string;
  idHomeTeam: string;
  idAwayTeam: string;
  intHomeScore: string | null;
  intAwayScore: string | null;
  strLeague: string;
  idLeague: string;
  strSeason: string;
  strVenue: string | null;
  intRound: string | null;
  dateEvent: string;
  strTime: string | null;
  strStatus: string | null;
  strHomeTeamBadge?: string | null;
  strAwayTeamBadge?: string | null;
}

function mapStatus(raw: string | null, hasScore: boolean): MatchStatus {
  const s = (raw ?? "").toUpperCase();
  if (s.includes("FT") || s.includes("MATCH FINISHED")) return "FINISHED";
  if (s.includes("POSTPONED")) return "POSTPONED";
  if (s.includes("CANCELLED") || s.includes("CANCELED")) return "CANCELLED";
  if (s.includes("LIVE") || s.includes("1H") || s.includes("2H")) return "LIVE";
  if (hasScore) return "FINISHED";
  return "SCHEDULED";
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// The free public test key ("3") is shared globally and rate-limits hard: firing all
// ~20 leagues' requests back-to-back reliably starts returning 429 partway through,
// which silently starved leagues later in LEAGUE_IDS of any data. Retry once on 429
// after a short backoff, and pace requests between leagues so we stay under the limit.
async function fetchWithRetry(url: string): Promise<Response> {
  const res = await fetch(url);
  if (res.status !== 429) return res;
  await sleep(1500);
  return fetch(url);
}

// Some events come back with a missing or malformed date/time. Left unguarded, the
// `.toISOString()` below throws "Invalid time value" and takes down the whole fetch
// (every league after it included), so fall back to midnight and then to skipping.
function kickoffIsoOrNull(e: TheSportsDbEvent): string | null {
  for (const candidate of [`${e.dateEvent}T${e.strTime ?? "00:00:00"}Z`, `${e.dateEvent}T00:00:00Z`]) {
    const parsed = new Date(candidate);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
  }
  return null;
}

function toNormalizedMatch(e: TheSportsDbEvent, dateTime: string): NormalizedMatch {
  const hasScore = e.intHomeScore !== null && e.intAwayScore !== null;
  return {
    externalId: e.idEvent,
    homeTeam: {
      externalId: e.idHomeTeam,
      name: COUNTRY_NAME_PT[e.strHomeTeam] ?? e.strHomeTeam,
      shortName: null,
      crestUrl: e.strHomeTeamBadge ?? null,
      country: null,
    },
    awayTeam: {
      externalId: e.idAwayTeam,
      name: COUNTRY_NAME_PT[e.strAwayTeam] ?? e.strAwayTeam,
      shortName: null,
      crestUrl: e.strAwayTeamBadge ?? null,
      country: null,
    },
    homeScore: hasScore ? Number(e.intHomeScore) : null,
    awayScore: hasScore ? Number(e.intAwayScore) : null,
    competition: {
      externalId: e.idLeague,
      name: COMPETITION_NAME_PT[e.idLeague] ?? e.strLeague,
      code: null,
      emblemUrl: null,
      country: null,
    },
    season: { year: e.strSeason ?? "unknown", startDate: null, endDate: null },
    round: e.intRound ? `Rodada ${e.intRound}` : null,
    stadium: e.strVenue ?? null,
    dateTime,
    status: mapStatus(e.strStatus, hasScore),
    events: [],
    statistics: [],
    lineups: [],
  };
}

export class TheSportsDbProvider implements FootballProvider {
  name = "thesportsdb" as const;

  // lookupevent.php resolves any event id, including ones long gone from the
  // past-events window that fetchMatches reads.
  async lookupMatch(externalId: string): Promise<NormalizedMatch | null> {
    const key = env.THESPORTSDB_API_KEY || "3";
    const res = await fetchWithRetry(
      `https://www.thesportsdb.com/api/v1/json/${key}/lookupevent.php?id=${encodeURIComponent(externalId)}`,
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { events: TheSportsDbEvent[] | null };
    const event = data.events?.[0];
    if (!event) return null;
    const dateTime = kickoffIsoOrNull(event);
    return dateTime ? toNormalizedMatch(event, dateTime) : null;
  }

  async fetchMatches(): Promise<NormalizedMatch[]> {
    const key = env.THESPORTSDB_API_KEY || "3"; // "3" is the public test key
    const results: NormalizedMatch[] = [];

    for (const leagueId of LEAGUE_IDS) {
      if (leagueId !== LEAGUE_IDS[0]) await sleep(300);

      const [pastRes, nextRes] = await Promise.all([
        fetchWithRetry(`https://www.thesportsdb.com/api/v1/json/${key}/eventspastleague.php?id=${leagueId}`),
        fetchWithRetry(`https://www.thesportsdb.com/api/v1/json/${key}/eventsnextleague.php?id=${leagueId}`),
      ]);

      const [pastData, nextData] = await Promise.all([
        pastRes.ok
          ? (pastRes.json() as Promise<{ events: TheSportsDbEvent[] | null }>)
          : Promise.resolve({ events: [] }),
        nextRes.ok
          ? (nextRes.json() as Promise<{ events: TheSportsDbEvent[] | null }>)
          : Promise.resolve({ events: [] }),
      ]);

      const events: TheSportsDbEvent[] = [
        ...(pastData.events ?? []),
        ...(nextData.events ?? []),
      ];

      for (const e of events) {
        const dateTime = kickoffIsoOrNull(e);
        if (!dateTime) continue;
        results.push(toNormalizedMatch(e, dateTime));
      }
    }

    return results;
  }
}
