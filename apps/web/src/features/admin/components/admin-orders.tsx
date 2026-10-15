import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Download, Filter, Printer, Truck, ChevronLeft, ChevronRight, X, Check } from "lucide-react";
import { money } from "@workspace/shared";

const ORDER_STATUS_OPTIONS = [
  { value: "pending", label: "Pendiente" },
  { value: "paid", label: "Pago confirmado" },
  { value: "preparing", label: "En preparación atelier" },
  { value: "shipped", label: "Enviado / En tránsito" },
  { value: "delivered", label: "Entregado en mano" },
  { value: "cancelled", label: "Cancelado" },
  { value: "refunded", label: "Reembolsado" },
];

export function AdminOrders() {
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [page, setPage] = useState(1);
  const [selectedOrderForSlip, setSelectedOrderForSlip] = useState<any | null>(null);
  const [shippingModalOrder, setShippingModalOrder] = useState<any | null>(null);
  const [carrier, setCarrier] = useState("DHL Express Blindado");
  const [trackingNumber, setTrackingNumber] = useState("");

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "orders", { search, status: selectedStatus, page }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (selectedStatus) params.set("status", selectedStatus);
      params.set("page", String(page));
      params.set("pageSize", "10");

      const res = await fetch(`/api/admin/orders?${params.toString()}`);
      if (!res.ok) throw new Error("Error al cargar pedidos");
      return res.json();
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({
      id,
      status,
      carrier,
      trackingNumber,
    }: {
      id: string;
      status: string;
      carrier?: string;
      trackingNumber?: string;
    }) => {
      const res = await fetch(`/api/admin/orders/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, carrier, trackingNumber }),
      });
      if (!res.ok) throw new Error("Error al actualizar estado");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
      setShippingModalOrder(null);
    },
  });

  const orders = data?.items || [];
  const totalPages = data?.totalPages || 1;

  const handleStatusChange = (order: any, newStatus: string) => {
    if (newStatus === "shipped") {
      setCarrier("DHL Express Blindado");
      setTrackingNumber(`AMAL-${Date.now().toString(36).toUpperCase()}`);
      setShippingModalOrder(order);
    } else {
      updateStatusMutation.mutate({ id: order.id, status: newStatus });
    }
  };

  const confirmShipping = () => {
    if (!shippingModalOrder) return;
    updateStatusMutation.mutate({
      id: shippingModalOrder.id,
      status: "shipped",
      carrier: carrier.trim() || "DHL Express Blindado",
      trackingNumber: trackingNumber.trim() || `AMAL-${Date.now().toString(36).toUpperCase()}`,
    });
  };

  const handleExportCSV = () => {
    if (orders.length === 0) return;
    const headers = ["ID", "Cliente", "Email", "Total", "Estado", "Fecha"];
    // Prevent CSV formula injection by prepending quote if starts with =,+,-,@
    const rows = orders.map((o: any) => [
      `"${String(o.id).replace(/^[=+\-@]/, "'")}"`,
      `"${String(o.customerName || "").replace(/"/g, '""').replace(/^[=+\-@]/, "'")}"`,
      `"${String(o.email || "").replace(/"/g, '""')}"`,
      `"${o.total}"`,
      `"${o.status}"`,
      `"${o.createdAt}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((r: any) => r.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `amal_pedidos_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <section className="admin-content">
      <div className="admin-page-intro">
        <div>
          <span className="admin-eyebrow">OPERACIONES</span>
          <h2>Todos los pedidos</h2>
          <p>Supervisa pagos, albaranes de expedición y estados de entrega.</p>
        </div>

        <button
          type="button"
          className="admin-secondary"
          onClick={handleExportCSV}
          disabled={orders.length === 0}
        >
          <Download size={14} />
          <span>Exportar CSV</span>
        </button>
      </div>

      <div className="admin-toolbar">
        <div className="admin-search">
          <Search size={16} />
          <input
            placeholder="Buscar por ID, cliente o correo..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <div className="admin-filter">
          <Filter size={14} />
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Todos los estados</option>
            {ORDER_STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="admin-card">
        {isLoading ? (
          <p className="admin-loading-text">Cargando pedidos...</p>
        ) : orders.length === 0 ? (
          <p className="empty-notice">No se encontraron pedidos.</p>
        ) : (
          <>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID Pedido</th>
                  <th>Cliente</th>
                  <th>Total</th>
                  <th>Estado</th>
                  <th>Albarán</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order: any) => (
                  <tr key={order.id}>
                    <td>
                      <strong>{order.id}</strong>
                    </td>
                    <td>
                      <div>
                        <span>{order.customerName}</span>
                        <small style={{ display: "block", color: "var(--ink-soft)" }}>
                          {order.email}
                        </small>
                      </div>
                    </td>
                    <td>
                      <strong>{money(order.total)}</strong>
                    </td>
                    <td>
                      <span className={`order-status ${order.status}`}>
                        {order.status}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => setSelectedOrderForSlip(order)}
                        style={{
                          background: "none",
                          border: "1px solid #dcd8cf",
                          borderRadius: "4px",
                          padding: "4px 8px",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          fontSize: "12px",
                          cursor: "pointer",
                          color: "#121212",
                        }}
                        title="Ver e imprimir albarán de expedición"
                      >
                        <Printer size={13} />
                        <span>Albarán</span>
                      </button>
                    </td>
                    <td>
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order, e.target.value)}
                        className="admin-status-select"
                        disabled={updateStatusMutation.isPending}
                      >
                        {ORDER_STATUS_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "16px 20px",
                  borderTop: "1px solid #eae7e1",
                  fontSize: "13px",
                }}
              >
                <span>
                  Página <strong>{page}</strong> de <strong>{totalPages}</strong> ({data?.total || orders.length} pedidos en total)
                </span>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      padding: "6px 12px",
                      border: "1px solid #dcd8cf",
                      background: page <= 1 ? "#f5f5f5" : "#fff",
                      cursor: page <= 1 ? "not-allowed" : "pointer",
                      borderRadius: "4px",
                    }}
                  >
                    <ChevronLeft size={14} /> Anterior
                  </button>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      padding: "6px 12px",
                      border: "1px solid #dcd8cf",
                      background: page >= totalPages ? "#f5f5f5" : "#fff",
                      cursor: page >= totalPages ? "not-allowed" : "pointer",
                      borderRadius: "4px",
                    }}
                  >
                    Siguiente <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Shipping Dispatch Modal (Required tracking when marking as shipped) */}
      {shippingModalOrder && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(2px)",
            display: "grid",
            placeItems: "center",
            zIndex: 1000,
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: "8px",
              padding: "28px",
              maxWidth: "500px",
              width: "100%",
              boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Truck size={20} color="#8b263e" />
                <h3 style={{ margin: 0, fontSize: "17px", fontFamily: "var(--font-serif, serif)" }}>
                  Expedición y Seguimiento
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShippingModalOrder(null)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#666" }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: "13px", color: "#666", lineHeight: "1.5", margin: "0 0 16px" }}>
              Al marcar el pedido <strong>#{shippingModalOrder.id}</strong> como enviado, se enviará automáticamente un correo certificado al cliente <strong>{shippingModalOrder.email}</strong> con los detalles de seguimiento.
            </p>

            <div style={{ display: "grid", gap: "12px", marginBottom: "20px" }}>
              <label style={{ fontSize: "13px", display: "grid", gap: "4px" }}>
                <span>Empresa de Transporte Blindado</span>
                <input
                  type="text"
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value)}
                  style={{ padding: "8px 12px", border: "1px solid #ccc", borderRadius: "4px" }}
                  placeholder="Ej. DHL Express Blindado"
                />
              </label>

              <label style={{ fontSize: "13px", display: "grid", gap: "4px" }}>
                <span>Número de Seguimiento (Tracking ID) *</span>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  style={{ padding: "8px 12px", border: "1px solid #ccc", borderRadius: "4px", fontFamily: "monospace" }}
                  placeholder="Ej. AMAL-ES-984712"
                  required
                />
              </label>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setShippingModalOrder(null)}
                style={{ padding: "8px 16px", background: "#eee", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "13px" }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmShipping}
                disabled={updateStatusMutation.isPending || !trackingNumber.trim()}
                style={{
                  padding: "8px 18px",
                  background: "#121212",
                  color: "#fff",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "13px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <Check size={14} />
                <span>{updateStatusMutation.isPending ? "Notificando..." : "Confirmar Envío y Notificar"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Packing Slip Modal */}
      {selectedOrderForSlip && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(2px)",
            display: "grid",
            placeItems: "center",
            zIndex: 1000,
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: "8px",
              padding: "36px",
              maxWidth: "650px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "2px solid #121212", paddingBottom: "16px", marginBottom: "24px" }}>
              <div>
                <h1 style={{ fontFamily: "Cinzel, serif", fontSize: "22px", margin: 0, letterSpacing: "0.1em" }}>AMAL</h1>
                <p style={{ margin: "4px 0 0", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.15em", color: "#8b263e" }}>
                  Albarán de Expedición & Certificado de Autenticidad
                </p>
              </div>
              <div style={{ textAlign: "right" }}>
                <strong style={{ fontSize: "16px", display: "block" }}>#{selectedOrderForSlip.id}</strong>
                <span style={{ fontSize: "12px", color: "#666" }}>
                  {new Date(selectedOrderForSlip.createdAt).toLocaleDateString("es-ES", { dateStyle: "long" })}
                </span>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "24px", fontSize: "13px" }}>
              <div>
                <strong style={{ color: "#888", textTransform: "uppercase", fontSize: "11px" }}>Destinatario</strong>
                <p style={{ margin: "6px 0 0", lineHeight: "1.5" }}>
                  <strong>{selectedOrderForSlip.customerName}</strong><br />
                  {selectedOrderForSlip.address}<br />
                  {selectedOrderForSlip.postalCode} {selectedOrderForSlip.city}, {selectedOrderForSlip.country}
                </p>
              </div>

              <div>
                <strong style={{ color: "#888", textTransform: "uppercase", fontSize: "11px" }}>Detalles del Encargo</strong>
                <p style={{ margin: "6px 0 0", lineHeight: "1.5" }}>
                  Email: {selectedOrderForSlip.email}<br />
                  Teléfono: {selectedOrderForSlip.phone || "No especificado"}<br />
                  Método de Pago: Stripe Secured (Liquidado)
                </p>
              </div>
            </div>

            <div style={{ borderTop: "1px solid #eee", borderBottom: "1px solid #eee", padding: "16px 0", marginBottom: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", fontWeight: 600, paddingBottom: "8px" }}>
                <span>Pieza Horológica</span>
                <span>Importe Total</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#555" }}>
                <span>Guardatiempo de Alta Relojería AMAL — Serie Numerada</span>
                <strong>{money(selectedOrderForSlip.total)}</strong>
              </div>
            </div>

            <div style={{ background: "#faf9f6", padding: "16px", borderRadius: "6px", fontSize: "12px", color: "#666", lineHeight: "1.6", marginBottom: "24px" }}>
              <strong>Garantía Internacional de 5 años:</strong> Esta pieza ha sido inspeccionada, ajustada a 5 posiciones y certificada por el Maestro Relojero antes de su expedición en embalaje hermético de seguridad.
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setSelectedOrderForSlip(null)}
                style={{ padding: "8px 16px", background: "#f0f0f0", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "13px" }}
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                style={{
                  padding: "8px 18px",
                  background: "#121212",
                  color: "#fff",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "13px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <Printer size={14} /> Imprimir Albarán
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
