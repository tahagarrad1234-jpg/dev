import { useState } from "react";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, ShieldCheck, Lock, ShoppingBag, CreditCard, AlertCircle, Tag, X } from "lucide-react";
import { useCart } from "@/features/cart/use-cart";
import { useAuth } from "@/features/auth/use-auth";
import { money } from "@workspace/shared";

const EU_COUNTRIES = [
  { code: "ES", name: "España", postalRegex: /^\d{5}$/, postalHint: "5 dígitos (ej. 28001)" },
  { code: "PT", name: "Portugal", postalRegex: /^\d{4}-\d{3}$/, postalHint: "Formato 0000-000" },
  { code: "FR", name: "Francia", postalRegex: /^\d{5}$/, postalHint: "5 dígitos (ej. 75001)" },
  { code: "IT", name: "Italia", postalRegex: /^\d{5}$/, postalHint: "5 dígitos (ej. 20121)" },
  { code: "DE", name: "Alemania", postalRegex: /^\d{5}$/, postalHint: "5 dígitos (ej. 10115)" },
  { code: "NL", name: "Países Bajos", postalRegex: /^\d{4}\s?[A-Z]{2}$/i, postalHint: "4 dígitos + 2 letras" },
  { code: "BE", name: "Bélgica", postalRegex: /^\d{4}$/, postalHint: "4 dígitos (ej. 1000)" },
  { code: "AT", name: "Austria", postalRegex: /^\d{4}$/, postalHint: "4 dígitos (ej. 1010)" },
  { code: "CH", name: "Suiza", postalRegex: /^\d{4}$/, postalHint: "4 dígitos (ej. 8001)" },
] as const;

const CheckoutSchema = z
  .object({
    customerName: z.string().min(2, "Introduzca su nombre y apellidos"),
    customerEmail: z.string().email("Introduzca un correo electrónico válido"),
    customerPhone: z.string().min(6, "Teléfono de contacto requerido para el transportista blindado"),
    street: z.string().min(4, "Introduzca la dirección completa de entrega"),
    city: z.string().min(2, "Introduzca la ciudad"),
    postalCode: z.string().min(3, "Introduzca el código postal"),
    country: z.string().min(2, "Seleccione un país de entrega"),
    acceptTerms: z.literal(true, {
      errorMap: () => ({
        message: "Debe aceptar las Condiciones de Venta y la Política de Privacidad para continuar",
      }),
    }),
  })
  .superRefine((data, ctx) => {
    const countryObj = EU_COUNTRIES.find(
      (c) => c.code === data.country || c.name.toLowerCase() === data.country.toLowerCase(),
    );
    if (countryObj && !countryObj.postalRegex.test(data.postalCode.trim())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["postalCode"],
        message: `Código postal no válido para ${countryObj.name} (${countryObj.postalHint})`,
      });
    }
  });

type CheckoutFormData = z.infer<typeof CheckoutSchema>;

