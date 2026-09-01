import type { FootballProvider, NormalizedCompetition, NormalizedEvent, NormalizedLineupEntry, NormalizedMatch, NormalizedStatistic, NormalizedTeam } from "./types.js";
import { intBetween, mulberry32, pick } from "./rng.js";

const TEAMS: NormalizedTeam[] = [
  { externalId: "t-flamengo", name: "Flamengo", shortName: "FLA", crestUrl: "https://crests.football-data.org/1783.png", country: "Brasil" },
  { externalId: "t-palmeiras", name: "Palmeiras", shortName: "PAL", crestUrl: "https://crests.football-data.org/1769.png", country: "Brasil" },
  { externalId: "t-corinthians", name: "Corinthians", shortName: "COR", crestUrl: "https://crests.football-data.org/1779.png", country: "Brasil" },
  { externalId: "t-sao-paulo", name: "São Paulo", shortName: "SAO", crestUrl: "https://crests.football-data.org/1776.png", country: "Brasil" },
  { externalId: "t-gremio", name: "Grêmio", shortName: "GRE", crestUrl: "https://crests.football-data.org/1767.png", country: "Brasil" },
  { externalId: "t-internacional", name: "Internacional", shortName: "INT", crestUrl: "https://crests.football-data.org/6684.png", country: "Brasil" },
  { externalId: "t-real-madrid", name: "Real Madrid", shortName: "RMA", crestUrl: "https://crests.football-data.org/86.png", country: "Espanha" },
  { externalId: "t-barcelona", name: "Barcelona", shortName: "BAR", crestUrl: "https://crests.football-data.org/81.png", country: "Espanha" },
  { externalId: "t-man-city", name: "Manchester City", shortName: "MCI", crestUrl: "https://crests.football-data.org/65.png", country: "Inglaterra" },
  { externalId: "t-liverpool", name: "Liverpool", shortName: "LIV", crestUrl: "https://crests.football-data.org/64.png", country: "Inglaterra" },
  { externalId: "t-bayern", name: "Bayern de Munique", shortName: "BAY", crestUrl: "https://crests.football-data.org/5.png", country: "Alemanha" },
  { externalId: "t-psg", name: "Paris Saint-Germain", shortName: "PSG", crestUrl: "https://crests.football-data.org/524.png", country: "França" },
  { externalId: "t-river-plate", name: "River Plate", shortName: "RIV", crestUrl: null, country: "Argentina" },
  { externalId: "t-boca-juniors", name: "Boca Juniors", shortName: "BOC", crestUrl: null, country: "Argentina" },
];

const COMPETITIONS: NormalizedCompetition[] = [
  { externalId: "c-brasileirao", name: "Brasileirão Série A", code: "BSA", emblemUrl: null, country: "Brasil" },
  { externalId: "c-champions", name: "UEFA Champions League", code: "CL", emblemUrl: null, country: "Europa" },
  { externalId: "c-laliga", name: "La Liga", code: "PD", emblemUrl: null, country: "Espanha" },
  { externalId: "c-libertadores", name: "Copa Libertadores", code: "LIB", emblemUrl: null, country: "América do Sul" },
];

const BR_MATCHUPS: [string, string][] = [
  ["t-flamengo", "t-palmeiras"],
  ["t-corinthians", "t-sao-paulo"],
  ["t-gremio", "t-internacional"],
  ["t-palmeiras", "t-corinthians"],
  ["t-sao-paulo", "t-flamengo"],
  ["t-internacional", "t-gremio"],
  ["t-flamengo", "t-internacional"],
  ["t-palmeiras", "t-gremio"],
];

const EURO_MATCHUPS: [string, string][] = [
  ["t-real-madrid", "t-barcelona"],
  ["t-man-city", "t-liverpool"],
  ["t-bayern", "t-psg"],
  ["t-barcelona", "t-man-city"],
  ["t-liverpool", "t-bayern"],
  ["t-psg", "t-real-madrid"],
];

const LIBERTADORES_MATCHUPS: [string, string][] = [
  ["t-river-plate", "t-boca-juniors"],
  ["t-flamengo", "t-boca-juniors"],
  ["t-river-plate", "t-palmeiras"],
];

const STADIUMS: Record<string, string> = {
  "t-flamengo": "Maracanã",
  "t-palmeiras": "Allianz Parque",
  "t-corinthians": "Neo Química Arena",
  "t-sao-paulo": "Morumbis",
  "t-gremio": "Arena do Grêmio",
  "t-internacional": "Beira-Rio",
  "t-real-madrid": "Santiago Bernabéu",
  "t-barcelona": "Spotify Camp Nou",
  "t-man-city": "Etihad Stadium",
  "t-liverpool": "Anfield",
  "t-bayern": "Allianz Arena",
  "t-psg": "Parc des Princes",
  "t-river-plate": "Estadio Monumental",
  "t-boca-juniors": "La Bombonera",
};

