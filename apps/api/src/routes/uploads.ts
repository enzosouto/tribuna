import { randomUUID } from "node:crypto";
import { createWriteStream, mkdirSync } from "node:fs";
import path from "node:path";
import type { FastifyInstance } from "fastify";
import { badRequest } from "../lib/errors.js";

export const UPLOAD_DIR = path.resolve(process.cwd(), "uploads");
mkdirSync(UPLOAD_DIR, { recursive: true });
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

    const filename = `${randomUUID()}${EXT_BY_MIME[data.mimetype]}`;
    const filepath = path.join(UPLOAD_DIR, filename);

    try {
      await new Promise<void>((resolve, reject) => {
        const stream = createWriteStream(filepath);
        data.file.on("limit", () => reject(badRequest("File too large (max 5MB)")));
        data.file.on("error", reject);
        stream.on("error", reject);
        stream.on("finish", resolve);
        data.file.pipe(stream);
      });
    } catch (err) {
      if (data.file.truncated) throw badRequest("File too large (max 5MB)");
      throw err;
    }

    const protocol = request.protocol;
    const host = request.headers.host;
    reply.status(201).send({ url: `${protocol}://${host}/uploads/${filename}` });
  });
}
