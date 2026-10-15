import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { useAuth } from "@/features/auth/use-auth";

const FAVORITES_STORAGE_KEY = "amal_favorites";

interface FavoritesContextType {
  favoriteIds: number[];
  favoritesCount: number;
  isFavorite: (productId: number) => boolean;
  toggleFavorite: (productId: number) => void;
  refetchFavorites: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

function loadLocalFavorites(): number[] {
  try {
    const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favoriteIds, setFavoriteIds] = useState<number[]>(loadLocalFavorites);
  const { isAuthenticated } = useAuth();

  // Save to localStorage
  const saveLocal = useCallback((ids: number[]) => {
    try {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(ids));
    } catch {
      // Ignored
    }
  }, []);

  // Fetch or Sync favorites when authenticated
  const syncWithServer = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const currentLocal = loadLocalFavorites();
      const res = await fetch("/api/favorites/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productIds: currentLocal }),
      });

      if (res.ok) {
        const data = await res.json();
        const serverIds: number[] = data.ids || (data.favorites || []).map((f: any) => f.id);
        setFavoriteIds(serverIds);
        saveLocal(serverIds);
      }
    } catch {
      // Silently keep local state if offline
    }
  }, [isAuthenticated, saveLocal]);

  useEffect(() => {
    if (isAuthenticated) {
      syncWithServer();
    }
  }, [isAuthenticated, syncWithServer]);

  const toggleFavorite = useCallback(
    async (productId: number) => {
      const exists = favoriteIds.includes(productId);
      const updated = exists
        ? favoriteIds.filter((id) => id !== productId)
        : [...favoriteIds, productId];

      // Optimistic state update
      setFavoriteIds(updated);
      saveLocal(updated);

      if (isAuthenticated) {
        try {
          if (exists) {
            await fetch(`/api/favorites/${productId}`, { method: "DELETE" });
          } else {
            await fetch(`/api/favorites/${productId}`, { method: "PUT" });
          }
        } catch {
          // If server call fails, could rollback or retry
        }
      }
    },
    [favoriteIds, isAuthenticated, saveLocal],
  );

  const isFavorite = useCallback(
    (productId: number) => favoriteIds.includes(productId),
    [favoriteIds],
  );

  return (
    <FavoritesContext.Provider
      value={{
        favoriteIds,
        favoritesCount: favoriteIds.length,
        isFavorite,
        toggleFavorite,
        refetchFavorites: syncWithServer,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error("useFavorites must be used within a FavoritesProvider");
  }
  return context;
}
