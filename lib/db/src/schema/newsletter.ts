import { pgTable, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const amalNewsletter = pgTable(
  "amal_newsletter",
  {
    id: serial("id").primaryKey(),
    email: text("email").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex("amal_newsletter_email_unique").on(table.email)],
);

export type NewsletterSubscriber = typeof amalNewsletter.$inferSelect;
export type InsertNewsletterSubscriber = typeof amalNewsletter.$inferInsert;