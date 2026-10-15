import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";
import { config } from "../config";
import { logger } from "../lib/logger";

const { Pool } = pg;

if (!config.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const sslConfig =
  config.DATABASE_SSL === "disable"
    ? false
    : { rejectUnauthorized: false };

export const pool = new Pool({
  connectionString: config.DATABASE_URL,
  ssl: sslConfig,
});

export const db: NodePgDatabase<typeof schema> = drizzle(pool, { schema });

export async function closeDatabase(): Promise<void> {
  try {
    await pool.end();
    logger.info("Database pool closed gracefully");
  } catch (err) {
    logger.error({ err }, "Error closing database pool");
  }
}

export * from "./schema";


