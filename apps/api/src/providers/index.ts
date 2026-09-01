import { env } from "../env.js";
import { FootballDataProvider } from "./football-data.js";
import { MixProvider } from "./mix.js";
import { MockProvider } from "./mock.js";
import { TheSportsDbProvider } from "./thesportsdb.js";
import type { FootballProvider } from "./types.js";

export function getFootballProvider(): FootballProvider {
  switch (env.FOOTBALL_API_PROVIDER) {
    case "football-data":
      return new FootballDataProvider();
    case "thesportsdb":
      return new TheSportsDbProvider();
    case "mix":
      return new MixProvider();
    case "mock":
    default:
      return new MockProvider();
  }
}

export type { FootballProvider, NormalizedMatch } from "./types.js";
