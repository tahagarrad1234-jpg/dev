import { randomBytes, createHash } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { config } from "../config";
import { logger } from "./logger";

export type UserRole = "customer" | "admin";

export type UserRecord = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
};

export type PublicUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

type SupabaseUserRow = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  created_at: string;
};

type SupabaseSessionRow = {
  user_id: string;
};

export const SESSION_LIFETIME_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

export const supabase: SupabaseClient = createClient(
  config.SUPABASE_URL,
  config.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: { autoRefreshToken: false, persistSession: false },
  },
);

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function fromSupabaseUser(user: SupabaseUserRow): UserRecord {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.created_at,
  };
}

export function publicUser(user: UserRecord): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  const normalizedEmail = email.toLowerCase().trim();
  const { data, error } = await supabase
    .from("amal_users")
    .select("id, name, email, role, created_at")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (error) {
    logger.error({ err: error, email: normalizedEmail }, "findUserByEmail database error");
    throw error;
  }

  if (!data) return null;
  return fromSupabaseUser(data as SupabaseUserRow);
}

export async function createUser(
  name: string,
  email: string,
  password: string,
): Promise<UserRecord> {
  const normalizedEmail = email.toLowerCase().trim();

  // Create user in Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: normalizedEmail,
    password,
    email_confirm: true,
    user_metadata: { name },
  });

  if (authError || !authData.user) {
    logger.error({ err: authError, email: normalizedEmail }, "Supabase auth.admin.createUser failed");
    throw authError || new Error("Error al crear usuario en Supabase Auth");
  }

  const userId = authData.user.id;
  const createdAt = new Date().toISOString();

  // Insert profile record into amal_users
  const { data: userData, error: insertError } = await supabase
    .from("amal_users")
    .insert({
      id: userId,
      name,
      email: normalizedEmail,
      role: "customer",
      created_at: createdAt,
    })
    .select("id, name, email, role, created_at")
    .single();

  if (insertError || !userData) {
    logger.error({ err: insertError, userId }, "Failed to insert user into amal_users table");
    // Roll back auth user to maintain consistency
    await supabase.auth.admin.deleteUser(userId).catch((delErr) => {
      logger.error({ err: delErr, userId }, "Failed to delete orphaned auth user during rollback");
    });
    throw insertError || new Error("Error al guardar perfil de usuario");
  }

  return fromSupabaseUser(userData as SupabaseUserRow);
}

export async function authenticateUser(
  email: string,
  password: string,
): Promise<UserRecord | null> {
  const normalizedEmail = email.toLowerCase().trim();

  // Verify credentials exclusively using Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: normalizedEmail,
    password,
  });

  if (authError || !authData.user) {
    return null;
  }

  const userId = authData.user.id;
  const { data: userData, error: userError } = await supabase
    .from("amal_users")
    .select("id, name, email, role, created_at")
    .eq("id", userId)
    .maybeSingle();

  if (userError) {
    logger.error({ err: userError, userId }, "Failed to fetch user profile after auth");
    throw userError;
  }

  if (!userData) {
    // Backfill user profile if missing in amal_users
    const name =
      (authData.user.user_metadata?.name as string) ||
      normalizedEmail.split("@")[0] ||
      "Usuario";
    const { data: newRow, error: insertError } = await supabase
      .from("amal_users")
      .insert({
        id: userId,
        name,
        email: normalizedEmail,
        role: "customer",
      })
      .select("id, name, email, role, created_at")
      .single();

    if (insertError || !newRow) {
      logger.error({ err: insertError, userId }, "Failed to backfill missing amal_users profile");
      throw insertError || new Error("Error al inicializar perfil de usuario");
    }
    return fromSupabaseUser(newRow as SupabaseUserRow);
  }

  return fromSupabaseUser(userData as SupabaseUserRow);
}

export async function createSession(userId: string): Promise<string> {
  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + SESSION_LIFETIME_MS).toISOString();

  const { error } = await supabase.from("amal_sessions").insert({
    token_hash: tokenHash,
    user_id: userId,
    expires_at: expiresAt,
  });

  if (error) {
    logger.error({ err: error, userId }, "Failed to create session in amal_sessions");
    throw error;
  }

  return rawToken;
}

export async function userFromSession(rawToken?: string): Promise<UserRecord | null> {
  if (!rawToken || typeof rawToken !== "string") return null;

  const tokenHash = hashToken(rawToken);
  const now = new Date().toISOString();

  const { data: session, error: sessionError } = await supabase
    .from("amal_sessions")
    .select("user_id")
    .eq("token_hash", tokenHash)
    .gt("expires_at", now)
    .maybeSingle();

  if (sessionError) {
    logger.error({ err: sessionError }, "Error querying amal_sessions");
    throw sessionError;
  }

  if (!session) return null;

  const { data: user, error: userError } = await supabase
    .from("amal_users")
    .select("id, name, email, role, created_at")
    .eq("id", (session as SupabaseSessionRow).user_id)
    .maybeSingle();

  if (userError) {
    logger.error({ err: userError, userId: (session as SupabaseSessionRow).user_id }, "Error querying user from session");
    throw userError;
  }

  if (!user) return null;
  return fromSupabaseUser(user as SupabaseUserRow);
}

export async function deleteSession(rawToken?: string): Promise<void> {
  if (!rawToken || typeof rawToken !== "string") return;

  const tokenHash = hashToken(rawToken);
  const { error } = await supabase
    .from("amal_sessions")
    .delete()
    .eq("token_hash", tokenHash);

  if (error) {
    logger.error({ err: error }, "Failed to delete session");
    throw error;
  }
}

export async function deleteExpiredSessions(): Promise<void> {
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("amal_sessions")
    .delete()
    .lte("expires_at", now);

  if (error) {
    logger.error({ err: error }, "Failed to clean up expired sessions");
  }
}

// Periodic cleanup of expired sessions every 1 hour (unref'd to allow clean process exit)
const CLEANUP_INTERVAL_MS = 1000 * 60 * 60;
const cleanupTimer = setInterval(() => {
  deleteExpiredSessions().catch((err) => {
    logger.error({ err }, "Periodic session cleanup error");
  });
}, CLEANUP_INTERVAL_MS);
cleanupTimer.unref();
