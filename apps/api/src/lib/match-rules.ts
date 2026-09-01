import type { matches } from "../db/schema.js";
import { badRequest } from "./errors.js";

const NOT_YET_PLAYED_STATUSES = new Set(["SCHEDULED", "TIMED", "POSTPONED", "CANCELLED"]);

/**
 * A match can only be rated/reviewed once it has actually kicked off — mirrors the
 * watchlist rule (future matches are for the watchlist, not the diary).
 */
export function assertMatchIsRatable(match: typeof matches.$inferSelect): void {
  const hasStarted = match.dateTime.getTime() <= Date.now();
  if (!hasStarted || NOT_YET_PLAYED_STATUSES.has(match.status)) {
    throw badRequest("You can only rate or review a match after it has started");
  }
}
