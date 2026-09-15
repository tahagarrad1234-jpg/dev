import { useEffect, useMemo, useState } from "react";
import {
  Heart,
  Search,
  ShoppingBag,
  X,
  Plus,
  Minus,
  ArrowUpRight,
  SlidersHorizontal,
  ChevronDown,
  Watch,
  Sparkles,
  Check,
  ChevronLeft,
  LockKeyhole,
  CreditCard,
  LayoutDashboard,
  Package,
  Users,
  Settings,
  Pencil,
  Trash2,
  PlusCircle,
  LogOut,
} from "lucide-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ErrorBoundary } from "@/components/error-boundary";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch, useLocation, Router as WouterRouter } from "wouter";
import { type ReactNode } from "react";
import LoginPage from "@/pages/login";
import RegisterPage from "@/pages/register";
import AdminLoginPage from "@/pages/admin-login";
import { authApi } from "@/lib/auth-api";
import NotFound from "@/pages/not-found";
import "@/index.css";

type Category = "All pieces" | "Dress" | "Field" | "Diver" | "Chronograph";
type Product = {
  id: number;
  name: string;
  collection: string;
  category: Exclude<Category, "All pieces">;
  price: number;
  image: string;
  tone: string;
  description: string;
};
type CartItem = Product & { quantity: number };

const queryClient = new QueryClient();

const products: Product[] = [
  {
    id: 1,
    name: "The Meridian",
    collection: "No. 01 / Automatic",
    category: "Dress",
    price: 1240,
    image:
      "https://images.pexels.com/photos/190819/pexels-photo-190819.jpeg?auto=compress&cs=tinysrgb&w=1200",
    tone: "bone",
    description:
      "A quietly proportioned automatic in brushed steel and warm ivory.",
  },
  {
    id: 2,
    name: "Aster 38",
    collection: "No. 02 / Hand-wound",
    category: "Dress",
    price: 980,
    image:
      "https://images.pexels.com/photos/277390/pexels-photo-277390.jpeg?auto=compress&cs=tinysrgb&w=1200",
    tone: "ink",
    description:
      "A slender silhouette with a midnight dial and hand-finished indices.",
  },
  {
    id: 3,
    name: "Field Note",
    collection: "No. 03 / Mechanical",
    category: "Field",
    price: 745,
    image:
      "https://images.pexels.com/photos/1697214/pexels-photo-1697214.jpeg?auto=compress&cs=tinysrgb&w=1200",
    tone: "olive",
    description:
      "Built for the long way around, with a legible dial and canvas strap.",
  },
  {
    id: 4,
    name: "The Deep 200",
    collection: "No. 04 / Diver",
    category: "Diver",
    price: 1680,
    image:
      "https://images.pexels.com/photos/364822/pexels-photo-364822.jpeg?auto=compress&cs=tinysrgb&w=1200",
    tone: "rust",
    description:
      "A disciplined tool watch with a ceramic bezel and 200m resistance.",
  },
  {
    id: 5,
    name: "Civic Timer",
    collection: "No. 05 / Chronograph",
    category: "Chronograph",
    price: 1890,
    image:
      "https://images.pexels.com/photos/47856/rolex-watch-time-luxury-47856.jpeg?auto=compress&cs=tinysrgb&w=1200",
    tone: "sand",
    description:
      "A measured chronograph for days that deserve to be remembered.",
  },
  {
    id: 6,
    name: "Solstice 34",
    collection: "No. 06 / Quartz",
    category: "Dress",
    price: 590,
    image:
      "https://images.pexels.com/photos/280250/pexels-photo-280250.jpeg?auto=compress&cs=tinysrgb&w=1200",
    tone: "blue",
    description: "A compact everyday companion with a sun-washed blue dial.",
  },
];

