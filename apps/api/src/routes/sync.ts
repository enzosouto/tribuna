import type { FastifyInstance } from "fastify";
import { getFootballProvider } from "../providers/index.js";
import { syncMatchesFromProvider } from "../providers/sync.js";

export async function syncRoutes(app: FastifyInstance) {
  // Intended to be triggered by a cron job on Render, or manually by an operator.
  app.post("/matches", async (_request, reply) => {
    const provider = getFootballProvider();
    const result = await syncMatchesFromProvider(provider);
    reply.send({ provider: provider.name, ...result });
  });
}
