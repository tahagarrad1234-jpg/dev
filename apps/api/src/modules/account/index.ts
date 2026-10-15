import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db } from "../../db";
import { amalUsers, amalOrders, amalOrderItems, amalFavorites } from "../../db/schema";
import { requireAuth, SESSION_COOKIE_NAME } from "../../middlewares/auth";
import { deleteSession, supabase } from "../../lib/auth-store";
import { logger } from "../../lib/logger";

const router: IRouter = Router();

// ==========================================
// GDPR Right to Data Portability (Data Export)
// ==========================================
router.get("/account/export", requireAuth, async (req, res, next) => {
  try {
    const userId = req.user!.id;

    // Fetch user profile
    const user = await db
      .select({
        id: amalUsers.id,
        name: amalUsers.name,
        email: amalUsers.email,
        role: amalUsers.role,
        createdAt: amalUsers.createdAt,
      })
      .from(amalUsers)
      .where(eq(amalUsers.id, userId))
      .then((rows) => rows[0]);

    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    // Fetch user orders with line items
    const orders = await db
      .select()
      .from(amalOrders)
      .where(eq(amalOrders.userId, userId));

    const orderIds = orders.map((o) => o.id);
    let orderItems: any[] = [];
    if (orderIds.length > 0) {
      orderItems = await db
        .select()
        .from(amalOrderItems);
    }

    const itemsByOrder = new Map<string, any[]>();
    for (const item of orderItems) {
      const list = itemsByOrder.get(item.orderId) || [];
      list.push(item);
      itemsByOrder.set(item.orderId, list);
    }

    // Fetch favorites
    const favorites = await db
      .select()
      .from(amalFavorites)
      .where(eq(amalFavorites.userId, userId));

    const exportData = {
      exportMetadata: {
        exportedAt: new Date().toISOString(),
        rgpdCompliance: "EU General Data Protection Regulation (GDPR) Article 20",
        controller: "AMAL Watches S.L.",
        contact: "dpo@amalwatches.com",
      },
      user,
      favorites: favorites.map((f) => ({ productId: f.productId, addedAt: f.createdAt })),
      orders: orders.map((o) => ({
        ...o,
        total: o.totalCents / 100,
        items: itemsByOrder.get(o.id) || [],
      })),
    };

    res.setHeader("Content-Type", "application/json");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="amal_personal_data_${userId}.json"`,
    );

    return res.json(exportData);
  } catch (err) {
    return next(err);
  }
});

// ==========================================
// GDPR Right to Erasure (Account Deletion)
// ==========================================
router.delete("/account/me", requireAuth, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const userEmail = req.user!.email;

    logger.info({ userId, userEmail }, "Processing GDPR account erasure request");

    // 1. Delete all sessions from amal_sessions
    const rawToken = req.cookies?.[SESSION_COOKIE_NAME];
    if (rawToken) {
      await deleteSession(rawToken);
    }

    // 2. Clear favorites
    await db.delete(amalFavorites).where(eq(amalFavorites.userId, userId));

    // 3. Anonymize past orders so accounting records remain intact without identifying data
    await db
      .update(amalOrders)
      .set({
        userId: null,
        customerName: "Usuario Eliminado (GDPR)",
        email: `anonymized_${Date.now()}@amal.deleted`,
        phone: "000000000",
        address: "Dirección suprimida",
      })
      .where(eq(amalOrders.userId, userId));

    // 4. Delete user record in local DB
    await db.delete(amalUsers).where(eq(amalUsers.id, userId));

    // 5. Delete Supabase Auth account if service role is available
    try {
      await supabase.auth.admin.deleteUser(userId);
    } catch (supabaseErr) {
      logger.warn({ supabaseErr, userId }, "Failed to delete user in Supabase Auth admin API");
    }

    // Clear session cookie
    res.clearCookie(SESSION_COOKIE_NAME, { path: "/" });

    return res.json({
      success: true,
      message: "Su cuenta y datos personales han sido eliminados conforme al RGPD.",
    });
  } catch (err) {
    return next(err);
  }
});

// ==========================================
// Update Profile (Name)
// ==========================================
router.patch("/account/profile", requireAuth, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const { name } = req.body;

    if (!name || typeof name !== "string" || name.trim().length < 2) {
      res.status(400).json({ error: "El nombre debe tener al menos 2 caracteres" });
      return;
    }

    const [updatedUser] = await db
      .update(amalUsers)
      .set({ name: name.trim() })
      .where(eq(amalUsers.id, userId))
      .returning();

    res.json({
      success: true,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// Change Password
// ==========================================
router.post("/account/change-password", requireAuth, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const userEmail = req.user!.email;
    const { currentPassword, newPassword } = req.body;

    if (!newPassword || typeof newPassword !== "string" || newPassword.length < 10) {
      res.status(400).json({
        error: "La nueva contraseña debe tener al menos 10 caracteres.",
      });
      return;
    }

    if (!currentPassword || typeof currentPassword !== "string") {
      res.status(400).json({
        error: "Debe ingresar su contraseña actual.",
      });
      return;
    }

    // Verify current password first with Supabase Auth
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: userEmail,
      password: currentPassword,
    });

    if (signInError) {
      res.status(401).json({ error: "La contraseña actual introducida no es correcta." });
      return;
    }

    // Update password using Supabase Admin
    const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
      password: newPassword,
    });

    if (updateError) {
      res.status(500).json({ error: updateError.message });
      return;
    }

    res.json({
      success: true,
      message: "Su contraseña ha sido actualizada con éxito.",
    });
  } catch (err) {
    next(err);
  }
});

export default router;
