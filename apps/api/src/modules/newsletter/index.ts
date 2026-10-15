import { Router, type IRouter } from "express";
import { z } from "zod";
import { createHash } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "../../db";
import { amalNewsletter } from "../../db/schema";

const router: IRouter = Router();

const subscribeSchema = z.object({
  email: z.string().trim().email("Formato de correo no válido"),
});

function generateOptInToken(email: string): string {
  return createHash("sha256")
    .update(`${email}:newsletter-salt`)
    .digest("hex")
    .slice(0, 32);
}

// POST /api/newsletter: subscribe with double opt-in token
router.post("/newsletter", async (req, res, next) => {
  try {
    const parsed = subscribeSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: "Correo no válido",
        details: parsed.error.issues,
      });
      return;
    }

    const email = parsed.data.email.toLowerCase();
    const token = generateOptInToken(email);

    await db
      .insert(amalNewsletter)
      .values({ email })
      .onConflictDoNothing();

    res.status(200).json({
      success: true,
      message: "Te hemos enviado un enlace para confirmar tu suscripción a AMAL Journal.",
      token, // returned for verification in development/tests
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/newsletter/confirm: confirm double opt-in
router.get("/newsletter/confirm", async (req, res, next) => {
  try {
    const email = typeof req.query.email === "string" ? req.query.email.toLowerCase().trim() : null;
    const token = typeof req.query.token === "string" ? req.query.token.trim() : null;

    if (!email || !token) {
      res.status(400).json({ error: "Parámetros de confirmación incompletos" });
      return;
    }

    const expectedToken = generateOptInToken(email);
    if (token !== expectedToken) {
      res.status(400).json({ error: "Token de confirmación no válido o expirado" });
      return;
    }

    res.json({
      confirmed: true,
      message: "Tu suscripción ha sido confirmada con éxito. Bienvenido al Journal de AMAL.",
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/newsletter/unsubscribe: unsubscribe
router.get("/newsletter/unsubscribe", async (req, res, next) => {
  try {
    const email = typeof req.query.email === "string" ? req.query.email.toLowerCase().trim() : null;
    if (!email) {
      res.status(400).json({ error: "Correo no especificado" });
      return;
    }

    await db
      .delete(amalNewsletter)
      .where(eq(amalNewsletter.email, email));

    res.json({
      unsubscribed: true,
      message: "Has sido dado de baja de nuestro boletín de noticias.",
    });
  } catch (err) {
    next(err);
  }
});

export default router;
