import { eq } from "drizzle-orm";
import type { FastifyRequest } from "fastify";
import { db } from "../db/client.js";
import { users } from "../db/schema.js";
import { forbidden } from "./errors.js";
import { requireAuth } from "./require-auth.js";

export async function requireAdmin(request: FastifyRequest): Promise<string> {
  const userId = requireAuth(request);
  const [user] = await db.select({ role: users.role }).from(users).where(eq(users.id, userId)).limit(1);
  if (!user || user.role !== "admin") throw forbidden("Admin access required");
  return userId;
}
