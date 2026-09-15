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
  const { data, error } = await getSupabase()
    .from("amal_users")
    .select("id,name,email,password_hash,role,created_at")
    .eq("email", normalizedEmail)
    .maybeSingle();
  if (error) throw error;
  return data ? fromSupabaseUser(data as SupabaseUser) : undefined;
}

export async function createUser(
  name: string,
  email: string,
  password: string,
) {
  const authUser = await getSupabase().auth.admin.createUser({
    email: email.toLowerCase(),
    password,
    email_confirm: true,
    user_metadata: { name },
  });
  if (authUser.error) throw authUser.error;

  const user: UserRecord = {
    id: authUser.data.user.id,
    name,
    email: email.toLowerCase(),
    passwordHash: null,
    role: "customer",
    createdAt: new Date().toISOString(),
  };
  const { error } = await getSupabase().from("amal_users").insert({
    id: user.id,
    name: user.name,
    email: user.email,
    password_hash: null,
    role: user.role,
    created_at: user.createdAt,
  });
  if (error) throw error;
  return user;
}

export async function authenticateUser(email: string, password: string) {
  const { data, error } = await getSupabase().auth.signInWithPassword({
    email: email.toLowerCase(),
    password,
  });
  if (error || !data.user) return undefined;
  return findUserByEmail(data.user.email ?? email);
}

export async function ensureAdmin() {
  const email = (process.env.ADMIN_EMAIL || "admin@amal.local").toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "admin1234";
  const existing = await findUserByEmail(email);
  if (existing?.role === "admin") return;
  const authUser = await getSupabase().auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name: "Amal Admin" },
  });
  if (authUser.error) throw authUser.error;
  const { error } = await getSupabase().from("amal_users").upsert(
    {
      id: authUser.data.user.id,
      name: "Amal Admin",
      email,
      password_hash: null,
      role: "admin",
      created_at: new Date().toISOString(),
    },
    { onConflict: "email" },
  );
  if (error) throw error;
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + sessionLifetime);
  const { error } = await getSupabase()
    .from("amal_sessions")
    .insert({ token, user_id: userId, expires_at: expiresAt.toISOString() });
  if (error) throw error;
  return token;
}

export async function userFromSession(token?: string) {
  if (!token) return undefined;
  const { data: session, error } = await getSupabase()
    .from("amal_sessions")
    .select("user_id")
    .eq("token", token)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();
  if (error) throw error;
  if (!session) return undefined;
  const { data: user, error: userError } = await getSupabase()
    .from("amal_users")
    .select("id,name,email,password_hash,role,created_at")
    .eq("id", (session as SupabaseSession).user_id)
    .maybeSingle();
  if (userError) throw userError;
  return user ? fromSupabaseUser(user as SupabaseUser) : undefined;
}

export async function deleteSession(token?: string) {
  if (!token) return;
  const { error } = await getSupabase()
    .from("amal_sessions")
    .delete()
    .eq("token", token);
  if (error) throw error;
}
