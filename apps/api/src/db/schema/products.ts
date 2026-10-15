import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const amalProducts = pgTable(
  "amal_products",
  {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    collection: text("collection").notNull(),
    category: text("category").notNull(),
    priceCents: integer("price_cents").notNull(),
    image: text("image").notNull(),
    tone: text("tone").notNull(),
    description: text("description").notNull(),
    stock: integer("stock").notNull().default(0),
    isPublished: boolean("is_published").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("amal_products_slug_unique").on(table.slug),
    check("amal_products_stock_non_negative", sql`${table.stock} >= 0`),
  ],
);

export type Product = typeof amalProducts.$inferSelect;
export type InsertProduct = typeof amalProducts.$inferInsert;