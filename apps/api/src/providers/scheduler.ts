import { env } from "../env.js";
import { getFootballProvider } from "./index.js";
import { syncMatchesFromProvider } from "./sync.js";

export interface SyncRunResult {
  provider: string;
  total: number;
  created: number;
  updated: number;
  failed: number;
  backfilled: number;
  durationMs: number;
  startedAt: string;
  trigger: string;
}

// Logged through console rather than the Fastify logger (as mix.ts already does) so
// these stay visible in production, where the app logger is pinned to "warn".
const log = (message: string) => console.log(`[sync] ${message}`);

// A full sync walks every fetched match and does several sequential queries per match,
// so a run takes a couple of minutes. Without this guard the scheduler tick and a manual
// POST /sync/matches could interleave and double-write the same rows.
let inFlight: Promise<SyncRunResult> | null = null;
let lastRun: SyncRunResult | null = null;
let lastError: { message: string; at: string } | null = null;

/**
 * Runs a sync, or joins the one already in progress. Never runs two at a time.
 */
export function runSync(trigger: string): Promise<SyncRunResult> {
  if (inFlight) return inFlight;

  const startedAt = new Date();
  const run = (async () => {
    const provider = getFootballProvider();
    log(`starting (trigger=${trigger}, provider=${provider.name})`);
    const result = await syncMatchesFromProvider(provider);
    const summary: SyncRunResult = {
      provider: provider.name,
      ...result,
      durationMs: Date.now() - startedAt.getTime(),
      startedAt: startedAt.toISOString(),
      trigger,
    };
    lastRun = summary;
    lastError = null;
    log(
      `done in ${summary.durationMs}ms — ${summary.total} matches (${summary.created} created, ${summary.updated} updated, ${summary.failed} failed, ${summary.backfilled} backfilled)`,
    );
    return summary;
  })();

  inFlight = run;
  run
    .catch((err) => {
      lastError = {
        message: err instanceof Error ? err.message : String(err),
        at: new Date().toISOString(),
      };
      console.error(`[sync] failed (trigger=${trigger}): ${lastError.message}`);
    })
    .finally(() => {
      if (inFlight === run) inFlight = null;
    });

  return run;
}

export function getSyncStatus() {
  return {
    enabled: env.SYNC_ENABLED,
    intervalMinutes: env.SYNC_INTERVAL_MINUTES,
    provider: env.FOOTBALL_API_PROVIDER,
    running: inFlight !== null,
    lastRun,
    lastError,
  };
}

/**
 * Keeps scores and statuses current without depending on an external cron job.
 *
 * The API is deployed as a long-running service, so an in-process timer is the one
 * scheduler that can't be forgotten at deploy time. It also syncs on boot: on hosts
 * that idle the service out (Render free tier), the first request after a cold start
 * wakes the process and immediately refreshes data that went stale while asleep.
 */
export function startSyncScheduler() {
  if (!env.SYNC_ENABLED) {
    log("scheduler disabled (SYNC_ENABLED=false)");
    return;
  }
  if (env.FOOTBALL_API_PROVIDER === "mock") {
    log("scheduler disabled (FOOTBALL_API_PROVIDER=mock)");
    return;
  }

  log(`scheduler on — every ${env.SYNC_INTERVAL_MINUTES}min`);

  // A rejected run is already logged in runSync; swallow here so an upstream provider
  // outage never takes the API process down with an unhandled rejection.
  const tick = (trigger: string) => {
    runSync(trigger).catch(() => undefined);
  };

  // Small delay on boot so the server finishes binding its port before a long,
  // network-heavy sync competes for the event loop.
  setTimeout(() => tick("boot"), 5000).unref();

  const timer = setInterval(() => tick("interval"), env.SYNC_INTERVAL_MINUTES * 60 * 1000);
  timer.unref();
  return timer;
}
