import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  AUTH_SECRET: z.string().min(16, "AUTH_SECRET must be at least 16 chars"),
  FRONTEND_URL: z.string().url().default("http://localhost:3000"),
  PORT: z.coerce.number().int().default(4000),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  FOOTBALL_API_PROVIDER: z.enum(["mock", "football-data", "thesportsdb", "mix"]).default("mock"),
  FOOTBALL_DATA_API_KEY: z.string().optional(),
  THESPORTSDB_API_KEY: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
});

export const env = envSchema.parse(process.env);
