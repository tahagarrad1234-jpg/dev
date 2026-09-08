import { Router, type IRouter, type Response } from "express";
import { z } from "zod";
import {
  createSession,
  createUser,
  deleteSession,
  ensureAdmin,
  authenticateUser,
  findUserByEmail,
  publicUser,
  userFromSession,
} from "../lib/auth-store";

const router: IRouter = Router();
const sessionCookie = "amal_session";
const credentials = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8),
});
const registration = credentials.extend({
  name: z.string().trim().min(2).max(80),
});

async function setSession(res: Response, userId: string) {
  const token = await createSession(userId);
  res.cookie(sessionCookie, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 1000 * 60 * 60 * 24 * 7,
  });
}

router.post("/auth/register", async (req, res) => {
  const parsed = registration.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ error: "Datos de registro no validos" });
  const registrationData = parsed.data;
  try {
    if (await findUserByEmail(registrationData.email))
      return res
        .status(409)
        .json({ error: "Ya existe una cuenta con este correo" });
    const user = await createUser(
      registrationData.name,
      registrationData.email,
      registrationData.password,
    );
    await setSession(res, user.id);
    return res.status(201).json({ user: publicUser(user) });
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "PGRST205"
    )
      return res.status(503).json({
        error: "La base de datos no esta preparada. Ejecuta supabase-schema.sql.",
      });
    throw error;
  }
});

router.post("/auth/login", async (req, res) => {
  const parsed = credentials.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ error: "Correo o contrasena no validos" });
  const user = await authenticateUser(parsed.data.email, parsed.data.password);
  if (!user)
    return res.status(401).json({ error: "Correo o contrasena incorrectos" });
  await setSession(res, user.id);
  return res.json({ user: publicUser(user) });
});

router.post("/auth/admin/login", async (req, res) => {
  const parsed = credentials.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ error: "Credenciales no validas" });
  await ensureAdmin();
  const user = await findUserByEmail(parsed.data.email);
  const authenticatedUser = await authenticateUser(
    parsed.data.email,
    parsed.data.password,
  );
  if (!authenticatedUser || authenticatedUser.role !== "admin")
    return res
      .status(401)
      .json({ error: "Acceso de administrador no autorizado" });
  await setSession(res, authenticatedUser.id);
  return res.json({ user: publicUser(authenticatedUser) });
});

router.get("/auth/me", async (req, res) => {
  const user = await userFromSession(req.cookies?.[sessionCookie]);
  if (!user) return res.status(401).json({ error: "No autenticado" });
  return res.json({ user: publicUser(user) });
});

router.post("/auth/logout", async (req, res) => {
  await deleteSession(req.cookies?.[sessionCookie]);
  res.clearCookie(sessionCookie);
  return res.status(204).send();
});

export default router;
