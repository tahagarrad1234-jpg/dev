import { useEffect, useState } from "react";
import { LayoutDashboard, Package, Watch, Users, Settings, LogOut, ArrowUpRight, PlusCircle, Search, Pencil, Trash2 } from "lucide-react";
import { authApi } from "@/lib/auth-api";
import { Product, money, products as initialProducts } from "@/lib/data";

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

function AdminPanel() {
  const [activeView, setActiveView] = useState("Resumen");
  const [catalog, setCatalog] = useState<Product[]>(initialProducts);
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

export default function ProtectedAdmin() {
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
