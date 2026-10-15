import { migrate } from "drizzle-orm/node-postgres/migrator";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { db, pool } from "./index";
import { logger } from "../lib/logger";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function runMigrations() {
  logger.info("Starting Drizzle database migrations...");
  const migrationsFolder = path.resolve(__dirname, "../../drizzle");

  try {
    await migrate(db, { migrationsFolder });
    logger.info("Database migrations applied successfully");
  } catch (err) {
    logger.error({ err }, "Database migration failed");
    throw err;
  } finally {
    await pool.end();
  }
}

runMigrations()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Migration error:", err);
    process.exit(1);
  });
