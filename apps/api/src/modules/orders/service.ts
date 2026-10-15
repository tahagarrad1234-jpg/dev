import { randomBytes } from "node:crypto";
import { and, desc, eq, ilike, or, sql, inArray, isNull } from "drizzle-orm";
import { db } from "../../db";
import {
  amalOrders,
  amalOrderItems,
  amalProducts,
  type OrderStatus,
} from "../../db/schema";
import { logger } from "../../lib/logger";
import { sendOrderConfirmation, sendOrderShippedNotification } from "../../lib/email";
import type { CreateOrderInput, ListOrdersQuery } from "./schema";

export class InsufficientStockError extends Error {
  statusCode = 409;
  constructor(message: string) {
    super(message);
    this.name = "InsufficientStockError";
  }
}

export function generateOrderId(): string {
  const year = new Date().getFullYear();
  const random = randomBytes(3).toString("hex").toUpperCase();
  return `AM-${year}-${random}`;
}

export async function createOrder(
  input: CreateOrderInput,
  userId?: string | null,
) {
  const { items: requestedItems, customerName, email, phone, address, city, postalCode, country, paymentMethod } = input;

  return await db.transaction(async (tx) => {
    const productIds = requestedItems.map((item) => item.productId);

    // Row-locking: SELECT ... FOR UPDATE ensures concurrency protection
    const productsInDb = await tx
      .select()
      .from(amalProducts)
      .where(inArray(amalProducts.id, productIds))
      .for("update");

    const productMap = new Map<number, (typeof productsInDb)[0]>();
    for (const p of productsInDb) {
      productMap.set(p.id, p);
    }

    // Verify all requested products exist and have sufficient stock
    let subtotalCents = 0;
    const itemsToInsert: {
      productId: number;
      productName: string;
      unitPriceCents: number;
      quantity: number;
    }[] = [];

    for (const reqItem of requestedItems) {
      const dbProduct = productMap.get(reqItem.productId);
      if (!dbProduct || !dbProduct.isPublished) {
        throw new InsufficientStockError(
          `El producto con ID ${reqItem.productId} no está disponible.`,
        );
      }

      if (dbProduct.stock < reqItem.quantity) {
        throw new InsufficientStockError(
          `Stock insuficiente para "${dbProduct.name}". Unidades disponibles: ${dbProduct.stock}, solicitadas: ${reqItem.quantity}.`,
        );
      }

      const itemTotal = dbProduct.priceCents * reqItem.quantity;
      subtotalCents += itemTotal;

      itemsToInsert.push({
        productId: dbProduct.id,
        productName: dbProduct.name,
        unitPriceCents: dbProduct.priceCents,
        quantity: reqItem.quantity,
      });

      // Decrement stock inside transaction
      await tx
        .update(amalProducts)
        .set({
          stock: sql`${amalProducts.stock} - ${reqItem.quantity}`,
          updatedAt: new Date(),
        })
        .where(eq(amalProducts.id, dbProduct.id));
    }

    // Shipping calculation: Free for orders >= 1000 EUR (100000 cents), else 50 EUR (5000 cents)
    const shippingCents = subtotalCents >= 100000 ? 0 : 5000;

    // Tax calculation: 21% IVA included for Spain, 0 for export outside EU
    const isSpain = country.toLowerCase() === "es" || country.toLowerCase() === "españa" || country.toLowerCase() === "spain";
    const taxCents = isSpain ? Math.round(subtotalCents * 0.21) : 0;
    const totalCents = subtotalCents + shippingCents;

    const orderId = generateOrderId();

    const [createdOrder] = await tx
      .insert(amalOrders)
      .values({
        id: orderId,
        userId: userId || null,
        customerName,
        email,
        phone,
        address,
        city,
        postalCode,
        country,
        paymentMethod,
        status: "pending",
        subtotalCents,
        shippingCents,
        taxCents,
        totalCents,
      })
      .returning();

    // Insert order items
    const insertedItems = await tx
      .insert(amalOrderItems)
      .values(
        itemsToInsert.map((item) => ({
          orderId,
          productId: item.productId,
          productName: item.productName,
          unitPriceCents: item.unitPriceCents,
          quantity: item.quantity,
        })),
      )
      .returning();

    return {
      ...createdOrder,
      total: createdOrder.totalCents / 100,
      subtotal: createdOrder.subtotalCents / 100,
      shipping: createdOrder.shippingCents / 100,
      tax: createdOrder.taxCents / 100,
      items: insertedItems.map((item) => ({
        ...item,
        unitPrice: item.unitPriceCents / 100,
      })),
    };
  });
}

