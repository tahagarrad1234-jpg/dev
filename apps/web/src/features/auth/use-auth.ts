import { useEffect, useState } from "react";
import { authApi } from "@/lib/auth-api";

export function useAuth() {
  const [user, setUser] = useState<{ id: string; email: string; role: string } | null>(null);

  useEffect(() => {
    authApi.me().then((res) => {
      setUser(res.user);
    }).catch(() => {
      setUser(null);
    });
  }, []);

  const logout = () => {
    authApi.logout().then(() => {
      setUser(null);
      window.location.href = "/";
    });
  };

  return { user, logout };
}
