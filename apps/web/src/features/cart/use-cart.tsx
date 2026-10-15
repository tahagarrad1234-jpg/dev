import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import type { CartItem, Product } from "@workspace/shared";

const CART_STORAGE_KEY = "amal_cart_v1";

type CartContextType = {
  cart: CartItem[];
  cartCount: number;
  subtotal: number;
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  addToCart: (product: Product, quantity?: number) => void;
  changeQuantity: (id: number, delta: number) => void;
  removeFromCart: (id: number) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

function loadCartFromStorage(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>(loadCartFromStorage);
  const [cartOpen, setCartOpen] = useState(false);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // Ignored
    }
  }, [cart]);

  // Re-validate cart items against the API on load
  useEffect(() => {
    if (cart.length === 0) return;

    fetch("/api/products?pageSize=100")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data?.items) return;
        const liveProducts = new Map<number, Product>();
        for (const p of data.items) {
          liveProducts.set(p.id, p);
        }

        setCart((current) => {
          let hasChanged = false;
          const updated = current.flatMap((item) => {
            const live = liveProducts.get(item.id);
            if (!live) return [item]; // Keep if offline

            // Check if price or stock changed
            const maxQty = live.stock !== undefined ? Math.min(item.quantity, live.stock) : item.quantity;
            if (live.price !== item.price || maxQty !== item.quantity) {
              hasChanged = true;
              return [{ ...live, quantity: Math.max(1, maxQty) }];
            }
            return [item];
          });
          return hasChanged ? updated : current;
        });
      })
      .catch(() => {
        // Fallback gracefully on network error
      });
  }, []);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  const addToCart = (product: Product, quantity = 1) => {
    setCart((current) => {
      const existing = current.find((item) => item.id === product.id);
      if (existing) {
        return current.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item,
        );
      }
      return [...current, { ...product, quantity }];
    });
    setCartOpen(true);
  };

  const changeQuantity = (id: number, delta: number) => {
    setCart((current) =>
      current.flatMap((item) => {
        if (item.id === id) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? [{ ...item, quantity: newQty }] : [];
        }
        return [item];
      }),
    );
  };

  const removeFromCart = (id: number) => {
    setCart((current) => current.filter((item) => item.id !== id));
  };

  const clearCart = () => {
    setCart([]);
    try {
      localStorage.removeItem(CART_STORAGE_KEY);
    } catch {}
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        cartCount,
        subtotal,
        cartOpen,
        setCartOpen,
        addToCart,
        changeQuantity,
        removeFromCart,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
