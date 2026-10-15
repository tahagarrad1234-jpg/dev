import { db } from "../../db";
import { amalAuditLogs } from "../../db/schema/audit-logs";
import { logger } from "../../lib/logger";

interface LogAdminActionParams {
  userId?: string | null;
  userEmail: string;
  action: string;
  entityType: "product" | "order" | "settings";
  entityId: string;
  details?: Record<string, unknown>;
}

export async function logAdminAction({
  userId,
  userEmail,
  action,
  entityType,
  entityId,
  details,
}: LogAdminActionParams) {
  try {
    const id = `aud_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    await db.insert(amalAuditLogs).values({
      id,
      userId: userId || null,
      userEmail,
      action,
      entityType,
      entityId,
      details: details || null,
    });
  } catch (err) {
    logger.error({ err, action, entityId }, "Failed to write admin audit log");
  }
}
