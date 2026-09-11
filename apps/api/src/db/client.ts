import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { env } from "../env.js";
import * as schema from "./schema.js";

export const pool = new pg.Pool({
  connectionString: env.DATABASE_URL,
  ssl: env.DATABASE_URL.includes("localhost") ? false : { rejectUnauthorized: false },
  // The match sync holds a connection across thousands of sequential round trips;
  // without TCP keepalive those long-lived sockets get dropped mid-run by Neon/NAT.
  keepAlive: true,
});

export const db = drizzle(pool, { schema });
