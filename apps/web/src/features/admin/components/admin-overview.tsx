import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, TrendingUp, Package, Watch, AlertTriangle, Users } from "lucide-react";
import { money } from "@workspace/shared";

interface AdminOverviewProps {
  onNavigateTab: (tab: "Pedidos" | "Catálogo" | "Clientes") => void;
}

export function AdminOverview({ onNavigateTab }: AdminOverviewProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: async () => {
      const res = await fetch("/api/admin/stats");
      if (!res.ok) throw new Error("Error al cargar estadísticas");
      return res.json();
    },
    staleTime: 30 * 1000,
  });

  const stats = data?.stats;

  const todayFormatted = new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <section className="admin-content">
      <div className="admin-page-intro">
        <div>
          <span className="admin-eyebrow">
            {todayFormatted.toUpperCase()}
          </span>
          <h2>Resumen del Atelier</h2>
          <p>Métricas de negocio y actividad consolidada en tiempo real.</p>
        </div>
      </div>

      <div className="admin-metrics-grid">
        <div className="admin-metric-card">
          <div className="metric-header">
            <span>Facturación neta</span>
            <TrendingUp size={16} />
          </div>
          <strong>{stats ? money(stats.revenue) : "—"}</strong>
          <small>
            {stats && stats.revenueChangePercent !== undefined ? (
              <span style={{ color: stats.revenueChangePercent >= 0 ? "#10b981" : "#ef4444" }}>
                {stats.revenueChangePercent >= 0 ? `+${stats.revenueChangePercent}%` : `${stats.revenueChangePercent}%`} vs mes anterior
              </span>
            ) : (
              "Calculado sobre órdenes no canceladas"
            )}
          </small>
        </div>

        <div className="admin-metric-card">
          <div className="metric-header">
            <span>Pedidos totales</span>
            <Package size={16} />
          </div>
          <strong>{stats ? stats.ordersCount : "—"}</strong>
          <small>
            {stats && stats.ordersChangePercent !== undefined ? (
              <span style={{ color: stats.ordersChangePercent >= 0 ? "#10b981" : "#ef4444" }}>
                {stats.ordersChangePercent >= 0 ? `+${stats.ordersChangePercent}%` : `${stats.ordersChangePercent}%`} vs mes anterior
              </span>
            ) : (
              "Total de órdenes registradas"
            )}
          </small>
        </div>

        <div className="admin-metric-card">
          <div className="metric-header">
            <span>Ticket medio (AOV)</span>
            <Watch size={16} />
          </div>
          <strong>{stats ? money(stats.avgOrderValue) : "—"}</strong>
          <small>Importe medio por pedido recibido</small>
        </div>

        <div
          className="admin-metric-card"
          onClick={() => onNavigateTab("Catálogo")}
          style={{ cursor: "pointer" }}
          title="Ver inventario con stock bajo"
        >
          <div className="metric-header">
            <span>Stock bajo (≤3)</span>
            <AlertTriangle size={16} color={stats?.lowStockCount > 0 ? "var(--oxblood, #e11d48)" : "currentColor"} />
          </div>
          <strong style={{ color: stats?.lowStockCount > 0 ? "var(--oxblood, #e11d48)" : "inherit" }}>
            {stats ? stats.lowStockCount : "—"}
          </strong>
          <small>Modelos que requieren reposición inmediata</small>
        </div>
      </div>

      <div className="admin-overview-sections" style={{ marginTop: "2rem", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "1.5rem" }}>
        <section className="admin-card">
          <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h3 style={{ margin: 0, fontSize: "1.1rem" }}>Últimos pedidos recibidos</h3>
            <button
              type="button"
              className="admin-secondary"
              onClick={() => onNavigateTab("Pedidos")}
            >
              <span>Ver todos</span>
              <ArrowUpRight size={14} />
            </button>
          </div>

          <div className="admin-recent-orders-list">
            {isLoading ? (
              <p style={{ color: "var(--color-muted, #888)", padding: "1rem" }}>Cargando actividad...</p>
            ) : stats?.recentOrders?.length ? (
              stats.recentOrders.map((o: any) => (
                <div
                  key={o.id}
                  className="recent-order-row"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "0.75rem 0",
                    borderBottom: "1px solid var(--color-border, rgba(255,255,255,0.06))",
                  }}
                >
                  <div>
                    <strong style={{ fontSize: "0.95rem" }}>{o.id}</strong>
                    <div style={{ color: "var(--color-muted, #888)", fontSize: "0.85rem" }}>{o.customerName}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 600 }}>{money(o.total)}</div>
                    <span
                      style={{
                        display: "inline-block",
                        fontSize: "0.75rem",
                        padding: "0.15rem 0.4rem",
                        borderRadius: "3px",
                        background: o.status === "paid" ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.08)",
                        color: o.status === "paid" ? "#10b981" : "inherit",
                      }}
                    >
                      {o.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="empty-notice" style={{ color: "var(--color-muted, #888)", padding: "1rem" }}>
                No hay pedidos recientes registrados en la base de datos.
              </p>
            )}
          </div>
        </section>

        <section className="admin-card">
          <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h3 style={{ margin: 0, fontSize: "1.1rem" }}>Comunidad y Clientes</h3>
            <button
              type="button"
              className="admin-secondary"
              onClick={() => onNavigateTab("Clientes")}
            >
              <span>Ver clientes</span>
              <ArrowUpRight size={14} />
            </button>
          </div>

          <div style={{ display: "grid", gap: "1rem", padding: "0.5rem 0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "8px", background: "rgba(255,255,255,0.05)", display: "grid", placeItems: "center" }}>
                <Users size={20} />
              </div>
              <div>
                <strong style={{ fontSize: "1.2rem", display: "block" }}>
                  {stats ? stats.customersCount : "—"}
                </strong>
                <span style={{ fontSize: "0.85rem", color: "var(--color-muted, #888)" }}>
                  Coleccionistas con cuenta registrada en AMAL
                </span>
              </div>
            </div>

            <p style={{ fontSize: "0.9rem", color: "var(--color-muted, #aaa)", lineHeight: 1.5, margin: "0.5rem 0 0" }}>
              Supervisa el historial de compra y el valor acumulado (LTV) de cada cliente para ofrecer atención personalizada desde el Atelier.
            </p>
          </div>
        </section>
      </div>
    </section>
  );
}
