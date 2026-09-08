import { index, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const amalUsers = pgTable(
  "amal_users",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    passwordHash: text("password_hash"),
    role: text("role", { enum: ["customer", "admin"] })
      .notNull()
      .default("customer"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex("amal_users_email_unique").on(table.email)],
);

export const amalSessions = pgTable(
  "amal_sessions",
  {
    token: text("token").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => amalUsers.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (table) => [index("amal_sessions_expires_at_idx").on(table.expiresAt)],
);

export type User = typeof amalUsers.$inferSelect;
export type InsertUser = typeof amalUsers.$inferInsert;
export type Session = typeof amalSessions.$inferSelect;
export type InsertSession = typeof amalSessions.$inferInsert;