import { randomUUID } from "node:crypto";
import { put } from "@vercel/blob";
import type { FastifyInstance } from "fastify";
import { badRequest } from "../lib/errors.js";

const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

export async function uploadsRoutes(app: FastifyInstance) {
  app.post("/avatar", async (request, reply) => {
    const data = await request.file({ limits: { fileSize: MAX_SIZE } });
    if (!data) throw badRequest("No file uploaded");
    if (!ALLOWED_MIME.has(data.mimetype)) {
      throw badRequest("Only JPEG, PNG, WEBP or GIF images are allowed");
    }

    const filename = `avatars/${randomUUID()}${EXT_BY_MIME[data.mimetype]}`;

    let buffer: Buffer;
    try {
      buffer = await data.toBuffer();
    } catch (err) {
      if (data.file.truncated) throw badRequest("File too large (max 5MB)");
      throw err;
    }

    const blob = await put(filename, buffer, {
      access: "public",
      contentType: data.mimetype,
      addRandomSuffix: false,
    });

    reply.status(201).send({ url: blob.url });
  });
}
