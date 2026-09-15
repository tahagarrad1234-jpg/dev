import { integer, numeric, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const amalProducts = pgTable("amal_products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  collection: text("collection").notNull(),
  category: text("category").notNull(),
  price: numeric("price", { precision: 12, scale: 2, mode: "number" }).notNull(),
  image: text("image").notNull(),
  tone: text("tone").notNull(),
  description: text("description").notNull(),
  stock: integer("stock").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Product = typeof amalProducts.$inferSelect;
export type InsertProduct = typeof amalProducts.$inferInsert;