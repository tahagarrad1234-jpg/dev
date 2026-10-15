import { Router, type IRouter } from "express";
import {
  listProductsQuerySchema,
  createProductSchema,
  updateProductSchema,
} from "./schema";
import {
  listProducts,
  getProductBySlugOrId,
  createProduct,
  updateProduct,
  deleteProduct,
} from "./service";
import { requireAuth, requireAdmin } from "../../middlewares/auth";

const router: IRouter = Router();

// Public: GET /api/products
router.get("/products", async (req, res, next) => {
  try {
    const parsed = listProductsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({
        error: "Parámetros de consulta no válidos",
        details: parsed.error.issues,
      });
      return;
    }
    const result = await listProducts(parsed.data);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Public: GET /api/products/:slug
router.get("/products/:slug", async (req, res, next) => {
  try {
    const { slug } = req.params;
    const product = await getProductBySlugOrId(slug);
    if (!product) {
      res.status(404).json({ error: "Producto no encontrado" });
      return;
    }
    res.json({ product });
  } catch (err) {
    next(err);
  }
});

// Admin: POST /api/admin/products
router.post(
  "/admin/products",
  requireAuth,
  requireAdmin,
  async (req, res, next) => {
    try {
      const parsed = createProductSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          error: "Datos de producto no válidos",
          details: parsed.error.issues,
        });
        return;
      }
      const product = await createProduct(parsed.data);
      res.status(201).json({ product });
    } catch (err) {
      next(err);
    }
  },
);

// Admin: PATCH /api/admin/products/:id
router.patch(
  "/admin/products/:id",
  requireAuth,
  requireAdmin,
  async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id) || id <= 0) {
        res.status(400).json({ error: "ID de producto no válido" });
        return;
      }

      const parsed = updateProductSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          error: "Datos de actualización no válidos",
          details: parsed.error.issues,
        });
        return;
      }

      const updated = await updateProduct(id, parsed.data);
      if (!updated) {
        res.status(404).json({ error: "Producto no encontrado" });
        return;
      }

      res.json({ product: updated });
    } catch (err) {
      next(err);
    }
  },
);

// Admin: DELETE /api/admin/products/:id
router.delete(
  "/admin/products/:id",
  requireAuth,
  requireAdmin,
  async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id) || id <= 0) {
        res.status(400).json({ error: "ID de producto no válido" });
        return;
      }

      const deleted = await deleteProduct(id);
      if (!deleted) {
        res.status(404).json({ error: "Producto no encontrado" });
        return;
      }

      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
);

export default router;
