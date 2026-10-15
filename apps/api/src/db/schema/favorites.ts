import { integer, pgTable, primaryKey, timestamp, uuid } from "drizzle-orm/pg-core";
import { amalProducts } from "./products";
import { amalUsers } from "./users";

export const amalFavorites = pgTable(
  "amal_favorites",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => amalUsers.id, { onDelete: "cascade" }),
    productId: integer("product_id")
      .notNull()
      .references(() => amalProducts.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.productId] })],
);

export type Favorite = typeof amalFavorites.$inferSelect;
export type InsertFavorite = typeof amalFavorites.$inferInsert;