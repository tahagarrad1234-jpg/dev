import { Router, type IRouter, type Response } from "express";
import { z } from "zod";
import rateLimit from "express-rate-limit";
import { createHmac, timingSafeEqual } from "node:crypto";
import { config } from "../../config";
import {
  createSession,
  createUser,
  deleteSession,
  deleteExpiredSessions,
  authenticateUser,
  findUserByEmail,
  publicUser,
  supabase,
  SESSION_LIFETIME_MS,
} from "../../lib/auth-store";
import { sendPasswordResetEmail } from "../../lib/email";
import { requireAuth, SESSION_COOKIE_NAME } from "../../middlewares/auth";

const router: IRouter = Router();

// Strict rate limiter for auth endpoints: 10 requests / 15 minutes per IP+email
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiados intentos. Inténtelo de nuevo en 15 minutos." },
  validate: { keyGeneratorIpFallback: false },
  keyGenerator: (req) => {
    const email =
      typeof req.body?.email === "string"
        ? req.body.email.toLowerCase().trim()
        : "";
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    return `${ip}:${email}`;
  },
});

// Common passwords list rejected on signup
const COMMON_PASSWORDS = new Set([
  "1234567890",
  "12345678901",
  "123456789012",
  "password123",
  "password1234",
  "adminpassword",
  "administrator",
  "qwerty12345",
  "iloveyou123",
  "supersecret",
  "changeme123",
  "welcome1234",
  "letmein1234",
  "master12345",
]);

const passwordPolicy = z
  .string()
  .min(10, "La contraseña debe tener al menos 10 caracteres")
  .refine(
    (pwd) => !COMMON_PASSWORDS.has(pwd.toLowerCase()),
    "La contraseña es demasiado común o poco segura",
  );

const credentialsSchema = z.object({
  email: z.string().trim().email("Formato de correo no válido"),
  password: z.string().min(1, "La contraseña es obligatoria"),
});

const registrationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(80),
  email: z.string().trim().email("Formato de correo no válido"),
  password: passwordPolicy,
});

const RESET_TOKEN_LIFETIME_MS = 60 * 60 * 1000; // 1 hour

function createResetToken(userId: string, email: string): string {
  const expiresAt = Date.now() + RESET_TOKEN_LIFETIME_MS;
  const payload = `${userId}:${email.toLowerCase()}:${expiresAt}`;
  const sig = createHmac("sha256", config.SUPABASE_SERVICE_ROLE_KEY)
    .update(payload)
    .digest("hex");
  return Buffer.from(`${payload}:${sig}`).toString("base64url");
}

function verifyResetToken(token: string): { userId: string; email: string } | null {
  try {
    const raw = Buffer.from(token, "base64url").toString("utf-8");
    const parts = raw.split(":");
    if (parts.length !== 4) return null;
    const [userId, email, expiresAtStr, sig] = parts;
    const expiresAt = Number(expiresAtStr);
    if (!expiresAt || Date.now() > expiresAt) {
      return null;
    }
    const payload = `${userId}:${email}:${expiresAtStr}`;
    const expectedSig = createHmac("sha256", config.SUPABASE_SERVICE_ROLE_KEY)
      .update(payload)
      .digest("hex");

    if (
      sig.length !== expectedSig.length ||
      !timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))
    ) {
      return null;
    }

    return { userId, email };
  } catch {
    return null;
  }
}

async function setSession(res: Response, userId: string): Promise<void> {
  const token = await createSession(userId);
  res.cookie(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: config.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_LIFETIME_MS,
  });
}

router.post("/auth/register", authLimiter, async (req, res, next) => {
  const parsed = registrationSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: "Datos de registro no válidos",
      details: parsed.error.issues,
    });
    return;
  }

  const { name, email, password } = parsed.data;

  try {
    const existing = await findUserByEmail(email);
    if (existing) {
      res.status(409).json({ error: "Ya existe una cuenta con este correo" });
      return;
    }

    const user = await createUser(name, email, password);
    await setSession(res, user.id);
    res.status(201).json({ user: publicUser(user) });
  } catch (error) {
    next(error);
  }
});

router.post("/auth/login", authLimiter, async (req, res, next) => {
  const parsed = credentialsSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Correo o contraseña no válidos" });
    return;
  }

  try {
    const user = await authenticateUser(parsed.data.email, parsed.data.password);
    if (!user) {
      // Generic message to prevent user enumeration
      res.status(401).json({ error: "Correo o contraseña incorrectos" });
      return;
    }

    // Opportunistically prune expired sessions
    deleteExpiredSessions().catch(() => {});

    await setSession(res, user.id);
    res.json({ user: publicUser(user) });
  } catch (error) {
    next(error);
  }
});

router.post("/auth/admin/login", authLimiter, async (req, res, next) => {
  const parsed = credentialsSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Credenciales no válidas" });
    return;
  }

  try {
    const user = await authenticateUser(parsed.data.email, parsed.data.password);
    if (!user || user.role !== "admin") {
      // Generic message to prevent admin user enumeration
      res.status(401).json({ error: "Credenciales de administrador no válidas" });
      return;
    }

    await setSession(res, user.id);
    res.json({ user: publicUser(user) });
  } catch (error) {
    next(error);
  }
});

router.get("/auth/me", requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user!) });
});

router.post("/auth/logout", async (req, res, next) => {
  try {
    const token = req.cookies?.[SESSION_COOKIE_NAME];
    if (token) {
      await deleteSession(token).catch(() => {});
    }
    res.clearCookie(SESSION_COOKIE_NAME, { path: "/" });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.post("/auth/forgot-password", authLimiter, async (req, res, next) => {
  const schema = z.object({
    email: z.string().trim().email("Formato de correo no válido"),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Correo electrónico no válido" });
    return;
  }

  const email = parsed.data.email.toLowerCase().trim();
  try {
    const user = await findUserByEmail(email);
    let resetLink: string | undefined;

    if (user) {
      const token = createResetToken(user.id, user.email);
      resetLink = `${config.WEB_ORIGIN}/reset-password?token=${token}`;
      await sendPasswordResetEmail(user.email, user.name, resetLink);
    }

    res.json({
      success: true,
      message: "Si existe una cuenta asociada a este correo, le hemos enviado las instrucciones de restablecimiento.",
      ...(config.NODE_ENV !== "production" ? { resetLink } : {}),
    });
  } catch (error) {
    next(error);
  }
});

router.post("/auth/reset-password", authLimiter, async (req, res, next) => {
  const schema = z.object({
    token: z.string().min(1, "Token de recuperación no válido"),
    password: passwordPolicy,
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: parsed.error.issues[0]?.message || "Datos no válidos",
    });
    return;
  }

  const { token, password } = parsed.data;
  const payload = verifyResetToken(token);
  if (!payload) {
    res.status(400).json({
      error: "El enlace de recuperación es inválido o ha caducado. Por favor, solicite uno nuevo.",
    });
    return;
  }

  try {
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      payload.userId,
      { password },
    );

    if (updateError) {
      res.status(500).json({ error: "Error al actualizar la contraseña: " + updateError.message });
      return;
    }

    res.json({
      success: true,
      message: "Su contraseña ha sido actualizada con éxito. Ya puede iniciar sesión con su nueva clave.",
    });
  } catch (error) {
    next(error);
  }
});

export default router;

