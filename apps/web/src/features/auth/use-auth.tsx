import { createContext, useContext, ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { authApi, type AuthUser } from "@/lib/auth-api";

type AuthContextType = {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  adminLogin: (email: string, password: string) => Promise<AuthUser>;
  register: (name: string, email: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      try {
        const res = await authApi.me();
        return res.user;
      } catch {
        return null;
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const user = data ?? null;
  const isAuthenticated = Boolean(user);
  const isAdmin = user?.role === "admin";

  const login = async (email: string, password: string): Promise<AuthUser> => {
    const res = await authApi.login(email, password);
    queryClient.setQueryData(["auth", "me"], res.user);
    return res.user;
  };

  const adminLogin = async (email: string, password: string): Promise<AuthUser> => {
    const res = await authApi.adminLogin(email, password);
    queryClient.setQueryData(["auth", "me"], res.user);
    return res.user;
  };

  const register = async (
    name: string,
    email: string,
    password: string,
  ): Promise<AuthUser> => {
    const res = await authApi.register(name, email, password);
    queryClient.setQueryData(["auth", "me"], res.user);
    return res.user;
  };

  const logout = async (): Promise<void> => {
    try {
      await authApi.logout();
    } catch {
      // Ignored
    } finally {
      queryClient.setQueryData(["auth", "me"], null);
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      window.location.href = "/";
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        isAdmin,
        login,
        adminLogin,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