export default function CheckoutPage() {
  const { cart, subtotal } = useCart();
  const { user } = useAuth();
  const [serverError, setServerError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(CheckoutSchema),
    defaultValues: {
      customerName: user?.name || "",
      customerEmail: user?.email || "",
      customerPhone: "+34 600 000 000",
      country: "ES",
      street: "",
      city: "",
      postalCode: "",
    },
  });

  const selectedCountry = watch("country");
  const isSpain = selectedCountry === "ES" || selectedCountry === "España";
  const shipping = subtotal >= 1000 ? 0 : 50;
  const tax = isSpain ? Math.round(subtotal * 0.21) : 0;

  // Promo code state
  const [promoInput, setPromoInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; label: string; discount: number } | null>(null);
  const [promoError, setPromoError] = useState("");

  const discount = appliedPromo ? appliedPromo.discount : 0;
  const total = Math.max(0, subtotal - discount + shipping);

  const handleApplyPromo = (e?: React.SyntheticEvent) => {
    if (e) e.preventDefault();
    setPromoError("");
    const clean = promoInput.trim().toUpperCase();
    if (!clean) return;

    if (clean === "ATELIER10") {
      const disc = Math.round(subtotal * 0.1);
      setAppliedPromo({ code: clean, label: "10% Cortesía Atelier", discount: disc });
      setPromoInput("");
    } else if (clean === "WELCOME50") {
      const disc = Math.min(50, subtotal);
      setAppliedPromo({ code: clean, label: "50 € Bienvenida", discount: disc });
      setPromoInput("");
    } else if (clean === "AMALVIP") {
      const disc = Math.round(subtotal * 0.15);
      setAppliedPromo({ code: clean, label: "15% Círculo de Coleccionistas", discount: disc });
      setPromoInput("");
    } else {
      setPromoError("Código no válido o no acumulable.");
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoError("");
  };

  const onSubmit = async (formData: CheckoutFormData) => {
    setServerError("");
    setIsSubmitting(true);

    try {
      const payload = {
        items: cart.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
        })),
        customerName: formData.customerName,
        customerEmail: formData.customerEmail,
        customerPhone: formData.customerPhone,
        shippingAddress: {
          street: formData.street,
          city: formData.city,
          postalCode: formData.postalCode,
          country: formData.country,
        },
      };

      const res = await fetch("/api/checkout/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": `idemp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "No se pudo iniciar la sesión de pago seguro.");
      }

      const data = await res.json();
      if (data.url) {
        // Redirect directly to Stripe Hosted Checkout or success page in mock mode
        window.location.href = data.url;
      } else {
        throw new Error("No se recibió la URL de pago de la pasarela bancaria.");
      }
    } catch (err: unknown) {
      setServerError(err instanceof Error ? err.message : "Error inesperado al conectar con Stripe.");
      setIsSubmitting(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="checkout-page" style={{ minHeight: "75vh", display: "grid", placeItems: "center", padding: "3rem 1.5rem" }}>
        <div style={{ textAlign: "center", maxWidth: "440px" }}>
          <ShoppingBag size={48} strokeWidth={1.2} style={{ margin: "0 auto 1.25rem", color: "var(--ink-soft, #888)" }} />
          <h2 style={{ fontFamily: "var(--font-serif, serif)", fontSize: "1.9rem", marginBottom: "0.5rem" }}>
            Su bolsa de compra está vacía
          </h2>
          <p style={{ color: "var(--ink-soft, #666)", marginBottom: "2rem" }}>
            Seleccione una pieza horológica antes de proceder a la tramitación del pago seguro.
          </p>
          <Link href="/" className="checkout-button" style={{ textDecoration: "none", display: "inline-flex", width: "auto", padding: "12px 24px" }}>
            Explorar la colección
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page" style={{ background: "var(--parchment-soft, #faf9f6)", minHeight: "100vh", padding: "2.5rem 1.5rem 6rem" }}>
      <div style={{ maxWidth: "1140px", margin: "0 auto" }}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2.5rem", borderBottom: "1px solid var(--border-soft, #e8e6e1)", paddingBottom: "1.5rem" }}>
          <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", color: "var(--ink-deep, #1a1a1a)", textDecoration: "none", fontSize: "1.25rem", fontFamily: "var(--font-serif, serif)", fontWeight: 600 }}>
            <ArrowLeft size={16} /> AMAL ATELIER
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", color: "var(--ink-soft, #666)" }}>
            <Lock size={15} color="#2e7d32" />
            <span>Pasarela Bancaria Segura Stripe (SSL 256-bit)</span>
          </div>
        </header>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "3rem", alignItems: "start" }}>
          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} style={{ background: "#fff", padding: "2.5rem", borderRadius: "8px", border: "1px solid var(--border-soft, #e8e6e1)", boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
              <span style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--gold-deep, #9c7a36)", fontWeight: 600 }}>
                PASO 1 DE 2 · DESTINO DE ENVÍO
              </span>
            </div>
            <h2 style={{ fontFamily: "var(--font-serif, serif)", fontSize: "1.6rem", marginBottom: "1.5rem" }}>
              Datos del Destinatario y Facturación
            </h2>

            {serverError && (
              <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", padding: "0.85rem 1.25rem", background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", borderRadius: "4px", marginBottom: "1.5rem", fontSize: "0.9rem" }}>
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <span>{serverError}</span>
              </div>
            )}

            <div style={{ display: "grid", gap: "1.25rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <label style={{ display: "grid", gap: "0.4rem", fontSize: "0.85rem" }}>
                  <span>Nombre y Apellidos *</span>
                  <input
                    {...register("customerName")}
                    style={{ padding: "0.75rem", border: `1px solid ${errors.customerName ? "#dc2626" : "#d1d5db"}`, borderRadius: "4px" }}
                    placeholder="Ej. Rodrigo de la Serna"
                  />
                  {errors.customerName && <small style={{ color: "#dc2626" }}>{errors.customerName.message}</small>}
                </label>

                <label style={{ display: "grid", gap: "0.4rem", fontSize: "0.85rem" }}>
                  <span>Correo electrónico *</span>
                  <input
                    type="email"
                    {...register("customerEmail")}
                    style={{ padding: "0.75rem", border: `1px solid ${errors.customerEmail ? "#dc2626" : "#d1d5db"}`, borderRadius: "4px" }}
                    placeholder="rodrigo@ejemplo.es"
                  />
                  {errors.customerEmail && <small style={{ color: "#dc2626" }}>{errors.customerEmail.message}</small>}
                </label>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <label style={{ display: "grid", gap: "0.4rem", fontSize: "0.85rem" }}>
                  <span>Teléfono de contacto *</span>
                  <input
                    {...register("customerPhone")}
                    style={{ padding: "0.75rem", border: `1px solid ${errors.customerPhone ? "#dc2626" : "#d1d5db"}`, borderRadius: "4px" }}
                    placeholder="+34 600 000 000"
                  />
                  {errors.customerPhone && <small style={{ color: "#dc2626" }}>{errors.customerPhone.message}</small>}
                </label>

                <label style={{ display: "grid", gap: "0.4rem", fontSize: "0.85rem" }}>
                  <span>País de entrega (Unión Europea) *</span>
                  <select
                    {...register("country")}
                    style={{ padding: "0.75rem", border: `1px solid ${errors.country ? "#dc2626" : "#d1d5db"}`, borderRadius: "4px", background: "#fff" }}
                  >
                    {EU_COUNTRIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  {errors.country && <small style={{ color: "#dc2626" }}>{errors.country.message}</small>}
                </label>
              </div>

              <label style={{ display: "grid", gap: "0.4rem", fontSize: "0.85rem" }}>
                <span>Dirección postal *</span>
                <input
                  {...register("street")}
                  style={{ padding: "0.75rem", border: `1px solid ${errors.street ? "#dc2626" : "#d1d5db"}`, borderRadius: "4px" }}
                  placeholder="Calle de Serrano 45, 3º Dcha"
                />
                {errors.street && <small style={{ color: "#dc2626" }}>{errors.street.message}</small>}
              </label>

              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1rem" }}>
                <label style={{ display: "grid", gap: "0.4rem", fontSize: "0.85rem" }}>
                  <span>Ciudad *</span>
                  <input
                    {...register("city")}
                    style={{ padding: "0.75rem", border: `1px solid ${errors.city ? "#dc2626" : "#d1d5db"}`, borderRadius: "4px" }}
                    placeholder="Madrid"
                  />
                  {errors.city && <small style={{ color: "#dc2626" }}>{errors.city.message}</small>}
                </label>

                <label style={{ display: "grid", gap: "0.4rem", fontSize: "0.85rem" }}>
                  <span>Código Postal *</span>
                  <input
                    {...register("postalCode")}
                    style={{ padding: "0.75rem", border: `1px solid ${errors.postalCode ? "#dc2626" : "#d1d5db"}`, borderRadius: "4px" }}
                    placeholder="28001"
                  />
                  {errors.postalCode && <small style={{ color: "#dc2626" }}>{errors.postalCode.message}</small>}
                </label>
              </div>

              <div style={{ marginTop: "1rem", padding: "1.25rem", background: "var(--parchment-soft, #f7f6f2)", borderRadius: "6px", display: "grid", gap: "0.75rem" }}>
                <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start", fontSize: "0.85rem" }}>
                  <CreditCard size={20} color="var(--gold-deep, #9c7a36)" style={{ flexShrink: 0, marginTop: "2px" }} />
                  <div>
                    <strong>Pago gestionado íntegramente por Stripe</strong>
                    <p style={{ margin: "0.2rem 0 0", color: "var(--ink-soft, #666)" }}>
                      Al hacer clic, será redirigido a la pasarela bancaria oficial de Stripe. Sus datos de tarjeta nunca tocan nuestros servidores.
                    </p>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: "1rem" }}>
                <label style={{ display: "flex", gap: "0.6rem", alignItems: "flex-start", fontSize: "0.85rem", cursor: "pointer", color: "var(--ink, #121212)" }}>
                  <input
                    type="checkbox"
                    {...register("acceptTerms")}
                    style={{ marginTop: "3px", cursor: "pointer", width: "16px", height: "16px" }}
                  />
                  <span>
                    He leído y acepto las{" "}
                    <Link href="/legal/terms" target="_blank" style={{ textDecoration: "underline", color: "var(--oxblood, #8b263e)", fontWeight: 500 }}>
                      Condiciones Generales de Venta
                    </Link>{" "}
                    y la{" "}
                    <Link href="/legal/privacy" target="_blank" style={{ textDecoration: "underline", color: "var(--oxblood, #8b263e)", fontWeight: 500 }}>
                      Política de Privacidad
                    </Link>{" "}
                    (derecho de desistimiento de 14 días y garantía de 5 años incluidos).
                  </span>
                </label>
                {errors.acceptTerms && (
                  <p style={{ color: "#dc2626", fontSize: "0.8rem", marginTop: "0.35rem" }}>
                    {errors.acceptTerms.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="checkout-button"
                style={{ width: "100%", padding: "1.1rem", marginTop: "1rem", display: "flex", justifyContent: "center", alignItems: "center", gap: "0.5rem", cursor: isSubmitting ? "wait" : "pointer" }}
              >
                <Lock size={16} />
                <span>
                  {isSubmitting
                    ? "Iniciando pasarela de pago segura..."
                    : `Proceder al pago seguro con Stripe (${money(total)})`}
                </span>
              </button>
            </div>
          </form>

          {/* Order Summary */}
          <aside style={{ background: "#fff", padding: "2rem", borderRadius: "8px", border: "1px solid var(--border-soft, #e8e6e1)", boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
            <h3 style={{ fontFamily: "var(--font-serif, serif)", fontSize: "1.35rem", marginBottom: "1.5rem" }}>
              Resumen de la Orden ({cart.length})
            </h3>

            <div style={{ display: "grid", gap: "1rem", maxHeight: "360px", overflowY: "auto", marginBottom: "1.5rem", paddingRight: "0.5rem" }}>
              {cart.map((item) => (
                <div key={item.id} style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                  <img src={item.image} alt={item.name} style={{ width: "64px", height: "64px", objectFit: "cover", borderRadius: "4px", border: "1px solid #eee" }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "0.75rem", color: "var(--gold-deep, #9c7a36)", textTransform: "uppercase" }}>{item.collection}</div>
                    <strong style={{ fontSize: "0.95rem", display: "block", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>{item.name}</strong>
                    <span style={{ fontSize: "0.8rem", color: "var(--ink-soft, #666)" }}>Unidades: {item.quantity}</span>
                  </div>
                  <strong style={{ fontSize: "0.95rem" }}>{money(item.price * item.quantity)}</strong>
                </div>
              ))}
            </div>

            {/* Promo Code Form */}
            <div style={{ marginBottom: "1.25rem", borderTop: "1px solid var(--border-soft, #e8e6e1)", paddingTop: "1.25rem" }}>
              {appliedPromo ? (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "0.6rem 0.8rem",
                    background: "#fdf2f4",
                    border: "1px solid #f2c2cb",
                    borderRadius: "4px",
                    fontSize: "0.85rem",
                    color: "var(--oxblood, #8b263e)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Tag size={15} />
                    <strong>{appliedPromo.code}</strong> — <span>{appliedPromo.label}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemovePromo}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#8b263e",
                      cursor: "pointer",
                      padding: "2px",
                      display: "flex",
                      alignItems: "center",
                    }}
                    title="Eliminar código"
                  >
                    <X size={15} />
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <input
                    type="text"
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleApplyPromo();
                      }
                    }}
                    placeholder="Código de cortesía (ej. ATELIER10)"
                    style={{
                      flex: 1,
                      padding: "0.6rem 0.75rem",
                      fontSize: "0.85rem",
                      border: `1px solid ${promoError ? "#dc2626" : "var(--border-soft, #d1d5db)"}`,
                      borderRadius: "4px",
                      textTransform: "uppercase",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleApplyPromo()}
                    style={{
                      padding: "0.6rem 1rem",
                      background: "var(--ink, #121212)",
                      color: "#fff",
                      border: "none",
                      borderRadius: "4px",
                      fontSize: "0.8rem",
                      letterSpacing: "0.05em",
                      textTransform: "uppercase",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Aplicar
                  </button>
                </div>
              )}
              {promoError && (
                <small style={{ color: "#dc2626", display: "block", marginTop: "0.4rem", fontSize: "0.75rem" }}>
                  {promoError}
                </small>
              )}
            </div>

            <div style={{ borderTop: "1px solid var(--border-soft, #e8e6e1)", paddingTop: "1.25rem", display: "grid", gap: "0.75rem", fontSize: "0.9rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--ink-soft, #666)" }}>Subtotal</span>
                <strong>{money(subtotal)}</strong>
              </div>
              {appliedPromo && (
                <div style={{ display: "flex", justifyContent: "space-between", color: "var(--oxblood, #8b263e)" }}>
                  <span>Descuento ({appliedPromo.code})</span>
                  <strong>-{money(discount)}</strong>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--ink-soft, #666)" }}>Envío Privado Blindado</span>
                <strong style={{ color: "#2e7d32" }}>
                  {shipping === 0 ? "Gratuito (Cortesía)" : money(shipping)}
                </strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--ink-soft, #666)" }}>IVA (21% desglosado incluido)</span>
                <span>{money(tax)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderTop: "2px solid #1a1a1a", paddingTop: "1rem", fontSize: "1.25rem" }}>
                <strong>Total a pagar</strong>
                <strong>{money(total)}</strong>
              </div>
            </div>

            <div style={{ marginTop: "1.5rem", padding: "1rem", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "4px", display: "flex", gap: "0.6rem", alignItems: "flex-start", fontSize: "0.8rem", color: "#166534" }}>
              <ShieldCheck size={18} style={{ flexShrink: 0, marginTop: "1px" }} />
              <span>Garantía Oficial de 5 años y devolución sin compromiso durante 30 días naturales.</span>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
