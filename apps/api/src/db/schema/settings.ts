import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const amalStoreSettings = pgTable("amal_store_settings", {
  id: text("id").primaryKey().default("default"),
  shopName: text("shop_name").notNull().default("AMAL Watches"),
  contactEmail: text("contact_email").notNull().default("atelier@amalwatches.com"),
  currency: text("currency").notNull().default("EUR"),
  freeShippingThresholdCents: integer("free_shipping_threshold_cents")
    .notNull()
    .default(100000),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type StoreSettings = typeof amalStoreSettings.$inferSelect;
export type InsertStoreSettings = typeof amalStoreSettings.$inferInsert;
