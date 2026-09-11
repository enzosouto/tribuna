import type { FastifyInstance, FastifyRequest } from "fastify";
import { env } from "../env.js";
import { requireAdmin } from "../lib/require-admin.js";
import { getSyncStatus, runSync } from "../providers/scheduler.js";

// The sync itself runs on a timer inside the process (see providers/scheduler.ts).
// This route stays for an operator forcing a refresh, or an external cron on hosts
// that idle the service out. It writes to every match row, so it is not public:
// either an admin session or the shared SYNC_SECRET is required.
async function authorize(request: FastifyRequest) {
  const secret = env.SYNC_SECRET;
  if (secret && request.headers["x-sync-secret"] === secret) return;
  await requireAdmin(request);
}

export async function syncRoutes(app: FastifyInstance) {
  app.post("/matches", async (request, reply) => {
    await authorize(request);
    const result = await runSync("manual");
    reply.send(result);
  });

  app.get("/status", async (request, reply) => {
    await authorize(request);
    reply.send(getSyncStatus());
  });
}
