import { Router, type IRouter } from "express";
import {
  createOrderSchema,
  listOrdersQuerySchema,
  updateOrderStatusSchema,
} from "./schema";
import {
  createOrder,
  getOrderById,
  getUserOrders,
  listAdminOrders,
  updateOrderStatus,
  InsufficientStockError,
} from "./service";
import { requireAuth, requireAdmin } from "../../middlewares/auth";
import { userFromSession } from "../../lib/auth-store";
import { SESSION_COOKIE_NAME } from "../../middlewares/auth";
import { logAdminAction } from "../admin/audit";

const router: IRouter = Router();

// Public / Guest / User: POST /api/orders
router.post("/orders", async (req, res, next) => {
  try {
    const parsed = createOrderSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: "Datos de pedido no válidos",
        details: parsed.error.issues,
      });
      return;
    }

    // Resolve optional logged-in user if session cookie is present
    let userId: string | null = null;
    const token = req.cookies?.[SESSION_COOKIE_NAME];
    if (token) {
      const user = await userFromSession(token);
      if (user) userId = user.id;
    }

    const order = await createOrder(parsed.data, userId);
    res.status(201).json({ order });
  } catch (err) {
    if (err instanceof InsufficientStockError) {
      res.status(409).json({ error: err.message });
      return;
    }
    next(err);
  }
});

// Authenticated customer: GET /api/orders/me or GET /api/orders
router.get(["/orders/me", "/orders"], requireAuth, async (req, res, next) => {
  try {
    const orders = await getUserOrders(req.user!.id, req.user!.email);
    res.json({ orders });
  } catch (err) {
    next(err);
  }
});

// Authenticated or Order Lookup: GET /api/orders/:id
router.get("/orders/:id", async (req, res, next) => {
  try {
    const id = String(req.params.id);
    const order = await getOrderById(id);
    if (!order) {
      res.status(404).json({ error: "Pedido no encontrado" });
      return;
    }

    // If order belongs to a user, enforce that only the owner or an admin can view it
    if (order.userId) {
      const token = req.cookies?.[SESSION_COOKIE_NAME];
      const user = token ? await userFromSession(token) : null;
      if (!user || (user.id !== order.userId && user.role !== "admin")) {
        res.status(403).json({ error: "Acceso no autorizado a este pedido" });
        return;
      }
    }

    res.json({ order });
  } catch (err) {
    next(err);
  }
});

// Admin: GET /api/admin/orders
router.get("/admin/orders", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const parsed = listOrdersQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({
        error: "Parámetros de consulta no válidos",
        details: parsed.error.issues,
      });
      return;
    }
    const result = await listAdminOrders(parsed.data);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Admin: PATCH /api/admin/orders/:id/status
router.patch(
  "/admin/orders/:id/status",
  requireAuth,
  requireAdmin,
  async (req, res, next) => {
    try {
      const id = String(req.params.id);
      const parsed = updateOrderStatusSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          error: "Estado de pedido no válido",
          details: parsed.error.issues,
        });
        return;
      }

      const updated = await updateOrderStatus(id, parsed.data.status, {
        carrier: typeof req.body?.carrier === "string" ? req.body.carrier : undefined,
        trackingNumber: typeof req.body?.trackingNumber === "string" ? req.body.trackingNumber : undefined,
      });
      if (!updated) {
        res.status(404).json({ error: "Pedido no encontrado" });
        return;
      }

      await logAdminAction({
        userId: req.user?.id,
        userEmail: req.user?.email || "admin",
        action: "order.status_update",
        entityType: "order",
        entityId: id,
        details: { newStatus: parsed.data.status },
      });

      res.json({ order: updated });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