const FIRST_NAMES = ["Gabriel", "Lucas", "Matheus", "Rafael", "Bruno", "Pedro", "Thiago", "Diego", "Carlos", "André", "Vinícius", "Marcos", "Rodrigo", "Fernando", "Hugo"];
const LAST_NAMES = ["Silva", "Santos", "Oliveira", "Souza", "Costa", "Pereira", "Almeida", "Ribeiro", "Carvalho", "Gomes", "Martins", "Rocha", "Dias", "Barbosa"];

function randomPlayerName(rng: () => number): string {
  return `${pick(rng, FIRST_NAMES)} ${pick(rng, LAST_NAMES)}`;
}

function buildEvents(
  rng: () => number,
  homeTeamId: string,
  awayTeamId: string,
  homeScore: number,
  awayScore: number,
): NormalizedEvent[] {
  const events: NormalizedEvent[] = [];
  for (let i = 0; i < homeScore; i++) {
    events.push({
      type: "GOAL",
      minute: intBetween(rng, 1, 90),
      teamExternalId: homeTeamId,
      playerName: randomPlayerName(rng),
      assistName: rng() > 0.4 ? randomPlayerName(rng) : null,
      detail: null,
    });
  }
  for (let i = 0; i < awayScore; i++) {
    events.push({
      type: "GOAL",
      minute: intBetween(rng, 1, 90),
      teamExternalId: awayTeamId,
      playerName: randomPlayerName(rng),
      assistName: rng() > 0.4 ? randomPlayerName(rng) : null,
      detail: null,
    });
  }
  const cardCount = intBetween(rng, 1, 5);
  for (let i = 0; i < cardCount; i++) {
    events.push({
      type: rng() > 0.85 ? "RED_CARD" : "YELLOW_CARD",
      minute: intBetween(rng, 1, 90),
      teamExternalId: rng() > 0.5 ? homeTeamId : awayTeamId,
      playerName: randomPlayerName(rng),
      assistName: null,
      detail: null,
    });
  }
  const subCount = intBetween(rng, 0, 4);
  for (let i = 0; i < subCount; i++) {
    events.push({
      type: "SUBSTITUTION",
      minute: intBetween(rng, 46, 90),
      teamExternalId: rng() > 0.5 ? homeTeamId : awayTeamId,
      playerName: randomPlayerName(rng),
      assistName: randomPlayerName(rng),
      detail: null,
    });
  }
  return events.sort((a, b) => (a.minute ?? 0) - (b.minute ?? 0));
}

function buildStatistics(
  rng: () => number,
  homeTeamId: string,
  awayTeamId: string,
): NormalizedStatistic[] {
  const homePossession = intBetween(rng, 35, 65);
  return [
    {
      teamExternalId: homeTeamId,
      possession: homePossession,
      shots: intBetween(rng, 6, 20),
      shotsOnTarget: intBetween(rng, 2, 10),
      corners: intBetween(rng, 2, 12),
      fouls: intBetween(rng, 5, 18),
      yellowCards: intBetween(rng, 0, 4),
      redCards: rng() > 0.9 ? 1 : 0,
      offsides: intBetween(rng, 0, 5),
    },
    {
      teamExternalId: awayTeamId,
      possession: 100 - homePossession,
      shots: intBetween(rng, 6, 20),
      shotsOnTarget: intBetween(rng, 2, 10),
      corners: intBetween(rng, 2, 12),
      fouls: intBetween(rng, 5, 18),
      yellowCards: intBetween(rng, 0, 4),
      redCards: rng() > 0.9 ? 1 : 0,
      offsides: intBetween(rng, 0, 5),
    },
  ];
}

function buildLineup(rng: () => number, teamId: string): NormalizedLineupEntry[] {
  const positions = ["GK", "DF", "DF", "DF", "DF", "MF", "MF", "MF", "FW", "FW", "FW"];
  const lineup: NormalizedLineupEntry[] = positions.map((position, idx) => ({
    teamExternalId: teamId,
    playerName: randomPlayerName(rng),
    shirtNumber: idx + 1,
    position,
    role: "STARTER",
  }));
  const subCount = intBetween(rng, 3, 7);
  for (let i = 0; i < subCount; i++) {
    lineup.push({
      teamExternalId: teamId,
      playerName: randomPlayerName(rng),
      shirtNumber: 12 + i,
      position: pick(rng, ["DF", "MF", "FW"]),
      role: "SUBSTITUTE",
    });
  }
  return lineup;
}

