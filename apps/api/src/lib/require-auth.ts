import type { FastifyRequest } from "fastify";
import { unauthorized } from "./errors.js";

export function requireAuth(request: FastifyRequest): string {
  if (!request.userId) throw unauthorized();
  return request.userId;
}
