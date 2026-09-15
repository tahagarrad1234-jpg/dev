import {
  index,
  integer,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { amalProducts } from "./products";
import { amalUsers } from "./users";

export const amalOrders = pgTable(
  "amal_orders",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").references(() => amalUsers.id, {
      onDelete: "set null",
    }),
    customerName: text("customer_name").notNull(),
    email: text("email").notNull(),
    phone: text("phone").notNull(),
    address: text("address").notNull(),
    city: text("city").notNull(),
    postalCode: text("postal_code").notNull(),
    country: text("country").notNull(),
    paymentMethod: text("payment_method").notNull(),
    total: numeric("total", { precision: 12, scale: 2, mode: "number" }).notNull(),
    status: text("status", {
      enum: ["Pago", "Preparando", "Enviado"],
    })
      .notNull()
      .default("Pago"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("amal_orders_user_id_idx").on(table.userId),
    index("amal_orders_created_at_idx").on(table.createdAt),
  ],
);

export const amalOrderItems = pgTable(
  "amal_order_items",
  {
    id: serial("id").primaryKey(),
    orderId: text("order_id")
      .notNull()
      .references(() => amalOrders.id, { onDelete: "cascade" }),
    productId: serial("product_id").references(() => amalProducts.id, {
      onDelete: "set null",
    }),
    productName: text("product_name").notNull(),
    unitPrice: numeric("unit_price", {
      precision: 12,
      scale: 2,
      mode: "number",
    }).notNull(),
    quantity: integer("quantity").notNull(),
  },
  (table) => [index("amal_order_items_order_id_idx").on(table.orderId)],
);

export const orderIdPrefix = "AM-";

export type Order = typeof amalOrders.$inferSelect;
export type InsertOrder = typeof amalOrders.$inferInsert;
export type OrderItem = typeof amalOrderItems.$inferSelect;
export type InsertOrderItem = typeof amalOrderItems.$inferInsert;