export async function getOrderById(id: string) {
  const order = await db
    .select()
    .from(amalOrders)
    .where(eq(amalOrders.id, id))
    .limit(1)
    .then((rows) => rows[0]);

  if (!order) return null;

  const items = await db
    .select()
    .from(amalOrderItems)
    .where(eq(amalOrderItems.orderId, id));

  return {
    ...order,
    total: order.totalCents / 100,
    subtotal: order.subtotalCents / 100,
    shipping: order.shippingCents / 100,
    tax: order.taxCents / 100,
    items: items.map((item) => ({
      ...item,
      unitPrice: item.unitPriceCents / 100,
    })),
  };
}

export async function getUserOrders(userId: string, userEmail?: string) {
  if (userEmail) {
    try {
      // Auto-claim past guest orders matching customer's email address
      await db
        .update(amalOrders)
        .set({ userId })
        .where(
          and(
            eq(amalOrders.email, userEmail),
            isNull(amalOrders.userId),
          ),
        );
    } catch {
      // Fail gracefully if claim encounters any issue
    }
  }

  const orders = await db
    .select()
    .from(amalOrders)
    .where(eq(amalOrders.userId, userId))
    .orderBy(desc(amalOrders.createdAt));

  const orderIds = orders.map((o) => o.id);
  const items =
    orderIds.length > 0
      ? await db
          .select()
          .from(amalOrderItems)
          .where(inArray(amalOrderItems.orderId, orderIds))
      : [];

  const itemsByOrder = new Map<string, (typeof items)[0][]>();
  for (const item of items) {
    const list = itemsByOrder.get(item.orderId) || [];
    list.push(item);
    itemsByOrder.set(item.orderId, list);
  }

  return orders.map((order) => ({
    ...order,
    total: order.totalCents / 100,
    subtotal: order.subtotalCents / 100,
    shipping: order.shippingCents / 100,
    tax: order.taxCents / 100,
    items: (itemsByOrder.get(order.id) || []).map((item) => ({
      ...item,
      unitPrice: item.unitPriceCents / 100,
    })),
  }));
}

const STATUS_MAP: Record<string, OrderStatus> = {
  Pago: "paid",
  Preparando: "preparing",
  Enviado: "shipped",
  Entregado: "delivered",
  pending: "pending",
  paid: "paid",
  preparing: "preparing",
  shipped: "shipped",
  delivered: "delivered",
  cancelled: "cancelled",
  refunded: "refunded",
};

