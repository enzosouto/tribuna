import { getFootballProvider } from "../providers/index.js";
import { syncMatchesFromProvider } from "../providers/sync.js";
import { pool } from "./client.js";

/**
 * Syncs real football data (teams, competitions, matches) from the configured
 * FootballProvider. This is a pure upsert: existing matches are updated in place
 * (see syncMatchesFromProvider), nothing is ever deleted. Ratings, reviews, watchlist
 * entries and lists reference matches by id — they must survive every sync, forever,
 * exactly like a Letterboxd diary entry survives long after the film left theaters.
 */
async function main() {
  console.log("Seeding: syncing matches from provider...");
  const provider = getFootballProvider();
  console.log(`Using provider: ${provider.name}`);
  const syncResult = await syncMatchesFromProvider(provider);
  console.log(`Synced ${syncResult.total} matches (${syncResult.created} created, ${syncResult.updated} updated).`);

  console.log("Seed complete.");
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
