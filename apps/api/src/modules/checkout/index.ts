import { Router, Request, Response, NextFunction } from "express";
import { CreateCheckoutSessionSchema } from "./schema";
import { createCheckoutSession, handleStripeWebhookEvent } from "./service";
import { logger } from "../../lib/logger";

const router = Router();

// POST /api/checkout/session
router.post(
  "/session",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = CreateCheckoutSessionSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: "Datos de tramitación no válidos",
          details: parsed.error.format(),
        });
      }

      const idempotencyKey = req.headers["idempotency-key"] as string | undefined;
      const user = (req as any).user;

      const result = await createCheckoutSession(
        parsed.data,
        user?.id,
        idempotencyKey,
      );

      return res.status(201).json(result);
    } catch (err) {
      return next(err);
    }
  },
);

// POST /api/checkout/webhook or POST /api/webhooks/stripe
router.post(
  ["/webhook", "/stripe"],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const signature = req.headers["stripe-signature"];
      if (!signature || typeof signature !== "string") {
        return res.status(400).json({ error: "Cabecera stripe-signature requerida" });
      }

      const rawBody = (req as any).rawBody || req.body;
      if (!Buffer.isBuffer(rawBody)) {
        return res
          .status(400)
          .json({ error: "El cuerpo de la petición debe ser el buffer crudo para verificar la firma de Stripe" });
      }

      const result = await handleStripeWebhookEvent(rawBody, signature);
      return res.status(200).json(result);
    } catch (err: unknown) {
      logger.error({ err }, "Error procesando webhook de Stripe");
      const message = err instanceof Error ? err.message : "Error de verificación de webhook";
      return res.status(400).json({ error: message });
    }
  },
);

export default router;