export async function listAdminOrders(query: ListOrdersQuery) {
  const { status, search, page, pageSize } = query;
  const offset = (page - 1) * pageSize;

  const conditions = [];

  if (status) {
    const normalizedStatus = STATUS_MAP[status] || (status as OrderStatus);
    conditions.push(eq(amalOrders.status, normalizedStatus));
  }

  if (search) {
    const pattern = `%${search}%`;
    conditions.push(
      or(
        ilike(amalOrders.id, pattern),
        ilike(amalOrders.customerName, pattern),
        ilike(amalOrders.email, pattern),
      )!,
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [orders, totalResult] = await Promise.all([
    db
      .select()
      .from(amalOrders)
      .where(whereClause)
      .orderBy(desc(amalOrders.createdAt))
      .limit(pageSize)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(amalOrders)
      .where(whereClause),
  ]);

  const total = Number(totalResult[0]?.count || 0);

  return {
    items: orders.map((order) => ({
      ...order,
      total: order.totalCents / 100,
      subtotal: order.subtotalCents / 100,
      shipping: order.shippingCents / 100,
      tax: order.taxCents / 100,
    })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function updateOrderStatus(
  id: string,
  status: string,
  trackingInfo?: { carrier?: string; trackingNumber?: string },
) {
  const normalizedStatus = STATUS_MAP[status] || "pending";
  const [updated] = await db
    .update(amalOrders)
    .set({ status: normalizedStatus })
    .where(eq(amalOrders.id, id))
    .returning();

  if (updated && (normalizedStatus === "shipped" || status === "Enviado")) {
    try {
      const fullOrder = await getOrderById(id);
      if (fullOrder && fullOrder.email) {
        const carrier = trackingInfo?.carrier || "DHL Express Blindado";
        const trackingNumber =
          trackingInfo?.trackingNumber || `AMAL-${Date.now().toString(36).toUpperCase()}`;

        sendOrderShippedNotification(
          {
            id: fullOrder.id,
            customerName: fullOrder.customerName,
            email: fullOrder.email,
            totalCents: fullOrder.totalCents,
            items: fullOrder.items.map((it) => ({
              productName: it.productName,
              unitPriceCents: it.unitPriceCents,
              quantity: it.quantity,
            })),
            address: fullOrder.address,
            city: fullOrder.city,
            postalCode: fullOrder.postalCode,
            country: fullOrder.country,
          },
          carrier,
          trackingNumber,
        ).catch((err) => {
          logger.error({ err, orderId: id }, "Failed to send order shipped notification email");
        });
      }
    } catch (err) {
      logger.error({ err, orderId: id }, "Failed to load order for shipped notification");
    }
  }

  return updated || null;
}

export async function markOrderPaid(id: string, stripePaymentIntentId?: string) {
  const [existing] = await db
    .select()
    .from(amalOrders)
    .where(eq(amalOrders.id, id))
    .limit(1);

  if (!existing) return null;
  if (existing.status === "paid") {
    return existing; // Idempotent: already marked paid
  }

  const [updated] = await db
    .update(amalOrders)
    .set({
      status: "paid",
      stripePaymentIntentId: stripePaymentIntentId || existing.stripePaymentIntentId,
    })
    .where(eq(amalOrders.id, id))
    .returning();

  // Send Order Confirmation Email asynchronously
  try {
    const fullOrder = await getOrderById(id);
    if (fullOrder && fullOrder.email) {
      sendOrderConfirmation({
        id: fullOrder.id,
        customerName: fullOrder.customerName,
        email: fullOrder.email,
        totalCents: fullOrder.totalCents,
        items: fullOrder.items.map((it) => ({
          productName: it.productName,
          unitPriceCents: it.unitPriceCents,
          quantity: it.quantity,
        })),
        address: fullOrder.address,
        city: fullOrder.city,
        postalCode: fullOrder.postalCode,
        country: fullOrder.country,
      }).catch((err) => {
        logger.error({ err, orderId: id }, "Failed to send order confirmation email");
      });
    }
  } catch (err) {
    logger.error({ err, orderId: id }, "Failed to load order for confirmation email");
  }

  return updated || null;
}

export async function releaseOrderStock(orderId: string) {
  return await db.transaction(async (tx) => {
    const order = await tx
      .select()
      .from(amalOrders)
      .where(eq(amalOrders.id, orderId))
      .limit(1)
      .then((rows) => rows[0]);

    if (!order || order.status === "cancelled") {
      return;
    }

    const items = await tx
      .select()
      .from(amalOrderItems)
      .where(eq(amalOrderItems.orderId, orderId));

    for (const item of items) {
      if (item.productId) {
        await tx
          .update(amalProducts)
          .set({
            stock: sql`${amalProducts.stock} + ${item.quantity}`,
            updatedAt: new Date(),
          })
          .where(eq(amalProducts.id, item.productId));
      }
    }

    await tx
      .update(amalOrders)
      .set({ status: "cancelled" })
      .where(eq(amalOrders.id, orderId));
  });
}

