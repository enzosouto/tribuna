import { forgotPasswordSchema, loginSchema, registerSchema, resetPasswordSchema } from "@tribuna/shared";
import { randomBytes } from "node:crypto";
import { eq, or } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { hashPassword, verifyPassword } from "../auth/password.js";
import { createSession, destroySession, SESSION_COOKIE } from "../auth/session.js";
import { db } from "../db/client.js";
import { users } from "../db/schema.js";
import { env } from "../env.js";
import { clearSessionCookie, setSessionCookie } from "../lib/cookies.js";
import { badRequest, conflict, unauthorized } from "../lib/errors.js";
import { sendPasswordResetEmail } from "../lib/mailer.js";
import { fetchUserPublic } from "../lib/user-profile.js";

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

export async function authRoutes(app: FastifyInstance) {
  app.post("/register", async (request, reply) => {
    const input = registerSchema.parse(request.body);

    const existing = await db
      .select({ id: users.id, email: users.email, username: users.username })
      .from(users)
      .where(or(eq(users.email, input.email), eq(users.username, input.username)));

    if (existing.some((u) => u.email === input.email)) {
      throw conflict("Email already in use");
    }
    if (existing.some((u) => u.username === input.username)) {
      throw conflict("Username already in use");
    }

    const passwordHash = await hashPassword(input.password);
    const [created] = await db
      .insert(users)
      .values({
        name: input.name,
        username: input.username,
        email: input.email,
        passwordHash,
        avatarUrl: input.avatarUrl ?? null,
      })
      .returning({ id: users.id });

    const session = await createSession(created.id);
    setSessionCookie(reply, session.id);

    const profile = await fetchUserPublic(created.id, created.id);
    reply.status(201).send(profile);
  });

  app.post("/login", async (request, reply) => {
    const input = loginSchema.parse(request.body);

    const [user] = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
    if (!user) throw unauthorized("Invalid email or password");

    const valid = await verifyPassword(input.password, user.passwordHash);
    if (!valid) throw unauthorized("Invalid email or password");

    if (user.status === "banned") throw unauthorized("This account has been banned");

    const session = await createSession(user.id);
    setSessionCookie(reply, session.id);

    const profile = await fetchUserPublic(user.id, user.id);
    reply.send(profile);
  });

  app.post("/logout", async (request, reply) => {
    const sessionId = request.cookies[SESSION_COOKIE];
    if (sessionId) await destroySession(sessionId);
    clearSessionCookie(reply);
    reply.status(204).send();
  });

  app.post("/forgot-password", async (request, reply) => {
    const input = forgotPasswordSchema.parse(request.body);
    const [user] = await db.select({ id: users.id, email: users.email }).from(users).where(eq(users.email, input.email)).limit(1);

    // Always respond the same way so we never leak whether an email is registered.
    if (!user) {
      reply.send({ message: "If that email exists, a reset link was sent." });
      return;
    }

    const token = randomBytes(32).toString("hex");
    await db
      .update(users)
      .set({ passwordResetToken: token, passwordResetExpiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS) })
      .where(eq(users.id, user.id));

    const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${token}`;
    const emailed = await sendPasswordResetEmail(user.email, resetUrl);

    // With SMTP configured the link only ever goes to the user's inbox. Without it
    // (local dev with no mail server), return the token so the flow stays testable.
    reply.send({
      message: "If that email exists, a reset link was sent.",
      ...(emailed ? {} : { resetToken: token }),
    });
  });

  app.post("/reset-password", async (request, reply) => {
    const input = resetPasswordSchema.parse(request.body);
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.passwordResetToken, input.token))
      .limit(1);

    if (!user || !user.passwordResetExpiresAt || user.passwordResetExpiresAt.getTime() < Date.now()) {
      throw badRequest("Reset link is invalid or expired");
    }

    const passwordHash = await hashPassword(input.newPassword);
    await db
      .update(users)
      .set({ passwordHash, passwordResetToken: null, passwordResetExpiresAt: null, updatedAt: new Date() })
      .where(eq(users.id, user.id));

    reply.status(204).send();
  });

  app.get("/me", async (request, reply) => {
    if (!request.userId) {
      reply.send(null);
      return;
    }
    const profile = await fetchUserPublic(request.userId, request.userId);
    reply.send(profile);
  });
}
