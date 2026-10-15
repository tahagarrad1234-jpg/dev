const API_URL = import.meta.env.VITE_API_URL || "/api";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: "customer" | "admin";
};

type AuthResponse = {
  user: AuthUser;
};

async function request<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    method: body ? "POST" : "GET",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    credentials: "include",
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = (await response.json().catch(() => ({}))) as T & {
    error?: string;
  };
  if (!response.ok)
    throw new Error(data.error || "No se pudo completar la solicitud");
  return data;
}

export const authApi = {
  login: (email: string, password: string) =>
    request<AuthResponse>("/auth/login", { email, password }),
  adminLogin: (email: string, password: string) =>
    request<AuthResponse>("/auth/admin/login", { email, password }),
  register: (name: string, email: string, password: string) =>
    request<AuthResponse>("/auth/register", { name, email, password }),
  me: () => request<AuthResponse>("/auth/me"),
  logout: () => request<{ success: boolean }>("/auth/logout", {}),
};
