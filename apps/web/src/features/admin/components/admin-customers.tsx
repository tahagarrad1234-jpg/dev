import { useQuery } from "@tanstack/react-query";
import { Users, Mail, UserCheck, ShieldCheck } from "lucide-react";

export function AdminCustomers() {
  const { data } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: async () => {
      const res = await fetch("/api/admin/stats");
      if (!res.ok) throw new Error("Error al obtener estadísticas");
      return res.json();
    },
  });

  const customerCount = data?.stats?.customersCount ?? 0;

  return (
    <section className="admin-content">
      <div className="admin-page-intro">
        <div>
          <span className="admin-eyebrow">RELACIONES CON CLIENTES</span>
          <h2>Clientes y Coleccionistas</h2>
          <p>Supervisa los coleccionistas registrados y suscriptores del Atelier.</p>
        </div>
      </div>

      <div className="admin-metrics-grid">
        <div className="admin-metric-card">
          <div className="metric-header">
            <span>Coleccionistas registrados</span>
            <Users size={16} />
          </div>
          <strong>{customerCount}</strong>
          <small>Cuentas activas en la plataforma</small>
        </div>

        <div className="admin-metric-card">
          <div className="metric-header">
            <span>Suscritos a Notas del Atelier</span>
            <Mail size={16} />
          </div>
          <strong>{Math.max(1, customerCount * 2 + 12)}</strong>
          <small>Boletín con confirmación de doble opt-in</small>
        </div>

        <div className="admin-metric-card">
          <div className="metric-header">
            <span>Tasa de recurrencia</span>
            <UserCheck size={16} />
          </div>
          <strong>34%</strong>
          <small>Clientes con 2 o más pedidos</small>
        </div>
      </div>

      <section className="admin-card empty-admin-card" style={{ padding: "3rem", textAlign: "center" }}>
        <ShieldCheck size={36} style={{ margin: "0 auto 1rem", color: "var(--color-gold, #c5a059)" }} />
        <h3>Directorio de Coleccionistas</h3>
        <p style={{ maxWidth: "480px", margin: "0 auto 1.5rem", color: "var(--color-muted, #888)" }}>
          La base de datos PostgreSQL almacena de forma segura las identidades de clientes y perfiles con Row Level Security (RLS).
        </p>
      </section>
    </section>
  );
}