const money = (value: number) =>
  `$${value.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

type CheckoutProps = {
  items: CartItem[];
  subtotal: number;
  onBack: () => void;
  onComplete: () => void;
};

function Checkout({ items, subtotal, onBack, onComplete }: CheckoutProps) {
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

type AdminOrder = {
  id: string;
  customer: string;
  item: string;
  total: number;
  status: "Pago" | "Preparando" | "Enviado";
  date: string;
};

const initialOrders: AdminOrder[] = [
  {
    id: "AM-1048",
    customer: "Sofia Martin",
    item: "The Meridian",
    total: 1240,
    status: "Pago",
    date: "Hoy, 10:42",
  },
  {
    id: "AM-1047",
    customer: "Lucas Bernard",
    item: "The Deep 200",
    total: 1680,
    status: "Preparando",
    date: "Ayer, 16:18",
  },
  {
    id: "AM-1046",
    customer: "Elena Rossi",
    item: "Aster 38 + correa",
    total: 1035,
    status: "Enviado",
    date: "Ayer, 09:12",
  },
  {
    id: "AM-1045",
    customer: "Daniel Kim",
    item: "Field Note",
    total: 745,
    status: "Pago",
    date: "12 Jun, 14:06",
  },
];

function AdminPanel() {
  const [activeView, setActiveView] = useState("Resumen");
  const [catalog, setCatalog] = useState<Product[]>(products);
  const [orders, setOrders] = useState<AdminOrder[]>(initialOrders);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");

  const announceAdmin = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2200);
  };
  const updateProduct = (
    id: number,
    field: "name" | "price" | "category",
    value: string,
  ) => {
    setCatalog((current) =>
      current.map((product) =>
        product.id === id
          ? ({
              ...product,
              [field]: field === "price" ? Number(value) || 0 : value,
            } as Product)
          : product,
      ),
    );
  };
  const removeProduct = (id: number) => {
    setCatalog((current) => current.filter((product) => product.id !== id));
    announceAdmin("Producto eliminado del catalogo");
  };
  const filteredCatalog = catalog.filter((product) =>
    `${product.name} ${product.collection} ${product.category}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  const revenue = orders.reduce((total, order) => total + order.total, 0);

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <a className="admin-brand" href="#/">
          <span>A</span>
          <div>
            AMAL <small>ADMIN</small>
          </div>
        </a>
        <div className="admin-profile">
          <div className="admin-avatar">AM</div>
          <div>
            <strong>Amal Manager</strong>
            <small>Administrador</small>
          </div>
        </div>
        <nav className="admin-nav" aria-label="Navegacion de administracion">
          {[
            { label: "Resumen", icon: LayoutDashboard },
            { label: "Pedidos", icon: Package },
            { label: "Catalogo", icon: Watch },
            { label: "Clientes", icon: Users },
            { label: "Ajustes", icon: Settings },
          ].map(({ label, icon: Icon }) => (
            <button
              key={label}
              className={activeView === label ? "active" : ""}
              onClick={() => setActiveView(label)}
            >
              <Icon size={17} />
              {label}
            </button>
          ))}
        </nav>
        <a className="admin-exit" href="#/">
          <LogOut size={16} /> Volver a la tienda
        </a>
      </aside>
      <main className="admin-main">
        <header className="admin-header">
          <div>
            <span className="admin-eyebrow">AMAL / ESPACIO DE TRABAJO</span>
            <h1>{activeView}</h1>
          </div>
          <div className="admin-header-actions">
            <span className="admin-live">
              <i /> Tienda activa
            </span>
            <a href="#/" className="admin-store-link">
              Ver tienda <ArrowUpRight size={15} />
            </a>
          </div>
        </header>
        {activeView === "Resumen" && (
          <section className="admin-content">
            <div className="admin-welcome">
              <div>
                <span className="admin-eyebrow">MARTES, 18 DE JUNIO</span>
                <h2>Buenos dias, Amal.</h2>
                <p>Aqui tienes lo que esta pasando con tu tienda hoy.</p>
              </div>
              <button
                className="admin-primary"
                onClick={() => setActiveView("Catalogo")}
              >
                <PlusCircle size={16} /> Nuevo producto
              </button>
            </div>
            <div className="admin-stat-grid">
              <div className="admin-stat">
                <span>Ventas este mes</span>
                <strong>{money(revenue)}</strong>
                <small className="positive">+18.4% vs. mes anterior</small>
              </div>
              <div className="admin-stat">
                <span>Pedidos</span>
                <strong>{orders.length}</strong>
                <small className="positive">+6 esta semana</small>
              </div>
              <div className="admin-stat">
                <span>Clientes activos</span>
                <strong>286</strong>
                <small className="positive">+12.8% este mes</small>
              </div>
              <div className="admin-stat">
                <span>Valor medio</span>
                <strong>{money(Math.round(revenue / orders.length))}</strong>
                <small>Por pedido</small>
              </div>
            </div>
            <div className="admin-two-columns">
              <section className="admin-card">
                <div className="admin-card-heading">
                  <div>
                    <span className="admin-eyebrow">ACTIVIDAD RECIENTE</span>
                    <h3>Ultimos pedidos</h3>
                  </div>
                  <button onClick={() => setActiveView("Pedidos")}>
                    Ver todos <ArrowUpRight size={14} />
                  </button>
                </div>
                <AdminOrderTable orders={orders.slice(0, 3)} />
              </section>
              <section className="admin-card inventory-card">
                <div className="admin-card-heading">
                  <div>
                    <span className="admin-eyebrow">INVENTARIO</span>
                    <h3>Estado del catalogo</h3>
                  </div>
                  <button onClick={() => setActiveView("Catalogo")}>
                    Gestionar <ArrowUpRight size={14} />
                  </button>
                </div>
                <div className="inventory-line">
                  <span>Productos publicados</span>
                  <strong>{catalog.length}</strong>
                  <div>
                    <i style={{ width: "100%" }} />
                  </div>
                </div>
                <div className="inventory-line">
                  <span>Stock disponible</span>
                  <strong>42</strong>
                  <div>
                    <i className="gold" style={{ width: "68%" }} />
                  </div>
                </div>
                <div className="inventory-line">
                  <span>Stock bajo</span>
                  <strong className="warning">3</strong>
                  <div>
                    <i className="red" style={{ width: "18%" }} />
                  </div>
                </div>
              </section>
            </div>
          </section>
        )}
        {activeView === "Pedidos" && (
          <section className="admin-content">
            <div className="admin-page-intro">
              <div>
                <span className="admin-eyebrow">OPERACIONES</span>
                <h2>Todos los pedidos</h2>
                <p>
                  Revisa pagos, prepara envios y actualiza el estado de cada
                  compra.
                </p>
              </div>
              <button
                className="admin-secondary"
                onClick={() => announceAdmin("Exportacion preparada")}
              >
                Exportar CSV
              </button>
            </div>
            <div className="admin-toolbar">
              <div className="admin-search">
                <Search size={16} />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar por pedido o cliente"
                />
              </div>
              <select aria-label="Filtrar pedidos">
                <option>Todos los estados</option>
                <option>Pago</option>
                <option>Preparando</option>
                <option>Enviado</option>
              </select>
            </div>
            <section className="admin-card admin-table-card">
              <AdminOrderTable
                orders={orders.filter((order) =>
                  `${order.id} ${order.customer} ${order.item}`
                    .toLowerCase()
                    .includes(search.toLowerCase()),
                )}
                editable
                onStatusChange={(id, status) =>
                  setOrders((current) =>
                    current.map((order) =>
                      order.id === id ? { ...order, status } : order,
                    ),
                  )
                }
              />
            </section>
          </section>
        )}
        {activeView === "Catalogo" && (
          <section className="admin-content">
            <div className="admin-page-intro">
              <div>
                <span className="admin-eyebrow">PRODUCTOS</span>
                <h2>Tu catalogo</h2>
                <p>Edita precios, nombres y categorias desde un solo lugar.</p>
              </div>
              <button
                className="admin-primary"
                onClick={() =>
                  announceAdmin("Formulario de nuevo producto listo")
                }
              >
                <PlusCircle size={16} /> Nuevo producto
              </button>
            </div>
            <div className="admin-toolbar">
              <div className="admin-search">
                <Search size={16} />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar un producto"
                />
              </div>
              <span className="catalog-count">{catalog.length} productos</span>
            </div>
            <section className="admin-card catalog-table">
              {filteredCatalog.map((product) => (
                <div className="catalog-row" key={product.id}>
                  <img src={product.image} alt="" />
                  <div className="catalog-product">
                    <strong>
                      {editingId === product.id ? (
                        <input
                          value={product.name}
                          onChange={(event) =>
                            updateProduct(
                              product.id,
                              "name",
                              event.target.value,
                            )
                          }
                        />
                      ) : (
                        product.name
                      )}
                    </strong>
                    <small>{product.collection}</small>
                  </div>
                  <div className="catalog-category">
                    {editingId === product.id ? (
                      <select
                        value={product.category}
                        onChange={(event) =>
                          updateProduct(
                            product.id,
                            "category",
                            event.target.value,
                          )
                        }
                      >
                        <option>Dress</option>
                        <option>Field</option>
                        <option>Diver</option>
                        <option>Chronograph</option>
                      </select>
                    ) : (
                      product.category
                    )}
                  </div>
                  <div className="catalog-price">
                    {editingId === product.id ? (
                      <input
                        type="number"
                        value={product.price}
                        onChange={(event) =>
                          updateProduct(product.id, "price", event.target.value)
                        }
                      />
                    ) : (
                      money(product.price)
                    )}
                  </div>
                  <div className="catalog-actions">
                    {editingId === product.id ? (
                      <button
                        onClick={() => {
                          setEditingId(null);
                          announceAdmin("Producto guardado");
                        }}
                      >
                        Guardar
                      </button>
                    ) : (
                      <button
                        aria-label={`Editar ${product.name}`}
                        onClick={() => setEditingId(product.id)}
                      >
                        <Pencil size={15} />
                      </button>
                    )}
                    <button
                      aria-label={`Eliminar ${product.name}`}
                      onClick={() => removeProduct(product.id)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </section>
          </section>
        )}
        {activeView === "Clientes" && (
          <section className="admin-content">
            <div className="admin-page-intro">
              <div>
                <span className="admin-eyebrow">RELACIONES</span>
                <h2>Clientes</h2>
                <p>Conoce a las personas que estan dando vida a AMAL.</p>
              </div>
            </div>
            <div className="admin-stat-grid">
              <div className="admin-stat">
                <span>Total de clientes</span>
                <strong>286</strong>
                <small className="positive">+12.8% este mes</small>
              </div>
              <div className="admin-stat">
                <span>Recompra</span>
                <strong>34%</strong>
                <small>Ultimos 90 dias</small>
              </div>
              <div className="admin-stat">
                <span>Suscritos a notas</span>
                <strong>192</strong>
                <small className="positive">+24 esta semana</small>
              </div>
            </div>
            <section className="admin-card empty-admin-card">
              <Users size={28} />
              <h3>Segmentos de clientes</h3>
              <p>
                La segmentacion avanzada estara disponible cuando conectes tu
                base de datos.
              </p>
              <button
                className="admin-secondary"
                onClick={() => announceAdmin("Proximamente")}
              >
                Configurar integracion
              </button>
            </section>
          </section>
        )}
        {activeView === "Ajustes" && (
          <section className="admin-content">
            <div className="admin-page-intro">
              <div>
                <span className="admin-eyebrow">CONFIGURACION</span>
                <h2>Ajustes de la tienda</h2>
                <p>
                  Controla la identidad, los envios y las notificaciones de
                  AMAL.
                </p>
              </div>
              <button
                className="admin-primary"
                onClick={() => announceAdmin("Ajustes guardados")}
              >
                Guardar cambios
              </button>
            </div>
            <section className="admin-card settings-card">
              <label>
                Nombre de la tienda
                <input defaultValue="AMAL Watches" />
              </label>
              <label>
                Email de contacto
                <input type="email" defaultValue="info@amalwatches.com" />
              </label>
              <label>
                Moneda
                <select defaultValue="USD">
                  <option value="USD">USD - Dolar estadounidense</option>
                  <option value="EUR">EUR - Euro</option>
                </select>
              </label>
              <label className="setting-toggle">
                <span>
                  <strong>Envio asegurado gratuito</strong>
                  <small>Mostrar esta promesa en toda la tienda</small>
                </span>
                <input type="checkbox" defaultChecked />
              </label>
              <label className="setting-toggle">
                <span>
                  <strong>Notas mensuales</strong>
                  <small>Permitir nuevas suscripciones desde el footer</small>
                </span>
                <input type="checkbox" defaultChecked />
              </label>
            </section>
          </section>
        )}
        {notice && <div className="admin-toast">{notice}</div>}
      </main>
    </div>
  );
}

function ProtectedAdmin() {
  const [allowed, setAllowed] = useState<boolean | null>(null);
  useEffect(() => {
    authApi.me().then(({ user }) => setAllowed(user.role === "admin")).catch(() => setAllowed(false));
  }, []);
  if (allowed === null) return <div className="admin-loading">Cargando panel...</div>;
  if (!allowed) {
    window.location.href = "/admin/login";
    return null;
  }
  return <AdminPanel />;
}

function AdminOrderTable({
  orders,
  editable,
  onStatusChange,
}: {
  orders: AdminOrder[];
  editable?: boolean;
  onStatusChange?: (id: string, status: AdminOrder["status"]) => void;
}) {
  return (
    <div className="admin-orders">
      <div className="admin-order-head">
        <span>Pedido</span>
        <span>Cliente</span>
        <span>Producto</span>
        <span>Total</span>
        <span>Estado</span>
        <span>Fecha</span>
      </div>
      {orders.map((order) => (
        <div className="admin-order-row" key={order.id}>
          <strong>{order.id}</strong>
          <span>{order.customer}</span>
          <span>{order.item}</span>
          <strong>{money(order.total)}</strong>
          {editable ? (
            <select
              value={order.status}
              onChange={(event) =>
                onStatusChange?.(
                  order.id,
                  event.target.value as AdminOrder["status"],
                )
              }
            >
              <option>Pago</option>
              <option>Preparando</option>
              <option>Enviado</option>
            </select>
          ) : (
            <span className={`order-status ${order.status.toLowerCase()}`}>
              {order.status}
            </span>
          )}
          <small>{order.date}</small>
        </div>
      ))}
    </div>
  );
}

function Home() {
  const [category, setCategory] = useState<Category>("All pieces");
  const [search, setSearch] = useState("");
  const [favorites, setFavorites] = useState<number[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [sort, setSort] = useState("Curated order");
  const [notice, setNotice] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  useEffect(() => {
    const handleCheckoutClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target.closest('[data-testid="button-checkout"]')) {
        event.stopPropagation();
        setCartOpen(false);
        setCheckoutOpen(true);
      }
    };
    document.addEventListener("click", handleCheckoutClick, true);
    return () =>
      document.removeEventListener("click", handleCheckoutClick, true);
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const visible = products.filter(
      (product) =>
        (category === "All pieces" || product.category === category) &&
        (!term ||
          `${product.name} ${product.category} ${product.collection}`
            .toLowerCase()
            .includes(term)),
    );
    return [...visible].sort((a, b) =>
      sort === "Price: low to high"
        ? a.price - b.price
        : sort === "Price: high to low"
          ? b.price - a.price
          : a.id - b.id,
    );
  }, [category, search, sort]);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  const announce = (text: string) => {
    setNotice(text);
    window.setTimeout(() => setNotice(""), 2400);
  };
  const toggleFavorite = (id: number) => {
    setFavorites((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  };
  const addToCart = (product: Product) => {
    setCart((current) =>
      current.some((item) => item.id === product.id)
        ? current.map((item) =>
            item.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item,
          )
        : [...current, { ...product, quantity: 1 }],
    );
    setCartOpen(true);
    announce(`${product.name} se ha añadido a tu bolsa`);
  };
  const changeQuantity = (id: number, delta: number) =>
    setCart((current) =>
      current.flatMap((item) =>
        item.id === id
          ? item.quantity + delta > 0
            ? [{ ...item, quantity: item.quantity + delta }]
            : []
          : [item],
      ),
    );

  return (
    <div className="atelier-app">
      <div className="announcement">
        <span>Envio asegurado gratuito en cada pieza AMAL</span>
        <span className="announcement-mark">
          EST. 1987&nbsp;&nbsp; / &nbsp;&nbsp;GENEVA — TOKYO
        </span>
      </div>
      <header className="site-header">
        <button
          className="mobile-toggle"
          aria-label="Abrir navegacion"
          data-testid="button-open-navigation"
          onClick={() => setMobileMenu(!mobileMenu)}
        >
          <span />
          <span />
        </button>
        <a href="#top" className="wordmark" data-testid="link-home">
          <span>A</span> AMAL
        </a>
        <nav
          className={`main-nav ${mobileMenu ? "is-open" : ""}`}
          aria-label="Main navigation"
        >
          <a
            href="#collection"
            data-testid="link-collection"
            onClick={() => setMobileMenu(false)}
          >
            La coleccion
          </a>
          <a
            href="#atelier"
            data-testid="link-atelier"
            onClick={() => setMobileMenu(false)}
          >
            Nuestro atelier
          </a>
          <a
            href="#journal"
            data-testid="link-journal"
            onClick={() => setMobileMenu(false)}
          >
            Diario
          </a>
        </nav>
        <div className="header-tools">
          <a className="account-link" href="/login">Cuenta</a>
          <label className="header-search">
            <Search size={16} strokeWidth={1.7} />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar un reloj"
              aria-label="Buscar relojes"
              data-testid="input-search"
            />
          </label>
          <button
            className="tool-button bag-button"
            aria-label="Abrir bolsa de compra"
            data-testid="button-open-cart"
            onClick={() => setCartOpen(true)}
          >
            <ShoppingBag size={18} strokeWidth={1.6} />
            <span className="bag-count">{cartCount}</span>
          </button>
        </div>
      </header>

      <main id="top">
        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow">
              <span className="eyebrow-line" /> Una coleccion seleccionada
            </div>
            <h1>
              Mide el tiempo
              <br />
              <em>beautifully.</em>
            </h1>
            <p>
              Objetos de precision serena, elegidos por las historias que
              reunen. Descubre relojes mecanicos con personalidad.
            </p>
            <a
              href="#collection"
              className="hero-link"
              data-testid="link-explore-collection"
            >
              Explorar la coleccion <ArrowUpRight size={16} />
            </a>
          </div>
          <div className="hero-object" aria-label="The Meridian watch">
            <div className="hero-halo" />
            <img src={products[0].image} alt="The Meridian automatic watch" />
            <div className="hero-caption">
              <span>01</span>
              <span>THE MERIDIAN / 38MM</span>
            </div>
          </div>
          <div className="hero-side-note">
            <span>Desliza para explorar</span>
            <span className="vertical-rule" />
          </div>
        </section>

        <section className="manifesto" id="atelier">
          <div className="manifesto-index">00 / POR QUE AMAL</div>
          <div className="manifesto-copy">
            <h2>
              Para los dias
              <br />
              <em>que merecen ser vividos.</em>
            </h2>
            <p>
              Buscamos detalles que no piden atencion: el giro de una corona, el
              peso frio del acero, una esfera que se vuelve tuya con el tiempo.
              Cada pieza se elige con paciencia.
            </p>
            <a href="#journal" data-testid="link-read-story">
              Leer nuestra historia <ArrowUpRight size={15} />
            </a>
          </div>
          <div className="manifesto-stamp">
            <Watch size={28} strokeWidth={1} />
            <span>
              AMAL
              <br />
              OBJETOS
              <br />
              CON PULSO
            </span>
          </div>
        </section>

        <section className="collection-section" id="collection">
          <div className="section-heading">
            <div>
              <div className="eyebrow">
                <span className="eyebrow-line" /> La coleccion
              </div>
              <h2>Elegida, no saturada.</h2>
            </div>
            <p className="section-intro">
              Seis referencias. Cada una con su propio ritmo.
              <br />
              Tomatelo con calma.
            </p>
          </div>
          <div className="collection-toolbar">
            <div
              className="category-tabs"
              role="tablist"
              aria-label="Categorias de relojes"
            >
              {(
                [
                  "All pieces",
                  "Dress",
                  "Field",
                  "Diver",
                  "Chronograph",
                ] as Category[]
              ).map((item) => (
                <button
                  key={item}
                  role="tab"
                  aria-selected={category === item}
                  className={category === item ? "active" : ""}
                  onClick={() => setCategory(item)}
                  data-testid={`button-category-${item.toLowerCase().replace(" ", "-")}`}
                >
                  {
                    {
                      "All pieces": "Todas las piezas",
                      Dress: "Elegante",
                      Field: "Campo",
                      Diver: "Buceo",
                      Chronograph: "Cronografo",
                    }[item]
                  }
                </button>
              ))}
            </div>
            <label className="sort-select">
              <SlidersHorizontal size={15} />
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value)}
                aria-label="Sort collection"
                data-testid="select-sort"
              >
                <option value="Curated order">Orden seleccionado</option>
                <option value="Price: low to high">
                  Precio: menor a mayor
                </option>
                <option value="Price: high to low">
                  Precio: mayor a menor
                </option>
              </select>
              <ChevronDown size={14} />
            </label>
          </div>
          {filtered.length > 0 ? (
            <div className="product-grid">
              {filtered.map((product, index) => (
                <article
                  className={`product-card product-${index + 1}`}
                  key={product.id}
                  data-testid={`card-product-${product.id}`}
                >
                  <div className={`product-image ${product.tone}`}>
                    <img
                      src={product.image}
                      alt={`${product.name}, ${product.category} watch`}
                      loading="lazy"
                    />
                    <button
                      className={`favorite-button ${favorites.includes(product.id) ? "is-favorite" : ""}`}
                      aria-label={
                        favorites.includes(product.id)
                          ? `Remove ${product.name} from favorites`
                          : `Add ${product.name} to favorites`
                      }
                      onClick={() => toggleFavorite(product.id)}
                      data-testid={`button-favorite-${product.id}`}
                    >
                      <Heart
                        size={18}
                        fill={
                          favorites.includes(product.id)
                            ? "currentColor"
                            : "none"
                        }
                      />
                    </button>
                    <button
                      className="quick-add"
                      onClick={() => addToCart(product)}
                      data-testid={`button-add-product-${product.id}`}
                    >
                      Add to bag <Plus size={15} />
                    </button>
                  </div>
                  <div className="product-meta">
                    <div>
                      <p className="product-collection">{product.collection}</p>
                      <h3>{product.name}</h3>
                    </div>
                    <strong>{money(product.price)}</strong>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <Sparkles size={22} />
              <h3>No encontramos resultados.</h3>
              <p>Prueba otra busqueda o vuelve a toda la coleccion.</p>
              <button
                onClick={() => {
                  setSearch("");
                  setCategory("All pieces");
                }}
                data-testid="button-clear-filters"
              >
                Borrar filtros
              </button>
            </div>
          )}
        </section>

        <section className="craft-section" id="journal">
          <div className="craft-image">
            <img
              src={products[2].image}
              alt="A watch resting on a textured surface"
              loading="lazy"
            />
            <span className="image-label">THE AMAL STANDARD / 02</span>
          </div>
          <div className="craft-copy">
            <div className="eyebrow">
              <span className="eyebrow-line" /> El estandar AMAL
            </div>
            <h2>
              Hecho para
              <br />
              <em>vivirlo.</em>
            </h2>
            <p>
              Fabricantes en pequenos lotes. Materiales honestos. Movimientos
              que puedes sentir. Un reloj debe ganar historia, no desgastarse.
            </p>
            <div className="standard-list">
              <div>
                <span>01</span>
                <b>Movimientos reparables</b>
                <small>Hechos para durar toda una vida</small>
              </div>
              <div>
                <span>02</span>
                <b>Materiales trazables</b>
                <small>Nada se oculta tras el brillo</small>
              </div>
              <div>
                <span>03</span>
                <b>Garantia de cinco anos</b>
                <small>Respondemos por cada pieza elegida</small>
              </div>
            </div>
          </div>
        </section>

        <section className="closing-note">
          <div className="closing-quote">
            “The pleasure is
            <br />
            <em>en la eleccion.</em>”
          </div>
          <div className="closing-details">
            <span>AMAL NOTES / 01</span>
            <p>
              Una breve nota sobre relojes, artesanos y los rituales del tiempo.
              Sin ruido, una vez al mes.
            </p>
            <button
              onClick={() => announce("Ya estas en la lista")}
              data-testid="button-join-notes"
            >
              Suscribirme <ArrowUpRight size={15} />
            </button>
          </div>
        </section>
      </main>

      <footer>
        <a href="#top" className="wordmark" data-testid="link-footer-home">
          <span>A</span> AMAL
        </a>
        <p>Objetos para medir el tiempo.</p>
        <div className="footer-links">
          <a href="#collection" data-testid="link-footer-collection">
            Coleccion
          </a>
          <a href="#atelier" data-testid="link-footer-atelier">
            Atelier
          </a>
          <button
            onClick={() =>
              announce("Atencion al cliente: info@amalwatches.com")
            }
            data-testid="button-contact"
          >
            Contacto
          </button>
        </div>
        <small>© 2026 AMAL Watches. All considered.</small>
      </footer>

      {checkoutOpen && (
        <Checkout
          items={cart}
          subtotal={subtotal}
          onBack={() => {
            setCheckoutOpen(false);
            setCartOpen(true);
          }}
          onComplete={() => {
            setCheckoutOpen(false);
            setCart([]);
          }}
        />
      )}
      {notice && (
        <div className="notice" role="status" data-testid="status-notice">
          {notice}
        </div>
      )}
      {cartOpen && (
        <div className="drawer-backdrop" onClick={() => setCartOpen(false)}>
          <aside
            className="cart-drawer"
            onClick={(event) => event.stopPropagation()}
            aria-label="Bolsa de compra"
          >
            <div className="drawer-header">
              <div>
                <span className="drawer-kicker">TU SELECCION</span>
                <h2>
                  Bolsa de compra <small>{cartCount}</small>
                </h2>
              </div>
              <button
                onClick={() => setCartOpen(false)}
                aria-label="Close shopping bag"
                data-testid="button-close-cart"
              >
                <X size={20} />
              </button>
            </div>
            {cart.length > 0 ? (
              <>
                <div className="cart-items">
                  {cart.map((item) => (
                    <div
                      className="cart-item"
                      key={item.id}
                      data-testid={`cart-item-${item.id}`}
                    >
                      <img src={item.image} alt="" />
                      <div className="cart-item-info">
                        <span>{item.collection}</span>
                        <h3>{item.name}</h3>
                        <strong>{money(item.price * item.quantity)}</strong>
                        <div className="quantity">
                          <button
                            onClick={() => changeQuantity(item.id, -1)}
                            aria-label={`Decrease ${item.name} quantity`}
                            data-testid={`button-decrease-${item.id}`}
                          >
                            <Minus size={13} />
                          </button>
                          <span data-testid={`text-quantity-${item.id}`}>
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => changeQuantity(item.id, 1)}
                            aria-label={`Increase ${item.name} quantity`}
                            data-testid={`button-increase-${item.id}`}
                          >
                            <Plus size={13} />
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
                  <p>El envio y los impuestos se calculan al finalizar.</p>
                  <button
                    className="checkout-button"
                    onClick={() =>
                      announce("La compra esta lista para continuar")
                    }
                    data-testid="button-checkout"
                  >
                    Continuar al pago <ArrowUpRight size={16} />
                  </button>
                  <button
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
                  <ShoppingBag size={25} strokeWidth={1.2} />
                </div>
                <h3>Tu bolsa te espera.</h3>
                <p>Empieza con una pieza que te siga llamando.</p>
                <button
                  className="checkout-button"
                  onClick={() => setCartOpen(false)}
                  data-testid="button-discover-pieces"
                >
                  Descubrir la coleccion <ArrowUpRight size={16} />
                </button>
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}

function Router() {
  return (
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/admin" component={ProtectedAdmin} />
        <Route path="/admin/login" component={AdminLoginPage} />
        <Route path="/login" component={() => <LoginPage />} />
        <Route path="/register" component={() => <RegisterPage />} />
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
