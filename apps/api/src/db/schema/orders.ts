import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { amalProducts } from "./products";
import { amalUsers } from "./users";

export const ORDER_STATUSES = [
  "pending",
  "paid",
  "preparing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const amalOrders = pgTable(
  "amal_orders",
  {
    id: text("id").primaryKey(),
    userId: uuid("user_id").references(() => amalUsers.id, {
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
    stripePaymentIntentId: text("stripe_payment_intent_id"),
    status: text("status", { enum: ORDER_STATUSES })
      .notNull()
      .default("pending"),
    subtotalCents: integer("subtotal_cents").notNull(),
    shippingCents: integer("shipping_cents").notNull().default(0),
    taxCents: integer("tax_cents").notNull().default(0),
    totalCents: integer("total_cents").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("amal_orders_user_id_idx").on(table.userId),
    index("amal_orders_created_at_idx").on(table.createdAt),
    index("amal_orders_status_idx").on(table.status),
  ],
);

export const amalOrderItems = pgTable(
  "amal_order_items",
  {
    id: serial("id").primaryKey(),
    orderId: text("order_id")
      .notNull()
      .references(() => amalOrders.id, { onDelete: "cascade" }),
    productId: integer("product_id").references(() => amalProducts.id, {
      onDelete: "set null",
    }),
    productName: text("product_name").notNull(),
    unitPriceCents: integer("unit_price_cents").notNull(),
    quantity: integer("quantity").notNull(),
  },
  (table) => [
    index("amal_order_items_order_id_idx").on(table.orderId),
    check("amal_order_items_quantity_positive", sql`${table.quantity} > 0`),
  ],
);

export const orderIdPrefix = "AM-";

export type Order = typeof amalOrders.$inferSelect;
export type InsertOrder = typeof amalOrders.$inferInsert;
export type OrderItem = typeof amalOrderItems.$inferSelect;
export type InsertOrderItem = typeof amalOrderItems.$inferInsert;