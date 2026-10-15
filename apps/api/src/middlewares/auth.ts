import type { Request, Response, NextFunction } from "express";
import { userFromSession, type UserRecord } from "../lib/auth-store";

export const SESSION_COOKIE_NAME = "amal_session";

declare global {
  namespace Express {
    interface Request {
      user?: UserRecord;
    }
  }
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const token = req.cookies?.[SESSION_COOKIE_NAME];
  if (!token || typeof token !== "string") {
    res.status(401).json({ error: "No autenticado" });
    return;
  }

  try {
    const user = await userFromSession(token);
    if (!user) {
      res.status(401).json({ error: "Sesión inválida o expirada" });
      return;
    }
    req.user = user;
    next();
  } catch (err) {
    req.log.error({ err }, "Error validating session token");
    res.status(500).json({ error: "Error al validar la sesión" });
  }
}

export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!req.user) {
    res.status(401).json({ error: "No autenticado" });
    return;
  }
  if (req.user.role !== "admin") {
    res.status(403).json({ error: "Acceso no autorizado" });
    return;
  }
  next();
}
