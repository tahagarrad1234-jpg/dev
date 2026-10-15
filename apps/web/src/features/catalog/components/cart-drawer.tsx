import { X, Plus, Minus, ShoppingBag, ArrowUpRight } from "lucide-react";
import { useLocation } from "wouter";
import { useCart } from "@/features/cart/use-cart";
import { money } from "@workspace/shared";

interface CartDrawerProps {
  onCheckoutDirect?: () => void;
}

export function CartDrawer({ onCheckoutDirect }: CartDrawerProps) {
  const { cart, cartCount, subtotal, cartOpen, setCartOpen, changeQuantity } = useCart();
  const [, setLocation] = useLocation();

  if (!cartOpen) return null;

  const handleCheckout = () => {
    setCartOpen(false);
    if (onCheckoutDirect) {
      onCheckoutDirect();
    } else {
      setLocation("/checkout");
    }
  };

  return (
    <div
      className="drawer-backdrop"
      onClick={() => setCartOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-label="Bolsa de compra"
    >
      <aside
        className="cart-drawer"
        onClick={(event) => event.stopPropagation()}
        aria-label="Bolsa de compra"
      >
        <div className="drawer-header">
          <div>
            <span className="drawer-kicker">TU SELECCIÓN</span>
            <h2>
              Bolsa de compra {cartCount > 0 && <small>({cartCount})</small>}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setCartOpen(false)}
            aria-label="Cerrar bolsa de compra"
            data-testid="button-close-cart"
          >
            <X size={20} strokeWidth={1.6} />
          </button>
        </div>

        {cart.length > 0 ? (
          <>
            <div className="cart-items" data-testid="cart-items-list">
              {cart.map((item) => (
                <div
                  className="cart-item"
                  key={item.id}
                  data-testid={`cart-item-${item.id}`}
                >
                  <img src={item.image} alt={item.name} />
                  <div className="cart-item-info">
                    <span>{item.collection}</span>
                    <h3>{item.name}</h3>
                    <strong>{money(item.price * item.quantity)}</strong>
                    <div className="quantity">
                      <button
                        type="button"
                        onClick={() => changeQuantity(item.id, -1)}
                        aria-label={`Reducir cantidad de ${item.name}`}
                        data-testid={`button-decrease-${item.id}`}
                      >
                        <Minus size={12} />
                      </button>
                      <span data-testid={`text-quantity-${item.id}`}>
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => changeQuantity(item.id, 1)}
                        aria-label={`Aumentar cantidad de ${item.name}`}
                        data-testid={`button-increase-${item.id}`}
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="drawer-summary">
              <div>
                <span>Subtotal</span>
                <strong data-testid="text-cart-subtotal">
                  {money(subtotal)}
                </strong>
              </div>
              <p>Envío asegurado e IVA incluidos en el precio final.</p>
              <button
                type="button"
                className="checkout-button"
                onClick={handleCheckout}
                data-testid="button-checkout"
              >
                Continuar al pago <ArrowUpRight size={16} />
              </button>
              <button
                type="button"
                className="continue-button"
                onClick={() => setCartOpen(false)}
                data-testid="button-continue-shopping"
              >
                Seguir explorando
              </button>
            </div>
          </>
        ) : (
          <div className="cart-empty">
            <div className="empty-bag">
              <ShoppingBag size={24} strokeWidth={1.3} />
            </div>
            <h3>Tu bolsa te espera.</h3>
            <p>Empieza con una pieza que despierte tu vocación.</p>
            <button
              type="button"
              className="checkout-button"
              onClick={() => setCartOpen(false)}
              data-testid="button-discover-pieces"
            >
              Descubrir la colección <ArrowUpRight size={16} />
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}
