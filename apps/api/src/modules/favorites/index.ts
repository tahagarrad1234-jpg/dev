import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import { db } from "../../db";
import { amalFavorites, amalProducts } from "../../db/schema";
import { requireAuth } from "../../middlewares/auth";

const router: IRouter = Router();

// GET /api/favorites: list user's favorite products
router.get("/favorites", requireAuth, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const favorites = await db
      .select({
        productId: amalFavorites.productId,
        createdAt: amalFavorites.createdAt,
        product: amalProducts,
      })
      .from(amalFavorites)
      .innerJoin(
        amalProducts,
        eq(amalFavorites.productId, amalProducts.id),
      )
      .where(eq(amalFavorites.userId, userId));

    res.json({
      favorites: favorites.map((f) => ({
        ...f.product,
        price: f.product.priceCents / 100,
        favoritedAt: f.createdAt,
      })),
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/favorites/sync: batch sync guest favorites with user account
router.post("/favorites/sync", requireAuth, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const { productIds } = req.body;

    if (Array.isArray(productIds) && productIds.length > 0) {
      for (const rawId of productIds) {
        const productId = Number(rawId);
        if (!Number.isNaN(productId) && productId > 0) {
          await db
            .insert(amalFavorites)
            .values({ userId, productId })
            .onConflictDoNothing();
        }
      }
    }

    const favorites = await db
      .select({
        productId: amalFavorites.productId,
        createdAt: amalFavorites.createdAt,
        product: amalProducts,
      })
      .from(amalFavorites)
      .innerJoin(
        amalProducts,
        eq(amalFavorites.productId, amalProducts.id),
      )
      .where(eq(amalFavorites.userId, userId));

    res.json({
      favorites: favorites.map((f) => ({
        ...f.product,
        price: f.product.priceCents / 100,
        favoritedAt: f.createdAt,
      })),
      ids: favorites.map((f) => f.productId),
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/favorites/:productId: add to favorites
router.put("/favorites/:productId", requireAuth, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const productId = Number(req.params.productId);

    if (Number.isNaN(productId) || productId <= 0) {
      res.status(400).json({ error: "ID de producto no válido" });
      return;
    }

    // Verify product exists
    const product = await db
      .select({ id: amalProducts.id })
      .from(amalProducts)
      .where(eq(amalProducts.id, productId))
      .limit(1)
      .then((rows) => rows[0]);

    if (!product) {
      res.status(404).json({ error: "Producto no encontrado" });
      return;
    }

    await db
      .insert(amalFavorites)
      .values({ userId, productId })
      .onConflictDoNothing();

    res.status(200).json({ success: true, message: "Añadido a favoritos" });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/favorites/:productId: remove from favorites
router.delete("/favorites/:productId", requireAuth, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const productId = Number(req.params.productId);

    if (Number.isNaN(productId) || productId <= 0) {
      res.status(400).json({ error: "ID de producto no válido" });
      return;
    }

    await db
      .delete(amalFavorites)
      .where(
        and(
          eq(amalFavorites.userId, userId),
          eq(amalFavorites.productId, productId),
        ),
      );

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
