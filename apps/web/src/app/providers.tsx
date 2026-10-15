import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { ReactNode } from "react";
import { CartProvider } from "@/features/cart/use-cart";
import { AuthProvider } from "@/features/auth/use-auth";
import { FavoritesProvider } from "@/features/favorites/use-favorites";
import "@/lib/i18n";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

export function Providers({ children }: { children: ReactNode }) {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <FavoritesProvider>
            <TooltipProvider>
              <CartProvider>
                {children}
                <Toaster />
              </CartProvider>
            </TooltipProvider>
          </FavoritesProvider>
        </AuthProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}
