import { buildApp } from "./app.js";
import { env } from "./env.js";
import { startSyncScheduler } from "./providers/scheduler.js";

async function main() {
  const app = await buildApp();
  await app.listen({ port: env.PORT, host: "0.0.0.0" });
  app.log.info(`Tribuna API listening on port ${env.PORT}`);
  // Started here rather than in buildApp so importing the app (tests, scripts) never
  // kicks off background network writes to the database.
  startSyncScheduler();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
