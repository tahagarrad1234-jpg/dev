import { randomBytes } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type UserRecord = {
  id: string;
  name: string;
  email: string;
  passwordHash: string | null;
  role: "customer" | "admin";
  createdAt: string;
};

type SupabaseUser = {
  id: string;
  name: string;
  email: string;
  password_hash: string | null;
  role: "customer" | "admin";
  created_at: string;
};

type SupabaseSession = { user_id: string };

const sessionLifetime = 1000 * 60 * 60 * 24 * 7;
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
export const supabaseEnabled = Boolean(supabaseUrl && supabaseKey);

const supabase: SupabaseClient | undefined = supabaseEnabled
  ? createClient(supabaseUrl!, supabaseKey!, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : undefined;

// In-memory fallback stores
const inMemoryUsers: Map<string, UserRecord> = new Map();
const inMemorySessions: Map<string, { userId: string; expiresAt: Date }> = new Map();

function initDefaultAdmin(): UserRecord {
  const email = (process.env.ADMIN_EMAIL || "admin@amal.local").toLowerCase();
  const admin: UserRecord = {
    id: "admin-local-1",
    name: "Amal Admin",
    email,
    passwordHash: process.env.ADMIN_PASSWORD || "admin1234",
    role: "admin",
    createdAt: new Date().toISOString(),
  };
  inMemoryUsers.set(email, admin);
  return admin;
}

initDefaultAdmin();

function getSupabase() {
  if (!supabase) {
    throw new Error(
      "Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }
  return supabase;
}

function fromSupabaseUser(user: SupabaseUser): UserRecord {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    passwordHash: user.password_hash,
    role: user.role,
    createdAt: user.created_at,
  };
}

export function publicUser(user: UserRecord) {
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

export async function findUserByEmail(email: string) {
  const normalizedEmail = email.toLowerCase();
  const local = inMemoryUsers.get(normalizedEmail);
  if (local) return local;

  if (supabase) {
    try {
      const { data, error } = await getSupabase()
        .from("amal_users")
        .select("id,name,email,password_hash,role,created_at")
        .eq("email", normalizedEmail)
        .maybeSingle();
      if (!error && data) return fromSupabaseUser(data as SupabaseUser);
    } catch {
      // Fallback
    }
  }
  return undefined;
}

export async function createUser(
  name: string,
  email: string,
  password: string,
) {
  const normalizedEmail = email.toLowerCase();
  const user: UserRecord = {
    id: "usr_" + randomBytes(8).toString("hex"),
    name,
    email: normalizedEmail,
    passwordHash: password,
    role: "customer",
    createdAt: new Date().toISOString(),
  };
  inMemoryUsers.set(normalizedEmail, user);

  if (supabase) {
    try {
      const authUser = await getSupabase().auth.admin.createUser({
        email: normalizedEmail,
        password,
        email_confirm: true,
        user_metadata: { name },
      });
      if (authUser.data?.user) {
        user.id = authUser.data.user.id;
        await getSupabase().from("amal_users").insert({
          id: user.id,
          name: user.name,
          email: user.email,
          password_hash: null,
          role: user.role,
          created_at: user.createdAt,
        });
      }
    } catch {
      // fallback
    }
  }

  return user;
}

export async function authenticateUser(email: string, password: string) {
  const normalizedEmail = email.toLowerCase();

  // 1. Direct admin check (instant)
  const adminEmail = (process.env.ADMIN_EMAIL || "admin@amal.local").toLowerCase();
  const adminPass = process.env.ADMIN_PASSWORD || "admin1234";
  if (normalizedEmail === adminEmail && password === adminPass) {
    return inMemoryUsers.get(adminEmail) || initDefaultAdmin();
  }

  // 2. In-memory check
  const localUser = inMemoryUsers.get(normalizedEmail);
  if (localUser && localUser.passwordHash === password) {
    return localUser;
  }

  // 3. Supabase check
  if (supabase) {
    try {
      const { data, error } = await getSupabase().auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });
      if (!error && data?.user) {
        const found = await findUserByEmail(data.user.email ?? normalizedEmail);
        if (found) return found;
      }
    } catch {
      // Fallback
    }
  }

  return undefined;
}

export async function ensureAdmin() {
  initDefaultAdmin();
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + sessionLifetime);

  inMemorySessions.set(token, { userId, expiresAt });

  if (supabase) {
    try {
      await getSupabase()
        .from("amal_sessions")
        .insert({ token, user_id: userId, expires_at: expiresAt.toISOString() });
    } catch {
      // fallback
    }
  }
  return token;
}

export async function userFromSession(token?: string) {
  if (!token) return undefined;

  // 1. Check in-memory session (instant)
  const memSession = inMemorySessions.get(token);
  if (memSession && memSession.expiresAt > new Date()) {
    for (const u of inMemoryUsers.values()) {
      if (u.id === memSession.userId) return u;
    }
  }

  // 2. Try Supabase
  if (supabase) {
    try {
      const { data: session, error } = await getSupabase()
        .from("amal_sessions")
        .select("user_id")
        .eq("token", token)
        .gt("expires_at", new Date().toISOString())
        .maybeSingle();
      if (!error && session) {
        const { data: user, error: userError } = await getSupabase()
          .from("amal_users")
          .select("id,name,email,password_hash,role,created_at")
          .eq("id", (session as SupabaseSession).user_id)
          .maybeSingle();
        if (!userError && user) return fromSupabaseUser(user as SupabaseUser);
      }
    } catch {
      // Fallback
    }
  }

  return undefined;
}

export async function deleteSession(token?: string) {
  if (!token) return;
  inMemorySessions.delete(token);
  if (supabase) {
    try {
      await getSupabase()
        .from("amal_sessions")
        .delete()
        .eq("token", token);
    } catch {}
  }
}
