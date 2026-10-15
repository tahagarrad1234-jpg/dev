import { useEffect } from "react";
import { Link, useSearch } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, ShieldCheck, Package, ArrowRight, Clock, AlertCircle } from "lucide-react";
import { useCart } from "@/features/cart/use-cart";
import { Header } from "@/components/layout/header";
import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { money, type Order } from "@workspace/shared";

export default function CheckoutSuccessPage() {
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  const orderId = searchParams.get("order") || "";
  const { clearCart, cartCount, setCartOpen } = useCart();

  // Clear cart upon reaching confirmed success page
  useEffect(() => {
    if (orderId) {
      clearCart();
    }
  }, [orderId, clearCart]);

  const { data, isLoading, error } = useQuery<{ order: Order }>({
    queryKey: ["order", orderId],
    queryFn: async () => {
      if (!orderId) throw new Error("Referencia de pedido no proporcionada");
      const res = await fetch(`/api/orders/${orderId}`, {
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error("No se pudo recuperar la información del pedido");
      }
      return res.json();
    },
    enabled: Boolean(orderId),
    retry: 2,
    refetchInterval: (query) => {
      // If order is still 'pending' (waiting for Stripe webhook confirmation), poll briefly
      if (query.state.data?.order?.status === "pending") {
        return 2000;
      }
      return false;
    },
  });

  const order = data?.order;

  return (
    <div className="checkout-success-page" style={{ minHeight: "100vh", background: "var(--parchment-soft, #faf9f6)" }}>
      <AnnouncementBar />
      <Header cartCount={cartCount} onOpenCart={() => setCartOpen(true)} />

      <main style={{ maxWidth: "760px", margin: "3rem auto 6rem", padding: "0 1.5rem" }}>
        {isLoading ? (
          <div style={{ textAlign: "center", padding: "5rem 1rem", background: "#fff", borderRadius: "8px", border: "1px solid var(--border-soft, #e8e6e1)" }}>
            <Clock size={40} className="spinning" style={{ margin: "0 auto 1.5rem", color: "var(--gold-deep, #9c7a36)" }} />
            <h2 style={{ fontFamily: "var(--font-serif, serif)" }}>Verificando su adquisición...</h2>
            <p style={{ color: "var(--ink-soft, #666)" }}>
              Confirmando la transacción con la pasarela bancaria segura de Stripe.
            </p>
          </div>
        ) : error || !order ? (
          <div style={{ textAlign: "center", padding: "4rem 2rem", background: "#fff", borderRadius: "8px", border: "1px solid var(--border-soft, #e8e6e1)" }}>
            <AlertCircle size={44} color="#c53030" style={{ margin: "0 auto 1.5rem" }} />
            <h2 style={{ fontFamily: "var(--font-serif, serif)" }}>Referencia de pedido no encontrada</h2>
            <p style={{ color: "var(--ink-soft, #666)", marginBottom: "2rem" }}>
              No hemos podido sincronizar los detalles del pedido solicitado. Si se realizó el cargo en su tarjeta, recibirá la confirmación por correo electrónico.
            </p>
            <Link href="/" className="hero-cta" style={{ textDecoration: "none" }}>
              Volver al inicio
            </Link>
          </div>
        ) : (
          <div style={{ background: "#fff", borderRadius: "8px", border: "1px solid var(--border-soft, #e8e6e1)", padding: "3rem 2.5rem", boxShadow: "0 8px 30px rgba(0,0,0,0.04)" }}>
            <div style={{ textAlign: "center", borderBottom: "1px solid var(--border-soft, #e8e6e1)", paddingBottom: "2rem", marginBottom: "2rem" }}>
              <CheckCircle2 size={56} color="#2e7d32" style={{ margin: "0 auto 1rem" }} />
              <span style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--gold-deep, #9c7a36)", fontWeight: 600 }}>
                TRANSACCIÓN CONFIRMADA · PAGO SEGURO
              </span>
              <h1 style={{ fontFamily: "var(--font-serif, serif)", fontSize: "2.4rem", margin: "0.5rem 0 0.5rem" }}>
                Gracias por su confianza
              </h1>
              <p style={{ color: "var(--ink-soft, #666)", margin: 0 }}>
                Pedido número <strong>#{order.id}</strong>
              </p>
            </div>

            <div style={{ display: "grid", gap: "1.5rem", marginBottom: "2rem" }}>
              <div>
                <h3 style={{ fontSize: "1.1rem", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "1rem" }}>
                  Detalle de las piezas
                </h3>
                <div style={{ display: "grid", gap: "0.75rem" }}>
                  {order.items?.map((item) => (
                    <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 0", borderBottom: "1px solid #f2f0eb" }}>
                      <div>
                        <strong>{item.productName}</strong>
                        <span style={{ fontSize: "0.85rem", color: "var(--ink-soft, #666)", display: "block" }}>
                          Cantidad: {item.quantity}
                        </span>
                      </div>
                      <strong>{money(item.unitPriceCents * item.quantity, { isCents: true })}</strong>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ background: "var(--parchment-soft, #f7f6f2)", padding: "1.25rem", borderRadius: "4px", display: "grid", gap: "0.5rem", fontSize: "0.9rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--ink-soft, #666)" }}>Subtotal</span>
                  <strong>{money(order.subtotalCents ?? 0, { isCents: true })}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--ink-soft, #666)" }}>Envío privado blindado</span>
                  <strong style={{ color: "#2e7d32" }}>
                    {order.shippingCents === 0 ? "Gratuito (Cortesía Atelier)" : money(order.shippingCents ?? 0, { isCents: true })}
                  </strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--ink-soft, #666)" }}>IVA (21% desglosado incluido)</span>
                  <span>{money(order.taxCents ?? 0, { isCents: true })}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", borderTop: "2px solid #1a1a1a", paddingTop: "0.75rem", fontSize: "1.2rem", marginTop: "0.5rem" }}>
                  <strong>Total pagado</strong>
                  <strong>{money(order.totalCents ?? 0, { isCents: true })}</strong>
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: "1.1rem", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.75rem" }}>
                  Dirección de Entrega
                </h3>
                <p style={{ margin: 0, lineHeight: 1.6, color: "var(--ink-body, #333)", fontSize: "0.95rem" }}>
                  <strong>{order.customerName}</strong><br />
                  {order.address}<br />
                  {order.postalCode} {order.city}, {order.country}<br />
                  Email de seguimiento: {order.email}
                </p>
              </div>

              <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start", padding: "1rem", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "4px" }}>
                <ShieldCheck size={22} color="#16a34a" style={{ flexShrink: 0, marginTop: "2px" }} />
                <div style={{ fontSize: "0.85rem", color: "#166534" }}>
                  <strong>Custodia blindada y certificado de autenticidad</strong>
                  <p style={{ margin: "0.25rem 0 0" }}>
                    Su paquete viajará con seguro total a todo riesgo y requerirá su documento de identidad y firma a la entrega.
                  </p>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/" className="hero-cta" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
                <span>Volver a la colección</span> <ArrowRight size={16} />
              </Link>
              <Link href="/account" className="hero-cta" style={{ background: "transparent", border: "1px solid #1a1a1a", color: "#1a1a1a", textDecoration: "none" }}>
                Ver en mi cuenta
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
