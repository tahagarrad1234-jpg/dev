import { Router, type IRouter } from "express";
import { sql } from "drizzle-orm";
import { db } from "../db";
import { logger } from "../lib/logger";

const router: IRouter = Router();

// Liveness probe: returns 200 if process is running
router.get("/healthz", (_req, res) => {
  res.json({
    status: "ok",
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// Readiness probe: checks DB connection
router.get("/readyz", async (_req, res) => {
  try {
    await db.execute(sql`SELECT 1`);
    res.json({
      status: "ready",
      database: "connected",
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    logger.error({ err }, "Readiness check failed: Database unreachable");
    res.status(503).json({
      status: "unhealthy",
      database: "disconnected",
      error: "Database connectivity check failed",
    });
  }
});

export default router;
