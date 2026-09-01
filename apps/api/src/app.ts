import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import rateLimit from "@fastify/rate-limit";
import sensible from "@fastify/sensible";
import Fastify, { type FastifyInstance } from "fastify";
import { ZodError } from "zod";
import { SESSION_COOKIE, getSessionUserId } from "./auth/session.js";
import { env } from "./env.js";
import { HttpError } from "./lib/errors.js";
import { adminRoutes } from "./routes/admin.js";
import { authRoutes } from "./routes/auth.js";
import { competitionsRoutes } from "./routes/competitions.js";
import { diaryRoutes } from "./routes/diary.js";
import { favoritesRoutes } from "./routes/favorites.js";
import { followsRoutes } from "./routes/follows.js";
import { healthRoutes } from "./routes/health.js";
import { listsRoutes } from "./routes/lists.js";
import { matchesRoutes } from "./routes/matches.js";
import { ratingsRoutes } from "./routes/ratings.js";
import { reviewsRoutes } from "./routes/reviews.js";
import { searchRoutes } from "./routes/search.js";
import { syncRoutes } from "./routes/sync.js";
import { teamsRoutes } from "./routes/teams.js";
import { uploadsRoutes } from "./routes/uploads.js";
import { usersRoutes } from "./routes/users.js";
import { watchlistRoutes } from "./routes/watchlist.js";

declare module "fastify" {
  interface FastifyRequest {
    userId: string | null;
  }
}

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: env.NODE_ENV === "development" ? "info" : "warn",
    },
    trustProxy: true,
  });

  await app.register(sensible);
  await app.register(cookie, { secret: env.AUTH_SECRET });
  await app.register(cors, {
    origin: env.FRONTEND_URL,
    credentials: true,
  });
  await app.register(rateLimit, {
    max: 300,
    timeWindow: "1 minute",
  });
  await app.register(multipart, {
    limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  });

  app.decorateRequest("userId", null);

  app.addHook("preHandler", async (request) => {
    const sessionId = request.cookies[SESSION_COOKIE];
    if (!sessionId) {
      request.userId = null;
      return;
    }
    request.userId = await getSessionUserId(sessionId);
  });

  app.setErrorHandler((err, request, reply) => {
    if (err instanceof ZodError) {
      reply.status(400).send({
        error: "ValidationError",
        message: "Invalid request data",
        issues: err.issues,
      });
      return;
    }
    if (err instanceof HttpError) {
      reply.status(err.statusCode).send({ error: err.name, message: err.message });
      return;
    }
    request.log.error(err);
    reply.status(err.statusCode ?? 500).send({
      error: "InternalError",
      message: env.NODE_ENV === "development" ? err.message : "Something went wrong",
    });
  });

  await app.register(healthRoutes);
  await app.register(adminRoutes, { prefix: "/admin" });
  await app.register(authRoutes, { prefix: "/auth" });
  await app.register(matchesRoutes, { prefix: "/matches" });
  await app.register(teamsRoutes, { prefix: "/teams" });
  await app.register(competitionsRoutes, { prefix: "/competitions" });
  await app.register(usersRoutes, { prefix: "/users" });
  await app.register(reviewsRoutes, { prefix: "/reviews" });
  await app.register(ratingsRoutes, { prefix: "/ratings" });
  await app.register(followsRoutes, { prefix: "/follows" });
  await app.register(watchlistRoutes, { prefix: "/watchlist" });
  await app.register(diaryRoutes, { prefix: "/diary" });
  await app.register(favoritesRoutes, { prefix: "/favorites" });
  await app.register(listsRoutes, { prefix: "/lists" });
  await app.register(searchRoutes, { prefix: "/search" });
  await app.register(syncRoutes, { prefix: "/sync" });
  await app.register(uploadsRoutes, { prefix: "/uploads" });

  return app;
}
