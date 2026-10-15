import { index, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const amalAuditLogs = pgTable(
  "amal_audit_logs",
  {
    id: text("id").primaryKey(),
    userId: text("user_id"),
    userEmail: text("user_email").notNull(),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id").notNull(),
    details: jsonb("details"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("amal_audit_logs_user_id_idx").on(table.userId),
    index("amal_audit_logs_entity_idx").on(table.entityType, table.entityId),
    index("amal_audit_logs_created_at_idx").on(table.createdAt),
  ],
);

export type AuditLog = typeof amalAuditLogs.$inferSelect;
export type InsertAuditLog = typeof amalAuditLogs.$inferInsert;
