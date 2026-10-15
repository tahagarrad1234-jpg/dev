import { Router, type IRouter } from "express";
import { sql, desc, lte, eq, and, or, inArray, gte, lt } from "drizzle-orm";
import { z } from "zod";
import { db } from "../../db";
import {
  amalOrders,
  amalOrderItems,
  amalProducts,
  amalUsers,
  amalStoreSettings,
} from "../../db/schema";
import { requireAuth, requireAdmin } from "../../middlewares/auth";
import { logAdminAction } from "./audit";
import { logger } from "../../lib/logger";

const router: IRouter = Router();

// ==========================================
// 1. Overview & Stats
// ==========================================
router.get("/admin/stats", requireAuth, requireAdmin, async (_req, res, next) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const [
      ordersAggregate,
      currentPeriodAggregate,
      priorPeriodAggregate,
      lowStockResult,
      customersResult,
      recentOrders,
    ] = await Promise.all([
      db
        .select({
          count: sql<number>`count(*)`,
          totalRevenueCents: sql<number>`coalesce(sum(case when status != 'cancelled' then total_cents else 0 end), 0)`,
        })
        .from(amalOrders),
      db
        .select({
          count: sql<number>`count(*)`,
          revenueCents: sql<number>`coalesce(sum(case when status != 'cancelled' then total_cents else 0 end), 0)`,
        })
        .from(amalOrders)
        .where(gte(amalOrders.createdAt, thirtyDaysAgo)),
      db
        .select({
          count: sql<number>`count(*)`,
          revenueCents: sql<number>`coalesce(sum(case when status != 'cancelled' then total_cents else 0 end), 0)`,
        })
        .from(amalOrders)
        .where(
          and(
            gte(amalOrders.createdAt, sixtyDaysAgo),
            lt(amalOrders.createdAt, thirtyDaysAgo),
          ),
        ),
      db
        .select({ count: sql<number>`count(*)` })
        .from(amalProducts)
        .where(lte(amalProducts.stock, 3)),
      db
        .select({ count: sql<number>`count(*)` })
        .from(amalUsers),
      db
        .select()
        .from(amalOrders)
        .orderBy(desc(amalOrders.createdAt))
        .limit(5),
    ]);

    const ordersCount = Number(ordersAggregate[0]?.count || 0);
    const revenueCents = Number(ordersAggregate[0]?.totalRevenueCents || 0);
    const avgOrderValueCents =
      ordersCount > 0 ? Math.round(revenueCents / ordersCount) : 0;
    const lowStockCount = Number(lowStockResult[0]?.count || 0);
    const customersCount = Number(customersResult[0]?.count || 0);

    const currentRevenue = Number(currentPeriodAggregate[0]?.revenueCents || 0);
    const priorRevenue = Number(priorPeriodAggregate[0]?.revenueCents || 0);
    const revenueChangePercent =
      priorRevenue > 0
        ? Math.round(((currentRevenue - priorRevenue) / priorRevenue) * 100)
        : currentRevenue > 0
          ? 100
          : 0;

    const currentOrders = Number(currentPeriodAggregate[0]?.count || 0);
    const priorOrders = Number(priorPeriodAggregate[0]?.count || 0);
    const ordersChangePercent =
      priorOrders > 0
        ? Math.round(((currentOrders - priorOrders) / priorOrders) * 100)
        : currentOrders > 0
          ? 100
          : 0;

    res.json({
      stats: {
        revenueCents,
        revenue: revenueCents / 100,
        revenueChangePercent,
        ordersCount,
        ordersChangePercent,
        avgOrderValueCents,
        avgOrderValue: avgOrderValueCents / 100,
        lowStockCount,
        customersCount,
        recentOrders: recentOrders.map((o) => ({
          ...o,
          total: o.totalCents / 100,
        })),
      },
    });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// 2. Orders CSV Export (Formula Injection Safe)
// ==========================================
function sanitizeCsvField(field: unknown): string {
  if (field === null || field === undefined) return '""';
  let str = String(field);
  // Prevent CSV injection vulnerabilities (formulas starting with =, +, -, @, \t, \r)
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  // Escape quotes
  return `"${str.replace(/"/g, '""')}"`;
}

router.get("/admin/orders/export", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const orders = await db
      .select()
      .from(amalOrders)
      .orderBy(desc(amalOrders.createdAt));

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="amal_pedidos_${Date.now()}.csv"`,
    );

    // BOM for Excel compatibility
    res.write("\uFEFF");

    const headers = [
      "ID Pedido",
      "Fecha",
      "Cliente",
      "Email",
      "Teléfono",
      "Dirección",
      "Ciudad",
      "Código Postal",
      "País",
      "Estado",
      "Método de Pago",
      "Total EUR",
    ];
    res.write(headers.join(",") + "\r\n");

    for (const o of orders) {
      const row = [
        sanitizeCsvField(o.id),
        sanitizeCsvField(o.createdAt ? new Date(o.createdAt).toISOString() : ""),
        sanitizeCsvField(o.customerName),
        sanitizeCsvField(o.email),
        sanitizeCsvField(o.phone),
        sanitizeCsvField(o.address),
        sanitizeCsvField(o.city),
        sanitizeCsvField(o.postalCode),
        sanitizeCsvField(o.country),
        sanitizeCsvField(o.status),
        sanitizeCsvField(o.paymentMethod),
        sanitizeCsvField((o.totalCents / 100).toFixed(2)),
      ];
      res.write(row.join(",") + "\r\n");
    }

    res.end();
  } catch (err) {
    next(err);
  }
});

// ==========================================
// 3. Customers Directory & Spend
// ==========================================
router.get("/admin/customers", requireAuth, requireAdmin, async (_req, res, next) => {
  try {
    const users = await db
      .select({
        id: amalUsers.id,
        name: amalUsers.name,
        email: amalUsers.email,
        role: amalUsers.role,
        createdAt: amalUsers.createdAt,
      })
      .from(amalUsers)
      .orderBy(desc(amalUsers.createdAt));

    // Calculate lifetime spend and order count per user
    const orderStats = await db
      .select({
        userId: amalOrders.userId,
        orderCount: sql<number>`count(*)`,
        lifetimeSpendCents: sql<number>`coalesce(sum(case when status != 'cancelled' then total_cents else 0 end), 0)`,
      })
      .from(amalOrders)
      .where(sql`${amalOrders.userId} IS NOT NULL`)
      .groupBy(amalOrders.userId);

    const statsMap = new Map<string, { orderCount: number; lifetimeSpendCents: number }>();
    for (const stat of orderStats) {
      if (stat.userId) {
        statsMap.set(stat.userId, {
          orderCount: Number(stat.orderCount || 0),
          lifetimeSpendCents: Number(stat.lifetimeSpendCents || 0),
        });
      }
    }

    const customers = users.map((u) => {
      const stat = statsMap.get(u.id) || { orderCount: 0, lifetimeSpendCents: 0 };
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        createdAt: u.createdAt,
        orderCount: stat.orderCount,
        lifetimeSpendCents: stat.lifetimeSpendCents,
        lifetimeSpend: stat.lifetimeSpendCents / 100,
      };
    });

    res.json({ customers });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// 4. Store Settings
// ==========================================
const SettingsSchema = z.object({
  shopName: z.string().min(2, "El nombre de la tienda es requerido"),
  contactEmail: z.string().email("Correo electrónico no válido"),
  currency: z.string().min(3).max(3),
  freeShippingThreshold: z.number().min(0),
});

router.get("/admin/settings", requireAuth, requireAdmin, async (_req, res, next) => {
  try {
    const settings = await db
      .select()
      .from(amalStoreSettings)
      .where(eq(amalStoreSettings.id, "default"))
      .limit(1)
      .then((rows) => rows[0]);

    if (!settings) {
      return res.json({
        settings: {
          shopName: "AMAL Watches",
          contactEmail: "atelier@amalwatches.com",
          currency: "EUR",
          freeShippingThreshold: 1000,
        },
      });
    }

    return res.json({
      settings: {
        shopName: settings.shopName,
        contactEmail: settings.contactEmail,
        currency: settings.currency,
        freeShippingThreshold: settings.freeShippingThresholdCents / 100,
      },
    });
  } catch (err) {
    return next(err);
  }
});

router.put("/admin/settings", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const parsed = SettingsSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Datos de ajustes no válidos", details: parsed.error.issues });
    }

    const { shopName, contactEmail, currency, freeShippingThreshold } = parsed.data;
    const thresholdCents = Math.round(freeShippingThreshold * 100);

    const [updated] = await db
      .insert(amalStoreSettings)
      .values({
        id: "default",
        shopName,
        contactEmail,
        currency,
        freeShippingThresholdCents: thresholdCents,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: amalStoreSettings.id,
        set: {
          shopName,
          contactEmail,
          currency,
          freeShippingThresholdCents: thresholdCents,
          updatedAt: new Date(),
        },
      })
      .returning();

    await logAdminAction({
      userId: req.user?.id,
      userEmail: req.user?.email || "admin",
      action: "settings.update",
      entityType: "settings",
      entityId: "default",
      details: parsed.data,
    });

    return res.json({
      settings: {
        shopName: updated.shopName,
        contactEmail: updated.contactEmail,
        currency: updated.currency,
        freeShippingThreshold: updated.freeShippingThresholdCents / 100,
      },
    });
  } catch (err) {
    return next(err);
  }
});

// Public settings endpoint for storefront
router.get("/settings", async (_req, res, next) => {
  try {
    const settings = await db
      .select()
      .from(amalStoreSettings)
      .where(eq(amalStoreSettings.id, "default"))
      .limit(1)
      .then((rows) => rows[0]);

    if (!settings) {
      return res.json({
        shopName: "AMAL Watches",
        contactEmail: "atelier@amalwatches.com",
        currency: "EUR",
        freeShippingThreshold: 1000,
      });
    }

    return res.json({
      shopName: settings.shopName,
      contactEmail: settings.contactEmail,
      currency: settings.currency,
      freeShippingThreshold: settings.freeShippingThresholdCents / 100,
    });
  } catch (err) {
    return next(err);
  }
});

// ==========================================
// 5. Catalog CRUD with Zod & Soft Delete
// ==========================================
const AdminProductSchema = z.object({
  name: z.string().min(2, "Nombre requerido"),
  collection: z.string().min(2, "Colección requerida"),
  category: z.enum(["Dress", "Field", "Diver", "Chronograph"]),
  price: z.number().positive("El precio debe ser positivo"),
  stock: z.number().int().nonnegative("El stock debe ser 0 o superior"),
  image: z.string().url("URL de imagen válida requerida"),
  tone: z.string().default("bone"),
  description: z.string().min(5, "Descripción requerida"),
  isPublished: z.boolean().default(true),
});

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// POST /api/admin/products
router.post("/admin/products", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const parsed = AdminProductSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Datos de producto no válidos", details: parsed.error.issues });
    }

    const { name, collection, category, price, stock, image, tone, description, isPublished } = parsed.data;
    const slugBase = slugify(name);
    const priceCents = Math.round(price * 100);

    const [created] = await db
      .insert(amalProducts)
      .values({
        slug: `${slugBase}-${Date.now().toString().slice(-4)}`,
        name,
        collection,
        category,
        priceCents,
        stock,
        image,
        tone,
        description,
        isPublished,
      })
      .returning();

    await logAdminAction({
      userId: req.user?.id,
      userEmail: req.user?.email || "admin",
      action: "product.create",
      entityType: "product",
      entityId: String(created.id),
      details: { name, price, stock },
    });

    return res.status(201).json({
      product: {
        ...created,
        price: created.priceCents / 100,
      },
    });
  } catch (err) {
    return next(err);
  }
});

// PUT /api/admin/products/:id
router.put("/admin/products/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!id || Number.isNaN(id)) {
      return res.status(400).json({ error: "ID de producto no válido" });
    }

    const parsed = AdminProductSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Datos de producto no válidos", details: parsed.error.issues });
    }

    const { name, collection, category, price, stock, image, tone, description, isPublished } = parsed.data;
    const priceCents = Math.round(price * 100);

    const [updated] = await db
      .update(amalProducts)
      .set({
        name,
        collection,
        category,
        priceCents,
        stock,
        image,
        tone,
        description,
        isPublished,
        updatedAt: new Date(),
      })
      .where(eq(amalProducts.id, id))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    await logAdminAction({
      userId: req.user?.id,
      userEmail: req.user?.email || "admin",
      action: "product.update",
      entityType: "product",
      entityId: String(id),
      details: { name, price, stock, isPublished },
    });

    return res.json({
      product: {
        ...updated,
        price: updated.priceCents / 100,
      },
    });
  } catch (err) {
    return next(err);
  }
});

// DELETE /api/admin/products/:id (Safe soft-delete if product has orders)
router.delete("/admin/products/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!id || Number.isNaN(id)) {
      return res.status(400).json({ error: "ID de producto no válido" });
    }

    // Check if product is referenced in any order items
    const ordersReferencingProduct = await db
      .select({ id: amalOrderItems.id })
      .from(amalOrderItems)
      .where(eq(amalOrderItems.productId, id))
      .limit(1);

    const hasOrders = ordersReferencingProduct.length > 0;

    if (hasOrders) {
      // Soft-delete: unpublish product to preserve order history integrity
      await db
        .update(amalProducts)
        .set({ isPublished: false, updatedAt: new Date() })
        .where(eq(amalProducts.id, id));

      await logAdminAction({
        userId: req.user?.id,
        userEmail: req.user?.email || "admin",
        action: "product.soft_delete",
        entityType: "product",
        entityId: String(id),
        details: { reason: "Product has associated orders; unpublished safely." },
      });

      return res.json({
        success: true,
        softDeleted: true,
        message: "La pieza tiene pedidos históricos asociados; ha sido despublicada del catálogo sin romper historiales.",
      });
    }

    // Hard-delete if no associated orders exist
    await db.delete(amalProducts).where(eq(amalProducts.id, id));

    await logAdminAction({
      userId: req.user?.id,
      userEmail: req.user?.email || "admin",
      action: "product.delete",
      entityType: "product",
      entityId: String(id),
    });

    return res.json({ success: true, softDeleted: false });
  } catch (err) {
    return next(err);
  }
});

// ==========================================
// 6. Image Upload Endpoint (Server checked 5MB max, webp/jpeg/png)
// ==========================================
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB

router.post("/admin/upload", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { base64Data, contentType, filename } = req.body;

    if (!base64Data || !contentType) {
      return res.status(400).json({ error: "base64Data y contentType son obligatorios" });
    }

    if (!ALLOWED_MIME_TYPES.includes(contentType)) {
      return res.status(400).json({
        error: "Formato no permitido. Solo se aceptan imágenes JPEG, PNG o WebP.",
      });
    }

    const buffer = Buffer.from(base64Data, "base64");
    if (buffer.length > MAX_UPLOAD_BYTES) {
      return res.status(400).json({
        error: "La imagen excede el límite máximo permitido de 5 MB.",
      });
    }

    // Return data URL or generated media URL
    const publicUrl = `data:${contentType};base64,${base64Data}`;

    return res.json({
      url: publicUrl,
      sizeBytes: buffer.length,
      mimeType: contentType,
      filename: filename || `amal_piece_${Date.now()}`,
    });
  } catch (err) {
    return next(err);
  }
});

export default router;
