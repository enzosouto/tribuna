import type { FastifyReply } from "fastify";
import { SESSION_COOKIE } from "../auth/session.js";
import { env } from "../env.js";

const THIRTY_DAYS_SECONDS = 30 * 24 * 60 * 60;

export function setSessionCookie(reply: FastifyReply, sessionId: string) {
  reply.setCookie(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: env.NODE_ENV === "production" ? "none" : "lax",
    path: "/",
    maxAge: THIRTY_DAYS_SECONDS,
  });
}

export function clearSessionCookie(reply: FastifyReply) {
  reply.clearCookie(SESSION_COOKIE, { path: "/" });
}
