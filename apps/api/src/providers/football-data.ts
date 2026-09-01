import type { MatchStatus } from "@tribuna/shared";
import { env } from "../env.js";
import { COUNTRY_NAME_PT } from "../lib/country-names-pt.js";
import type { FootballProvider, NormalizedMatch } from "./types.js";

const BASE_URL = "https://api.football-data.org/v4";

// Keep league naming consistent with the TheSportsDB provider (see mix.ts / COMPETITION_NAME_PT
// in thesportsdb.ts) so the same league reads the same way — and is findable by search —
// regardless of which upstream provider a given match came from.
const COMPETITION_NAME_PT: Record<string, string> = {
  BSA: "Brasileirão Série A",
  PD: "La Liga",
  SA: "Serie A Italiana",
  PPL: "Primeira Liga Portuguesa",
  EC: "Eurocopa",
  WC: "Copa do Mundo FIFA",
  CLI: "Copa Libertadores",
  ELC: "Championship Inglês",
};

// football-data.org's own `name`/`shortName` for a handful of clubs are too abbreviated
// to recognize ("CA Mineiro" / "Mineiro" for Atlético Mineiro). Override by team id.
const TEAM_NAME_OVERRIDES: Record<number, { name: string; shortName: string }> = {
  1766: { name: "Atlético Mineiro", shortName: "Atlético-MG" },
  1768: { name: "Athletico Paranaense", shortName: "Athletico-PR" },
};

const STATUS_MAP: Record<string, MatchStatus> = {
  SCHEDULED: "SCHEDULED",
  TIMED: "TIMED",
  IN_PLAY: "LIVE",
  PAUSED: "LIVE",
  FINISHED: "FINISHED",
  SUSPENDED: "POSTPONED",
  POSTPONED: "POSTPONED",
  CANCELLED: "CANCELLED",
  AWARDED: "FINISHED",
};

interface FootballDataMatch {
  id: number;
  utcDate: string;
  status: string;
  matchday: number | null;
  venue?: string | null;
  competition: { id: number; name: string; code: string; emblem: string | null };
  season: { id: number; startDate: string; endDate: string };
  homeTeam: { id: number; name: string; shortName: string | null; crest: string | null };
  awayTeam: { id: number; name: string; shortName: string | null; crest: string | null };
  score: { fullTime: { home: number | null; away: number | null } };
}

function teamNameFor(id: number, apiName: string): string {
  return TEAM_NAME_OVERRIDES[id]?.name ?? COUNTRY_NAME_PT[apiName] ?? apiName;
}

function teamShortNameFor(id: number, apiShortName: string | null): string | null {
  if (TEAM_NAME_OVERRIDES[id]?.shortName) return TEAM_NAME_OVERRIDES[id].shortName;
  if (apiShortName && COUNTRY_NAME_PT[apiShortName]) return COUNTRY_NAME_PT[apiShortName];
  return apiShortName;
}

export class FootballDataProvider implements FootballProvider {
  name = "football-data" as const;

  async fetchMatches(): Promise<NormalizedMatch[]> {
    if (!env.FOOTBALL_DATA_API_KEY) {
      throw new Error("FOOTBALL_DATA_API_KEY is not configured");
    }

    const toDateStr = (d: Date) => d.toISOString().slice(0, 10);
    const today = new Date();
    const past = new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000);
    const future = new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000);

    // Free tier caps a single request's date range at 10 days, so we fetch a past
    // window (finished matches, for ratings/reviews) and a future window (for the
    // watchlist) separately and merge them.
    const headers = { "X-Auth-Token": env.FOOTBALL_DATA_API_KEY };
    const [pastRes, futureRes] = await Promise.all([
      fetch(`${BASE_URL}/matches?dateFrom=${toDateStr(past)}&dateTo=${toDateStr(today)}`, { headers }),
      fetch(`${BASE_URL}/matches?dateFrom=${toDateStr(today)}&dateTo=${toDateStr(future)}`, { headers }),
    ]);

    if (!pastRes.ok) throw new Error(`football-data.org request failed: ${pastRes.status}`);
    if (!futureRes.ok) throw new Error(`football-data.org request failed: ${futureRes.status}`);

    const [pastData, futureData] = await Promise.all([
      pastRes.json() as Promise<{ matches: FootballDataMatch[] }>,
      futureRes.json() as Promise<{ matches: FootballDataMatch[] }>,
    ]);

    const byId = new Map<number, FootballDataMatch>();
    [...pastData.matches, ...futureData.matches].forEach((m) => byId.set(m.id, m));

    // Cup fixtures with a not-yet-decided side (e.g. "Winner of Group X") come back
    // with a null team name — not a real, displayable match yet, so skip those.
    const playable = Array.from(byId.values()).filter((m) => m.homeTeam?.name && m.awayTeam?.name);

    return playable.map((m) => ({
      externalId: String(m.id),
      homeTeam: {
        externalId: String(m.homeTeam.id),
        name: teamNameFor(m.homeTeam.id, m.homeTeam.name),
        shortName: teamShortNameFor(m.homeTeam.id, m.homeTeam.shortName ?? null),
        crestUrl: m.homeTeam.crest ?? null,
        country: null,
      },
      awayTeam: {
        externalId: String(m.awayTeam.id),
        name: teamNameFor(m.awayTeam.id, m.awayTeam.name),
        shortName: teamShortNameFor(m.awayTeam.id, m.awayTeam.shortName ?? null),
        crestUrl: m.awayTeam.crest ?? null,
        country: null,
      },
      homeScore: m.score.fullTime.home,
      awayScore: m.score.fullTime.away,
      competition: {
        externalId: String(m.competition.id),
        name: COMPETITION_NAME_PT[m.competition.code] ?? m.competition.name,
        code: m.competition.code ?? null,
        emblemUrl: m.competition.emblem ?? null,
        country: null,
      },
      season: {
        year: m.season?.startDate ? m.season.startDate.slice(0, 4) : "unknown",
        startDate: m.season?.startDate ?? null,
        endDate: m.season?.endDate ?? null,
      },
      round: m.matchday ? `Rodada ${m.matchday}` : null,
      stadium: m.venue ?? null,
      dateTime: m.utcDate,
      status: STATUS_MAP[m.status] ?? "SCHEDULED",
      events: [],
      statistics: [],
      lineups: [],
    }));
  }
}