function teamByExternalId(externalId: string): NormalizedTeam {
  const team = TEAMS.find((t) => t.externalId === externalId);
  if (!team) throw new Error(`Unknown mock team ${externalId}`);
  return team;
}

export class MockProvider implements FootballProvider {
  name = "mock" as const;

  async fetchMatches(): Promise<NormalizedMatch[]> {
    const rng = mulberry32(42);
    const matches: NormalizedMatch[] = [];
    const now = Date.now();
    const DAY = 24 * 60 * 60 * 1000;

    const groups: { matchups: [string, string][]; competition: NormalizedCompetition; season: string }[] = [
      { matchups: BR_MATCHUPS, competition: COMPETITIONS[0], season: "2026" },
      { matchups: EURO_MATCHUPS, competition: COMPETITIONS[1], season: "2025/2026" },
      { matchups: LIBERTADORES_MATCHUPS, competition: COMPETITIONS[3], season: "2026" },
    ];

    let matchIndex = 0;

    for (const group of groups) {
      let dayOffset = -30;
      const turnoAndReturno: [string, string][] = [
        ...group.matchups,
        ...group.matchups.map(([h, a]): [string, string] => [a, h]),
      ];
      for (const [homeId, awayId] of turnoAndReturno) {
        matchIndex++;
        const home = teamByExternalId(homeId);
        const away = teamByExternalId(awayId);
        dayOffset += intBetween(rng, 2, 5);
        const isPast = dayOffset < 0;
        const dateTime = new Date(now + dayOffset * DAY + intBetween(rng, 0, 6) * 60 * 60 * 1000);

        if (isPast) {
          const homeScore = intBetween(rng, 0, 4);
          const awayScore = intBetween(rng, 0, 4);
          matches.push({
            externalId: `m-${matchIndex}`,
            homeTeam: home,
            awayTeam: away,
            homeScore,
            awayScore,
            competition: group.competition,
            season: { year: group.season, startDate: null, endDate: null },
            round: `Rodada ${intBetween(rng, 1, 38)}`,
            stadium: STADIUMS[homeId] ?? null,
            dateTime: dateTime.toISOString(),
            status: "FINISHED",
            events: buildEvents(rng, homeId, awayId, homeScore, awayScore),
            statistics: rng() > 0.15 ? buildStatistics(rng, homeId, awayId) : [],
            lineups:
              rng() > 0.2 ? [...buildLineup(rng, homeId), ...buildLineup(rng, awayId)] : [],
          });
        } else {
          matches.push({
            externalId: `m-${matchIndex}`,
            homeTeam: home,
            awayTeam: away,
            homeScore: null,
            awayScore: null,
            competition: group.competition,
            season: { year: group.season, startDate: null, endDate: null },
            round: `Rodada ${intBetween(rng, 1, 38)}`,
            stadium: STADIUMS[homeId] ?? null,
            dateTime: dateTime.toISOString(),
            status: "SCHEDULED",
            events: [],
            statistics: [],
            lineups: [],
          });
        }
      }
    }

    // A couple of extra edge-case matches: postponed + cancelled (must never be watchlist-able)
    matches.push({
      externalId: "m-postponed-1",
      homeTeam: teamByExternalId("t-boca-juniors"),
      awayTeam: teamByExternalId("t-river-plate"),
      homeScore: null,
      awayScore: null,
      competition: COMPETITIONS[3],
      season: { year: "2026", startDate: null, endDate: null },
      round: "Semifinal",
      stadium: STADIUMS["t-boca-juniors"],
      dateTime: new Date(now + 10 * DAY).toISOString(),
      status: "POSTPONED",
      events: [],
      statistics: [],
      lineups: [],
    });

    matches.push({
      externalId: "m-live-1",
      homeTeam: teamByExternalId("t-real-madrid"),
      awayTeam: teamByExternalId("t-man-city"),
      homeScore: 1,
      awayScore: 1,
      competition: COMPETITIONS[1],
      season: { year: "2025/2026", startDate: null, endDate: null },
      round: "Quartas de final",
      stadium: STADIUMS["t-real-madrid"],
      dateTime: new Date(now - 45 * 60 * 1000).toISOString(),
      status: "LIVE",
      events: buildEvents(rng, "t-real-madrid", "t-man-city", 1, 1),
      statistics: buildStatistics(rng, "t-real-madrid", "t-man-city"),
      lineups: [...buildLineup(rng, "t-real-madrid"), ...buildLineup(rng, "t-man-city")],
    });

    return matches;
  }
}
