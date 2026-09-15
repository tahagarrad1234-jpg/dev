import { useState } from "react";
import { ArrowUpRight, Check, ChevronLeft, LockKeyhole, CreditCard } from "lucide-react";
import { CartItem, money } from "@/lib/data";

type CheckoutProps = {
  items: CartItem[];
  subtotal: number;
  onBack: () => void;
  onComplete: () => void;
};

export default function Checkout({ items, subtotal, onBack, onComplete }: CheckoutProps) {
  const [payment, setPayment] = useState("card");
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <main className="checkout-page checkout-complete">
        <div className="checkout-complete-mark">
          <Check size={28} />
        </div>
        <span className="checkout-kicker">PEDIDO RECIBIDO / AMAL 001</span>
        <h1>
          Gracias por
          <br />
          <em>elegir bien.</em>
        </h1>
        <p>
          Tu pedido esta confirmado. Te enviaremos un aviso cuando tu pieza
          salga del atelier.
        </p>
        <button className="checkout-primary" onClick={onComplete}>
          Volver a la coleccion <ArrowUpRight size={16} />
        </button>
      </main>
    );
  }

  return (
    <main className="checkout-page">
      <header className="checkout-header">
        <button className="checkout-back" onClick={onBack}>
          <ChevronLeft size={17} /> Volver a tu bolsa
        </button>
        <a href="#top" className="wordmark">
          <span>A</span> AMAL
        </a>
        <span className="checkout-secure">
          <LockKeyhole size={13} /> Compra segura
        </span>
      </header>
      <div className="checkout-layout">
        <section className="checkout-form-wrap">
          <div className="checkout-intro">
            <span className="checkout-kicker">EL ULTIMO DETALLE</span>
            <h1>
              Completa tu
              <br />
              <em>pedido.</em>
            </h1>
            <p>
              Mantenemos el ultimo paso sencillo. Tu reloj sera revisado,
              envuelto y asegurado durante el envio.
            </p>
          </div>
          <form
            className="checkout-form"
            onSubmit={(event) => {
              event.preventDefault();
              setSubmitted(true);
            }}
          >
            <div className="checkout-section-title">
              <span>01</span>
              <h2>Datos de contacto</h2>
            </div>
            <div className="form-grid">
              <label>
                Correo electronico
                <input
                  type="email"
                  name="email"
                  placeholder="tu@ejemplo.com"
                  required
                />
              </label>
              <label>
                Numero de telefono
                <input
                  type="tel"
                  name="phone"
                  placeholder="+34 600 000 000"
                  required
                />
              </label>
            </div>
            <div className="checkout-section-title">
              <span>02</span>
              <h2>Direccion de envio</h2>
            </div>
            <div className="form-grid">
              <label>
                Nombre
                <input name="firstName" autoComplete="given-name" required />
              </label>
              <label>
                Apellido
                <input name="lastName" autoComplete="family-name" required />
              </label>
            </div>
            <label>
              Direccion
              <input
                name="address"
                autoComplete="street-address"
                placeholder="Calle y numero"
                required
              />
            </label>
            <div className="form-grid three">
              <label>
                Ciudad
                <input name="city" autoComplete="address-level2" required />
              </label>
              <label>
                Codigo postal
                <input name="postalCode" autoComplete="postal-code" required />
              </label>
              <label>
                Pais
                <select name="country" defaultValue="US">
                  <option value="US">Estados Unidos</option>
                  <option value="CA">Canada</option>
                  <option value="GB">Reino Unido</option>
                  <option value="CH">Suiza</option>
                  <option value="JP">Japon</option>
                </select>
              </label>
            </div>
            <div className="checkout-section-title">
              <span>03</span>
              <h2>Metodo de pago</h2>
            </div>
            <div className="payment-options">
              <label
                className={
                  payment === "card"
                    ? "payment-option selected"
                    : "payment-option"
                }
              >
                <input
                  type="radio"
                  name="payment"
                  value="card"
                  checked={payment === "card"}
                  onChange={() => setPayment("card")}
                />
                <CreditCard size={18} />
                <span>
                  <strong>Tarjeta de credito o debito</strong>
                  <small>Visa, Mastercard, American Express</small>
                </span>
              </label>
              <label
                className={
                  payment === "paypal"
                    ? "payment-option selected"
                    : "payment-option"
                }
              >
                <input
                  type="radio"
                  name="payment"
                  value="paypal"
                  checked={payment === "paypal"}
                  onChange={() => setPayment("paypal")}
                />
                <span className="paypal-mark">P</span>
                <span>
                  <strong>PayPal</strong>
                  <small>Paga de forma segura con tu cuenta PayPal</small>
                </span>
              </label>
            </div>
            {payment === "card" && (
              <div className="card-fields">
                <label>
                  Numero de tarjeta
                  <input
                    inputMode="numeric"
                    placeholder="1234  5678  9012  3456"
                    required
                  />
                </label>
                <div className="form-grid">
                  <label>
                    Fecha de caducidad
                    <input placeholder="MM / YY" required />
                  </label>
                  <label>
                    Codigo de seguridad
                    <input inputMode="numeric" placeholder="CVC" required />
                  </label>
                </div>
              </div>
            )}
            <label className="consent">
              <input type="checkbox" required />
              <span>
                Acepto las condiciones de venta y la politica de privacidad de
                AMAL.
              </span>
            </label>
            <button className="checkout-primary" type="submit">
              Confirmar pedido <span>{money(subtotal)}</span>
              <ArrowUpRight size={16} />
            </button>
          </form>
        </section>
        <aside className="checkout-summary">
          <span className="checkout-kicker">TU SELECCION</span>
          <h2>Resumen del pedido</h2>
          <div className="checkout-items">
            {items.map((item) => (
              <div className="checkout-item" key={item.id}>
                <img src={item.image} alt="" />
                <div>
                  <span>{item.collection}</span>
                  <h3>{item.name}</h3>
                  <small>Cant. {item.quantity}</small>
                </div>
                <strong>{money(item.price * item.quantity)}</strong>
              </div>
            ))}
          </div>
          <div className="summary-lines">
            <div>
              <span>Subtotal</span>
              <strong>{money(subtotal)}</strong>
            </div>
            <div>
              <span>Envio asegurado</span>
              <strong>Incluido</strong>
            </div>
            <div className="summary-total">
              <span>Total</span>
              <strong>{money(subtotal)}</strong>
            </div>
          </div>
          <p className="summary-note">
            <LockKeyhole size={13} /> Tus datos de pago estan cifrados y AMAL
            nunca los almacena.
          </p>
        </aside>
      </div>
    </main>
  );
}
